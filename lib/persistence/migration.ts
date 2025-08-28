import { supabase } from '../../supabase'
import { 
  LocalStore, 
  LocalEntity, 
  loadLocalStore, 
  saveLocalStore,
  addSyncLog,
  archiveGuestStore,
  markAsMigrated,
  generateClientId
} from './localStore'

export interface MergePlan {
  localOnly: LocalEntity[]
  serverOnly: LocalEntity[]
  conflicts: Array<{
    local: LocalEntity
    server: LocalEntity
    resolution: 'local' | 'server' | 'merge'
  }>
  duplicates: Array<{
    local: LocalEntity[]
    server: LocalEntity[]
    fingerprint: string
  }>
}

export interface MigrationResult {
  success: boolean
  migratedEntities: number
  conflicts: number
  duplicates: number
  errors: string[]
}

export async function migrateGuestToGoogle(userId: string): Promise<MigrationResult> {
  const guestStore = loadLocalStore() // No userId = guest store
  const serverStore = await fetchCloudData(userId)
  
  addSyncLog({
    type: 'info',
    message: 'Starting guest to Google migration',
    details: { 
      guestEntities: Object.values(guestStore.entities).flat().length,
      serverEntities: Object.values(serverStore.entities).flat().length
    }
  }, userId)
  
  // Check if already migrated
  if (guestStore.migrated) {
    addSyncLog({
      type: 'warning',
      message: 'Guest data already migrated',
    }, userId)
    return {
      success: true,
      migratedEntities: 0,
      conflicts: 0,
      duplicates: 0,
      errors: [],
    }
  }
  
  try {
    // Archive guest store before migration
    archiveGuestStore()
    
    // Compute merge plan
    const mergePlan = computeMergePlan(guestStore, serverStore)
    
    // Handle different scenarios
    if (Object.values(serverStore.entities).flat().length === 0) {
      // Server is empty - bulk upload guest data
      return await bulkUploadGuestData(guestStore, userId)
    } else if (Object.values(guestStore.entities).flat().length === 0) {
      // Guest is empty - just load server data
      saveLocalStore(serverStore, userId)
      markAsMigrated(userId)
      return {
        success: true,
        migratedEntities: 0,
        conflicts: 0,
        duplicates: 0,
        errors: [],
      }
    } else {
      // Both have data - perform merge
      return await performMerge(mergePlan, userId)
    }
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    addSyncLog({
      type: 'error',
      message: 'Migration failed',
      details: { error: errorMessage }
    }, userId)
    
    return {
      success: false,
      migratedEntities: 0,
      conflicts: 0,
      duplicates: 0,
      errors: [errorMessage],
    }
  }
}

