import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { runReleaseDryRun } from './dryRun.mjs';

export { runReleaseDryRun };

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  runReleaseDryRun()
    .then((result) => {
      if (!result.ready) {
        process.exit(1);
      }
      process.exit(0);
    })
    .catch((err) => {
      console.error('Release Dry Run encountered an unhandled error:', err);
      process.exit(1);
    });
}
