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
  const [tab, setTab] = useState("overview")
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

  const addFont = async () => {
    if (!fontName) return
    const r = await assetsApi.addFont(clientId, fontName, fontType)
    if (r.success) { setAssets([...assets, r.data]); setFontName("") }
  }

  const saveColors = async () => {
    const c = colors.split(",").map(x => x.trim()).filter(Boolean)
    const r = await assetsApi.updateColors(clientId, c)
    if (r.success) setAssets(assets.map(a => a.id === r.data.id ? r.data : a))
  }

  const saveStyle = async () => {
    if (!style) return
    const r = await assetsApi.updateStyle(clientId, style)
    if (r.success) setAssets(assets.map(a => a.id === r.data.id ? r.data : a))
  }

  if (loading) return <div className="p-6 text-gray-500">Loading...</div>
  if (!client) return <div className="p-6 text-gray-500">Not found</div>

  const logo = assets.find(a => a.asset_type === "logo")
  const fonts = assets.filter(a => a.asset_type === "font")
  const ca = assets.find(a => a.brand_colors)
  const sa = assets.find(a => a.brand_style)

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">{client.name}</h1><p className="text-gray-500">{client.description || "-"}</p></div>
      <div className="flex gap-2 border-b pb-2">
        {["overview", "assets", "brand"].map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-t text-sm font-medium ${tab === t ? "bg-primary text-white" : "text-gray-600"}`}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle>Client Info</CardTitle></CardHeader>
            <CardContent>
              <p>Status: {client.status}</p>
              <p>Logo: {logo ? "✓" : "✗"}</p>
              <p>Fonts: {fonts.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Brand Colors</CardTitle></CardHeader>
            <CardContent>
              {ca?.brand_colors?.colors?.length ? (
                <div className="flex gap-2 flex-wrap">{ca.brand_colors.colors.map((c, i) => (
                  <div key={i} className="flex flex-col items-center"><div className="w-8 h-8 rounded-full border" style={{ backgroundColor: c }} /><span className="text-xs">{c}</span></div>
                ))}</div>
              ) : <p className="text-gray-500">Belum ada</p>}
            </CardContent>
          </Card>
        </div>
      )}

      {tab === "assets" && (
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle>Logo</CardTitle></CardHeader>
            <CardContent>{logo?.file_url ? <img src={logo.file_url} alt="Logo" className="max-h-24" /> : <p className="text-gray-500">Belum diupload</p>}<Button variant="outline" size="sm">Upload</Button></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Fonts ({fonts.length})</CardTitle></CardHeader>
            <CardContent>
              {fonts.map(f => <p key={f.id} className="text-sm">{f.font_name} ({f.font_type})</p>)}
              <div className="flex gap-2 mt-2">
                <Input value={fontName} onChange={e => setFontName(e.target.value)} placeholder="Font name" />
                <select value={fontType} onChange={e => setFontType(e.target.value)} className="border rounded px-2">
                  <option value="primary">Primary</option>
                  <option value="secondary">Secondary</option>
                  <option value="accent">Accent</option>
                </select>
                <Button size="sm" onClick={addFont}>Add</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {tab === "brand" && (
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle>Brand Colors</CardTitle></CardHeader>
            <CardContent>
              <Input defaultValue={ca?.brand_colors?.colors?.join(", ") || ""} onChange={e => setColors(e.target.value)} placeholder="#FF0000, #00FF00" />
              <Button size="sm" className="mt-2" onClick={saveColors}>Simpan</Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Brand Style</CardTitle></CardHeader>
            <CardContent>
              <textarea className="w-full min-h-[100px] border rounded-md p-2" defaultValue={sa?.brand_style || ""} onChange={e => setStyle(e.target.value)} placeholder="Modern, minimalis..." />
              <Button size="sm" className="mt-2" onClick={saveStyle}>Simpan</Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
