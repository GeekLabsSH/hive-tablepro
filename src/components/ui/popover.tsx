import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { cn } from "../../lib/utils";

const Popover = PopoverPrimitive.Root;

/** Tipos só com `React` deste ficheiro — evita cruzar `.d.ts` do Radix com outra resolução de `react` no Next. */
type PopoverTriggerPublicProps = React.PropsWithChildren<
  React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }
>;

const PopoverTrigger = React.forwardRef<HTMLButtonElement, PopoverTriggerPublicProps>((props, ref) => (
  <PopoverPrimitive.Trigger ref={ref} {...(props as any)} />
));
PopoverTrigger.displayName = PopoverPrimitive.Trigger.displayName;

type PopoverAnchorPublicProps = React.PropsWithChildren<
  React.HTMLAttributes<HTMLDivElement> & { asChild?: boolean }
>;

const PopoverAnchor = React.forwardRef<HTMLDivElement, PopoverAnchorPublicProps>((props, ref) => (
  <PopoverPrimitive.Anchor ref={ref} {...(props as any)} />
));
PopoverAnchor.displayName = PopoverPrimitive.Anchor.displayName;

type PopoverContentPublicProps = React.PropsWithChildren<
  Omit<React.HTMLAttributes<HTMLDivElement>, "align"> & {
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
    onOpenAutoFocus?: (e: Event) => void;
    onCloseAutoFocus?: (e: Event) => void;
    onEscapeKeyDown?: (e: Event) => void;
    onPointerDownOutside?: (e: Event) => void;
    onFocusOutside?: (e: Event) => void;
    onInteractOutside?: (e: Event) => void;
  }
>;

const PopoverContent = React.forwardRef<HTMLDivElement, PopoverContentPublicProps>(
  ({ className, align = "center", sideOffset = 4, ...props }, ref) => (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        ref={ref}
        {...({
          align,
          sideOffset,
          className: cn(
            "z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
            className
          ),
          ...props
        } as any)}
      />
    </PopoverPrimitive.Portal>
  )
);
PopoverContent.displayName = PopoverPrimitive.Content.displayName;

export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor };
