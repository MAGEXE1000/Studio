#!/usr/bin/env node
import { getAppVersionInfo } from './parse-version.mjs';

try {
  const info = getAppVersionInfo();

  if (process.argv.includes('--fingerprint') || process.argv.includes('-f')) {
    console.log(info.productionSigningSha256);
  } else if (process.argv.includes('--code') || process.argv.includes('-c')) {
    console.log(info.nativeVersionCode);
  } else if (process.argv.includes('--web') || process.argv.includes('-w')) {
    console.log(info.webVersion);
  } else {
    console.log(info.nativeVersion);
  }
} catch (err) {
  console.error(err.message);
  process.exit(1);
}
