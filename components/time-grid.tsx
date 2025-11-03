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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Trash2 } from "lucide-react"

interface TimeGridProps {
  slots: TimeSlot[]
  projects: Project[]
  onSlotToggle: (projectId: string, timeSlot: number) => void
  onSlotReplace: (slotId: string, newProjectId: string) => void
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
  onSlotReplace,
  onSlotDelete,
  onNoteUpdate,
  activeProjectId,
  dayStartHour = 0,
  dayEndHour = 24,
}: TimeGridProps) {
  const [selectedSlotTime, setSelectedSlotTime] = useState<number | null>(null)
  const [localNotes, setLocalNotes] = useState<Record<string, string>>({})
  const debounceTimers = useRef<Record<string, NodeJS.Timeout>>({})
  const [confirmReplaceSlot, setConfirmReplaceSlot] = useState<{slot: TimeSlot, newProjectId: string} | null>(null)
  const pointerDownPos = useRef<{ x: number; y: number } | null>(null)

  // Sync localNotes with actual slot notes when slots change
  useEffect(() => {
    const newLocalNotes: Record<string, string> = {}
    slots.forEach(slot => {
      if (slot.note) {
        newLocalNotes[slot.id] = slot.note
      }
    })
    setLocalNotes(newLocalNotes)
  }, [slots])

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
        // Check if this is a temporary slot (being added optimistically)
        const isTemporarySlot = slot.id.startsWith('temp-')

        if (slot.project_id === activeProjectId && !isTemporarySlot) {
          // Same project and not temporary: toggle expandable section
          setSelectedSlotTime(prev => prev === snappedTime ? null : snappedTime)
        } else if (isTemporarySlot) {
          // Temporary slot: do nothing, let the optimistic update complete
          return
        } else {
          // Different project: replace slot (with confirmation if it has a note)
          setSelectedSlotTime(null)
          if (slot.note && slot.note.trim() !== "") {
            // Show confirmation dialog
            setConfirmReplaceSlot({ slot, newProjectId: activeProjectId })
          } else {
            // No note, replace immediately
            onSlotReplace(slot.id, activeProjectId)
          }
        }
      } else {
        // Empty slot: add slot and close any open expandable section
        setSelectedSlotTime(null)
        onSlotToggle(activeProjectId, snappedTime)
      }
    } else {
      // No active project: toggle expandable section if slot exists
      if (slot) {
        const isTemporarySlot = slot.id.startsWith('temp-')
        if (!isTemporarySlot) {
          setSelectedSlotTime(prev => prev === snappedTime ? null : snappedTime)
        }
      } else {
        // Close any open section when clicking empty slot
        setSelectedSlotTime(null)
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
                  "flex items-center gap-1.5 px-3",
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
                onPointerDown={(e) => {
                  pointerDownPos.current = { x: e.clientX, y: e.clientY }
                }}
                onPointerUp={(e) => {
                  if (pointerDownPos.current) {
                    const dx = Math.abs(e.clientX - pointerDownPos.current.x)
                    const dy = Math.abs(e.clientY - pointerDownPos.current.y)
                    // Only fire click if pointer didn't move much (not a scroll)
                    if (dx < 10 && dy < 10) {
                      handleSlotClick(time)
                    }
                    pointerDownPos.current = null
                  }
                }}
                onPointerCancel={() => {
                  pointerDownPos.current = null
                }}
              >
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  {slot && isFirst && (
                    <span className="font-bold tracking-tight shrink-0">
                      {getProjectName(slot.project_id)}
                    </span>
                  )}
                  {slot && !isSelected && slot.note && (
                    <span className="text-sm truncate">
                      {localNotes[slot.id] ?? slot.note}
                    </span>
                  )}
                </div>
                {slot && isSelected && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        onPointerDown={(e) => {
                          e.stopPropagation()
                          pointerDownPos.current = null
                        }}
                        onPointerUp={(e) => {
                          e.stopPropagation()
                          pointerDownPos.current = null
                        }}
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
                        onPointerDown={(e) => e.stopPropagation()}
                        onPointerUp={(e) => e.stopPropagation()}
                        onSelect={(e) => {
                          e.preventDefault()
                          onSlotDelete(slot.id)
                          setSelectedSlotTime(null)
                        }}
                      >
                        Delete slot
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onPointerDown={(e) => e.stopPropagation()}
                        onPointerUp={(e) => e.stopPropagation()}
                        onSelect={(e) => {
                          e.preventDefault()
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
                        onPointerDown={(e) => e.stopPropagation()}
                        onPointerUp={(e) => e.stopPropagation()}
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

      {/* Confirmation dialog for replacing slot with note */}
      <Dialog open={!!confirmReplaceSlot} onOpenChange={(open) => !open && setConfirmReplaceSlot(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Replace slot with note?</DialogTitle>
            <DialogDescription>
              This slot has a note: &quot;{confirmReplaceSlot?.slot.note}&quot;
              <br />
              <br />
              Replacing it will delete this note. Do you want to continue?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmReplaceSlot(null)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (confirmReplaceSlot) {
                  onSlotReplace(confirmReplaceSlot.slot.id, confirmReplaceSlot.newProjectId)
                  setConfirmReplaceSlot(null)
                }
              }}
            >
              Replace
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
