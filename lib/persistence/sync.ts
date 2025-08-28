import { supabase } from '../../supabase'
import { 
  LocalStore, 
  LocalEntity, 
  loadLocalStore, 
  saveLocalStore,
  addSyncLog,
  getLeaderTabId,
  setLeaderTabId,
  clearLeaderTabId,
  generateClientId
} from './localStore'
import { flushOutbox, getOutboxStats } from './outbox'

let syncWorker: NodeJS.Timeout | null = null
let isLeader = false
let tabId = generateClientId()

// Initialize leader election
export function initializeSync(userId: string): void {
  // Generate unique tab ID
  tabId = generateClientId()
  
  // Try to become leader
  const currentLeader = getLeaderTabId()
  if (!currentLeader) {
    setLeaderTabId(tabId)
    isLeader = true
    addSyncLog({
      type: 'info',
      message: 'Became sync leader',
      details: { tabId }
    }, userId)
  } else if (currentLeader === tabId) {
    isLeader = true
  }
  
  // Start background sync worker
  startSyncWorker(userId)
  
  // Listen for storage events (other tabs)
  window.addEventListener('storage', (event) => {
    if (event.key === 'app:leader:v2') {
      const newLeader = event.newValue
      if (newLeader === tabId) {
        isLeader = true
        addSyncLog({
          type: 'info',
          message: 'Became sync leader via storage event',
          details: { tabId }
        }, userId)
      } else {
        isLeader = false
      }
    }
  })
  
  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    if (isLeader) {
      clearLeaderTabId()
    }
    stopSyncWorker()
  })
}

export function stopSyncWorker(): void {
  if (syncWorker) {
    clearInterval(syncWorker)
    syncWorker = null
  }
  isLeader = false
}

function startSyncWorker(userId: string): void {
  // Flush immediately
  flushOutboxIfLeader(userId)
  
  // Then set up periodic flushing
  syncWorker = setInterval(() => {
    flushOutboxIfLeader(userId)
  }, 5000) // Every 5 seconds
}

async function flushOutboxIfLeader(userId: string): Promise<void> {
  if (!isLeader) return
  
  try {
    const stats = getOutboxStats(userId)
    if (stats.pending === 0) return
    
    addSyncLog({
      type: 'info',
      message: 'Starting outbox flush',
      details: { pending: stats.pending, inflight: stats.inflight }
    }, userId)
    
    const result = await flushOutbox(userId)
    
    addSyncLog({
      type: 'info',
      message: 'Outbox flush completed',
      details: { 
        success: result.success.length, 
        failed: result.failed.length 
      }
    }, userId)
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    addSyncLog({
      type: 'error',
      message: 'Outbox flush failed',
      details: { error: errorMessage }
    }, userId)
  }
}

// Load data from cloud and merge with local cache
export async function loadFromCloud(userId: string): Promise<LocalStore> {
  const localStore = loadLocalStore(userId)
  
  addSyncLog({
    type: 'info',
    message: 'Starting cloud data load',
  }, userId)
  
  try {
    // Load all data from cloud in parallel
    const [
      { data: students, error: studentsError },
      { data: groups, error: groupsError },
      { data: attendanceRecords, error: attendanceError },
      { data: completedMakeups, error: completedError },
      { data: archivedTerms, error: archivedError }
    ] = await Promise.all([
      supabase.from('students').select('*').eq('user_id', userId).eq('deleted', false),
      supabase.from('groups').select('*').eq('user_id', userId).eq('deleted', false),
      supabase.from('attendance_records').select('*').eq('user_id', userId).eq('deleted', false),
      supabase.from('completed_makeup_sessions').select('*').eq('user_id', userId).eq('deleted', false),
      supabase.from('archived_terms').select('*').eq('user_id', userId).eq('deleted', false)
    ])
    
    if (studentsError) throw studentsError
    if (groupsError) throw groupsError
    if (attendanceError) throw attendanceError
    if (completedError) throw completedError
    if (archivedError) throw archivedError
    
    const cloudStore: LocalStore = {
      entities: {
        students: students || [],
        groups: groups || [],
        attendance_records: attendanceRecords || [],
        completed_makeup_sessions: completedMakeups || [],
        archived_terms: archivedTerms || [],
      },
      outbox: [],
      lastSyncAt: null,
      version: 1,
      syncLog: [],
    }
    
    // Merge cloud data with local cache using merge rules
    const mergedStore = mergeStores(localStore, cloudStore)
    mergedStore.lastSyncAt = new Date().toISOString()
    
    // Save merged data
    saveLocalStore(mergedStore, userId)
    
    addSyncLog({
      type: 'info',
      message: 'Cloud data loaded and merged successfully',
      details: { 
        localEntities: Object.values(localStore.entities).flat().length,
        cloudEntities: Object.values(cloudStore.entities).flat().length,
        mergedEntities: Object.values(mergedStore.entities).flat().length
      }
    }, userId)
    
    return mergedStore
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    addSyncLog({
      type: 'error',
      message: 'Cloud data load failed',
      details: { error: errorMessage }
    }, userId)
    
    // Return local cache if cloud load fails
    return localStore
  }
}

