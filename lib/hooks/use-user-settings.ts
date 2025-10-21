"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { UserSettings } from "@/lib/types";
import { toast } from "sonner";

const DEFAULT_SETTINGS: Omit<UserSettings, "id" | "created_at" | "updated_at"> = {
  day_start_hour: 0,
  day_end_hour: 24,
  time_increment: 60,
};

export function useUserSettings() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const { data, error } = await supabase
          .from("user_settings")
          .select("*")
          .limit(1)
          .single();

        if (error) {
          // If no settings exist, create default
          if (error.code === "PGRST116") {
            const { data: newSettings, error: insertError } = await supabase
              .from("user_settings")
              .insert(DEFAULT_SETTINGS)
              .select()
              .single();

            if (insertError) throw insertError;
            setSettings(newSettings as UserSettings);
          } else {
            throw error;
          }
        } else {
          setSettings(data as UserSettings);
        }
      } catch (error) {
        console.error("Error loading user settings:", error);
        toast.error("Failed to load settings");
        // Use default settings as fallback
        setSettings({
          ...DEFAULT_SETTINGS,
          id: "fallback",
        } as UserSettings);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  const updateSettings = async (
    updates: Partial<Pick<UserSettings, "day_start_hour" | "day_end_hour" | "time_increment">>
  ) => {
    if (!settings) return;

    const oldSettings = { ...settings };
    const newSettings = { ...settings, ...updates };

    // Optimistic update
    setSettings(newSettings);

    try {
      const { error } = await supabase
        .from("user_settings")
        .update(updates)
        .eq("id", settings.id);

      if (error) throw error;
      toast.success("Settings updated");
    } catch (error) {
      // Rollback on error
      setSettings(oldSettings);
      console.error("Error updating settings:", error);
      toast.error("Failed to update settings");
      throw error;
    }
  };

  return {
    settings: settings || DEFAULT_SETTINGS,
    isLoading,
    updateSettings,
  };
}
