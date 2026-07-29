"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { organizationsApi } from "@/api/organizations"

interface InviteMemberProps {
  organizationId: string
  onInviteSent?: (email: string) => void
}

export function InviteMember({ organizationId, onInviteSent }: InviteMemberProps) {
  const [email, setEmail] = useState("")
  const [role, setRole] = useState("designer")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [inviteToken, setInviteToken] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setInviteToken(null)
    setIsLoading(true)

    try {
      const response = await organizationsApi.inviteMember(organizationId, email, role)
      if (response.success) {
        setSuccess(`Undangan berhasil dibuat untuk ${email}`)
        setInviteToken(response.data.token)
        setEmail("")
        onInviteSent?.(email)
      } else {
        setError(response.error?.message || "Gagal membuat undangan")
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || "Terjadi kesalahan")
    } finally {
      setIsLoading(false)
    }
  }

  const copyInviteLink = () => {
    if (inviteToken) {
      const inviteUrl = `${window.location.origin}/invite?token=${inviteToken}`
      navigator.clipboard.writeText(inviteUrl)
      alert("Link undangan sudah disalin!")
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invite Team Member</CardTitle>
        <CardDescription>
          Kirim undangan via email. User akan membuat password mereka sendiri.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 text-sm text-green-600 bg-green-50 rounded-md">
              {success}
              {inviteToken && (
                <div className="mt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={copyInviteLink}
                  >
                    Salin Link Undangan
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1">
                    Atau bagikan link ini: /invite?token={inviteToken}
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="nama@perusahaan.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full h-10 px-3 py-2 text-sm border border-input bg-background rounded-[10px] focus:outline-none focus:ring-2 focus:ring-ring focus-visible:outline-none focus-visible:ring-offset-2"
            >
              <option value="designer">Designer</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Mengirim..." : "Kirim Undangan"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
