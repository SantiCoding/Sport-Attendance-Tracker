import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { 
  createEmptyStore, 
  loadLocalStore, 
  saveLocalStore,
  mergeEntities,
  LocalEntity
} from '../lib/persistence/localStore'
import { computeMergePlan } from '../lib/persistence/migration'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

describe('Persistence System', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockReturnValue(null)
    localStorageMock.setItem.mockClear()
    localStorageMock.removeItem.mockClear()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Local Store', () => {
    it('should create empty store with correct structure', () => {
      const store = createEmptyStore()
      
      expect(store).toEqual({
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
      })
    })

    it('should save and load store correctly', () => {
      const store = createEmptyStore()
      store.entities.students.push({
        id: 'test-student',
        name: 'Test Student',
        updated_at: new Date().toISOString(),
        deleted: false,
        client_id: 'test-client',
        version: 1,
        metadata: {},
      })

      saveLocalStore(store, 'test-user')
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'app:user:test-user:v2',
        JSON.stringify(store)
      )
    })

    it('should load existing store', () => {
      const existingStore = {
        entities: {
          students: [{
            id: 'existing-student',
            name: 'Existing Student',
            updated_at: new Date().toISOString(),
            deleted: false,
            client_id: 'existing-client',
            version: 1,
            metadata: {},
          }],
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

      localStorageMock.getItem.mockReturnValue(JSON.stringify(existingStore))
      
      const loadedStore = loadLocalStore('test-user')
      
      expect(loadedStore.entities.students).toHaveLength(1)
      expect(loadedStore.entities.students[0].name).toBe('Existing Student')
    })
  })

  describe('Merge Logic', () => {
    it('should merge entities correctly', () => {
      const localEntities: LocalEntity[] = [
        {
          id: 'local-only',
          name: 'Local Only',
          updated_at: new Date().toISOString(),
          deleted: false,
          client_id: 'local-client',
          version: 1,
          metadata: {},
        },
        {
          id: 'conflict',
          name: 'Local Version',
          updated_at: new Date(Date.now() - 1000).toISOString(), // Older
          deleted: false,
          client_id: 'local-client',
          version: 1,
          metadata: { local: true },
        }
      ]

      const serverEntities: LocalEntity[] = [
        {
          id: 'server-only',
          name: 'Server Only',
          updated_at: new Date().toISOString(),
          deleted: false,
          client_id: 'server-client',
          version: 1,
          metadata: {},
        },
        {
          id: 'conflict',
          name: 'Server Version',
          updated_at: new Date().toISOString(), // Newer
          deleted: false,
          client_id: 'server-client',
          version: 2,
          metadata: { server: true },
        }
      ]

      const merged = mergeEntities(localEntities, serverEntities)
      
      expect(merged).toHaveLength(3)
      
      // Local-only should be preserved
      const localOnly = merged.find(e => e.id === 'local-only')
      expect(localOnly).toBeDefined()
      expect(localOnly?.name).toBe('Local Only')
      
      // Server-only should be added
      const serverOnly = merged.find(e => e.id === 'server-only')
      expect(serverOnly).toBeDefined()
      expect(serverOnly?.name).toBe('Server Only')
      
      // Conflict should be resolved in favor of server (newer)
      const conflict = merged.find(e => e.id === 'conflict')
      expect(conflict).toBeDefined()
      expect(conflict?.name).toBe('Server Version')
      expect(conflict?.metadata).toEqual({ local: true, server: true })
    })

    it('should handle empty server data without clearing local', () => {
      const localEntities: LocalEntity[] = [
        {
          id: 'local-data',
          name: 'Local Data',
          updated_at: new Date().toISOString(),
          deleted: false,
          client_id: 'local-client',
          version: 1,
          metadata: {},
        }
      ]

      const serverEntities: LocalEntity[] = []

      const merged = mergeEntities(localEntities, serverEntities)
      
      expect(merged).toHaveLength(1)
      expect(merged[0].name).toBe('Local Data')
    })
  })

  describe('Migration Plan', () => {
    it('should compute merge plan correctly', () => {
      const guestStore = createEmptyStore()
      guestStore.entities.students.push({
        id: 'guest-student',
        name: 'Guest Student',
        updated_at: new Date().toISOString(),
        deleted: false,
        client_id: 'guest-client',
        version: 1,
        metadata: {},
      })

      const serverStore = createEmptyStore()
      serverStore.entities.students.push({
        id: 'server-student',
        name: 'Server Student',
        updated_at: new Date().toISOString(),
        deleted: false,
        client_id: 'server-client',
        version: 1,
        metadata: {},
      })

      const plan = computeMergePlan(guestStore, serverStore)
      
      expect(plan.localOnly).toHaveLength(1)
      expect(plan.localOnly[0].name).toBe('Guest Student')
      
      expect(plan.serverOnly).toHaveLength(1)
      expect(plan.serverOnly[0].name).toBe('Server Student')
      
      expect(plan.conflicts).toHaveLength(0)
      expect(plan.duplicates).toHaveLength(0)
    })
  })

  describe('Data Flashing Fix', () => {
    it('should not clear local data when server returns empty', () => {
      // This test verifies the core fix for the data flashing issue
      
      const localEntities: LocalEntity[] = [
        {
          id: 'local-data',
          name: 'Local Data',
          updated_at: new Date().toISOString(),
          deleted: false,
          client_id: 'local-client',
          version: 1,
          metadata: {},
        }
      ]

      const serverEntities: LocalEntity[] = []

      // Simulate the old behavior (would clear local data)
      const oldBehavior = () => {
        return serverEntities.length > 0 ? serverEntities : []
      }

      // Simulate the new behavior (preserves local data)
      const newBehavior = () => {
        return mergeEntities(localEntities, serverEntities)
      }

      const oldResult = oldBehavior()
      const newResult = newBehavior()

      // Old behavior would return empty array
      expect(oldResult).toHaveLength(0)
      
      // New behavior preserves local data
      expect(newResult).toHaveLength(1)
      expect(newResult[0].name).toBe('Local Data')
    })

    it('should merge server data with local data instead of replacing', () => {
      const localEntities: LocalEntity[] = [
        {
          id: 'local-data',
          name: 'Local Data',
          updated_at: new Date().toISOString(),
          deleted: false,
          client_id: 'local-client',
          version: 1,
          metadata: { local: true },
        }
      ]

      const serverEntities: LocalEntity[] = [
        {
          id: 'server-data',
          name: 'Server Data',
          updated_at: new Date().toISOString(),
          deleted: false,
          client_id: 'server-client',
          version: 1,
          metadata: { server: true },
        }
      ]

      // Simulate the old behavior (would replace local with server)
      const oldBehavior = () => {
        return serverEntities
      }

      // Simulate the new behavior (merges both)
      const newBehavior = () => {
        return mergeEntities(localEntities, serverEntities)
      }

      const oldResult = oldBehavior()
      const newResult = newBehavior()

      // Old behavior would only have server data
      expect(oldResult).toHaveLength(1)
      expect(oldResult[0].name).toBe('Server Data')
      
      // New behavior has both local and server data
      expect(newResult).toHaveLength(2)
      expect(newResult.find(e => e.name === 'Local Data')).toBeDefined()
      expect(newResult.find(e => e.name === 'Server Data')).toBeDefined()
    })
  })
})
