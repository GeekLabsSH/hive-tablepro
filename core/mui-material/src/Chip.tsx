import * as React from "react";
import { cn } from "../../../src/lib/utils";

export interface ChipProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: React.ReactNode;
  size?: "small" | "medium";
  color?: "default" | "primary" | "secondary";
  onDelete?: () => void;
}

export const Chip = React.forwardRef<HTMLDivElement, ChipProps>(function Chip(
  { className, label, children, size = "medium", color = "default", onDelete, ...props },
  ref
) {
  return (
    <div
      ref={ref}
      role="presentation"
      className={cn(
        "inline-flex max-w-full items-center gap-1 rounded-full border px-2.5 py-0.5 text-sm font-medium",
        size === "small" && "text-xs",
        color === "primary" && "border-primary/30 bg-primary/10 text-primary",
        color === "secondary" && "border-secondary bg-secondary text-secondary-foreground",
        color === "default" && "border-border bg-muted text-foreground",
        className
      )}
      {...props}
    >
      <span className="truncate">{label ?? children}</span>
      {onDelete ? (
        <button
          type="button"
          className="ml-1 rounded-full p-0.5 hover:bg-background/50"
          onClick={onDelete}
          aria-label="Remove"
        >
          ×
        </button>
      ) : null}
    </div>
  );
});

Chip.displayName = "Chip";
