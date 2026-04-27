/**
 * Converte valores de célula (número, string formatada PT/US/CH) para número finito.
 * Suporta exemplos: `1.400,00`, `1'400,00`, `1,400.00`, `(1.234,56)`, `1 234,56`.
 */
export function parseFlexibleNumber(input: unknown): number {
  if (typeof input === "number") return Number.isFinite(input) ? input : NaN;
  if (input == null || input === "") return NaN;
  if (typeof input === "boolean") return input ? 1 : 0;
  if (typeof input !== "string") {
    const n = Number(input as never);
    return Number.isFinite(n) ? n : NaN;
  }

  let s = input.trim().replace(/\u00a0/g, "");
  if (!s) return NaN;

  let neg = false;
  if (s.endsWith("-") || s.endsWith("−")) {
    neg = true;
    s = s.slice(0, -1).trim();
  }
  if (s.startsWith("(") && s.endsWith(")")) {
    neg = true;
    s = s.slice(1, -1).trim();
  }
  if (s.startsWith("-") || s.startsWith("−")) {
    neg = true;
    s = s.slice(1).trim();
  }

  s = s.replace(/'/g, "");

  const core = s.replace(/[^\d.,-]/g, "").replace(/-/g, "");
  if (!core) return NaN;

  const lastComma = core.lastIndexOf(",");
  const lastDot = core.lastIndexOf(".");

  let normalized: string;

  if (lastComma >= 0 && lastDot >= 0) {
    if (lastComma > lastDot) {
      normalized = core.replace(/\./g, "").replace(",", ".");
    } else {
      normalized = core.replace(/,/g, "");
    }
  } else if (lastComma >= 0) {
    const parts = core.split(",");
    if (parts.length === 2 && parts[1]!.length <= 2 && /^\d+$/.test(parts[1]!)) {
      const intPart = parts[0]!.replace(/\./g, "");
      normalized = `${intPart}.${parts[1]}`;
    } else {
      normalized = core.replace(/,/g, "");
    }
  } else if (lastDot >= 0) {
    const parts = core.split(".");
    const last = parts[parts.length - 1]!;
    if (parts.length >= 2 && last.length <= 2 && /^\d+$/.test(last) && parts.slice(0, -1).every((p) => /^\d+$/.test(p))) {
      normalized = `${parts.slice(0, -1).join("")}.${last}`;
    } else if (parts.length >= 2 && parts.slice(1).every((p) => p.length === 3) && /^\d+$/.test(parts[0]!)) {
      normalized = parts.join("");
    } else if (parts.length === 2 && parts[1]!.length === 3 && /^\d+$/.test(parts[0]!) && /^\d+$/.test(parts[1]!)) {
      normalized = `${parts[0]}${parts[1]}`;
    } else {
      normalized = core;
    }
  } else {
    normalized = core;
  }

  const n = Number(normalized);
  if (!Number.isFinite(n)) return NaN;
  return neg ? -n : n;
}
