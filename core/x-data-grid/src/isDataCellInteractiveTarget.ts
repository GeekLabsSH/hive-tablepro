/** `MouseEvent.target` pode ser `Text` — sem `closest`. `3` = TEXT_NODE. */
function htmlEventTarget(target: EventTarget | null): HTMLElement | null {
  if (target == null) return null;
  const n = target as Node;
  if (typeof n.nodeType === "number" && n.nodeType === 3) return n.parentElement ?? null;
  if (typeof Element !== "undefined" && target instanceof Element) return target as HTMLElement;
  return null;
}

/** `true` se o alvo do evento for um controlo dentro da célula (não dispara `onCellClick` / double). */
export function isDataCellInteractiveTarget(target: EventTarget | null): boolean {
  const el = htmlEventTarget(target);
  if (!el?.closest) return false;
  return !!el.closest(
    "button, a, input, textarea, select, [role='checkbox'], [role='radio'], [role='combobox'], [role='searchbox'], [role='option'], [data-radix-collection-item], [data-radix-tooltip-trigger], [data-hive-edit-root], [data-hive-actions-cell]"
  );
}
