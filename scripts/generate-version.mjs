import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const outputDir = path.join(rootDir, 'public');
const outputFile = path.join(outputDir, 'version.json');

mkdirSync(outputDir, { recursive: true });

function generateVersionCode() {
  const randomPart = Math.random().toString(36).slice(2, 8).toUpperCase();
  const date = new Date().toISOString().slice(0, 10);
  return {
    code: randomPart,
    date,
    generatedAt: new Date().toISOString(),
  };
}

const versionData = generateVersionCode();
writeFileSync(outputFile, JSON.stringify(versionData, null, 2));

console.log(`Generated version ${versionData.code} on ${versionData.date}`);
