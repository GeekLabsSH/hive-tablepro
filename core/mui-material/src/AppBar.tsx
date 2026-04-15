import * as React from "react";
import { cn } from "../../../src/lib/utils";

export const AppBar = React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(
  ({ className, ...props }, ref) => (
    <header
      ref={ref}
      className={cn(
        "flex w-full items-center border-b bg-background/95 px-4 py-2 text-foreground shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/60",
        className
      )}
      {...props}
    />
  )
);
AppBar.displayName = "AppBar";

export const Toolbar = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex min-h-14 w-full items-center gap-4", className)} {...props} />
  )
);
Toolbar.displayName = "Toolbar";
