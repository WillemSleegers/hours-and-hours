"use client"

import { useState, useRef, Fragment, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Project, TimeEntry, TimeSlot } from "@/lib/types"
import { Button } from "./ui/button"
import { XIcon, StickyNote } from "lucide-react"
import { NoteDialog } from "./note-dialog"

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
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null)
  const [noteDialogOpen, setNoteDialogOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null)
  const gridRef = useRef<HTMLDivElement>(null)

  // Handle click outside to close action buttons
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (gridRef.current && !gridRef.current.contains(event.target as Node)) {
        setSelectedEntryId(null)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

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

  // Check if this time slot is the start or end of an entry
  const isEntryBoundary = (entry: TimeEntry, time: number) => {
    const isStart = entry.start_time === time
    // Check if this is the last 15-min slot that contains part of the entry
    const isEnd =
      entry.end_time > time && entry.end_time <= time + displayIncrementInHours
    return { isStart, isEnd }
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

  // Handle slot click - add slots or show action buttons
  const handleSlotClick = (time: number) => {
    // Always recalculate entry fresh to avoid stale closures
    const entry = getEntryForTimeSlot(time)

    // If no active project
    if (!activeProjectId) {
      if (entry) {
        // Show buttons for any entry when no project selected
        setSelectedEntryId(selectedEntryId === entry.id ? null : entry.id)
      }
      return
    }

    // Active project IS selected - check if this slot is already filled
    const snappedTime = snapToIncrement(time)
    const slotAlreadyFilled = slots.some(
      (s) =>
        s.time_slot === snappedTime &&
        !s.id.startsWith("temp-")
    )

    if (entry && slotAlreadyFilled) {
      // Clicking on an already-filled slot - show buttons
      setSelectedEntryId(selectedEntryId === entry.id ? null : entry.id)
      return
    }

    // Clicking on empty slot or temp slot - clear selection and add slots
    setSelectedEntryId(null)
    onBlockSelect(snappedTime, snappedTime + incrementInHours)
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
            <div
              className={cn(
                "relative flex items-center justify-between px-3 border-t border-border/30",
                "transition-all duration-150 ease-in-out",
                slotHeight,
                (activeProjectId || entry) && "cursor-pointer",
                // Selection state (dragging)
                isSelected && [
                  "bg-primary/8",
                  getRoundedClasses(isSelectionStart, isSelectionEnd),
                ],
                // Entry styling
                entry && [
                  "text-white font-medium text-sm",
                  getRoundedClasses(isEntryStart, isEntryEnd),
                ]
              )}
              style={{
                backgroundColor: entry
                  ? getProjectColor(entry.project_id)
                  : undefined,
              }}
              onMouseDown={() => !entry && handleMouseDown(time)}
              onMouseEnter={() => handleMouseEnter(time)}
              onClick={() => handleSlotClick(time)}
            >
              {entry && isEntryStart && (
                <>
                  <div className="flex items-center gap-1.5 pointer-events-none">
                    <span className="font-semibold tracking-tight">
                      {getProjectName(entry.project_id)}
                    </span>
                    {entry.note && (
                      <StickyNote className="h-3.5 w-3.5 opacity-80" />
                    )}
                  </div>
                  {selectedEntryId === entry.id && (
                    <div className="flex items-center gap-1 pointer-events-auto">
                      <Button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleNoteEdit(entry)
                        }}
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        title="Add/edit note"
                      >
                        <StickyNote className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation()
                          onEntryDelete(entry.id)
                          setSelectedEntryId(null)
                        }}
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        title="Delete entry"
                      >
                        <XIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
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
        projectName={editingEntry ? getProjectName(editingEntry.project_id) : ""}
      />
    </div>
  )
}
