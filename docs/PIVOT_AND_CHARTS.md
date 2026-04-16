# Pivot e gráficos (Hive Data Grid)

## Pivot (`pivoting`, `pivotModel`, `pivotActive`)

- `pivoting?: boolean` — liga o fluxo de dados pivotados.
- `pivotModel?: GridPivotModel` — `{ rows: string[], columns: string[], values: { field, aggFunc }[] }` (MVP: usa o primeiro campo de cada eixo e o primeiro valor).
- `pivotActive?: boolean` — quando `true` e o modelo está completo, a grelha mostra linhas/colunas derivadas (incompatível com `treeData`, agrupamento TanStack ou virtualização de colunas para a linha de filtros no cabeçalho).
- Agregações suportadas: `sum`, `avg`, `min`, `max`, `count`.

`DataGridPremium` exporta os mesmos tipos a partir de `@geeklabssh/hive-tablepro/core/x-data-grid-premium`.

## Gráficos (`chartsIntegration`)

- `chartsIntegration?: true | GridChartsConfig` — mostra o botão de gráficos na toolbar integrada e o painel predefinido (diálogo).
- `GridChartsConfig`: `categoryField`, `valueField`, `defaultKind` (reservado). Sem campos, escolhe-se a primeira coluna não-acções e a primeira coluna numérica.

Dependência: `recharts` (incluída no pacote hive-tablepro).
