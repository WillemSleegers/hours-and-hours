import { useState } from "react"
import { addDays, subDays } from "date-fns"

export function useDateNavigation(initialDate: Date = new Date()) {
  const [currentDate, setCurrentDate] = useState(initialDate)

  const handlePreviousDay = () => setCurrentDate((date) => subDays(date, 1))
  const handleNextDay = () => setCurrentDate((date) => addDays(date, 1))
  const handleToday = () => setCurrentDate(new Date())

  return { currentDate, setCurrentDate, handlePreviousDay, handleNextDay, handleToday }
}
