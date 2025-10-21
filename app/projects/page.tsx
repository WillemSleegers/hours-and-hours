"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { useProjects } from "@/lib/hooks/use-projects";
import { supabase } from "@/lib/supabase";

interface ProjectStats {
  projectId: string;
  totalHours: number;
}

export default function ProjectsPage() {
  const { projects } = useProjects();
  const [stats, setStats] = useState<ProjectStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProjectStats();
  }, [projects]);

  const loadProjectStats = async () => {
    try {
      const { data, error } = await supabase
        .from("time_entries")
        .select("project_id, start_time, end_time");

      if (error) throw error;

      const statsMap = new Map<string, number>();

      (data as Array<{ project_id: string; start_time: number; end_time: number }>)?.forEach((entry) => {
        const hours = entry.end_time - entry.start_time;
        const currentHours = statsMap.get(entry.project_id) || 0;
        statsMap.set(entry.project_id, currentHours + hours);
      });

      const projectStats = Array.from(statsMap.entries()).map(
        ([projectId, totalHours]) => ({
          projectId,
          totalHours,
        })
      );

      projectStats.sort((a, b) => b.totalHours - a.totalHours);

      setStats(projectStats);
    } catch (error) {
      console.error("Error loading project stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getProject = (projectId: string) => {
    return projects.find((p) => p.id === projectId);
  };

  const totalHours = stats.reduce((sum, stat) => sum + stat.totalHours, 0);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">Project Overview</h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Total Hours Tracked</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{totalHours}</div>
              <p className="text-muted-foreground">
                hours across {stats.length} {stats.length === 1 ? "project" : "projects"}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {isLoading ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Loading project statistics...
              </CardContent>
            </Card>
          ) : stats.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No time entries yet. Start tracking your time on the daily view!
              </CardContent>
            </Card>
          ) : (
            stats.map((stat) => {
              const project = getProject(stat.projectId);
              const percentage = totalHours > 0 ? (stat.totalHours / totalHours) * 100 : 0;

              return (
                <Card key={stat.projectId}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge
                          className="w-4 h-4 rounded-full p-0"
                          style={{ backgroundColor: project?.color || "#94a3b8" }}
                        />
                        <CardTitle className="text-lg">
                          {project?.name || "Unknown Project"}
                        </CardTitle>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">{stat.totalHours}h</div>
                        <div className="text-sm text-muted-foreground">
                          {percentage.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: project?.color || "#94a3b8",
                        }}
                      />
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
