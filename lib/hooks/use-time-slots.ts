"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { TimeSlot } from "@/lib/types";
import { toast } from "sonner";
import { format } from "date-fns";

export function useTimeSlots(date: Date) {
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const dateString = format(date, "yyyy-MM-dd");

  // Fetch slots for the current date only
  useEffect(() => {
    const loadSlots = async () => {
      // Clear slots immediately when date changes, then start loading
      setSlots([]);
      setIsLoading(true);

      try {
        // Only load slots for the current date
        const { data, error } = await supabase
          .from("time_slots")
          .select("*")
          .eq("date", dateString)
          .order("time_slot");

        if (error) throw error;
        console.log(`Loaded ${data?.length || 0} time slots for ${dateString}`);
        setSlots((data as TimeSlot[]) || []);
      } catch (error) {
        console.error("Error loading time slots:", error);
        toast.error("Failed to load time slots");
      } finally {
        setIsLoading(false);
      }
    };

    loadSlots();
  }, [dateString]); // Re-fetch when date changes

  const toggleSlot = async (projectId: string, timeSlot: number) => {
    // Check if a slot already exists at this time (defensive check)
    const existingSlot = slots.find((s) => s.time_slot === timeSlot);

    if (existingSlot) {
      console.warn("Slot already exists at this time:", existingSlot);
      toast.error("Slot already exists at this time");
      return existingSlot;
    }

    // Add the slot with optimistic update
    const tempId = `temp-${Date.now()}-${Math.random()}`;
    const newSlot: TimeSlot = {
      id: tempId,
      project_id: projectId,
      date: dateString,
      time_slot: timeSlot,
    };

    // Optimistic update - insert in sorted position
    setSlots((prev) => {
      const insertIndex = prev.findIndex((s) => s.time_slot > timeSlot);
      if (insertIndex === -1) {
        return [...prev, newSlot];
      }
      return [...prev.slice(0, insertIndex), newSlot, ...prev.slice(insertIndex)];
    });

    try {
      // Get current user for RLS policy
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("time_slots")
        .insert({
          project_id: projectId,
          user_id: user.id,
          date: dateString,
          time_slot: timeSlot,
        })
        .select()
        .single();

      if (error) {
        // Check if it's a duplicate key error (code 23505)
        if (typeof error === 'object' && error !== null && 'code' in error && error.code === '23505') {
          // Slot already exists in database but not in our state - reload slots for this date
          console.warn("Duplicate slot detected, reloading slots for", dateString);

          // First remove the temporary optimistic slot
          setSlots((prev) => prev.filter((s) => s.id !== tempId));

          // Then reload fresh data from database for this date only
          const { data: refreshedSlots, error: refreshError } = await supabase
            .from("time_slots")
            .select("*")
            .eq("date", dateString)
            .order("time_slot");

          if (refreshError) {
            console.error("Failed to refresh slots:", refreshError);
            toast.error("Failed to refresh slots");
          } else if (refreshedSlots) {
            setSlots(refreshedSlots as TimeSlot[]);
            console.log(`Reloaded ${refreshedSlots.length} slots for ${dateString}`);
          }

          toast.error("Slot already exists");
          return;
        }
        throw error;
      }

      // Replace temp slot with real one
      setSlots((prev) =>
        prev.map((s) => (s.id === tempId ? (data as TimeSlot) : s))
      );

      toast.success("Slot added");
      return data;
    } catch (error) {
      // Rollback on error
      setSlots((prev) => prev.filter((s) => s.id !== tempId));

      // Better error logging for Supabase errors
      const errorMessage = error instanceof Error
        ? error.message
        : typeof error === 'object' && error !== null
          ? JSON.stringify(error, Object.getOwnPropertyNames(error))
          : String(error);

      console.error("Error adding slot:", errorMessage);
      toast.error(`Failed to add slot: ${errorMessage}`);
      throw error;
    }
  };

  const replaceSlot = async (slotId: string, newProjectId: string) => {
    // Find the slot to replace
    const slotToReplace = slots.find((s) => s.id === slotId);
    if (!slotToReplace) return;

    const oldSlots = [...slots];
    const tempId = `temp-${Date.now()}`;
    const newSlot: TimeSlot = {
      id: tempId,
      project_id: newProjectId,
      date: slotToReplace.date,
      time_slot: slotToReplace.time_slot,
    };

    // Optimistic update - replace old slot with new one atomically
    setSlots((prev) =>
      prev.map((s) => (s.id === slotId ? newSlot : s))
    );

    try {
      // Get current user for RLS policy
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
          user_id: user.id,
          date: slotToReplace.date,
          time_slot: slotToReplace.time_slot,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Replace temp slot with real one
      setSlots((prev) =>
        prev.map((s) => (s.id === tempId ? (data as TimeSlot) : s))
      );

      toast.success("Slot replaced");
      return data;
    } catch (error) {
      // Rollback on error
      setSlots(oldSlots);
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

    const oldSlots = [...slots];
    const slotIds = slotsToDelete.map((s) => s.id);

    // Optimistic update - delete slots
    setSlots((prev) => prev.filter((s) => !slotIds.includes(s.id)));

    try {
      const { error } = await supabase
        .from("time_slots")
        .delete()
        .in("id", slotIds);

      if (error) throw error;
      toast.success(`Removed ${slotsToDelete.length} slot${slotsToDelete.length > 1 ? 's' : ''}`);
    } catch (error) {
      // Rollback on error
      setSlots(oldSlots);
      console.error("Error deleting slots:", error);
      toast.error("Failed to delete slots");
      throw error;
    }
  };

  const updateNote = async (slotId: string, note: string) => {
    const oldSlots = [...slots];

    // Convert empty/whitespace-only string to null, otherwise preserve the note as-is
    const noteValue = note.trim() === "" ? null : note;

    // Optimistic update
    setSlots((prev) =>
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
      setSlots(oldSlots);
      console.error("Error updating note:", error);
      toast.error("Failed to save note");
      throw error;
    }
  };

  return {
    slots,
    isLoading,
    toggleSlot,
    replaceSlot,
    deleteSlots,
    updateNote,
  };
}
