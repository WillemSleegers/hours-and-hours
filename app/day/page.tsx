"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { addDays, format, isValid, parseISO, subDays } from "date-fns";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Header } from "@/components/header";
import { useProjects } from "@/lib/hooks/use-projects";
import { useAuth } from "@/lib/hooks/use-auth";
import { useTimeSlots } from "@/lib/hooks/use-time-slots";
import { useDateNavigation } from "@/lib/hooks/use-date-navigation";
import { computeProjectHours, hoursMapToStats } from "@/lib/stats";
import { ProjectStats } from "@/lib/types";

function DayStatsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { projects } = useProjects();

  // The URL's date wins (so links and reloads work), falling back to the
  // shared selected day. parseISO reads "yyyy-MM-dd" as local midnight;
  // new Date() would read it as UTC.
  const { currentDate: selectedDate, setCurrentDate } = useDateNavigation();
  const dateParam = searchParams.get("date");
  const parsedDate = dateParam ? parseISO(dateParam) : null;
  const currentDate = parsedDate && isValid(parsedDate) ? parsedDate : selectedDate;

  // Navigating here updates both the shared day (so Back lands on it) and the URL
  const goToDate = (date: Date) => {
    setCurrentDate(date);
    router.replace(`/day?date=${format(date, "yyyy-MM-dd")}`);
  };
  const handlePreviousDay = () => goToDate(subDays(currentDate, 1));
  const handleNextDay = () => goToDate(addDays(currentDate, 1));
  const handleToday = () => goToDate(new Date());

  const { slots } = useTimeSlots(currentDate);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

  const getStats = (): ProjectStats[] =>
    hoursMapToStats(computeProjectHours(slots, projects)).filter(
      (stat) => stat.totalHours > 0
    );

  const stats = getStats();
  const totalHours = stats.reduce((sum, stat) => sum + stat.totalHours, 0);

  const getProject = (projectId: string) => {
    return projects.find((p) => p.id === projectId);
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
      <Header currentDate={currentDate} showBack />

      <main className="px-3 pb-3 flex-1">
        <div className="space-y-3">
        {/* Total Hours Card */}
        <Card>
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
        <div className="bg-card border border-border rounded-2xl px-3 py-2 flex items-center gap-2">
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
              <Button
                variant="outline"
                size="icon"
                className="hover:bg-accent/50 h-10 w-10"
              >
                <CalendarDays className="h-5 w-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 m-3 mb-4.5" align="center">
              <Calendar
                mode="single"
                selected={currentDate}
                onSelect={(date) => date && goToDate(date)}
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
