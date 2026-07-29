export interface GeneratedDesign {
  id: string
  client_id: string
  content_brief_id: string | null
  slide_id: string | null
  image_url: string
  prompt_used: string
  content_type: "feed" | "story" | "carousel"
  version: number
  credits_used: number
  created_at: string | null
}
