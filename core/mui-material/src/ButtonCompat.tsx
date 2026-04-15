import * as React from "react";
import { Button as ShadcnButton, type ButtonProps as ShadcnButtonProps } from "../../../src/components/ui/button";
import { cn } from "../../../src/lib/utils";

export type MuiButtonVariant = "contained" | "outlined" | "text" | ShadcnButtonProps["variant"];

export interface ButtonProps extends Omit<ShadcnButtonProps, "variant"> {
  variant?: MuiButtonVariant;
  /** MUI: primary | secondary | etc. — mapeado de forma aproximada */
  color?: "primary" | "secondary" | "error" | "inherit" | "success" | "info" | "warning";
}

function mapVariant(v?: MuiButtonVariant): ShadcnButtonProps["variant"] {
  if (v === "contained" || v === undefined) return "default";
  if (v === "outlined") return "outline";
  if (v === "text") return "ghost";
  return v as ShadcnButtonProps["variant"];
}

function mapColor(color?: ButtonProps["color"], base?: ShadcnButtonProps["variant"]): ShadcnButtonProps["variant"] {
  if (!color || color === "primary" || color === "inherit") return base ?? "default";
  if (color === "secondary") return "secondary";
  if (color === "error") return "destructive";
  return base ?? "default";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "contained", color, className, ...props },
  ref
) {
  const shad = mapColor(color, mapVariant(variant));
  return <ShadcnButton ref={ref} type="button" variant={shad} className={cn(className)} {...props} />;
});

Button.displayName = "Button";
