import api from "@/lib/api"
import { ApiResponse } from "@/types/api"
import { NotificationList, NotificationItem } from "@/types/notification"

export const notificationsApi = {
  list: async (): Promise<ApiResponse<NotificationList>> => {
    const res = await api.get("/notifications")
    return res.data
  },

  markAllRead: async (): Promise<ApiResponse<{ updated: number }>> => {
    const res = await api.patch("/notifications/read-all")
    return res.data
  },

  markRead: async (id: string): Promise<ApiResponse<NotificationItem>> => {
    const res = await api.patch(`/notifications/${id}/read`)
    return res.data
  },
}
