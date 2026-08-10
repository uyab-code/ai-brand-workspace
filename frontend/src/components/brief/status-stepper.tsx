"use client"

import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { ContentStatus, CONTENT_STATUS_LABELS } from "@/types/content-brief"

const WORKFLOW: ContentStatus[] = [
  "draft",
  "in_progress",
  "generated",
  "in_review",
  "approved",
  "published",
]

function stepState(
  index: number,
  currentIndex: number
): "done" | "active" | "upcoming" {
  if (index < currentIndex) return "done"
  if (index === currentIndex) return "active"
  return "upcoming"
}

export function StatusStepper({
  currentStatus,
  onTransition,
}: {
  currentStatus: ContentStatus
  onTransition: (status: string) => void
}) {
  const currentIndex = WORKFLOW.indexOf(currentStatus)

  return (
    <div>
      <ol className="relative">
        {WORKFLOW.map((status, index) => {
          const state = stepState(index, currentIndex)
          const isLast = index === WORKFLOW.length - 1
          return (
            <li key={status} className="relative flex gap-3 pb-4 last:pb-0">
              {/* Connector line */}
              {!isLast && (
                <span
                  className={cn(
                    "absolute left-[11px] top-6 bottom-0 w-px",
                    index < currentIndex ? "bg-primary" : "bg-border"
                  )}
                  aria-hidden
                />
              )}

              {/* Dot */}
              <span
                className={cn(
                  "relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border",
                  state === "done" && "border-primary bg-primary text-primary-foreground",
                  state === "active" && "border-primary bg-primary text-primary-foreground ring-4 ring-primary/15",
                  state === "upcoming" && "border-border bg-card text-muted-foreground"
                )}
              >
                {state === "done" ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <span className={cn("h-1.5 w-1.5 rounded-full", state === "active" ? "bg-primary-foreground" : "bg-muted-foreground/50")} />
                )}
              </span>

              {/* Label */}
              <div className="flex flex-1 items-center gap-2 min-w-0">
                <span
                  className={cn(
                    "text-sm",
                    state === "active"
                      ? "font-semibold text-foreground"
                      : state === "done"
                      ? "font-medium text-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  {CONTENT_STATUS_LABELS[status]}
                </span>
                {state === "active" && (
                  <span className="inline-flex items-center rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent-foreground">
                    Saat ini
                  </span>
                )}
              </div>
            </li>
          )
        })}
      </ol>

      {/* Status change dropdown — all statuses, can move forward or backward */}
      <div className="mt-4 pt-4 border-t border-border">
        <label className="block text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1.5">
          Ubah status
        </label>
        <select
          value=""
          onChange={(e) => onTransition(e.target.value)}
          className="w-full h-10 rounded border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-ring/20 focus-visible:ring-offset-0 transition-colors"
        >
          <option value="" disabled>Pilih status...</option>
          {WORKFLOW.filter((s) => s !== currentStatus).map((nextStatus) => (
            <option key={nextStatus} value={nextStatus}>
              {CONTENT_STATUS_LABELS[nextStatus]}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
