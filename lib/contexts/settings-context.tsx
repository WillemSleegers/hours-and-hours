"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useAuthContext } from "@/lib/contexts/auth-context"
import { UserSettings } from "@/lib/types"
import { toast } from "sonner"

const DEFAULT_SETTINGS: Omit<UserSettings, "id" | "created_at" | "updated_at"> = {
  day_start_hour: 9,
  day_end_hour: 17,
  stats_start_date: null,
  stats_end_date: null,
}

// Shown until the user's settings have loaded
const FALLBACK_SETTINGS: UserSettings = { ...DEFAULT_SETTINGS, id: "default" }

type SettingsUpdate = Partial<
  Pick<UserSettings, "day_start_hour" | "day_end_hour" | "stats_start_date" | "stats_end_date">
>

interface SettingsContextType {
  settings: UserSettings
  isLoading: boolean
  // Reports failures with a toast and rolls back; never throws, resolves to whether it succeeded
  updateSettings: (updates: SettingsUpdate) => Promise<boolean>
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuthContext()
  const userId = user?.id

  // Settings are tagged with the user they were loaded for, so they are
  // reloaded on sign-in and never shown to a different (or signed-out) user
  const [loaded, setLoaded] = useState<{ userId: string; settings: UserSettings } | null>(null)
  const settings = userId && loaded?.userId === userId ? loaded.settings : FALLBACK_SETTINGS
  const isLoading = !!userId && loaded?.userId !== userId

  useEffect(() => {
    if (!userId) return
    let ignore = false

    const loadSettings = async () => {
      try {
        const { data, error } = await supabase
          .from("user_settings")
          .select("*")
          .eq("user_id", userId)
          .limit(1)
          .maybeSingle()

        if (error) throw error

        let userSettings = data
        if (!userSettings) {
          const { data: newSettings, error: insertError } = await supabase
            .from("user_settings")
            .insert({ ...DEFAULT_SETTINGS, user_id: userId })
            .select()
            .single()

          if (insertError) throw insertError
          userSettings = newSettings
        }

        if (!ignore) setLoaded({ userId, settings: userSettings })
      } catch (error) {
        if (ignore) return
        console.error("Error loading user settings:", error)
        toast.error("Failed to load settings")
      }
    }

    loadSettings()
    return () => {
      ignore = true
    }
  }, [userId])

  const updateSettings = async (updates: SettingsUpdate) => {
    if (!userId || loaded?.userId !== userId) {
      toast.error("Settings haven't loaded yet")
      return false
    }

    const previous = loaded.settings
    const updateSettingsState = (changes: SettingsUpdate) => {
      setLoaded((prev) =>
        prev && prev.userId === userId ? { ...prev, settings: { ...prev.settings, ...changes } } : prev
      )
    }

    updateSettingsState(updates)

    // select().single() errors when no row matched, so a failed update can't pass silently
    const { error } = await supabase
      .from("user_settings")
      .update(updates)
      .eq("id", previous.id)
      .select()
      .single()

    if (error) {
      // Rollback on error - restore only the fields this call changed
      updateSettingsState(
        Object.fromEntries(
          Object.keys(updates).map((key) => [key, previous[key as keyof SettingsUpdate]])
        ) as SettingsUpdate
      )
      console.error("Error updating settings:", error)
      toast.error("Failed to update settings")
      return false
    }

    toast.success("Settings updated")
    return true
  }

  return (
    <SettingsContext.Provider value={{ settings, isLoading, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettingsContext() {
  const context = useContext(SettingsContext)
  if (context === undefined) {
    throw new Error("useSettingsContext must be used within a SettingsProvider")
  }
  return context
}
