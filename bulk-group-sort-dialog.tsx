"use client"

import { useState } from "react"
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
import { CheckCircle, XCircle } from "lucide-react"

// Types from app/page.tsx (assuming they are accessible or redefined here if needed)
interface Student {
  id: string
  name: string
}

interface Group {
  id: string
  name: string
  studentIds: string[]
}

interface CoachProfile {
  students: Student[]
  groups: Group[]
}

interface BulkGroupSortDialogProps {
  open: boolean
  onClose: () => void
  profileData: CoachProfile | null
  onProcess: (pastedText: string) => { messages: string[]; errors: string[]; success: boolean }
}

export function BulkGroupSortDialog({ open, onClose, profileData, onProcess }: BulkGroupSortDialogProps) {
  const [pastedText, setPastedText] = useState("")
  const [results, setResults] = useState<{ messages: string[]; errors: string[]; success: boolean } | null>(null)

  const handleSubmit = () => {
    if (!profileData) {
      setResults({ messages: [], errors: ["No coach profile loaded."], success: false })
      return
    }
    const processOutput = onProcess(pastedText)
    setResults(processOutput)
  }

  const handleCloseDialog = () => {
    setPastedText("")
    setResults(null)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleCloseDialog}>
      <DialogContent className="max-w-lg w-[90vw]">
        <DialogHeader>
          <DialogTitle>Bulk Group Sort</DialogTitle>
          <DialogDescription>
            Paste group assignments below. Each line should be: Group Name: Student1, Student2, ...
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label htmlFor="group-assignments-paste">Group Assignments</Label>
            <Textarea
              id="group-assignments-paste"
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder={
                "Example:\nGroup A: John Doe, Lucy Smith\nAdvanced Squad: Max Power, Emily Stone\nPrivate - Liam: Liam Green"
              }
              rows={10}
              className="mt-1"
            />
          </div>

          {results && (
            <Alert variant={results.success && results.errors.length === 0 ? "default" : "destructive"}>
              {results.success && results.errors.length === 0 ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              <AlertTitle>
                {results.success && results.errors.length === 0
                  ? "Processing Complete"
                  : results.errors.length > 0
                    ? "Processing Completed with Errors/Warnings"
                    : "Processing Information"}
              </AlertTitle>
              <AlertDescription>
                <ScrollArea className="max-h-32 mt-2 touch-pan-y">
                  {results.messages.length > 0 && (
                    <>
                      <strong className="block mb-1">Messages:</strong>
                      <ul className="list-disc pl-5 space-y-0.5 text-sm">
                        {results.messages.map((msg, i) => (
                          <li key={`msg-${i}`}>{msg}</li>
                        ))}
                      </ul>
                    </>
                  )}
                  {results.errors.length > 0 && (
                    <>
                      <strong className={`block mt-2 mb-1 ${results.messages.length > 0 ? "pt-2 border-t" : ""}`}>
                        Errors/Warnings:
                      </strong>
                      <ul className="list-disc pl-5 space-y-0.5 text-sm">
                        {results.errors.map((err, i) => (
                          <li key={`err-${i}`}>{err}</li>
                        ))}
                      </ul>
                    </>
                  )}
                  {!results.success && results.messages.length === 0 && results.errors.length === 0 && (
                    <p>No input provided or no changes made.</p>
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
          <Button onClick={handleSubmit} disabled={!pastedText.trim()} className="min-h-[44px]">
            Process List
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
