import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { runReleaseDoctor } from './doctor.mjs';

export { runReleaseDoctor };

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  runReleaseDoctor()
    .then((report) => {
      console.log(report.output);
      if (!report.isHealthy) {
        process.exit(1);
      }
      process.exit(0);
    })
    .catch((err) => {
      console.error('Release Doctor encountered an unhandled error:', err);
      process.exit(1);
    });
}
