import * as React from "react";
import { cn } from "../../../src/lib/utils";

export interface LinearProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "determinate" | "indeterminate" | "buffer" | "query";
  value?: number;
}

export const LinearProgress = React.forwardRef<HTMLDivElement, LinearProgressProps>(
  function LinearProgress({ className, value, variant = "indeterminate", ...props }, ref) {
    const pct = value != null ? Math.min(100, Math.max(0, value)) : undefined;
    return (
      <div
        ref={ref}
        role="progressbar"
        aria-valuenow={pct}
        className={cn("relative h-1.5 w-full overflow-hidden rounded-full bg-primary/20", className)}
        {...props}
      >
        <div
          className={cn(
            "h-full bg-primary transition-[width] duration-300 ease-out",
            variant === "indeterminate" && "w-1/3 animate-[pulse_1.5s_ease-in-out_infinite]"
          )}
          style={
            variant === "determinate" && pct != null
              ? { width: `${pct}%` }
              : variant === "indeterminate"
                ? undefined
                : { width: pct != null ? `${pct}%` : "33%" }
          }
        />
      </div>
    );
  }
);
LinearProgress.displayName = "LinearProgress";

export const CircularProgress = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  function CircularProgress({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        role="status"
        aria-label="Loading"
        className={cn("inline-flex h-8 w-8 animate-spin text-primary", className)}
        {...props}
      >
        <svg className="h-full w-full" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      </div>
    );
  }
);
CircularProgress.displayName = "CircularProgress";
