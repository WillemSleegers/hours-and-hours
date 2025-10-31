"use client"

import { useState, Fragment, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Project, TimeSlot } from "@/lib/types"
import { NoteDialog } from "./note-dialog"
import { Button } from "@/components/ui/button"

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
  const [noteDialogOpen, setNoteDialogOpen] = useState(false)
  const [editingSlot, setEditingSlot] = useState<TimeSlot | null>(null)
  const [selectedSlotTime, setSelectedSlotTime] = useState<number | null>(null)

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

  const handleNoteEdit = (slot: TimeSlot) => {
    setEditingSlot(slot)
    setNoteDialogOpen(true)
  }

  const handleNoteSave = (note: string) => {
    if (editingSlot) {
      onNoteUpdate(editingSlot.id, note)
    }
  }

  // Handle slot click - create slot or toggle selection
  const handleSlotClick = (time: number) => {
    const snappedTime = snapToIncrement(time)
    const slot = getSlotForTime(snappedTime)

    if (activeProjectId) {
      // Project is active
      if (slot) {
        if (slot.project_id === activeProjectId) {
          // Same project: toggle selection
          setSelectedSlotTime(selectedSlotTime === snappedTime ? null : snappedTime)
        } else {
          // Different project: switch to active project
          onSlotDelete(slot.id)
          onSlotToggle(activeProjectId, snappedTime)
          // Don't select the new slot - user needs to click again to open it
        }
      } else {
        // Empty slot: add slot but don't select it
        onSlotToggle(activeProjectId, snappedTime)
        // Don't set selectedSlotTime - user needs to click again to open it
      }
    } else {
      // No active project: toggle selection if slot exists
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
                onClick={() => handleSlotClick(time)}
              >
                {slot && isFirst && (
                  <span className="font-bold tracking-tight shrink-0">
                    {getProjectName(slot.project_id)}
                  </span>
                )}
              </div>

              {/* Expandable section - note and actions */}
              <div
                className="overflow-hidden"
                style={{
                  maxHeight: showButtons && slot ? "200px" : "0",
                  transition: "max-height 200ms ease-out",
                }}
              >
                {slot && (
                  <div
                    className="px-3 py-2 space-y-2 rounded-lg mt-1"
                    style={{
                      backgroundColor: `${getProjectColor(slot.project_id)}20`,
                    }}
                  >
                    {/* Note display/edit */}
                    {slot.note && (
                      <div
                        className="text-sm"
                        style={{ color: getProjectColor(slot.project_id) }}
                      >
                        {slot.note}
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleNoteEdit(slot)
                        }}
                        className="h-8 px-3 shrink-0 rounded-lg"
                        style={{
                          backgroundColor: `${getProjectColor(
                            slot.project_id
                          )}30`,
                          color: getProjectColor(slot.project_id),
                        }}
                      >
                        {slot.note ? "Edit note" : "Add note"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation()
                          onSlotDelete(slot.id)
                          setSelectedSlotTime(null)
                        }}
                        className="h-8 px-3 shrink-0 rounded-lg"
                        style={{
                          backgroundColor: `${getProjectColor(
                            slot.project_id
                          )}30`,
                          color: getProjectColor(slot.project_id),
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                )}
              </div>
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
        initialNote={editingSlot?.note}
        projectName={editingSlot ? getProjectName(editingSlot.project_id) : ""}
      />
    </div>
  )
}
