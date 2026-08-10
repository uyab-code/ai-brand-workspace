import { cn } from "@/lib/utils"

export function Avatar({
  name,
  src,
  className,
}: {
  name: string
  src?: string
  className?: string
}) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className={cn("h-8 w-8 overflow-hidden rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold", className)}>
      {src ? <img src={src} alt={name} className="h-full w-full object-cover" /> : initials}
    </div>
  )
}
