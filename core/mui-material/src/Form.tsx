import * as React from "react";
import { cn } from "../../../src/lib/utils";

export const FormControl = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  function FormControl({ className, ...props }, ref) {
    return <div ref={ref} className={cn("grid w-full gap-2", className)} {...props} />;
  }
);
FormControl.displayName = "FormControl";

export const InputLabel = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement> & { shrink?: boolean; error?: boolean; required?: boolean }
>(function InputLabel({ className, shrink: _shrink, error, required, children, ...props }, ref) {
  return (
    <label
      ref={ref}
      className={cn(
        "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
        error && "text-destructive",
        className
      )}
      {...props}
    >
      {children}
      {required ? <span className="text-destructive"> *</span> : null}
    </label>
  );
});
InputLabel.displayName = "InputLabel";

export const FormHelperText = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement> & { error?: boolean }
>(function FormHelperText({ className, error, ...props }, ref) {
  return (
    <p
      ref={ref}
      className={cn("text-sm text-muted-foreground", error && "text-destructive", className)}
      {...props}
    />
  );
});
FormHelperText.displayName = "FormHelperText";

export interface FormControlLabelProps extends React.HTMLAttributes<HTMLLabelElement> {
  control: React.ReactElement;
  label: React.ReactNode;
  disabled?: boolean;
}

export const FormControlLabel = React.forwardRef<HTMLLabelElement, FormControlLabelProps>(
  function FormControlLabel({ className, control, label, disabled, ...props }, ref) {
    return (
      <label
        ref={ref}
        className={cn("flex items-center gap-2", disabled && "cursor-not-allowed opacity-70", className)}
        {...props}
      >
        {control}
        <span className="text-sm">{label}</span>
      </label>
    );
  }
);
FormControlLabel.displayName = "FormControlLabel";
