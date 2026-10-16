"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/hooks/use-auth";
import { TimeSlot } from "@/lib/types";
import { toast } from "sonner";
import { format } from "date-fns";

const NO_SLOTS: TimeSlot[] = [];
const bySlotTime = (a: TimeSlot, b: TimeSlot) => a.time_slot - b.time_slot;

// Mutations report failures with a toast and roll back their own optimistic
// update; they never throw, so callers can fire them without awaiting.
export function useTimeSlots(date: Date) {
  const { user } = useAuth();
  const userId = user?.id;

  // Slots are tagged with the date they belong to, so responses that arrive
  // after the user has moved to another day are dropped instead of shown there
  const [daySlots, setDaySlots] = useState<{ date: string; slots: TimeSlot[] } | null>(null);

  const dateString = format(date, "yyyy-MM-dd");
  const slots = daySlots?.date === dateString ? daySlots.slots : NO_SLOTS;
  const isLoading = daySlots?.date !== dateString;

  // Update the slots of `dateString` (captured when the mutation started),
  // unless the user has since navigated to another day
  const updateSlots = (update: (slots: TimeSlot[]) => TimeSlot[]) => {
    setDaySlots((prev) =>
      prev?.date === dateString ? { date: dateString, slots: update(prev.slots) } : prev
    );
  };

  // Fetch slots for the current date only
  useEffect(() => {
    if (!userId) return;
    let ignore = false;

    const loadSlots = async () => {
      const { data, error } = await supabase
        .from("time_slots")
        .select("*")
        .eq("date", dateString)
        .order("time_slot");

      if (ignore) return;
      if (error) {
        console.error("Error loading time slots:", error);
        toast.error("Failed to load time slots");
      }
      setDaySlots({ date: dateString, slots: data ?? [] });
    };

    loadSlots();
    return () => {
      ignore = true;
    };
  }, [dateString, userId]);

  const toggleSlot = async (projectId: string, timeSlot: number) => {
    if (!userId) return;

    // Defensive check - the grid only adds slots at empty times
    if (slots.some((s) => s.time_slot === timeSlot)) {
      toast.error("Slot already exists at this time");
      return;
    }

    // Optimistic update
    const tempId = `temp-${Date.now()}-${Math.random()}`;
    const newSlot: TimeSlot = {
      id: tempId,
      project_id: projectId,
      date: dateString,
      time_slot: timeSlot,
    };
    updateSlots((prev) => [...prev, newSlot].sort(bySlotTime));

    const { data, error } = await supabase
      .from("time_slots")
      .insert({
        project_id: projectId,
        user_id: userId,
        date: dateString,
        time_slot: timeSlot,
      })
      .select()
      .single();

    if (error) {
      // Rollback on error
      updateSlots((prev) => prev.filter((s) => s.id !== tempId));

      if (error.code === "23505") {
        // Slot already exists in database but not in our state - reload slots for this date
        const { data: refreshedSlots, error: refreshError } = await supabase
          .from("time_slots")
          .select("*")
          .eq("date", dateString)
          .order("time_slot");

        if (refreshError) {
          console.error("Failed to refresh slots:", refreshError);
          toast.error("Failed to refresh slots");
        } else {
          updateSlots(() => refreshedSlots);
        }
        toast.error("Slot already exists");
        return;
      }

      console.error("Error adding slot:", error);
      toast.error(`Failed to add slot: ${error.message}`);
      return;
    }

    // Replace temp slot with real one
    updateSlots((prev) => prev.map((s) => (s.id === tempId ? data : s)));
    toast.success("Slot added");
  };

  const replaceSlot = async (slotId: string, newProjectId: string) => {
    const slotToReplace = slots.find((s) => s.id === slotId);
    if (!slotToReplace) return;

    // Optimistic update - reassign the slot in place (replacing drops the note)
    updateSlots((prev) =>
      prev.map((s) =>
        s.id === slotId ? { ...s, project_id: newProjectId, note: null } : s
      )
    );

    // A single update keeps the database consistent if the request fails
    const { data, error } = await supabase
      .from("time_slots")
      .update({ project_id: newProjectId, note: null })
      .eq("id", slotId)
      .select()
      .single();

    if (error) {
      // Rollback on error - restore only this slot
      updateSlots((prev) => prev.map((s) => (s.id === slotId ? slotToReplace : s)));
      console.error("Error replacing slot:", error);
      toast.error("Failed to replace slot");
      return;
    }

    updateSlots((prev) => prev.map((s) => (s.id === slotId ? data : s)));
    toast.success("Slot replaced");
  };

  const deleteSlots = async (slotIds: string[]) => {
    // Slots still being inserted have no database row yet
    const slotsToDelete = slots.filter(
      (s) => slotIds.includes(s.id) && !s.id.startsWith("temp-")
    );

    if (slotsToDelete.length === 0) {
      return;
    }

    const idsToDelete = slotsToDelete.map((s) => s.id);

    // Optimistic update - delete slots
    updateSlots((prev) => prev.filter((s) => !idsToDelete.includes(s.id)));

    const { error } = await supabase
      .from("time_slots")
      .delete()
      .in("id", idsToDelete);

    if (error) {
      // Rollback on error - restore only the deleted slots
      updateSlots((prev) => [...prev, ...slotsToDelete].sort(bySlotTime));
      console.error("Error deleting slots:", error);
      toast.error("Failed to delete slots");
      return;
    }

    toast.success(`Removed ${slotsToDelete.length} slot${slotsToDelete.length > 1 ? 's' : ''}`);
  };

  const updateNote = async (slotId: string, note: string) => {
    const slot = slots.find((s) => s.id === slotId);
    if (!slot) return;
    const previousNote = slot.note ?? null;

    // Convert empty/whitespace-only string to null, otherwise preserve the note as-is
    const noteValue = note.trim() === "" ? null : note;

    // Optimistic update
    updateSlots((prev) =>
      prev.map((s) => (s.id === slotId ? { ...s, note: noteValue } : s))
    );

    const { error } = await supabase
      .from("time_slots")
      .update({ note: noteValue })
      .eq("id", slotId);

    if (error) {
      // Rollback on error - restore only this note
      updateSlots((prev) =>
        prev.map((s) => (s.id === slotId ? { ...s, note: previousNote } : s))
      );
      console.error("Error updating note:", error);
      toast.error("Failed to save note");
      return;
    }

    toast.success(noteValue ? "Note saved" : "Note cleared");
  };

  const fillRange = async (projectId: string, startTime: number, endTime: number) => {
    if (!userId) return;

    const startQuarter = Math.round(startTime * 4);
    const endQuarter = Math.round(endTime * 4);

    const timesToFill: number[] = [];
    for (let q = startQuarter; q <= endQuarter; q++) {
      const time = q / 4;
      if (!slots.some((s) => s.time_slot === time)) {
        timesToFill.push(time);
      }
    }

    if (timesToFill.length === 0) return;

    const timestamp = Date.now();
    const tempIds = timesToFill.map((_, i) => `temp-${timestamp}-fill-${i}`);

    const tempSlots: TimeSlot[] = timesToFill.map((time, i) => ({
      id: tempIds[i],
      project_id: projectId,
      date: dateString,
      time_slot: time,
    }));

    updateSlots((prev) => [...prev, ...tempSlots].sort(bySlotTime));

    const { data, error } = await supabase
      .from("time_slots")
      .insert(
        timesToFill.map((time) => ({
          project_id: projectId,
          user_id: userId,
          date: dateString,
          time_slot: time,
        }))
      )
      .select();

    if (error) {
      updateSlots((prev) => prev.filter((s) => !tempIds.includes(s.id)));
      console.error("Error filling range:", error);
      toast.error("Failed to fill range");
      return;
    }

    updateSlots((prev) =>
      [...prev.filter((s) => !tempIds.includes(s.id)), ...data].sort(bySlotTime)
    );
    toast.success(`Added ${timesToFill.length} slot${timesToFill.length > 1 ? "s" : ""}`);
  };

  return {
    slots,
    isLoading,
    toggleSlot,
    replaceSlot,
    deleteSlots,
    updateNote,
    fillRange,
  };
}
