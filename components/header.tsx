"use client"

import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { BarChart3, Folder, Settings, LogOut, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/lib/hooks/use-auth"
import { signOut } from "@/lib/auth"
import { toast } from "sonner"

interface HeaderProps {
  totalHours: number
  currentDate: Date
}

export function Header({ totalHours, currentDate }: HeaderProps) {
  const { user } = useAuth()
  const router = useRouter()

  const handleSignOut = async () => {
    try {
      await signOut()
      toast.success("Signed out successfully")
      router.push("/login")
    } catch (error) {
      console.error("Error signing out:", error)
      toast.error("Failed to sign out")
    }
  }

  return (
    <header className="p-3">
      <div className="max-w-4xl mx-auto bg-red-500 border border-border rounded-2xl shadow-sm px-3 py-2">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => router.push(`/day?date=${format(currentDate, "yyyy-MM-dd")}`)}
            className="h-auto px-3 py-1.5 hover:bg-accent flex items-end gap-1.5"
          >
            <span className="text-xl font-bold tabular-nums leading-none">
              {totalHours.toFixed(1)}
            </span>
            <span className="text-xs text-muted-foreground font-medium leading-none pb-0.5">
              hrs today
            </span>
          </Button>
          <div className="text-center">
            <div className="text-sm font-semibold">
              {format(currentDate, "EEE, MMM d")}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Menu className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">Account</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/statistics")}>
                <BarChart3 className="mr-2 h-4 w-4" />
                Statistics
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/projects")}>
                <Folder className="mr-2 h-4 w-4" />
                Projects
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/settings")}>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
