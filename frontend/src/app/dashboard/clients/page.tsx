"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { organizationsApi } from "@/api/organizations"
import { clientsApi } from "@/api/clients"
import { Client } from "@/types/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [orgId, setOrgId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState("")

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
    if (!orgId) return
    const r = await clientsApi.create(orgId, name)
    if (r.success) { setClients([...clients, r.data]); setName(""); setShowForm(false) }
  }

  if (loading) return <div className="p-6 text-gray-500">Loading...</div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Clients</h1>
          <p className="text-gray-500">Kelola daftar client Anda</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>{showForm ? "Batal" : "+ Tambah Client"}</Button>
      </div>
      {showForm && (
        <Card>
          <CardHeader><CardTitle>Tambah Client</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={create} className="space-y-4">
              <div><Label>Nama Client</Label><Input value={name} onChange={e => setName(e.target.value)} required /></div>
              <Button type="submit">Simpan</Button>
            </form>
          </CardContent>
        </Card>
      )}
      {clients.length === 0 ? (
        <Card><CardContent className="p-6 text-center text-gray-500">Belum ada client</CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map(c => (
            <Link key={c.id} href={`/dashboard/clients/${c.id}`}>
              <Card className="hover:shadow-md cursor-pointer transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg">{c.name}</CardTitle>
                    <span className={`px-2 py-1 text-xs rounded-full ${c.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>{c.status}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500">{c.description || "-"}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
