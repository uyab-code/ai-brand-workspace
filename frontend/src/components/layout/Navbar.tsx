"use client"

import { Bell, Menu, Search } from "lucide-react"
import { Avatar } from "@/components/ui/avatar"
import { useAuth } from "@/hooks/useAuth"

export function Navbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const { user } = useAuth()
  const userName = user?.name || "User"

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-4 lg:px-6">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground md:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="relative hidden w-[420px] lg:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            className="h-10 w-full rounded border border-input bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            placeholder="Search clients, briefs, assets..."
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button className="flex h-10 w-10 items-center justify-center rounded border border-border text-muted-foreground hover:bg-muted hover:text-foreground">
          <Bell className="h-4 w-4" />
        </button>
        <div className="flex h-10 items-center gap-2 rounded border border-border bg-card px-2">
          <Avatar name={userName} className="h-7 w-7" />
          <span className="hidden text-sm font-medium text-foreground sm:block">{userName}</span>
        </div>
      </div>
    </header>
  )
}