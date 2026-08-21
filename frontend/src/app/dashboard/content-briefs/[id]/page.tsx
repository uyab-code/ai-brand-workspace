"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { clientsApi } from "@/api/clients"
import { contentBriefsApi } from "@/api/content-briefs"
import { organizationsApi } from "@/api/organizations"
import { TeamMember } from "@/types/organization"
import {
  ContentBrief,
  BriefSlide,
  PLATFORM_LABELS,
  PLATFORM_BADGE_VARIANTS,
  CONTENT_TYPE_LABELS,
  ContentStatus,
} from "@/types/content-brief"
import { GeneratedDesign } from "@/types/design"
import { designsApi } from "@/api/designs"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { StatusBadge, ContentTypeBadge } from "@/components/ui/status-badge"
import { StatusStepper } from "@/components/brief/status-stepper"
import { CalendarClock } from "lucide-react"

function DesignThumb({ design }: { design: GeneratedDesign }) {
  return (
    <div className="max-w-[160px]">
      <Link href={`/dashboard/designs/${design.id}`}>
        <img
          src={design.image_url}
          alt=""
          className="aspect-[4/5] w-full object-cover rounded-lg border border-border shadow-card transition-all hover:shadow-modal"
          onError={(e) => {
            const t = e.target as HTMLImageElement
            t.src = "https://placehold.co/300x375?text=AI&font=montserrat"
          }}
        />
      </Link>
      <div className="mt-1.5 text-xs text-muted-foreground">
        v{design.version} · {new Date(design.created_at!).toLocaleString("id-ID")}
      </div>
    </div>
  )
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="mt-1 text-sm text-foreground">{children}</div>
    </div>
  )
}

