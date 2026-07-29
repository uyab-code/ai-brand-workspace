"use client"

import { Suspense, useState } from "react"
import { useSearchParams } from "next/navigation"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { invitationsApi, InvitationDetail } from "@/api/invitations"

export default function InvitePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    }>
      <InviteContent />
    </Suspense>
  )
}

function InviteContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get("token")

  const [invitation, setInvitation] = useState<InvitationDetail | null>(null)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingInvitation, setIsLoadingInvitation] = useState(true)

  // Load invitation details on mount
  useState(() => {
    if (token) {
      invitationsApi.getInvitation(token)
        .then((res) => {
          if (res.success && res.data) {
            setInvitation(res.data)
          }
        })
        .catch(() => {
          setError("Invalid or expired invitation")
        })
        .finally(() => {
          setIsLoadingInvitation(false)
        })
    } else {
      setIsLoadingInvitation(false)
      setError("No invitation token provided")
    }
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (password !== confirmPassword) {
      setError("Password tidak cocok")
      return
    }

    if (password.length < 8) {
      setError("Password minimal 8 karakter")
      return
    }

    if (!token) {
      setError("Invalid invitation token")
      return
    }

    setIsLoading(true)

    try {
      const response = await invitationsApi.setPassword(token, password)
      if (response.success) {
        setSuccess(true)
        setTimeout(() => {
          router.push("/login")
        }, 2000)
      } else {
        setError(response.error?.message || "Failed to set password")
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoadingInvitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">Loading invitation details...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">Berhasil!</h2>
              <p className="text-muted-foreground">Password berhasil dibuat. Mengalihkan ke halaman login...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Buat Password</CardTitle>
          <CardDescription>
            {invitation
              ? `Anda diundang ke ${invitation.organization_name}`
              : "Buat password untuk akun Anda"}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
                {error}
              </div>
            )}

            {invitation && (
              <div className="p-3 text-sm text-blue-600 bg-blue-50 rounded-md">
                <p><strong>Email:</strong> {invitation.email}</p>
                <p><strong>Role:</strong> {invitation.role}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading || !invitation}>
              {isLoading ? "Membuat Password..." : "Buat Password"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
