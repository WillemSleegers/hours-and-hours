"use client"

import { useSettingsContext } from "@/lib/contexts/settings-context"

export function useUserSettings() {
  return useSettingsContext()
}
