export interface Organization {
  id: string
  name: string
  owner_id: string
}

export interface TeamMember {
  id: string
  user_id: string
  role: "owner" | "admin" | "designer"
  user_email?: string
  user_name?: string
}
