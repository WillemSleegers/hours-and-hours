"use client"

import { useState, useRef, useCallback, Fragment } from "react"
import { cn } from "@/lib/utils"
import { Project, TimeEntry, TimeSlot } from "@/lib/types"
import { Button } from "./ui/button"
import { XIcon } from "lucide-react"

interface TimeGridProps {
  slots: TimeSlot[]
  entries: TimeEntry[]
  projects: Project[]
  onBlockSelect: (startTime: number, endTime: number) => void
  onEntryDelete: (entryId: string) => void
  onSlotsDelete: (startTime: number, endTime: number) => void
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
  onSlotsDelete,
  activeProjectId,
  dayStartHour = 0,
  dayEndHour = 24,
  timeIncrement = 60,
}: TimeGridProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState<number | null>(null)
  const [dragEnd, setDragEnd] = useState<number | null>(null)
  const [hoveredTime, setHoveredTime] = useState<number | null>(null)
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null)
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

  const handleMouseUp = useCallback(() => {
    if (isDragging && dragStart !== null && dragEnd !== null) {
      const start = Math.min(dragStart, dragEnd)
      const end = Math.max(dragStart, dragEnd) + incrementInHours
      onBlockSelect(start, end)
      setIsDragging(false)
      setDragStart(null)
      setDragEnd(null)
    }
  }, [isDragging, dragStart, dragEnd, incrementInHours, onBlockSelect])

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

  // Check if a slot should be highlighted based on hover and increment
  // When hovering, highlight the full increment range (e.g., 2 slots for 30min)
  const isSlotHovered = (time: number) => {
    if (!hoveredTime || isDragging) return false
    // Only show hover on empty slots when there's an active project
    // OR show hover on any slot (including entries) when there's an active project
    if (!activeProjectId) return false
    // Snap the hovered time to start of increment
    const snappedHover = snapToIncrement(hoveredTime)
    // Check if this slot is in the increment range
    return time >= snappedHover && time < snappedHover + incrementInHours
  }

  // Check if this is the start or end of the hover range (for rounded corners)
  const getHoverBoundary = (time: number) => {
    if (!isSlotHovered(time)) return { isStart: false, isEnd: false }
    const snappedHover = snapToIncrement(hoveredTime!)
    const isStart = time === snappedHover
    const isEnd =
      time >= snappedHover + incrementInHours - displayIncrementInHours
    return { isStart, isEnd }
  }

  // Handle slot click - toggle slots (add if empty, remove if filled)
  const handleSlotClick = (time: number, entry?: TimeEntry) => {
    // If no active project and clicking on an entry, toggle selection for deletion
    if (!activeProjectId && entry) {
      setSelectedEntryId(selectedEntryId === entry.id ? null : entry.id)
      return
    }

    // If no active project and no entry, clear selection
    if (!activeProjectId) {
      setSelectedEntryId(null)
      return
    }

    // Snap to the clicked 15-min slot
    const snappedTime = snapToIncrement(time)

    // Check if ALL slots in the increment range belong to the active project
    const slotsInRange: number[] = []
    for (let t = snappedTime; t < snappedTime + incrementInHours; t += 0.25) {
      slotsInRange.push(Math.round(t * 4) / 4)
    }

    const existingSlotsForProject = slotsInRange.filter((t) =>
      slots.some(
        (s) =>
          s.time_slot === t &&
          s.project_id === activeProjectId &&
          !s.id.startsWith("temp-") // Ignore temp slots
      )
    )

    console.log("handleSlotClick", {
      time,
      snappedTime,
      activeProjectId,
      slotsInRange,
      existingSlotsForProject,
      incrementInHours,
      allSlotsExist: existingSlotsForProject.length === slotsInRange.length,
    })

    // Only delete if ALL slots in the range are filled by the active project
    // Otherwise, add the missing slots (allows partial fills)
    if (existingSlotsForProject.length === slotsInRange.length) {
      // All slots exist - delete them (toggle off)
      console.log(
        "Calling onSlotsDelete",
        snappedTime,
        snappedTime + incrementInHours
      )
      onSlotsDelete(snappedTime, snappedTime + incrementInHours)
    } else {
      // Some or no slots exist - add missing slots (fill or partial fill)
      console.log(
        "Calling onBlockSelect",
        snappedTime,
        snappedTime + incrementInHours
      )
      onBlockSelect(snappedTime, snappedTime + incrementInHours)
    }
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
      className="select-none grid grid-cols-[4rem_1fr] gap-x-2 py-2"
    >
      {timeSlots.map((time) => {
        const entry = getEntryForTimeSlot(time)
        const isSelected = isTimeSlotSelected(time)
        const isHovered = isSlotHovered(time)
        const { isStart: isHoverStart, isEnd: isHoverEnd } =
          getHoverBoundary(time)
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
            <div className="flex items-start justify-end pr-2">
              <span className="text-xs font-medium text-muted-foreground/70 -translate-y-1/2">
                {formatTime(time)}
              </span>
            </div>

            {/* Time slot */}
            <div
              className={cn(
                "relative flex items-center justify-between px-3 mx-0.5 border-t border-border/30",
                "transition-all duration-150 ease-in-out",
                slotHeight,
                (activeProjectId || entry) && "cursor-pointer",
                // Empty slot hover (for adding)
                !entry && isHovered && [
                  "bg-accent/30",
                  getRoundedClasses(isHoverStart, isHoverEnd),
                ],
                // Entry hover (for removing) - darken to indicate deletion
                entry && isHovered && "brightness-75",
                // Selection state (dragging)
                isSelected && [
                  "bg-primary/8",
                  getRoundedClasses(isSelectionStart, isSelectionEnd),
                ],
                // Entry styling
                entry && [
                  "text-white font-medium text-sm",
                  getRoundedClasses(isEntryStart, isEntryEnd),
                ],
                // Entry selection (for delete button)
                entry &&
                  selectedEntryId === entry.id &&
                  !activeProjectId &&
                  "brightness-90"
              )}
              style={{
                backgroundColor: entry
                  ? getProjectColor(entry.project_id)
                  : undefined,
              }}
              onMouseDown={() => !entry && handleMouseDown(time)}
              onMouseEnter={() => {
                if (activeProjectId || entry) {
                  handleMouseEnter(time)
                  setHoveredTime(time)
                }
              }}
              onMouseMove={() => {
                if (activeProjectId || entry) {
                  setHoveredTime(time)
                }
              }}
              onMouseLeave={() => setHoveredTime(null)}
              onClick={() => handleSlotClick(time, entry || undefined)}
            >
              {entry && isEntryStart && (
                <>
                  <span className="font-semibold tracking-tight pointer-events-none">
                    {getProjectName(entry.project_id)}
                  </span>
                  {selectedEntryId === entry.id && !activeProjectId && (
                    <Button
                      onClick={(e) => {
                        e.stopPropagation()
                        onEntryDelete(entry.id)
                        setSelectedEntryId(null)
                      }}
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                    >
                      <XIcon className="h-4 w-4" />
                    </Button>
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
    </div>
  )
}
