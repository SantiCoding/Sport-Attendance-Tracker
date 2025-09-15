# Persistence System QA Checklist

## Manual Testing Checklist

### 1. Guest Mode Persistence
- [ ] Create records in guest mode
- [ ] Refresh browser - verify data persists
- [ ] Close and reopen browser - verify data persists
- [ ] Create multiple students, groups, attendance records
- [ ] Verify all data types persist correctly

### 2. Guest → Google Migration
- [ ] Create data in guest mode
- [ ] Sign in with Google (empty server)
- [ ] Verify local data migrates to server
- [ ] Sign out and sign in on different device
- [ ] Verify migrated data appears on new device
- [ ] Test with existing server data + guest data
- [ ] Verify merge conflicts are resolved correctly

### 3. Google Mode Sync
- [ ] Sign in with Google
- [ ] Create/modify data
- [ ] Verify data syncs to cloud
- [ ] Open app on different device
- [ ] Verify data appears on new device
- [ ] Make changes on both devices
- [ ] Verify sync resolves conflicts correctly

### 4. Multi-Tab Coordination
- [ ] Open app in multiple tabs
- [ ] Make changes in tab A
- [ ] Verify tab B updates via storage events
- [ ] Verify leader election works correctly
- [ ] Close leader tab - verify new leader takes over

### 5. Network Resilience
- [ ] Disconnect network
- [ ] Make changes - verify they're queued
- [ ] Reconnect network
- [ ] Verify queued changes sync
- [ ] Test with intermittent connectivity

### 6. Data Flashing Fix (Critical)
- [ ] Create data in guest mode
- [ ] Sign in with Google
- [ ] Verify data doesn't flash then disappear
- [ ] Test with slow network
- [ ] Test with empty server response
- [ ] Verify local data is never silently overwritten

### 7. Error Handling
- [ ] Test with invalid data
- [ ] Test with corrupted localStorage
- [ ] Test with network errors
- [ ] Verify graceful degradation
- [ ] Check error messages are user-friendly

### 8. Performance
- [ ] Test with large datasets (1000+ entities)
- [ ] Verify UI remains responsive
- [ ] Test sync performance
- [ ] Verify memory usage is reasonable

## Automated Testing

### Unit Tests
- [ ] Run `npm test` - all tests pass
- [ ] Test merge logic with various scenarios
- [ ] Test outbox operations
- [ ] Test migration logic
- [ ] Test data flashing fix specifically

### Integration Tests
- [ ] Test full migration flow
- [ ] Test sync with real Supabase
- [ ] Test error scenarios
- [ ] Test performance with large datasets

## Debug UI Testing

### Sync Status Component
- [ ] Verify shows correct sync status
- [ ] Test leader election display
- [ ] Verify outbox stats are accurate
- [ ] Test force sync button
- [ ] Test retry failed items
- [ ] Verify sync logs are displayed

### Debug Information
- [ ] Verify tab ID is displayed
- [ ] Check sync logs are accurate
- [ ] Test clear log functionality
- [ ] Verify real-time updates

## Edge Cases

### Clock Skew
- [ ] Test with different system times
- [ ] Verify server timestamps are authoritative
- [ ] Test conflict resolution with time differences

### Duplicate Detection
- [ ] Create entities with same names
- [ ] Test semantic duplicate detection
- [ ] Verify merge behavior for duplicates

### Large Data Migration
- [ ] Test with 10k+ entities
- [ ] Verify chunked migration works
- [ ] Test progress indicators
- [ ] Verify no data loss

### Schema Changes
- [ ] Test with missing fields
- [ ] Verify backward compatibility
- [ ] Test migration from v1 to v2

## Browser Compatibility

### Desktop Browsers
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

### Mobile Browsers
- [ ] Chrome Mobile
- [ ] Safari Mobile
- [ ] Firefox Mobile

### Storage Limits
- [ ] Test with localStorage quota exceeded
- [ ] Verify graceful handling
- [ ] Test cleanup of old data

## Security Testing

### Data Isolation
- [ ] Verify users can't see other users' data
- [ ] Test RLS policies work correctly
- [ ] Verify guest data is isolated

### Authentication
- [ ] Test with expired tokens
- [ ] Verify proper token refresh
- [ ] Test logout behavior

## Performance Benchmarks

### Load Times
- [ ] Initial load < 2 seconds
- [ ] Sync operations < 5 seconds
- [ ] Migration < 30 seconds for 1k entities

### Memory Usage
- [ ] < 50MB for 1k entities
- [ ] No memory leaks during sync
- [ ] Proper cleanup on unmount

## Regression Testing

### Previous Functionality
- [ ] All existing features still work
- [ ] No breaking changes to API
- [ ] Backward compatibility maintained

### Data Integrity
- [ ] No data loss during migration
- [ ] No corruption during sync
- [ ] Proper backup/restore functionality

## Production Readiness

### Monitoring
- [ ] Sync status is visible
- [ ] Error logging works
- [ ] Performance metrics available

### Rollback Plan
- [ ] Verify rollback procedure works
- [ ] Test data recovery
- [ ] Verify no data loss during rollback

## Accessibility

### Screen Readers
- [ ] Sync status is announced
- [ ] Error messages are accessible
- [ ] Loading states are announced

### Keyboard Navigation
- [ ] All debug controls are keyboard accessible
- [ ] Focus management works correctly

## Documentation

### User Documentation
- [ ] Guest mode explanation
- [ ] Migration process documented
- [ ] Troubleshooting guide

### Developer Documentation
- [ ] API documentation updated
- [ ] Architecture diagrams
- [ ] Deployment instructions

## Final Verification

### Critical Paths
- [ ] Guest mode works end-to-end
- [ ] Migration works end-to-end
- [ ] Sync works end-to-end
- [ ] No data flashing occurs

### Acceptance Criteria
- [ ] All acceptance criteria met
- [ ] Performance requirements satisfied
- [ ] Security requirements satisfied
- [ ] User experience is smooth

## Sign-off

- [ ] QA Lead: ________________
- [ ] Product Owner: ________________
- [ ] Engineering Lead: ________________
- [ ] Date: ________________
