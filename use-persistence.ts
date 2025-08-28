import { useState, useEffect, useRef } from 'react'
import { useAuth } from './use-auth'
import { 
  persistence, 
  LocalStore, 
  migrateFromLegacyStorage,
  convertLegacyData
} from './lib/persistence'
import { useToast } from './hooks/use-toast'

export function usePersistence() {
  const { user, isSupabaseConfigured } = useAuth()
  const { toast } = useToast()
  const [store, setStore] = useState<LocalStore | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isGuestMode, setIsGuestMode] = useState(false)
  const hasInitialized = useRef(false)
  const hasMigrated = useRef(false)

  // Initialize persistence system
  useEffect(() => {
    if (hasInitialized.current) return
    hasInitialized.current = true

    // Migrate from legacy storage if needed
    if (!hasMigrated.current) {
      migrateFromLegacyStorage()
      hasMigrated.current = true
    }

    if (user && isSupabaseConfigured) {
      // Google mode - initialize sync
      setIsGuestMode(false)
      persistence.initializeSync(user.id)
      
      // Load data with proper merge logic
      loadDataForUser(user.id)
    } else {
      // Guest mode - load local only
      setIsGuestMode(true)
      loadGuestData()
    }
  }, [user, isSupabaseConfigured])

  const loadDataForUser = async (userId: string) => {
    setIsLoading(true)
    
    try {
      // Always load local cache first (immediate UI response)
      const localStore = persistence.loadStore(userId)
      setStore(localStore)
      
      // Then load from cloud in background (with merge)
      const cloudStore = await persistence.loadFromCloud(userId)
      
      // Update state with merged data
      setStore(cloudStore)
      
      persistence.addLog({
        type: 'info',
        message: 'Data loaded successfully',
        details: {
          localEntities: Object.values(localStore.entities).flat().length,
          cloudEntities: Object.values(cloudStore.entities).flat().length
        }
      }, userId)
      
    } catch (error) {
      console.error('Error loading data:', error)
      persistence.addLog({
        type: 'error',
        message: 'Failed to load data',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      }, userId)
      
      toast({
        title: "Error",
        description: "Failed to load data. Using local cache.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadGuestData = () => {
    setIsLoading(true)
    
    try {
      // Load guest store
      const guestStore = persistence.loadStore()
      setStore(guestStore)
      
      persistence.addLog({
        type: 'info',
        message: 'Guest data loaded',
        details: { entities: Object.values(guestStore.entities).flat().length }
      })
      
    } catch (error) {
      console.error('Error loading guest data:', error)
      persistence.addLog({
        type: 'error',
        message: 'Failed to load guest data',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      })
    } finally {
      setIsLoading(false)
    }
  }

  const saveData = async (updatedStore: LocalStore) => {
    if (!store) return

    try {
      if (isGuestMode) {
        // Guest mode - save locally only
        persistence.saveStore(updatedStore)
        setStore(updatedStore)
      } else if (user) {
        // Google mode - save locally and queue for sync
        persistence.saveStore(updatedStore, user.id)
        setStore(updatedStore)
        
        // Force sync to cloud
        await persistence.forceSync(user.id)
      }
      
      persistence.addLog({
        type: 'info',
        message: 'Data saved successfully',
        details: { mode: isGuestMode ? 'guest' : 'google' }
      }, user?.id)
      
    } catch (error) {
      console.error('Error saving data:', error)
      persistence.addLog({
        type: 'error',
        message: 'Failed to save data',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      }, user?.id)
      
      toast({
        title: "Error",
        description: "Failed to save data.",
        variant: "destructive",
      })
    }
  }

  const migrateToGoogle = async (): Promise<boolean> => {
    if (!user) return false

    try {
      setIsLoading(true)
      
      const result = await persistence.migrateGuestToGoogle(user.id)
      
      if (result.success) {
        // Load the migrated data
        const migratedStore = persistence.loadStore(user.id)
        setStore(migratedStore)
        setIsGuestMode(false)
        
        // Initialize sync
        persistence.initializeSync(user.id)
        
        toast({
          title: "Success",
          description: `Migrated ${result.migratedEntities} items to cloud.`,
        })
        
        return true
      } else {
        toast({
          title: "Migration Failed",
          description: result.errors.join(', '),
          variant: "destructive",
        })
        
        return false
      }
      
    } catch (error) {
      console.error('Migration error:', error)
      toast({
        title: "Migration Error",
        description: "Failed to migrate data to cloud.",
        variant: "destructive",
      })
      
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const signOut = () => {
    if (user) {
      persistence.stopSync()
    }
    setStore(null)
    setIsLoading(true)
    setIsGuestMode(false)
    hasInitialized.current = false
  }

  // Convert store to legacy format for compatibility
  const getLegacyProfiles = () => {
    if (!store) return []
    
    // Group entities by profile (for now, create a single profile)
    const profile = {
      id: 'default-profile',
      name: 'Default Profile',
      students: store.entities.students,
      groups: store.entities.groups,
      attendanceRecords: store.entities.attendance_records,
      archivedTerms: store.entities.archived_terms,
      completedMakeupSessions: store.entities.completed_makeup_sessions,
      makeupSessions: [], // Not used in v2
    }
    
    return [profile]
  }

  const updateLegacyProfile = (updatedProfile: any) => {
    if (!store) return

    const updatedStore: LocalStore = {
      ...store,
      entities: {
        ...store.entities,
        students: updatedProfile.students || [],
        groups: updatedProfile.groups || [],
        attendance_records: updatedProfile.attendanceRecords || [],
        archived_terms: updatedProfile.archivedTerms || [],
        completed_makeup_sessions: updatedProfile.completedMakeupSessions || [],
      }
    }

    saveData(updatedStore)
  }

  return {
    // State
    store,
    isLoading,
    isGuestMode,
    
    // Actions
    saveData,
    migrateToGoogle,
    signOut,
    
    // Legacy compatibility
    getLegacyProfiles,
    updateLegacyProfile,
    
    // Sync status
    getSyncStatus: () => user ? persistence.getSyncStatus(user.id) : null,
    forceSync: () => user ? persistence.forceSync(user.id) : Promise.resolve(),
  }
}
