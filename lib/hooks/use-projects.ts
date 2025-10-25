"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Project } from "@/lib/types";
import { toast } from "sonner";

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const { data, error } = await supabase
          .from("projects")
          .select("*")
          .order("name");

        if (error) throw error;
        setProjects((data as Project[]) || []);
      } catch (error) {
        console.error("Error loading projects:", error);
        toast.error("Failed to load projects");
      } finally {
        setIsLoading(false);
      }
    };

    loadProjects();
  }, []);

  const addProject = async (name: string, color: string) => {
    const tempId = `temp-${Date.now()}`;
    const newProject: Project = {
      id: tempId,
      name,
      color,
      archived: false,
    };

    // Optimistic update
    setProjects((prev) => [...prev, newProject]);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("projects")
        .insert({ name, color, user_id: user.id })
        .select()
        .single();

      if (error) throw error;

      // Replace temp project with real one
      setProjects((prev) =>
        prev.map((p) => (p.id === tempId ? (data as Project) : p))
      );

      toast.success("Project created");
      return data;
    } catch (error) {
      // Rollback on error
      setProjects((prev) => prev.filter((p) => p.id !== tempId));
      console.error("Error adding project:", error);
      toast.error("Failed to create project");
      throw error;
    }
  };

  const updateProject = async (id: string, name: string, color: string) => {
    const oldProject = projects.find((p) => p.id === id);
    if (!oldProject) return;

    // Optimistic update
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, name, color } : p))
    );

    try {
      const { error } = await supabase
        .from("projects")
        .update({ name, color })
        .eq("id", id);

      if (error) throw error;
      toast.success("Project updated");
    } catch (error) {
      // Rollback on error
      setProjects((prev) =>
        prev.map((p) => (p.id === id ? oldProject : p))
      );
      console.error("Error updating project:", error);
      toast.error("Failed to update project");
      throw error;
    }
  };

  const deleteProject = async (id: string) => {
    const oldProjects = [...projects];

    // Optimistic update
    setProjects((prev) => prev.filter((p) => p.id !== id));

    try {
      const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Project deleted");
    } catch (error) {
      // Rollback on error
      setProjects(oldProjects);
      console.error("Error deleting project:", error);
      toast.error("Failed to delete project");
      throw error;
    }
  };

  const toggleArchive = async (id: string) => {
    const project = projects.find((p) => p.id === id);
    if (!project) return;

    const newArchivedState = !project.archived;

    // Optimistic update
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, archived: newArchivedState } : p))
    );

    try {
      const { error } = await supabase
        .from("projects")
        .update({ archived: newArchivedState })
        .eq("id", id);

      if (error) throw error;
      toast.success(newArchivedState ? "Project archived" : "Project unarchived");
    } catch (error) {
      // Rollback on error
      setProjects((prev) =>
        prev.map((p) => (p.id === id ? project : p))
      );
      console.error("Error toggling archive:", error);
      toast.error("Failed to update project");
      throw error;
    }
  };

  return {
    projects,
    isLoading,
    addProject,
    updateProject,
    deleteProject,
    toggleArchive,
  };
}
