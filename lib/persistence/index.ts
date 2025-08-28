// Main persistence system exports
export * from './localStore'
export * from './outbox'
export * from './sync'
export * from './migration'

// Unified persistence interface
import { 
  LocalStore, 
  LocalEntity, 
  loadLocalStore, 
  saveLocalStore,
  saveLocal,
  deleteLocal,
  addSyncLog
} from './localStore'
import { 
  initializeSync, 
  stopSyncWorker, 
  loadFromCloud,
  getSyncStatus,
  forceSync
} from './sync'
import { 
  migrateGuestToGoogle,
  MigrationResult 
} from './migration'

export interface PersistenceManager {
  // Local operations
  loadStore: (userId?: string) => LocalStore
  saveStore: (store: LocalStore, userId?: string) => void
  saveEntity: (table: keyof LocalStore['entities'], entity: LocalEntity, userId?: string) => void
  deleteEntity: (table: keyof LocalStore['entities'], entityId: string, userId?: string) => void
  
  // Sync operations
  initializeSync: (userId: string) => void
  stopSync: () => void
  loadFromCloud: (userId: string) => Promise<LocalStore>
  getSyncStatus: (userId: string) => ReturnType<typeof getSyncStatus>
  forceSync: (userId: string) => Promise<void>
  
  // Migration operations
  migrateGuestToGoogle: (userId: string) => Promise<MigrationResult>
  
  // Logging
  addLog: (entry: { type: 'info' | 'error' | 'warning'; message: string; details?: any }, userId?: string) => void
}

export function createPersistenceManager(): PersistenceManager {
  return {
    // Local operations
    loadStore: loadLocalStore,
    saveStore: saveLocalStore,
    saveEntity: saveLocal,
    deleteEntity: deleteLocal,
    
    // Sync operations
    initializeSync,
    stopSync: stopSyncWorker,
    loadFromCloud,
    getSyncStatus,
    forceSync,
    
    // Migration operations
    migrateGuestToGoogle,
    
    // Logging
    addLog: addSyncLog,
  }
}

// Default instance
export const persistence = createPersistenceManager()

// Utility functions for common operations
export function convertLegacyData(legacyData: any): LocalStore {
  // Convert old localStorage format to new v2 format
  const store: LocalStore = {
    entities: {
      students: [],
      groups: [],
      attendance_records: [],
      completed_makeup_sessions: [],
      archived_terms: [],
    },
    outbox: [],
    lastSyncAt: null,
    version: 2,
    syncLog: [],
  }
  
  if (legacyData.profiles) {
    // Convert profiles to entities
    legacyData.profiles.forEach((profile: any) => {
      if (profile.students) {
        store.entities.students.push(...profile.students.map((student: any) => ({
          ...student,
          user_id: null,
          updated_at: student.updated_at || new Date().toISOString(),
          deleted: false,
          client_id: `legacy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          version: 1,
          metadata: {},
        })))
      }
      
      if (profile.groups) {
        store.entities.groups.push(...profile.groups.map((group: any) => ({
          ...group,
          user_id: null,
          updated_at: group.updated_at || new Date().toISOString(),
          deleted: false,
          client_id: `legacy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          version: 1,
          metadata: {},
        })))
      }
      
      if (profile.attendanceRecords) {
        store.entities.attendance_records.push(...profile.attendanceRecords.map((record: any) => ({
          ...record,
          user_id: null,
          updated_at: record.updated_at || new Date().toISOString(),
          deleted: false,
          client_id: `legacy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          version: 1,
          metadata: {},
        })))
      }
      
      if (profile.completedMakeupSessions) {
        store.entities.completed_makeup_sessions.push(...profile.completedMakeupSessions.map((session: any) => ({
          ...session,
          user_id: null,
          updated_at: session.updated_at || new Date().toISOString(),
          deleted: false,
          client_id: `legacy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          version: 1,
          metadata: {},
        })))
      }
      
      if (profile.archivedTerms) {
        store.entities.archived_terms.push(...profile.archivedTerms.map((term: any) => ({
          ...term,
          user_id: null,
          updated_at: term.updated_at || new Date().toISOString(),
          deleted: false,
          client_id: `legacy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          version: 1,
          metadata: {},
        })))
      }
    })
  }
  
  return store
}

export function migrateFromLegacyStorage(): void {
  // Check for legacy data and migrate if found
  const legacyProfiles = localStorage.getItem('tennisTrackerProfiles')
  const legacyCurrentProfile = localStorage.getItem('tennisTrackerCurrentProfile')
  
  if (legacyProfiles) {
    try {
      const parsedProfiles = JSON.parse(legacyProfiles)
      const convertedStore = convertLegacyData({ profiles: parsedProfiles })
      
      // Save to new format
      saveLocalStore(convertedStore)
      
      // Archive legacy data
      localStorage.setItem('tennisTrackerProfiles_legacy', legacyProfiles)
      if (legacyCurrentProfile) {
        localStorage.setItem('tennisTrackerCurrentProfile_legacy', legacyCurrentProfile)
      }
      
      // Remove legacy data
      localStorage.removeItem('tennisTrackerProfiles')
      localStorage.removeItem('tennisTrackerCurrentProfile')
      
      console.log('✅ Migrated legacy data to v2 format')
    } catch (error) {
      console.error('❌ Failed to migrate legacy data:', error)
    }
  }
}
