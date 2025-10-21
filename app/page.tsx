"use client";

import { useState } from "react";
import { format, addDays, subDays } from "date-fns";
import { ChevronLeft, ChevronRight, Calendar, BarChart3, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TimeGrid } from "@/components/time-grid";
import { ProjectSelector } from "@/components/project-selector";
import { ThemeToggle } from "@/components/theme-toggle";
import { useProjects } from "@/lib/hooks/use-projects";
import { useTimeEntries } from "@/lib/hooks/use-time-entries";
import { useUserSettings } from "@/lib/hooks/use-user-settings";
import Link from "next/link";

export default function Home() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showProjectSelector, setShowProjectSelector] = useState(false);
  const [selectedTimeBlock, setSelectedTimeBlock] = useState<{
    start: number;
    end: number;
  } | null>(null);
  const [showEarlierHours, setShowEarlierHours] = useState(false);
  const [showLaterHours, setShowLaterHours] = useState(false);

  const { projects } = useProjects();
  const { entries, addEntry } = useTimeEntries(currentDate);
  const { settings } = useUserSettings();

  // Calculate the actual range of hours based on entries
  const getActualHoursRange = () => {
    if (entries.length === 0) {
      return {
        start: settings.day_start_hour,
        end: settings.day_end_hour
      };
    }

    const earliestEntry = Math.min(...entries.map(e => Math.floor(e.start_time)));
    const latestEntry = Math.max(...entries.map(e => Math.ceil(e.end_time)));

    return {
      start: Math.min(earliestEntry, settings.day_start_hour),
      end: Math.max(latestEntry, settings.day_end_hour)
    };
  };

  const actualRange = getActualHoursRange();

  // Determine the display range
  const displayStartHour = showEarlierHours ? 0 : actualRange.start;
  const displayEndHour = showLaterHours ? 24 : actualRange.end;

  // Check if we can show earlier/later hours
  const canShowEarlier = displayStartHour > 0;
  const canShowLater = displayEndHour < 24;

  const handlePreviousDay = () => {
    setCurrentDate((date) => subDays(date, 1));
    setShowEarlierHours(false);
    setShowLaterHours(false);
  };

  const handleNextDay = () => {
    setCurrentDate((date) => addDays(date, 1));
    setShowEarlierHours(false);
    setShowLaterHours(false);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
    setShowEarlierHours(false);
    setShowLaterHours(false);
  };

  const handleBlockSelect = (start: number, end: number) => {
    setSelectedTimeBlock({ start, end });
    setShowProjectSelector(true);
  };

  const handleProjectSelect = async (projectId: string) => {
    if (!selectedTimeBlock) return;

    await addEntry(projectId, selectedTimeBlock.start, selectedTimeBlock.end);
    setSelectedTimeBlock(null);
  };

  const totalHours = entries.reduce(
    (sum, entry) => sum + (entry.end_time - entry.start_time),
    0
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/30">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Hours and Hours
          </h1>
          <div className="flex items-center gap-2">
            <Link href="/projects">
              <Button variant="ghost" size="icon" className="hover:bg-accent/50">
                <BarChart3 className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="/settings">
              <Button variant="ghost" size="icon" className="hover:bg-accent/50">
                <Settings className="h-5 w-5" />
              </Button>
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={handlePreviousDay}
                className="h-9 w-9 hover:bg-accent/50"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div>
                <h2 className="text-2xl font-bold tracking-tight">
                  {format(currentDate, "EEEE")}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {format(currentDate, "MMMM d, yyyy")}
                </p>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={handleNextDay}
                className="h-9 w-9 hover:bg-accent/50"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleToday}
                className="ml-2 hover:bg-accent/50"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Today
              </Button>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold tabular-nums">{totalHours.toFixed(1)}</span>
              <span className="text-sm text-muted-foreground font-medium">hours</span>
            </div>
          </div>

          <Card className="shadow-sm border-border/50">
            <CardContent className="p-6 space-y-3">
              {canShowEarlier && !showEarlierHours && (
                <button
                  onClick={() => setShowEarlierHours(true)}
                  className="w-full py-2 text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-2 border border-dashed border-border/50 rounded-md hover:border-border hover:bg-accent/30"
                >
                  <ChevronLeft className="h-3 w-3" />
                  Show earlier hours
                </button>
              )}

              <TimeGrid
                entries={entries}
                projects={projects}
                onBlockSelect={handleBlockSelect}
                dayStartHour={displayStartHour}
                dayEndHour={displayEndHour}
                timeIncrement={settings.time_increment}
              />

              {canShowLater && !showLaterHours && (
                <button
                  onClick={() => setShowLaterHours(true)}
                  className="w-full py-2 text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-2 border border-dashed border-border/50 rounded-md hover:border-border hover:bg-accent/30"
                >
                  Show later hours
                  <ChevronRight className="h-3 w-3" />
                </button>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <ProjectSelector
        open={showProjectSelector}
        onClose={() => setShowProjectSelector(false)}
        projects={projects}
        onSelectProject={handleProjectSelect}
      />
    </div>
  );
}
