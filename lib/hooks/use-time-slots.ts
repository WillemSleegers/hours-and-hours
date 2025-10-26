"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { TimeSlot, TimeEntry } from "@/lib/types";
import { toast } from "sonner";

export function useTimeSlots(date: Date) {
  const [allSlots, setAllSlots] = useState<TimeSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
      } finally {
        setIsLoading(false);
      }
    };

    loadSlots();
  }, []);

  // Filter slots for the current date (client-side)
  // React Compiler will automatically memoize this
  const slots = allSlots.filter((slot) => slot.date === dateString);

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
          note: slot.note,
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
      const oldSlots = [...allSlots];
      setAllSlots((prev) => prev.filter((s) => s.id !== existingSlot.id));

      try {
        const { error } = await supabase
          .from("time_slots")
          .delete()
          .eq("id", existingSlot.id);

        if (error) throw error;
      } catch (error) {
        // Rollback on error
        setAllSlots(oldSlots);
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
      setAllSlots((prev) => [...prev, newSlot].sort((a, b) => a.time_slot - b.time_slot));

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

        return data;
      } catch (error) {
        // Rollback on error
        setAllSlots((prev) => prev.filter((s) => s.id !== tempId));
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

    if (newSlots.length === 0) {
      return;
    }

    const tempSlots: TimeSlot[] = newSlots.map((time) => ({
      id: `temp-${time}`,
      project_id: projectId,
      date: dateString,
      time_slot: time,
    }));

    // Optimistic update
    setAllSlots((prev) => [...prev, ...tempSlots].sort((a, b) => a.time_slot - b.time_slot));

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("time_slots")
        .insert(
          newSlots.map((time) => ({
            project_id: projectId,
            date: dateString,
            time_slot: time,
            user_id: user.id,
          }))
        )
        .select();

      if (error) throw error;

      // Replace temp slots with real ones
      const insertedSlots = data as TimeSlot[];
      setAllSlots((prev) => {
        // Only remove the specific temp slots we're replacing
        const tempIdsToRemove = new Set(tempSlots.map((t) => t.id));
        const withoutTheseTemp = prev.filter((s) => !tempIdsToRemove.has(s.id));
        return [...withoutTheseTemp, ...insertedSlots].sort(
          (a, b) => a.time_slot - b.time_slot
        );
      });

      toast.success(`Added ${newSlots.length} slot${newSlots.length > 1 ? 's' : ''}`);
      return data;
    } catch (error) {
      // Rollback on error
      setAllSlots((prev) =>
        prev.filter((s) => !tempSlots.some((t) => t.id === s.id))
      );
      console.error("Error adding slots:", error);
      toast.error("Failed to add slots");
      throw error;
    }
  };

  const deleteEntry = async (entryId: string) => {
    // Find the entry and delete all its slots
    const entry = entries.find((e) => e.id === entryId);
    if (!entry) {
      return;
    }

    const oldSlots = [...allSlots];

    // Optimistic update - remove all slots belonging to this entry
    setAllSlots((prev) => prev.filter((s) => !entry.slot_ids.includes(s.id)));

    try {
      const { error } = await supabase
        .from("time_slots")
        .delete()
        .in("id", entry.slot_ids);

      if (error) throw error;
      toast.success("Entry deleted");
    } catch (error) {
      // Rollback on error
      setAllSlots(oldSlots);
      console.error("Error deleting entry:", error);
      toast.error("Failed to delete entry");
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

    // Check if we're deleting the first slot of any entry that has a note
    // If so, transfer the note to the next slot in the same entry
    const noteTransfers: Array<{ fromId: string; toId: string; note: string }> = [];

    for (const entry of entries) {
      const firstSlot = slots.find((s) => s.id === entry.id);

      // Check if the first slot is being deleted and has a note
      if (firstSlot && slotIds.includes(firstSlot.id) && firstSlot.note) {
        // Find the next slot in this entry that's NOT being deleted
        const nextSlot = slots.find(
          (s) =>
            entry.slot_ids.includes(s.id) &&
            s.time_slot > firstSlot.time_slot &&
            !slotIds.includes(s.id)
        );

        if (nextSlot) {
          noteTransfers.push({
            fromId: firstSlot.id,
            toId: nextSlot.id,
            note: firstSlot.note,
          });
        }
      }
    }

    // Optimistic update - delete slots and transfer notes
    setAllSlots((prev) => {
      let updated = prev.filter((s) => !slotIds.includes(s.id));

      // Apply note transfers
      for (const transfer of noteTransfers) {
        updated = updated.map((s) =>
          s.id === transfer.toId ? { ...s, note: transfer.note } : s
        );
      }

      return updated;
    });

    try {
      // Transfer notes first (before deleting)
      for (const transfer of noteTransfers) {
        const { error: transferError } = await supabase
          .from("time_slots")
          .update({ note: transfer.note })
          .eq("id", transfer.toId);

        if (transferError) throw transferError;
      }

      // Then delete the slots
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

  const updateNote = async (entryId: string, note: string) => {
    // Find the entry to update its first slot
    const entry = entries.find((e) => e.id === entryId);
    if (!entry) {
      return;
    }

    const oldSlots = [...allSlots];

    // Convert empty string to null
    const noteValue = note.trim() === "" ? null : note.trim();

    // Optimistic update - update the first slot (which has id === entryId)
    setAllSlots((prev) =>
      prev.map((s) => (s.id === entryId ? { ...s, note: noteValue } : s))
    );

    try {
      const { error } = await supabase
        .from("time_slots")
        .update({ note: noteValue })
        .eq("id", entryId);

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
    entries,
    isLoading,
    toggleSlot,
    addSlots,
    deleteEntry,
    deleteSlots,
    updateNote,
  };
}
