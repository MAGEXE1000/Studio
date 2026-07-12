import fs from 'fs';

const src = fs.readFileSync('packages/studio-core/src/lib/apkDownloader.ts', 'utf8');
const lines = src.split('\n');

lines.forEach((line, idx) => {
  if (line.includes('export const') || line.includes('export function') || line.includes('export class') || line.includes('export interface')) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
