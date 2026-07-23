"use client"
import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { clientsApi } from "@/api/clients"
import { assetsApi } from "@/api/assets"
import { Client, BrandAsset } from "@/types/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function ClientDetailPage() {
  const { id: clientId } = useParams<{ id: string }>()
  const [client, setClient] = useState<Client | null>(null)
  const [assets, setAssets] = useState<BrandAsset[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState("")
  const [editDesc, setEditDesc] = useState("")
  const [fontName, setFontName] = useState("")
  const [fontType, setFontType] = useState("primary")
  const [colors, setColors] = useState("")
  const [style, setStyle] = useState("")

  useEffect(() => { fetchData() }, [])
  const fetchData = async () => {
    const c = await clientsApi.get(clientId)
    if (c.success) setClient(c.data)
    const a = await assetsApi.list(clientId)
    if (a.success) setAssets(a.data)
    setLoading(false)
  }

  const logo = assets.find(a => a.asset_type === "logo")
  const fonts = assets.filter(a => a.asset_type === "font")
  const ca = assets.find(a => a.brand_colors)
  const sa = assets.find(a => a.brand_style)

  const startEdit = () => {
    setEditName(client?.name || "")
    setEditDesc(client?.description || "")
    setColors(ca?.brand_colors?.colors?.join(", ") || "")
    setStyle(sa?.brand_style || "")
    setEditing(true)
  }

  const saveAll = async () => {
    await clientsApi.update(clientId, { name: editName, description: editDesc })
    if (colors) {
      const c = colors.split(",").map(x => x.trim()).filter(Boolean)
      await assetsApi.updateColors(clientId, c)
    }
    if (style) await assetsApi.updateStyle(clientId, style)
    await fetchData()
    setEditing(false)
  }

  const addFont = async () => {
    if (!fontName) return
    const r = await assetsApi.addFont(clientId, fontName, fontType)
    if (r.success) { setAssets([...assets, r.data]); setFontName(""); setFontType("primary") }
  }

  const removeFont = async (fontId: string) => {
    const r = await assetsApi.removeFont(clientId, fontId)
    if (r.success) setAssets(assets.filter(a => a.id !== fontId))
  }

  if (loading) return <div className="p-6 text-gray-500">Loading...</div>
  if (!client) return <div className="p-6 text-gray-500">Not found</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{client.name}</h1>
          <p className="text-gray-500">{client.description || "-"}</p>
        </div>
        {editing ? (
          <div className="flex gap-2">
            <Button onClick={saveAll}>Simpan Semua</Button>
            <Button variant="outline" onClick={() => setEditing(false)}>Batal</Button>
          </div>
        ) : (
          <Button variant="outline" onClick={startEdit}>Edit Client</Button>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Client Info</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {editing ? (
              <>
                <div><Label>Nama</Label><Input value={editName} onChange={e => setEditName(e.target.value)} /></div>
                <div><Label>Deskripsi</Label><Input value={editDesc} onChange={e => setEditDesc(e.target.value)} /></div>
              </>
            ) : (
              <>
                <p><span className="font-medium">Nama:</span> {client.name}</p>
                <p><span className="font-medium">Deskripsi:</span> {client.description || "-"}</p>
                <p><span className="font-medium">Status:</span> {client.status}</p>
                <p><span className="font-medium">Logo:</span> {logo ? "✓ Uploaded" : "✗ Belum ada"}</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Brand Colors</CardTitle></CardHeader>
          <CardContent>
            {editing ? (
              <div className="space-y-2">
                <Label>Hex codes (pisahkan koma)</Label>
                <Input value={colors} onChange={e => setColors(e.target.value)} placeholder="#FF0000, #00FF00, #0000FF" />
              </div>
            ) : ca?.brand_colors?.colors?.length ? (
              <div className="flex gap-2 flex-wrap">{ca.brand_colors.colors.map((c, i) => (
                <div key={i} className="flex flex-col items-center"><div className="w-8 h-8 rounded-full border" style={{ backgroundColor: c }} /><span className="text-xs">{c}</span></div>
              ))}</div>
            ) : <p className="text-gray-500">Belum ada</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Brand Style</CardTitle></CardHeader>
          <CardContent>
            {editing ? (
              <div className="space-y-2">
                <Label>Deskripsi style</Label>
                <textarea className="w-full min-h-[80px] border rounded-md p-2" value={style} onChange={e => setStyle(e.target.value)} placeholder="Modern, minimalis, clean..." />
              </div>
            ) : (
              <p>{sa?.brand_style || <span className="text-gray-500">Belum ada</span>}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Fonts ({fonts.length})</CardTitle></CardHeader>
          <CardContent>
            {fonts.length === 0 ? (
              <p className="text-gray-500 mb-2">Belum ada font</p>
            ) : (
              <div className="space-y-1 mb-3">
                {fonts.map(f => (
                  <div key={f.id} className="flex items-center justify-between text-sm">
                    <span>{f.font_name} <span className="text-gray-400">({f.font_type})</span></span>
                    {editing && <Button variant="ghost" size="sm" className="text-red-500 h-6" onClick={() => removeFont(f.id)}>✕</Button>}
                  </div>
                ))}
              </div>
            )}
            {editing && (
              <div className="flex gap-2">
                <Input value={fontName} onChange={e => setFontName(e.target.value)} placeholder="Font name" className="flex-1" />
                <select value={fontType} onChange={e => setFontType(e.target.value)} className="border rounded px-2 text-sm">
                  <option value="primary">Primary</option>
                  <option value="secondary">Secondary</option>
                  <option value="accent">Accent</option>
                </select>
                <Button size="sm" onClick={addFont}>Tambah</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
