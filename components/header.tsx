import Link from "next/link"
import { format } from "date-fns"
import { BarChart3, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"

interface HeaderProps {
  totalHours: number
  currentDate: Date
}

export function Header({ totalHours, currentDate }: HeaderProps) {
  return (
    <header className="p-3">
      <div className="max-w-4xl mx-auto bg-card border border-border rounded-2xl shadow-sm px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-bold tabular-nums">
              {totalHours.toFixed(1)}
            </span>
            <span className="text-xs text-muted-foreground font-medium">
              hrs today
            </span>
          </div>
          <div className="text-center">
            <div className="text-sm font-semibold">
              {format(currentDate, "EEEE, MMMM d, yyyy")}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Link href="/projects">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <BarChart3 className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/settings">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Settings className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}
