import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface CollapsibleProps extends React.HTMLAttributes<HTMLDetailsElement> {
  title: string
  defaultOpen?: boolean
}

const Collapsible = React.forwardRef<HTMLDetailsElement, CollapsibleProps>(
  ({ className, title, defaultOpen = false, children, ...props }, ref) => {
    return (
      <details
        ref={ref}
        className={cn(
          "group rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden",
          className
        )}
        open={defaultOpen}
        {...props}
      >
        <summary className="flex cursor-pointer items-center justify-between p-4 font-medium transition-colors hover:bg-accent/50 [&::-webkit-details-marker]:hidden">
          <span>{title}</span>
          <ChevronDown className="h-4 w-4 transition-transform duration-200 group-open:rotate-180" />
        </summary>
        <div className="border-t p-4 pt-3">
          {children}
        </div>
      </details>
    )
  }
)
Collapsible.displayName = "Collapsible"

export { Collapsible }

