"use client"

import { useState, Fragment, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import { Project, TimeSlot } from "@/lib/types"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Trash2 } from "lucide-react"

interface TimeGridProps {
  slots: TimeSlot[]
  projects: Project[]
  onSlotToggle: (projectId: string, timeSlot: number) => void
  onSlotDelete: (slotId: string) => void
  onNoteUpdate: (slotId: string, note: string) => void
  activeProjectId: string | null
  dayStartHour?: number
  dayEndHour?: number
}

export function TimeGrid({
  slots,
  projects,
  onSlotToggle,
  onSlotDelete,
  onNoteUpdate,
  activeProjectId,
  dayStartHour = 0,
  dayEndHour = 24,
}: TimeGridProps) {
  const [selectedSlotTime, setSelectedSlotTime] = useState<number | null>(null)
  const [localNotes, setLocalNotes] = useState<Record<string, string>>({})
  const debounceTimers = useRef<Record<string, NodeJS.Timeout>>({})

  // Debounced note update
  const debouncedNoteUpdate = (slotId: string, note: string) => {
    // Clear existing timer for this slot
    if (debounceTimers.current[slotId]) {
      clearTimeout(debounceTimers.current[slotId])
    }

    // Set new timer
    debounceTimers.current[slotId] = setTimeout(() => {
      onNoteUpdate(slotId, note)
      delete debounceTimers.current[slotId]
    }, 500) // 500ms debounce delay
  }

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      Object.values(debounceTimers.current).forEach(timer => clearTimeout(timer))
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

  const formatTime = (time: number) => {
    const hours = Math.floor(time)
    const minutes = Math.round((time - hours) * 60)
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}`
  }

  // Snap to the clicked 15-min slot
  const snapToIncrement = (time: number) => {
    return Math.round(time * 4) / 4
  }

  const getSlotForTime = (time: number) => {
    return slots.find((slot) => slot.time_slot === time)
  }

  // All 15-minute slots have the same height
  const slotHeight = "h-10"

  // Handle slot click - create slot or toggle selection
  const handleSlotClick = (time: number) => {
    const snappedTime = snapToIncrement(time)
    const slot = getSlotForTime(snappedTime)

    if (activeProjectId) {
      // Project is active
      if (slot) {
        if (slot.project_id === activeProjectId) {
          // Same project: toggle expandable section
          setSelectedSlotTime(selectedSlotTime === snappedTime ? null : snappedTime)
        }
        // Different project: do nothing
      } else {
        // Empty slot: add slot but don't select it
        onSlotToggle(activeProjectId, snappedTime)
        // Don't set selectedSlotTime - user needs to click again to open it
      }
    } else {
      // No active project: toggle expandable section if slot exists
      if (slot) {
        setSelectedSlotTime(selectedSlotTime === snappedTime ? null : snappedTime)
      }
    }
  }

  // Check if this is the first slot in a visual group (for showing project name)
  const isFirstInGroup = (time: number, slot: TimeSlot) => {
    const prevTime = time - 0.25
    const prevSlot = getSlotForTime(prevTime)
    return !prevSlot || prevSlot.project_id !== slot.project_id
  }

  const getProjectColor = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId)
    return project?.color || "#94a3b8"
  }

  const getProjectName = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId)
    return project?.name || "Unknown"
  }

  // Delete all consecutive slots for the same project (delete entire entry)
  const handleDeleteEntry = (slot: TimeSlot) => {
    const projectId = slot.project_id
    const slotTime = slot.time_slot

    // Find all consecutive slots with the same project
    const slotsToDelete: TimeSlot[] = []

    // Go backwards from current slot
    let checkTime = slotTime
    while (true) {
      const checkSlot = getSlotForTime(checkTime)
      if (checkSlot && checkSlot.project_id === projectId) {
        slotsToDelete.unshift(checkSlot)
        checkTime -= 0.25
      } else {
        break
      }
    }

    // Go forwards from current slot (skip the current one as it's already added)
    checkTime = slotTime + 0.25
    while (true) {
      const checkSlot = getSlotForTime(checkTime)
      if (checkSlot && checkSlot.project_id === projectId) {
        slotsToDelete.push(checkSlot)
        checkTime += 0.25
      } else {
        break
      }
    }

    // Delete all slots in the entry
    slotsToDelete.forEach(s => onSlotDelete(s.id))
    setSelectedSlotTime(null)
  }

  // Clear selection when project is cleared
  useEffect(() => {
    if (!activeProjectId) {
      setSelectedSlotTime(null)
    }
  }, [activeProjectId])

  return (
    <div className="select-none grid grid-cols-[auto_1fr] gap-x-2 py-2">
      {timeSlots.map((time) => {
        const slot = getSlotForTime(time)
        const isFirst = slot ? isFirstInGroup(time, slot) : false
        const isSelected = selectedSlotTime === time && slot !== undefined
        const showButtons = isSelected

        return (
          <Fragment key={time}>
            {/* Time label */}
            <div className="flex items-start justify-end pr-1">
              <span className="text-xs font-medium text-muted-foreground/70 -translate-y-1/2">
                {formatTime(time)}
              </span>
            </div>

            {/* Time slot */}
            <div className="relative border-t border-border/30">
              {/* Slot content - clickable bar */}
              <div
                className={cn(
                  "flex items-center justify-between gap-1.5 px-3",
                  slotHeight,
                  (activeProjectId || slot) && "cursor-pointer",
                  slot && "text-sm rounded-lg"
                )}
                style={
                  slot
                    ? {
                        backgroundColor: `${getProjectColor(
                          slot.project_id
                        )}50`,
                        color: getProjectColor(slot.project_id),
                      }
                    : undefined
                }
                onClick={() => handleSlotClick(time)}
              >
                {slot && isFirst && (
                  <span className="font-bold tracking-tight shrink-0">
                    {getProjectName(slot.project_id)}
                  </span>
                )}
                {slot && isSelected && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation()
                        }}
                        className="h-6 w-6 p-0 rounded shrink-0 ml-auto"
                        style={{
                          backgroundColor: `${getProjectColor(slot.project_id)}30`,
                          color: getProjectColor(slot.project_id),
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          onSlotDelete(slot.id)
                          setSelectedSlotTime(null)
                        }}
                      >
                        Delete slot
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteEntry(slot)
                        }}
                      >
                        Delete entry
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>

              {/* Expandable section - note input */}
              {slot && (
                <div
                  className="overflow-hidden grid"
                  style={{
                    gridTemplateRows: showButtons ? "1fr" : "0fr",
                    transition: "grid-template-rows 150ms ease-out",
                  }}
                >
                  <div className="min-h-0">
                    <div
                      className={cn(
                        "px-3 rounded-lg border-t border-border/30 mt-px flex items-center",
                        slotHeight
                      )}
                      style={{
                        backgroundColor: `${getProjectColor(slot.project_id)}20`,
                      }}
                    >
                      <input
                        type="text"
                        value={localNotes[slot.id] ?? slot.note ?? ""}
                        onChange={(e) => {
                          e.stopPropagation()
                          const newNote = e.target.value
                          // Update local state immediately for responsive UI
                          setLocalNotes(prev => ({ ...prev, [slot.id]: newNote }))
                          // Debounce the actual update
                          debouncedNoteUpdate(slot.id, newNote)
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.currentTarget.blur()
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                        placeholder="Add a note..."
                        className="text-sm w-full bg-transparent border-none outline-none placeholder:opacity-50"
                        style={{ color: getProjectColor(slot.project_id) }}
                      />
                    </div>
                  </div>
                </div>
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
