"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { authApi } from "@/api/auth"
import { auth } from "@/lib/auth"
import { User } from "@/types/auth"

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  const checkAuth = useCallback(async () => {
    try {
      if (!auth.isAuthenticated()) {
        setIsLoading(false)
        return
      }

      const response = await authApi.getMe()
      if (response.success) {
        setUser(response.data)
      } else {
        auth.removeTokens()
      }
    } catch (error) {
      auth.removeTokens()
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  const login = async (email: string, password: string) => {
    const response = await authApi.login({ email, password })
    if (response.success) {
      auth.setTokens(response.data.access_token, response.data.refresh_token)
      await checkAuth()
      router.push("/dashboard")
    }
    return response
  }

  const register = async (email: string, password: string, name: string) => {
    const response = await authApi.register({ email, password, name })
    if (response.success) {
      auth.setTokens(response.data.access_token, response.data.refresh_token)
      await checkAuth()
      router.push("/dashboard")
    }
    return response
  }

  const logout = () => {
    auth.removeTokens()
    setUser(null)
    router.push("/login")
  }

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
  }
}
