import { cn } from "@/lib/utils"
import { ContentStatus, CONTENT_STATUS_LABELS } from "@/types/content-brief"

const statusStyles: Record<ContentStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  in_progress: "bg-blue-50 text-blue-700",
  generated: "bg-blue-50 text-blue-700",
  in_review: "bg-yellow-50 text-yellow-700",
  approved: "bg-green-50 text-green-700",
  published: "bg-accent text-primary",
}

const contentTypeStyles: Record<string, string> = {
  feed: "bg-muted text-muted-foreground",
  story: "bg-muted text-muted-foreground",
  carousel: "bg-muted text-muted-foreground",
}

export function StatusBadge({
  status,
  className,
}: {
  status: ContentStatus
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        statusStyles[status] || "bg-muted text-muted-foreground",
        className
      )}
    >
      {CONTENT_STATUS_LABELS[status] || status}
    </span>
  )
}

export function ContentTypeBadge({
  type,
  className,
}: {
  type: string
  className?: string
}) {
  const labels: Record<string, string> = {
    feed: "Feed",
    story: "Story",
    carousel: "Carousel",
  }
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        contentTypeStyles[type] || "bg-muted text-muted-foreground",
        className
      )}
    >
      {labels[type] || type}
    </span>
  )
}