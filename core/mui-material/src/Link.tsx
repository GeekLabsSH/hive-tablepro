import * as React from "react";
import { cn } from "../../../src/lib/utils";

export interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  underline?: "always" | "hover" | "none";
}

export const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(function Link(
  { className, underline = "hover", ...props },
  ref
) {
  return (
    <a
      ref={ref}
      className={cn(
        "text-primary underline-offset-4",
        underline === "always" && "underline",
        underline === "hover" && "hover:underline",
        underline === "none" && "no-underline",
        className
      )}
      {...props}
    />
  );
});

Link.displayName = "Link";
