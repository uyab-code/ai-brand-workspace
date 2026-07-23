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
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  if (!organizationId) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team Settings</h1>
          <p className="text-gray-500">Anda belum memiliki organization</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Team Settings</h1>
        <p className="text-gray-500">Kelola anggota tim dan undang anggota baru</p>
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
              <p className="text-gray-500 text-sm">Belum ada anggota tim</p>
            ) : (
              <div className="space-y-3">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{member.user_name || member.user_email}</p>
                      <p className="text-sm text-gray-500">{member.user_email}</p>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        member.role === "owner"
                          ? "bg-purple-100 text-purple-800"
                          : member.role === "admin"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-800"
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
