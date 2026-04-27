# Pivot e gráficos (Hive Data Grid)

## Pivot (`pivoting`, `pivotModel`, `pivotActive`)

- `pivoting?: boolean` — liga o fluxo de dados pivotados.
- `pivotModel?: GridPivotModel` — `{ rows: string[], columns: string[], values: { field, aggFunc }[] }` (MVP: usa o primeiro campo de cada eixo e o primeiro valor).
- `pivotActive?: boolean` — quando `true` e o modelo está completo, a grelha mostra linhas/colunas derivadas (incompatível com `treeData`, agrupamento TanStack ou virtualização de colunas para a linha de filtros no cabeçalho).
- Agregações suportadas: `sum`, `avg`, `min`, `max`, `median`, `stdDev`, `count`, `countDistinct`.
- `stdDev` é o **desvio padrão amostral** (divisor *n*−1); com *n*≤1 o valor agregado é 0.
- Colunas sem `type: "number"` podem ainda receber agregações numéricas quando uma amostra das linhas fonte tiver ≥85% de valores finitos (mínimo 8 valores), exceto campos tratados como identificadores (`id`, `idXxx`, `xxxId`). Valores em texto com formatação regional (por exemplo `1.400,00`, `1'400,00`, `1,400.00`) são normalizados antes de contar para a heurística e antes de `sum`/`avg`/etc.

`DataGridPremium` exporta os mesmos tipos a partir de `@geeklabssh/hive-tablepro/core/x-data-grid-premium`.

## Eixo de datas (pivot e gráficos)

`GridPivotDateGranularity`: `day`, `week`, `month`, `quarter`, `semester`, `year`. Semana = semana de calendário local com início na segunda-feira.

## Gráficos (`chartsIntegration`)

- `chartsIntegration?: true | GridChartsConfig` — mostra o botão de gráficos na toolbar integrada e o painel predefinido (diálogo).
- `GridChartsConfig`: `categoryField`, `valueField`, `defaultKind` (reservado). Sem campos, escolhe-se a primeira coluna não-acções e a primeira coluna numérica.

Dependência: `recharts` (incluída no pacote hive-tablepro).
