import { supabase } from '../../supabase'
import { 
  OutboxItem, 
  LocalEntity, 
  clearOutboxItems, 
  updateOutboxItemStatus,
  addSyncLog,
  loadLocalStore,
  saveLocalStore
} from './localStore'

const MAX_BATCH_SIZE = 100
const MAX_ATTEMPTS = 10
const BACKOFF_BASE = 1000 // 1 second

export interface BatchResult {
  success: OutboxItem[]
  failed: Array<{ item: OutboxItem; error: string }>
}

export async function flushOutbox(userId: string): Promise<BatchResult> {
  const store = loadLocalStore(userId)
  const pendingItems = store.outbox.filter(item => item.status === 'pending')
  
  if (pendingItems.length === 0) {
    return { success: [], failed: [] }
  }
  
  // Group by table and take max batch size
  const tableGroups = new Map<string, OutboxItem[]>()
  pendingItems.forEach(item => {
    if (!tableGroups.has(item.table)) {
      tableGroups.set(item.table, [])
    }
    tableGroups.get(item.table)!.push(item)
  })
  
  const results: BatchResult = { success: [], failed: [] }
  
  for (const [table, items] of tableGroups) {
    const batches = chunkArray(items, MAX_BATCH_SIZE)
    
    for (const batch of batches) {
      try {
        // Mark batch as inflight
        batch.forEach(item => {
          updateOutboxItemStatus(item.id, 'inflight', undefined, userId)
        })
        
        const batchResult = await processBatch(table, batch, userId)
        results.success.push(...batchResult.success)
        results.failed.push(...batchResult.failed)
        
        // Clear successful items from outbox
        if (batchResult.success.length > 0) {
          clearOutboxItems(batchResult.success, userId)
        }
        
        // Update failed items
        batchResult.failed.forEach(({ item, error }) => {
          const shouldRetry = item.attempts < MAX_ATTEMPTS
          updateOutboxItemStatus(
            item.id, 
            shouldRetry ? 'pending' : 'failed', 
            error, 
            userId
          )
        })
        
        addSyncLog({
          type: 'info',
          message: `Processed batch for ${table}`,
          details: { 
            success: batchResult.success.length, 
            failed: batchResult.failed.length 
          }
        }, userId)
        
      } catch (error) {
        // Mark entire batch as failed
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        batch.forEach(item => {
          const shouldRetry = item.attempts < MAX_ATTEMPTS
          updateOutboxItemStatus(
            item.id, 
            shouldRetry ? 'pending' : 'failed', 
            errorMessage, 
            userId
          )
        })
        
        results.failed.push(...batch.map(item => ({ item, error: errorMessage })))
        
        addSyncLog({
          type: 'error',
          message: `Batch processing failed for ${table}`,
          details: { error: errorMessage, batchSize: batch.length }
        }, userId)
      }
    }
  }
  
  return results
}

async function processBatch(table: string, items: OutboxItem[], userId: string): Promise<BatchResult> {
  const upsertItems = items.filter(item => item.op === 'upsert')
  const deleteItems = items.filter(item => item.op === 'delete')
  
  const results: BatchResult = { success: [], failed: [] }
  
  // Process upserts
  if (upsertItems.length > 0) {
    const payloads = upsertItems.map(item => ({
      ...item.payload,
      user_id: userId,
    }))
    
    try {
      const { data, error } = await supabase
        .from(table)
        .upsert(payloads, { 
          onConflict: 'id',
          ignoreDuplicates: false 
        })
      
      if (error) {
        // Handle per-row errors if available
        if (error.details && typeof error.details === 'string') {
          // Try to parse per-row errors
          try {
            const errorDetails = JSON.parse(error.details)
            if (Array.isArray(errorDetails)) {
              errorDetails.forEach((rowError, index) => {
                if (rowError && index < upsertItems.length) {
                  results.failed.push({ 
                    item: upsertItems[index], 
                    error: rowError.message || 'Row upsert failed' 
                  })
                }
              })
            }
          } catch {
            // Fallback to marking all as failed
            upsertItems.forEach(item => {
              results.failed.push({ item, error: error.message })
            })
          }
        } else {
          // Mark all as failed
          upsertItems.forEach(item => {
            results.failed.push({ item, error: error.message })
          })
        }
      } else {
        // All successful
        results.success.push(...upsertItems)
        
        // Update local cache with server responses
        if (data) {
          updateLocalCacheFromServer(table, data, userId)
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      upsertItems.forEach(item => {
        results.failed.push({ item, error: errorMessage })
      })
    }
  }
  
  // Process deletes
  if (deleteItems.length > 0) {
    const deleteIds = deleteItems.map(item => item.payload.id)
    
    try {
      const { error } = await supabase
        .from(table)
        .update({ deleted: true, updated_at: new Date().toISOString() })
        .in('id', deleteIds)
        .eq('user_id', userId)
      
      if (error) {
        deleteItems.forEach(item => {
          results.failed.push({ item, error: error.message })
        })
      } else {
        results.success.push(...deleteItems)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      deleteItems.forEach(item => {
        results.failed.push({ item, error: errorMessage })
      })
    }
  }
  
  return results
}

function updateLocalCacheFromServer(table: string, serverData: any[], userId: string): void {
  const store = loadLocalStore(userId)
  
  serverData.forEach(serverEntity => {
    const existingIndex = store.entities[table as keyof typeof store.entities].findIndex(
      e => e.id === serverEntity.id
    )
    
    if (existingIndex >= 0) {
      // Merge server data with local metadata
      const localEntity = store.entities[table as keyof typeof store.entities][existingIndex]
      store.entities[table as keyof typeof store.entities][existingIndex] = {
        ...localEntity,
        ...serverEntity,
        // Preserve local metadata
        metadata: {
          ...localEntity.metadata,
          ...serverEntity.metadata,
        },
        // Use server's updated_at and version
        updated_at: serverEntity.updated_at,
        version: serverEntity.version,
      }
    } else {
      // New entity from server
      store.entities[table as keyof typeof store.entities].push({
        ...serverEntity,
        metadata: serverEntity.metadata || {},
      })
    }
  })
  
  saveLocalStore(store, userId)
}

function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}

export function getOutboxStats(userId: string): {
  pending: number
  inflight: number
  failed: number
  total: number
} {
  const store = loadLocalStore(userId)
  const stats = {
    pending: 0,
    inflight: 0,
    failed: 0,
    total: store.outbox.length,
  }
  
  store.outbox.forEach(item => {
    stats[item.status]++
  })
  
  return stats
}

export function retryFailedItems(userId: string): void {
  const store = loadLocalStore(userId)
  
  store.outbox.forEach(item => {
    if (item.status === 'failed' && item.attempts < MAX_ATTEMPTS) {
      updateOutboxItemStatus(item.id, 'pending', undefined, userId)
    }
  })
}

export function clearFailedItems(userId: string): void {
  const store = loadLocalStore(userId)
  store.outbox = store.outbox.filter(item => item.status !== 'failed')
  saveLocalStore(store, userId)
  
  addSyncLog({
    type: 'info',
    message: 'Cleared failed outbox items',
  }, userId)
}
