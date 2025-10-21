"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { TimeEntry } from "@/lib/types";
import { toast } from "sonner";

export function useTimeEntries(date: Date) {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const dateString = date.toISOString().split("T")[0];

  useEffect(() => {
    const loadEntries = async () => {
      try {
        const { data, error } = await supabase
          .from("time_entries")
          .select("*")
          .eq("date", dateString)
          .order("start_hour");

        if (error) throw error;
        setEntries((data as TimeEntry[]) || []);
      } catch (error) {
        console.error("Error loading time entries:", error);
        toast.error("Failed to load time entries");
      } finally {
        setIsLoading(false);
      }
    };

    loadEntries();
  }, [dateString]);

  const addEntry = async (
    projectId: string,
    startTime: number,
    endTime: number
  ) => {
    const tempId = `temp-${Date.now()}`;
    const newEntry: TimeEntry = {
      id: tempId,
      project_id: projectId,
      date: dateString,
      start_time: startTime,
      end_time: endTime,
    };

    // Optimistic update
    setEntries((prev) => [...prev, newEntry].sort((a, b) => a.start_time - b.start_time));

    try {
      const { data, error } = await supabase
        .from("time_entries")
        .insert({
          project_id: projectId,
          date: dateString,
          start_time: startTime,
          end_time: endTime,
        })
        .select()
        .single();

      if (error) throw error;

      // Replace temp entry with real one
      setEntries((prev) =>
        prev.map((e) => (e.id === tempId ? (data as TimeEntry) : e))
      );

      return data;
    } catch (error) {
      // Rollback on error
      setEntries((prev) => prev.filter((e) => e.id !== tempId));
      console.error("Error adding time entry:", error);
      toast.error("Failed to add time entry");
      throw error;
    }
  };

  const deleteEntry = async (id: string) => {
    const oldEntries = [...entries];

    // Optimistic update
    setEntries((prev) => prev.filter((e) => e.id !== id));

    try {
      const { error } = await supabase
        .from("time_entries")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Time entry deleted");
    } catch (error) {
      // Rollback on error
      setEntries(oldEntries);
      console.error("Error deleting time entry:", error);
      toast.error("Failed to delete time entry");
      throw error;
    }
  };

  return {
    entries,
    isLoading,
    addEntry,
    deleteEntry,
  };
}
