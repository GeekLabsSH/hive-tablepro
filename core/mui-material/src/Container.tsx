import * as React from "react";
import { cn } from "../../../src/lib/utils";

const maxWidthClass: Record<string, string> = {
  xs: "max-w-screen-sm",
  sm: "max-w-screen-sm",
  md: "max-w-screen-md",
  lg: "max-w-screen-lg",
  xl: "max-w-screen-xl",
  false: "max-w-none"
};

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  maxWidth?: keyof typeof maxWidthClass | false;
  disableGutters?: boolean;
  fixed?: boolean;
}

export const Container = React.forwardRef<HTMLDivElement, ContainerProps>(function Container(
  { className, maxWidth = "lg", disableGutters, ...props },
  ref
) {
  const mw = maxWidth === false ? "max-w-none" : maxWidthClass[maxWidth] ?? maxWidthClass.lg;
  return (
    <div
      ref={ref}
      className={cn("mx-auto w-full", mw, !disableGutters && "px-4 sm:px-6 lg:px-8", className)}
      {...props}
    />
  );
});

Container.displayName = "Container";
