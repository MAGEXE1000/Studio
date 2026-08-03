import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { runReleaseLint } from './linter.mjs';

export { runReleaseLint };

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const result = runReleaseLint();
  if (!result.pass) {
    process.exit(1);
  }
  process.exit(0);
}
