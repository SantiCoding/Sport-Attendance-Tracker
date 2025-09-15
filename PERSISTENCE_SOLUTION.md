# Persistence System Solution

## Problem Statement

The original issue was that local data would appear briefly then disappear after cloud fetch. This happened because:

1. **Local data loaded first** - UI showed local data immediately
2. **Cloud fetch overwrote local** - When cloud data returned, it completely replaced local data
3. **No merge logic** - If cloud returned empty, local data was lost
4. **Race conditions** - Multiple async operations could cause data flashing

## Root Cause Analysis

The core problem was in the data loading logic in `app/page.tsx`:

```typescript
// OLD CODE - PROBLEMATIC
const cloudProfiles = await loadFromCloud()
if (cloudProfiles.length > 0) {
  setProfiles(finalCloudProfiles) // REPLACES local data completely
} else {
  // Fallback logic that could also clear data
}
```

This approach:
- ✅ Loaded local data first (good)
- ❌ Replaced local data with cloud data (bad)
- ❌ No merge logic (bad)
- ❌ Could lose data if cloud was empty (bad)

## Solution Architecture

### 1. Robust Persistence System

**Core Principles:**
- **Local-first**: localStorage is always the primary source
- **Merge, don't replace**: Cloud data merges with local, never replaces
- **Durable outbox**: All changes are queued and persisted
- **Leader election**: Multi-tab coordination
- **Graceful degradation**: Works offline, syncs when online

### 2. Guest vs Google Modes

**Guest Mode:**
- Data stored in `app:guest:v2`
- No cloud sync
- Immediate persistence
- Works offline

**Google Mode:**
- Data stored in `app:user:<userId>:v2`
- Cloud is authoritative
- Local cache + outbox pattern
- Background sync

### 3. Migration System

**Guest → Google Migration:**
1. Archive guest data
2. Compute merge plan
3. Upload local-only data
4. Resolve conflicts
5. Mark as migrated

## Key Components

### 1. Local Store (`lib/persistence/localStore.ts`)

```typescript
interface LocalStore {
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
```

**Features:**
- Structured data storage
- Outbox for sync operations
- Version tracking
- Migration state
- Leader election
- Sync logging

### 2. Outbox System (`lib/persistence/outbox.ts`)

```typescript
interface OutboxItem {
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
```

**Features:**
- Durable operation queue
- Retry logic with exponential backoff
- Batch processing
- Error handling
- Status tracking

### 3. Sync System (`lib/persistence/sync.ts`)

```typescript
// Leader election for multi-tab coordination
export function initializeSync(userId: string): void

// Background sync worker
function startSyncWorker(userId: string): void

// Merge logic (the key fix)
function mergeEntities(local: LocalEntity[], server: LocalEntity[]): LocalEntity[]
```

**Features:**
- Leader election
- Background sync
- Merge logic (prevents data loss)
- Conflict resolution
- Real-time status

### 4. Migration System (`lib/persistence/migration.ts`)

```typescript
export async function migrateGuestToGoogle(userId: string): Promise<MigrationResult>

interface MigrationResult {
  success: boolean
  migratedEntities: number
  conflicts: number
  duplicates: number
  errors: string[]
}
```

**Features:**
- Deterministic merge planning
- Conflict resolution
- Duplicate detection
- Error handling
- Progress tracking

## The Fix for Data Flashing

### Before (Problematic)

```typescript
// OLD CODE
const loadData = async () => {
  // 1. Load local data
  const localData = loadFromLocalStorage()
  setData(localData) // Shows data immediately
  
  // 2. Load cloud data
  const cloudData = await loadFromCloud()
  
  // 3. REPLACE local with cloud (CAUSES FLASHING)
  setData(cloudData) // Data disappears if cloud is empty!
}
```

### After (Fixed)

```typescript
// NEW CODE
const loadData = async () => {
  // 1. Load local cache first (immediate UI response)
  const localStore = persistence.loadStore(userId)
  setStore(localStore) // Shows data immediately
  
  // 2. Load from cloud in background (with merge)
  const cloudStore = await persistence.loadFromCloud(userId)
  
  // 3. MERGE cloud with local (NO DATA LOSS)
  setStore(cloudStore) // Contains merged data
}
```

### Key Merge Logic

```typescript
function mergeEntities(local: LocalEntity[], server: LocalEntity[]): LocalEntity[] {
  const merged = new Map<string, LocalEntity>()
  
  // Add all local entities first
  local.forEach(entity => {
    merged.set(entity.id, entity)
  })
  
  // Merge server entities (don't replace, merge!)
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
```

