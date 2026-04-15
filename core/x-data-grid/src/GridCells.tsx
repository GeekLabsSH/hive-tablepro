import * as React from "react";
import { Input } from "../../../src/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../../src/components/ui/tooltip";
import { cn } from "../../../src/lib/utils";
import { useGridRootContext } from "./GridRootContext";
import type { GridRenderEditCellParams, GridValidRowModel } from "./types";

function wrapRichTooltip(node: React.ReactElement, tooltip: React.ReactNode | undefined): React.ReactNode {
  if (tooltip == null || typeof tooltip === "string" || typeof tooltip === "number") {
    return node;
  }
  return (
    <Tooltip>
      <TooltipTrigger asChild>{node}</TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  );
}

/** Célula de edição por defeito (input texto), compatível com MUI `GridEditInputCell`. */
export function GridEditInputCell<R extends GridValidRowModel = GridValidRowModel, V = unknown>(
  params: GridRenderEditCellParams<R, V>
) {
  const { id, field, value, api, hasFocus, colDef, commit, cancel } = params;
  const gridRoot = useGridRootContext();
  const density = gridRoot?.density ?? "standard";
  const isCompact = density === "compact";
  const isComfortable = density === "comfortable";
  const [local, setLocal] = React.useState(() => (value == null ? "" : String(value)));

  React.useEffect(() => {
    setLocal(value == null ? "" : String(value));
  }, [value, id, field]);

  return (
    <Input
      className={cn(
        "!block !h-full !min-h-0 !max-h-full !py-0 !text-foreground placeholder:text-muted-foreground",
        isCompact && "!px-1 text-[11px] leading-none",
        isComfortable && "px-2.5 text-base leading-snug",
        !isCompact && !isComfortable && "px-2 text-sm leading-tight",
        typeof colDef.cellClassName === "string" ? colDef.cellClassName : undefined
      )}
      value={local}
      autoFocus={hasFocus}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={() => commit(local as unknown as V)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          commit(local as unknown as V);
        }
        if (e.key === "Escape") {
          e.preventDefault();
          cancel();
        }
      }}
      aria-label={api.getColumn(field)?.headerName ?? colDef.headerName ?? field}
    />
  );
}

export interface GridActionsCellItemProps {
  /** Compat. MUI / testes: `id` no elemento nativo. */
  id?: string;
  icon?: React.ReactNode;
  label?: React.ReactNode;
  onClick?: (event: React.MouseEvent<HTMLElement>) => void;
  showInMenu?: boolean;
  /** Se true, mostra divisor antes do item (menu). */
  divider?: boolean;
  disabled?: boolean;
  className?: string;
  /** Compat: cor MUI — mapeada de forma aproximada. */
  color?: "inherit" | "default" | "primary" | "secondary" | "error";
  /** Compat MUI: tooltip Rico ou `title` em string. */
  tooltip?: React.ReactNode;
}

/** Item de ações (ícone + etiqueta); fora de menu usa botão, em menu usa estilo de linha de menu. */
export function GridActionsCellItem({
  id,
  icon,
  label,
  onClick,
  showInMenu,
  divider,
  disabled,
  className,
  color,
  tooltip
}: GridActionsCellItemProps) {
  const gridRoot = useGridRootContext();
  const compact = gridRoot?.density === "compact";

  if (showInMenu) {
    const menuBtn = (
      <button
        type="button"
        id={id}
        title={tooltip != null && typeof tooltip === "string" ? tooltip : undefined}
        disabled={disabled}
        className={cn(
          "relative flex w-full cursor-default select-none items-center text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
          color === "error" && "text-destructive",
          className
        )}
        onClick={onClick}
      >
        {icon ? <span className="mr-2 flex shrink-0">{icon}</span> : null}
        <span>{label}</span>
      </button>
    );
    return (
      <>
        {divider ? <div role="separator" className="my-1 h-px bg-border" /> : null}
        {wrapRichTooltip(menuBtn, tooltip)}
      </>
    );
  }
  const titleAttr =
    tooltip != null
      ? typeof tooltip === "string" || typeof tooltip === "number"
        ? String(tooltip)
        : undefined
      : typeof label === "string"
        ? label
        : undefined;

  const iconBtn = (
    <button
      type="button"
      id={id}
      title={titleAttr}
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center rounded-md text-sm font-normal transition-colors hover:bg-accent/90 hover:text-accent-foreground",
        compact ? "h-[15px] w-[15px] min-h-0 min-w-0 p-0" : "h-8 w-8",
        color === "error" && "text-destructive",
        className
      )}
      onClick={onClick}
    >
      <span className="inline-flex shrink-0 items-center justify-center [&_svg]:h-3 [&_svg]:w-3">
        {icon ?? label}
      </span>
    </button>
  );
  return wrapRichTooltip(iconBtn, tooltip);
}

GridActionsCellItem.displayName = "GridActionsCellItem";
