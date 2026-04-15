import * as React from "react";
import {
  Dialog as Root,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "../../../src/components/ui/dialog";

export type DialogCloseReason = "backdropClick" | "escapeKeyDown";

export interface DialogProps {
  open: boolean;
  onClose?: (event: unknown, reason: DialogCloseReason) => void;
  children?: React.ReactNode;
}

export function Dialog({ open, onClose, children }: DialogProps) {
  return (
    <Root
      open={open}
      onOpenChange={(next) => {
        if (!next && onClose) {
          onClose({}, "backdropClick");
        }
      }}
    >
      {children}
    </Root>
  );
}

export { DialogContent, DialogHeader, DialogTitle, DialogDescription };
export const DialogContentText = DialogDescription;
export const DialogActions = DialogFooter;
