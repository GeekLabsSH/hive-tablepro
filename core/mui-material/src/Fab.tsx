import * as React from "react";
import { Button, type ButtonProps } from "../../../src/components/ui/button";
import { cn } from "../../../src/lib/utils";

export interface FabProps extends ButtonProps {
  color?: "default" | "primary" | "secondary";
}

export const Fab = React.forwardRef<HTMLButtonElement, FabProps>(function Fab(
  { className, color = "primary", ...props },
  ref
) {
  return (
    <Button
      ref={ref}
      type="button"
      variant={color === "secondary" ? "secondary" : "default"}
      className={cn("h-14 w-14 rounded-full p-0 shadow-md", className)}
      {...props}
    />
  );
});

Fab.displayName = "Fab";
