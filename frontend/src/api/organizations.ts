import api from "@/lib/api"
import { ApiResponse } from "@/types/api"
import { Organization, TeamMember } from "@/types/organization"

export const organizationsApi = {
  create: async (name: string): Promise<ApiResponse<Organization>> => {
    const response = await api.post("/organizations", { name })
    return response.data
  },

  list: async (): Promise<ApiResponse<Organization[]>> => {
    const response = await api.get("/organizations")
    return response.data
  },

  get: async (id: string): Promise<ApiResponse<Organization>> => {
    const response = await api.get(`/organizations/${id}`)
    return response.data
  },

  update: async (id: string, name: string): Promise<ApiResponse<Organization>> => {
    const response = await api.put(`/organizations/${id}`, { name })
    return response.data
  },

  inviteMember: async (
    orgId: string,
    email: string,
    role: string
  ): Promise<ApiResponse<{ id: string; email: string; token: string; expires_at: string }>> => {
    const response = await api.post(`/invitations/${orgId}/invite`, { email, role })
    return response.data
  },

  getMembers: async (orgId: string): Promise<ApiResponse<TeamMember[]>> => {
    const response = await api.get(`/organizations/${orgId}/members`)
    return response.data
  },

  updateMemberRole: async (
    orgId: string,
    memberId: string,
    role: string
  ): Promise<ApiResponse<TeamMember>> => {
    const response = await api.put(`/organizations/${orgId}/members/${memberId}`, { role })
    return response.data
  },
}
