import * as React from "react";
import { Input } from "../../../src/components/ui/input";

export { Input };
export const OutlinedInput = Input;

export const InputAdornment = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { position?: "start" | "end" }
>(function InputAdornment({ className, position = "start", ...props }, ref) {
  return (
    <div ref={ref} className={className} data-position={position} {...props} />
  );
});
InputAdornment.displayName = "InputAdornment";