export default function BriefDetailPage() {
  const { id: briefId } = useParams<{ id: string }>()
  const router = useRouter()
  const [brief, setBrief] = useState<ContentBrief | null>(null)
  const [clientName, setClientName] = useState("")
  const [loading, setLoading] = useState(true)

  // Edit state
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState("")
  const [editPlatform, setEditPlatform] = useState("")
  const [editDeadline, setEditDeadline] = useState("")
  const [members, setMembers] = useState<TeamMember[]>([])
  const [assignedUserIds, setAssignedUserIds] = useState<string[]>([])
  const [slides, setSlides] = useState<BriefSlide[]>([])
  const [editingSlideId, setEditingSlideId] = useState<string | null>(null)
  const [slideEditTitle, setSlideEditTitle] = useState("")
  const [slideEditBrief, setSlideEditBrief] = useState("")
  const [slideEditNotes, setSlideEditNotes] = useState("")

  // Generate image state
  const [slideDesigns, setSlideDesigns] = useState<Record<string, GeneratedDesign[]>>({})
  const [globalPrompt, setGlobalPrompt] = useState("")
  const [targetSlideId, setTargetSlideId] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    const bRes = await contentBriefsApi.get(briefId)
    if (bRes.success) {
      setBrief(bRes.data)
      const loadedSlides = bRes.data.slides || []
      setSlides(loadedSlides)
      setTargetSlideId(loadedSlides.length > 0 ? loadedSlides[0].id : null)
      setEditName(bRes.data.name)
      setEditPlatform(bRes.data.platform)
      setEditDeadline(bRes.data.deadline_date || "")

      // Load client name
      const cRes = await clientsApi.get(bRes.data.client_id)
      if (cRes.success) setClientName(cRes.data.name)

      // Load designs for each slide
      if (bRes.data.slides && bRes.data.slides.length > 0) {
        const designsMap: Record<string, GeneratedDesign[]> = {}
        await Promise.all(
          bRes.data.slides.map(async (s) => {
            const dRes = await designsApi.listBySlide(s.id)
            if (dRes.success && dRes.data.length > 0) {
              designsMap[s.id] = dRes.data
            }
          })
        )
        setSlideDesigns(designsMap)
      }
    }
    setLoading(false)
  }

  const saveBrief = async () => {
    if (!brief) return
    await contentBriefsApi.update(briefId, {
      name: editName,
      platform: editPlatform,
      deadline_date: editDeadline || null,
      assigned_user_ids: assignedUserIds,
    })
    await fetchData()
    setEditing(false)
  }

  const startEdit = () => {
    if (!brief) return
    setEditName(brief.name)
    setEditPlatform(brief.platform)
    setEditDeadline(brief.deadline_date || "")
    setAssignedUserIds((brief.assigned_users || []).map((u) => u.id))
    if (members.length === 0) {
      organizationsApi.getMembers(brief.organization_id).then((r) => {
        if (r.success) setMembers(r.data)
      })
    }
    setEditing(true)
  }

  const toggleAssignee = (userId: string) => {
    setAssignedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    )
  }

  const handleDelete = async () => {
    if (!confirm("Hapus brief ini? Semua data slide akan terhapus.")) return
    const r = await contentBriefsApi.delete(briefId)
    if (r.success) router.push("/dashboard/content-briefs")
  }

  const updateStatus = async (newStatus: string) => {
    const r = await contentBriefsApi.updateStatus(briefId, newStatus)
    if (r.success) setBrief(r.data)
  }

  const startSlideEdit = (s: BriefSlide) => {
    setEditingSlideId(s.id)
    setSlideEditTitle(s.slide_title)
    setSlideEditBrief(s.brief_text)
    setSlideEditNotes(s.notes || "")
  }

  const saveSlide = async (slideId: string) => {
    const r = await contentBriefsApi.updateSlide(slideId, {
      slide_title: slideEditTitle,
      brief_text: slideEditBrief,
      notes: slideEditNotes || null,
    })
    if (r.success) {
      setSlides(slides.map((s) => (s.id === slideId ? r.data : s)))
      setEditingSlideId(null)
    }
  }

  const generateDesign = async () => {
    const prompt = globalPrompt.trim()
    if (!prompt || !brief) return
    if (slides.length > 0 && !targetSlideId) return
    const slideId = slides.length > 0 ? targetSlideId : null
    setGenerating(true)
    try {
      const r = await designsApi.generate(
        brief.client_id,
        brief.content_type,
        prompt,
        briefId,
        slideId ?? undefined
      )
      if (r.success) {
        if (slideId) {
          setSlideDesigns((prev) => {
            const existing = prev[slideId] || []
            return { ...prev, [slideId]: [r.data, ...existing] }
          })
        }
        setGlobalPrompt("")
      }
    } catch (e) {
      // silent
    }
    setGenerating(false)
  }

  if (loading) return (
    <div className="p-6 flex justify-center">
      <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
    </div>
  )
  if (!brief) return <div className="p-6 text-muted-foreground">Not found</div>

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <Link href="/dashboard/content-briefs">
            <Button variant="ghost" size="sm">← Kembali</Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">{brief.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{clientName}</p>
            <div className="flex items-center gap-2 mt-2">
              <ContentTypeBadge type={brief.content_type} />
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${PLATFORM_BADGE_VARIANTS[brief.platform as keyof typeof PLATFORM_BADGE_VARIANTS]}`}>
                {PLATFORM_LABELS[brief.platform as keyof typeof PLATFORM_LABELS]}
              </span>
            </div>
          </div>
        </div>
        {!editing && (
          <Button variant="outline" className="text-red-600 shrink-0" onClick={handleDelete}>Hapus</Button>
        )}
      </div>

      {/* Split layout — content (slides) left, info/status panel right */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
        {/* Left: Slides */}
        <div>
          <h2 className="text-lg font-semibold mb-3">
            {brief.content_type === "carousel" ? `Slides (${slides.length})` : "Brief Detail"}
          </h2>
          {slides.length === 0 ? (
            <Card><CardContent className="p-6 text-center text-muted-foreground">Tidak ada slide</CardContent></Card>
          ) : (
            <div className="space-y-3">
              {slides.map((s) => (
                <Card key={s.id}>
                  <CardContent className="p-4">
                    {editingSlideId === s.id ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <Label>Judul Slide</Label>
                            <Input value={slideEditTitle} onChange={(e) => setSlideEditTitle(e.target.value)} />
                          </div>
                          <div>
                            <Label>Catatan</Label>
                            <Input value={slideEditNotes} onChange={(e) => setSlideEditNotes(e.target.value)} placeholder="Catatan opsional" />
                          </div>
                        </div>
                        <div>
                          <Label>Brief</Label>
                          <textarea className="w-full min-h-[80px] rounded border border-input bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            value={slideEditBrief} onChange={(e) => setSlideEditBrief(e.target.value)} />
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => saveSlide(s.id)}>Simpan</Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingSlideId(null)}>Batal</Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium text-muted-foreground">
                              {brief.content_type === "carousel" ? `Slide ${s.slide_number}` : "Brief"}
                            </span>
                            <h3 className="font-medium">{s.slide_title}</h3>
                          </div>
                          <p className="text-sm text-foreground whitespace-pre-wrap">{s.brief_text}</p>
                          {s.notes && (
                            <p className="text-xs text-muted-foreground mt-1">📝 {s.notes}</p>
                          )}
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => startSlideEdit(s)}>✏️</Button>
                      </div>
                    )}

                    {/* Generated designs — grid thumbnails */}
                    {slideDesigns[s.id] && slideDesigns[s.id].length > 0 && (
                      <div className="mt-4 pt-4 border-t border-border">
                        <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                          {slideDesigns[s.id].map((d) => (
                            <DesignThumb key={d.id} design={d} />
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Global Generate AI Image */}
          <Card className="mt-4">
            <CardContent className="p-4 space-y-3">
              <h3 className="text-sm font-semibold">Generate AI Image</h3>
              <textarea
                className="w-full min-h-[60px] rounded border border-input bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="Prompt untuk generate desain..."
                value={globalPrompt}
                onChange={(e) => setGlobalPrompt(e.target.value)}
              />
              <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-end">
                {slides.length > 0 && (
                  <Select
                    className="sm:w-44"
                    value={targetSlideId ?? ""}
                    onChange={(e) => setTargetSlideId(e.target.value)}
                    aria-label="Slide target"
                  >
                    {slides.map((s) => (
                      <option key={s.id} value={s.id}>
                        Slide {s.slide_number}
                      </option>
                    ))}
                  </Select>
                )}
                <Button
                  className="shrink-0"
                  onClick={() => generateDesign()}
                  disabled={generating || !globalPrompt.trim() || (slides.length > 0 && !targetSlideId)}
                >
                  {generating ? "..." : "Generate"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Header + Info + Status — sticky */}
        <div className="lg:sticky lg:top-6">
          <Card>
            {/* Header brief */}
            <div className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold tracking-tight text-foreground">{brief.name}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{clientName}</p>
                </div>
                {!editing && (
                  <Button variant="outline" size="sm" className="shrink-0" onClick={startEdit}>Edit</Button>
                )}
              </div>
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <StatusBadge status={brief.status as ContentStatus} />
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${PLATFORM_BADGE_VARIANTS[brief.platform as keyof typeof PLATFORM_BADGE_VARIANTS]}`}>
                  {PLATFORM_LABELS[brief.platform as keyof typeof PLATFORM_LABELS]}
                </span>
              </div>
            </div>

            {/* Brief Info */}
            <div className="border-t border-border p-5">
              <h3 className="text-sm font-semibold text-foreground mb-3">Informasi</h3>
              {editing ? (
                <div className="space-y-3">
                  <div>
                    <Label>Nama Brief</Label>
                    <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
                  </div>
                  <div>
                    <Label>Platform</Label>
                    <select value={editPlatform} onChange={(e) => setEditPlatform(e.target.value)}
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
                    <Input type="date" value={editDeadline} onChange={(e) => setEditDeadline(e.target.value)} />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button size="sm" onClick={saveBrief}>Simpan</Button>
                    <Button size="sm" variant="outline" onClick={() => { setEditing(false); setEditName(brief.name); setEditPlatform(brief.platform); setEditDeadline(brief.deadline_date || "") }}>Batal</Button>
                  </div>

                  {/* Assignee picker (edit mode) */}
                  {members.length > 0 && (
                    <div className="space-y-2 pt-1">
                      <Label>Assign ke</Label>
                      <div className="max-h-48 space-y-1.5 overflow-y-auto pr-1">
                        {members.map((m) => (
                          <label key={m.id} className="flex items-center gap-2 rounded border border-input bg-background px-3 py-2 text-sm cursor-pointer hover:bg-muted/50">
                            <input
                              type="checkbox"
                              checked={assignedUserIds.includes(m.user_id)}
                              onChange={() => toggleAssignee(m.user_id)}
                              className="h-4 w-4 accent-[var(--primary)]"
                            />
                            <span className="font-medium text-foreground">{m.user_name || m.user_email}</span>
                            <span className="text-xs text-muted-foreground">({m.role})</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <InfoRow label="Tipe">
                    <ContentTypeBadge type={brief.content_type} />
                  </InfoRow>
                  <InfoRow label="Platform">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${PLATFORM_BADGE_VARIANTS[brief.platform as keyof typeof PLATFORM_BADGE_VARIANTS]}`}>
                      {PLATFORM_LABELS[brief.platform as keyof typeof PLATFORM_LABELS]}
                    </span>
                  </InfoRow>
                  <InfoRow label="Deadline">
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarClock className="h-3.5 w-3.5 text-muted-foreground" />
                      {brief.deadline_date ? new Date(brief.deadline_date).toLocaleDateString("id-ID") : "-"}
                    </span>
                  </InfoRow>
                  <InfoRow label="Assignees">
                    {(brief.assigned_users?.length ?? 0) > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {brief.assigned_users!.map((u) => (
                          <span key={u.id} className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2 py-0.5 text-xs text-foreground">
                            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary/10 text-[9px] font-bold text-primary">
                              {u.name.split(" ").map((p) => p[0]).join("").toUpperCase().slice(0, 2)}
                            </span>
                            {u.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Belum ada</span>
                    )}
                  </InfoRow>
                </div>
              )}
            </div>

            {/* Status workflow */}
            <div className="border-t border-border p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4">Status Workflow</h3>
              <StatusStepper
                currentStatus={brief.status as ContentStatus}
                onTransition={updateStatus}
              />
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
