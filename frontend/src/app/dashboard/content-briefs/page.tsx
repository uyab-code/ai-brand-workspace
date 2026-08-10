"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { organizationsApi } from "@/api/organizations"
import { clientsApi } from "@/api/clients"
import { contentBriefsApi } from "@/api/content-briefs"
import { ContentBrief, PLATFORM_LABELS, PLATFORM_BADGE_VARIANTS, ContentStatus } from "@/types/content-brief"
import { Client } from "@/types/client"
import { StatusBadge, ContentTypeBadge } from "@/components/ui/status-badge"
import { PageHeader } from "@/components/ui/page-header"
import { SearchInput } from "@/components/ui/search-input"
import { EmptyState } from "@/components/ui/empty-state"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FileText, Search } from "lucide-react"

export default function ContentBriefsPage() {
  const router = useRouter()
  const [briefs, setBriefs] = useState<ContentBrief[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [orgId, setOrgId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState("")
  const [contentType, setContentType] = useState("feed")
  const [platform, setPlatform] = useState("instagram")
  const [clientId, setClientId] = useState("")
  const [deadlineDate, setDeadlineDate] = useState("")
  const [slides, setSlides] = useState<{ slide_title: string; brief_text: string; notes: string }[]>([
    { slide_title: "", brief_text: "", notes: "" },
  ])
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => { load() }, [])

  const load = async () => {
    const o = await organizationsApi.list()
    if (o.success && o.data.length) {
      setOrgId(o.data[0].id)
      const [bRes, clRes] = await Promise.all([
        contentBriefsApi.list(o.data[0].id),
        clientsApi.list(o.data[0].id),
      ])
      if (bRes.success) setBriefs(bRes.data)
      if (clRes.success) setClients(clRes.data)
    }
    setLoading(false)
  }

  const addSlide = () => setSlides([...slides, { slide_title: "", brief_text: "", notes: "" }])
  const removeSlide = (i: number) => setSlides(slides.filter((_, idx) => idx !== i))
  const updateSlide = (i: number, field: string, val: string) => {
    const copy = [...slides]
    ;(copy[i] as any)[field] = val
    setSlides(copy)
  }

  const create = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!orgId || !clientId) return
    const validSlides = slides.filter((s) => s.slide_title && s.brief_text)
    if (validSlides.length === 0) return
    const r = await contentBriefsApi.create(
      orgId, clientId, name, contentType, platform, validSlides, deadlineDate || undefined
    )
    if (r.success) {
      setBriefs([r.data, ...briefs])
      setName(""); setContentType("feed"); setPlatform("instagram"); setClientId(""); setDeadlineDate("")
      setSlides([{ slide_title: "", brief_text: "", notes: "" }])
      setShowForm(false)
    }
  }

  const getSlideCountLabel = (b: ContentBrief) => {
    const n = b.slides?.length || 0
    if (b.content_type === "carousel") return `${n} slides`
    return n > 0 ? "1 brief" : "-"
  }

  const filtered = briefs.filter((b) => {
    if (searchQuery && !b.name.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  const clientMap = Object.fromEntries(clients.map((c) => [c.id, c.name]))

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
    </div>
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Content Library"
        description="Kelola brief konten untuk semua klien dan platform"
        actions={
          <Button onClick={() => setShowForm(!showForm)}>
            {showForm ? "Batal" : "+ Buat Brief Baru"}
          </Button>
        }
      />

      {/* Create Form */}
      {showForm && (
        <Card>
          <CardHeader><CardTitle>Buat Brief Baru</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={create} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Client</Label>
                  <select value={clientId} onChange={(e) => setClientId(e.target.value)}
                    className="w-full h-10 rounded border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" required>
                    <option value="">Pilih client...</option>
                    {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <Label>Nama Brief</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Promosi Ramadan 2026" />
                </div>
                <div>
                  <Label>Tipe Konten</Label>
                  <select value={contentType} onChange={(e) => {
                    setContentType(e.target.value)
                    if (e.target.value !== "carousel") setSlides([{ slide_title: "", brief_text: "", notes: "" }])
                  }}
                    className="w-full h-10 rounded border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                    <option value="feed">Feed</option>
                    <option value="story">Story</option>
                    <option value="carousel">Carousel</option>
                  </select>
                </div>
                <div>
                  <Label>Platform</Label>
                  <select value={platform} onChange={(e) => setPlatform(e.target.value)}
                    className="w-full h-10 rounded border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                    <option value="instagram">Instagram</option>
                    <option value="tiktok">TikTok</option>
                    <option value="facebook">Facebook</option>
                    <option value="twitter">Twitter/X</option>
                    <option value="linkedin">LinkedIn</option>
                  </select>
                </div>
                <div>
                  <Label>Deadline</Label>
                  <Input type="date" value={deadlineDate} onChange={(e) => setDeadlineDate(e.target.value)} />
                </div>
              </div>

              {/* Slides section */}
              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center">
                  <Label className="text-sm font-medium">
                    {contentType === "carousel" ? `Slides (${slides.length})` : "Brief Detail"}
                  </Label>
                  {contentType === "carousel" && (
                    <Button type="button" variant="outline" size="sm" onClick={addSlide}>+ Tambah Slide</Button>
                  )}
                </div>
                {slides.map((s, i) => (
                  <div key={i} className="border rounded-md p-3 space-y-2 bg-background">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-muted-foreground">
                        {contentType === "carousel" ? `Slide ${i + 1}` : "Brief"}
                      </span>
                      {contentType === "carousel" && slides.length > 1 && (
                        <Button type="button" variant="ghost" size="sm" className="text-red-500 h-6 text-xs"
                          onClick={() => removeSlide(i)}>✕</Button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <Input value={s.slide_title} onChange={(e) => updateSlide(i, "slide_title", e.target.value)}
                        placeholder="Judul slide" required />
                      <Input value={s.notes} onChange={(e) => updateSlide(i, "notes", e.target.value)}
                        placeholder="Catatan (opsional)" />
                    </div>
                    <textarea className="w-full min-h-[60px] rounded border border-input bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      value={s.brief_text} onChange={(e) => updateSlide(i, "brief_text", e.target.value)}
                      placeholder="Brief/deskripsi desain..." required />
                  </div>
                ))}
              </div>
              <Button type="submit">Simpan Brief</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <div className="flex items-center gap-3">
        <SearchInput
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari berdasarkan nama brief..."
          className="w-full max-w-sm"
        />
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<Search className="h-8 w-8" />}
          title={briefs.length === 0 ? "Belum ada brief" : "Tidak ada hasil"}
          description={briefs.length === 0 ? "Klik \"+ Buat Brief Baru\" untuk membuat brief pertama." : "Tidak ada brief yang cocok dengan pencarian."}
        />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-background/95 backdrop-blur">
                  <th className="text-left py-4 px-4 font-medium text-muted-foreground">Nama Brief</th>
                  <th className="text-left py-4 px-4 font-medium text-muted-foreground">Tipe</th>
                  <th className="text-left py-4 px-4 font-medium text-muted-foreground">Platform</th>
                  <th className="text-left py-4 px-4 font-medium text-muted-foreground">Dibuat</th>
                  <th className="text-left py-4 px-4 font-medium text-muted-foreground">Deadline</th>
                  <th className="text-left py-4 px-4 font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((b) => (
                  <tr key={b.id} className="border-b transition-colors hover:bg-primary/5 even:bg-primary/[0.02] cursor-pointer" onClick={() => router.push(`/dashboard/content-briefs/${b.id}`)}>
                    <td className="py-4 px-4">
                      <div className="font-semibold text-foreground">{b.name}</div>
                      <div className="text-xs text-muted-foreground">{clientMap[b.client_id] || "Client..."} · {getSlideCountLabel(b)}</div>
                    </td>
                    <td className="py-4 px-4">
                      <ContentTypeBadge type={b.content_type} />
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${PLATFORM_BADGE_VARIANTS[b.platform as keyof typeof PLATFORM_BADGE_VARIANTS] || ""}`}>
                        {PLATFORM_LABELS[b.platform as keyof typeof PLATFORM_LABELS] || b.platform}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-muted-foreground text-xs">
                      {b.created_at ? new Date(b.created_at).toLocaleDateString("id-ID") : "-"}
                    </td>
                    <td className="py-4 px-4 text-muted-foreground text-xs">
                      {b.deadline_date ? new Date(b.deadline_date).toLocaleDateString("id-ID") : "-"}
                    </td>
                    <td className="py-4 px-4">
                      <StatusBadge status={b.status as ContentStatus} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}