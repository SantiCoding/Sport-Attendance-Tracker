import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { isSyncing } from '@/lib/persistence/sync'
import { useAuth } from '@/use-auth'

export function SyncStatus() {
  const [syncState, setSyncState] = useState<'local' | 'syncing' | 'synced' | 'conflict'>('local')
  const { user } = useAuth()

  useEffect(() => {
    const updateSyncState = () => {
      if (!user) {
        setSyncState('local')
        return
      }

      if (isSyncing()) {
        setSyncState('syncing')
      } else {
        // Check if we have any outbox items
        const storeKey = `app:user:${user.id}:v1`
        const stored = localStorage.getItem(storeKey)
        if (stored) {
          try {
            const store = JSON.parse(stored)
            if (store.outbox && store.outbox.length > 0) {
              setSyncState('syncing')
            } else {
              setSyncState('synced')
            }
          } catch {
            setSyncState('local')
          }
        } else {
          setSyncState('local')
        }
      }
    }

    // Update immediately
    updateSyncState()

    // Update every 2 seconds
    const interval = setInterval(updateSyncState, 2000)

    return () => clearInterval(interval)
  }, [user])

  if (!user) {
    return (
      <Badge variant="secondary" className="text-xs">
        Local Mode
      </Badge>
    )
  }

  const getBadgeProps = () => {
    switch (syncState) {
      case 'local':
        return {
          variant: 'secondary' as const,
          children: 'Local',
          className: 'text-xs'
        }
      case 'syncing':
        return {
          variant: 'default' as const,
          children: 'Syncing...',
          className: 'text-xs animate-pulse'
        }
      case 'synced':
        return {
          variant: 'default' as const,
          children: 'Synced',
          className: 'text-xs'
        }
      case 'conflict':
        return {
          variant: 'destructive' as const,
          children: 'Conflict',
          className: 'text-xs'
        }
    }
  }

  return <Badge {...getBadgeProps()} />
}
