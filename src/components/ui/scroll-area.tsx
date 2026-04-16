import * as React from "react";
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";
import { cn } from "../../lib/utils";

const ScrollAreaViewport = ScrollAreaPrimitive.Viewport as unknown as React.FC<
  React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }
>;

const ScrollAreaThumb = ScrollAreaPrimitive.ScrollAreaThumb as unknown as React.FC<
  React.HTMLAttributes<HTMLDivElement>
>;

type ScrollAreaPublicProps = React.PropsWithChildren<
  React.HTMLAttributes<HTMLDivElement> & {
    type?: "auto" | "always" | "scroll" | "hover";
    scrollHideDelay?: number;
    dir?: "ltr" | "rtl";
  }
>;

const ScrollArea = React.forwardRef<HTMLDivElement, ScrollAreaPublicProps>(
  ({ className, children, ...props }, ref) => (
    <ScrollAreaPrimitive.Root ref={ref} className={cn("relative overflow-hidden", className)} {...(props as any)}>
      <ScrollAreaViewport className="h-full w-full rounded-[inherit]">{children}</ScrollAreaViewport>
      <ScrollBar />
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  )
);
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName;

type ScrollBarPublicProps = React.HTMLAttributes<HTMLDivElement> & {
  orientation?: "vertical" | "horizontal";
  forceMount?: true;
};

const ScrollBar = React.forwardRef<HTMLDivElement, ScrollBarPublicProps>(
  ({ className, orientation = "vertical", ...props }, ref) => (
    <ScrollAreaPrimitive.ScrollAreaScrollbar
      ref={ref}
      orientation={orientation}
      className={cn(
        "flex touch-none select-none transition-colors",
        orientation === "vertical" && "h-full w-2.5 border-l border-l-transparent p-[1px]",
        orientation === "horizontal" && "h-2.5 flex-col border-t border-t-transparent p-[1px]",
        className
      )}
      {...(props as any)}
    >
      <ScrollAreaThumb className="relative flex-1 rounded-full bg-border" />
    </ScrollAreaPrimitive.ScrollAreaScrollbar>
  )
);
ScrollBar.displayName = ScrollAreaPrimitive.ScrollAreaScrollbar.displayName;

export { ScrollArea, ScrollBar };
