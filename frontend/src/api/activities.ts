import api from "@/lib/api"
import { ApiResponse } from "@/types/api"
import { Activity } from "@/types/activity"

export const activitiesApi = {
  list: async (orgId: string): Promise<ApiResponse<Activity[]>> => {
    const res = await api.get(`/activities/${orgId}`)
    return res.data
  },
}
