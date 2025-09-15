# Persistence System Deployment Guide

## Overview

This guide covers the deployment of the v2 persistence system that fixes the data flashing issue and provides robust Guest/Google modes with reliable sync.

## Prerequisites

- Supabase project with admin access
- Node.js 18+ and npm
- Git access to the repository

## Phase 1: Database Migration

### 1.1 Run Schema Migration

Execute the database migration in your Supabase SQL editor:

```sql
-- Run migrations/002_persistence_v2_schema.sql
```

This will:
- Add required fields to all tables (`user_id`, `deleted`, `updated_at`, `client_id`, `version`, `metadata`)
- Create database triggers for automatic `updated_at` updates
- Add performance indexes
- Create migration logs table
- Update RLS policies

### 1.2 Verify Migration

Check that all tables have the new structure:

```sql
-- Verify schema changes
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name IN ('students', 'groups', 'attendance_records', 'completed_makeup_sessions', 'archived_terms')
  AND column_name IN ('user_id', 'deleted', 'updated_at', 'client_id', 'version', 'metadata')
ORDER BY table_name, column_name;
```

### 1.3 Test Database Triggers

Verify triggers are working:

```sql
-- Test trigger functionality
INSERT INTO students (name, profile_id) VALUES ('Test Student', 'test-profile-id');
SELECT name, updated_at FROM students WHERE name = 'Test Student';
```

## Phase 2: Backend Feature Flag

### 2.1 Enable Feature Flag

In your Supabase dashboard, create a feature flag:

```sql
-- Create feature flag table if not exists
CREATE TABLE IF NOT EXISTS feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert persistence v2 flag
INSERT INTO feature_flags (name, enabled) 
VALUES ('persistence_v2', true)
ON CONFLICT (name) DO UPDATE SET enabled = true;
```

### 2.2 Verify Feature Flag

```sql
-- Check feature flag status
SELECT * FROM feature_flags WHERE name = 'persistence_v2';
```

## Phase 3: Client Deployment

### 3.1 Build and Deploy

```bash
# Install dependencies
npm install

# Build the application
npm run build

# Deploy to your hosting platform
npm run deploy
```

### 3.2 Environment Variables

Ensure these environment variables are set:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_PERSISTENCE_V2_ENABLED=true
```

## Phase 4: Canary Deployment

### 4.1 Enable for 5% of Users

Update the feature flag to enable for a small percentage:

```sql
-- Enable for 5% of users (example implementation)
UPDATE feature_flags 
SET enabled = true, 
    rollout_percentage = 5 
WHERE name = 'persistence_v2';
```

### 4.2 Monitor Canary

Monitor these metrics during canary:

- Error rates in application logs
- Sync success rates
- Migration success rates
- User feedback
- Performance metrics

### 4.3 Rollback Plan

If issues are detected:

```sql
-- Disable feature flag
UPDATE feature_flags 
SET enabled = false 
WHERE name = 'persistence_v2';
```

## Phase 5: Full Rollout

### 5.1 Enable for All Users

```sql
-- Enable for 100% of users
UPDATE feature_flags 
SET enabled = true, 
    rollout_percentage = 100 
