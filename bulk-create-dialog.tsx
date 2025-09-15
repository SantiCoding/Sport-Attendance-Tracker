"use client"

import { useState, useMemo, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Info, UserPlus, FolderPlus } from "lucide-react"

// Types (assuming they are accessible or redefined here if needed)
interface Student {
  id: string
  name: string
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

// Types for preview data
interface ParsedGroup {
  name: string
  studentNames: string[]
  isNew: boolean
  id?: string // Existing group ID
  type: "group" | "private" // For new groups, user can toggle this
}

interface ParsedStudent {
  name: string
  isNew: boolean
  id?: string // Existing student ID
}

export interface BulkCreatePreview {
  groups: ParsedGroup[]
  students: ParsedStudent[]
  assignments: { groupName: string; studentName: string }[]
  messages: string[]
  errors: string[]
}

interface BulkCreateDialogProps {
  open: boolean
  onClose: () => void
  profileData: CoachProfile | null
  onProcessPreview: (pastedText: string) => BulkCreatePreview
  onFinalizeCreate: (
    previewData: BulkCreatePreview,
    groupTypeOverrides: Record<string, "group" | "private">,
  ) => { messages: string[]; errors: string[]; success: boolean }
}

export function BulkCreateDialog({
  open,
  onClose,
  profileData,
  onProcessPreview,
  onFinalizeCreate,
}: BulkCreateDialogProps) {
  const [pastedText, setPastedText] = useState("")
  const [previewData, setPreviewData] = useState<BulkCreatePreview | null>(null)
  const [finalResults, setFinalResults] = useState<{ messages: string[]; errors: string[]; success: boolean } | null>(
    null,
  )
  const [groupTypeOverrides, setGroupTypeOverrides] = useState<Record<string, "group" | "private">>({})

  useEffect(() => {
    // Reset overrides when preview data changes (e.g., new paste)
    setGroupTypeOverrides({})
  }, [previewData])

  const handleProcessInput = () => {
    if (!profileData) {
      setPreviewData({
        groups: [],
        students: [],
        assignments: [],
        messages: [],
        errors: ["No coach profile loaded."],
      })
      return
    }
    const newPreview = onProcessPreview(pastedText)
    setPreviewData(newPreview)
    setFinalResults(null) // Clear previous final results

    // Initialize type overrides for new groups
    const initialOverrides: Record<string, "group" | "private"> = {}
    newPreview.groups.forEach((g) => {
      if (g.isNew) {
        initialOverrides[g.name] = g.type // Default to 'group' or whatever parser sets
      }
    })
    setGroupTypeOverrides(initialOverrides)
  }

  const handleFinalize = () => {
    if (!previewData) return
    const results = onFinalizeCreate(previewData, groupTypeOverrides)
    setFinalResults(results)
  }

  const handleCloseDialog = () => {
    setPastedText("")
    setPreviewData(null)
    setFinalResults(null)
    setGroupTypeOverrides({})
    onClose()
  }

  const newGroupsToCreate = useMemo(() => previewData?.groups?.filter((g) => g.isNew) ?? [], [previewData])
  const newStudentsToCreate = useMemo(() => previewData?.students?.filter((s) => s.isNew) ?? [], [previewData])

  return (
    <Dialog open={open} onOpenChange={handleCloseDialog}>
      <DialogContent className="max-w-2xl w-[90vw]">
        <DialogHeader>
          <DialogTitle>Bulk Create Groups & Students</DialogTitle>
          <DialogDescription>
            Paste assignments: Group Name: Student1, Student2... New groups/students will be created.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2 max-h-[70vh] flex flex-col">
          <Textarea
            value={pastedText}
            onChange={(e) => {
              setPastedText(e.target.value)
              setPreviewData(null) // Clear preview on text change
              setFinalResults(null)
            }}
            placeholder={"Example:\nPinehurst: Lucas, Mateo, Sophia\nKingsway: Ella, Mason\nPrivate - Liam: Liam Green"}
            rows={6}
            className="mt-1"
          />
          <Button onClick={handleProcessInput} disabled={!pastedText.trim()} className="w-full sm:w-auto self-end">
            Process Input & Preview
          </Button>

          {previewData && !finalResults && (
            <ScrollArea className="flex-grow border rounded-md p-3 mt-2 touch-pan-y">
              <div className="space-y-4">
                {previewData.errors.length > 0 && (
                  <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertTitle>Input Errors/Warnings</AlertTitle>
                    <AlertDescription>
                      <ul className="list-disc pl-5 text-xs">
                        {previewData.errors.map((err, i) => (
                          <li key={`err-${i}`}>{err}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {newGroupsToCreate.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm mb-1.5 flex items-center">
                      <FolderPlus className="h-4 w-4 mr-1.5" />
                      New Groups to Create ({newGroupsToCreate.length})
                    </h4>
                    <div className="space-y-1.5">
                      {newGroupsToCreate.map((group) => (
                        <div
                          key={group.name}
                          className="flex items-center justify-between p-2 border rounded-md bg-green-50 text-xs"
                        >
                          <span>{group.name}</span>
                          <div className="flex items-center gap-2">
                            <Label htmlFor={`group-type-${group.name}`} className="text-xs">
                              Private
                            </Label>
                            <Switch
                              id={`group-type-${group.name}`}
                              checked={groupTypeOverrides[group.name] === "private"}
                              onCheckedChange={(checked) => {
                                setGroupTypeOverrides((prev) => ({
                                  ...prev,
                                  [group.name]: checked ? "private" : "group",
                                }))
                              }}
                              className="data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-gray-300 h-5 w-9"
                            />
                            <Label htmlFor={`group-type-${group.name}`} className="text-xs">
                              Group
                            </Label>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {newStudentsToCreate.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm mb-1.5 flex items-center">
                      <UserPlus className="h-4 w-4 mr-1.5" />
                      New Students to Create ({newStudentsToCreate.length})
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {newStudentsToCreate.map((student) => (
                        <Badge key={student.name} variant="outline" className="bg-blue-50 text-xs">
                          {student.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {previewData.messages.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm mb-1.5 flex items-center">
                      <Info className="h-4 w-4 mr-1.5" />
                      Additional Information
                    </h4>
                    <ul className="list-disc pl-5 text-xs space-y-0.5">
                      {previewData.messages.map((msg, i) => (
                        <li key={`info-${i}`}>{msg}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {newGroupsToCreate.length === 0 &&
                  newStudentsToCreate.length === 0 &&
                  previewData.errors.length === 0 &&
                  previewData.messages.length === 0 && (
                    <p className="text-xs text-gray-500 text-center py-2">
                      No new groups or students to create based on input. All entities might already exist or input is
                      empty/invalid.
                    </p>
                  )}
              </div>
            </ScrollArea>
          )}

          {finalResults && (
            <Alert variant={finalResults.success && finalResults.errors.length === 0 ? "default" : "destructive"}>
              {finalResults.success && finalResults.errors.length === 0 ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              <AlertTitle>
                {finalResults.success && finalResults.errors.length === 0
                  ? "Creation Complete"
                  : "Creation Completed with Errors/Warnings"}
              </AlertTitle>
              <AlertDescription>
                <ScrollArea className="max-h-28 mt-1 touch-pan-y">
                  {finalResults.messages.length > 0 && (
                    <>
                      <strong className="block mb-0.5 text-xs">Messages:</strong>
                      <ul className="list-disc pl-4 space-y-0.5 text-xs">
                        {finalResults.messages.map((msg, i) => (
                          <li key={`final-msg-${i}`}>{msg}</li>
                        ))}
                      </ul>
                    </>
                  )}
                  {finalResults.errors.length > 0 && (
                    <>
                      <strong
                        className={`block mt-1.5 mb-0.5 text-xs ${finalResults.messages.length > 0 ? "pt-1.5 border-t" : ""}`}
                      >
                        Errors/Warnings:
                      </strong>
                      <ul className="list-disc pl-4 space-y-0.5 text-xs">
                        {finalResults.errors.map((err, i) => (
                          <li key={`final-err-${i}`}>{err}</li>
                        ))}
                      </ul>
                    </>
                  )}
                </ScrollArea>
              </AlertDescription>
            </Alert>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleCloseDialog} className="min-h-[44px]">
            Close
          </Button>
          <Button
            onClick={handleFinalize}
            disabled={
              !previewData ||
              finalResults !== null ||
              (newGroupsToCreate.length === 0 &&
                newStudentsToCreate.length === 0 &&
                previewData.assignments.length === 0)
            }
            className="min-h-[44px]"
          >
            Create All & Assign
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
