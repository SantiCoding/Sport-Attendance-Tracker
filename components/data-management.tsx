"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Download, Upload } from "lucide-react"
import { useToast } from "@/toast"
import { motion } from "framer-motion"

interface DataManagementProps {
  profiles: any[]
  onDataImported: (data: any) => void
  onDataCleared: () => void
}

export function DataManagement({ profiles, onDataImported, onDataCleared }: DataManagementProps) {
  const [isExportOpen, setIsExportOpen] = useState(false)
  const [isImportOpen, setIsImportOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  // Debug logging
  console.log("DataManagement component mounted, export open:", isExportOpen, "import open:", isImportOpen)

  // Export all data to JSON file
  const handleExportData = () => {
    try {
      const exportData = {
        version: "1.0",
        exportDate: new Date().toISOString(),
        profiles: profiles,
        metadata: {
          totalProfiles: profiles.length,
          totalStudents: profiles.reduce((sum, profile) => sum + (profile.students?.length || 0), 0),
          totalGroups: profiles.reduce((sum, profile) => sum + (profile.groups?.length || 0), 0),
        }
      }

      const dataStr = JSON.stringify(exportData, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = `tennis-tracker-backup-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast("Data Exported Successfully", "success")
      setIsExportOpen(false)
    } catch (error) {
      console.error("Export error:", error)
      toast("Export Failed - Please try again", "error")
    }
  }

  // Import data from JSON file
  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const importData = JSON.parse(content)

        // Validate the imported data structure
        if (!importData.profiles || !Array.isArray(importData.profiles)) {
          throw new Error("Invalid data format")
        }

        // Show confirmation dialog with data preview
        const totalStudents = importData.profiles.reduce((sum: number, profile: any) => 
          sum + (profile.students?.length || 0), 0)
        const totalGroups = importData.profiles.reduce((sum: number, profile: any) => 
          sum + (profile.groups?.length || 0), 0)

        if (confirm(`Import data?\n\nProfiles: ${importData.profiles.length}\nStudents: ${totalStudents}\nGroups: ${totalGroups}\n\nThis will replace your current data.`)) {
          onDataImported(importData.profiles)
          toast("Data Imported Successfully", "success")
          setIsImportOpen(false)
        }
      } catch (error) {
        console.error("Import error:", error)
        toast("Import Failed - Invalid file format", "error")
      }
    }
    reader.readAsText(file)
  }


  return (
    <>
      {/* Export Dialog */}
      <Dialog open={isExportOpen} onOpenChange={setIsExportOpen}>
        <DialogContent className="max-w-md z-[100] bg-black/90 border border-white/20">
          <DialogHeader>
            <DialogTitle className="text-primary-white">Export Data</DialogTitle>
            <DialogDescription className="text-secondary-white">
              Download a backup of all your tennis coaching data
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-white/5 p-4 rounded-lg border border-white/10">
              <h4 className="text-primary-white font-medium mb-2">Backup Contents:</h4>
              <ul className="text-sm text-secondary-white space-y-1">
                <li>• {profiles.length} Coach Profile{profiles.length !== 1 ? 's' : ''}</li>
                <li>• {profiles.reduce((sum, profile) => sum + (profile.students?.length || 0), 0)} Students</li>
                <li>• {profiles.reduce((sum, profile) => sum + (profile.groups?.length || 0), 0)} Groups</li>
                <li>• All attendance records and makeup sessions</li>
              </ul>
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={handleExportData}
                className="glass-button flex-1 text-primary-white"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Backup
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setIsExportOpen(false)}
                className="glass-button-outline"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
        <DialogContent className="max-w-md z-[100] bg-black/90 border border-white/20">
          <DialogHeader>
            <DialogTitle className="text-primary-white">Import Data</DialogTitle>
            <DialogDescription className="text-secondary-white">
              Restore data from a previous backup file
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-white/5 p-4 border-dashed border-2 border-white/20 rounded-lg">
              <div className="text-center">
                <Upload className="h-8 w-8 mx-auto mb-2 text-secondary-white" />
                <p className="text-sm text-secondary-white mb-2">
                  Select a backup file (.json)
                </p>
                <Button 
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="glass-button-outline"
                >
                  Choose File
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleImportData}
                  className="hidden"
                />
              </div>
            </div>
            
            <div className="text-xs text-secondary-white">
              <p className="font-medium mb-1">⚠️ Important:</p>
              <p>Importing will replace all current data. Make sure to export a backup first if needed.</p>
            </div>
            
            <Button 
              variant="outline" 
              onClick={() => setIsImportOpen(false)}
              className="glass-button-outline w-full"
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>


      {/* Data Management Buttons */}
      <div className="flex gap-2">
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Button 
            onClick={() => {
              console.log("Export button clicked, setting isExportOpen to true")
              setIsExportOpen(true)
            }}
            className="glass-button text-primary-white"
            size="sm"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </motion.div>
        
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Button 
            onClick={() => {
              console.log("Import button clicked, setting isImportOpen to true")
              setIsImportOpen(true)
            }}
            className="glass-button text-primary-white"
            size="sm"
          >
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
        </motion.div>
      </div>
    </>
  )
}
