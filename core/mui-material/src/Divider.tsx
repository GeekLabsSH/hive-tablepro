import * as React from "react";
import { cn } from "../../../src/lib/utils";

export interface DividerProps extends React.HTMLAttributes<HTMLHRElement> {
  orientation?: "horizontal" | "vertical";
  flexItem?: boolean;
  variant?: "fullWidth" | "inset" | "middle";
}

export const Divider = React.forwardRef<HTMLHRElement, DividerProps>(function Divider(
  { className, orientation = "horizontal", ...props },
  ref
) {
  if (orientation === "vertical") {
    return (
      <span
        role="separator"
        ref={ref as never}
        className={cn("inline-block h-auto min-h-[1em] w-px shrink-0 self-stretch bg-border", className)}
        {...(props as React.HTMLAttributes<HTMLSpanElement>)}
      />
    );
  }
  return (
    <hr
      ref={ref}
      role="separator"
      className={cn("my-2 w-full border-0 border-t border-border", className)}
      {...props}
    />
  );
});

Divider.displayName = "Divider";
