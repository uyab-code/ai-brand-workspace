"use client"

import { useMemo, useState } from "react"
import { CalendarDays, Eye, MoreHorizontal, Plus, RotateCcw, Sparkles, Trash2 } from "lucide-react"
import { Avatar } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { EmptyState } from "@/components/ui/empty-state"
import { PageHeader } from "@/components/ui/page-header"
import { SearchInput } from "@/components/ui/search-input"
import { Select } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DesignBrief, DesignBriefStatus, DESIGN_BRIEF_STATUS_LABELS } from "@/types/design-brief"

const briefs: DesignBrief[] = [
  {
    id: "brief-001",
    title: "Instagram Feed",
    description: "Promote New Product Launch",
    contentType: "Instagram Feed",
    client: "Northstar Coffee",
    campaign: "Spring Product Launch",
    status: "in_review",
    assignee: { name: "Ayu Pratama" },
    dueDate: "2026-08-02",
    updatedAt: "2026-07-26",
  },
  {
    id: "brief-002",
    title: "Carousel Campaign",
    description: "Founder story content series",
    contentType: "Carousel",
    client: "Lumina Studio",
    campaign: "Brand Awareness Q3",
    status: "in_progress",
    assignee: { name: "Raka Putra" },
    dueDate: "2026-08-06",
    updatedAt: "2026-07-25",
  },
  {
    id: "brief-003",
    title: "Story Sequence",
    description: "Limited promo social assets",
    contentType: "Story",
    client: "Kanvas Home",
    campaign: "Monthly Promo",
    status: "approved",
    assignee: { name: "Maya Sari" },
    dueDate: "2026-07-30",
    updatedAt: "2026-07-24",
  },
  {
    id: "brief-004",
    title: "Ad Creative",
    description: "Performance creative refresh",
    contentType: "Ad Creative",
    client: "Atlas Fitness",
    campaign: "Lead Generation",
    status: "draft",
    assignee: { name: "Dimas Ardi" },
    dueDate: "2026-08-12",
    updatedAt: "2026-07-21",
  },
  {
    id: "brief-005",
    title: "Landing Page Visual",
    description: "Campaign hero asset direction",
    contentType: "Landing Page",
    client: "Orbit Finance",
    campaign: "Enterprise Push",
    status: "published",
    assignee: { name: "Sinta Dewi" },
    dueDate: "2026-07-28",
    updatedAt: "2026-07-27",
  },
]

const statusVariant: Record<DesignBriefStatus, "neutral" | "info" | "warning" | "success" | "primary"> = {
  draft: "neutral",
  in_progress: "info",
  in_review: "warning",
  approved: "success",
  published: "primary",
}

const clients = Array.from(new Set(briefs.map((brief) => brief.client)))
const campaigns = Array.from(new Set(briefs.map((brief) => brief.campaign)))
const contentTypes = Array.from(new Set(briefs.map((brief) => brief.contentType)))
const assignees = Array.from(new Set(briefs.map((brief) => brief.assignee.name)))

