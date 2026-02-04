"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { CalendarDays, X, Download, FileJson } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Switch } from "@/components/ui/switch"
import { Field, FieldLabel } from "@/components/ui/field"
import { Header } from "@/components/header"
import { useProjects } from "@/lib/hooks/use-projects"
import { useAuth } from "@/lib/hooks/use-auth"
import { useUserSettings } from "@/lib/hooks/use-user-settings"
import { supabase } from "@/lib/supabase"
import { exportToCSV, exportToJSON } from "@/lib/export"
import { toast } from "sonner"

interface ProjectStats {
  projectId: string
  totalHours: number
}

export default function StatisticsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { projects } = useProjects()
  const { settings, updateSettings } = useUserSettings()
  const [allSlots, setAllSlots] = useState<
    Array<{ project_id: string; date: string; time_slot: number; note?: string | null }>
  >([])
  const [isLoading, setIsLoading] = useState(true)
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [endDate, setEndDate] = useState<Date | undefined>(undefined)
  const [earliestDate, setEarliestDate] = useState<Date | null>(null)
  const [latestDate, setLatestDate] = useState<Date | null>(null)
  const [showArchived, setShowArchived] = useState(false)
  const [detailedExport, setDetailedExport] = useState(false)

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
    }
  }, [authLoading, user, router])

  useEffect(() => {
    loadAllSlots()
  }, [projects])

  // Load saved date range from settings
  useEffect(() => {
    if (settings.stats_start_date) {
      setStartDate(new Date(settings.stats_start_date))
    }
    if (settings.stats_end_date) {
      setEndDate(new Date(settings.stats_end_date))
    }
  }, [settings.stats_start_date, settings.stats_end_date])

  const loadAllSlots = async () => {
    try {
      const { data, error } = await supabase
        .from("time_slots")
        .select("project_id, date, time_slot, note")
        .order("date")

      if (error) throw error

      const slots = data as Array<{ project_id: string; date: string; time_slot: number; note?: string | null }>
      setAllSlots(slots)

      // Find earliest and latest dates
      if (slots.length > 0) {
        const dates = slots.map((s) => new Date(s.date))
        setEarliestDate(new Date(Math.min(...dates.map((d) => d.getTime()))))
        setLatestDate(new Date(Math.max(...dates.map((d) => d.getTime()))))
      }
    } catch (error) {
      console.error("Error loading project stats:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Client-side filtering
  const getFilteredStats = (): ProjectStats[] => {
    // Filter slots by date range
    const filteredSlots = allSlots.filter((slot) => {
      if (startDate) {
        const startDateString = format(startDate, "yyyy-MM-dd")
        if (slot.date < startDateString) return false
      }
      if (endDate) {
        const endDateString = format(endDate, "yyyy-MM-dd")
        if (slot.date > endDateString) return false
      }
      return true
    })

    const statsMap = new Map<string, number>()

    // Initialize all projects with 0 hours
    projects.forEach((project) => {
      statsMap.set(project.id, 0)
    })

    // Each slot is 15 minutes = 0.25 hours
    filteredSlots.forEach((slot) => {
      const currentHours = statsMap.get(slot.project_id) || 0
      statsMap.set(slot.project_id, currentHours + 0.25)
    })

    const projectStats = Array.from(statsMap.entries()).map(
      ([projectId, totalHours]) => ({
        projectId,
        totalHours,
      })
    )

    projectStats.sort((a, b) => b.totalHours - a.totalHours)

    return projectStats
  }

  const allStats = getFilteredStats()

  // Filter out archived projects if toggle is off
  const stats = showArchived
    ? allStats
    : allStats.filter((stat) => {
        const project = projects.find((p) => p.id === stat.projectId)
        return project && !project.archived
      })

  const handleStartDateChange = (date: Date | undefined) => {
    setStartDate(date)
    updateSettings({
      stats_start_date: date ? format(date, "yyyy-MM-dd") : null,
    })
  }

  const handleEndDateChange = (date: Date | undefined) => {
    setEndDate(date)
    updateSettings({ stats_end_date: date ? format(date, "yyyy-MM-dd") : null })
  }

  const resetDateFilter = () => {
    setStartDate(undefined)
    setEndDate(undefined)
    updateSettings({ stats_start_date: null, stats_end_date: null })
  }

  const handleExportCSV = () => {
    try {
      const filteredSlots = allSlots.filter((slot) => {
        if (startDate) {
          const startDateString = format(startDate, "yyyy-MM-dd")
          if (slot.date < startDateString) return false
        }
        if (endDate) {
          const endDateString = format(endDate, "yyyy-MM-dd")
          if (slot.date > endDateString) return false
        }
        return true
      })

      const exportSlots = filteredSlots.map((slot) => {
        const project = projects.find((p) => p.id === slot.project_id)
        return {
          ...slot,
          projectName: project?.name,
          projectColor: project?.color,
        }
      })

      exportToCSV(exportSlots, detailedExport)
      toast.success(detailedExport ? "Exported detailed CSV" : "Exported summary CSV")
    } catch (error) {
      console.error("Error exporting to CSV:", error)
      toast.error("Failed to export to CSV")
    }
  }

  const handleExportJSON = () => {
    try {
      const filteredSlots = allSlots.filter((slot) => {
        if (startDate) {
          const startDateString = format(startDate, "yyyy-MM-dd")
          if (slot.date < startDateString) return false
        }
        if (endDate) {
          const endDateString = format(endDate, "yyyy-MM-dd")
          if (slot.date > endDateString) return false
        }
        return true
      })

      const exportSlots = filteredSlots.map((slot) => {
        const project = projects.find((p) => p.id === slot.project_id)
        return {
          ...slot,
          projectName: project?.name,
          projectColor: project?.color,
        }
      })

      exportToJSON(exportSlots)
      toast.success("Exported to JSON")
    } catch (error) {
      console.error("Error exporting to JSON:", error)
      toast.error("Failed to export to JSON")
    }
  }

  const getProject = (projectId: string) => {
    return projects.find((p) => p.id === projectId)
  }

  const totalHours = stats.reduce((sum, stat) => sum + stat.totalHours, 0)

  // Show loading while checking auth
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

  return (
    <div className="bg-background max-w-xl mx-auto min-h-screen">
      <Header title="Statistics" showBack />

      <main className="px-3 pb-3 space-y-3">
        <Card>
          <CardContent>
            <div className="flex items-baseline gap-2 mb-2">
              <div className="text-5xl font-bold tabular-nums">
                {totalHours}
              </div>
              <div className="text-2xl font-medium text-muted-foreground">
                hours
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              Across {stats.length}{" "}
              {stats.length === 1 ? "project" : "projects"}
              {(startDate || endDate) && (
                <>
                  {" · "}
                  {startDate &&
                    !endDate &&
                    `from ${format(startDate, "MMM d")}`}
                  {!startDate && endDate && `until ${format(endDate, "MMM d")}`}
                  {startDate &&
                    endDate &&
                    `${format(startDate, "MMM d")} - ${format(
                      endDate,
                      "MMM d"
                    )}`}
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="py-0">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="text-center text-muted-foreground text-sm py-8">
                Loading statistics...
              </div>
            ) : projects.length === 0 ? (
              <div className="text-center text-muted-foreground text-sm py-8">
                No projects yet. Add a project to get started!
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {stats.map((stat) => {
                  const project = getProject(stat.projectId)

                  return (
                    <div
                      key={stat.projectId}
                      className={`px-4 py-3 ${
                        project?.archived ? "opacity-60" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge
                            className="w-3 h-3 rounded-full p-0"
                            style={{
                              backgroundColor: project?.color || "#94a3b8",
                            }}
                          />
                          <span className="font-semibold text-base">
                            {project?.name || "Unknown Project"}
                            {project?.archived && (
                              <span className="ml-2 text-xs text-muted-foreground font-normal">
                                (archived)
                              </span>
                            )}
                          </span>
                        </div>
                        <div className="text-lg font-bold">
                          {stat.totalHours}h
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Filters Card */}
        <Card>
          <CardContent className="space-y-6">
            <Field>
              <FieldLabel>Date Range</FieldLabel>
              <div className="flex items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 flex-1"
                    >
                      <CalendarDays className="h-4 w-4" />
                      {startDate
                        ? format(startDate, "MMM d")
                        : earliestDate
                        ? format(earliestDate, "MMM d")
                        : "Start"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={startDate || earliestDate || undefined}
                      onSelect={handleStartDateChange}
                    />
                  </PopoverContent>
                </Popover>

                <span className="text-sm text-muted-foreground">–</span>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 flex-1"
                    >
                      <CalendarDays className="h-4 w-4" />
                      {endDate
                        ? format(endDate, "MMM d")
                        : latestDate
                        ? format(latestDate, "MMM d")
                        : "End"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={endDate || latestDate || undefined}
                      onSelect={handleEndDateChange}
                    />
                  </PopoverContent>
                </Popover>

                {(startDate || endDate) && (
                  <Button variant="ghost" size="sm" onClick={resetDateFilter}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </Field>

            <Field>
              <div className="flex items-center gap-2">
                <Switch
                  id="include-archived"
                  checked={showArchived}
                  onCheckedChange={setShowArchived}
                />
                <FieldLabel
                  htmlFor="include-archived"
                  className="cursor-pointer"
                >
                  Include archived projects
                </FieldLabel>
              </div>
            </Field>

            <Field>
              <div className="flex items-center gap-2 mb-3">
                <Switch
                  id="detailed-export"
                  checked={detailedExport}
                  onCheckedChange={setDetailedExport}
                />
                <FieldLabel
                  htmlFor="detailed-export"
                  className="cursor-pointer"
                >
                  Detailed export (with time slots)
                </FieldLabel>
              </div>
              <FieldLabel>Export Data</FieldLabel>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 flex-1"
                  onClick={handleExportCSV}
                  disabled={allSlots.length === 0}
                >
                  <Download className="h-4 w-4" />
                  Export CSV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 flex-1"
                  onClick={handleExportJSON}
                  disabled={allSlots.length === 0}
                >
                  <FileJson className="h-4 w-4" />
                  Export JSON
                </Button>
              </div>
            </Field>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
