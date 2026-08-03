import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { runReleaseE2E } from './runner.mjs';

export { runReleaseE2E };

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  runReleaseE2E()
    .then((result) => {
      if (!result.pass) process.exit(1);
      process.exit(0);
    })
    .catch((err) => {
      console.error('Release E2E encountered an error:', err);
      process.exit(1);
    });
}
