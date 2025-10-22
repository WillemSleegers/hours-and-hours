"use client";

import { useState, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Project, TimeEntry } from "@/lib/types";

interface TimeGridProps {
  entries: TimeEntry[];
  projects: Project[];
  onBlockSelect: (startTime: number, endTime: number) => void;
  onSlotToggle?: (projectId: string, timeSlot: number) => void;
  activeProjectId: string | null;
  dayStartHour?: number;
  dayEndHour?: number;
  timeIncrement?: 15 | 30 | 60;
}

export function TimeGrid({
  entries,
  projects,
  onBlockSelect,
  onSlotToggle,
  activeProjectId,
  dayStartHour = 0,
  dayEndHour = 24,
  timeIncrement = 60,
}: TimeGridProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<number | null>(null);
  const [dragEnd, setDragEnd] = useState<number | null>(null);
  const [hoveredTime, setHoveredTime] = useState<number | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // Always display 15-minute slots for visual precision
  const displayIncrementInHours = 0.25; // 15 minutes
  const totalSlots = Math.floor((dayEndHour - dayStartHour) / displayIncrementInHours);
  const timeSlots = Array.from({ length: totalSlots }, (_, i) => dayStartHour + i * displayIncrementInHours);

  // User's increment setting controls selection granularity
  const incrementInHours = timeIncrement / 60;

  const formatTime = (time: number) => {
    const hours = Math.floor(time);
    const minutes = Math.round((time - hours) * 60);
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
  };

  // Snap time to the user's increment setting
  const snapToIncrement = (time: number) => {
    return Math.floor(time / incrementInHours) * incrementInHours;
  };

  const handleMouseDown = (time: number) => {
    if (!activeProjectId) return; // Don't allow dragging without active project
    const snappedTime = snapToIncrement(time);
    setIsDragging(true);
    setDragStart(snappedTime);
    setDragEnd(snappedTime);
  };

  const handleMouseEnter = (time: number) => {
    if (isDragging) {
      const snappedTime = snapToIncrement(time);
      setDragEnd(snappedTime);
    }
  };

  const handleMouseUp = useCallback(() => {
    if (isDragging && dragStart !== null && dragEnd !== null) {
      const start = Math.min(dragStart, dragEnd);
      const end = Math.max(dragStart, dragEnd) + incrementInHours;
      onBlockSelect(start, end);
      setIsDragging(false);
      setDragStart(null);
      setDragEnd(null);
    }
  }, [isDragging, dragStart, dragEnd, incrementInHours, onBlockSelect]);

  const isTimeSlotSelected = (time: number) => {
    if (!isDragging || dragStart === null || dragEnd === null) return false;
    const start = Math.min(dragStart, dragEnd);
    const end = Math.max(dragStart, dragEnd);
    return time >= start && time <= end;
  };

  const getEntryForTimeSlot = (time: number) => {
    return entries.find(
      (entry) => time >= entry.start_time && time < entry.end_time
    );
  };

  // Check if this time slot is the start or end of an entry
  const isEntryBoundary = (entry: TimeEntry, time: number) => {
    const isStart = entry.start_time === time;
    // Check if this is the last 15-min slot that contains part of the entry
    const isEnd = entry.end_time > time && entry.end_time <= time + displayIncrementInHours;
    return { isStart, isEnd };
  };

  // All 15-minute slots have the same height
  const slotHeight = "h-10";

  // Check if a slot should be highlighted based on hover and increment
  const isSlotHovered = (time: number) => {
    if (!hoveredTime || isDragging || !activeProjectId) return false;
    const snappedHover = snapToIncrement(hoveredTime);
    return time >= snappedHover && time < snappedHover + incrementInHours;
  };

  // Handle slot click - just toggle the slot for active project
  const handleSlotClick = (time: number) => {
    if (!activeProjectId || !onSlotToggle) return;

    // Round to nearest 15-minute slot
    const slotTime = Math.round(time * 4) / 4;

    // Simply toggle the slot for the active project
    onSlotToggle(activeProjectId, slotTime);
  };

  const getProjectColor = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    return project?.color || "#94a3b8";
  };

  const getProjectName = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    return project?.name || "Unknown";
  };

  return (
    <div
      ref={gridRef}
      className="relative select-none"
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div className="relative">
        {timeSlots.map((time, index) => {
          const entry = getEntryForTimeSlot(time);
          const isSelected = isTimeSlotSelected(time);
          const isHovered = isSlotHovered(time);
          const { isStart: isEntryStart, isEnd: isEntryEnd } = entry ? isEntryBoundary(entry, time) : { isStart: false, isEnd: false };

          return (
            <div
              key={time}
              className="relative flex"
            >
              {/* Time label column */}
              <div className="w-16 pr-3 flex-shrink-0 relative">
                <div className={cn(
                  "absolute -top-2 right-3 text-xs font-medium",
                  "text-muted-foreground/70"
                )}>
                  {formatTime(time)}
                </div>
              </div>

              {/* Time slot content */}
              <div className="flex-1 relative">
                {/* Border line */}
                {index === 0 && <div className="absolute top-0 left-0 right-0 h-px bg-border/40" />}

                <div
                  className={cn(
                    "relative transition-all duration-150",
                    slotHeight,
                    !entry && activeProjectId && "cursor-pointer group",
                    !entry && isHovered && "bg-accent/30",
                    entry && "cursor-pointer"
                  )}
                  onMouseDown={() => !entry && handleMouseDown(time)}
                  onMouseEnter={() => {
                    if (activeProjectId) {
                      handleMouseEnter(time);
                      setHoveredTime(time);
                    }
                  }}
                  onMouseLeave={() => setHoveredTime(null)}
                  onClick={() => handleSlotClick(time)}
                >
                  {/* Selection overlay for dragging new blocks */}
                  {isSelected && (
                    <div className="absolute inset-0 bg-primary/8 border-l-2 border-primary/50" />
                  )}

                  {/* Entry block */}
                  {entry ? (
                    <div
                      className={cn(
                        "absolute inset-0 flex items-center justify-between px-3",
                        "text-sm font-medium text-white",
                        isEntryStart && isEntryEnd && "rounded-lg my-0.5 mx-0.5",
                        isEntryStart && !isEntryEnd && "rounded-t-lg mt-0.5 mx-0.5",
                        !isEntryStart && isEntryEnd && "rounded-b-lg mb-0.5 mx-0.5",
                        !isEntryStart && !isEntryEnd && "mx-0.5"
                      )}
                      style={{
                        backgroundColor: getProjectColor(entry.project_id),
                      }}
                    >
                      {isEntryStart && (
                        <div className="flex items-center gap-2 relative z-10 pointer-events-none">
                          <span className="font-semibold tracking-tight">
                            {getProjectName(entry.project_id)}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>

                {/* Bottom border line */}
                <div className="absolute bottom-0 left-0 right-0 h-px bg-border/40" />
              </div>
            </div>
          );
        })}

        {/* Final time marker at the end */}
        <div className="relative flex">
          <div className="w-16 pr-3 flex-shrink-0 relative">
            <div className={cn(
              "absolute -top-2 right-3 text-xs font-medium",
              "text-muted-foreground/70"
            )}>
              {formatTime(dayEndHour)}
            </div>
          </div>
          <div className="flex-1" />
        </div>
      </div>
    </div>
  );
}
