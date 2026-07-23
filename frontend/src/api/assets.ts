import api from "@/lib/api"
import { ApiResponse } from "@/types/api"
import { BrandAsset } from "@/types/client"

export const assetsApi = {
  list: async (clientId: string): Promise<ApiResponse<BrandAsset[]>> => {
    const res = await api.get(`/assets/${clientId}`)
    return res.data
  },
  uploadLogo: async (clientId: string, file: File): Promise<ApiResponse<BrandAsset>> => {
    const formData = new FormData()
    formData.append("file", file)
    const res = await api.post(`/assets/${clientId}/logo`, formData, { headers: { "Content-Type": "multipart/form-data" } })
    return res.data
  },
  uploadGuideline: async (clientId: string, file: File): Promise<ApiResponse<BrandAsset>> => {
    const formData = new FormData()
    formData.append("file", file)
    const res = await api.post(`/assets/${clientId}/guideline`, formData, { headers: { "Content-Type": "multipart/form-data" } })
    return res.data
  },
  uploadReference: async (clientId: string, file: File): Promise<ApiResponse<BrandAsset>> => {
    const formData = new FormData()
    formData.append("file", file)
    const res = await api.post(`/assets/${clientId}/references`, formData, { headers: { "Content-Type": "multipart/form-data" } })
    return res.data
  },
  addFont: async (clientId: string, fontName: string, fontType: string): Promise<ApiResponse<BrandAsset>> => {
    const res = await api.post(`/assets/${clientId}/fonts`, { font_name: fontName, font_type: fontType })
    return res.data
  },
  removeFont: async (clientId: string, fontId: string): Promise<ApiResponse<{ message: string }>> => {
    const res = await api.delete(`/assets/${clientId}/fonts/${fontId}`)
    return res.data
  },
  updateColors: async (clientId: string, colors: string[]): Promise<ApiResponse<BrandAsset>> => {
    const res = await api.put(`/assets/${clientId}/colors`, { colors })
    return res.data
  },
  updateStyle: async (clientId: string, style: string): Promise<ApiResponse<BrandAsset>> => {
    const res = await api.put(`/assets/${clientId}/style`, { style })
    return res.data
  },
}
