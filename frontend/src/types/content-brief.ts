export interface ContentBrief {
  id: string
  organization_id: string
  client_id: string
  name: string
  content_type: ContentType
  platform: Platform
  deadline_date: string | null
  status: ContentStatus
  slides: BriefSlide[]
  created_at: string | null
}

export interface BriefSlide {
  id: string
  slide_title: string
  brief_text: string
  notes: string | null
  slide_number: number
}

export type Platform = "instagram" | "tiktok" | "facebook" | "twitter" | "linkedin"
export type ContentType = "feed" | "story" | "carousel"
export type ContentStatus =
  | "draft"
  | "in_progress"
  | "generated"
  | "in_review"
  | "approved"
  | "published"

export const PLATFORM_LABELS: Record<Platform, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  facebook: "Facebook",
  twitter: "Twitter/X",
  linkedin: "LinkedIn",
}

export const PLATFORM_BADGE_VARIANTS: Record<Platform, string> = {
  instagram: "bg-pink-100 text-pink-700",
  tiktok: "bg-neutral-900 text-white",
  facebook: "bg-blue-100 text-blue-700",
  twitter: "bg-slate-100 text-slate-700",
  linkedin: "bg-cyan-100 text-cyan-700",
}

export const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  feed: "Feed",
  story: "Story",
  carousel: "Carousel",
}

export const CONTENT_STATUS_LABELS: Record<ContentStatus, string> = {
  draft: "Draft",
  in_progress: "In Progress",
  generated: "Generated",
  in_review: "In Review",
  approved: "Approved",
  published: "Published",
}
