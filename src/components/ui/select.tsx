import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";
import { cn } from "../../lib/utils";

const Select = SelectPrimitive.Root;
const SelectGroup = SelectPrimitive.Group;
type SelectValuePublicProps = React.HTMLAttributes<HTMLSpanElement> & {
  placeholder?: React.ReactNode;
};

const SelectValue = React.forwardRef<HTMLSpanElement, SelectValuePublicProps>((props, ref) => (
  <SelectPrimitive.Value ref={ref} {...(props as any)} />
));
SelectValue.displayName = SelectPrimitive.Value.displayName;

const SelectIcon = SelectPrimitive.Icon as unknown as React.FC<
  React.HTMLAttributes<HTMLSpanElement> & { asChild?: boolean; children?: React.ReactNode }
>;

const SelectViewport = SelectPrimitive.Viewport as unknown as React.FC<
  React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }
>;

/** Evita cruzar `SelectTriggerProps` do Radix (outra resolução de `react`) com o JSX do app. */
type SelectTriggerPublicProps = React.PropsWithChildren<
  React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }
>;

const SelectTrigger = React.forwardRef<HTMLButtonElement, SelectTriggerPublicProps>(
  ({ className, children, ...props }, ref) => (
    <SelectPrimitive.Trigger
      ref={ref}
      className={cn(
        "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
        className
      )}
      {...(props as any)}
    >
      {children}
      <SelectIcon asChild>
        <ChevronDownIcon className="h-4 w-4 opacity-50" />
      </SelectIcon>
    </SelectPrimitive.Trigger>
  )
);
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

type SelectScrollButtonPublicProps = React.HTMLAttributes<HTMLDivElement>;

const SelectScrollUpButton = React.forwardRef<HTMLDivElement, SelectScrollButtonPublicProps>(
  ({ className, ...props }, ref) => (
    <SelectPrimitive.ScrollUpButton
      ref={ref}
      className={cn("flex cursor-default items-center justify-center py-1", className)}
      {...(props as any)}
    >
      <ChevronUpIcon className="h-4 w-4" />
    </SelectPrimitive.ScrollUpButton>
  )
);
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName;

const SelectScrollDownButton = React.forwardRef<HTMLDivElement, SelectScrollButtonPublicProps>(
  ({ className, ...props }, ref) => (
    <SelectPrimitive.ScrollDownButton
      ref={ref}
      className={cn("flex cursor-default items-center justify-center py-1", className)}
      {...(props as any)}
    >
      <ChevronDownIcon className="h-4 w-4" />
    </SelectPrimitive.ScrollDownButton>
  )
);
SelectScrollDownButton.displayName = SelectPrimitive.ScrollDownButton.displayName;

type SelectContentPublicProps = React.PropsWithChildren<
  React.HTMLAttributes<HTMLDivElement> & {
    position?: "item-aligned" | "popper";
  }
>;

const SelectContent = React.forwardRef<HTMLDivElement, SelectContentPublicProps>(
  ({ className, children, position = "popper", ...props }, ref) => (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        ref={ref}
        className={cn(
          "relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
          position === "popper" &&
            "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
          className
        )}
        position={position}
        {...(props as any)}
      >
        <SelectScrollUpButton />
        <SelectViewport
          className={cn(
            "p-1",
            position === "popper" &&
              "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"
          )}
        >
          {children}
        </SelectViewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
);
SelectContent.displayName = SelectPrimitive.Content.displayName;

const SelectLabel = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <SelectPrimitive.Label ref={ref} className={cn("py-1.5 pl-8 pr-2 text-sm font-semibold", className)} {...(props as any)} />
  )
);
SelectLabel.displayName = SelectPrimitive.Label.displayName;

type SelectItemPublicProps = React.PropsWithChildren<
  React.HTMLAttributes<HTMLDivElement> & {
    value: string;
    disabled?: boolean;
    textValue?: string;
  }
>;

const SelectItem = React.forwardRef<HTMLDivElement, SelectItemPublicProps>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...(props as any)}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <CheckIcon className="h-4 w-4" />
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));
SelectItem.displayName = SelectPrimitive.Item.displayName;

const SelectSeparator = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <SelectPrimitive.Separator ref={ref} className={cn("-mx-1 my-1 h-px bg-muted", className)} {...(props as any)} />
  )
);
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton
};
