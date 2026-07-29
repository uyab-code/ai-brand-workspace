import api from "@/lib/api"
import { ApiResponse } from "@/types/api"
import { CreditBalance } from "@/types/credit"

export const creditsApi = {
  getBalance: async (orgId: string): Promise<ApiResponse<CreditBalance>> => {
    const res = await api.get(`/credits/${orgId}`)
    return res.data
  },
}
