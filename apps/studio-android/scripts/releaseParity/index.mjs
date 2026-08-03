import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { runReleaseParity } from './validator.mjs';

export { runReleaseParity };

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const result = runReleaseParity();
  if (!result.pass) process.exit(1);
  process.exit(0);
}
