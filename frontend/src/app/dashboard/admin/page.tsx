"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { api } from "@/lib/api"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Building2, Briefcase, FileText, Image, CreditCard } from "lucide-react"

interface AdminStats {
  total_users: number
  total_organizations: number
  total_clients: number
  total_briefs: number
  total_designs: number
  total_credits_used: number
}

interface OrgStats {
  id: string
  name: string
  owner_email: string
  member_count: number
  client_count: number
  brief_count: number
  design_count: number
  credit_balance: number
  credit_used: number
  created_at: string | null
}

const statCards = [
  { key: "total_users", label: "Users", icon: Users },
  { key: "total_organizations", label: "Organizations", icon: Building2 },
  { key: "total_clients", label: "Clients", icon: Briefcase },
  { key: "total_briefs", label: "Content Briefs", icon: FileText },
  { key: "total_designs", label: "Designs", icon: Image },
  { key: "total_credits_used", label: "Credits Used", icon: CreditCard },
]

export default function AdminPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [orgs, setOrgs] = useState<OrgStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (user === null) return
    if (!user.is_superuser) {
      router.push("/dashboard")
      return
    }
    loadData()
  }, [user])

  const loadData = async () => {
    try {
      const [statsRes, orgsRes] = await Promise.all([
        api.get("/admin/stats"),
        api.get("/admin/organizations"),
      ])
      if (statsRes.data.success) setStats(statsRes.data.data)
      if (orgsRes.data.success) setOrgs(orgsRes.data.data)
    } catch (e: any) {
      setError(e.response?.data?.error?.message || "Gagal memuat data admin")
    }
    setLoading(false)
  }

  if (user && !user.is_superuser) return null

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
    </div>
  )

  if (error) return <div className="p-6 text-red-500">{error}</div>

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Dashboard"
        description="Monitor penggunaan software"
      />

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
        {statCards.map(({ key, label, icon: Icon }) => (
          <Card key={key}>
            <CardContent className="p-4 text-center">
              <div className={`w-8 h-8 rounded-md mx-auto mb-2 flex items-center justify-center ${key === "total_designs" || key === "total_credits_used" ? "bg-accent/10 text-accent" : "bg-primary/10 text-primary"}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="text-2xl font-bold">{stats?.[key as keyof AdminStats] ?? 0}</div>
              <p className="text-xs text-muted-foreground">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Organizations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Organizations ({orgs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {orgs.length === 0 ? (
            <p className="text-muted-foreground text-sm">Belum ada organizations</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-background">
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Nama</th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Owner</th>
                    <th className="text-center py-2 px-3 font-medium text-muted-foreground">Members</th>
                    <th className="text-center py-2 px-3 font-medium text-muted-foreground">Clients</th>
                    <th className="text-center py-2 px-3 font-medium text-muted-foreground">Briefs</th>
                    <th className="text-center py-2 px-3 font-medium text-muted-foreground">Designs</th>
                    <th className="text-center py-2 px-3 font-medium text-muted-foreground">Credits</th>
                  </tr>
                </thead>
                <tbody>
                  {orgs.map((org) => (
                    <tr key={org.id} className="border-b hover:bg-primary/5 even:bg-primary/[0.02] transition-colors">
                      <td className="py-2 px-3 font-medium">{org.name}</td>
                      <td className="py-2 px-3 text-muted-foreground text-xs">{org.owner_email}</td>
                      <td className="py-2 px-3 text-center">{org.member_count}</td>
                      <td className="py-2 px-3 text-center">{org.client_count}</td>
                      <td className="py-2 px-3 text-center">{org.brief_count}</td>
                      <td className="py-2 px-3 text-center">{org.design_count}</td>
                      <td className="py-2 px-3 text-center">
                        <span className="text-green-600">{org.credit_balance}</span>
                        <span className="text-muted-foreground"> / </span>
                        <span className="text-red-500">{org.credit_used}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}