import { supabase } from '@/supabase'
import { loadLocalStore, saveLocalStore, markAsMigrated, clearGuestStore, LocalStore, LocalEntity } from './localStore'
import { generateClientId } from './localStore'

export interface MergePlan {
  localOnly: LocalEntity[]
  merged: Array<{
    local: LocalEntity
    server: LocalEntity
    mergedPayload: LocalEntity
  }>
  conflicts: Array<{
    local: LocalEntity
    server: LocalEntity
    reason: string
  }>
}

export async function migrateGuestToGoogle(userId: string): Promise<LocalStore> {
  console.log('🔄 Starting guest to Google migration...')
  
  // Load guest data
  const guestStore = loadLocalStore() // No userId = guest store
  const userStore = loadLocalStore(userId)
  
  if (!guestStore || isEmpty(guestStore)) {
    console.log('📄 No guest data to migrate')
    return userStore
  }
  
  // Check if already migrated
  if (userStore.migrated) {
    console.log('✅ Already migrated, skipping')
    return userStore
  }
  
  try {
    // Fetch existing cloud data for this user
    const cloudData = await fetchCloudData(userId)
    
    // Compute merge plan
    const mergePlan = computeMergePlan(guestStore, cloudData)
    
    console.log('📊 Merge plan:', {
      localOnly: mergePlan.localOnly.length,
      merged: mergePlan.merged.length,
      conflicts: mergePlan.conflicts.length
    })
    
    // Handle conflicts if any
    if (mergePlan.conflicts.length > 10) {
      console.warn(`⚠️ Many conflicts detected (${mergePlan.conflicts.length}). Proceeding with auto-merge.`)
    }
    
    // Prepare upsert batch
    const upsertBatch = [
      ...mergePlan.localOnly,
      ...mergePlan.merged.map(item => item.mergedPayload)
    ]
    
    // Execute migration in batches
    await executeMigration(upsertBatch, userId)
    
    // Update local cache with migrated data
    const migratedStore = createMigratedStore(guestStore, userStore, mergePlan)
    saveLocalStore(migratedStore, userId)
    
    // Mark as migrated
    markAsMigrated(userId)
    
    // Optionally clear guest store (keep for safety)
    // clearGuestStore()
    
    console.log('✅ Migration completed successfully')
    return migratedStore
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  }
}

async function fetchCloudData(userId: string): Promise<LocalStore> {
  try {
    const [
      { data: students },
      { data: groups },
      { data: attendanceRecords },
      { data: makeupSessions },
      { data: completedMakeups },
      { data: archivedTerms }
    ] = await Promise.all([
      supabase.from('students').select('*').eq('user_id', userId),
      supabase.from('groups').select('*').eq('user_id', userId),
      supabase.from('attendance_records').select('*').eq('user_id', userId),
      supabase.from('makeup_sessions').select('*').eq('user_id', userId),
      supabase.from('completed_makeup_sessions').select('*').eq('user_id', userId),
      supabase.from('archived_terms').select('*').eq('user_id', userId)
    ])
    
    return {
      entities: {
        students: students || [],
        groups: groups || [],
        attendance_records: attendanceRecords || [],
        makeup_sessions: makeupSessions || [],
        completed_makeup_sessions: completedMakeups || [],
        archived_terms: archivedTerms || [],
      },
      outbox: [],
      lastSyncAt: null,
      version: 1,
    }
  } catch (error) {
    console.error('Error fetching cloud data:', error)
    return createEmptyStore()
  }
}

