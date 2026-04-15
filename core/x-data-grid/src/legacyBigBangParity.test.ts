/**
 * @vitest-environment node
 */
import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";

const pkgRoot = process.cwd();
const zeroPath = path.join(pkgRoot, "docs", "_generated", "legacy-bigbang-zero-scan.json");
const contractPath = path.join(pkgRoot, "docs", "_generated", "legacy-bigbang-contract-report.json");

describe("big-bang parity 1:1 (2017)", () => {
  it("scan zero marca 2017 mapeados e match literal", () => {
    expect(fs.existsSync(zeroPath)).toBe(true);
    const payload = JSON.parse(fs.readFileSync(zeroPath, "utf8"));
    expect(payload.legacy_count).toBe(2017);
    expect(payload.mapped_count).toBe(2017);
    expect(payload.literal_match_count).toBe(2017);
  });

  it("contratos de exports passam em 2017 ficheiros de código", () => {
    expect(fs.existsSync(contractPath)).toBe(true);
    const payload = JSON.parse(fs.readFileSync(contractPath, "utf8"));
    expect(payload.code_files_checked).toBe(2017);
    expect(payload.export_parity_fail).toBe(0);
  });
});

