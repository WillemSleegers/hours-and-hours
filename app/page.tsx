"use client";

import { useState } from "react";
import { format, addDays, subDays } from "date-fns";
import { ChevronLeft, ChevronRight, Calendar, BarChart3, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

  const { projects } = useProjects();
  const { entries, addEntry } = useTimeEntries(currentDate);
  const { settings } = useUserSettings();

  const handlePreviousDay = () => {
    setCurrentDate((date) => subDays(date, 1));
  };

  const handleNextDay = () => {
    setCurrentDate((date) => addDays(date, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
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
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Hours and Hours</h1>
          <div className="flex items-center gap-2">
            <Link href="/projects">
              <Button variant="ghost" size="icon">
                <BarChart3 className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="/settings">
              <Button variant="ghost" size="icon">
                <Settings className="h-5 w-5" />
              </Button>
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handlePreviousDay}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <CardTitle className="text-xl">
                  {format(currentDate, "EEEE, MMMM d, yyyy")}
                </CardTitle>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleNextDay}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleToday}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Today
                </Button>
              </div>
              <div className="text-lg font-semibold">
                {totalHours} {totalHours === 1 ? "hour" : "hours"}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <TimeGrid
              entries={entries}
              projects={projects}
              onBlockSelect={handleBlockSelect}
              dayStartHour={settings.day_start_hour}
              dayEndHour={settings.day_end_hour}
              timeIncrement={settings.time_increment}
            />
          </CardContent>
        </Card>
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
