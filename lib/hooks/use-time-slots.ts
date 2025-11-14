"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { TimeSlot } from "@/lib/types";
import { toast } from "sonner";

export function useTimeSlots(date: Date) {
  const [allSlots, setAllSlots] = useState<TimeSlot[]>([]);

  const dateString = date.toISOString().split("T")[0];

  // Fetch all slots once
  useEffect(() => {
    const loadSlots = async () => {
      try {
        const { data, error } = await supabase
          .from("time_slots")
          .select("*")
          .order("time_slot");

        if (error) throw error;
        setAllSlots((data as TimeSlot[]) || []);
      } catch (error) {
        console.error("Error loading time slots:", error);
        toast.error("Failed to load time slots");
      }
    };

    loadSlots();
  }, []);

  // Filter slots for the current date (client-side)
  // React Compiler will automatically memoize this
  const slots = allSlots.filter((slot) => slot.date === dateString);

  const toggleSlot = async (projectId: string, timeSlot: number) => {
    // Add the slot with optimistic update
    const tempId = `temp-${Date.now()}-${Math.random()}`;
    const newSlot: TimeSlot = {
      id: tempId,
      project_id: projectId,
      date: dateString,
      time_slot: timeSlot,
    };

    // Optimistic update - insert in sorted position
    setAllSlots((prev) => {
      const insertIndex = prev.findIndex(s => s.time_slot > timeSlot);
      if (insertIndex === -1) {
        return [...prev, newSlot];
      }
      return [...prev.slice(0, insertIndex), newSlot, ...prev.slice(insertIndex)];
    });

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("time_slots")
        .insert({
          project_id: projectId,
          date: dateString,
          time_slot: timeSlot,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Replace temp slot with real one
      setAllSlots((prev) =>
        prev.map((s) => (s.id === tempId ? (data as TimeSlot) : s))
      );

      toast.success("Slot added");
      return data;
    } catch (error) {
      // Rollback on error
      setAllSlots((prev) => prev.filter((s) => s.id !== tempId));
      console.error("Error adding slot:", error);
      toast.error("Failed to add slot");
      throw error;
    }
  };

  const replaceSlot = async (slotId: string, newProjectId: string) => {
    // Find the slot to replace
    const slotToReplace = allSlots.find((s) => s.id === slotId);
    if (!slotToReplace) return;

    const oldSlots = [...allSlots];
    const tempId = `temp-${Date.now()}`;
    const newSlot: TimeSlot = {
      id: tempId,
      project_id: newProjectId,
      date: slotToReplace.date,
      time_slot: slotToReplace.time_slot,
    };

    // Optimistic update - replace old slot with new one atomically
    setAllSlots((prev) =>
      prev.map((s) => (s.id === slotId ? newSlot : s))
    );

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Delete old slot and insert new one
      const { error: deleteError } = await supabase
        .from("time_slots")
        .delete()
        .eq("id", slotId);

      if (deleteError) throw deleteError;

      const { data, error: insertError } = await supabase
        .from("time_slots")
        .insert({
          project_id: newProjectId,
          date: slotToReplace.date,
          time_slot: slotToReplace.time_slot,
          user_id: user.id,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Replace temp slot with real one
      setAllSlots((prev) =>
        prev.map((s) => (s.id === tempId ? (data as TimeSlot) : s))
      );

      toast.success("Slot replaced");
      return data;
    } catch (error) {
      // Rollback on error
      setAllSlots(oldSlots);
      console.error("Error replacing slot:", error);
      toast.error("Failed to replace slot");
      throw error;
    }
  };

  const deleteSlots = async (startTime: number, endTime: number) => {
    // Find all slots in the time range
    const slotsToDelete = slots.filter(
      (s) => s.time_slot >= startTime && s.time_slot < endTime
    );

    if (slotsToDelete.length === 0) {
      return;
    }

    const oldSlots = [...allSlots];
    const slotIds = slotsToDelete.map((s) => s.id);

    // Optimistic update - delete slots
    setAllSlots((prev) => prev.filter((s) => !slotIds.includes(s.id)));

    try {
      const { error } = await supabase
        .from("time_slots")
        .delete()
        .in("id", slotIds);

      if (error) throw error;
      toast.success(`Removed ${slotsToDelete.length} slot${slotsToDelete.length > 1 ? 's' : ''}`);
    } catch (error) {
      // Rollback on error
      setAllSlots(oldSlots);
      console.error("Error deleting slots:", error);
      toast.error("Failed to delete slots");
      throw error;
    }
  };

  const updateNote = async (slotId: string, note: string) => {
    const oldSlots = [...allSlots];

    // Convert empty/whitespace-only string to null, otherwise preserve the note as-is
    const noteValue = note.trim() === "" ? null : note;

    // Optimistic update
    setAllSlots((prev) =>
      prev.map((s) => (s.id === slotId ? { ...s, note: noteValue } : s))
    );

    try {
      const { error } = await supabase
        .from("time_slots")
        .update({ note: noteValue })
        .eq("id", slotId);

      if (error) throw error;
      toast.success(noteValue ? "Note saved" : "Note cleared");
    } catch (error) {
      // Rollback on error
      setAllSlots(oldSlots);
      console.error("Error updating note:", error);
      toast.error("Failed to save note");
      throw error;
    }
  };

  return {
    slots,
    toggleSlot,
    replaceSlot,
    deleteSlots,
    updateNote,
  };
}
