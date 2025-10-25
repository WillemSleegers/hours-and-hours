"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ThemeToggle } from "@/components/theme-toggle";
import { ProjectForm } from "@/components/project-form";
import { useProjects } from "@/lib/hooks/use-projects";
import { useUserSettings } from "@/lib/hooks/use-user-settings";
import { useAuth } from "@/lib/hooks/use-auth";

export default function SettingsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { projects, addProject, deleteProject } = useProjects();
  const { settings, updateSettings } = useUserSettings();
  const [showAddProject, setShowAddProject] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

  const handleAddProject = async (name: string, color: string) => {
    await addProject(name, color);
  };

  const handleDeleteProject = async (projectId: string, projectName: string) => {
    if (
      confirm(
        `Are you sure you want to delete "${projectName}"? This will also delete all associated time entries.`
      )
    ) {
      await deleteProject(projectId);
    }
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
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">Settings</h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Time Tracking Preferences</CardTitle>
            <CardDescription>
              Configure how you want to track your time
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dayStart">Day Start</Label>
                <Select
                  value={settings.day_start_hour.toString()}
                  onValueChange={(value) => updateSettings({ day_start_hour: parseInt(value) })}
                >
                  <SelectTrigger id="dayStart">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }, (_, i) => (
                      <SelectItem key={i} value={i.toString()}>
                        {i.toString().padStart(2, "0")}:00
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dayEnd">Day End</Label>
                <Select
                  value={settings.day_end_hour.toString()}
                  onValueChange={(value) => updateSettings({ day_end_hour: parseInt(value) })}
                >
                  <SelectTrigger id="dayEnd">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }, (_, i) => i + 1).map((hour) => (
                      <SelectItem key={hour} value={hour.toString()}>
                        {hour.toString().padStart(2, "0")}:00
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Projects</CardTitle>
              <Button onClick={() => setShowAddProject(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Project
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {projects.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No projects yet. Create your first project to start tracking time.
              </div>
            ) : (
              <div className="space-y-2">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Badge
                        className="w-4 h-4 rounded-full p-0"
                        style={{ backgroundColor: project.color }}
                      />
                      <span className="font-medium">{project.name}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteProject(project.id, project.name)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>About</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              <strong>Hours and Hours</strong> is an intuitive time tracking app focused
              on simplicity and ease of use.
            </p>
            <p>
              Drag to select time blocks on the daily view, assign them to projects,
              and track your progress over time.
            </p>
          </CardContent>
        </Card>
      </main>

      <ProjectForm
        open={showAddProject}
        onClose={() => setShowAddProject(false)}
        onSubmit={handleAddProject}
        title="Add Project"
        description="Create a new project to track your time"
      />
    </div>
  );
}