async function fetchCloudData(userId: string): Promise<LocalStore> {
  try {
    const [
      { data: students },
      { data: groups },
      { data: attendanceRecords },
      { data: completedMakeups },
      { data: archivedTerms }
    ] = await Promise.all([
      supabase.from('students').select('*').eq('user_id', userId).eq('deleted', false),
      supabase.from('groups').select('*').eq('user_id', userId).eq('deleted', false),
      supabase.from('attendance_records').select('*').eq('user_id', userId).eq('deleted', false),
      supabase.from('completed_makeup_sessions').select('*').eq('user_id', userId).eq('deleted', false),
      supabase.from('archived_terms').select('*').eq('user_id', userId).eq('deleted', false)
    ])
    
    return {
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
  } catch (error) {
    console.error('Error fetching cloud data:', error)
    return createEmptyStore()
  }
}

function createEmptyStore(): LocalStore {
  return {
    entities: {
      students: [],
      groups: [],
      attendance_records: [],
      completed_makeup_sessions: [],
      archived_terms: [],
    },
    outbox: [],
    lastSyncAt: null,
    version: 1,
    syncLog: [],
  }
}

export function computeMergePlan(guestStore: LocalStore, serverStore: LocalStore): MergePlan {
  const plan: MergePlan = {
    localOnly: [],
    serverOnly: [],
    conflicts: [],
    duplicates: [],
  }
  
  // Process each table
  Object.keys(guestStore.entities).forEach(table => {
    const guestEntities = guestStore.entities[table as keyof LocalStore['entities']]
    const serverEntities = serverStore.entities[table as keyof LocalStore['entities']]
    
    const guestMap = new Map<string, LocalEntity>()
    const serverMap = new Map<string, LocalEntity>()
    
    guestEntities.forEach(entity => guestMap.set(entity.id, entity))
    serverEntities.forEach(entity => serverMap.set(entity.id, entity))
    
    // Find local-only entities
    guestEntities.forEach(entity => {
      if (!serverMap.has(entity.id)) {
        plan.localOnly.push(entity)
      }
    })
    
    // Find server-only entities
    serverEntities.forEach(entity => {
      if (!guestMap.has(entity.id)) {
        plan.serverOnly.push(entity)
      }
    })
    
    // Find conflicts
    guestEntities.forEach(guestEntity => {
      const serverEntity = serverMap.get(guestEntity.id)
      if (serverEntity) {
        const resolution = resolveConflict(guestEntity, serverEntity)
        plan.conflicts.push({
          local: guestEntity,
          server: serverEntity,
          resolution,
        })
      }
    })
    
    // Find semantic duplicates (same name/keys but different IDs)
    const duplicates = findSemanticDuplicates(guestEntities, serverEntities)
    plan.duplicates.push(...duplicates)
  })
  
  return plan
}

function resolveConflict(local: LocalEntity, server: LocalEntity): 'local' | 'server' | 'merge' {
  const localTime = new Date(local.updated_at).getTime()
  const serverTime = new Date(server.updated_at).getTime()
  const timeDiff = Math.abs(localTime - serverTime)
  
  // If timestamps are within 1 second, prefer server
  if (timeDiff <= 1000) {
    return 'server'
  }
  
  // If server is newer by more than 1 second, server wins
  if (serverTime > localTime + 1000) {
    return 'server'
  }
  
  // If local is newer by more than 1 second, local wins
  if (localTime > serverTime + 1000) {
    return 'local'
  }
  
  // Fallback to server
  return 'server'
}

function findSemanticDuplicates(localEntities: LocalEntity[], serverEntities: LocalEntity[]): Array<{
  local: LocalEntity[]
  server: LocalEntity[]
  fingerprint: string
}> {
  const duplicates: Array<{
    local: LocalEntity[]
    server: LocalEntity[]
    fingerprint: string
  }> = []
  
  // Create fingerprint map for local entities
  const localFingerprints = new Map<string, LocalEntity[]>()
  localEntities.forEach(entity => {
    const fingerprint = createFingerprint(entity)
    if (!localFingerprints.has(fingerprint)) {
      localFingerprints.set(fingerprint, [])
    }
    localFingerprints.get(fingerprint)!.push(entity)
  })
  
  // Check server entities against local fingerprints
  serverEntities.forEach(serverEntity => {
    const fingerprint = createFingerprint(serverEntity)
    const localMatches = localFingerprints.get(fingerprint)
    
    if (localMatches && localMatches.length > 0) {
      // Check if any of the local matches have different IDs
      const differentIds = localMatches.filter(local => local.id !== serverEntity.id)
      if (differentIds.length > 0) {
        duplicates.push({
          local: differentIds,
          server: [serverEntity],
          fingerprint,
        })
      }
    }
  })
  
  return duplicates
}

function createFingerprint(entity: LocalEntity): string {
  // Create a normalized fingerprint based on key fields
  const keyFields = entity.name || entity.student_name || entity.group_name || ''
  return keyFields.toLowerCase().trim().replace(/\s+/g, ' ')
}

async function bulkUploadGuestData(guestStore: LocalStore, userId: string): Promise<MigrationResult> {
  const errors: string[] = []
  let migratedEntities = 0
  
  try {
    // Upload all entities to server
    for (const [table, entities] of Object.entries(guestStore.entities)) {
      if (entities.length === 0) continue
      
      const enrichedEntities = entities.map(entity => ({
        ...entity,
        user_id: userId,
        id: entity.id.startsWith('local-') ? generateClientId() : entity.id,
      }))
      
      const { error } = await supabase
        .from(table)
        .upsert(enrichedEntities, { onConflict: 'id' })
      
      if (error) {
        errors.push(`Failed to upload ${table}: ${error.message}`)
      } else {
        migratedEntities += entities.length
      }
    }
    
    // Save to user's local store
    const userStore: LocalStore = {
      ...guestStore,
      outbox: [],
      lastSyncAt: new Date().toISOString(),
      migrated: true,
    }
    saveLocalStore(userStore, userId)
    
    addSyncLog({
      type: 'info',
      message: 'Bulk upload completed',
      details: { migratedEntities, errors: errors.length }
    }, userId)
    
    return {
      success: errors.length === 0,
      migratedEntities,
      conflicts: 0,
      duplicates: 0,
      errors,
    }
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    errors.push(errorMessage)
    
    addSyncLog({
      type: 'error',
      message: 'Bulk upload failed',
      details: { error: errorMessage }
    }, userId)
    
    return {
      success: false,
      migratedEntities,
      conflicts: 0,
      duplicates: 0,
      errors,
    }
  }
}

async function performMerge(mergePlan: MergePlan, userId: string): Promise<MigrationResult> {
  const errors: string[] = []
  let migratedEntities = 0
  let conflicts = 0
  
  try {
    // Upload local-only entities
    for (const entity of mergePlan.localOnly) {
      try {
        const { error } = await supabase
          .from(getEntityTable(entity))
          .upsert({
            ...entity,
            user_id: userId,
            id: entity.id.startsWith('local-') ? generateClientId() : entity.id,
          }, { onConflict: 'id' })
        
        if (error) {
          errors.push(`Failed to upload ${entity.id}: ${error.message}`)
        } else {
          migratedEntities++
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        errors.push(`Failed to upload ${entity.id}: ${errorMessage}`)
      }
    }
    
    // Handle conflicts
    for (const conflict of mergePlan.conflicts) {
      conflicts++
      
      if (conflict.resolution === 'local') {
        try {
          const { error } = await supabase
            .from(getEntityTable(conflict.local))
            .upsert({
              ...conflict.local,
              user_id: userId,
            }, { onConflict: 'id' })
          
          if (error) {
            errors.push(`Failed to resolve conflict for ${conflict.local.id}: ${error.message}`)
          } else {
            migratedEntities++
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          errors.push(`Failed to resolve conflict for ${conflict.local.id}: ${errorMessage}`)
        }
      }
    }
    
    // Create merged store
    const mergedStore = createMergedStore(mergePlan, userId)
    saveLocalStore(mergedStore, userId)
    markAsMigrated(userId)
    
    addSyncLog({
      type: 'info',
      message: 'Merge completed',
      details: { 
        migratedEntities, 
        conflicts, 
        duplicates: mergePlan.duplicates.length,
        errors: errors.length 
      }
    }, userId)
    
    return {
      success: errors.length === 0,
      migratedEntities,
      conflicts,
      duplicates: mergePlan.duplicates.length,
      errors,
    }
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    errors.push(errorMessage)
    
    addSyncLog({
      type: 'error',
      message: 'Merge failed',
      details: { error: errorMessage }
    }, userId)
    
    return {
      success: false,
      migratedEntities,
      conflicts,
      duplicates: mergePlan.duplicates.length,
      errors,
    }
  }
}

function getEntityTable(entity: LocalEntity): string {
  // Determine table based on entity structure
  if (entity.student_name) return 'completed_makeup_sessions'
  if (entity.group_name) return 'groups'
  if (entity.status) return 'attendance_records'
  if (entity.start_month) return 'archived_terms'
  return 'students'
}

function createMergedStore(mergePlan: MergePlan, userId: string): LocalStore {
  const mergedEntities: LocalStore['entities'] = {
    students: [],
    groups: [],
    attendance_records: [],
    completed_makeup_sessions: [],
    archived_terms: [],
  }
  
  // Add server-only entities
  mergePlan.serverOnly.forEach(entity => {
    const table = getEntityTable(entity)
    mergedEntities[table as keyof LocalStore['entities']].push(entity)
  })
  
  // Add local-only entities
  mergePlan.localOnly.forEach(entity => {
    const table = getEntityTable(entity)
    mergedEntities[table as keyof LocalStore['entities']].push({
      ...entity,
      user_id: userId,
    })
  })
  
  // Add resolved conflicts
  mergePlan.conflicts.forEach(conflict => {
    const entity = conflict.resolution === 'local' ? conflict.local : conflict.server
    const table = getEntityTable(entity)
    mergedEntities[table as keyof LocalStore['entities']].push({
      ...entity,
      user_id: userId,
    })
  })
  
  return {
    entities: mergedEntities,
    outbox: [],
    lastSyncAt: new Date().toISOString(),
    version: 1,
    migrated: true,
    syncLog: [],
  }
}
