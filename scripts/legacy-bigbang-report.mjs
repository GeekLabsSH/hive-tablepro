import fs from "fs";
import path from "path";
import {
  contractJsonPath,
  finalReportPath,
  zeroJsonPath
} from "./legacy-bigbang-common.mjs";

function main() {
  if (!fs.existsSync(zeroJsonPath)) {
    throw new Error(`Missing zero scan: ${zeroJsonPath}`);
  }
  if (!fs.existsSync(contractJsonPath)) {
    throw new Error(`Missing contract report: ${contractJsonPath}`);
  }

  const zero = JSON.parse(fs.readFileSync(zeroJsonPath, "utf8"));
  const contract = JSON.parse(fs.readFileSync(contractJsonPath, "utf8"));

  const notMapped = zero.rows.filter((r) => !r.target_exists);
  const notLiteral = zero.rows.filter((r) => !r.literal_match);
  const contractFails = contract.rows.filter((r) => !r.export_parity);

  const lines = [];
  lines.push("# Relatório Big-Bang de Paridade 1:1");
  lines.push("");
  lines.push(`- Geração: ${new Date().toISOString()}`);
  lines.push(`- Total legado: **${zero.legacy_count}**`);
  lines.push(`- Mapeados no destino: **${zero.mapped_count}**`);
  lines.push(`- Match literal (hash): **${zero.literal_match_count}**`);
  lines.push(`- Ficheiros de código verificados (exports): **${contract.code_files_checked}**`);
  lines.push(`- Paridade de exports OK: **${contract.export_parity_ok}**`);
  lines.push(`- Paridade de exports falhas: **${contract.export_parity_fail}**`);
  lines.push("");
  lines.push("## Resultado");
  lines.push("");
  const done =
    zero.legacy_count === zero.mapped_count &&
    zero.legacy_count === zero.literal_match_count &&
    contract.export_parity_fail === 0;
  lines.push(done ? "- Estado: **DONE (2017/2017)**" : "- Estado: **PENDENTE**");
  lines.push("");

  if (notMapped.length) {
    lines.push("## Não mapeados");
    lines.push("");
    for (const r of notMapped.slice(0, 200)) lines.push(`- \`${r.legacy_path}\``);
    lines.push("");
  }

  if (notLiteral.length) {
    lines.push("## Divergências de hash (não literal)");
    lines.push("");
    for (const r of notLiteral.slice(0, 200)) lines.push(`- \`${r.legacy_path}\``);
    lines.push("");
  }

  if (contractFails.length) {
    lines.push("## Falhas de contrato de exports");
    lines.push("");
    for (const r of contractFails.slice(0, 200)) {
      lines.push(
        `- \`${r.legacy_path}\` missing=[${(r.missing_exports || []).join(", ")}] extra=[${(r.extra_exports || []).join(", ")}]`
      );
    }
    lines.push("");
  }

  fs.mkdirSync(path.dirname(finalReportPath), { recursive: true });
  fs.writeFileSync(finalReportPath, lines.join("\n"), "utf8");
  console.log("Wrote", finalReportPath);

  if (!done) process.exit(2);
}

main();

