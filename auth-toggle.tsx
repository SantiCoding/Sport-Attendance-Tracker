"use client"
import { Badge } from "@/components/ui/badge"
import { HardDrive } from "lucide-react"

interface AuthToggleProps {
  currentCoach?: string
  onEditProfile?: () => void
}

export function AuthToggle({ currentCoach, onEditProfile }: AuthToggleProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        <HardDrive className="h-4 w-4 text-gray-600" />
        <Badge variant="secondary" className="text-xs">
          Local Storage
        </Badge>
      </div>
    </div>
  )
}
