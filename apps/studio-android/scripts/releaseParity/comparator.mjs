export function compareReleaseParity(workflowStages = [], simulatorStages = []) {
  const parityChecks = [];

  const requiredStages = [
    'Preflight & Audit',
    'Release Manifest Generation',
    'Signing Validation',
    'Firebase Metadata Validation',
    'OTA & Updater Validation',
    'GitHub Release Publication',
  ];

  for (const stage of requiredStages) {
    const inWorkflow = workflowStages.includes(stage);
    const inSimulator = simulatorStages.includes(stage);

    parityChecks.push({
      stage,
      workflowPresent: inWorkflow,
      simulatorPresent: inSimulator,
      pass: inWorkflow && inSimulator,
    });
  }

  const allPass = parityChecks.every((c) => c.pass);
  return { allPass, parityChecks };
}