export default function DesignBriefPage() {
  const [search, setSearch] = useState("")
  const [client, setClient] = useState("all")
  const [campaign, setCampaign] = useState("all")
  const [contentType, setContentType] = useState("all")
  const [status, setStatus] = useState("all")
  const [assignee, setAssignee] = useState("all")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [sort, setSort] = useState("updated_desc")
  const [view, setView] = useState("table")

  const filteredBriefs = useMemo(() => {
    const normalizedSearch = search.toLowerCase().trim()

    return briefs
      .filter((brief) => {
        const searchable = [brief.title, brief.description, brief.client, brief.campaign, brief.contentType, brief.assignee.name]
          .join(" ")
          .toLowerCase()

        if (normalizedSearch && !searchable.includes(normalizedSearch)) return false
        if (client !== "all" && brief.client !== client) return false
        if (campaign !== "all" && brief.campaign !== campaign) return false
        if (contentType !== "all" && brief.contentType !== contentType) return false
        if (status !== "all" && brief.status !== status) return false
        if (assignee !== "all" && brief.assignee.name !== assignee) return false
        if (dateFrom && brief.dueDate < dateFrom) return false
        if (dateTo && brief.dueDate > dateTo) return false
        return true
      })
      .sort((a, b) => {
        if (sort === "due_asc") return a.dueDate.localeCompare(b.dueDate)
        if (sort === "title_asc") return a.title.localeCompare(b.title)
        if (sort === "client_asc") return a.client.localeCompare(b.client)
        if (sort === "status_asc") return a.status.localeCompare(b.status)
        return b.updatedAt.localeCompare(a.updatedAt)
      })
  }, [assignee, campaign, client, contentType, dateFrom, dateTo, search, sort, status])

  const resetFilters = () => {
    setSearch("")
    setClient("all")
    setCampaign("all")
    setContentType("all")
    setStatus("all")
    setAssignee("all")
    setDateFrom("")
    setDateTo("")
    setSort("updated_desc")
    setView("table")
  }

  return (
    <div className="mx-auto max-w-[1440px] space-y-6">
      <PageHeader
        title="Design Brief"
        description="Manage creative briefs across clients, campaigns, assignees, and approval stages."
        actions={<Button><Plus className="mr-2 h-4 w-4" />New Brief</Button>}
      />

      <Card className="p-4 shadow-none">
        <div className="grid gap-3 xl:grid-cols-[minmax(260px,1.5fr)_repeat(8,minmax(130px,1fr))_auto]">
          <SearchInput value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search briefs..." />
          <Select value={client} onChange={(event) => setClient(event.target.value)}>
            <option value="all">All Clients</option>
            {clients.map((item) => <option key={item} value={item}>{item}</option>)}
          </Select>
          <Select value={campaign} onChange={(event) => setCampaign(event.target.value)}>
            <option value="all">All Campaigns</option>
            {campaigns.map((item) => <option key={item} value={item}>{item}</option>)}
          </Select>
          <Select value={contentType} onChange={(event) => setContentType(event.target.value)}>
            <option value="all">Content Type</option>
            {contentTypes.map((item) => <option key={item} value={item}>{item}</option>)}
          </Select>
          <Select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="all">All Status</option>
            {Object.entries(DESIGN_BRIEF_STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </Select>
          <Select value={assignee} onChange={(event) => setAssignee(event.target.value)}>
            <option value="all">Assignee</option>
            {assignees.map((item) => <option key={item} value={item}>{item}</option>)}
          </Select>
          <input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} className="h-10 rounded border border-input bg-card px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
          <input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} className="h-10 rounded border border-input bg-card px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
          <Select value={sort} onChange={(event) => setSort(event.target.value)}>
            <option value="updated_desc">Last Updated</option>
            <option value="due_asc">Due Date</option>
            <option value="title_asc">Title</option>
            <option value="client_asc">Client</option>
            <option value="status_asc">Status</option>
          </Select>
          <Select value={view} onChange={(event) => setView(event.target.value)}>
            <option value="table">Table</option>
            <option value="grid">Grid</option>
            <option value="calendar">Calendar</option>
          </Select>
          <Button variant="outline" onClick={resetFilters} className="h-10 px-3">
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </Card>

      {filteredBriefs.length === 0 ? (
        <EmptyState
          icon={<CalendarDays className="h-8 w-8" />}
          title="No briefs found"
          description="Adjust filters or create a new design brief for the campaign."
          action={<Button onClick={resetFilters} variant="outline">Reset filters</Button>}
        />
      ) : (
        <Card className="overflow-hidden shadow-none">
          <div className="overflow-x-auto">
            <Table className="min-w-[1180px]">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Thumbnail</TableHead>
                  <TableHead>Brief Title</TableHead>
                  <TableHead>Content Type</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assignee</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBriefs.map((brief) => (
                  <TableRow key={brief.id}>
                    <TableCell>
                      <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-border bg-muted text-xs font-semibold text-muted-foreground">
                        {brief.contentType.split(" ").map((part) => part[0]).join("").slice(0, 2)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold text-foreground">{brief.title}</div>
                      <div className="mt-1 text-sm text-muted-foreground">{brief.description}</div>
                    </TableCell>
                    <TableCell><Badge>{brief.contentType}</Badge></TableCell>
                    <TableCell className="font-medium text-foreground">{brief.client}</TableCell>
                    <TableCell className="text-muted-foreground">{brief.campaign}</TableCell>
                    <TableCell><Badge variant={statusVariant[brief.status]}>{DESIGN_BRIEF_STATUS_LABELS[brief.status]}</Badge></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar name={brief.assignee.name} />
                        <span className="font-medium text-foreground">{brief.assignee.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{new Date(brief.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</TableCell>
                    <TableCell className="text-muted-foreground">{new Date(brief.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu
                        trigger={
                          <span className="inline-flex h-9 w-9 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground">
                            <MoreHorizontal className="h-4 w-4" />
                          </span>
                        }
                      >
                        <DropdownMenuItem><Eye className="h-4 w-4" />Open</DropdownMenuItem>
                        <DropdownMenuItem><Sparkles className="h-4 w-4" />Generate</DropdownMenuItem>
                        <DropdownMenuItem>Duplicate</DropdownMenuItem>
                        <DropdownMenuItem>Approve</DropdownMenuItem>
                        <DropdownMenuItem danger><Trash2 className="h-4 w-4" />Delete</DropdownMenuItem>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </div>
  )
}
