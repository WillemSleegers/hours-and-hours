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
  const slotHeight = timeIncrement === 15 ? "h-8" : timeIncrement === 30 ? "h-10" : "h-12";

  return (
    <div
      ref={gridRef}
      className="relative select-none"
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div className="space-y-px">
        {timeSlots.map((time) => {
          const entry = getEntryForTimeSlot(time);
          const isSelected = isTimeSlotSelected(time);
          const { isStart: isEntryStart, isEnd: isEntryEnd } = entry ? isEntryBoundary(entry, time) : { isStart: false, isEnd: false };

          return (
            <div
              key={time}
              className={cn(
                "flex items-center border-b transition-colors cursor-pointer",
                slotHeight,
                isSelected && "bg-primary/20",
                !entry && "hover:bg-accent",
                entry && "border-transparent"
              )}
              onMouseDown={() => !entry && handleMouseDown(time)}
              onMouseEnter={() => handleMouseEnter(time)}
            >
              <div className="w-16 px-3 text-sm text-muted-foreground font-medium">
                {formatTime(time)}
              </div>
              <div className="flex-1 h-full relative">
                {entry ? (
                  <div
                    className={cn(
                      "h-full flex items-center px-3 text-sm font-medium text-white",
                      isEntryStart && "rounded-t",
                      isEntryEnd && "rounded-b"
                    )}
                    style={{ backgroundColor: getProjectColor(entry.project_id) }}
                  >
                    {isEntryStart && getProjectName(entry.project_id)}
                  </div>
                ) : (
                  <div className="h-full" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
