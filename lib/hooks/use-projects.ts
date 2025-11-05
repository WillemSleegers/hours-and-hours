"use client"

import { useProjectsContext } from "@/lib/contexts/projects-context"

export function useProjects() {
  return useProjectsContext()
}
