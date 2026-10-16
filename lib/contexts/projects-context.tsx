"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useAuthContext } from "@/lib/contexts/auth-context"
import { Project } from "@/lib/types"
import { toast } from "sonner"

// Mutations report failures with a toast and roll back their own optimistic
// update; they never throw, and resolve to whether they succeeded.
interface ProjectsContextType {
  projects: Project[]
  isLoading: boolean
  addProject: (name: string, color: string) => Promise<boolean>
  updateProject: (id: string, name: string, color: string) => Promise<boolean>
  deleteProject: (id: string) => Promise<boolean>
  toggleArchive: (id: string) => Promise<boolean>
}

const ProjectsContext = createContext<ProjectsContextType | undefined>(undefined)

const NO_PROJECTS: Project[] = []
const byName = (a: Project, b: Project) => a.name.localeCompare(b.name)

export function ProjectsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuthContext()
  const userId = user?.id

  // Projects are tagged with the user they were loaded for, so they are
  // reloaded on sign-in and never shown to a different (or signed-out) user
  const [loaded, setLoaded] = useState<{ userId: string; projects: Project[] } | null>(null)
  const projects = userId && loaded?.userId === userId ? loaded.projects : NO_PROJECTS
  const isLoading = !!userId && loaded?.userId !== userId

  const updateProjects = (update: (projects: Project[]) => Project[]) => {
    setLoaded((prev) =>
      prev && prev.userId === userId ? { ...prev, projects: update(prev.projects) } : prev
    )
  }

  useEffect(() => {
    if (!userId) return
    let ignore = false

    const loadProjects = async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("name")

      if (ignore) return
      if (error) {
        console.error("Error loading projects:", error)
        toast.error("Failed to load projects")
      }
      setLoaded({ userId, projects: data ?? [] })
    }

    loadProjects()
    return () => {
      ignore = true
    }
  }, [userId])

  const addProject = async (name: string, color: string) => {
    if (!userId) return false

    const tempId = `temp-${Date.now()}`
    const newProject: Project = {
      id: tempId,
      name,
      color,
      archived: false,
    }

    // Optimistic update
    updateProjects((prev) => [...prev, newProject])

    const { data, error } = await supabase
      .from("projects")
      .insert({ name, color, user_id: userId })
      .select()
      .single()

    if (error) {
      // Rollback on error
      updateProjects((prev) => prev.filter((p) => p.id !== tempId))
      console.error("Error adding project:", error)
      toast.error("Failed to create project")
      return false
    }

    // Replace temp project with real one
    updateProjects((prev) => prev.map((p) => (p.id === tempId ? data : p)))
    toast.success("Project created")
    return true
  }

  const updateProject = async (id: string, name: string, color: string) => {
    const oldProject = projects.find((p) => p.id === id)
    if (!oldProject) return false

    // Optimistic update
    updateProjects((prev) => prev.map((p) => (p.id === id ? { ...p, name, color } : p)))

    const { error } = await supabase.from("projects").update({ name, color }).eq("id", id)

    if (error) {
      // Rollback on error
      updateProjects((prev) => prev.map((p) => (p.id === id ? oldProject : p)))
      console.error("Error updating project:", error)
      toast.error("Failed to update project")
      return false
    }

    toast.success("Project updated")
    return true
  }

  const deleteProject = async (id: string) => {
    const oldProject = projects.find((p) => p.id === id)
    if (!oldProject) return false

    // Optimistic update
    updateProjects((prev) => prev.filter((p) => p.id !== id))

    const { error } = await supabase.from("projects").delete().eq("id", id)

    if (error) {
      // Rollback on error - restore only this project
      updateProjects((prev) => [...prev, oldProject].sort(byName))
      console.error("Error deleting project:", error)
      toast.error("Failed to delete project")
      return false
    }

    toast.success("Project deleted")
    return true
  }

  const toggleArchive = async (id: string) => {
    const project = projects.find((p) => p.id === id)
    if (!project) return false

    const newArchivedState = !project.archived

    // Optimistic update
    updateProjects((prev) => prev.map((p) => (p.id === id ? { ...p, archived: newArchivedState } : p)))

    const { error } = await supabase.from("projects").update({ archived: newArchivedState }).eq("id", id)

    if (error) {
      // Rollback on error
      updateProjects((prev) => prev.map((p) => (p.id === id ? project : p)))
      console.error("Error toggling archive:", error)
      toast.error("Failed to update project")
      return false
    }

    toast.success(newArchivedState ? "Project archived" : "Project unarchived")
    return true
  }

  return (
    <ProjectsContext.Provider
      value={{
        projects,
        isLoading,
        addProject,
        updateProject,
        deleteProject,
        toggleArchive,
      }}
    >
      {children}
    </ProjectsContext.Provider>
  )
}

export function useProjectsContext() {
  const context = useContext(ProjectsContext)
  if (context === undefined) {
    throw new Error("useProjectsContext must be used within a ProjectsProvider")
  }
  return context
}
