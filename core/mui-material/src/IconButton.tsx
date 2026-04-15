import * as React from "react";
import { Button, type ButtonProps } from "../../../src/components/ui/button";
import { cn } from "../../../src/lib/utils";

export interface IconButtonProps extends Omit<ButtonProps, "size"> {
  size?: "small" | "medium" | "large";
  color?: "default" | "primary" | "secondary" | "error" | "inherit";
}

const sizeMap = {
  small: "icon" as const,
  medium: "icon" as const,
  large: "icon" as const
};

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { className, size = "medium", color = "default", variant = "ghost", ...props },
  ref
) {
  const shadVariant =
    color === "error" ? "destructive" : variant === "default" ? "ghost" : variant;
  return (
    <Button
      ref={ref}
      type="button"
      variant={shadVariant}
      size={sizeMap[size]}
      className={cn(size === "small" && "h-8 w-8", size === "large" && "h-12 w-12", className)}
      {...props}
    />
  );
});

IconButton.displayName = "IconButton";
