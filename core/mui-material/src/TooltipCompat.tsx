import * as React from "react";
import {
  Tooltip as ShTooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "../../../src/components/ui/tooltip";

const sideMap = {
  top: "top" as const,
  bottom: "bottom" as const,
  left: "left" as const,
  right: "right" as const
};

export interface TooltipProps {
  title: React.ReactNode;
  children: React.ReactElement;
  placement?: keyof typeof sideMap;
  open?: boolean;
}

export function Tooltip({ title, children, placement = "top", open }: TooltipProps) {
  return (
    <TooltipProvider>
      <ShTooltip open={open}>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent side={sideMap[placement]}>{title}</TooltipContent>
      </ShTooltip>
    </TooltipProvider>
  );
}

Tooltip.displayName = "Tooltip";
