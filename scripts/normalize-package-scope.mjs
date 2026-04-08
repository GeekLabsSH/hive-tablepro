/**
 * Normaliza imports internos para o scope npm em minúsculas (@geeklabssh/hive-tablepro).
 * Executar na raiz: node ./scripts/normalize-package-scope.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const exts = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.mts',
  '.cts',
  '.json',
  '.md',
]);

let count = 0;

function walk(dir) {
  for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
    if (name.name === 'node_modules' || name.name === '.git') continue;
    const p = path.join(dir, name.name);
    if (name.isDirectory()) walk(p);
    else {
      const ext = path.extname(name.name);
      if (!exts.has(ext) && !name.name.endsWith('.d.ts')) continue;
      let s = fs.readFileSync(p, 'utf8');
      if (!s.includes('@geeklabssh/hive-tablepro')) continue;
      fs.writeFileSync(
        p,
        s.split('@geeklabssh/hive-tablepro').join('@geeklabssh/hive-tablepro'),
        'utf8',
      );
      count++;
    }
  }
}

walk(root);
console.log(`normalize-package-scope: ${count} files updated`);
