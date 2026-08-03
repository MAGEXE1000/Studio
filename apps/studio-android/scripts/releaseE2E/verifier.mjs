export function verifySimulatedRelease(ghRelease, fbMeta, manifest) {
  const checks = [];

  checks.push({
    name: 'GitHub Release Title',
    pass: ghRelease.name === manifest.version,
    details: `Title: ${ghRelease.name}, Expected: ${manifest.version}`,
  });

  checks.push({
    name: 'GitHub Release Tag',
    pass: ghRelease.tagName === manifest.releaseTag,
    details: `Tag: ${ghRelease.tagName}, Expected: ${manifest.releaseTag}`,
  });

  checks.push({
    name: 'Firebase Version Consistency',
    pass: fbMeta.version === manifest.version,
    details: `Firebase: ${fbMeta.version}, Manifest: ${manifest.version}`,
  });

  checks.push({
    name: 'SHA-256 Checksum Match',
    pass: fbMeta.sha256 === manifest.artifact.sha256,
    details: `SHA-256 matches: ${fbMeta.sha256}`,
  });

  checks.push({
    name: 'Signing Certificate Fingerprint Match',
    pass: fbMeta.signatures === manifest.artifact.signingCertFingerprint,
    details: `Fingerprint matches: ${fbMeta.signatures}`,
  });

  return checks;
}
