export interface CreditBalance {
  id: string
  organization_id: string
  balance: number
  used: number
  plan: "freelancer" | "starter" | "pro"
}
