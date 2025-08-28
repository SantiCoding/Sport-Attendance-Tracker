import { supabase } from '@/supabase'
import { loadLocalStore, saveLocalStore, clearOutboxItems, LocalStore, OutboxItem } from './localStore'

let syncing = false
let retryTimeout: NodeJS.Timeout | null = null
let retryCount = 0
const MAX_RETRIES = 5
const BASE_RETRY_DELAY = 1000 // 1 second

export async function flushOutbox(userId?: string): Promise<void> {
  if (syncing) return
  
  syncing = true
  const store = loadLocalStore(userId)
  
  if (store.outbox.length === 0) {
    syncing = false
    return
  }
  
  // Process in batches of 50
  const batch = store.outbox.slice(0, 50)
  
  try {
    // Group by table for batch processing
    const tableGroups = new Map<string, OutboxItem[]>()
    for (const item of batch) {
      if (!tableGroups.has(item.table)) {
        tableGroups.set(item.table, [])
      }
      tableGroups.get(item.table)!.push(item)
    }
    
    // Process each table batch
    for (const [table, items] of tableGroups) {
      const payloads = items.map(item => item.payload)
      
      if (items.some(item => item.op === 'delete')) {
        // Handle deletes separately (tombstones)
        const deletes = items.filter(item => item.op === 'delete').map(item => item.payload)
        const upserts = items.filter(item => item.op === 'upsert').map(item => item.payload)
        
        if (deletes.length > 0) {
          const { error: deleteError } = await supabase
            .from(table)
            .upsert(deletes, { onConflict: 'id' })
          if (deleteError) throw deleteError
        }
        
        if (upserts.length > 0) {
          const { error: upsertError } = await supabase
            .from(table)
            .upsert(upserts, { onConflict: 'id' })
          if (upsertError) throw upsertError
        }
      } else {
        // All upserts
        const { error } = await supabase
          .from(table)
          .upsert(payloads, { onConflict: 'id' })
        if (error) throw error
      }
    }
    
    // Success - remove processed items from outbox
    clearOutboxItems(batch, userId)
    
    // Update last sync time
    store.lastSyncAt = new Date().toISOString()
    saveLocalStore(store, userId)
    
    // Reset retry count on success
    retryCount = 0
    
    console.log(`✅ Synced ${batch.length} items to cloud`)
    
  } catch (error) {
    console.error('❌ Sync failed:', error)
    
    // Schedule retry with exponential backoff
    if (retryCount < MAX_RETRIES) {
      const delay = BASE_RETRY_DELAY * Math.pow(2, retryCount)
      retryCount++
      
      console.log(`🔄 Scheduling retry ${retryCount}/${MAX_RETRIES} in ${delay}ms`)
      
      retryTimeout = setTimeout(() => {
        flushOutbox(userId)
      }, delay)
    } else {
      console.error('❌ Max retries reached, giving up on sync')
      retryCount = 0
    }
  } finally {
    syncing = false
  }
}

export function scheduleSync(userId?: string): void {
  // Clear any existing timeout
  if (retryTimeout) {
    clearTimeout(retryTimeout)
    retryTimeout = null
  }
  
  // Schedule immediate sync
  setTimeout(() => {
    flushOutbox(userId)
  }, 100)
}

export function cancelPendingSync(): void {
  if (retryTimeout) {
    clearTimeout(retryTimeout)
    retryTimeout = null
  }
  retryCount = 0
}

export function isSyncing(): boolean {
  return syncing
}

// Load data from cloud and merge with local cache
export async function loadFromCloud(userId: string): Promise<LocalStore> {
  const localStore = loadLocalStore(userId)
  
  try {
    // Load all data from cloud in parallel
    const [
      { data: students, error: studentsError },
      { data: groups, error: groupsError },
      { data: attendanceRecords, error: attendanceError },
      { data: makeupSessions, error: makeupError },
      { data: completedMakeups, error: completedError },
      { data: archivedTerms, error: archivedError }
    ] = await Promise.all([
      supabase.from('students').select('*').eq('user_id', userId),
      supabase.from('groups').select('*').eq('user_id', userId),
      supabase.from('attendance_records').select('*').eq('user_id', userId),
      supabase.from('makeup_sessions').select('*').eq('user_id', userId),
      supabase.from('completed_makeup_sessions').select('*').eq('user_id', userId),
      supabase.from('archived_terms').select('*').eq('user_id', userId)
    ])
    
    if (studentsError) throw studentsError
    if (groupsError) throw groupsError
    if (attendanceError) throw attendanceError
    if (makeupError) throw makeupError
    if (completedError) throw completedError
    if (archivedError) throw archivedError
    
    // Merge cloud data with local cache
    const mergedStore: LocalStore = {
      ...localStore,
      entities: {
        students: mergeEntities(localStore.entities.students, students || []),
        groups: mergeEntities(localStore.entities.groups, groups || []),
        attendance_records: mergeEntities(localStore.entities.attendance_records, attendanceRecords || []),
        makeup_sessions: mergeEntities(localStore.entities.makeup_sessions, makeupSessions || []),
        completed_makeup_sessions: mergeEntities(localStore.entities.completed_makeup_sessions, completedMakeups || []),
        archived_terms: mergeEntities(localStore.entities.archived_terms, archivedTerms || []),
      },
      lastSyncAt: new Date().toISOString(),
    }
    
    // Save merged data
    saveLocalStore(mergedStore, userId)
    
    console.log('✅ Loaded and merged cloud data')
    return mergedStore
    
  } catch (error) {
    console.error('❌ Error loading from cloud:', error)
    return localStore // Return local cache if cloud load fails
  }
}

// Merge local and server entities, resolving conflicts
function mergeEntities(local: any[], server: any[]): any[] {
  const merged = new Map<string, any>()
  
  // Add all local entities first
  for (const entity of local) {
    merged.set(entity.id, entity)
  }
  
  // Merge server entities
  for (const serverEntity of server) {
    const localEntity = merged.get(serverEntity.id)
    
    if (!localEntity) {
      // Server entity doesn't exist locally - add it
      merged.set(serverEntity.id, serverEntity)
    } else {
      // Conflict - resolve based on updated_at
      const localTime = new Date(localEntity.updated_at).getTime()
      const serverTime = new Date(serverEntity.updated_at).getTime()
      
      if (serverTime > localTime) {
        // Server is newer - use server data but preserve local metadata
        const mergedEntity = {
          ...serverEntity,
          metadata: {
            ...serverEntity.metadata,
            ...localEntity.metadata,
          }
        }
        merged.set(serverEntity.id, mergedEntity)
      }
      // If local is newer, keep local (it will be synced via outbox)
    }
  }
  
  return Array.from(merged.values()).filter(entity => !entity.deleted)
}
