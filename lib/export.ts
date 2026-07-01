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

function sortSlotsByDateTime(slots: ExportSlot[]): ExportSlot[] {
  return [...slots].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date)
    return a.time_slot - b.time_slot
  })
}

function serializeToCSV(rows: string[][]): string {
  return rows
    .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","))
    .join("\n")
}

function downloadFile(content: string, mimeType: string, filename: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function exportToCSV(slots: ExportSlot[], detailed = false) {
  if (detailed) {
    const headers = ["Date", "Project", "Start Time", "End Time", "Note"]
    const rows: string[][] = [headers]

    sortSlotsByDateTime(slots).forEach((slot) => {
      rows.push([
        slot.date,
        slot.projectName || "Unknown Project",
        formatTimeSlot(slot.time_slot),
        formatTimeSlot(slot.time_slot + 0.25),
        slot.note || "",
      ])
    })

    downloadFile(
      serializeToCSV(rows),
      "text/csv;charset=utf-8;",
      `time-tracking-detailed-${format(new Date(), "yyyy-MM-dd")}.csv`
    )
  } else {
    const grouped = new Map<string, Map<string, { hours: number; notes: string[] }>>()

    slots.forEach((slot) => {
      if (!grouped.has(slot.date)) grouped.set(slot.date, new Map())
      const dateGroup = grouped.get(slot.date)!
      if (!dateGroup.has(slot.project_id)) dateGroup.set(slot.project_id, { hours: 0, notes: [] })
      const projectData = dateGroup.get(slot.project_id)!
      projectData.hours += 0.25
      if (slot.note) projectData.notes.push(slot.note)
    })

    const headers = ["Date", "Project", "Hours", "Notes"]
    const rows: string[][] = [headers]

    Array.from(grouped.keys()).sort().forEach((date) => {
      grouped.get(date)!.forEach((data, projectId) => {
        const projectName = slots.find((s) => s.project_id === projectId)?.projectName || "Unknown Project"
        rows.push([date, projectName, data.hours.toString(), data.notes.join("; ")])
      })
    })

    downloadFile(
      serializeToCSV(rows),
      "text/csv;charset=utf-8;",
      `time-tracking-summary-${format(new Date(), "yyyy-MM-dd")}.csv`
    )
  }
}

export function exportToJSON(slots: ExportSlot[]) {
  const exportData = {
    exportDate: new Date().toISOString(),
    totalSlots: slots.length,
    totalHours: slots.length * 0.25,
    slots: sortSlotsByDateTime(slots).map((slot) => ({
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

  downloadFile(
    JSON.stringify(exportData, null, 2),
    "application/json",
    `time-tracking-${format(new Date(), "yyyy-MM-dd")}.json`
  )
}
