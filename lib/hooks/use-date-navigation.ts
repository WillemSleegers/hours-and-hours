import { addDays, subDays } from "date-fns"
import { useDateContext } from "@/lib/contexts/date-context"

// The selected day is shared across pages via DateProvider
export function useDateNavigation() {
  const { currentDate, setCurrentDate } = useDateContext()

  const handlePreviousDay = () => setCurrentDate(subDays(currentDate, 1))
  const handleNextDay = () => setCurrentDate(addDays(currentDate, 1))
  const handleToday = () => setCurrentDate(new Date())

  return { currentDate, setCurrentDate, handlePreviousDay, handleNextDay, handleToday }
}
