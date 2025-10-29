"use client"

import { useState, useRef, Fragment, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Project, TimeEntry, TimeSlot } from "@/lib/types"
import { XIcon } from "lucide-react"
import { NoteDialog } from "./note-dialog"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"

interface TimeGridProps {
  slots: TimeSlot[]
  entries: TimeEntry[]
  projects: Project[]
  onBlockSelect: (startTime: number, endTime: number) => void
  onEntryDelete: (entryId: string) => void
  onNoteUpdate: (entryId: string, note: string) => void
  activeProjectId: string | null
  dayStartHour?: number
  dayEndHour?: number
  timeIncrement?: 15 | 30 | 60
}

export function TimeGrid({
  slots,
  entries,
  projects,
  onBlockSelect,
  onEntryDelete,
  onNoteUpdate,
  activeProjectId,
  dayStartHour = 0,
  dayEndHour = 24,
  timeIncrement = 60,
}: TimeGridProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState<number | null>(null)
  const [dragEnd, setDragEnd] = useState<number | null>(null)
  const [noteDialogOpen, setNoteDialogOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null)
  const gridRef = useRef<HTMLDivElement>(null)

  // Always display 15-minute slots for visual precision
  const displayIncrementInHours = 0.25 // 15 minutes
  const totalSlots = Math.floor(
    (dayEndHour - dayStartHour) / displayIncrementInHours
  )
  const timeSlots = Array.from(
    { length: totalSlots },
    (_, i) => dayStartHour + i * displayIncrementInHours
  )

  // User's increment setting controls selection granularity
  const incrementInHours = timeIncrement / 60

  const formatTime = (time: number) => {
    const hours = Math.floor(time)
    const minutes = Math.round((time - hours) * 60)
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}`
  }

  // Snap to the clicked 15-min slot (always start from where you clicked)
  // For 30min increment: clicking 9:15 selects 9:15-9:45, clicking 9:45 selects 9:45-10:15
  const snapToIncrement = (time: number) => {
    // Just round to nearest 15-min slot - don't floor to increment boundary
    return Math.round(time * 4) / 4
  }

  const handleMouseDown = (time: number) => {
    if (!activeProjectId) return // Don't allow dragging without active project
    const snappedTime = snapToIncrement(time)
    setIsDragging(true)
    setDragStart(snappedTime)
    setDragEnd(snappedTime)
  }

  const handleMouseEnter = (time: number) => {
    if (isDragging) {
      const snappedTime = snapToIncrement(time)
      setDragEnd(snappedTime)
    }
  }

  const handleMouseUp = () => {
    if (isDragging && dragStart !== null && dragEnd !== null) {
      const start = Math.min(dragStart, dragEnd)
      const end = Math.max(dragStart, dragEnd) + incrementInHours
      onBlockSelect(start, end)
      setIsDragging(false)
      setDragStart(null)
      setDragEnd(null)
    }
  }

  const isTimeSlotSelected = (time: number) => {
    if (!isDragging || dragStart === null || dragEnd === null) return false
    const start = Math.min(dragStart, dragEnd)
    const end = Math.max(dragStart, dragEnd) + incrementInHours
    return time >= start && time < end
  }

  // Check if this is the start or end of the selection range (for rounded corners)
  const getSelectionBoundary = (time: number) => {
    if (!isTimeSlotSelected(time)) return { isStart: false, isEnd: false }
    const start = Math.min(dragStart!, dragEnd!)
    const end = Math.max(dragStart!, dragEnd!) + incrementInHours
    const isStart = time === start
    const isEnd = time >= end - displayIncrementInHours
    return { isStart, isEnd }
  }

  const getEntryForTimeSlot = (time: number) => {
    return entries.find(
      (entry) => time >= entry.start_time && time < entry.end_time
    )
  }

  // All 15-minute slots have the same height
  const slotHeight = "h-10"

  const handleNoteEdit = (entry: TimeEntry) => {
    setEditingEntry(entry)
    setNoteDialogOpen(true)
  }

  const handleNoteSave = (note: string) => {
    if (editingEntry) {
      onNoteUpdate(editingEntry.id, note)
    }
  }

  // Handle slot click - add slots or show context menu
  const handleSlotClick = (time: number) => {
    const entry = getEntryForTimeSlot(time)

    // If clicking on an entry, don't do anything (context menu handles it)
    if (entry) return

    // Only add slots if there's an active project
    if (!activeProjectId) return

    const snappedTime = snapToIncrement(time)
    onBlockSelect(snappedTime, snappedTime + incrementInHours)
  }

  // Check if this time slot is the start or end of an entry
  const isEntryBoundary = (entry: TimeEntry, time: number) => {
    const isStart = entry.start_time === time
    const isEnd =
      entry.end_time > time && entry.end_time <= time + displayIncrementInHours
    return { isStart, isEnd }
  }

  const getProjectColor = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId)
    return project?.color || "#94a3b8"
  }

  const getProjectName = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId)
    return project?.name || "Unknown"
  }

  return (
    <div
      ref={gridRef}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      className="select-none grid grid-cols-[auto_1fr] gap-x-2 py-2"
    >
      {timeSlots.map((time) => {
        const entry = getEntryForTimeSlot(time)
        const isSelected = isTimeSlotSelected(time)
        const { isStart: isSelectionStart, isEnd: isSelectionEnd } =
          getSelectionBoundary(time)
        const { isStart: isEntryStart, isEnd: isEntryEnd } = entry
          ? isEntryBoundary(entry, time)
          : { isStart: false, isEnd: false }

        // Helper to get rounded corner classes
        const getRoundedClasses = (isStart: boolean, isEnd: boolean) => {
          if (isStart && isEnd) return "rounded-lg"
          if (isStart) return "rounded-t-lg"
          if (isEnd) return "rounded-b-lg"
          return ""
        }

        return (
          <Fragment key={time}>
            {/* Time label */}
            <div className="flex items-start justify-end pr-1">
              <span className="text-xs font-medium text-muted-foreground/70 -translate-y-1/2">
                {formatTime(time)}
              </span>
            </div>

            {/* Time slot */}
            {entry ? (
              <ContextMenu>
                <ContextMenuTrigger asChild>
                  <div
                    className={cn(
                      "relative flex items-center justify-between px-3 border-t border-border/30",
                      "transition-all duration-150 ease-in-out",
                      slotHeight,
                      "cursor-pointer",
                      // Selection state (dragging)
                      isSelected && [
                        "bg-primary/8",
                        getRoundedClasses(isSelectionStart, isSelectionEnd),
                      ],
                      // Entry styling
                      "text-white font-medium text-sm",
                      getRoundedClasses(isEntryStart, isEntryEnd)
                    )}
                    style={{
                      backgroundColor: getProjectColor(entry.project_id),
                    }}
                    onContextMenu={(e) => {
                      e.stopPropagation()
                    }}
                    onClick={(e) => {
                      e.stopPropagation()
                      // Trigger context menu on left click
                      e.currentTarget.dispatchEvent(
                        new PointerEvent('contextmenu', {
                          bubbles: true,
                          cancelable: true,
                          clientX: e.clientX,
                          clientY: e.clientY,
                        })
                      )
                    }}
                  >
                    {isEntryStart && (
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        <span className="font-semibold tracking-tight shrink-0">
                          {getProjectName(entry.project_id)}
                        </span>
                        {entry.note && (
                          <span className="text-sm opacity-70 truncate">
                            {entry.note}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </ContextMenuTrigger>
                <ContextMenuContent>
                  <ContextMenuItem
                    onClick={() => {
                      if (!noteDialogOpen) {
                        handleNoteEdit(entry)
                      }
                    }}
                  >
                    Add note
                  </ContextMenuItem>
                  <ContextMenuItem
                    onClick={() => {
                      onEntryDelete(entry.id)
                    }}
                  >
                    <XIcon className="mr-2 h-4 w-4" />
                    Delete
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            ) : (
              <div
                className={cn(
                  "relative flex items-center justify-between px-3 border-t border-border/30",
                  "transition-all duration-150 ease-in-out",
                  slotHeight,
                  activeProjectId && "cursor-pointer",
                  // Selection state (dragging)
                  isSelected && [
                    "bg-primary/8",
                    getRoundedClasses(isSelectionStart, isSelectionEnd),
                  ]
                )}
                onMouseDown={() => handleMouseDown(time)}
                onMouseEnter={() => handleMouseEnter(time)}
                onClick={() => handleSlotClick(time)}
              />
            )}
          </Fragment>
        )
      })}

      {/* Final time marker */}
      <div className="col-start-1 flex items-start justify-end pr-2">
        <span className="text-xs font-medium text-muted-foreground/70 -translate-y-1/2">
          {formatTime(dayEndHour)}
        </span>
      </div>
      <div className="border-t border-border/30" />

      <NoteDialog
        open={noteDialogOpen}
        onClose={() => setNoteDialogOpen(false)}
        onSave={handleNoteSave}
        initialNote={editingEntry?.note}
        projectName={
          editingEntry ? getProjectName(editingEntry.project_id) : ""
        }
      />
    </div>
  )
}
