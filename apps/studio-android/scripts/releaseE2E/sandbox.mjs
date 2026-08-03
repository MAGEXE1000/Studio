import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../../../..');

export function createSandbox() {
  const sandboxDir = path.join(repoRoot, '.temp/release-e2e');
  if (fs.existsSync(sandboxDir)) {
    fs.rmSync(sandboxDir, { recursive: true, force: true });
  }
  fs.mkdirSync(sandboxDir, { recursive: true });

  console.log(`✓ Isolated Release E2E Sandbox initialized at: ${sandboxDir}`);
  return {
    path: sandboxDir,
    resolvePath: (...parts) => path.join(sandboxDir, ...parts),
    clean: () => {
      if (fs.existsSync(sandboxDir)) {
        fs.rmSync(sandboxDir, { recursive: true, force: true });
        console.log(`✓ Isolated Release E2E Sandbox cleaned up.`);
      }
    },
  };
}
