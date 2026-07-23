import api from "@/lib/api"
import { ApiResponse } from "@/types/api"

export interface InvitationDetail {
  id: string
  email: string
  organization_name: string
  role: string
  status: string
  expires_at: string
}

export const invitationsApi = {
  getInvitation: async (token: string): Promise<ApiResponse<InvitationDetail>> => {
    const response = await api.get(`/invitations/${token}`)
    return response.data
  },

  setPassword: async (token: string, password: string): Promise<ApiResponse<{ message: string; email: string }>> => {
    const response = await api.post(`/invitations/${token}/password`, { password })
    return response.data
  },
}
