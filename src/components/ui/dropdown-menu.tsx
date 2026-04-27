import * as React from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { CheckIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { cn } from "../../lib/utils";

type DropdownMenuRootPublicProps = {
  children?: React.ReactNode;
  dir?: "ltr" | "rtl";
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  modal?: boolean;
};

const DropdownMenu: React.FC<DropdownMenuRootPublicProps> = (props) => (
  <DropdownMenuPrimitive.Root {...(props as any)} />
);

type DropdownMenuTriggerPublicProps = React.PropsWithChildren<
  React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }
>;

const DropdownMenuTrigger = React.forwardRef<HTMLButtonElement, DropdownMenuTriggerPublicProps>((props, ref) => (
  <DropdownMenuPrimitive.Trigger ref={ref} {...(props as any)} />
));
DropdownMenuTrigger.displayName = DropdownMenuPrimitive.Trigger.displayName;

const DropdownMenuGroup = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>((props, ref) => (
  <DropdownMenuPrimitive.Group ref={ref} {...(props as any)} />
));
DropdownMenuGroup.displayName = DropdownMenuPrimitive.Group.displayName;

type DropdownMenuPortalPublicProps = {
  children?: React.ReactNode;
  container?: HTMLElement | null;
};

const DropdownMenuPortal: React.FC<DropdownMenuPortalPublicProps> = (props) => (
  <DropdownMenuPrimitive.Portal {...(props as any)} />
);

type DropdownMenuSubPublicProps = {
  children?: React.ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
};

const DropdownMenuSub: React.FC<DropdownMenuSubPublicProps> = (props) => <DropdownMenuPrimitive.Sub {...(props as any)} />;

type DropdownMenuRadioGroupPublicProps = React.PropsWithChildren<{
  value?: string;
  onValueChange?: (value: string) => void;
}>;

const DropdownMenuRadioGroup = React.forwardRef<HTMLDivElement, DropdownMenuRadioGroupPublicProps>((props, ref) => (
  <DropdownMenuPrimitive.RadioGroup ref={ref} {...(props as any)} />
));
DropdownMenuRadioGroup.displayName = DropdownMenuPrimitive.RadioGroup.displayName;

type DropdownMenuSubTriggerPublicProps = React.PropsWithChildren<
  React.HTMLAttributes<HTMLDivElement> & { inset?: boolean }
>;

const DropdownMenuSubTrigger = React.forwardRef<HTMLDivElement, DropdownMenuSubTriggerPublicProps>(
  ({ className, inset, children, ...props }, ref) => (
    <DropdownMenuPrimitive.SubTrigger
      ref={ref}
      className={cn(
        "flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent data-[state=open]:bg-accent [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
        inset && "pl-8",
        className
      )}
      {...(props as any)}
    >
      {children}
      <ChevronRightIcon className="ml-auto h-4 w-4" />
    </DropdownMenuPrimitive.SubTrigger>
  )
);
DropdownMenuSubTrigger.displayName = DropdownMenuPrimitive.SubTrigger.displayName;

type DropdownMenuSubContentPublicProps = React.PropsWithChildren<
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

const DropdownMenuSubContent = React.forwardRef<HTMLDivElement, DropdownMenuSubContentPublicProps>(
  ({ className, onWheel, ...props }, ref) => (
    <DropdownMenuPrimitive.SubContent
      ref={ref}
      onWheel={(e) => {
        e.stopPropagation();
        (onWheel as React.WheelEventHandler<HTMLDivElement> | undefined)?.(e);
      }}
      className={cn(
        "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className
      )}
      {...(props as any)}
    />
  )
);
DropdownMenuSubContent.displayName = DropdownMenuPrimitive.SubContent.displayName;

type DropdownMenuContentPublicProps = React.PropsWithChildren<
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

const DropdownMenuContent = React.forwardRef<HTMLDivElement, DropdownMenuContentPublicProps>(
  ({ className, sideOffset = 4, onWheel, ...props }, ref) => (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        onWheel={(e) => {
          // Evita que a roda do rato faça scroll do contentor por trás (ex.: Dialog) em vez da lista do menu.
          e.stopPropagation();
          (onWheel as React.WheelEventHandler<HTMLDivElement> | undefined)?.(e);
        }}
        className={cn(
          "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
          className
        )}
        {...(props as any)}
      />
    </DropdownMenuPrimitive.Portal>
  )
);
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName;

type DropdownMenuItemPublicProps = React.PropsWithChildren<
  React.HTMLAttributes<HTMLDivElement> & {
    disabled?: boolean;
    textValue?: string;
    onSelect?: (event: Event) => void;
    inset?: boolean;
  }
>;

const DropdownMenuItem = React.forwardRef<HTMLDivElement, DropdownMenuItemPublicProps>(
  ({ className, inset, ...props }, ref) => (
    <DropdownMenuPrimitive.Item
      ref={ref}
      className={cn(
        "relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
        inset && "pl-8",
        className
      )}
      {...(props as any)}
    />
  )
);
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName;

type DropdownMenuCheckboxItemPublicProps = React.PropsWithChildren<
  React.HTMLAttributes<HTMLDivElement> & {
    checked?: boolean | "indeterminate";
    onCheckedChange?: (checked: boolean) => void;
    disabled?: boolean;
    textValue?: string;
  }
>;

const DropdownMenuCheckboxItem = React.forwardRef<HTMLDivElement, DropdownMenuCheckboxItemPublicProps>(
  ({ className, children, checked, ...props }, ref) => (
    <DropdownMenuPrimitive.CheckboxItem
      ref={ref}
      className={cn(
        "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      )}
      checked={checked}
      {...(props as any)}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <CheckIcon className="h-4 w-4" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.CheckboxItem>
  )
);
DropdownMenuCheckboxItem.displayName = DropdownMenuPrimitive.CheckboxItem.displayName;

type DropdownMenuRadioItemPublicProps = React.PropsWithChildren<
  React.HTMLAttributes<HTMLDivElement> & {
    value: string;
    disabled?: boolean;
    textValue?: string;
  }
>;

const DropdownMenuRadioItem = React.forwardRef<HTMLDivElement, DropdownMenuRadioItemPublicProps>(
  ({ className, children, ...props }, ref) => (
    <DropdownMenuPrimitive.RadioItem
      ref={ref}
      className={cn(
        "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      )}
      {...(props as any)}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <span className="h-2 w-2 rounded-full bg-current" aria-hidden />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.RadioItem>
  )
);
DropdownMenuRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName;

type DropdownMenuLabelPublicProps = React.HTMLAttributes<HTMLDivElement> & { inset?: boolean };

const DropdownMenuLabel = React.forwardRef<HTMLDivElement, DropdownMenuLabelPublicProps>(
  ({ className, inset, ...props }, ref) => (
    <DropdownMenuPrimitive.Label
      ref={ref}
      className={cn("px-2 py-1.5 text-sm font-semibold", inset && "pl-8", className)}
      {...(props as any)}
    />
  )
);
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName;

const DropdownMenuSeparator = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <DropdownMenuPrimitive.Separator ref={ref} className={cn("-mx-1 my-1 h-px bg-muted", className)} {...(props as any)} />
  )
);
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName;

const DropdownMenuShortcut = ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => {
  return <span className={cn("ml-auto text-xs tracking-widest opacity-60", className)} {...(props as any)} />;
};
DropdownMenuShortcut.displayName = "DropdownMenuShortcut";

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup
};
