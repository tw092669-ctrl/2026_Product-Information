import { copyFileSync, existsSync, mkdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const publicVersionFile = path.join(rootDir, 'public', 'version.json');
const docsDir = path.join(rootDir, 'docs');
const docsVersionFile = path.join(docsDir, 'version.json');

mkdirSync(docsDir, { recursive: true });

if (existsSync(publicVersionFile)) {
  copyFileSync(publicVersionFile, docsVersionFile);
}
