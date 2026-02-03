"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format, addDays, subDays } from "date-fns";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Header } from "@/components/header";
import { useProjects } from "@/lib/hooks/use-projects";
import { useAuth } from "@/lib/hooks/use-auth";
import { useTimeSlots } from "@/lib/hooks/use-time-slots";

interface ProjectStats {
  projectId: string;
  totalHours: number;
}

function DayStatsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { projects } = useProjects();

  // Get date from query params or default to today
  const dateParam = searchParams.get("date");
  const [currentDate, setCurrentDate] = useState<Date>(
    dateParam ? new Date(dateParam) : new Date()
  );

  const { slots } = useTimeSlots(currentDate);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

  // Update URL when date changes
  useEffect(() => {
    const dateString = format(currentDate, "yyyy-MM-dd");
    router.replace(`/day?date=${dateString}`);
  }, [currentDate, router]);

  const getStats = (): ProjectStats[] => {
    const statsMap = new Map<string, number>();

    // Initialize all projects with 0 hours
    projects.forEach((project) => {
      statsMap.set(project.id, 0);
    });

    // Each slot is 15 minutes = 0.25 hours
    slots.forEach((slot) => {
      const currentHours = statsMap.get(slot.project_id) || 0;
      statsMap.set(slot.project_id, currentHours + 0.25);
    });

    const projectStats = Array.from(statsMap.entries())
      .map(([projectId, totalHours]) => ({
        projectId,
        totalHours,
      }))
      .filter((stat) => stat.totalHours > 0) // Only show projects with hours
      .sort((a, b) => b.totalHours - a.totalHours);

    return projectStats;
  };

  const stats = getStats();
  const totalHours = stats.reduce((sum, stat) => sum + stat.totalHours, 0);

  const getProject = (projectId: string) => {
    return projects.find((p) => p.id === projectId);
  };

  const handlePreviousDay = () => {
    setCurrentDate((date) => subDays(date, 1));
  };

  const handleNextDay = () => {
    setCurrentDate((date) => addDays(date, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

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
    <div className="bg-background max-w-xl mx-auto min-h-screen flex flex-col">
      <Header title="Daily Breakdown" showBack />

      <main className="px-3 pb-3 flex-1">
        {/* Total Hours Card */}
        <Card className="mb-4">
          <CardContent>
            <div className="flex items-baseline gap-2 mb-2">
              <div className="text-5xl font-bold tabular-nums">{totalHours}</div>
              <div className="text-2xl font-medium text-muted-foreground">hours</div>
            </div>
            <div className="text-sm text-muted-foreground">
              {stats.length === 0
                ? "No time tracked"
                : `Across ${stats.length} ${stats.length === 1 ? "project" : "projects"}`}
            </div>
          </CardContent>
        </Card>

        {/* Projects Breakdown */}
        <div className="space-y-3">
          {stats.map((stat) => {
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
            })}
        </div>
      </main>

      {/* Bottom Date Navigation */}
      <footer className="sticky bottom-0 z-50 bg-background p-3">
        <div className="bg-card border border-border rounded-2xl px-3 py-2 flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handlePreviousDay}
            className="h-10 w-10 hover:bg-accent/50"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="h-10 gap-2">
                <CalendarIcon className="h-4 w-4" />
                {format(currentDate, "EEE, MMM d, yyyy")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 m-3 mb-4.5" align="center">
              <Calendar
                mode="single"
                selected={currentDate}
                onSelect={(date) => date && setCurrentDate(date)}
                initialFocus
              />
              <div className="p-3 border-t">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleToday}
                >
                  Today
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          <Button
            variant="outline"
            size="icon"
            onClick={handleNextDay}
            className="h-10 w-10 hover:bg-accent/50"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </footer>
    </div>
  );
}

export default function DayStatsPage() {
  return (
    <Suspense fallback={
      <div className="h-dvh flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    }>
      <DayStatsContent />
    </Suspense>
  );
}
