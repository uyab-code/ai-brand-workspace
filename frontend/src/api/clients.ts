import api from "@/lib/api"
import { ApiResponse } from "@/types/api"
import { Client } from "@/types/client"

export const clientsApi = {
  list: async (orgId: string): Promise<ApiResponse<Client[]>> => {
    const res = await api.get(`/clients/${orgId}`)
    return res.data
  },
  get: async (clientId: string): Promise<ApiResponse<Client>> => {
    const res = await api.get(`/clients/detail/${clientId}`)
    return res.data
  },
  create: async (orgId: string, name: string, description?: string): Promise<ApiResponse<Client>> => {
    const res = await api.post("/clients/", { organization_id: orgId, name, description })
    return res.data
  },
  update: async (clientId: string, data: { name?: string; description?: string; status?: string }): Promise<ApiResponse<Client>> => {
    const res = await api.put(`/clients/${clientId}`, data)
    return res.data
  },
  delete: async (clientId: string): Promise<ApiResponse<{ message: string }>> => {
    const res = await api.delete(`/clients/${clientId}`)
    return res.data
  },
}
