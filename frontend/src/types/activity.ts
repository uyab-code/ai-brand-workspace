export type ActivityAction =
  | "create"
  | "update"
  | "delete"
  | "status_change"
  | "generate"

export type ActivityEntityType = "content_brief" | "design"

export interface Activity {
  id: string
  user_name: string
  user_email: string
  action: ActivityAction
  entity_type: ActivityEntityType
  entity_id: string
  entity_name: string
  details: string | null
  created_at: string | null
}

export const ACTIVITY_VERBS: Record<ActivityAction, string> = {
  create: "membuat",
  update: "mengubah",
  delete: "menghapus",
  status_change: "mengubah status",
  generate: "membuat desain",
}
