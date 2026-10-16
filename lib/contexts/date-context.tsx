"use client"

import { createContext, useContext, useState } from "react"

interface DateContextType {
  currentDate: Date
  setCurrentDate: (date: Date) => void
}

const DateContext = createContext<DateContextType | undefined>(undefined)

// Holds the selected day above the pages, so navigating to another page
// (e.g. the day stats) and back keeps you on that day instead of today
export function DateProvider({ children }: { children: React.ReactNode }) {
  const [currentDate, setCurrentDate] = useState(() => new Date())

  return (
    <DateContext.Provider value={{ currentDate, setCurrentDate }}>
      {children}
    </DateContext.Provider>
  )
}

export function useDateContext() {
  const context = useContext(DateContext)
  if (context === undefined) {
    throw new Error("useDateContext must be used within a DateProvider")
  }
  return context
}
