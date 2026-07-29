import api from "@/lib/api"
import { ApiResponse } from "@/types/api"
import { ContentBrief, BriefSlide } from "@/types/content-brief"

export const contentBriefsApi = {
  list: async (orgId: string): Promise<ApiResponse<ContentBrief[]>> => {
    const res = await api.get(`/content-briefs/${orgId}`)
    return res.data
  },

  get: async (briefId: string): Promise<ApiResponse<ContentBrief>> => {
    const res = await api.get(`/content-briefs/detail/${briefId}`)
    return res.data
  },

  create: async (
    orgId: string,
    clientId: string,
    name: string,
    contentType: string,
    platform: string,
    slides: { slide_title: string; brief_text: string; notes?: string }[],
    deadlineDate?: string
  ): Promise<ApiResponse<ContentBrief>> => {
    const res = await api.post("/content-briefs/", {
      organization_id: orgId,
      client_id: clientId,
      name,
      content_type: contentType,
      platform,
      deadline_date: deadlineDate || null,
      slides,
    })
    return res.data
  },

  update: async (
    briefId: string,
    data: {
      name?: string
      content_type?: string
      platform?: string
      deadline_date?: string | null
    }
  ): Promise<ApiResponse<ContentBrief>> => {
    const res = await api.put(`/content-briefs/${briefId}`, data)
    return res.data
  },

  updateStatus: async (
    briefId: string,
    status: string
  ): Promise<ApiResponse<ContentBrief>> => {
    const res = await api.patch(`/content-briefs/${briefId}/status`, { status })
    return res.data
  },

  updateSlide: async (
    slideId: string,
    data: {
      slide_title?: string
      brief_text?: string
      notes?: string | null
    }
  ): Promise<ApiResponse<BriefSlide>> => {
    const res = await api.put(`/content-briefs/slides/${slideId}`, data)
    return res.data
  },

  delete: async (
    briefId: string
  ): Promise<ApiResponse<{ message: string }>> => {
    const res = await api.delete(`/content-briefs/${briefId}`)
    return res.data
  },

  getUpcoming: async (): Promise<ApiResponse<ContentBrief[]>> => {
    const res = await api.get("/content-briefs/upcoming/list")
    return res.data
  },

  stats: async (
    orgId: string
  ): Promise<ApiResponse<{ total: number; active: number }>> => {
    const res = await api.get(`/content-briefs/stats/${orgId}`)
    return res.data
  },
}
