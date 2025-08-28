// Local storage management with outbox and proper data structure
export interface LocalEntity {
  id: string
  updated_at: string
  client_id: string
  version: number
  deleted: boolean
  [key: string]: any
}

export interface OutboxItem {
  op: 'upsert' | 'delete'
  table: string
  payload: LocalEntity
  created_at: string
  client_id: string
}

export interface LocalStore {
  entities: {
    students: LocalEntity[]
    groups: LocalEntity[]
    attendance_records: LocalEntity[]
    makeup_sessions: LocalEntity[]
    completed_makeup_sessions: LocalEntity[]
    archived_terms: LocalEntity[]
  }
  outbox: OutboxItem[]
  lastSyncAt: string | null
  version: number
  migrated?: boolean
}

const GUEST_STORE_KEY = 'app:guest:v1'
const USER_STORE_KEY_PREFIX = 'app:user:'

export function getLocalStoreKey(userId?: string): string {
  if (!userId) return GUEST_STORE_KEY
  return `${USER_STORE_KEY_PREFIX}${userId}:v1`
}

export function generateClientId(): string {
  return `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export function createEmptyStore(): LocalStore {
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

export function loadLocalStore(userId?: string): LocalStore {
  try {
    const key = getLocalStoreKey(userId)
    const stored = localStorage.getItem(key)
    if (!stored) return createEmptyStore()
    
    const parsed = JSON.parse(stored)
    // Ensure all required fields exist
    return {
      ...createEmptyStore(),
      ...parsed,
      entities: {
        ...createEmptyStore().entities,
        ...parsed.entities,
      },
    }
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
  
  // Update or insert entity
  const existingIndex = store.entities[table].findIndex(e => e.id === entity.id)
  if (existingIndex >= 0) {
    store.entities[table][existingIndex] = entity
  } else {
    store.entities[table].push(entity)
  }
  
  // Add to outbox for sync
  store.outbox.push({
    op: 'upsert',
    table,
    payload: entity,
    created_at: new Date().toISOString(),
    client_id: entity.client_id,
  })
  
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
    
    // Add to outbox for sync
    store.outbox.push({
      op: 'delete',
      table,
      payload: entity,
      created_at: new Date().toISOString(),
      client_id: entity.client_id,
    })
    
    saveLocalStore(store, userId)
  }
}

export function clearOutboxItems(items: OutboxItem[], userId?: string): void {
  const store = loadLocalStore(userId)
  const itemIds = new Set(items.map(item => `${item.table}-${item.payload.id}-${item.created_at}`))
  
  store.outbox = store.outbox.filter(item => 
    !itemIds.has(`${item.table}-${item.payload.id}-${item.created_at}`)
  )
  
  saveLocalStore(store, userId)
}

export function markAsMigrated(userId: string): void {
  const store = loadLocalStore(userId)
  store.migrated = true
  saveLocalStore(store, userId)
}

export function clearGuestStore(): void {
  localStorage.removeItem(GUEST_STORE_KEY)
}
