"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Edit, Plus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface CoachProfile {
  id: string
  name: string
  students: any[]
  groups: any[]
  attendanceRecords: any[]
  archivedTerms: any[]
  completedMakeupSessions: any[]
}

interface ProfileSwitcherProps {
  profiles: CoachProfile[]
  currentProfile: string
  setProfiles: (profiles: CoachProfile[]) => void
  setCurrentProfile: (profileId: string) => void
}

export function ProfileSwitcher({ profiles, currentProfile, setProfiles, setCurrentProfile }: ProfileSwitcherProps) {
  const { toast } = useToast()
  const [showCreateProfile, setShowCreateProfile] = useState(false)
  const [showEditProfile, setShowEditProfile] = useState(false)
  const [newProfileName, setNewProfileName] = useState("")
  const [editProfileName, setEditProfileName] = useState("")
  const currentProfileData = profiles.find((p) => p.id === currentProfile)

  const createProfile = () => {
    if (!newProfileName.trim()) return
    const newProfile: CoachProfile = {
      id: Date.now().toString(),
      name: newProfileName.trim(),
      students: [],
      groups: [],
      attendanceRecords: [],
      archivedTerms: [],
      completedMakeupSessions: [],
    }
    setProfiles([...profiles, newProfile])
    setCurrentProfile(newProfile.id)
    setNewProfileName("")
    setShowCreateProfile(false)
    toast({
      title: "✅ Profile Created",
      description: `Coach profile "${newProfileName.trim()}" created successfully`,
      variant: "default",
    })
  }

  const editProfile = () => {
    if (!editProfileName.trim() || !currentProfileData) return
    setProfiles(profiles.map((p) => (p.id === currentProfile ? { ...p, name: editProfileName.trim() } : p)))
    setEditProfileName("")
    setShowEditProfile(false)
    toast({
      title: "✏️ Profile Updated",
      description: `Coach profile renamed to "${editProfileName.trim()}"`,
      variant: "default",
    })
  }

  const deleteProfile = () => {
    if (profiles.length <= 1) {
      alert("Cannot delete the last profile")
      return
    }
    const updatedProfiles = profiles.filter((p) => p.id !== currentProfile)
    setProfiles(updatedProfiles)
    setCurrentProfile(updatedProfiles[0].id)
    toast({
      title: "🗑️ Profile Deleted",
      description: "Coach profile deleted successfully",
      variant: "destructive",
    })
  }

  useEffect(() => {
    if (currentProfileData) {
      setEditProfileName(currentProfileData.name)
    }
  }, [currentProfileData])

  return (
    <>
      <div className="flex items-center gap-1 sm:gap-2 w-full">
        <Select value={currentProfile} onValueChange={setCurrentProfile}>
          <SelectTrigger className="flex-1 min-w-0">
            <SelectValue placeholder="Select coach profile" />
          </SelectTrigger>
          <SelectContent>
            {profiles.map((profile) => (
              <SelectItem key={profile.id} value={profile.id}>
                {profile.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={() => setShowCreateProfile(true)} size="sm" className="flex-shrink-0 min-h-[44px]">
          <Plus className="h-4 w-4" />
        </Button>
        {currentProfileData && (
          <Button
            onClick={() => setShowEditProfile(true)}
            variant="outline"
            size="sm"
            className="flex-shrink-0 min-h-[44px]"
          >
            <Edit className="h-4 w-4" />
          </Button>
        )}
      </div>
      <Dialog open={showCreateProfile} onOpenChange={setShowCreateProfile}>
        <DialogContent className="w-[95vw] max-w-sm">
          <DialogHeader>
            <DialogTitle>Create New Coach Profile</DialogTitle>
            <DialogDescription>Enter a coach name and click Create Profile.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="form-field">
              <Label htmlFor="new-profile-name">Coach Name</Label>
              <Input
                id="new-profile-name"
                value={newProfileName}
                onChange={(e) => setNewProfileName(e.target.value)}
                placeholder="Enter coach name"
                className="mt-1 text-sm"
              />
            </div>
          </div>
          <DialogFooter className="form-buttons flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setShowCreateProfile(false)}
              className="min-h-[48px] w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button onClick={createProfile} disabled={!newProfileName.trim()} className="min-h-[48px] w-full sm:w-auto">
              Create Profile
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditProfile} onOpenChange={setShowEditProfile}>
        <DialogContent className="w-[95vw] max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit Coach Profile</DialogTitle>
            <DialogDescription>Rename the profile or delete it below.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="form-field">
              <Label htmlFor="edit-profile-name">Coach Name</Label>
              <Input
                id="edit-profile-name"
                value={editProfileName}
                onChange={(e) => setEditProfileName(e.target.value)}
                placeholder="Enter coach name"
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter className="form-buttons flex-col sm:flex-row justify-between gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={profiles.length <= 1} className="min-h-[48px] w-full sm:w-auto">
                  Delete Profile
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="w-[95vw] max-w-sm">
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Coach Profile</AlertDialogTitle>
                  <AlertDialogDescription className="break-words">
                    Are you sure you want to delete the profile for {currentProfileData?.name}? This will permanently
                    delete all students, groups, and attendance records. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="form-buttons flex-col sm:flex-row gap-2">
                  <AlertDialogCancel className="min-h-[48px] w-full sm:w-auto">Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={deleteProfile} className="min-h-[48px] w-full sm:w-auto">
                    Delete Profile
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                onClick={() => setShowEditProfile(false)}
                className="min-h-[48px] flex-1 sm:flex-none"
              >
                Cancel
              </Button>
              <Button
                onClick={editProfile}
                disabled={!editProfileName.trim()}
                className="min-h-[48px] flex-1 sm:flex-none"
              >
                Save Changes
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
