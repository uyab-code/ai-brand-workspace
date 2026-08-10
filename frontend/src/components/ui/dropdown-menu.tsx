"use client"

import { ReactNode, useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

export function DropdownMenu({
  trigger,
  children,
  align = "right",
}: {
  trigger: ReactNode
  children: ReactNode
  align?: "left" | "right"
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", close)
    return () => document.removeEventListener("mousedown", close)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((value) => !value)} className="contents">
        {trigger}
      </button>
      {open && (
        <div className={cn("absolute top-full z-50 mt-2 min-w-48 rounded-xl border border-border bg-popover p-1 shadow-sm", align === "right" ? "right-0" : "left-0")}>{children}</div>
      )}
    </div>
  )
}

export function DropdownMenuItem({
  children,
  className,
  danger,
  onClick,
}: {
  children: ReactNode
  className?: string
  danger?: boolean
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-muted-foreground hover:bg-accent/10 hover:text-accent-foreground",
        danger && "text-destructive hover:bg-red-50 hover:text-destructive",
        className
      )}
    >
      {children}
    </button>
  )
}
