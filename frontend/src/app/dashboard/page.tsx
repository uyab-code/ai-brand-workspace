"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useAuth } from "@/hooks/useAuth"
import { organizationsApi } from "@/api/organizations"
import { clientsApi } from "@/api/clients"
import { contentBriefsApi } from "@/api/content-briefs"
import { creditsApi } from "@/api/credits"
import { activitiesApi } from "@/api/activities"
import { ContentBrief, ContentStatus } from "@/types/content-brief"
import { CreditBalance } from "@/types/credit"
import { Activity, ACTIVITY_VERBS } from "@/types/activity"
import { StatusBadge } from "@/components/ui/status-badge"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import {
  Users, FileText, Coins, ListTodo, Plus, Sparkles,
  CalendarClock, Activity as ActivityIcon, PlusCircle, Pencil, Trash2, ArrowRightCircle,
} from "lucide-react"

const INCOMPLETE_STATUSES: ContentStatus[] = ["draft", "in_progress", "in_review"]

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

function activityIcon(action: Activity["action"]) {
  switch (action) {
    case "create":
      return { icon: PlusCircle, cls: "bg-primary/10 text-primary" }
    case "update":
      return { icon: Pencil, cls: "bg-primary/10 text-primary" }
    case "status_change":
      return { icon: ArrowRightCircle, cls: "bg-accent/10 text-accent" }
    case "generate":
      return { icon: Sparkles, cls: "bg-accent/10 text-accent" }
    case "delete":
      return { icon: Trash2, cls: "bg-red-50 text-red-600" }
  }
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [clientsCount, setClientsCount] = useState(0)
  const [briefsCount, setBriefsCount] = useState(0)
  const [incompleteCount, setIncompleteCount] = useState(0)
  const [upcomingBriefs, setUpcomingBriefs] = useState<ContentBrief[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [creditBalance, setCreditBalance] = useState<CreditBalance | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadStats() }, [])

  const loadStats = async () => {
    const orgRes = await organizationsApi.list()
    if (orgRes.success && orgRes.data.length) {
      const orgId = orgRes.data[0].id
      const [clRes, briefsRes, upcomingRes, creditRes, actRes] = await Promise.all([
        clientsApi.list(orgId),
        contentBriefsApi.list(orgId),
        contentBriefsApi.getUpcoming(),
        creditsApi.getBalance(orgId),
        activitiesApi.list(orgId),
      ])
      if (clRes.success) setClientsCount(clRes.data.length)
      if (briefsRes.success) {
        setBriefsCount(briefsRes.data.length)
        setIncompleteCount(
          briefsRes.data.filter((b) => INCOMPLETE_STATUSES.includes(b.status as ContentStatus)).length
        )
      }
      if (upcomingRes.success) setUpcomingBriefs(upcomingRes.data)
      if (creditRes.success) setCreditBalance(creditRes.data)
      if (actRes.success) setActivities(actRes.data)
    }
    setLoading(false)
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <PageHeader
        title={`Selamat datang, ${user?.name || "User"}`}
        description="Kelola brand asset dan konten Anda"
        actions={
          <Link href="/dashboard/content-briefs">
            <Button>
              <Plus className="h-4 w-4 mr-1" />
              Buat Brief
            </Button>
          </Link>
        }
      />

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/dashboard/clients">
          <div className="group bg-card rounded-lg border border-border p-5 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-modal hover:border-t-2 hover:border-t-primary cursor-pointer">
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl font-semibold text-foreground">{loading ? "..." : clientsCount}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Total Clients</p>
          </div>
        </Link>

        <Link href="/dashboard/content-briefs">
          <div className="group bg-card rounded-lg border border-border p-5 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-modal hover:border-t-2 hover:border-t-primary cursor-pointer">
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                <FileText className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl font-semibold text-foreground">{loading ? "..." : briefsCount}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Content Briefs</p>
          </div>
        </Link>

        <div className="group bg-card rounded-lg border border-border p-5 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-modal hover:border-t-2 hover:border-t-primary">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-md bg-primary/10 text-primary flex items-center justify-center">
              <Coins className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-semibold text-foreground">{loading ? "..." : creditBalance?.balance ?? 0}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Credits Tersisa</p>
        </div>

        <Link href="/dashboard/content-briefs">
          <div className="group bg-card rounded-lg border border-border p-5 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-modal hover:border-t-2 hover:border-t-accent cursor-pointer">
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-md bg-accent/10 text-accent flex items-center justify-center">
                <ListTodo className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl font-semibold text-foreground">{loading ? "..." : incompleteCount}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Incomplete Tasks</p>
          </div>
        </Link>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Briefs — table */}
        <div className="bg-card rounded-lg border border-border shadow-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-accent" />
              Upcoming Briefs
            </h3>
          </div>
          <div className="p-5">
            {loading ? (
              <div className="flex justify-center py-6">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
              </div>
            ) : upcomingBriefs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Belum ada brief dengan deadline</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-background/95 backdrop-blur">
                      <th className="text-left py-3 px-3 font-medium text-muted-foreground">Nama Brief</th>
                      <th className="text-left py-3 px-3 font-medium text-muted-foreground">Status</th>
                      <th className="text-left py-3 px-3 font-medium text-muted-foreground">Deadline</th>
                    </tr>
                  </thead>
                  <tbody>
                    {upcomingBriefs.map((b) => (
                      <tr
                        key={b.id}
                        className="border-b transition-colors hover:bg-primary/5 even:bg-primary/[0.02] cursor-pointer"
                        onClick={() => (window.location.href = `/dashboard/content-briefs/${b.id}`)}
                      >
                        <td className="py-3 px-3 font-semibold text-foreground">{b.name}</td>
                        <td className="py-3 px-3">
                          <StatusBadge status={b.status as ContentStatus} />
                        </td>
                        <td className="py-3 px-3 text-muted-foreground text-xs">
                          {b.deadline_date ? new Date(b.deadline_date).toLocaleDateString("id-ID") : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Activity Feed */}
        <div className="bg-card rounded-lg border border-border shadow-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <ActivityIcon className="h-4 w-4 text-accent" />
              Activity Feed
            </h3>
          </div>
          <div className="p-5">
            {loading ? (
              <div className="flex justify-center py-6">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
              </div>
            ) : activities.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Belum ada aktivitas</p>
            ) : (
              <div className="space-y-0.5">
                {activities.map((a) => {
                  const { icon: Icon, cls } = activityIcon(a.action)
                  return (
                    <div key={a.id} className="flex items-start gap-3 py-2">
                      <span className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${cls}`}>
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground">
                          <span className="font-medium">{a.user_name}</span>{" "}
                          <span className="text-muted-foreground">{ACTIVITY_VERBS[a.action]}</span>{" "}
                          <span className="font-medium">{a.entity_name}</span>
                          {a.details && (
                            <span className="text-muted-foreground"> · {a.details}</span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">{relativeTime(a.created_at)}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
