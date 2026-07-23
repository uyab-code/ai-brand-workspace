import api from "@/lib/api"
import { ApiResponse } from "@/types/api"
import { LoginRequest, RegisterRequest, TokenResponse, User } from "@/types/auth"

export const authApi = {
  register: async (data: RegisterRequest): Promise<ApiResponse<TokenResponse>> => {
    const response = await api.post("/auth/register", data)
    return response.data
  },

  login: async (data: LoginRequest): Promise<ApiResponse<TokenResponse>> => {
    const response = await api.post("/auth/login", data)
    return response.data
  },

  refresh: async (refreshToken: string): Promise<ApiResponse<TokenResponse>> => {
    const response = await api.post("/auth/refresh", { refresh_token: refreshToken })
    return response.data
  },

  getMe: async (): Promise<ApiResponse<User>> => {
    const response = await api.get("/auth/me")
    return response.data
  },

  forgotPassword: async (email: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.post("/auth/forgot-password", { email })
    return response.data
  },

  resetPassword: async (
    token: string,
    newPassword: string
  ): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.post("/auth/reset-password", {
      token,
      new_password: newPassword,
    })
    return response.data
  },
}
