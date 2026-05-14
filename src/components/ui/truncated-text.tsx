import * as React from "react"
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip"
import { cn } from "./utils"

interface TruncatedTextProps {
  children: React.ReactNode
  tip?: React.ReactNode
  className?: string
  as?: 'p' | 'div' | 'span'
}

export function TruncatedText({
  children,
  tip,
  className,
  as: Tag = 'p',
}: TruncatedTextProps) {
  const Element = Tag as React.ElementType
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Element className={cn("cursor-default", className)}>
          {children}
        </Element>
      </TooltipTrigger>
      <TooltipContent>{tip ?? children}</TooltipContent>
    </Tooltip>
  )
}
