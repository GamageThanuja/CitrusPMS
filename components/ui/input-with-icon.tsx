"use client"

import { InputHTMLAttributes, ReactNode, forwardRef } from "react"
import { cn } from "@/lib/utils"

interface InputWithIconProps extends InputHTMLAttributes<HTMLInputElement> {
  icon: ReactNode
}

export const InputWithIcon = forwardRef<HTMLInputElement, InputWithIconProps>(
  ({ icon, className, ...props }, ref) => {
    return (
      <div className="relative">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          {icon}
        </span>
        <input
          ref={ref}
          className={cn(
            "pl-10 pr-3 py-2 border border-input bg-background rounded-md text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent w-full",
            className
          )}
          {...props}
        />
      </div>
    )
  }
)

InputWithIcon.displayName = "InputWithIcon"
