"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function RegisterPage() {
  const router = useRouter()

  useEffect(() => {
    router.push("/login?error=Sistem+invitation-only.+Silakan+hubungi+admin+untuk+undangan.")
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center text-muted-foreground">Mengarahkan ke halaman login...</div>
    </div>
  )
}