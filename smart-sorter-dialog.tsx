"use client"

import type React from "react"
import { useState, useMemo, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group" // Using ToggleGroup for view switch
import {
  UserPlus,
  FolderPlus,
  CheckCircle,
  XCircle,
  Info,
  Wand2,
  Upload,
  ChevronDown,
  ChevronRight,
  Eye,
  Edit3,
} from "lucide-react"

// Types (assuming these are defined elsewhere or are the same as before)
interface Student {
  id: string
  name: string
  notes: string
  prepaidSessions: number
  remainingSessions: number
  makeupSessions: number
}

interface Group {
  id: string
  name: string
  type: "group" | "private"
  studentIds: string[]
}

interface CoachProfile {
  students: Student[]
  groups: Group[]
}

interface ParsedGroupPreview {
  name: string
  studentNames: string[]
  isNew: boolean
  id?: string
  type: "group" | "private"
}

interface ParsedStudentPreview {
  name: string
  isNew: boolean
  id?: string
}

export interface BulkPasteOutput {
  groupsToCreate: ParsedGroupPreview[]
  studentsToCreate: ParsedStudentPreview[]
  assignments: { groupName: string; studentName: string }[]
  flatStudents: string[]
  messages: string[]
  errors: string[]
}

interface SmartSorterDialogProps {
  open: boolean
  onClose: () => void
  profileData: CoachProfile | null
  onProcessBulkPaste: (
    pastedText: string,
    groupTypeOverrides: Record<string, "group" | "private">,
    flatStudentsGroupId?: string,
  ) => { messages: string[]; errors: string[]; success: boolean }
  onGetBulkPastePreview: (pastedText: string) => BulkPasteOutput
}

type SorterView = "input" | "preview"

export function SmartSorterDialog({
  open,
  onClose,
  profileData,
  onProcessBulkPaste,
  onGetBulkPastePreview,
}: SmartSorterDialogProps) {
  const [activeSorterView, setActiveSorterView] = useState<SorterView>("input")
  const [bulkPasteText, setBulkPasteText] = useState("")
  const [bulkPastePreview, setBulkPastePreview] = useState<BulkPasteOutput | null>(null)
  const [bulkPasteGroupTypeOverrides, setBulkPasteGroupTypeOverrides] = useState<Record<string, "group" | "private">>(
    {},
  )
  const [flatStudentsGroupId, setFlatStudentsGroupId] = useState<string>("")
  const [bulkResult, setBulkResult] = useState<{ messages: string[]; errors: string[]; success: boolean } | null>(null)
  const [uploadedFileName, setUploadedFileName] = useState<string>("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [isPreviewContentExpanded, setIsPreviewContentExpanded] = useState(false) // For expand/collapse all within preview
  const [expandedPreviewGroups, setExpandedPreviewGroups] = useState<string[]>([])

  const resetFormStates = (keepText = false) => {
    if (!keepText) setBulkPasteText("")
    setBulkPastePreview(null)
    setBulkPasteGroupTypeOverrides({})
    setFlatStudentsGroupId("")
    setBulkResult(null)
    if (!keepText) {
      setUploadedFileName("")
      if (fileInputRef.current) fileInputRef.current.value = "" // Reset file input
    }
    setIsPreviewContentExpanded(false)
    setExpandedPreviewGroups([])
  }

  useEffect(() => {
    if (open) {
      resetFormStates()
      setActiveSorterView("input")
    }
  }, [open])

  const handleGetBulkPastePreview = () => {
    if (!bulkPasteText.trim()) {
      setBulkPastePreview({
        groupsToCreate: [],
        studentsToCreate: [],
        assignments: [],
        flatStudents: [],
        messages: [],
        errors: ["Please paste some text first."],
      })
      setBulkResult(null)
      setActiveSorterView("input") // Stay on input if no text
      return
    }
    const preview = onGetBulkPastePreview(bulkPasteText)
    setBulkPastePreview(preview)
    const initialOverrides: Record<string, "group" | "private"> = {}
    preview.groupsToCreate.forEach((g) => {
      if (g.isNew) {
        initialOverrides[g.name] = g.name.toLowerCase().includes("(private)") ? "private" : "group"
      }
    })
    setBulkPasteGroupTypeOverrides(initialOverrides)
    setBulkResult(null)
    setActiveSorterView("preview") // Switch to preview
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploadedFileName(file.name)
    resetFormStates(true) // Keep text if any, but reset preview

    try {
      let text = await file.text()
      if (file.name.endsWith(".csv")) {
        const lines = text.split("\n").filter((line) => line.trim())
        const parsedLines = lines.map((line) => {
          const columns = line.split(",").map((col) => col.trim().replace(/"/g, ""))
          if (columns.length > 1) {
            const groupName = columns[0]
            const students = columns.slice(1).filter((s) => s)
            return `${groupName}: ${students.join(", ")}`
          }
          return columns[0]
        })
        text = parsedLines.join("\n")
      }
      // .txt files are handled as plain text
      setBulkPasteText(text)
      setTimeout(() => handleGetBulkPastePreview(), 100) // Auto-preview
    } catch (error) {
      setBulkPasteText("")
      setBulkPastePreview({
        groupsToCreate: [],
        studentsToCreate: [],
        assignments: [],
        flatStudents: [],
        messages: [],
        errors: [`Error reading file: ${error instanceof Error ? error.message : "Unknown error"}`],
      })
      setActiveSorterView("input")
    }
  }

  const handleProcessBulkPaste = () => {
    if (!bulkPastePreview || !bulkPasteText.trim()) {
      setBulkResult({ messages: [], errors: ["Please process input to get a preview first."], success: false })
      return
    }
    if (bulkPastePreview.flatStudents.length > 0 && !flatStudentsGroupId) {
      setBulkResult({
        messages: [],
        errors: ["Please select a group for the students without group assignments."],
        success: false,
      })
      return
    }
    const outcome = onProcessBulkPaste(bulkPasteText, bulkPasteGroupTypeOverrides, flatStudentsGroupId)
    setBulkResult(outcome)
    if (outcome.success && outcome.errors.length === 0) {
      resetFormStates()
      setActiveSorterView("input") // Go back to input on full success
    } else {
      // Stay in preview, re-run preview to reflect partial changes
      const updatedPreview = onGetBulkPastePreview(bulkPasteText)
      setBulkPastePreview(updatedPreview)
      setActiveSorterView("preview")
    }
  }

  const handleDialogClose = () => {
    resetFormStates()
    onClose()
  }

  const toggleAllPreviewContent = () => {
    if (!bulkPastePreview) return
    const newState = !isPreviewContentExpanded
    setIsPreviewContentExpanded(newState)
    if (newState) {
      const allGroupNames = Object.keys(
        bulkPastePreview.assignments.reduce((acc, assign) => ({ ...acc, [assign.groupName]: true }), {}),
      )
      setExpandedPreviewGroups(allGroupNames)
    } else {
      setExpandedPreviewGroups([])
    }
  }

  const newGroupsInBulkPreview = useMemo(
    () => bulkPastePreview?.groupsToCreate?.filter((g) => g.isNew) ?? [],
    [bulkPastePreview],
  )
  const newStudentsInBulkPreview = useMemo(
    () => bulkPastePreview?.studentsToCreate?.filter((s) => s.isNew) ?? [],
    [bulkPastePreview],
  )

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="max-w-7xl w-[98vw] h-[95vh] flex flex-col bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 p-0">
        <DialogHeader className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <DialogTitle className="flex items-center text-xl sm:text-2xl">
            <Wand2 className="h-6 w-6 mr-3 text-blue-600" />
            Smart Sorter
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700">
          <ToggleGroup
            type="single"
            value={activeSorterView}
            onValueChange={(value: SorterView) => {
              if (value) setActiveSorterView(value)
            }}
            className="w-full grid grid-cols-2"
            disabled={!bulkPastePreview && activeSorterView === "input"} // Disable toggle to preview if no preview yet
          >
            <ToggleGroupItem
              value="input"
              aria-label="Input View"
              className="flex items-center gap-2 data-[state=on]:bg-blue-50 dark:data-[state=on]:bg-blue-900/30 data-[state=on]:text-blue-700 dark:data-[state=on]:text-blue-300 h-11 text-sm sm:text-base"
            >
              <Edit3 className="h-4 w-4 sm:h-5 sm:w-5" />
              Input
            </ToggleGroupItem>
            <ToggleGroupItem
              value="preview"
              aria-label="Preview View"
              className="flex items-center gap-2 data-[state=on]:bg-blue-50 dark:data-[state=on]:bg-blue-900/30 data-[state=on]:text-blue-700 dark:data-[state=on]:text-blue-300 h-11 text-sm sm:text-base"
              disabled={!bulkPastePreview} // Disable if no preview data
            >
              <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
              Preview
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          {activeSorterView === "input" && (
            <div className="p-6 space-y-6">
              {/* Paste Text Section */}
              <div className="space-y-3">
                <Label htmlFor="bulk-paste-input-main" className="text-base font-medium">
                  Paste Students and Groups
                </Label>
                <Textarea
                  id="bulk-paste-input-main"
                  value={bulkPasteText}
                  onChange={(e) => {
                    setBulkPasteText(e.target.value)
                    setBulkPastePreview(null) // Clear preview when text changes
                    setBulkResult(null)
                  }}
                  placeholder={`Examples:\n\nWith Groups:\nPinehurst: Lucas, Mateo, Sofia\nKingsway (Private): Isla, Mason\n\nOr Flat List:\nLucas\nMateo\nSofia`}
                  rows={12}
                  className="font-mono text-sm resize-none min-h-[200px] sm:min-h-[250px]"
                />
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                  Use "Group Name: Student1, Student2" or a flat list of names.
                </p>
              </div>

              {/* Upload File Section */}
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 text-center bg-gray-50 dark:bg-gray-800">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Upload className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
                <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Or Upload a File
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-3 sm:mb-4 max-w-sm mx-auto">
                  CSV (Group Name, Student1...) or TXT files.
                </p>
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="min-h-[40px] sm:min-h-[44px] px-4 sm:px-6 text-sm sm:text-base"
                >
                  Choose File
                </Button>
                {uploadedFileName && (
                  <p className="text-xs sm:text-sm text-green-600 dark:text-green-400 mt-2 sm:mt-3 font-medium">
                    Uploaded: {uploadedFileName}
                  </p>
                )}
              </div>
              <Button
                onClick={handleGetBulkPastePreview}
                disabled={!bulkPasteText.trim()}
                className="w-full min-h-[48px] text-base font-medium"
              >
                Preview Organization
              </Button>
              {/* Display result if user came back to input after a failed/partial confirm */}
              {bulkResult && (bulkResult.errors.length > 0 || !bulkResult.success) && (
                <Alert variant="destructive" className="mt-4">
                  <XCircle className="h-5 w-5" />
                  <AlertTitle className="text-base">Previous Attempt Issues</AlertTitle>
                  <AlertDescription className="max-h-24 overflow-y-auto mt-2 text-sm">
                    {bulkResult.errors.map((err, i) => (
                      <div key={`resErr-${i}`}>{err}</div>
                    ))}
                    {!bulkResult.success && bulkResult.errors.length === 0 && <div>An unknown error occurred.</div>}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {activeSorterView === "preview" && bulkPastePreview && (
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-600">
                <h3 className="font-semibold text-lg sm:text-xl">Organization Preview</h3>
                {(bulkPastePreview.assignments.length > 0 || newGroupsInBulkPreview.length > 0) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleAllPreviewContent}
                    className="text-sm sm:text-base h-9 px-3"
                  >
                    {isPreviewContentExpanded ? "Collapse All" : "Expand All"}
                  </Button>
                )}
              </div>

              {/* Error Section */}
              {bulkPastePreview.errors.length > 0 && (
                <Alert variant="destructive" className="border-red-200 dark:border-red-800">
                  <XCircle className="h-5 w-5" />
                  <AlertTitle className="text-base">Input Errors</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc pl-5 text-sm sm:text-base mt-2 space-y-1">
                      {bulkPastePreview.errors.map((err, i) => (
                        <li key={`err-${i}`}>{err}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {/* Group Assignments Section */}
              {bulkPastePreview.assignments.length > 0 && (
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <FolderPlus className="h-5 w-5 text-blue-600" />
                    <h4 className="font-semibold text-base sm:text-lg">
                      Group Assignments ({bulkPastePreview.assignments.length})
                    </h4>
                  </div>
                  {Object.entries(
                    bulkPastePreview.assignments.reduce(
                      (acc, assignment) => {
                        if (!acc[assignment.groupName]) acc[assignment.groupName] = []
                        acc[assignment.groupName].push(assignment.studentName)
                        return acc
                      },
                      {} as Record<string, string[]>,
                    ),
                  ).map(([groupName, students]) => {
                    const isNewGroup = newGroupsInBulkPreview.find((g) => g.name === groupName)
                    const isExpanded = isPreviewContentExpanded || expandedPreviewGroups.includes(groupName)
                    return (
                      <div
                        key={groupName}
                        className="border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700/50 shadow-sm overflow-hidden"
                      >
                        <button
                          type="button"
                          className="w-full p-3 sm:p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-600/50 transition-colors focus:outline-none focus:ring-1 focus:ring-blue-500 focus:ring-inset rounded-t-lg"
                          onClick={() =>
                            setExpandedPreviewGroups((prev) =>
                              prev.includes(groupName) ? prev.filter((g) => g !== groupName) : [...prev, groupName],
                            )
                          }
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 sm:gap-3">
                              {isExpanded ? (
                                <ChevronDown className="h-5 w-5 text-gray-400" />
                              ) : (
                                <ChevronRight className="h-5 w-5 text-gray-400" />
                              )}
                              <span className="font-medium text-sm sm:text-base">{groupName}</span>
                              {isNewGroup && (
                                <Badge
                                  variant="outline"
                                  className="text-xs bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700 text-green-700 dark:text-green-300"
                                >
                                  New
                                </Badge>
                              )}
                            </div>
                            <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                              {students.length} student{students.length !== 1 ? "s" : ""}
                            </span>
                          </div>
                        </button>
                        {isExpanded && (
                          <div className="border-t border-gray-200 dark:border-gray-600 p-3 sm:p-4 bg-gray-50 dark:bg-gray-800/30 space-y-2">
                            {students.map((student, i) => {
                              const isNewStudent = newStudentsInBulkPreview.find((s) => s.name === student)
                              return (
                                <div
                                  key={i}
                                  className="flex items-center justify-between py-1.5 px-2 rounded-md bg-white dark:bg-gray-700 border border-gray-100 dark:border-gray-600"
                                >
                                  <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">{student}</span>
                                  {isNewStudent && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300"
                                    >
                                      New
                                    </Badge>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
              {/* Other preview sections (New Groups, Flat Students, Summary) with similar styling adjustments */}
              {newGroupsInBulkPreview.length > 0 && (
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <FolderPlus className="h-5 w-5 text-green-600" />
                    <h4 className="font-semibold text-base sm:text-lg">New Groups ({newGroupsInBulkPreview.length})</h4>
                  </div>
                  {newGroupsInBulkPreview.map((group) => (
                    <div
                      key={group.name}
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 border border-green-200 dark:border-green-700 rounded-lg bg-green-50 dark:bg-green-900/30 gap-2"
                    >
                      <div className="flex items-center gap-2">
                        <FolderPlus className="h-5 w-5 text-green-600 dark:text-green-400" />
                        <span className="font-medium text-sm sm:text-base text-green-800 dark:text-green-200">
                          {group.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3 self-end sm:self-center">
                        <Label
                          htmlFor={`type-${group.name}-pv`}
                          className="text-xs sm:text-sm text-green-700 dark:text-green-300 cursor-pointer"
                        >
                          Private
                        </Label>
                        <Switch
                          id={`type-${group.name}-pv`}
                          checked={bulkPasteGroupTypeOverrides[group.name] === "private"}
                          onCheckedChange={(checked) =>
                            setBulkPasteGroupTypeOverrides((prev) => ({
                              ...prev,
                              [group.name]: checked ? "private" : "group",
                            }))
                          }
                        />
                        <Label
                          htmlFor={`type-${group.name}-pv`}
                          className="text-xs sm:text-sm text-green-700 dark:text-green-300 cursor-pointer"
                        >
                          Group
                        </Label>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {bulkPastePreview.flatStudents.length > 0 && (
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <UserPlus className="h-5 w-5 text-yellow-600" />
                    <h4 className="font-semibold text-base sm:text-lg">
                      Unassigned Students ({bulkPastePreview.flatStudents.length})
                    </h4>
                  </div>
                  <div className="border border-yellow-200 dark:border-yellow-700 rounded-lg bg-yellow-50 dark:bg-yellow-900/30 p-3 sm:p-4">
                    <div className="flex flex-wrap gap-2 mb-3 sm:mb-4">
                      {bulkPastePreview.flatStudents.map((name, i) => (
                        <Badge
                          key={i}
                          variant="outline"
                          className="bg-yellow-100 dark:bg-yellow-800/50 border-yellow-300 dark:border-yellow-600 text-yellow-800 dark:text-yellow-200 text-xs sm:text-sm"
                        >
                          {name}
                        </Badge>
                      ))}
                    </div>
                    <Label htmlFor="flat-students-group-pv" className="text-xs sm:text-sm font-medium">
                      Assign to Group
                    </Label>
                    <Select value={flatStudentsGroupId} onValueChange={setFlatStudentsGroupId}>
                      <SelectTrigger className="bg-white dark:bg-gray-700 border-yellow-300 dark:border-yellow-600 h-10 text-xs sm:text-sm mt-1">
                        <SelectValue placeholder="Select group" />
                      </SelectTrigger>
                      <SelectContent>
                        {profileData?.groups.map((g) => (
                          <SelectItem key={g.id} value={g.id} className="text-xs sm:text-sm">
                            {g.name} ({g.type})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
              {newStudentsInBulkPreview.length > 0 && bulkPastePreview.assignments.length === 0 && (
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <UserPlus className="h-5 w-5 text-blue-600" />
                    <h4 className="font-semibold text-base sm:text-lg">
                      New Students ({newStudentsInBulkPreview.length})
                    </h4>
                  </div>
                  <div className="border border-blue-200 dark:border-blue-700 rounded-lg bg-blue-50 dark:bg-blue-900/30 p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {newStudentsInBulkPreview.map((s) => (
                      <div
                        key={s.name}
                        className="flex items-center gap-2 p-2 bg-white dark:bg-blue-800/30 rounded border border-blue-100 dark:border-blue-600"
                      >
                        <UserPlus className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <span className="text-xs sm:text-sm text-blue-800 dark:text-blue-200">{s.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {bulkPastePreview.messages.length > 0 && (
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Info className="h-5 w-5 text-blue-600" />
                    <h4 className="font-semibold text-base sm:text-lg">Summary</h4>
                  </div>
                  <div className="border border-blue-200 dark:border-blue-700 rounded-lg bg-blue-50 dark:bg-blue-900/30 p-3 sm:p-4">
                    <ul className="list-disc pl-4 sm:pl-5 text-xs sm:text-sm space-y-1 text-blue-800 dark:text-blue-200">
                      {bulkPastePreview.messages.map((msg, i) => (
                        <li key={`info-${i}`}>{msg}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
              {newGroupsInBulkPreview.length === 0 &&
                newStudentsInBulkPreview.length === 0 &&
                bulkPastePreview.flatStudents.length === 0 &&
                bulkPastePreview.assignments.length === 0 &&
                bulkPastePreview.errors.length === 0 && (
                  <div className="text-center py-10">
                    <CheckCircle className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">All Set!</h3>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                      No new entities or assignments. All data matches existing records.
                    </p>
                  </div>
                )}
              <Button
                onClick={handleProcessBulkPaste}
                disabled={
                  bulkPastePreview.errors.length > 0 ||
                  (newGroupsInBulkPreview.length === 0 &&
                    newStudentsInBulkPreview.length === 0 &&
                    bulkPastePreview.assignments.length === 0 &&
                    bulkPastePreview.flatStudents.length === 0) ||
                  (bulkPastePreview.flatStudents.length > 0 && !flatStudentsGroupId)
                }
                className="w-full min-h-[48px] text-base font-medium mt-4"
              >
                Confirm & Organize
              </Button>
              {bulkResult && (bulkResult.errors.length > 0 || !bulkResult.success) && (
                <Alert variant="destructive" className="mt-4">
                  <XCircle className="h-5 w-5" />
                  <AlertTitle className="text-base">Confirmation Issues</AlertTitle>
                  <AlertDescription className="max-h-24 overflow-y-auto mt-2 text-sm">
                    {bulkResult.errors.map((err, i) => (
                      <div key={`confirmErr-${i}`}>{err}</div>
                    ))}
                    {!bulkResult.success && bulkResult.errors.length === 0 && <div>An unknown error occurred.</div>}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
          {activeSorterView === "preview" && !bulkPastePreview && (
            <div className="p-6 text-center text-gray-500 dark:text-gray-400">
              <p>No preview data available. Please go to the Input view to add data.</p>
            </div>
          )}
        </div>

        <DialogFooter className="px-6 py-3 border-t border-gray-200 dark:border-gray-700">
          <Button variant="outline" onClick={handleDialogClose} className="min-h-[44px] px-6 text-sm sm:text-base">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
