"use client"

import React from 'react'
import { useAuth } from '../../../use-auth'
import { SyncStatus } from '../../../components/SyncStatus'

export default function SyncDebugPage() {
  const { user } = useAuth()
  return (
    <div className="p-4 max-w-2xl mx-auto">
      <SyncStatus userId={user?.id ?? undefined} isGuestMode={!user} />
    </div>
  )
}


