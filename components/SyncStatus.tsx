import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { ScrollArea } from './ui/scroll-area'
import { Separator } from './ui/separator'
import { 
  RefreshCw, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Database, 
  Cloud, 
  HardDrive,
  Users,
  Archive,
  Trash2,
  RotateCcw
} from 'lucide-react'
import { 
  getSyncStatus, 
  forceSync, 
  isSyncing 
} from '../lib/persistence/sync'
import { 
  getOutboxStats, 
  retryFailedItems, 
  clearFailedItems 
} from '../lib/persistence/outbox'
import { 
  getSyncLog, 
  clearSyncLog 
} from '../lib/persistence/localStore'

interface SyncStatusProps {
  userId?: string
  isGuestMode?: boolean
}

export function SyncStatus({ userId, isGuestMode = false }: SyncStatusProps) {
  const [syncStatus, setSyncStatus] = useState<any>(null)
  const [outboxStats, setOutboxStats] = useState<any>(null)
  const [syncLog, setSyncLog] = useState<any[]>([])
  const [isExpanded, setIsExpanded] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  const refreshData = () => {
    if (userId) {
      const status = getSyncStatus(userId)
      const stats = getOutboxStats(userId)
      const log = getSyncLog(userId)
      
      setSyncStatus(status)
      setOutboxStats(stats)
      setSyncLog(log)
    }
    setLastRefresh(new Date())
  }

  useEffect(() => {
    refreshData()
    const interval = setInterval(refreshData, 2000)
    return () => clearInterval(interval)
  }, [userId])

  const handleForceSync = async () => {
    if (userId) {
      await forceSync(userId)
      refreshData()
    }
  }

  const handleRetryFailed = () => {
    if (userId) {
      retryFailedItems(userId)
      refreshData()
    }
  }

  const handleClearFailed = () => {
    if (userId) {
      clearFailedItems(userId)
      refreshData()
    }
  }

  const handleClearLog = () => {
    if (userId) {
      clearSyncLog(userId)
      refreshData()
    }
  }

  if (isGuestMode) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <HardDrive className="h-4 w-4" />
            Guest Mode
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            Data is stored locally only. No cloud sync available.
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!userId) {
    return null
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500'
      case 'inflight': return 'bg-blue-500'
      case 'failed': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getLogIcon = (type: string) => {
    switch (type) {
      case 'error': return <AlertCircle className="h-3 w-3 text-red-500" />
      case 'warning': return <AlertCircle className="h-3 w-3 text-yellow-500" />
      case 'info': return <CheckCircle className="h-3 w-3 text-green-500" />
      default: return <Clock className="h-3 w-3 text-gray-500" />
    }
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Database className="h-4 w-4" />
            Sync Status
            {syncStatus?.isLeader && (
              <Badge variant="secondary" className="text-xs">
                Leader
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? 'Hide' : 'Debug'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={refreshData}
              disabled={isSyncing()}
            >
              <RefreshCw className={`h-3 w-3 ${isSyncing() ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Basic Status */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Cloud className="h-3 w-3" />
            <span>Cloud Sync:</span>
            <Badge variant={syncStatus?.isLeader ? "default" : "secondary"}>
              {syncStatus?.isLeader ? 'Active' : 'Inactive'}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <HardDrive className="h-3 w-3" />
            <span>Local Cache:</span>
            <Badge variant="outline">
              {outboxStats?.total || 0} items
            </Badge>
          </div>
        </div>

        {/* Outbox Status */}
        {outboxStats && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Outbox</span>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRetryFailed}
                  disabled={!outboxStats.failed}
                >
                  <RotateCcw className="h-3 w-3" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearFailed}
                  disabled={!outboxStats.failed}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center">
                <div className="text-lg font-bold text-yellow-600">
                  {outboxStats.pending}
                </div>
                <div className="text-xs text-muted-foreground">Pending</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-blue-600">
                  {outboxStats.inflight}
                </div>
                <div className="text-xs text-muted-foreground">In Flight</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-red-600">
                  {outboxStats.failed}
                </div>
                <div className="text-xs text-muted-foreground">Failed</div>
              </div>
            </div>
          </div>
        )}

        {/* Debug Information */}
        {isExpanded && (
          <>
            <Separator />
            
            {/* Tab ID */}
            <div className="text-xs">
              <span className="font-medium">Tab ID:</span> {syncStatus?.tabId}
            </div>

            {/* Last Refresh */}
            <div className="text-xs text-muted-foreground">
              Last refresh: {lastRefresh.toLocaleTimeString()}
            </div>

            {/* Sync Log */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Recent Logs</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearLog}
                >
                  Clear
                </Button>
              </div>
              <ScrollArea className="h-32">
                <div className="space-y-1">
                  {syncLog.slice(-10).reverse().map((entry, index) => (
                    <div key={index} className="flex items-start gap-2 text-xs">
                      {getLogIcon(entry.type)}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">{entry.message}</div>
                        {entry.details && (
                          <div className="text-muted-foreground">
                            {JSON.stringify(entry.details)}
                          </div>
                        )}
                        <div className="text-muted-foreground">
                          {new Date(entry.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Force Sync Button */}
            <Button
              onClick={handleForceSync}
              disabled={isSyncing()}
              className="w-full"
            >
              <RefreshCw className={`h-3 w-3 mr-2 ${isSyncing() ? 'animate-spin' : ''}`} />
              Force Sync
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}
