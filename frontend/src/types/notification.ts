export interface NotificationItem {
  id: string
  type: "brief_assigned" | "brief_updated"
  title: string
  message: string
  entity_type: string | null
  entity_id: string | null
  is_read: boolean
  created_at: string | null
}

export interface NotificationList {
  items: NotificationItem[]
  unread_count: number
}
