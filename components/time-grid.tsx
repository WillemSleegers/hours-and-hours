"use client";

import { useState, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Project, TimeEntry } from "@/lib/types";

interface TimeGridProps {
  entries: TimeEntry[];
  projects: Project[];
  onBlockSelect: (startTime: number, endTime: number) => void;
  dayStartHour?: number;
  dayEndHour?: number;
  timeIncrement?: 15 | 30 | 60;
}

export function TimeGrid({
  entries,
  projects,
  onBlockSelect,
  dayStartHour = 0,
  dayEndHour = 24,
  timeIncrement = 60,
}: TimeGridProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<number | null>(null);
  const [dragEnd, setDragEnd] = useState<number | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // Generate time slots based on increment
  const incrementInHours = timeIncrement / 60;
  const totalSlots = Math.floor((dayEndHour - dayStartHour) / incrementInHours);
  const timeSlots = Array.from({ length: totalSlots }, (_, i) => dayStartHour + i * incrementInHours);

  const formatTime = (time: number) => {
    const hours = Math.floor(time);
    const minutes = Math.round((time - hours) * 60);
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
  };

  const handleMouseDown = (time: number) => {
    setIsDragging(true);
    setDragStart(time);
    setDragEnd(time);
  };

  const handleMouseEnter = (time: number) => {
    if (isDragging) {
      setDragEnd(time);
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

  const getProjectColor = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    return project?.color || "#94a3b8";
  };

  const getProjectName = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    return project?.name || "Unknown";
  };

  // Check if this time slot is the start or end of an entry
  const isEntryBoundary = (entry: TimeEntry, time: number) => {
    const isStart = entry.start_time === time;
    const isEnd = entry.end_time === time + incrementInHours;
    return { isStart, isEnd };
  };

  // Calculate the height based on time increment
  const slotHeight = timeIncrement === 15 ? "h-10" : timeIncrement === 30 ? "h-12" : "h-16";

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
                    !entry && "hover:bg-accent/30 cursor-pointer group",
                    entry && "cursor-default"
                  )}
                  onMouseDown={() => !entry && handleMouseDown(time)}
                  onMouseEnter={() => handleMouseEnter(time)}
                >
                  {/* Selection overlay */}
                  {isSelected && (
                    <div className="absolute inset-0 bg-primary/8 border-l-2 border-primary/50" />
                  )}

                  {/* Entry block */}
                  {entry ? (
                    <div
                      className={cn(
                        "absolute inset-0 flex items-center px-3",
                        "text-sm font-medium text-white",
                        "transition-all duration-200",
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
                        <div className="flex items-center gap-2">
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