## Database Schema Changes

### New Fields Added

All tables now include:
- `user_id UUID` - User ownership
- `deleted boolean` - Soft deletes
- `updated_at timestamptz` - Timestamp tracking
- `client_id text` - Client identification
- `version integer` - Version control
- `metadata jsonb` - Flexible metadata

### Triggers

```sql
-- Automatic timestamp updates
CREATE TRIGGER set_timestamp_students 
  BEFORE INSERT OR UPDATE ON students 
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
```

### Indexes

```sql
-- Performance indexes
CREATE INDEX idx_students_user_id ON students(user_id);
CREATE INDEX idx_students_updated_at ON students(updated_at);
CREATE INDEX idx_students_deleted ON students(deleted);
```

## Testing Strategy

### Unit Tests

```typescript
describe('Data Flashing Fix', () => {
  it('should not clear local data when server returns empty', () => {
    const localEntities = [{ id: 'local-data', name: 'Local Data' }]
    const serverEntities = []
    
    const merged = mergeEntities(localEntities, serverEntities)
    
    // NEW: Preserves local data
    expect(merged).toHaveLength(1)
    expect(merged[0].name).toBe('Local Data')
    
    // OLD: Would return empty array
    // expect(merged).toHaveLength(0) // This was the bug!
  })
})
```

### Integration Tests

- Full migration flow
- Multi-tab coordination
- Network resilience
- Error scenarios

## Debug and Monitoring

### Sync Status Component

```typescript
<SyncStatus userId={user?.id} isGuestMode={isGuestMode} />
```

**Features:**
- Real-time sync status
- Outbox statistics
- Leader election status
- Sync logs
- Force sync button
- Retry failed items

### Logging

```typescript
persistence.addLog({
  type: 'info',
  message: 'Data loaded successfully',
  details: { localEntities: 5, cloudEntities: 3 }
}, userId)
```

## Performance Optimizations

### 1. Batch Processing

```typescript
const MAX_BATCH_SIZE = 100
const batches = chunkArray(items, MAX_BATCH_SIZE)
```

### 2. Background Sync

```typescript
// Sync every 5 seconds in background
syncWorker = setInterval(() => {
  flushOutboxIfLeader(userId)
}, 5000)
```

### 3. Leader Election

```typescript
// Only one tab syncs at a time
if (!isLeader) return
```

## Security Considerations

### 1. Row Level Security

```sql
CREATE POLICY "Users can only see their own students" ON students
  FOR ALL USING (auth.uid() = user_id);
```

### 2. Data Isolation

- Guest data isolated from user data
- User data isolated by user_id
- No cross-user data access

### 3. Token Management

- Automatic token refresh
- Graceful auth failure handling
- Secure token storage

## Deployment Strategy

### 1. Database Migration

```sql
-- Run migrations/002_persistence_v2_schema.sql
```

### 2. Feature Flag

```sql
INSERT INTO feature_flags (name, enabled) 
VALUES ('persistence_v2', true)
```

### 3. Canary Deployment

- 5% of users first
- Monitor metrics
- Gradual rollout

### 4. Rollback Plan

```sql
-- Emergency rollback
UPDATE feature_flags 
SET enabled = false 
WHERE name = 'persistence_v2';
```

## Success Metrics

### Technical Metrics

- [ ] No data flashing incidents
- [ ] 99.9% sync success rate
- [ ] <2s initial load time
- [ ] <5s sync operations
- [ ] Zero data loss

### User Metrics

- [ ] Improved user retention
- [ ] Reduced support tickets
- [ ] Better user satisfaction
- [ ] Increased feature adoption

### Business Metrics

- [ ] Reduced churn
- [ ] Increased engagement
- [ ] Better user experience
- [ ] Successful migration rate

## Future Enhancements

### 1. Real-time Sync

- WebSocket connections
- Live updates across devices
- Conflict resolution UI

### 2. Advanced Migration

- Incremental migration
- Progress indicators
- Rollback capabilities

### 3. Performance

- Virtual scrolling for large datasets
- Optimistic updates
- Smart caching

### 4. Analytics

- Sync performance metrics
- User behavior tracking
- Error rate monitoring

## Conclusion

This persistence system provides:

1. **Robust data persistence** - No more data flashing
2. **Seamless guest experience** - Works offline
3. **Reliable cloud sync** - Multi-device support
4. **Safe migration** - Guest to Google transition
5. **Production-ready** - Monitoring, debugging, rollback

The key insight was that **local data should never be replaced, only merged**. This simple principle eliminates the data flashing issue while providing a robust foundation for future features.
