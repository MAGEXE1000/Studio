import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { generateReleaseTimeline } from './timeline.mjs';

export { generateReleaseTimeline };

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  generateReleaseTimeline()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Release Timeline encountered an unhandled error:', err);
      process.exit(1);
    });
}
