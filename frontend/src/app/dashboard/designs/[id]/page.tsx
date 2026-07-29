"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { clientsApi } from "@/api/clients"
import { designsApi } from "@/api/designs"
import { GeneratedDesign } from "@/types/design"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function DesignDetailPage() {
  const { id: designId } = useParams<{ id: string }>()
  const router = useRouter()
  const [design, setDesign] = useState<GeneratedDesign | null>(null)
  const [clientName, setClientName] = useState("")
  const [userPrompt, setUserPrompt] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    const dRes = await designsApi.get(designId)
    if (dRes.success) {
      setDesign(dRes.data)
      // Extract user prompt: everything after the last "---\n\n" divider
      const parts = dRes.data.prompt_used.split("---\n\n")
      setUserPrompt(parts.length > 1 ? parts[parts.length - 1] : dRes.data.prompt_used)
      const cRes = await clientsApi.get(dRes.data.client_id)
      if (cRes.success) setClientName(cRes.data.name)
    }
    setLoading(false)
  }

  const handleDelete = async () => {
    if (!confirm("Hapus desain ini?")) return
    const r = await designsApi.delete(designId)
    if (r.success) {
      if (design?.content_brief_id) {
        router.push(`/dashboard/content-briefs/${design.content_brief_id}`)
      } else {
        router.push("/dashboard/content-briefs")
      }
    }
  }

  const copyPrompt = () => {
    if (userPrompt) navigator.clipboard.writeText(userPrompt)
  }

  if (loading) return <div className="flex items-center justify-center min-h-[400px]">
    <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
  </div>
  if (!design) return <div className="p-6 text-muted-foreground">Not found</div>

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={design?.content_brief_id ? `/dashboard/content-briefs/${design.content_brief_id}` : "/dashboard/content-briefs"}>
            <Button variant="ghost" size="sm">← Kembali</Button>
          </Link>
          <h1 className="text-2xl font-bold">Design Detail</h1>
        </div>
        <Button variant="outline" className="text-red-600" onClick={handleDelete}>Hapus</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Image */}
        <Card>
          <CardContent className="p-4">
            <div className="aspect-square bg-muted rounded-lg overflow-hidden">
              <img
                src={design.image_url}
                alt={design.prompt_used.slice(0, 50)}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const t = e.target as HTMLImageElement
                  t.src = "https://placehold.co/600x600?text=AI+Design&font=montserrat"
                }}
              />
            </div>
            <div className="flex gap-2 mt-3">
              <Button variant="outline" size="sm" className="flex-1"
                onClick={() => window.open(design.image_url, "_blank")}>
                Download
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Metadata */}
        <Card>
          <CardHeader><CardTitle>Informasi</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <span className="text-xs text-muted-foreground">Client</span>
              <p className="font-medium">{clientName}</p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">Tipe</span>
              <p className="capitalize">{design.content_type}</p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">Version</span>
              <p>{design.version}</p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">Credits Digunakan</span>
              <p>{design.credits_used}</p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">Dibuat</span>
              <p>{design.created_at ? new Date(design.created_at).toLocaleString("id-ID") : "-"}</p>
            </div>
          </CardContent>
        </Card>

        {/* Prompt */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row justify-between items-center">
            <CardTitle>Prompt yang Digunakan</CardTitle>
            <Button variant="outline" size="sm" onClick={copyPrompt}>Copy</Button>
          </CardHeader>
          <CardContent>
            <pre className="text-sm text-foreground whitespace-pre-wrap bg-background p-4 rounded-md">
              {userPrompt}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