function computeMergePlan(guestStore: LocalStore, cloudStore: LocalStore): MergePlan {
  const plan: MergePlan = {
    localOnly: [],
    merged: [],
    conflicts: []
  }
  
  // Process each table
  const tables = ['students', 'groups', 'attendance_records', 'makeup_sessions', 'completed_makeup_sessions', 'archived_terms'] as const
  
  for (const table of tables) {
    const guestEntities = guestStore.entities[table]
    const cloudEntities = cloudStore.entities[table]
    
    for (const guestEntity of guestEntities) {
      // Check if entity exists in cloud
      const cloudEntity = cloudEntities.find(e => e.id === guestEntity.id)
      
      if (!cloudEntity) {
        // Local only - add to migration
        const migratedEntity = {
          ...guestEntity,
          user_id: userId, // Will be set during migration
          client_id: generateClientId(),
          updated_at: new Date().toISOString(),
        }
        plan.localOnly.push(migratedEntity)
      } else {
        // Conflict - resolve based on updated_at
        const guestTime = new Date(guestEntity.updated_at).getTime()
        const cloudTime = new Date(cloudEntity.updated_at).getTime()
        
        if (Math.abs(guestTime - cloudTime) < 1000) {
          // Within 1 second - treat as same state
          plan.merged.push({
            local: guestEntity,
            server: cloudEntity,
            mergedPayload: cloudEntity // Use server version
          })
        } else if (guestTime > cloudTime) {
          // Guest is newer - merge with server
          const mergedPayload = {
            ...cloudEntity,
            ...guestEntity,
            user_id: userId,
            updated_at: guestEntity.updated_at,
          }
          plan.merged.push({
            local: guestEntity,
            server: cloudEntity,
            mergedPayload
          })
        } else {
          // Cloud is newer - keep cloud
          plan.merged.push({
            local: guestEntity,
            server: cloudEntity,
            mergedPayload: cloudEntity
          })
        }
      }
    }
  }
  
  return plan
}

async function executeMigration(upsertBatch: LocalEntity[], userId: string): Promise<void> {
  // Group by table
  const tableGroups = new Map<string, LocalEntity[]>()
  
  for (const entity of upsertBatch) {
    const table = getTableFromEntity(entity)
    if (!tableGroups.has(table)) {
      tableGroups.set(table, [])
    }
    tableGroups.get(table)!.push({
      ...entity,
      user_id: userId
    })
  }
  
  // Execute upserts for each table
  for (const [table, entities] of tableGroups) {
    if (entities.length > 0) {
      const { error } = await supabase
        .from(table)
        .upsert(entities, { onConflict: 'id' })
      
      if (error) {
        console.error(`Error upserting ${table}:`, error)
        throw error
      }
      
      console.log(`✅ Migrated ${entities.length} ${table}`)
    }
  }
}

function createMigratedStore(guestStore: LocalStore, userStore: LocalStore, mergePlan: MergePlan): LocalStore {
  // Create new store with migrated data
  const migratedStore: LocalStore = {
    ...userStore,
    entities: {
      students: [],
      groups: [],
      attendance_records: [],
      makeup_sessions: [],
      completed_makeup_sessions: [],
      archived_terms: [],
    },
    migrated: true,
  }
  
  // Add all entities from merge plan
  for (const entity of mergePlan.localOnly) {
    const table = getTableFromEntity(entity)
    migratedStore.entities[table].push(entity)
  }
  
  for (const item of mergePlan.merged) {
    const table = getTableFromEntity(item.mergedPayload)
    migratedStore.entities[table].push(item.mergedPayload)
  }
  
  return migratedStore
}

function getTableFromEntity(entity: LocalEntity): string {
  // This is a simplified version - you might need to add a table field to entities
  // or use a more sophisticated detection method
  if (entity.name && entity.prepaidSessions !== undefined) return 'students'
  if (entity.name && entity.type) return 'groups'
  if (entity.date && entity.status) return 'attendance_records'
  if (entity.originalDate) return 'makeup_sessions'
  if (entity.completedDate) return 'completed_makeup_sessions'
  if (entity.startMonth) return 'archived_terms'
  
  return 'students' // Default fallback
}

function isEmpty(store: LocalStore): boolean {
  return Object.values(store.entities).every(entities => entities.length === 0)
}

function createEmptyStore(): LocalStore {
  return {
    entities: {
      students: [],
      groups: [],
      attendance_records: [],
      makeup_sessions: [],
      completed_makeup_sessions: [],
      archived_terms: [],
    },
    outbox: [],
    lastSyncAt: null,
    version: 1,
  }
}
