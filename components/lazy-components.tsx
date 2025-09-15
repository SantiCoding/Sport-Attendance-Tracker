"use client"

import { lazy, Suspense } from "react"
import { LoadingSkeleton, CardSkeleton } from "./loading-skeleton"

// Lazy load heavy components
export const LazyDataManagement = lazy(() => 
  import("./data-management").then(module => ({ default: module.DataManagement }))
)

export const LazyMenuBar = lazy(() => 
  import("./menu-bar").then(module => ({ default: module.MenuBar }))
)

export const LazyStudentDialog = lazy(() => 
  import("./student-dialog").then(module => ({ default: module.StudentDialog }))
)

export const LazyGroupDialog = lazy(() => 
  import("./group-dialog").then(module => ({ default: module.GroupDialog }))
)

export const LazyTermFinalizationDialog = lazy(() => 
  import("./term-finalization-dialog").then(module => ({ default: module.TermFinalizationDialog }))
)

export const LazyBulkCreateDialog = lazy(() => 
  import("../bulk-create-dialog").then(module => ({ default: module.BulkCreateDialog }))
)

export const LazyBulkGroupSortDialog = lazy(() => 
  import("../bulk-group-sort-dialog").then(module => ({ default: module.BulkGroupSortDialog }))
)

export const LazySmartSorterDialog = lazy(() => 
  import("../smart-sorter-dialog").then(module => ({ default: module.SmartSorterDialog }))
)

export const LazyPasteStudentListDialog = lazy(() => 
  import("../paste-student-list-dialog").then(module => ({ default: module.PasteStudentListDialog }))
)

// Wrapper components with Suspense
export function DataManagementWithSuspense(props: any) {
  return (
    <Suspense fallback={<CardSkeleton />}>
      <LazyDataManagement {...props} />
    </Suspense>
  )
}

export function MenuBarWithSuspense(props: any) {
  return (
    <Suspense fallback={<div className="h-16 bg-white/5 animate-pulse rounded-lg" />}>
      <LazyMenuBar {...props} />
    </Suspense>
  )
}

export function StudentDialogWithSuspense(props: any) {
  return (
    <Suspense fallback={null}>
      <LazyStudentDialog {...props} />
    </Suspense>
  )
}

export function GroupDialogWithSuspense(props: any) {
  return (
    <Suspense fallback={null}>
      <LazyGroupDialog {...props} />
    </Suspense>
  )
}

export function TermFinalizationDialogWithSuspense(props: any) {
  return (
    <Suspense fallback={null}>
      <LazyTermFinalizationDialog {...props} />
    </Suspense>
  )
}

export function BulkCreateDialogWithSuspense(props: any) {
  return (
    <Suspense fallback={null}>
      <LazyBulkCreateDialog {...props} />
    </Suspense>
  )
}

export function BulkGroupSortDialogWithSuspense(props: any) {
  return (
    <Suspense fallback={null}>
      <LazyBulkGroupSortDialog {...props} />
    </Suspense>
  )
}

export function SmartSorterDialogWithSuspense(props: any) {
  return (
    <Suspense fallback={null}>
      <LazySmartSorterDialog {...props} />
    </Suspense>
  )
}

export function PasteStudentListDialogWithSuspense(props: any) {
  return (
    <Suspense fallback={null}>
      <LazyPasteStudentListDialog {...props} />
    </Suspense>
  )
}
