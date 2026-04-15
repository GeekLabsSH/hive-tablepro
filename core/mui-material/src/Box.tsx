import * as React from "react";
import { cn } from "../../../src/lib/utils";

export interface BoxProps extends React.HTMLAttributes<HTMLElement> {
  component?: React.ElementType;
}

export const Box = React.forwardRef<HTMLElement, BoxProps>(function Box(
  { component: Component = "div", className, ...props },
  ref
) {
  return <Component ref={ref} className={cn(className)} {...props} />;
});

Box.displayName = "Box";
