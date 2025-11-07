// components/PopoverContentInDialog.tsx
"use client";
import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { cn } from "@/lib/utils";

type Props = React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content> & {
  container?: HTMLElement | null;
};

export const PopoverContentInDialog = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  Props
>(({ className, sideOffset = 4, container, ...props }, ref) => {
  return (
    <PopoverPrimitive.Portal container={container ?? undefined}>
      <PopoverPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        className={cn(
          // make sure this is above your Dialog overlay/content
          "z-[10000] w-auto rounded-md border bg-popover p-0 shadow-md outline-none",
          className
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  );
});
PopoverContentInDialog.displayName = "PopoverContentInDialog";
