"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Header } from "@/components/header";
import { useProjects } from "@/lib/hooks/use-projects";
import { useAuth } from "@/lib/hooks/use-auth";
import { useUserSettings } from "@/lib/hooks/use-user-settings";
import { supabase } from "@/lib/supabase";

interface ProjectStats {
  projectId: string;
  totalHours: number;
}

export default function StatisticsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { projects } = useProjects();
  const { settings, updateSettings } = useUserSettings();
  const [allSlots, setAllSlots] = useState<Array<{ project_id: string; date: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [earliestDate, setEarliestDate] = useState<Date | null>(null);
  const [latestDate, setLatestDate] = useState<Date | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    loadAllSlots();
  }, [projects]);

  // Load saved date range from settings
  useEffect(() => {
    if (settings.stats_start_date) {
      setStartDate(new Date(settings.stats_start_date));
    }
    if (settings.stats_end_date) {
      setEndDate(new Date(settings.stats_end_date));
    }
  }, [settings.stats_start_date, settings.stats_end_date]);

  const loadAllSlots = async () => {
    try {
      const { data, error } = await supabase
        .from("time_slots")
        .select("project_id, date")
        .order("date");

      if (error) throw error;

      const slots = data as Array<{ project_id: string; date: string }>;
      setAllSlots(slots);

      // Find earliest and latest dates
      if (slots.length > 0) {
        const dates = slots.map((s) => new Date(s.date));
        setEarliestDate(new Date(Math.min(...dates.map((d) => d.getTime()))));
        setLatestDate(new Date(Math.max(...dates.map((d) => d.getTime()))));
      }
    } catch (error) {
      console.error("Error loading project stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Client-side filtering
  const getFilteredStats = (): ProjectStats[] => {
    // Filter slots by date range
    const filteredSlots = allSlots.filter((slot) => {
      if (startDate) {
        const startDateString = format(startDate, "yyyy-MM-dd");
        if (slot.date < startDateString) return false;
      }
      if (endDate) {
        const endDateString = format(endDate, "yyyy-MM-dd");
        if (slot.date > endDateString) return false;
      }
      return true;
    });

    const statsMap = new Map<string, number>();

    // Initialize all projects with 0 hours
    projects.forEach((project) => {
      statsMap.set(project.id, 0);
    });

    // Each slot is 15 minutes = 0.25 hours
    filteredSlots.forEach((slot) => {
      const currentHours = statsMap.get(slot.project_id) || 0;
      statsMap.set(slot.project_id, currentHours + 0.25);
    });

    const projectStats = Array.from(statsMap.entries()).map(
      ([projectId, totalHours]) => ({
        projectId,
        totalHours,
      })
    );

    projectStats.sort((a, b) => b.totalHours - a.totalHours);

    return projectStats;
  };

  const allStats = getFilteredStats();

  // Filter out archived projects if toggle is off
  const stats = showArchived
    ? allStats
    : allStats.filter(stat => {
        const project = projects.find(p => p.id === stat.projectId);
        return project && !project.archived;
      });

  const handleStartDateChange = (date: Date | undefined) => {
    setStartDate(date);
    updateSettings({ stats_start_date: date ? format(date, "yyyy-MM-dd") : null });
  };

  const handleEndDateChange = (date: Date | undefined) => {
    setEndDate(date);
    updateSettings({ stats_end_date: date ? format(date, "yyyy-MM-dd") : null });
  };

  const resetDateFilter = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    updateSettings({ stats_start_date: null, stats_end_date: null });
  };

  const getProject = (projectId: string) => {
    return projects.find((p) => p.id === projectId);
  };

  const totalHours = stats.reduce((sum, stat) => sum + stat.totalHours, 0);

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="h-dvh flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!user) {
    return null;
  }

  return (
    <div className="bg-background max-w-xl mx-auto min-h-screen">
      <Header title="Statistics" showBack />

      <main className="px-3 pb-3">
        {/* Date Range Filter */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <CalendarIcon className="h-4 w-4" />
                {startDate ? (
                  format(startDate, "MMM d, yyyy")
                ) : earliestDate ? (
                  <span className="flex items-center gap-1">
                    {format(earliestDate, "MMM d, yyyy")}
                    <span className="text-xs text-muted-foreground">(earliest)</span>
                  </span>
                ) : (
                  "Start date"
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={startDate || earliestDate || undefined}
                onSelect={handleStartDateChange}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <span className="text-sm text-muted-foreground">to</span>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <CalendarIcon className="h-4 w-4" />
                {endDate ? (
                  format(endDate, "MMM d, yyyy")
                ) : latestDate ? (
                  <span className="flex items-center gap-1">
                    {format(latestDate, "MMM d, yyyy")}
                    <span className="text-xs text-muted-foreground">(latest)</span>
                  </span>
                ) : (
                  "End date"
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={endDate || latestDate || undefined}
                onSelect={handleEndDateChange}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          {(startDate || endDate) && (
            <Button variant="ghost" size="sm" onClick={resetDateFilter} className="gap-2">
              <X className="h-4 w-4" />
              Reset
            </Button>
          )}

          {/* Spacer to push toggle to the right on larger screens */}
          <div className="flex-1 min-w-0" />

          {/* Include Archived Toggle */}
          <div className="flex items-center gap-2">
            <Switch
              id="include-archived"
              checked={showArchived}
              onCheckedChange={setShowArchived}
            />
            <Label htmlFor="include-archived" className="text-sm cursor-pointer">
              Include archived
            </Label>
          </div>
        </div>

        <Card className="mb-4">
          <CardContent>
            <div className="flex items-baseline gap-2 mb-2">
              <div className="text-5xl font-bold tabular-nums">{totalHours}</div>
              <div className="text-2xl font-medium text-muted-foreground">hours</div>
            </div>
            <div className="text-sm text-muted-foreground">
              Across {stats.length} {stats.length === 1 ? "project" : "projects"}
              {(startDate || endDate) && (
                <>
                  {" · "}
                  {startDate && !endDate && `from ${format(startDate, "MMM d")}`}
                  {!startDate && endDate && `until ${format(endDate, "MMM d")}`}
                  {startDate && endDate && `${format(startDate, "MMM d")} - ${format(endDate, "MMM d")}`}
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3">
          {isLoading ? (
            <Card>
              <CardContent className="text-center text-muted-foreground text-sm">
                Loading statistics...
              </CardContent>
            </Card>
          ) : projects.length === 0 ? (
            <Card>
              <CardContent className="text-center text-muted-foreground text-sm">
                No projects yet. Add a project to get started!
              </CardContent>
            </Card>
          ) : (
            stats.map((stat) => {
              const project = getProject(stat.projectId);

              return (
                <Card key={stat.projectId} className={project?.archived ? "opacity-60" : ""}>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge
                          className="w-3 h-3 rounded-full p-0"
                          style={{ backgroundColor: project?.color || "#94a3b8" }}
                        />
                        <span className="font-semibold text-lg">
                          {project?.name || "Unknown Project"}
                          {project?.archived && (
                            <span className="ml-2 text-xs text-muted-foreground font-normal">
                              (archived)
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="text-xl font-bold">{stat.totalHours}h</div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}
