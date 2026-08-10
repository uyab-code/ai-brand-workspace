"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/useAuth"
import { organizationsApi } from "@/api/organizations"
import { InviteMember } from "@/components/organization/InviteMember"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface TeamMember {
  id: string
  user_id: string
  role: string
  user_email?: string
  user_name?: string
}

export default function TeamSettingsPage() {
  const { user } = useAuth()
  const [organizationId, setOrganizationId] = useState<string | null>(null)
  const [members, setMembers] = useState<TeamMember[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadOrganization()
  }, [])

  const loadOrganization = async () => {
    try {
      const response = await organizationsApi.list()
      if (response.success && response.data.length > 0) {
        const org = response.data[0]
        setOrganizationId(org.id)
        await loadMembers(org.id)
      }
    } catch (error) {
      console.error("Failed to load organization:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadMembers = async (orgId: string) => {
    try {
      const response = await organizationsApi.getMembers(orgId)
      if (response.success) {
        setMembers(response.data)
      }
    } catch (error) {
      console.error("Failed to load members:", error)
    }
  }

  const handleInviteSent = () => {
    if (organizationId) {
      loadMembers(organizationId)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!organizationId) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Team Settings</h1>
          <p className="text-muted-foreground">Anda belum memiliki organization</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Team Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Kelola anggota tim dan undang anggota baru</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Invite Form */}
        <InviteMember
          organizationId={organizationId}
          onInviteSent={handleInviteSent}
        />

        {/* Members List */}
        <Card>
          <CardHeader>
            <CardTitle>Team Members ({members.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {members.length === 0 ? (
              <p className="text-muted-foreground text-sm">Belum ada anggota tim</p>
            ) : (
              <div className="space-y-3">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 bg-background rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{member.user_name || member.user_email}</p>
                      <p className="text-sm text-muted-foreground">{member.user_email}</p>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        member.role === "owner"
                          ? "bg-accent text-accent-foreground"
                          : member.role === "admin"
                          ? "bg-muted text-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {member.role}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
