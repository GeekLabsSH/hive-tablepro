import * as React from "react";
import { cn } from "../../../src/lib/utils";

const spacingMap: Record<number, string> = {
  0: "gap-0",
  1: "gap-1",
  2: "gap-2",
  3: "gap-3",
  4: "gap-4",
  5: "gap-5",
  6: "gap-6",
  8: "gap-8",
  10: "gap-10",
  12: "gap-12"
};

export interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
  direction?: "row" | "row-reverse" | "column" | "column-reverse";
  spacing?: keyof typeof spacingMap | number;
  alignItems?: React.CSSProperties["alignItems"];
  justifyContent?: React.CSSProperties["justifyContent"];
  flexWrap?: React.CSSProperties["flexWrap"];
}

export const Stack = React.forwardRef<HTMLDivElement, StackProps>(function Stack(
  {
    className,
    direction = "column",
    spacing = 2,
    alignItems,
    justifyContent,
    flexWrap = "nowrap",
    style,
    ...props
  },
  ref
) {
  const gap =
    typeof spacing === "number" ? spacingMap[spacing] ?? `gap-[${spacing * 0.25}rem]` : spacingMap[spacing];
  const dir =
    direction === "row"
      ? "flex-row"
      : direction === "row-reverse"
        ? "flex-row-reverse"
        : direction === "column-reverse"
          ? "flex-col-reverse"
          : "flex-col";
  return (
    <div
      ref={ref}
      className={cn("flex", dir, gap, className)}
      style={{ alignItems, justifyContent, flexWrap, ...style }}
      {...props}
    />
  );
});

Stack.displayName = "Stack";
