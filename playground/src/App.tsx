import * as React from "react";
import {
  Button,
  DataGrid,
  useGridApiRef,
  type GridColDef,
  type GridFooterSlotProps,
  type GridRowTransaction,
  type GridSortModel
} from "../../src/index";

type DemoRow = {
  id: number;
  nome: string;
  email: string;
  departamento: string;
  saldo: number;
  ativo: boolean;
  estado: "ok" | "warn" | "off";
};

function applyDemoRowTransaction(
  setRows: React.Dispatch<React.SetStateAction<DemoRow[]>>,
  t: GridRowTransaction<DemoRow>
) {
  setRows((prev) => {
    let next = [...prev];
    if (t.remove?.length) {
      const rm = new Set(t.remove.map(String));
      next = next.filter((r) => !rm.has(String(r.id)));
    }
    if (t.update?.length) {
      next = next.map((row) => {
        const patch = t.update!.find((u) => String(u.id) === String(row.id));
        if (!patch) return row;
        const { id: _id, ...rest } = patch;
        return { ...row, ...rest };
      });
    }
    if (t.add?.length) {
      next = [...next, ...t.add];
    }
    return next;
  });
}

function DemoFooter({ api }: GridFooterSlotProps<DemoRow>) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-muted-foreground">Slot de rodapé (exemplo)</span>
      <Button type="button" size="sm" variant="outline" onClick={() => api.exportDataAsCsv()}>
        Exportar CSV
      </Button>
      <Button type="button" size="sm" variant="outline" onClick={() => api.exportDataAsPrint({ title: "DataGrid — demo" })}>
        Imprimir
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => api.updateRows([{ id: 1, nome: "Nome via api.updateRows()" }])}
      >
        updateRows (id 1)
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => {
          const nid = Date.now();
          api.applyTransaction({
            remove: [2],
            update: [{ id: 3, departamento: "RH" }],
            add: [
              {
                id: nid,
                nome: `Nova (${nid % 10000})`,
                email: `nova-${nid}@exemplo.test`,
                departamento: "Engenharia",
                saldo: 0,
                ativo: true,
                estado: "ok"
              }
            ]
          });
        }}
      >
        applyTransaction
      </Button>
    </div>
  );
}

function gerarLinhas(count: number): DemoRow[] {
  const deps = ["Engenharia", "Vendas", "Suporte", "RH", "Financeiro"];
  return Array.from({ length: count }, (_, i) => {
    const n = i + 1;
    const estados = ["ok", "warn", "off"] as const;
    return {
      id: n,
      nome: `Utilizador ${n}`,
      email: `user${n}@exemplo.test`,
      departamento: deps[i % deps.length]!,
      saldo: Math.round((Math.random() * 5000 + 100) * 100) / 100,
      ativo: i % 7 !== 0,
      estado: estados[i % 3]!
    };
  });
}

const colunas: GridColDef<DemoRow>[] = [
  { field: "id", headerName: "ID", width: 72 },
  { field: "nome", headerName: "Nome", flex: 1, minWidth: 160 },
  { field: "email", headerName: "Email", flex: 1, minWidth: 200 },
  { field: "departamento", headerName: "Departamento", width: 140 },
  {
    field: "saldo",
    headerName: "Saldo (€)",
    width: 120,
    align: "right",
    headerAlign: "right",
    description: "Valor contabilístico fictício para demonstração do tooltip no cabeçalho.",
    valueFormatter: (p) =>
      typeof p.value === "number"
        ? p.value.toLocaleString("pt-PT", { minimumFractionDigits: 2 })
        : ""
  },
  {
    field: "ativo",
    headerName: "Ativo",
    width: 90,
    align: "center",
    type: "boolean",
    valueFormatter: (p) => (p.value ? "Sim" : "Não")
  },
  {
    field: "estado",
    headerName: "Estado",
    width: 100,
    align: "center",
    editable: true,
    type: "singleSelect",
    headerClassName: "text-primary",
    valueOptions: [
      { value: "ok", label: "OK" },
      { value: "warn", label: "Aviso" },
      { value: "off", label: "Inativo" }
    ],
    cellClassName: (p) =>
      p.value === "warn"
        ? "bg-amber-100 dark:bg-amber-950/40"
        : p.value === "off"
          ? "text-muted-foreground"
          : ""
  }
];

export function App() {
  const apiRef = useGridApiRef<DemoRow>();
  const [rows, setRows] = React.useState(() => gerarLinhas(120));
  const [sortModel, setSortModel] = React.useState<GridSortModel>([
    { field: "id", sort: "asc" }
  ]);
  const [quickFilter, setQuickFilter] = React.useState("");
  const [dark, setDark] = React.useState(false);
  React.useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  return (
    <div className="mx-auto max-w-6xl p-6">
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">DataGrid — demo local</h1>
        <p className="text-sm text-muted-foreground">
          Dados fictícios: ordenação, filtro rápido, paginação, seleção;{" "}
          <code className="rounded bg-muted px-1">autoHeight</code> (altura segue as linhas da página); na
          coluna Estado, duplo clique para editar (<code className="rounded bg-muted px-1">editable</code>{" "}
          + <code className="rounded bg-muted px-1">processRowUpdate</code>).
        </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => setDark((d) => !d)}>
          {dark ? "Tema claro" : "Tema escuro"}
        </Button>
      </header>

      <div className="rounded-lg border bg-card p-4 shadow-sm">
        <DataGrid<DemoRow>
          rows={rows}
          columns={colunas}
          getRowId={(r) => r.id}
          getRowAriaLabel={({ row }) => `Linha ${row.id}, ${row.nome}`}
          apiRef={apiRef}
          checkboxSelection
          disableRowSelectionOnClick={false}
          pagination
          pageSizeOptions={[5, 10, 25, 50]}
          sortModel={sortModel}
          onSortModelChange={setSortModel}
          quickFilterValue={quickFilter}
          onQuickFilterValueChange={setQuickFilter}
          processRowUpdate={(newRow) => {
            setRows((prev) => prev.map((r) => (r.id === newRow.id ? newRow : r)));
            return newRow;
          }}
          onRowsChange={(updates) => applyDemoRowTransaction(setRows, { update: updates })}
          onRowTransaction={(tx) => applyDemoRowTransaction(setRows, tx)}
          autoHeight
          slots={{ footer: DemoFooter }}
        />
      </div>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        Executar com <code className="rounded bg-muted px-1 py-0.5">npm run dev</code>
      </p>
    </div>
  );
}
