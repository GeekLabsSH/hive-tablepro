import * as React from "react";
import { cn } from "../../../src/lib/utils";

export const List = React.forwardRef<HTMLUListElement, React.HTMLAttributes<HTMLUListElement>>(
  ({ className, ...props }, ref) => (
    <ul ref={ref} className={cn("m-0 list-none p-0", className)} {...props} />
  )
);
List.displayName = "List";

export const ListItem = React.forwardRef<
  HTMLLIElement,
  React.LiHTMLAttributes<HTMLLIElement> & { button?: boolean; disablePadding?: boolean }
>(function ListItem({ className, button, disablePadding, ...props }, ref) {
  return (
    <li
      ref={ref}
      className={cn(
        "flex items-start gap-2",
        !disablePadding && "px-4 py-2",
        button && "cursor-pointer rounded-md hover:bg-accent",
        className
      )}
      {...props}
    />
  );
});
ListItem.displayName = "ListItem";

export const ListItemText = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { primary?: React.ReactNode; secondary?: React.ReactNode }
>(function ListItemText({ className, primary, secondary, ...props }, ref) {
  return (
    <div ref={ref} className={cn("min-w-0 flex-1", className)} {...props}>
      {primary != null ? <div className="text-sm font-medium leading-none">{primary}</div> : null}
      {secondary != null ? <div className="mt-1 text-sm text-muted-foreground">{secondary}</div> : null}
    </div>
  );
});
ListItemText.displayName = "ListItemText";

export const ListItemIcon = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex shrink-0 text-muted-foreground", className)} {...props} />
  )
);
ListItemIcon.displayName = "ListItemIcon";

export const ListItemButton = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { selected?: boolean }
>(function ListItemButton({ className, selected, ...props }, ref) {
  return (
    <div
      ref={ref}
      role="button"
      tabIndex={0}
      className={cn(
        "flex cursor-pointer items-center gap-2 rounded-md px-4 py-2 hover:bg-accent",
        selected && "bg-accent",
        className
      )}
      {...props}
    />
  );
});
ListItemButton.displayName = "ListItemButton";
