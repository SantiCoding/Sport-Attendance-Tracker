// Local storage management with outbox and proper data structure
export interface LocalEntity {
  id: string
  user_id?: string
  updated_at: string
  deleted: boolean
  client_id: string
  version: number
  metadata: Record<string, any>
  [key: string]: any
}

export interface OutboxItem {
  id: string
  op: 'upsert' | 'delete'
  table: string
  payload: LocalEntity
  created_at: string
  attempts: number
  status: 'pending' | 'inflight' | 'failed'
  last_attempt?: string
  error?: string
}

export interface LocalStore {
  entities: {
    students: LocalEntity[]
    groups: LocalEntity[]
    attendance_records: LocalEntity[]
    completed_makeup_sessions: LocalEntity[]
    archived_terms: LocalEntity[]
  }
  outbox: OutboxItem[]
  lastSyncAt: string | null
  version: number
  migrated?: boolean
  leaderTabId?: string
  syncLog: SyncLogEntry[]
}

export interface SyncLogEntry {
  timestamp: string
  type: 'info' | 'error' | 'warning'
  message: string
  details?: any
}

const GUEST_STORE_KEY = 'app:guest:v2'
const USER_STORE_KEY_PREFIX = 'app:user:'
const LEADER_LOCK_KEY = 'app:leader:v2'
const SYNC_LOG_KEY = 'app:syncLog:v2'

export function getLocalStoreKey(userId?: string): string {
  if (!userId) return GUEST_STORE_KEY
  return `${USER_STORE_KEY_PREFIX}${userId}:v2`
}

export function generateClientId(): string {
  return `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export function generateOutboxId(): string {
  return `outbox-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export function createEmptyStore(): LocalStore {
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

export function loadLocalStore(userId?: string): LocalStore {
  try {
    const key = getLocalStoreKey(userId)
    const stored = localStorage.getItem(key)
    if (!stored) return createEmptyStore()
    
    const parsed = JSON.parse(stored)
    // Ensure all required fields exist and migrate from v1 if needed
    const store = {
      ...createEmptyStore(),
      ...parsed,
      entities: {
        ...createEmptyStore().entities,
        ...parsed.entities,
      },
    }
    
    // Migrate from v1 if needed
    if (parsed.version === 1) {
      store.version = 2
      store.syncLog = parsed.syncLog || []
      // Ensure all entities have required fields
      Object.keys(store.entities).forEach(table => {
        store.entities[table as keyof LocalStore['entities']] = store.entities[table as keyof LocalStore['entities']].map((entity: any) => ({
          ...entity,
          user_id: entity.user_id || null,
          updated_at: entity.updated_at || new Date().toISOString(),
          deleted: entity.deleted || false,
          client_id: entity.client_id || generateClientId(),
          version: entity.version || 1,
          metadata: entity.metadata || {},
        }))
      })
    }
    
    return store
  } catch (error) {
    console.error('Error loading local store:', error)
    return createEmptyStore()
  }
}

export function saveLocalStore(store: LocalStore, userId?: string): void {
  try {
    const key = getLocalStoreKey(userId)
    localStorage.setItem(key, JSON.stringify(store))
  } catch (error) {
    console.error('Error saving local store:', error)
  }
}

export function saveLocal(table: keyof LocalStore['entities'], entity: LocalEntity, userId?: string): void {
  const store = loadLocalStore(userId)
  
  // Ensure entity has required fields
  const enrichedEntity: LocalEntity = {
    ...entity,
    user_id: entity.user_id || userId || null,
    updated_at: entity.updated_at || new Date().toISOString(),
    deleted: entity.deleted || false,
    client_id: entity.client_id || generateClientId(),
    version: entity.version || 1,
    metadata: entity.metadata || {},
  }
  
  // Update or insert entity
  const existingIndex = store.entities[table].findIndex(e => e.id === enrichedEntity.id)
  if (existingIndex >= 0) {
    store.entities[table][existingIndex] = enrichedEntity
  } else {
    store.entities[table].push(enrichedEntity)
  }
  
  // Add to outbox for sync (only if user is signed in)
  if (userId) {
    store.outbox.push({
      id: generateOutboxId(),
      op: 'upsert',
      table,
      payload: enrichedEntity,
      created_at: new Date().toISOString(),
      attempts: 0,
      status: 'pending',
    })
  }
  
  saveLocalStore(store, userId)
}

export function deleteLocal(table: keyof LocalStore['entities'], entityId: string, userId?: string): void {
  const store = loadLocalStore(userId)
  
  // Mark as deleted locally
  const entity = store.entities[table].find(e => e.id === entityId)
  if (entity) {
    entity.deleted = true
    entity.updated_at = new Date().toISOString()
    entity.version += 1
    
    // Add to outbox for sync (only if user is signed in)
    if (userId) {
      store.outbox.push({
        id: generateOutboxId(),
        op: 'delete',
        table,
        payload: entity,
        created_at: new Date().toISOString(),
        attempts: 0,
        status: 'pending',
      })
    }
    
    saveLocalStore(store, userId)
  }
}

export function clearOutboxItems(items: OutboxItem[], userId?: string): void {
  const store = loadLocalStore(userId)
  const itemIds = new Set(items.map(item => item.id))
  
  store.outbox = store.outbox.filter(item => !itemIds.has(item.id))
  
  saveLocalStore(store, userId)
}

export function updateOutboxItemStatus(itemId: string, status: OutboxItem['status'], error?: string, userId?: string): void {
  const store = loadLocalStore(userId)
  const item = store.outbox.find(item => item.id === itemId)
  
  if (item) {
    item.status = status
    item.last_attempt = new Date().toISOString()
    if (error) item.error = error
    if (status === 'inflight') item.attempts += 1
    
    saveLocalStore(store, userId)
  }
}

export function markAsMigrated(userId: string): void {
  const store = loadLocalStore(userId)
  store.migrated = true
  saveLocalStore(store, userId)
}

export function clearGuestStore(): void {
  localStorage.removeItem(GUEST_STORE_KEY)
}

export function archiveGuestStore(): void {
  const guestStore = localStorage.getItem(GUEST_STORE_KEY)
  if (guestStore) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    localStorage.setItem(`app:guest:archive:${timestamp}`, guestStore)
    localStorage.removeItem(GUEST_STORE_KEY)
  }
}

export function getLeaderTabId(): string | null {
  return localStorage.getItem(LEADER_LOCK_KEY)
}

export function setLeaderTabId(tabId: string): void {
  localStorage.setItem(LEADER_LOCK_KEY, tabId)
}

export function clearLeaderTabId(): void {
  localStorage.removeItem(LEADER_LOCK_KEY)
}

export function addSyncLog(entry: Omit<SyncLogEntry, 'timestamp'>, userId?: string): void {
  const store = loadLocalStore(userId)
  store.syncLog.push({
    ...entry,
    timestamp: new Date().toISOString(),
  })
  
  // Keep only last 200 entries
  if (store.syncLog.length > 200) {
    store.syncLog = store.syncLog.slice(-200)
  }
  
  saveLocalStore(store, userId)
}

export function getSyncLog(userId?: string): SyncLogEntry[] {
  const store = loadLocalStore(userId)
  return store.syncLog
}

export function clearSyncLog(userId?: string): void {
  const store = loadLocalStore(userId)
  store.syncLog = []
  saveLocalStore(store, userId)
}
