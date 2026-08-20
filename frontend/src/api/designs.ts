import api from "@/lib/api"
import { ApiResponse } from "@/types/api"
import { GeneratedDesign } from "@/types/design"

export const designsApi = {
  generate: async (
    clientId: string,
    contentType: string,
    prompt: string,
    contentBriefId?: string,
    slideId?: string
  ): Promise<ApiResponse<GeneratedDesign>> => {
    const res = await api.post("/designs/generate", {
      client_id: clientId,
      content_type: contentType,
      prompt,
      content_brief_id: contentBriefId || null,
      slide_id: slideId || null,
    })
    return res.data
  },

  generateCarousel: async (
    clientId: string,
    slides: { prompt: string; content_type?: string; name?: string }[],
    contentBriefId?: string,
    logoPosition: "none" | "top_left" | "top_right" = "none"
  ): Promise<ApiResponse<GeneratedDesign[]>> => {
    const res = await api.post("/designs/generate/carousel", {
      client_id: clientId,
      slides: slides.map((s) => ({
        prompt: s.prompt,
        content_type: s.content_type || "carousel",
        name: s.name || null,
      })),
      content_brief_id: contentBriefId || null,
      logo_position: logoPosition,
    })
    return res.data
  },

  listByClient: async (
    clientId: string
  ): Promise<ApiResponse<GeneratedDesign[]>> => {
    const res = await api.get(`/designs/client/${clientId}`)
    return res.data
  },

  listBySlide: async (
    slideId: string
  ): Promise<ApiResponse<GeneratedDesign[]>> => {
    const res = await api.get(`/designs/slide/${slideId}`)
    return res.data
  },

  get: async (designId: string): Promise<ApiResponse<GeneratedDesign>> => {
    const res = await api.get(`/designs/detail/${designId}`)
    return res.data
  },

  delete: async (
    designId: string
  ): Promise<ApiResponse<{ message: string }>> => {
    const res = await api.delete(`/designs/${designId}`)
    return res.data
  },
}
