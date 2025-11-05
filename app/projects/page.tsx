"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Edit, Trash2, Archive, ArchiveRestore, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Header } from "@/components/header";
import { ProjectForm } from "@/components/project-form";
import { useProjects } from "@/lib/hooks/use-projects";
import { useAuth } from "@/lib/hooks/use-auth";

export default function ProjectsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { projects, isLoading, addProject, updateProject, deleteProject, toggleArchive } = useProjects();
  const [showAddProject, setShowAddProject] = useState(false);
  const [editingProject, setEditingProject] = useState<{ id: string; name: string; color: string } | null>(null);
  const [deletingProject, setDeletingProject] = useState<{ id: string; name: string } | null>(null);

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

  const handleDeleteProject = async () => {
    if (deletingProject) {
      await deleteProject(deletingProject.id);
      setDeletingProject(null);
    }
  };

  // Sort projects alphabetically
  const sortedProjects = [...projects].sort((a, b) => a.name.localeCompare(b.name));

  // Don't render if not authenticated (will redirect)
  if (authLoading || !user) {
    return null;
  }

  return (
    <div className="bg-background max-w-xl mx-auto min-h-screen">
      <Header title="Projects" showBack />

      <main className="px-3 pb-3">

        {isLoading ? (
          <Card>
            <CardContent className="text-center text-muted-foreground text-sm py-8">
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
          <Card className="py-0">
            <CardContent className="!p-0">
              <div className="divide-y divide-border/50">
                {sortedProjects.map((project) => (
                  <div key={project.id} className={`px-4 py-3 ${project.archived ? "opacity-60" : ""}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge
                          className="w-3 h-3 rounded-full p-0"
                          style={{ backgroundColor: project.color }}
                        />
                        <span className="font-semibold text-base">
                          {project.name}
                          {project.archived && (
                            <span className="ml-2 text-xs text-muted-foreground font-normal">
                              (archived)
                            </span>
                          )}
                        </span>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditingProject({
                            id: project.id,
                            name: project.name,
                            color: project.color,
                          })}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toggleArchive(project.id)}>
                            {project.archived ? (
                              <>
                                <ArchiveRestore className="mr-2 h-4 w-4" />
                                Unarchive
                              </>
                            ) : (
                              <>
                                <Archive className="mr-2 h-4 w-4" />
                                Archive
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setDeletingProject({ id: project.id, name: project.name })}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

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

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingProject} onOpenChange={(open) => !open && setDeletingProject(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete &quot;{deletingProject?.name}&quot;?</DialogTitle>
            <DialogDescription>
              This will permanently delete:
              <br />
              • The project
              <br />
              • All time slots for this project
              <br />
              • All notes associated with these time slots
              <br />
              <br />
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingProject(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteProject}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
