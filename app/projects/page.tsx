"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Plus, Edit, Trash2, Archive, ArchiveRestore } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProjectForm } from "@/components/project-form";
import { useProjects } from "@/lib/hooks/use-projects";
import { useAuth } from "@/lib/hooks/use-auth";

export default function ProjectsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { projects, isLoading, addProject, updateProject, deleteProject, toggleArchive } = useProjects();
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

  // Sort projects alphabetically
  const sortedProjects = [...projects].sort((a, b) => a.name.localeCompare(b.name));

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
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Projects</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">

        <div className="space-y-3">
          {isLoading ? (
            <Card>
              <CardContent className="text-center text-muted-foreground text-sm">
                Loading projects...
              </CardContent>
            </Card>
          ) : projects.length === 0 ? (
            <Card>
              <CardContent className="text-center text-muted-foreground text-sm py-8">
                No projects yet. Create your first project below!
              </CardContent>
            </Card>
          ) : (
            sortedProjects.map((project) => (
              <Card key={project.id} className={project.archived ? "opacity-60" : ""}>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge
                        className="w-3 h-3 rounded-full p-0"
                        style={{ backgroundColor: project.color }}
                      />
                      <span className="font-semibold text-lg">
                        {project.name}
                        {project.archived && (
                          <span className="ml-2 text-xs text-muted-foreground font-normal">
                            (archived)
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => toggleArchive(project.id)}
                        title={project.archived ? "Unarchive project" : "Archive project"}
                      >
                        {project.archived ? (
                          <ArchiveRestore className="h-3.5 w-3.5" />
                        ) : (
                          <Archive className="h-3.5 w-3.5" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setEditingProject({
                          id: project.id,
                          name: project.name,
                          color: project.color,
                        })}
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleDeleteProject(project.id, project.name)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Add Project Button */}
        <div className="mt-4">
          <Button onClick={() => setShowAddProject(true)} className="w-full gap-2 h-12 text-base" variant="outline">
            <Plus className="h-5 w-5" />
            Add Project
          </Button>
        </div>
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
