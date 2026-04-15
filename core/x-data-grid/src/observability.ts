/**
 * Observabilidade única para investigação no browser (resize, toolbar, selects, etc.).
 *
 * - Buffer: `window.__hiveTableproObserveLog` (máx. 2000 entradas)
 * - Exportar na consola: `copy(JSON.stringify(window.__hiveTableproObserveLog, null, 2))`
 *   ou `copy(window.__hiveTableproObserveExportNdjson?.() ?? "")` (NDJSON, uma linha por evento)
 * - Ingest Cursor (só builds não-produção): POST para o endpoint de sessão local
 * - Em Vitest não envia rede nem polui o buffer de forma relevante
 */

const MAX = 2000;
const INGEST =
  "http://127.0.0.1:7369/ingest/f0dc22d9-33ac-4959-8aff-7538a6a94abf";
const SESSION = "7fb25d";

export type HiveTableproObserveEntry = {
  t: number;
  category: string;
  message: string;
  data?: Record<string, unknown>;
};

function isVitest(): boolean {
  return (
    typeof process !== "undefined" &&
    process.env.VITEST !== undefined &&
    process.env.VITEST !== ""
  );
}

function attachExportHelpers(
  log: HiveTableproObserveEntry[]
): void {
  if (typeof window === "undefined") return;
  const w = window as unknown as {
    __hiveTableproObserveLog?: HiveTableproObserveEntry[];
    __hiveTableproObserveExportNdjson?: () => string;
  };
  w.__hiveTableproObserveExportNdjson = () =>
    log.map((e) => JSON.stringify(e)).join("\n");
}

/**
 * Regista um evento (toolbar, resize, select, paginação, etc.).
 */
export function hiveTableproObserve(
  category: string,
  message: string,
  data?: Record<string, unknown>
): void {
  if (isVitest()) return;
  if (typeof window === "undefined") return;
  const entry: HiveTableproObserveEntry = {
    t: Date.now(),
    category,
    message,
    data: data && Object.keys(data).length ? data : undefined
  };
  const w = window as unknown as {
    __hiveTableproObserveLog?: HiveTableproObserveEntry[];
  };
  w.__hiveTableproObserveLog ??= [];
  w.__hiveTableproObserveLog.push(entry);
  if (w.__hiveTableproObserveLog.length > MAX) {
    w.__hiveTableproObserveLog.splice(0, w.__hiveTableproObserveLog.length - MAX);
  }
  attachExportHelpers(w.__hiveTableproObserveLog);

  if (typeof process === "undefined" || process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console -- observabilidade explícita
    console.debug("[hive-tablepro:observe]", category, message, entry.data ?? {});
  }

  const body = JSON.stringify({
    sessionId: SESSION,
    location: `${category}:${message}`,
    message,
    data: entry.data ?? {},
    timestamp: entry.t,
    hypothesisId: category
  });

  const nodeNotProduction =
    typeof process === "undefined" || process.env.NODE_ENV !== "production";
  if (nodeNotProduction) {
    fetch(INGEST, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": SESSION
      },
      body
    }).catch(() => {
      if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
        navigator.sendBeacon(
          INGEST,
          new Blob([body], { type: "application/json" })
        );
      }
    });
  }

  try {
    const env =
      typeof import.meta !== "undefined"
        ? (import.meta as ImportMeta & { env?: Record<string, unknown> }).env
        : undefined;
    const nodeNotProd =
      typeof process !== "undefined" && process.env.NODE_ENV !== "production";
    const allowLocalIngest =
      nodeNotProd ||
      env?.DEV === true ||
      env?.MODE === "development" ||
      (window.location?.hostname &&
        /^(localhost|127\.0\.0\.1|\[::1\])$/i.test(window.location.hostname));
    if (allowLocalIngest && window.location?.origin) {
      for (const p of [
        "/__hive_tablepro_debug_ingest",
        "/api/hive-tablepro-debug-ingest"
      ]) {
        fetch(`${window.location.origin}${p}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
          keepalive: true
        }).catch(() => {});
      }
    }
  } catch {
    /* bundlers sem import.meta */
  }

  try {
    const k = "hive-tablepro-observe-ndjson";
    const prev = sessionStorage.getItem(k);
    const lines = prev ? prev.split("\n").filter(Boolean) : [];
    lines.push(body);
    sessionStorage.setItem(k, lines.slice(-120).join("\n"));
    (window as unknown as { __hiveTableproObserveNdjsonTail?: string }).__hiveTableproObserveNdjsonTail =
      lines.slice(-120).join("\n");
  } catch {
    /* privado / quota */
  }
}
