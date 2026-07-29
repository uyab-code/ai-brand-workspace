"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useAuth } from "@/hooks/useAuth"
import { organizationsApi } from "@/api/organizations"
import { clientsApi } from "@/api/clients"
import { contentBriefsApi } from "@/api/content-briefs"
import { designsApi } from "@/api/designs"
import { creditsApi } from "@/api/credits"
import { ContentBrief, CONTENT_STATUS_LABELS, ContentStatus } from "@/types/content-brief"
import { GeneratedDesign } from "@/types/design"
import { CreditBalance } from "@/types/credit"
import { StatusBadge } from "@/components/ui/status-badge"
import { PageHeader } from "@/components/ui/page-header"

export default function DashboardPage() {
  const { user } = useAuth()
  const [clientsCount, setClientsCount] = useState(0)
  const [briefsCount, setBriefsCount] = useState(0)
  const [upcomingBriefs, setUpcomingBriefs] = useState<ContentBrief[]>([])
  const [recentDesigns, setRecentDesigns] = useState<GeneratedDesign[]>([])
  const [creditBalance, setCreditBalance] = useState<CreditBalance | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadStats() }, [])

  const loadStats = async () => {
    const orgRes = await organizationsApi.list()
    if (orgRes.success && orgRes.data.length) {
      const orgId = orgRes.data[0].id
      const [clRes, statsRes, upcomingRes, creditRes] = await Promise.all([
        clientsApi.list(orgId),
        contentBriefsApi.stats(orgId),
        contentBriefsApi.getUpcoming(),
        creditsApi.getBalance(orgId),
      ])
      if (clRes.success) setClientsCount(clRes.data.length)
      if (statsRes.success) setBriefsCount(statsRes.data.total)
      if (upcomingRes.success) setUpcomingBriefs(upcomingRes.data)
      if (creditRes.success) setCreditBalance(creditRes.data)

      const allDesigns: GeneratedDesign[] = []
      if (clRes.success) {
        await Promise.allSettled(
          clRes.data.map(async (cl) => {
            const dr = await designsApi.listByClient(cl.id)
            if (dr.success) allDesigns.push(...dr.data)
          })
        )
        allDesigns.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
        setRecentDesigns(allDesigns.slice(0, 4))
      }
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <PageHeader
        title={`Selamat datang, ${user?.name || "User"}`}
        description="Kelola brand asset dan konten Anda"
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Link href="/dashboard/clients">
          <div className="bg-card rounded-xl border border-border p-4 hover:border-primary/20 hover:shadow-sm transition-all cursor-pointer">
            <p className="text-2xl font-semibold text-foreground">{loading ? "..." : clientsCount}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Total Clients</p>
          </div>
        </Link>

        <Link href="/dashboard/content-briefs">
          <div className="bg-card rounded-xl border border-border p-4 hover:border-primary/20 hover:shadow-sm transition-all cursor-pointer">
            <p className="text-2xl font-semibold text-foreground">{loading ? "..." : briefsCount}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Content Briefs</p>
          </div>
        </Link>

        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-2xl font-semibold text-foreground">{loading ? "..." : creditBalance?.balance ?? 0}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Credits Tersisa</p>
        </div>

        <Link href="/dashboard/content-briefs">
          <div className="bg-card rounded-xl border border-border p-4 hover:border-primary/20 hover:shadow-sm transition-all cursor-pointer">
            <p className="text-lg font-semibold text-primary">+ Buat Brief</p>
            <p className="text-xs text-muted-foreground mt-0.5">Buat konten baru</p>
          </div>
        </Link>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Designs */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground">Recent Designs</h3>
          </div>
          <div className="p-5">
            {recentDesigns.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Belum ada desain</p>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {recentDesigns.map((d) => (
                  <Link key={d.id} href={`/dashboard/designs/${d.id}`}>
                    <img
                      src={d.image_url}
                      alt=""
                      className="aspect-square object-cover rounded-lg bg-background"
                      onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/100x100?text=AI&font=montserrat" }}
                    />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Briefs */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground">Upcoming Briefs</h3>
          </div>
          <div className="p-5">
            {loading ? (
              <div className="flex justify-center py-6">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
              </div>
            ) : upcomingBriefs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Belum ada brief dengan deadline</p>
            ) : (
              <div className="space-y-1">
                {upcomingBriefs.map((b) => (
                  <Link
                    key={b.id}
                    href={`/dashboard/content-briefs/${b.id}`}
                    className="flex items-center justify-between px-2 py-2 rounded-lg hover:bg-background transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <StatusBadge status={b.status as ContentStatus} />
                      <span className="text-sm text-foreground">{b.name.length > 30 ? b.name.slice(0, 30) + "..." : b.name}</span>
                    </div>
                    {b.deadline_date && (
                      <span className="text-xs text-muted-foreground">{new Date(b.deadline_date).toLocaleDateString("id-ID")}</span>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}