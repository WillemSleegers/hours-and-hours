"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { TimeGrid } from "@/components/time-grid"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { useProjects } from "@/lib/hooks/use-projects"
import { useTimeSlots } from "@/lib/hooks/use-time-slots"
import { useUserSettings } from "@/lib/hooks/use-user-settings"
import { useAuth } from "@/lib/hooks/use-auth"
import { useDateNavigation } from "@/lib/hooks/use-date-navigation"
import { ChevronUp, ChevronDown } from "lucide-react"

export default function Home() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { currentDate, setCurrentDate, handlePreviousDay, handleNextDay, handleToday } = useDateNavigation()
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
    }
  }, [authLoading, user, router])

  const { projects, isLoading: projectsLoading } = useProjects()
  const {
    slots,
    isLoading: slotsLoading,
    toggleSlot,
    replaceSlot,
    deleteSlots,
    updateNote,
    fillRange,
  } = useTimeSlots(currentDate)
  const { settings } = useUserSettings()

  // Calculate the actual range of hours based on slots
  const getActualHoursRange = () => {
    if (slots.length === 0) {
      return {
        start: settings.day_start_hour,
        end: settings.day_end_hour,
      }
    }

    const earliestSlot = Math.min(...slots.map((s) => Math.floor(s.time_slot)))
    const latestSlot = Math.max(
      ...slots.map((s) => Math.ceil(s.time_slot + 0.25)),
    )

    return {
      start: Math.min(earliestSlot, settings.day_start_hour),
      end: Math.max(latestSlot, settings.day_end_hour),
    }
  }

  const actualRange = getActualHoursRange()

  // Extra hours revealed via "Show earlier/later hours", kept only for the date they were revealed on
  const dateKey = format(currentDate, "yyyy-MM-dd")
  const [revealedRange, setRevealedRange] = useState<{ date: string; start: number; end: number } | null>(null)
  const revealed = revealedRange?.date === dateKey ? revealedRange : null
  const displayStartHour = Math.min(actualRange.start, revealed?.start ?? 24)
  const displayEndHour = Math.max(actualRange.end, revealed?.end ?? 0)

  const revealHours = (start: number, end: number) => {
    setRevealedRange({ date: dateKey, start, end })
  }

  // Check if we can show earlier/later hours
  const canShowEarlier = displayStartHour > 0
  const canShowLater = displayEndHour < 24


  const handleDateSelect = (date: Date) => {
    setCurrentDate(date)
  }

  const handleProjectSelect = (projectId: string) => {
    setActiveProjectId(projectId)
  }

  const totalHours = slots.length * 0.25 // Each slot is 15 minutes (0.25 hours)

  // Show loading state only while checking auth
  if (authLoading) {
    return (
      <div className="h-dvh flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  // Don't render if not authenticated (will redirect)
  if (!user) {
    return null
  }

  // Show welcome state if no projects exist
  if (projects.length === 0 && !projectsLoading) {
    return (
      <div className="h-dvh flex flex-col items-center justify-center bg-background p-6">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-semibold">No projects yet</h2>
          <p className="text-muted-foreground max-w-md">
            Create your first project to start tracking time
          </p>
          <Button onClick={() => router.push("/projects")}>
            Create Project
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-background max-w-xl mx-auto">
      <Header totalHours={totalHours} currentDate={currentDate} />

      {/* Time grid */}
      <main className="px-3">
        <div className="container mx-auto max-w-4xl">
          {canShowEarlier && (
            <div className="flex justify-center">
              <Button
                variant="ghost"
                onClick={() =>
                  revealHours(Math.max(0, displayStartHour - 1), displayEndHour)
                }
                className="text-muted-foreground hover:text-foreground hover:bg-accent/50 gap-2 min-w-48"
              >
                <ChevronUp className="h-4 w-4" />
                Show earlier hours
              </Button>
            </div>
          )}

          <div className={slotsLoading ? "opacity-60 pointer-events-none" : ""}>
            <TimeGrid
              slots={slots}
              projects={projects}
              onSlotToggle={toggleSlot}
              onSlotReplace={replaceSlot}
              onSlotDelete={deleteSlots}
              onNoteUpdate={updateNote}
              onFillRange={fillRange}
              activeProjectId={activeProjectId}
              dayStartHour={displayStartHour}
              dayEndHour={displayEndHour}
            />
          </div>

          {canShowLater && (
            <div className="flex justify-center">
              <Button
                variant="ghost"
                onClick={() =>
                  revealHours(displayStartHour, Math.min(24, displayEndHour + 1))
                }
                className="text-muted-foreground hover:text-foreground hover:bg-accent/50 gap-2 min-w-48"
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
        onDateSelect={handleDateSelect}
        currentDate={currentDate}
        activeProjectId={activeProjectId}
        projects={projects}
        onProjectSelect={handleProjectSelect}
        onClearProject={() => setActiveProjectId(null)}
      />
    </div>
  )
}
