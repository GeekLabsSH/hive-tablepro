import * as React from "react";
import { EllipsisVerticalIcon } from "@heroicons/react/24/outline";
import { Button } from "../../../src/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger
} from "../../../src/components/ui/dropdown-menu";
import { cn } from "../../../src/lib/utils";
import { useGridRootContext } from "./GridRootContext";
import type { GridAlignment } from "./types";

function actionsJustifyClass(align: GridAlignment | undefined): string {
  if (align === "left") return "justify-start";
  if (align === "right") return "justify-end";
  return "justify-center";
}

function GridActionsCellLayout({
  align,
  inline,
  menu
}: {
  align?: GridAlignment;
  inline: React.ReactNode[];
  menu: React.ReactNode[];
}) {
  const ctx = useGridRootContext();
  const compact = ctx?.density === "compact";

  return (
    <div
      className={cn(
        "flex h-full w-full min-h-0 min-w-0 items-center gap-0.5 pr-1",
        actionsJustifyClass(align)
      )}
      data-hive-actions-cell=""
    >
      {inline}
      {menu.length > 0 ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn(
                "shrink-0 rounded-sm p-0 hover:bg-accent/90",
                compact ? "h-[15px] w-[15px] min-h-0 min-w-0" : "h-8 w-8"
              )}
              aria-label="Mais ações"
              onPointerDown={(e) => e.stopPropagation()}
            >
              <EllipsisVerticalIcon
                className="h-3 w-3 shrink-0 text-foreground/55 hover:text-foreground"
                aria-hidden
              />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[8rem]" onCloseAutoFocus={(e) => e.preventDefault()}>
            <div className="flex flex-col py-1">{menu}</div>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
    </div>
  );
}

/**
 * Renderiza o resultado de `getActions` (MUI X): ícones em linha + itens `showInMenu` num menu ⋮.
 * O alinhamento horizontal segue `colDef.align` (predefinição: centro).
 */
export function renderGridActionsFromNodes(
  nodes: React.ReactNode,
  align?: GridAlignment
): React.ReactNode {
  const flat = React.Children.toArray(nodes).flat();
  const inline: React.ReactNode[] = [];
  const menu: React.ReactNode[] = [];
  for (const child of flat) {
    if (child == null) continue;
    if (React.isValidElement(child)) {
      const p = child.props as { showInMenu?: boolean };
      if (p.showInMenu) menu.push(child);
      else inline.push(child);
    } else {
      inline.push(child);
    }
  }

  return <GridActionsCellLayout align={align} inline={inline} menu={menu} />;
}
