import * as React from "react";
import { Checkbox as RadixCheckbox } from "../../../src/components/ui/checkbox";
import { cn } from "../../../src/lib/utils";

type RadixProps = React.ComponentProps<typeof RadixCheckbox>;

export interface CheckboxProps extends Omit<RadixProps, "checked" | "onCheckedChange" | "onChange"> {
  checked?: boolean | "indeterminate";
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
}

export const Checkbox = React.forwardRef<HTMLButtonElement, CheckboxProps>(function Checkbox(
  { className, checked, onChange, ...props },
  ref
) {
  return (
    <RadixCheckbox
      ref={ref}
      checked={checked === "indeterminate" ? "indeterminate" : !!checked}
      onCheckedChange={(v) => {
        onChange?.({
          target: { checked: v === true }
        } as React.ChangeEvent<HTMLInputElement>);
      }}
      className={cn(className)}
      {...props}
    />
  );
});

Checkbox.displayName = "Checkbox";
