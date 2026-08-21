"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Bell, Menu } from "lucide-react"
import { Avatar } from "@/components/ui/avatar"
import { useAuth } from "@/hooks/useAuth"
import { notificationsApi } from "@/api/notifications"
import { NotificationItem } from "@/types/notification"

function relativeTime(iso: string | null): string {
  if (!iso) return ""
  const then = new Date(iso).getTime()
  const now = Date.now()
  const diff = Math.max(0, now - then)
  const min = Math.floor(diff / 60000)
  if (min < 1) return "baru saja"
  if (min < 60) return `${min} menit lalu`
  const hrs = Math.floor(min / 60)
  if (hrs < 24) return `${hrs} jam lalu`
  return new Date(iso).toLocaleDateString("id-ID")
}

export function Navbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const { user } = useAuth()
  const router = useRouter()
  const userName = user?.name || "User"

  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const pollRef = useRef<number | null>(null)

  const fetchNotifications = useCallback(async () => {
    try {
      const r = await notificationsApi.list()
      if (r.success) {
        setItems(r.data.items)
        setUnreadCount(r.data.unread_count)
      }
    } catch {
      // silent — polling will retry
    }
  }, [])

  // Poll for new notifications every 30s
  useEffect(() => {
    fetchNotifications()
    pollRef.current = window.setInterval(fetchNotifications, 30000)
    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current)
    }
  }, [fetchNotifications])

  const toggleOpen = async () => {
    const next = !open
    setOpen(next)
    if (next) {
      setLoading(true)
      await fetchNotifications()
      setLoading(false)
    }
  }

  const handleItemClick = async (n: NotificationItem) => {
    setOpen(false)
    if (!n.is_read) {
      setItems((prev) => prev.map((i) => (i.id === n.id ? { ...i, is_read: true } : i)))
      setUnreadCount((c) => Math.max(0, c - 1))
      try { await notificationsApi.markRead(n.id) } catch { /* silent */ }
    }
    if (n.entity_type === "content_brief" && n.entity_id) {
      router.push(`/dashboard/content-briefs/${n.entity_id}`)
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllRead()
      setItems((prev) => prev.map((i) => ({ ...i, is_read: true })))
      setUnreadCount(0)
    } catch {
      // silent
    }
  }

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-4 lg:px-6">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground md:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      <div className="flex items-center gap-2">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={toggleOpen}
            aria-label="Notifikasi"
            className="relative flex h-10 w-10 items-center justify-center rounded border border-border text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-foreground">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {open && (
            <>
              {/* Click-outside backdrop */}
              <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
              <div className="absolute right-0 top-12 z-50 w-[340px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-lg border border-border bg-card shadow-modal">
                <div className="flex items-center justify-between border-b border-border px-4 py-3">
                  <h3 className="text-sm font-semibold text-foreground">Notifikasi</h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      Tandai semua dibaca
                    </button>
                  )}
                </div>

                <div className="max-h-[360px] overflow-y-auto">
                  {loading ? (
                    <p className="px-4 py-8 text-center text-sm text-muted-foreground">Memuat...</p>
                  ) : items.length === 0 ? (
                    <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                      Belum ada notifikasi
                    </p>
                  ) : (
                    items.map((n) => (
                      <button
                        key={n.id}
                        onClick={() => handleItemClick(n)}
                        className={`flex w-full items-start gap-3 border-b border-border px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-muted ${
                          n.is_read ? "" : "bg-primary/[0.04]"
                        }`}
                      >
                        <span
                          className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                            n.is_read ? "bg-border" : "bg-primary"
                          }`}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-foreground">
                            {n.title}
                          </span>
                          <span className="block text-xs text-muted-foreground">{n.message}</span>
                          <span className="mt-0.5 block text-[11px] text-muted-foreground/70">
                            {relativeTime(n.created_at)}
                          </span>
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex h-10 items-center gap-2 rounded border border-border bg-card px-2">
          <Avatar name={userName} className="h-7 w-7" />
          <span className="hidden text-sm font-medium text-foreground sm:block">{userName}</span>
        </div>
      </div>
    </header>
  )
}
