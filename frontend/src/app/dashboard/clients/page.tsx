"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { organizationsApi } from "@/api/organizations"
import { clientsApi } from "@/api/clients"
import { Client } from "@/types/client"
import { PageHeader } from "@/components/ui/page-header"
import { EmptyState } from "@/components/ui/empty-state"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Users } from "lucide-react"

function ClientInitials({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted text-sm font-semibold text-foreground shrink-0">
      {initials}
    </div>
  )
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [orgId, setOrgId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")

  useEffect(() => { load() }, [])
  const load = async () => {
    const o = await organizationsApi.list()
    if (o.success && o.data.length) {
      setOrgId(o.data[0].id)
      const c = await clientsApi.list(o.data[0].id)
      if (c.success) setClients(c.data)
    }
    setLoading(false)
  }

  const create = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!orgId || !name.trim()) return
    const r = await clientsApi.create(orgId, name, description || undefined)
    if (r.success) { setClients([...clients, r.data]); setName(""); setDescription(""); setShowForm(false) }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
    </div>
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clients"
        description="Kelola daftar client Anda"
        actions={
          <Button onClick={() => setShowForm(!showForm)}>{showForm ? "Batal" : "+ Tambah Client"}</Button>
        }
      />
      {showForm && (
        <Card className="p-6 space-y-4">
          <h3 className="text-sm font-semibold">Tambah Client Baru</h3>
          <form onSubmit={create} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Nama Client</Label>
                <Input value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. PT Maju Jaya" />
              </div>
              <div>
                <Label>Deskripsi (opsional)</Label>
                <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g. Brand fashion premium" />
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit">Simpan</Button>
              <Button variant="outline" type="button" onClick={() => setShowForm(false)}>Batal</Button>
            </div>
          </form>
        </Card>
      )}
      {clients.length === 0 ? (
        <EmptyState
          icon={<Users className="h-8 w-8" />}
          title="Belum ada client"
          description='Klik "+ Tambah Client" untuk menambah client pertama.'
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map(c => (
            <Link key={c.id} href={`/dashboard/clients/${c.id}`}>
              <Card className="p-4 hover:shadow-md cursor-pointer transition-all duration-200 h-full">
                <div className="flex gap-4">
                  <ClientInitials name={c.name} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-foreground truncate">{c.name}</h3>
                      <span className={`shrink-0 px-2 py-0.5 text-[11px] font-medium rounded-full ${
                        c.status === "active"
                          ? "bg-green-50 text-green-700"
                          : "bg-muted text-muted-foreground"
                      }`}>
                        {c.status}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {c.description || "Tidak ada deskripsi"}
                    </p>
                    <div className="mt-2 text-right">
                      <span className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                        See detail →
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}