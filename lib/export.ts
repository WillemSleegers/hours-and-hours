import { format } from "date-fns"

interface ExportSlot {
  project_id: string
  date: string
  time_slot: number
  note?: string | null
  projectName?: string
  projectColor?: string
}

function formatTimeSlot(timeSlot: number): string {
  const hour = Math.floor(timeSlot)
  const minute = (timeSlot % 1) * 60
  return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`
}

export function exportToCSV(slots: ExportSlot[], detailed = false) {
  if (detailed) {
    // Detailed export: one row per time slot
    const headers = ["Date", "Project", "Start Time", "End Time", "Note"]
    const rows: string[][] = [headers]

    // Sort by date and time
    const sortedSlots = [...slots].sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date)
      return a.time_slot - b.time_slot
    })

    sortedSlots.forEach((slot) => {
      const projectName = slot.projectName || "Unknown Project"
      const startTime = formatTimeSlot(slot.time_slot)
      const endTime = formatTimeSlot(slot.time_slot + 0.25)
      const note = slot.note || ""

      rows.push([slot.date, projectName, startTime, endTime, note])
    })

    // Convert to CSV string
    const csvContent = rows
      .map((row) =>
        row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")
      )
      .join("\n")

    // Create and download file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `time-tracking-detailed-${format(new Date(), "yyyy-MM-dd")}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } else {
    // Summary export: group by date and project
    const grouped = new Map<string, Map<string, { hours: number; notes: string[] }>>()

    slots.forEach((slot) => {
      const dateKey = slot.date
      const projectKey = slot.project_id

      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, new Map())
      }

      const dateGroup = grouped.get(dateKey)!
      if (!dateGroup.has(projectKey)) {
        dateGroup.set(projectKey, { hours: 0, notes: [] })
      }

      const projectData = dateGroup.get(projectKey)!
      projectData.hours += 0.25 // Each slot is 15 minutes
      if (slot.note) {
        projectData.notes.push(slot.note)
      }
    })

    // Create CSV content
    const headers = ["Date", "Project", "Hours", "Notes"]
    const rows: string[][] = [headers]

    // Sort by date
    const sortedDates = Array.from(grouped.keys()).sort()

    sortedDates.forEach((date) => {
      const dateGroup = grouped.get(date)!
      dateGroup.forEach((data, projectId) => {
        const slot = slots.find((s) => s.project_id === projectId)
        const projectName = slot?.projectName || "Unknown Project"
        const notes = data.notes.join("; ")

        rows.push([date, projectName, data.hours.toString(), notes])
      })
    })

    // Convert to CSV string
    const csvContent = rows
      .map((row) =>
        row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")
      )
      .join("\n")

    // Create and download file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `time-tracking-summary-${format(new Date(), "yyyy-MM-dd")}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
}

export function exportToJSON(slots: ExportSlot[]) {
  // Sort by date and time
  const sortedSlots = [...slots].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date)
    return a.time_slot - b.time_slot
  })

  // Create structured JSON data
  const exportData = {
    exportDate: new Date().toISOString(),
    totalSlots: slots.length,
    totalHours: slots.length * 0.25,
    slots: sortedSlots.map((slot) => ({
      date: slot.date,
      project: {
        id: slot.project_id,
        name: slot.projectName || "Unknown Project",
        color: slot.projectColor,
      },
      startTime: formatTimeSlot(slot.time_slot),
      endTime: formatTimeSlot(slot.time_slot + 0.25),
      timeSlotNumber: slot.time_slot,
      hours: 0.25,
      note: slot.note || null,
    })),
  }

  // Create and download file
  const jsonContent = JSON.stringify(exportData, null, 2)
  const blob = new Blob([jsonContent], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `time-tracking-${format(new Date(), "yyyy-MM-dd")}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
