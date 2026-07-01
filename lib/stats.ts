import { ProjectStats } from "./types"

export function computeProjectHours(
  slots: Array<{ project_id: string }>,
  projects: Array<{ id: string }>
): Map<string, number> {
  const hoursMap = new Map<string, number>()
  projects.forEach((p) => hoursMap.set(p.id, 0))
  slots.forEach((slot) => {
    hoursMap.set(slot.project_id, (hoursMap.get(slot.project_id) || 0) + 0.25)
  })
  return hoursMap
}

export function hoursMapToStats(hoursMap: Map<string, number>): ProjectStats[] {
  return Array.from(hoursMap.entries())
    .map(([projectId, totalHours]) => ({ projectId, totalHours }))
    .sort((a, b) => b.totalHours - a.totalHours)
}
