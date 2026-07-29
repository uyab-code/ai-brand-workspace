"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { clientsApi } from "@/api/clients"
import { contentBriefsApi } from "@/api/content-briefs"
import {
  ContentBrief,
  BriefSlide,
  PLATFORM_LABELS,
  PLATFORM_BADGE_VARIANTS,
  CONTENT_TYPE_LABELS,
  CONTENT_STATUS_LABELS,
  ContentStatus,
} from "@/types/content-brief"
import { GeneratedDesign } from "@/types/design"
import { designsApi } from "@/api/designs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { StatusBadge } from "@/components/ui/status-badge"
import { Eye, EyeOff } from "lucide-react"

function DesignCard({ design }: { design: GeneratedDesign }) {
  const [showPrompt, setShowPrompt] = useState(false)

  return (
    <div className="flex gap-3 items-start">
      <Link href={`/dashboard/designs/${design.id}`} className="shrink-0">
        <img
          src={design.image_url}
          alt=""
          className="w-28 h-28 object-cover rounded-md border"
          onError={(e) => {
            const t = e.target as HTMLImageElement
            t.src = "https://placehold.co/112x112?text=AI&font=montserrat"
          }}
        />
      </Link>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            v{design.version} · {new Date(design.created_at!).toLocaleString("id-ID")}
          </span>
          <button
            onClick={() => setShowPrompt(!showPrompt)}
            className="text-xs text-primary hover:underline inline-flex items-center gap-1"
          >
            {showPrompt ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
            {showPrompt ? "Sembunyikan prompt" : "Lihat prompt"}
          </button>
        </div>
        {showPrompt && (
          <pre className="mt-2 text-[11px] text-foreground whitespace-pre-wrap bg-background p-3 rounded-md border border-border max-h-[300px] overflow-y-auto">
            {design.prompt_used}
          </pre>
        )}
      </div>
    </div>
  )
}

const VALID_TRANSITIONS: Record<string, string[]> = {
  draft: ["in_progress"],
  in_progress: ["generated"],
  generated: ["in_review"],
  in_review: ["approved", "draft"],
  approved: ["published"],
  published: [],
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
  const [slides, setSlides] = useState<BriefSlide[]>([])
  const [editingSlideId, setEditingSlideId] = useState<string | null>(null)
  const [slideEditTitle, setSlideEditTitle] = useState("")
  const [slideEditBrief, setSlideEditBrief] = useState("")
  const [slideEditNotes, setSlideEditNotes] = useState("")

  // Generate image state
  const [slideDesigns, setSlideDesigns] = useState<Record<string, GeneratedDesign[]>>({})
  const [slidePrompts, setSlidePrompts] = useState<Record<string, string>>({})
  const [generatingSlideId, setGeneratingSlideId] = useState<string | null>(null)

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    const bRes = await contentBriefsApi.get(briefId)
    if (bRes.success) {
      setBrief(bRes.data)
      setSlides(bRes.data.slides || [])
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
    })
    await fetchData()
    setEditing(false)
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

  const generateDesign = async (slideId: string) => {
    const prompt = slidePrompts[slideId]?.trim()
    if (!prompt || !brief) return
    setGeneratingSlideId(slideId)
    try {
      const r = await designsApi.generate(
        brief.client_id,
        brief.content_type,
        prompt,
        briefId,
        slideId
      )
      if (r.success) {
        const existing = slideDesigns[slideId] || []
        setSlideDesigns({ ...slideDesigns, [slideId]: [r.data, ...existing] })
        setSlidePrompts({ ...slidePrompts, [slideId]: "" })
      }
    } catch (e) {
      // silent
    }
    setGeneratingSlideId(null)
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/content-briefs">
            <Button variant="ghost" size="sm">← Kembali</Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{brief.name}</h1>
            <p className="text-muted-foreground">{clientName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!editing && (
            <>
              <Button variant="outline" onClick={() => setEditing(true)}>Edit</Button>
              <Button variant="outline" className="text-red-600" onClick={handleDelete}>Hapus</Button>
            </>
          )}
        </div>
      </div>

      {/* Status & transitions */}
      <div className="flex items-center gap-3">
        <StatusBadge status={brief.status as ContentStatus} />
        {VALID_TRANSITIONS[brief.status]?.map((nextStatus) => (
          <Button key={nextStatus} variant="outline" size="sm"
            onClick={() => updateStatus(nextStatus)}>
            → {CONTENT_STATUS_LABELS[nextStatus as ContentStatus]}
          </Button>
        ))}
      </div>

      {/* Brief Info */}
      <Card>
        <CardHeader><CardTitle>Brief Info</CardTitle></CardHeader>
        <CardContent>
          {editing ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Nama Brief</Label>
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
              </div>
              <div>
                <Label>Platform</Label>
                <select value={editPlatform} onChange={(e) => setEditPlatform(e.target.value)}
                  className="w-full h-10 rounded-[10px] border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
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
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium text-muted-foreground">Nama</span>
                <p>{brief.name}</p>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Tipe</span>
                <p>{CONTENT_TYPE_LABELS[brief.content_type as keyof typeof CONTENT_TYPE_LABELS]}</p>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Platform</span>
                <p className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${PLATFORM_BADGE_VARIANTS[brief.platform as keyof typeof PLATFORM_BADGE_VARIANTS]}`}>
                  {PLATFORM_LABELS[brief.platform as keyof typeof PLATFORM_LABELS]}
                </p>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Deadline</span>
                <p>{brief.deadline_date ? new Date(brief.deadline_date).toLocaleDateString("id-ID") : "-"}</p>
              </div>
            </div>
          )}
          {editing && (
            <div className="flex gap-2 mt-4">
              <Button onClick={saveBrief}>Simpan</Button>
              <Button variant="outline" onClick={() => { setEditing(false); setEditName(brief.name); setEditPlatform(brief.platform); setEditDeadline(brief.deadline_date || "") }}>Batal</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Slides */}
      <div>
        <h2 className="text-lg font-semibold mb-3">
          {brief.content_type === "carousel" ? `Slides (${slides.length})` : "Brief Detail"}
        </h2>
        {slides.length === 0 ? (
          <Card><CardContent className="p-6 text-center text-muted-foreground">Tidak ada slide</CardContent></Card>
        ) : (
          <div className="space-y-3">
            {slides.map((s, i) => (
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
                        <textarea className="w-full min-h-[80px] rounded-[10px] border border-input bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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

                  {/* Generate AI Image Section */}
                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="flex gap-2">
                      <textarea
                        className="flex-1 min-h-[40px] rounded-[10px] border border-input bg-card px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        placeholder="Prompt untuk generate desain slide ini..."
                        value={slidePrompts[s.id] || ""}
                        onChange={(e) =>
                          setSlidePrompts({ ...slidePrompts, [s.id]: e.target.value })
                        }
                      />
                      <Button
                        size="sm"
                        className="self-start shrink-0"
                        onClick={() => generateDesign(s.id)}
                        disabled={generatingSlideId === s.id || !slidePrompts[s.id]?.trim()}
                      >
                        {generatingSlideId === s.id ? "..." : "Generate"}
                      </Button>
                    </div>

                    {/* Generated designs */}
                    {slideDesigns[s.id] && slideDesigns[s.id].length > 0 && (
                      <div className="mt-3 space-y-3">
                        {slideDesigns[s.id].map((d) => (
                          <DesignCard key={d.id} design={d} />
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
