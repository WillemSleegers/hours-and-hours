"use client"

import { useState } from "react"
import { addDays, subDays } from "date-fns"
import { Button } from "@/components/ui/button"
import { TimeGrid } from "@/components/time-grid"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { useProjects } from "@/lib/hooks/use-projects"
import { useTimeSlots } from "@/lib/hooks/use-time-slots"
import { useUserSettings } from "@/lib/hooks/use-user-settings"
import { ChevronUp, ChevronDown } from "lucide-react"

export default function Home() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [showEarlierHours, setShowEarlierHours] = useState(false)
  const [showLaterHours, setShowLaterHours] = useState(false)
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)

  const { projects, isLoading: projectsLoading } = useProjects()
  const { slots, entries, addSlots, deleteEntry, deleteSlots } = useTimeSlots(currentDate)
  const {
    settings,
    updateSettings,
    isLoading: settingsLoading,
  } = useUserSettings()

  // Calculate the actual range of hours based on entries
  const getActualHoursRange = () => {
    if (entries.length === 0) {
      return {
        start: settings.day_start_hour,
        end: settings.day_end_hour,
      }
    }

    const earliestEntry = Math.min(
      ...entries.map((e) => Math.floor(e.start_time))
    )
    const latestEntry = Math.max(...entries.map((e) => Math.ceil(e.end_time)))

    return {
      start: Math.min(earliestEntry, settings.day_start_hour),
      end: Math.max(latestEntry, settings.day_end_hour),
    }
  }

  const actualRange = getActualHoursRange()

  // Determine the display range
  const displayStartHour = showEarlierHours ? 0 : actualRange.start
  const displayEndHour = showLaterHours ? 24 : actualRange.end

  // Check if we can show earlier/later hours
  const canShowEarlier = displayStartHour > 0
  const canShowLater = displayEndHour < 24

  const handlePreviousDay = () => {
    setCurrentDate((date) => subDays(date, 1))
    setShowEarlierHours(false)
    setShowLaterHours(false)
  }

  const handleNextDay = () => {
    setCurrentDate((date) => addDays(date, 1))
    setShowEarlierHours(false)
    setShowLaterHours(false)
  }

  const handleToday = () => {
    setCurrentDate(new Date())
    setShowEarlierHours(false)
    setShowLaterHours(false)
  }

  const handleBlockSelect = (start: number, end: number) => {
    // If active project is set, add slots for the range
    if (activeProjectId) {
      addSlots(activeProjectId, start, end)
    }
  }

  const handleProjectSelect = (projectId: string) => {
    setActiveProjectId(projectId)
  }

  const totalHours = entries.reduce(
    (sum, entry) => sum + (entry.end_time - entry.start_time),
    0
  )

  // Show loading state while data is being fetched
  if (projectsLoading || settingsLoading) {
    return (
      <div className="h-dvh flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  // Show error state if no projects exist (likely database issue)
  if (projects.length === 0 && !projectsLoading) {
    return (
      <div className="h-dvh flex flex-col items-center justify-center bg-background p-6">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-semibold">No Projects Found</h2>
          <p className="text-muted-foreground max-w-md">
            It looks like your database isn&apos;t set up yet. Please check your
            Supabase configuration and ensure the tables are created.
          </p>
          <Button onClick={() => (window.location.href = "/projects")}>
            Go to Projects
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-dvh flex flex-col bg-background">
      <Header totalHours={totalHours} currentDate={currentDate} />

      {/* Scrollable time grid - takes up available space */}
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto max-w-4xl">
          {canShowEarlier && !showEarlierHours && (
            <div className="flex justify-center">
              <Button
                variant="ghost"
                onClick={() => setShowEarlierHours(true)}
                className="text-muted-foreground hover:text-foreground hover:bg-accent/50 h-12 gap-2 min-w-48"
              >
                <ChevronUp className="h-4 w-4" />
                Show earlier hours
              </Button>
            </div>
          )}

          <TimeGrid
            slots={slots}
            entries={entries}
            projects={projects}
            onBlockSelect={handleBlockSelect}
            onEntryDelete={deleteEntry}
            onSlotsDelete={deleteSlots}
            activeProjectId={activeProjectId}
            dayStartHour={displayStartHour}
            dayEndHour={displayEndHour}
            timeIncrement={settings.time_increment}
          />

          {canShowLater && !showLaterHours && (
            <div className="flex justify-center">
              <Button
                variant="ghost"
                onClick={() => setShowLaterHours(true)}
                className="text-muted-foreground hover:text-foreground hover:bg-accent/50 h-12 gap-2 min-w-48"
              >
                <ChevronDown className="h-4 w-4" />
                Show later hours
              </Button>
            </div>
          )}
        </div>
      </main>

      <Footer
        onPreviousDay={handlePreviousDay}
        onNextDay={handleNextDay}
        onToday={handleToday}
        activeProjectId={activeProjectId}
        projects={projects}
        onProjectSelect={handleProjectSelect}
        onClearProject={() => setActiveProjectId(null)}
        timeIncrement={settings.time_increment}
        onIncrementChange={(increment) => {
          updateSettings({ time_increment: increment })
        }}
      />
    </div>
  )
}
