import * as React from "react";
import { Input } from "../../../src/components/ui/input";
import { cn } from "../../../src/lib/utils";
import { FormControl } from "./Form";
import { FormHelperText } from "./Form";
import { InputLabel } from "./Form";

export interface TextFieldProps extends Omit<React.ComponentProps<typeof Input>, "size"> {
  label?: React.ReactNode;
  helperText?: React.ReactNode;
  error?: boolean;
  fullWidth?: boolean;
  multiline?: boolean;
  rows?: number;
  InputProps?: {
    startAdornment?: React.ReactNode;
    endAdornment?: React.ReactNode;
    className?: string;
  };
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
  InputLabelProps?: React.ComponentProps<typeof InputLabel>;
  FormHelperTextProps?: React.ComponentProps<typeof FormHelperText>;
}

export const TextField = React.forwardRef<HTMLInputElement | HTMLTextAreaElement, TextFieldProps>(
  function TextField(
    {
      label,
      helperText,
      error,
      fullWidth,
      multiline,
      rows = 3,
      className,
      InputProps,
      inputProps,
      InputLabelProps,
      FormHelperTextProps,
      id,
      ...props
    },
    ref
  ) {
    const inputId = id ?? React.useId();
    const start = InputProps?.startAdornment;
    const end = InputProps?.endAdornment;

    const field = multiline ? (
      <textarea
        id={inputId}
        ref={ref as React.Ref<HTMLTextAreaElement>}
        rows={rows}
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          InputProps?.className,
          className
        )}
        {...(inputProps as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
        {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
      />
    ) : (
      <div className={cn("relative flex items-center", fullWidth && "w-full")}>
        {start ? <span className="pointer-events-none absolute left-3 flex text-muted-foreground">{start}</span> : null}
        <Input
          id={inputId}
          ref={ref as React.Ref<HTMLInputElement>}
          className={cn(start && "pl-10", end && "pr-10", InputProps?.className, className)}
          {...inputProps}
          {...props}
        />
        {end ? <span className="pointer-events-none absolute right-3 flex text-muted-foreground">{end}</span> : null}
      </div>
    );

    return (
      <FormControl className={cn(fullWidth && "w-full")}>
        {label != null ? (
          <InputLabel htmlFor={inputId} error={error} {...InputLabelProps}>
            {label}
          </InputLabel>
        ) : null}
        {field}
        {helperText != null ? (
          <FormHelperText error={error} {...FormHelperTextProps}>
            {helperText}
          </FormHelperText>
        ) : null}
      </FormControl>
    );
  }
);

TextField.displayName = "TextField";
