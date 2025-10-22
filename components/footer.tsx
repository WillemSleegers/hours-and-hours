import { ChevronLeft, ChevronRight, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Project } from "@/lib/types"

interface FooterProps {
  onPreviousDay: () => void
  onNextDay: () => void
  onToday: () => void
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
  activeProjectId,
  projects,
  onProjectSelect,
  onClearProject,
  timeIncrement,
  onIncrementChange,
}: FooterProps) {
  return (
    <footer className="p-3">
      <div className="max-w-4xl mx-auto bg-card border border-border rounded-2xl shadow-sm px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Date navigation */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={onPreviousDay}
              className="h-10 w-10 hover:bg-accent/50"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToday}
              className="hover:bg-accent/50 h-10 text-xs px-3"
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={onNextDay}
              className="h-10 w-10 hover:bg-accent/50"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          {/* Center: Time increment buttons */}
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
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

          {/* Right: Select Project (most frequent action) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="default"
                size="sm"
                className="h-10 px-4 w-32"
                style={
                  activeProjectId
                    ? {
                        backgroundColor:
                          projects.find((p) => p.id === activeProjectId)
                            ?.color || undefined,
                        borderColor:
                          projects.find((p) => p.id === activeProjectId)
                            ?.color || undefined,
                      }
                    : undefined
                }
              >
                {activeProjectId
                  ? projects.find((p) => p.id === activeProjectId)?.name ||
                    "Project"
                  : "Project"}
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
              {projects.map((project) => (
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
      </div>
    </footer>
  )
}
