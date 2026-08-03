import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { runReleaseAudit } from './audit.mjs';

export { runReleaseAudit };

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const result = runReleaseAudit();
  if (!result.pass) {
    process.exit(1);
  }
  process.exit(0);
}