// Merge local and server entities, resolving conflicts
export function mergeStores(localStore: LocalStore, cloudStore: LocalStore): LocalStore {
  const mergedStore: LocalStore = {
    ...localStore,
    entities: {
      students: mergeEntities(localStore.entities.students, cloudStore.entities.students),
      groups: mergeEntities(localStore.entities.groups, cloudStore.entities.groups),
      attendance_records: mergeEntities(localStore.entities.attendance_records, cloudStore.entities.attendance_records),
      completed_makeup_sessions: mergeEntities(localStore.entities.completed_makeup_sessions, cloudStore.entities.completed_makeup_sessions),
      archived_terms: mergeEntities(localStore.entities.archived_terms, cloudStore.entities.archived_terms),
    },
  }
  
  return mergedStore
}

export function mergeEntities(local: LocalEntity[], server: LocalEntity[]): LocalEntity[] {
  const merged = new Map<string, LocalEntity>()
  
  // Add all local entities first
  local.forEach(entity => {
    merged.set(entity.id, entity)
  })
  
  // Merge server entities
  server.forEach(serverEntity => {
    const localEntity = merged.get(serverEntity.id)
    
    if (!localEntity) {
      // Server-only entity - add to local cache
      merged.set(serverEntity.id, serverEntity)
    } else {
      // Entity exists in both - resolve conflict
      const resolvedEntity = resolveConflict(localEntity, serverEntity)
      merged.set(serverEntity.id, resolvedEntity)
    }
  })
  
  return Array.from(merged.values())
}

function resolveConflict(local: LocalEntity, server: LocalEntity): LocalEntity {
  const localTime = new Date(local.updated_at).getTime()
  const serverTime = new Date(server.updated_at).getTime()
  const timeDiff = Math.abs(localTime - serverTime)
  
  // If timestamps are within 1 second, prefer server
  if (timeDiff <= 1000) {
    return {
      ...server,
      metadata: {
        ...local.metadata,
        ...server.metadata,
      },
    }
  }
  
  // If server is newer by more than 1 second, server wins
  if (serverTime > localTime + 1000) {
    return {
      ...server,
      metadata: {
        ...local.metadata,
        ...server.metadata,
      },
    }
  }
  
  // If local is newer by more than 1 second, local wins
  if (localTime > serverTime + 1000) {
    return {
      ...local,
      metadata: {
        ...local.metadata,
        ...server.metadata,
      },
    }
  }
  
  // Fallback to server
  return {
    ...server,
    metadata: {
      ...local.metadata,
      ...server.metadata,
    },
  }
}

export function isSyncing(): boolean {
  return isLeader && syncWorker !== null
}

export function getSyncStatus(userId: string): {
  isLeader: boolean
  tabId: string
  outboxStats: ReturnType<typeof getOutboxStats>
} {
  return {
    isLeader,
    tabId,
    outboxStats: getOutboxStats(userId),
  }
}

export function forceSync(userId: string): Promise<void> {
  return flushOutboxIfLeader(userId)
}
