"use client";

import { Project } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ProjectSelectorProps {
  open: boolean;
  onClose: () => void;
  projects: Project[];
  onSelectProject: (projectId: string) => void;
}

export function ProjectSelector({
  open,
  onClose,
  projects,
  onSelectProject,
}: ProjectSelectorProps) {
  const handleSelect = (projectId: string) => {
    onSelectProject(projectId);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Select a project</DialogTitle>
          <DialogDescription>
            Choose which project these hours belong to
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2 py-4">
          {projects.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No projects yet. Create one in Settings.
            </p>
          ) : (
            projects.map((project) => (
              <Button
                key={project.id}
                variant="outline"
                className="justify-start h-auto py-3"
                onClick={() => handleSelect(project.id)}
              >
                <Badge
                  className="mr-2 w-4 h-4 rounded-full p-0"
                  style={{ backgroundColor: project.color }}
                />
                <span>{project.name}</span>
              </Button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
