import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "../../lib/utils";

type TooltipProviderPublicProps = {
  children: React.ReactNode;
  delayDuration?: number;
  skipDelayDuration?: number;
  disableHoverableContent?: boolean;
};

const TooltipProvider = ({ children, ...props }: TooltipProviderPublicProps) => (
  <TooltipPrimitive.Provider {...(props as any)}>{children}</TooltipPrimitive.Provider>
);

const Tooltip = TooltipPrimitive.Root;

type TooltipTriggerPublicProps = React.PropsWithChildren<
  React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }
>;

const TooltipTrigger = React.forwardRef<HTMLButtonElement, TooltipTriggerPublicProps>((props, ref) => (
  <TooltipPrimitive.Trigger ref={ref} {...(props as any)} />
));
TooltipTrigger.displayName = TooltipPrimitive.Trigger.displayName;

type TooltipContentPublicProps = React.PropsWithChildren<
  Omit<React.HTMLAttributes<HTMLDivElement>, "align"> & {
    "aria-label"?: string;
    align?: "start" | "center" | "end";
    side?: "top" | "right" | "bottom" | "left";
    sideOffset?: number;
    alignOffset?: number;
    collisionPadding?: number | Partial<Record<"top" | "right" | "bottom" | "left", number>>;
    avoidCollisions?: boolean;
    sticky?: "partial" | "always";
    hideWhenDetached?: boolean;
    arrowPadding?: number;
    forceMount?: true;
    onEscapeKeyDown?: (e: Event) => void;
    onPointerDownOutside?: (e: Event) => void;
  }
>;

const TooltipContent = React.forwardRef<HTMLDivElement, TooltipContentPublicProps>(
  ({ className, sideOffset = 4, ...props }, ref) => (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        ref={ref}
        {...({
          sideOffset,
          className: cn(
            "z-[10050] overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
            className
          ),
          ...props
        } as any)}
      />
    </TooltipPrimitive.Portal>
  )
);
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
