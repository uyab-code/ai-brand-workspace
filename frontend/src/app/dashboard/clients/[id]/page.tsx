"use client"
import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { clientsApi } from "@/api/clients"
import { assetsApi } from "@/api/assets"
import { Client, BrandAsset, BrandColor, ColorRole } from "@/types/client"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ToastProvider, useToast } from "@/components/ui/toast"
import { Upload, Palette, Type, FileText, Image as ImageIcon, CheckCircle2 } from "lucide-react"

export default function ClientDetailPage() {
  return (
    <ToastProvider>
      <ClientDetailContent />
    </ToastProvider>
  )
}

function ClientDetailContent() {
  const { addToast } = useToast()
  const { id: clientId } = useParams<{ id: string }>()
  const [client, setClient] = useState<Client | null>(null)
  const [assets, setAssets] = useState<BrandAsset[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState("")
  const [editDesc, setEditDesc] = useState("")
  const [fontName, setFontName] = useState("")
  const [fontType, setFontType] = useState("primary")
  const [colorList, setColorList] = useState<BrandColor[]>([])
  const [style, setStyle] = useState("")
  const router = useRouter()

  const ROLE_LABELS: Record<ColorRole, string> = { primary: "Primer", secondary: "Sekunder", accent: "Aksen" }
  const ROLE_BADGE: Record<ColorRole, string> = {
    primary: "bg-primary/10 text-primary",
    secondary: "bg-muted text-muted-foreground",
    accent: "bg-accent/10 text-accent",
  }

  // Normalize legacy data (["#hex", ...]) ke {role, hex}; role posisional 1→primary, 2→secondary, 3+→accent
  const normalizeColors = (raw: unknown[]): BrandColor[] =>
    raw.map((c, i) => {
      if (typeof c === "string") {
        const role = (["primary", "secondary", "accent"][i] ?? "accent") as ColorRole
        return { role, hex: c }
      }
      const o = c as { role?: string; hex?: string }
      return { role: (o.role as ColorRole) || "primary", hex: o.hex || "#000000" }
    })
  const [uploading, setUploading] = useState<string | null>(null)
  const logoRef = useRef<HTMLInputElement>(null)
  const guidelineRef = useRef<HTMLInputElement>(null)
  const referenceRef = useRef<HTMLInputElement>(null)

  // File upload disimpan di backend origin (/uploads/...), jadi perlu prefix API origin
  const apiOrigin = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1").replace(/\/api\/v1\/?$/, "")
  const assetUrl = (p: string | null | undefined) => (p?.startsWith("/") ? `${apiOrigin}${p}` : p || "")

  useEffect(() => { fetchData() }, [])
  const fetchData = async () => {
    const c = await clientsApi.get(clientId)
    if (c.success) setClient(c.data)
    const a = await assetsApi.list(clientId)
    if (a.success) setAssets(a.data)
    setLoading(false)
  }

  const logo = assets.find(a => a.asset_type === "logo")
  const guideline = assets.find(a => a.asset_type === "guideline")
  const referencesList = assets.filter(a => a.asset_type === "reference" && a.file_url)
  const fonts = assets.filter(a => a.asset_type === "font")
  const ca = assets.find(a => a.brand_colors)
  const sa = assets.find(a => a.brand_style)

  const startEdit = () => {
    setEditName(client?.name || "")
    setEditDesc(client?.description || "")
    setColorList(ca?.brand_colors?.colors?.length ? normalizeColors(ca.brand_colors.colors) : [])
    setStyle(sa?.brand_style || "")
    setEditing(true)
  }

  const saveAll = async () => {
    try {
      const hexRegex = /^#[0-9A-Fa-f]{6}$/
      const invalid = colorList.find(c => !hexRegex.test(c.hex))
      if (invalid) {
        addToast(`Format hex tidak valid: ${invalid.hex} (contoh: #FF0000)`, "error")
        return
      }
      if (!colorList.some(c => c.role === "primary")) {
        addToast("Minimal satu warna Primer wajib ada", "error")
        return
      }
      await clientsApi.update(clientId, { name: editName, description: editDesc })
      if (colorList.length > 0) {
        await assetsApi.updateColors(clientId, colorList)
      }
      if (style) await assetsApi.updateStyle(clientId, style)
      await fetchData()
      setEditing(false)
      addToast("Data client berhasil disimpan!", "success")
    } catch (e) {
      addToast("Gagal menyimpan data client", "error")
    }
  }

  const handleUpload = async (type: string, file: File | null | undefined) => {
    if (!file) return
    setUploading(type)
    try {
      if (type === "logo") await assetsApi.uploadLogo(clientId, file)
      if (type === "guideline") await assetsApi.uploadGuideline(clientId, file)
      if (type === "reference") await assetsApi.uploadReference(clientId, file)
      await fetchData()
      addToast(`${type.charAt(0).toUpperCase() + type.slice(1)} berhasil di-upload!`, "success")
    } catch (e) {
      addToast(`Gagal upload ${type}`, "error")
    }
    setUploading(null)
  }

  const addFont = async () => {
    if (!fontName.trim()) {
      addToast("Nama font tidak boleh kosong", "error")
      return
    }
    try {
      const r = await assetsApi.addFont(clientId, fontName.trim(), fontType)
      if (r.success) {
        setAssets([...assets, r.data]);
        setFontName("");
        setFontType("primary")
        addToast("Font berhasil ditambahkan!", "success")
      }
    } catch (e) {
      addToast("Gagal menambah font", "error")
    }
  }

  const removeFont = async (fontId: string) => {
    try {
      const r = await assetsApi.removeFont(clientId, fontId)
      if (r.success) {
        setAssets(assets.filter(a => a.id !== fontId))
        addToast("Font berhasil dihapus", "success")
      }
    } catch (e) {
      addToast("Gagal menghapus font", "error")
    }
  }

  const handleDelete = async () => {
    if (!confirm("Hapus client ini? Semua data akan terhapus.")) return
    try {
      const r = await clientsApi.delete(clientId)
      if (r.success) {
        addToast("Client berhasil dihapus", "success")
        router.push("/dashboard/clients")
      }
    } catch (e) {
      addToast("Gagal menghapus client", "error")
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
    </div>
  )
  if (!client) return <div className="p-6 text-muted-foreground">Not found</div>

  const initials = client.name
    .split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  const removeLogo = async () => {
    if (!logo) return
    try {
      await assetsApi.removeAsset(clientId, logo.id)
      await fetchData()
      addToast("Logo berhasil dihapus", "success")
    } catch (e) {
      addToast("Gagal menghapus logo", "error")
    }
  }

  const sectionHeader = (icon: React.ReactNode, title: string) => (
    <div className="flex items-center gap-2 mb-3">
      {icon}
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/clients">
          <Button variant="ghost" size="sm">← Kembali</Button>
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-foreground">{client.name}</h1>
          <p className="text-sm text-muted-foreground">{client.description || "-"}</p>
        </div>
      </div>

      <PageHeader
        title=""
        actions={
          <div className="flex items-center gap-2">
            {editing ? (
              <>
                <Button onClick={saveAll}>Simpan Semua</Button>
                <Button variant="outline" onClick={() => setEditing(false)}>Batal</Button>
              </>
            ) : (
              <Button variant="outline" onClick={startEdit}>Edit Brand</Button>
            )}
          </div>
        }
      />

      {/* Split layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6 items-start">
        {/* Left: Brand identity — sticky */}
        <div className="lg:sticky lg:top-6 space-y-4">
          <div className="bg-card rounded-lg border border-border shadow-card overflow-hidden">
            {/* Logo + Client Info */}
            <div className="p-6">
              <div className="flex flex-col items-center text-center gap-4">
                {logo?.file_url ? (
                  <img src={assetUrl(logo.file_url)} alt="Logo" className="w-28 h-28 rounded-lg object-cover border border-border" />
                ) : (
                  <div className="w-28 h-28 rounded-lg bg-muted flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold text-foreground/60">{initials}</span>
                    <span className="text-[10px] text-muted-foreground mt-1">No logo</span>
                  </div>
                )}
                {editing ? (
                  <div className="w-full space-y-3">
                    <div>
                      <Label>Nama Client</Label>
                      <Input value={editName} onChange={e => setEditName(e.target.value)} />
                    </div>
                    <div>
                      <Label>Deskripsi</Label>
                      <Input value={editDesc} onChange={e => setEditDesc(e.target.value)} />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <h2 className="text-xl font-semibold text-foreground">{client.name}</h2>
                    <p className="text-sm text-muted-foreground">{client.description || "Tidak ada deskripsi"}</p>
                    <div className="flex items-center justify-center gap-2">
                      {client.status === "active" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-medium rounded-full bg-green-50 text-green-700">
                          <CheckCircle2 className="h-3 w-3" />
                          Active
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-muted text-muted-foreground">{client.status}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-border" />

            {/* Logo upload */}
            <div className="p-4 space-y-1.5">
              <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={e => handleUpload("logo", e.target.files?.[0])} />
              <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => logoRef.current?.click()} disabled={uploading === "logo"}>
                <Upload className="h-3 w-3 mr-1" />
                {uploading === "logo" ? "Uploading..." : "Upload Logo"}
              </Button>
              {logo && editing && (
                <Button variant="outline" size="sm" className="w-full text-xs text-red-500" onClick={removeLogo}>
                  Hapus Logo
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Right: Assets & details */}
        <div className="space-y-4 min-w-0">
          {/* Brand Colors */}
          <div className="bg-card rounded-lg border border-border shadow-card p-6">
            {sectionHeader(<Palette className="h-4 w-4 text-muted-foreground" />, "Brand Colors")}
            {editing ? (
              <div className="space-y-3">
                {colorList.length === 0 && (
                  <p className="text-sm text-muted-foreground">Belum ada warna — tambahkan di bawah.</p>
                )}
                <div className="space-y-2">
                  {colorList.map((c, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type="color"
                        value={/^#[0-9A-Fa-f]{6}$/.test(c.hex) ? c.hex : "#000000"}
                        onChange={e => {
                          const next = [...colorList]
                          next[i] = { ...next[i], hex: e.target.value.toUpperCase() }
                          setColorList(next)
                        }}
                        className="w-9 h-9 rounded border border-input bg-card shrink-0 cursor-pointer"
                      />
                      <Input
                        value={c.hex}
                        onChange={e => {
                          const next = [...colorList]
                          next[i] = { ...next[i], hex: e.target.value }
                          setColorList(next)
                        }}
                        placeholder="#FF0000"
                        className="flex-1 font-mono"
                      />
                      <select
                        value={c.role}
                        onChange={e => {
                          const next = [...colorList]
                          next[i] = { ...next[i], role: e.target.value as ColorRole }
                          setColorList(next)
                        }}
                        className="h-10 px-3 py-2 text-sm border border-input bg-background rounded focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        {(Object.keys(ROLE_LABELS) as ColorRole[]).map(r => (
                          <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => setColorList(colorList.filter((_, j) => j !== i))}
                        className="text-muted-foreground hover:text-red-500 text-sm p-1"
                        title="Hapus warna"
                      >✕</button>
                    </div>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setColorList([...colorList, { role: "accent", hex: "#000000" }])}
                >
                  + Tambah Warna
                </Button>
              </div>
            ) : ca?.brand_colors?.colors?.length ? (
              <div className="flex gap-3 flex-wrap">
                {normalizeColors(ca.brand_colors.colors).map((c, i) => (
                  <div key={i} className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2">
                    <div className="w-6 h-6 rounded-full border border-border shrink-0" style={{ backgroundColor: c.hex }} />
                    <span className="text-sm font-mono text-foreground">{c.hex}</span>
                    <span className={`text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full ${ROLE_BADGE[c.role]}`}>
                      {ROLE_LABELS[c.role]}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Belum ada brand colors</p>
            )}
          </div>

          {/* Brand Style */}
          <div className="bg-card rounded-lg border border-border shadow-card p-6">
            {sectionHeader(<FileText className="h-4 w-4 text-muted-foreground" />, "Brand Style")}
            {editing ? (
              <div className="space-y-2">
                <Label>Deskripsi style</Label>
                <textarea className="w-full min-h-[80px] rounded border border-input bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={style} onChange={e => setStyle(e.target.value)} placeholder="Modern, minimalis, clean..." />
              </div>
            ) : (
              <p className="text-sm text-foreground">{sa?.brand_style || <span className="text-muted-foreground">Belum ada brand style</span>}</p>
            )}
          </div>

          {/* Fonts */}
          <div className="bg-card rounded-lg border border-border shadow-card p-6">
            {sectionHeader(<Type className="h-4 w-4 text-muted-foreground" />, `Fonts (${fonts.length})`)}
            {fonts.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {fonts.map(f => (
                  <span key={f.id} className="inline-flex items-center gap-1.5 bg-muted rounded-lg px-3 py-1.5 text-sm">
                    <span className="font-medium">{f.font_name}</span>
                    <span className="text-muted-foreground text-xs">({f.font_type})</span>
                    {editing && (
                      <button onClick={() => removeFont(f.id)} className="ml-1 text-muted-foreground hover:text-red-500 text-xs">✕</button>
                    )}
                  </span>
                ))}
              </div>
            )}
            {fonts.length === 0 && !editing && (
              <p className="text-sm text-muted-foreground">Belum ada font</p>
            )}
            {editing && (
              <div className="flex gap-2">
                <Input value={fontName} onChange={e => setFontName(e.target.value)} placeholder="Font name" className="flex-1" />
                <select value={fontType} onChange={e => setFontType(e.target.value)} className="h-10 px-3 py-2 text-sm border border-input bg-background rounded focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="primary">Primary</option>
                  <option value="secondary">Secondary</option>
                  <option value="accent">Accent</option>
                </select>
                <Button size="sm" onClick={addFont}>Tambah</Button>
              </div>
            )}
          </div>

          {/* Guidelines */}
          <div className="bg-card rounded-lg border border-border shadow-card p-6">
            {sectionHeader(<FileText className="h-4 w-4 text-muted-foreground" />, "Brand Guideline")}
            {guideline?.file_url ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-green-600 font-medium">PDF uploaded ✓</span>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground mb-2">Belum ada guideline</p>
            )}
            {uploading === "guideline" && <p className="text-xs text-blue-500 mt-1">Uploading...</p>}
            <input ref={guidelineRef} type="file" accept=".pdf" className="hidden" onChange={e => handleUpload("guideline", e.target.files?.[0])} />
            <Button variant="outline" size="sm" className="mt-2" onClick={() => guidelineRef.current?.click()} disabled={uploading === "guideline"}>
              <Upload className="h-3 w-3 mr-1" />
              {uploading === "guideline" ? "Uploading..." : guideline?.file_url ? "Ganti PDF" : "Upload PDF"}
            </Button>
          </div>

          {/* References */}
          <div className="bg-card rounded-lg border border-border shadow-card p-6">
            {sectionHeader(<ImageIcon className="h-4 w-4 text-muted-foreground" />, `References (${referencesList.length})`)}
            {referencesList.length > 0 ? (
              <div className="flex gap-2 mb-3 flex-wrap">
                {referencesList.map((r, i) => (
                  <div key={r.id} className="relative w-16 h-16 rounded-lg overflow-hidden border border-border">
                    <img src={assetUrl(r.file_url)} alt="Ref" className="w-full h-full object-cover" />
                    {uploading === "reference" && i === 0 && (
                      <span className="absolute inset-0 bg-black/50 flex items-center justify-center text-xs text-white">...</span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground mb-2">Belum ada reference</p>
            )}
            <input ref={referenceRef} type="file" accept="image/*" className="hidden" onChange={e => handleUpload("reference", e.target.files?.[0])} />
            <Button variant="outline" size="sm" onClick={() => referenceRef.current?.click()} disabled={uploading === "reference"}>
              <Upload className="h-3 w-3 mr-1" />
              {uploading === "reference" ? "Uploading..." : "Upload Reference"}
            </Button>
          </div>

          {/* Delete Client */}
          <div className="bg-card rounded-lg border border-red-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Hapus Client</h3>
                <p className="text-sm text-muted-foreground mt-0.5">Menghapus client akan menghapus semua data terkait secara permanen.</p>
              </div>
              <Button variant="outline" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={handleDelete}>
                Hapus Client
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
