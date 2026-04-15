import * as React from "react";
import { cn } from "../../../src/lib/utils";

/** Classes estáticas para o Tailwind incluir no bundle (sem template literals). */
const span: Record<number, string> = {
  1: "col-span-1",
  2: "col-span-2",
  3: "col-span-3",
  4: "col-span-4",
  5: "col-span-5",
  6: "col-span-6",
  7: "col-span-7",
  8: "col-span-8",
  9: "col-span-9",
  10: "col-span-10",
  11: "col-span-11",
  12: "col-span-12"
};

function itemSpan(n?: number) {
  if (n == null) return span[12];
  return span[Math.min(12, Math.max(1, n))] ?? span[12];
}

export interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  container?: boolean;
  item?: boolean;
  /** Colunas no breakpoint por defeito (1–12). Responsividade extra: usar `className` (ex.: `md:col-span-6`). */
  xs?: number;
  spacing?: number;
}

export const Grid = React.forwardRef<HTMLDivElement, GridProps>(function Grid(
  { className, container, item, xs = 12, spacing = 2, ...props },
  ref
) {
  if (container) {
    const gap =
      spacing === 0
        ? "gap-0"
        : spacing === 1
          ? "gap-1"
          : spacing === 2
            ? "gap-2"
            : spacing === 3
              ? "gap-3"
              : "gap-4";
    return (
      <div ref={ref} className={cn("grid w-full grid-cols-12", gap, className)} {...props} />
    );
  }
  if (item) {
    return <div ref={ref} className={cn(itemSpan(xs), className)} {...props} />;
  }
  return <div ref={ref} className={className} {...props} />;
});

Grid.displayName = "Grid";
