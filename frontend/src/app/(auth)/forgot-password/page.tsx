"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { authApi } from "@/api/auth"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setMessage("")
    setIsLoading(true)

    try {
      const response = await authApi.forgotPassword(email)
      if (response.success) {
        setMessage("Email reset password telah dikirim. Silakan cek inbox Anda.")
      } else {
        setError(response.error?.message || "Failed to send reset email")
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Lupa Password</CardTitle>
        <CardDescription>Masukkan email Anda untuk reset password</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {message && (
            <div className="p-3 text-sm text-green-600 bg-green-50 rounded-md">
              {message}
            </div>
          )}
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
              {error}
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
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Mengirim..." : "Kirim Reset Password"}
          </Button>
          <p className="text-sm text-center text-muted-foreground">
            <Link href="/login" className="text-primary hover:underline">
              Kembali ke login
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
