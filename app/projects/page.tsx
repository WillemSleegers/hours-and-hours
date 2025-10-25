"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Plus, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { ProjectForm } from "@/components/project-form";
import { useProjects } from "@/lib/hooks/use-projects";
import { useAuth } from "@/lib/hooks/use-auth";
import { supabase } from "@/lib/supabase";

interface ProjectStats {
  projectId: string;
  totalHours: number;
}

export default function ProjectsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { projects, addProject, updateProject, deleteProject } = useProjects();
  const [stats, setStats] = useState<ProjectStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddProject, setShowAddProject] = useState(false);
  const [editingProject, setEditingProject] = useState<{ id: string; name: string; color: string } | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

  const handleAddProject = async (name: string, color: string) => {
    await addProject(name, color);
    setShowAddProject(false);
  };

  const handleEditProject = async (name: string, color: string) => {
    if (editingProject) {
      await updateProject(editingProject.id, name, color);
      setEditingProject(null);
    }
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

  useEffect(() => {
    loadProjectStats();
  }, [projects]);

  const loadProjectStats = async () => {
    try {
      const { data, error } = await supabase
        .from("time_slots")
        .select("project_id");

      if (error) throw error;

      const statsMap = new Map<string, number>();

      // Each slot is 15 minutes = 0.25 hours
      (data as Array<{ project_id: string }>)?.forEach((slot) => {
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
            <h1 className="text-2xl font-bold">Projects</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => setShowAddProject(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Project
            </Button>
            <ThemeToggle />
          </div>
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
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-2xl font-bold">{stat.totalHours}h</div>
                          <div className="text-sm text-muted-foreground">
                            {percentage.toFixed(1)}%
                          </div>
                        </div>
                        {project && (
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setEditingProject({
                                id: project.id,
                                name: project.name,
                                color: project.color,
                              })}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteProject(project.id, project.name)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
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

        {/* All Projects List */}
        {projects.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">All Projects</h2>
            <div className="grid gap-3">
              {projects.map((project) => (
                <Card key={project.id}>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge
                          className="w-4 h-4 rounded-full p-0"
                          style={{ backgroundColor: project.color }}
                        />
                        <span className="font-medium">{project.name}</span>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingProject({
                            id: project.id,
                            name: project.name,
                            color: project.color,
                          })}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteProject(project.id, project.name)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Project Forms */}
      <ProjectForm
        open={showAddProject}
        onClose={() => setShowAddProject(false)}
        onSubmit={handleAddProject}
        title="Create Project"
        description="Add a new project to track your time"
      />

      <ProjectForm
        open={!!editingProject}
        onClose={() => setEditingProject(null)}
        onSubmit={handleEditProject}
        initialName={editingProject?.name}
        initialColor={editingProject?.color}
        title="Edit Project"
        description="Update project details"
      />
    </div>
  );
}
