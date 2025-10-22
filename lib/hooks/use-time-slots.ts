"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { TimeSlot, TimeEntry } from "@/lib/types";
import { toast } from "sonner";

export function useTimeSlots(date: Date) {
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const dateString = date.toISOString().split("T")[0];

  useEffect(() => {
    const loadSlots = async () => {
      try {
        const { data, error } = await supabase
          .from("time_slots")
          .select("*")
          .eq("date", dateString)
          .order("time_slot");

        if (error) throw error;
        setSlots((data as TimeSlot[]) || []);
      } catch (error) {
        console.error("Error loading time slots:", error);
        toast.error("Failed to load time slots");
      } finally {
        setIsLoading(false);
      }
    };

    loadSlots();
  }, [dateString]);

  // Convert slots into visual entries (consecutive slots grouped together)
  const entries: TimeEntry[] = [];
  if (slots.length > 0) {
    let currentEntry: TimeEntry | null = null;

    for (const slot of slots) {
      if (
        currentEntry &&
        currentEntry.project_id === slot.project_id &&
        currentEntry.end_time === slot.time_slot
      ) {
        // Extend current entry
        currentEntry.end_time = slot.time_slot + 0.25;
        currentEntry.slot_ids.push(slot.id);
      } else {
        // Start new entry
        if (currentEntry) {
          entries.push(currentEntry);
        }
        currentEntry = {
          id: slot.id,
          project_id: slot.project_id,
          date: slot.date,
          start_time: slot.time_slot,
          end_time: slot.time_slot + 0.25,
          slot_ids: [slot.id],
        };
      }
    }
    if (currentEntry) {
      entries.push(currentEntry);
    }
  }

  const toggleSlot = async (projectId: string, timeSlot: number) => {
    // Check if slot already exists
    const existingSlot = slots.find(
      (s) => s.time_slot === timeSlot && s.project_id === projectId
    );

    if (existingSlot) {
      // Delete the slot
      const oldSlots = [...slots];
      setSlots((prev) => prev.filter((s) => s.id !== existingSlot.id));

      try {
        const { error } = await supabase
          .from("time_slots")
          .delete()
          .eq("id", existingSlot.id);

        if (error) throw error;
      } catch (error) {
        // Rollback on error
        setSlots(oldSlots);
        console.error("Error deleting slot:", error);
        toast.error("Failed to delete slot");
        throw error;
      }
    } else {
      // Add the slot
      const tempId = `temp-${Date.now()}`;
      const newSlot: TimeSlot = {
        id: tempId,
        project_id: projectId,
        date: dateString,
        time_slot: timeSlot,
      };

      // Optimistic update
      setSlots((prev) => [...prev, newSlot].sort((a, b) => a.time_slot - b.time_slot));

      try {
        const { data, error } = await supabase
          .from("time_slots")
          .insert({
            project_id: projectId,
            date: dateString,
            time_slot: timeSlot,
          })
          .select()
          .single();

        if (error) throw error;

        // Replace temp slot with real one
        setSlots((prev) =>
          prev.map((s) => (s.id === tempId ? (data as TimeSlot) : s))
        );

        return data;
      } catch (error) {
        // Rollback on error
        setSlots((prev) => prev.filter((s) => s.id !== tempId));
        console.error("Error adding slot:", error);
        toast.error("Failed to add slot");
        throw error;
      }
    }
  };

  const addSlots = async (projectId: string, startTime: number, endTime: number) => {
    // Generate all 15-minute slots in the range
    const slotsToAdd: number[] = [];
    for (let time = startTime; time < endTime; time += 0.25) {
      slotsToAdd.push(Math.round(time * 4) / 4); // Round to nearest 0.25
    }

    // Filter out slots that already exist
    const newSlots = slotsToAdd.filter(
      (time) => !slots.some((s) => s.time_slot === time)
    );

    if (newSlots.length === 0) return;

    const tempSlots: TimeSlot[] = newSlots.map((time) => ({
      id: `temp-${time}`,
      project_id: projectId,
      date: dateString,
      time_slot: time,
    }));

    // Optimistic update
    setSlots((prev) => [...prev, ...tempSlots].sort((a, b) => a.time_slot - b.time_slot));

    try {
      const { data, error } = await supabase
        .from("time_slots")
        .insert(
          newSlots.map((time) => ({
            project_id: projectId,
            date: dateString,
            time_slot: time,
          }))
        )
        .select();

      if (error) throw error;

      // Replace temp slots with real ones
      const insertedSlots = data as TimeSlot[];
      setSlots((prev) => {
        const withoutTemp = prev.filter((s) => !s.id.startsWith("temp-"));
        return [...withoutTemp, ...insertedSlots].sort(
          (a, b) => a.time_slot - b.time_slot
        );
      });

      return data;
    } catch (error) {
      // Rollback on error
      setSlots((prev) =>
        prev.filter((s) => !tempSlots.some((t) => t.id === s.id))
      );
      console.error("Error adding slots:", error);
      toast.error("Failed to add slots");
      throw error;
    }
  };

  return {
    slots,
    entries,
    isLoading,
    toggleSlot,
    addSlots,
  };
}
