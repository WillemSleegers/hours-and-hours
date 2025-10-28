import { useState } from "react"
import { ChevronLeft, ChevronRight, Check, X, CalendarDays } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Project } from "@/lib/types"

interface FooterProps {
  onPreviousDay: () => void
  onNextDay: () => void
  onToday: () => void
  onDateSelect: (date: Date) => void
  currentDate: Date
  activeProjectId: string | null
  projects: Project[]
  onProjectSelect: (projectId: string) => void
  onClearProject: () => void
  timeIncrement: 15 | 30 | 60
  onIncrementChange: (increment: 15 | 30 | 60) => void
}

export function Footer({
  onPreviousDay,
  onNextDay,
  onToday,
  onDateSelect,
  currentDate,
  activeProjectId,
  projects,
  onProjectSelect,
  onClearProject,
  timeIncrement,
  onIncrementChange,
}: FooterProps) {
  const [datePickerOpen, setDatePickerOpen] = useState(false)

  // Filter to show only non-archived projects
  const activeProjects = projects.filter((p) => !p.archived)
  return (
    <footer className="sticky bottom-0 z-50 bg-transparent p-3">
      <div className="bg-card border border-border rounded-2xl px-3 py-2 flex flex-wrap items-center gap-3">
        {/* Date navigation */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={onPreviousDay}
            className="h-10 w-10 hover:bg-accent/50"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="hover:bg-accent/50 h-10 w-10"
              >
                <CalendarDays className="h-5 w-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 m-3 mb-[18px]" align="center">
              <Calendar
                mode="single"
                selected={currentDate}
                onSelect={(date) => {
                  if (date) {
                    onDateSelect(date)
                    setDatePickerOpen(false)
                  }
                }}
                initialFocus
              />
              <div className="p-3 border-t">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    onToday()
                    setDatePickerOpen(false)
                  }}
                >
                  Today
                </Button>
              </div>
            </PopoverContent>
          </Popover>
          <Button
            variant="outline"
            size="icon"
            onClick={onNextDay}
            className="h-10 w-10 hover:bg-accent/50"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        {/* Time increment buttons */}
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1 ml-auto">
          <Button
            variant={timeIncrement === 15 ? "default" : "ghost"}
            size="sm"
            onClick={() => onIncrementChange(15)}
            className="h-8 px-3 text-xs"
          >
            15m
          </Button>
          <Button
            variant={timeIncrement === 30 ? "default" : "ghost"}
            size="sm"
            onClick={() => onIncrementChange(30)}
            className="h-8 px-3 text-xs"
          >
            30m
          </Button>
          <Button
            variant={timeIncrement === 60 ? "default" : "ghost"}
            size="sm"
            onClick={() => onIncrementChange(60)}
            className="h-8 px-3 text-xs"
          >
            1h
          </Button>
        </div>

        {/* Project dropdown */}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="default"
              size="sm"
              className={`h-10 px-4 w-full ${
                activeProjectId ? "text-white" : ""
              }`}
              style={
                activeProjectId
                  ? {
                      backgroundColor:
                        projects.find((p) => p.id === activeProjectId)?.color ||
                        undefined,
                      borderColor:
                        projects.find((p) => p.id === activeProjectId)?.color ||
                        undefined,
                    }
                  : undefined
              }
            >
              {activeProjectId
                ? projects.find((p) => p.id === activeProjectId)?.name ||
                  "Select project"
                : "Select project"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" className="w-48">
            {activeProjectId && (
              <>
                <DropdownMenuItem onClick={onClearProject}>
                  <X className="mr-2 h-4 w-4" />
                  Clear Selection
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            {activeProjects.map((project) => (
              <DropdownMenuItem
                key={project.id}
                onClick={() => onProjectSelect(project.id)}
              >
                <div
                  className="mr-2 h-3 w-3 rounded-full"
                  style={{ backgroundColor: project.color }}
                />
                {project.name}
                {activeProjectId === project.id && (
                  <Check className="ml-auto h-4 w-4" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </footer>
  )
}
