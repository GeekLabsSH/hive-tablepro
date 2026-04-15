import * as React from "react";
import { cn } from "../../../src/lib/utils";

const elevationClass: Record<number, string> = {
  0: "shadow-none",
  1: "shadow-sm",
  2: "shadow",
  3: "shadow-md",
  4: "shadow-lg",
  6: "shadow-xl",
  8: "shadow-2xl"
};

export interface PaperProps extends React.HTMLAttributes<HTMLDivElement> {
  elevation?: keyof typeof elevationClass | number;
  square?: boolean;
  variant?: "elevation" | "outlined";
}

export const Paper = React.forwardRef<HTMLDivElement, PaperProps>(function Paper(
  { className, elevation = 1, square, variant = "elevation", ...props },
  ref
) {
  const elev = elevation in elevationClass ? elevationClass[elevation as keyof typeof elevationClass] : "shadow-md";
  return (
    <div
      ref={ref}
      className={cn(
        "rounded-lg bg-card text-card-foreground",
        !square && "rounded-lg",
        variant === "outlined" ? "border shadow-none" : elev,
        className
      )}
      {...props}
    />
  );
});

Paper.displayName = "Paper";