WHERE name = 'persistence_v2';
```

### 5.2 Monitor Production

Continue monitoring:
- Application performance
- Database performance
- User experience metrics
- Error rates

## Testing Procedures

### Pre-Deployment Testing

1. **Local Testing**
   ```bash
   npm run test
   npm run build
   npm run dev
   ```

2. **Database Testing**
   ```sql
   -- Test with sample data
   INSERT INTO students (name, profile_id, user_id) 
   VALUES ('Test User', 'test-profile', 'test-user-id');
   
   SELECT * FROM students WHERE user_id = 'test-user-id';
   ```

3. **Integration Testing**
   - Test guest mode functionality
   - Test migration from guest to Google
   - Test sync functionality
   - Test error scenarios

### Post-Deployment Testing

1. **Smoke Tests**
   - Verify app loads correctly
   - Test basic CRUD operations
   - Verify sync status component works

2. **User Acceptance Testing**
   - Test with real user data
   - Verify migration works for existing users
   - Test multi-device sync

## Monitoring and Alerting

### Key Metrics to Monitor

1. **Application Metrics**
   - Page load times
   - Error rates
   - User engagement

2. **Database Metrics**
   - Query performance
   - Storage usage
   - Connection counts

3. **Sync Metrics**
   - Sync success rates
   - Migration success rates
   - Outbox queue sizes

### Alerting Setup

Configure alerts for:
- High error rates (>5%)
- Sync failures (>10%)
- Migration failures
- Performance degradation

## Rollback Procedures

### Emergency Rollback

If critical issues are detected:

1. **Disable Feature Flag**
   ```sql
   UPDATE feature_flags 
   SET enabled = false 
   WHERE name = 'persistence_v2';
   ```

2. **Revert Client Code**
   ```bash
   git revert <commit-hash>
   npm run build
   npm run deploy
   ```

3. **Data Recovery**
   - Check for data loss
   - Restore from backups if necessary
   - Verify data integrity

### Data Recovery

If data corruption occurs:

1. **Restore from Backup**
   ```sql
   -- Restore from latest backup
   -- Contact Supabase support if needed
   ```

2. **Verify Data Integrity**
   ```sql
   -- Check for orphaned records
   SELECT COUNT(*) FROM students WHERE user_id IS NULL;
   SELECT COUNT(*) FROM groups WHERE user_id IS NULL;
   ```

## Troubleshooting

### Common Issues

1. **Migration Failures**
   - Check database permissions
   - Verify table structure
   - Check for data conflicts

2. **Sync Issues**
   - Verify network connectivity
   - Check Supabase configuration
   - Review error logs

3. **Performance Issues**
   - Monitor database performance
   - Check for slow queries
   - Review client-side performance

### Debug Tools

1. **Sync Status Component**
   - Shows real-time sync status
   - Displays outbox information
   - Provides debug logs

2. **Database Logs**
   - Check Supabase logs
   - Monitor query performance
   - Review error logs

3. **Client Logs**
   - Browser developer tools
   - Application error logs
   - Network request logs

## Security Considerations

### Data Protection

1. **Row Level Security**
   - Verify RLS policies are active
   - Test data isolation
   - Monitor access patterns

2. **Authentication**
   - Verify token validation
   - Test session management
   - Monitor auth failures

3. **Data Encryption**
   - Verify data encryption at rest
   - Check transmission encryption
   - Monitor encryption status

## Performance Optimization

### Database Optimization

1. **Indexes**
   - Monitor index usage
   - Add missing indexes
   - Remove unused indexes

2. **Query Optimization**
   - Review slow queries
   - Optimize database queries
   - Monitor query performance

3. **Connection Pooling**
   - Monitor connection usage
   - Optimize pool settings
   - Handle connection limits

### Client Optimization

1. **Caching**
   - Implement proper caching
   - Monitor cache hit rates
   - Optimize cache invalidation

2. **Bundle Size**
   - Monitor bundle size
   - Optimize imports
   - Use code splitting

## Documentation Updates

### User Documentation

1. **Feature Documentation**
   - Guest mode explanation
   - Migration process
   - Sync functionality

2. **Troubleshooting Guide**
   - Common issues
   - Solutions
   - Support contacts

### Developer Documentation

1. **API Documentation**
   - Updated API docs
   - Migration guides
   - Integration examples

2. **Architecture Documentation**
   - System architecture
   - Data flow diagrams
   - Component documentation

## Success Criteria

### Technical Success

- [ ] All tests pass
- [ ] No critical errors in production
- [ ] Performance meets requirements
- [ ] Data integrity maintained

### User Success

- [ ] No data flashing issues
- [ ] Smooth migration experience
- [ ] Reliable sync functionality
- [ ] Positive user feedback

### Business Success

- [ ] Improved user retention
- [ ] Reduced support tickets
- [ ] Better user experience
- [ ] Successful feature adoption

## Post-Deployment Review

### 1 Week Review

- Review all metrics
- Analyze user feedback
- Identify any issues
- Plan optimizations

### 1 Month Review

- Comprehensive performance review
- User satisfaction survey
- Technical debt assessment
- Future roadmap planning

## Support and Maintenance

### Ongoing Maintenance

1. **Regular Monitoring**
   - Daily metric reviews
   - Weekly performance analysis
   - Monthly security reviews

2. **Updates and Patches**
   - Security updates
   - Performance improvements
   - Bug fixes

3. **User Support**
   - Help desk support
   - Documentation updates
   - Training materials

### Escalation Procedures

1. **Critical Issues**
   - Immediate rollback
   - Emergency response team
   - Stakeholder communication

2. **Performance Issues**
   - Performance analysis
   - Optimization planning
   - Gradual improvements

3. **User Issues**
   - Support ticket tracking
   - Issue resolution
   - User communication
