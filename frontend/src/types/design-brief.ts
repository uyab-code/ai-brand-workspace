export type DesignBriefStatus = "draft" | "in_progress" | "in_review" | "approved" | "published"

export type DesignBrief = {
  id: string
  title: string
  description: string
  thumbnailUrl?: string
  contentType: "Instagram Feed" | "Story" | "Carousel" | "Ad Creative" | "Landing Page"
  client: string
  campaign: string
  status: DesignBriefStatus
  assignee: {
    name: string
    avatarUrl?: string
  }
  dueDate: string
  updatedAt: string
}

export const DESIGN_BRIEF_STATUS_LABELS: Record<DesignBriefStatus, string> = {
  draft: "Draft",
  in_progress: "In Progress",
  in_review: "In Review",
  approved: "Approved",
  published: "Published",
}
