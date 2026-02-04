"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { UserSettings } from "@/lib/types"
import { toast } from "sonner"

const DEFAULT_SETTINGS: Omit<UserSettings, "id" | "created_at" | "updated_at"> = {
  day_start_hour: 9,
  day_end_hour: 17,
  stats_start_date: null,
  stats_end_date: null,
}

interface SettingsContextType {
  settings: UserSettings
  isLoading: boolean
  updateSettings: (
    updates: Partial<Pick<UserSettings, "day_start_hour" | "day_end_hour" | "stats_start_date" | "stats_end_date">>
  ) => Promise<void>
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<UserSettings>({
    ...DEFAULT_SETTINGS,
    id: "default",
  } as UserSettings)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setIsLoading(false)
          return
        }

        const { data, error } = await supabase
          .from("user_settings")
          .select("*")
          .limit(1)
          .single()

        if (error) {
          if (error.code === "PGRST116") {
            const { data: newSettings, error: insertError } = await supabase
              .from("user_settings")
              .insert({ ...DEFAULT_SETTINGS, user_id: user.id })
              .select()
              .single()

            if (insertError) throw insertError
            setSettings(newSettings as UserSettings)
          } else {
            throw error
          }
        } else {
          setSettings(data as UserSettings)
        }
      } catch (error) {
        console.error("Error loading user settings:", error)
        toast.error("Failed to load settings")
      } finally {
        setIsLoading(false)
      }
    }

    loadSettings()
  }, [])

  const updateSettings = async (
    updates: Partial<Pick<UserSettings, "day_start_hour" | "day_end_hour" | "stats_start_date" | "stats_end_date">>
  ) => {
    const oldSettings = { ...settings }
    const newSettings = { ...settings, ...updates }

    setSettings(newSettings)

    try {
      const { error } = await supabase
        .from("user_settings")
        .update(updates)
        .eq("id", settings.id)

      if (error) throw error
      toast.success("Settings updated")
    } catch (error) {
      setSettings(oldSettings)
      console.error("Error updating settings:", error)
      toast.error("Failed to update settings")
      throw error
    }
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
