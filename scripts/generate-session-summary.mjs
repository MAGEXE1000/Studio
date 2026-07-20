import fs from 'fs';
import path from 'path';

const workspaceRoot = process.cwd();
const logsDir = path.join(workspaceRoot, 'session_logs');

function getLatestLogFile() {
  if (!fs.existsSync(logsDir)) {
    console.error(`ERROR: Session logs directory "${logsDir}" does not exist.`);
    process.exit(1);
  }

  const files = fs
    .readdirSync(logsDir)
    .filter((f) => f.endsWith('.md') && f !== 'index.md')
    .sort();

  if (files.length === 0) {
    console.error('ERROR: No session log files found.');
    process.exit(1);
  }

  return path.join(logsDir, files[files.length - 1]);
}

function parseLogAndGenerateSummary(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  let branch = 'unknown';
  let commit = 'unknown';
  let taskTitle = 'unknown';
  let date = 'unknown';

  let completedWork = [];
  let openWork = [];
  let blockers = [];
  let knownIssues = [];
  let discoveries = [];
  let lessons = [];
  let nextSteps = [];

  let currentSection = null;

  lines.forEach((line) => {
    const trimmed = line.trim();

    // Parse metadata
    if (trimmed.startsWith('- **Repository Branch**:') || trimmed.startsWith('- **Branch**:')) {
      branch = trimmed.split('**:')[1].trim().replace(/`/g, '');
    } else if (
      trimmed.startsWith('- **Current Commit**:') ||
      trimmed.startsWith('- **Commit hash**:')
    ) {
      commit = trimmed.split('**:')[1].trim().replace(/`/g, '');
    } else if (
      trimmed.startsWith('- **Task Title**:') ||
      trimmed.startsWith('- **Task objective**:')
    ) {
      taskTitle = trimmed.split('**:')[1].trim();
    } else if (trimmed.startsWith('- **Date**:')) {
      date = trimmed.split('**:')[1].trim();
    }

    // Identify sections
    if (trimmed.startsWith('## Execution Timeline') || trimmed.startsWith('## Timeline')) {
      currentSection = 'timeline';
    } else if (trimmed.startsWith('## Bugs Found') || trimmed.startsWith('## Bugs Discovered')) {
      currentSection = 'bugs';
    } else if (
      trimmed.startsWith('## Open Questions') ||
      trimmed.startsWith('## Blocker') ||
      trimmed.startsWith('## Remaining Issues')
    ) {
      currentSection = 'blockers';
    } else if (
      trimmed.startsWith('## Architectural Discoveries') ||
      trimmed.startsWith('## Engineering Decisions')
    ) {
      currentSection = 'discoveries';
    } else if (trimmed.startsWith('## Lessons Learned')) {
      currentSection = 'lessons';
    } else if (
      trimmed.startsWith('## Future Work') ||
      trimmed.startsWith('## Recommended Next Steps') ||
      trimmed.startsWith('## Recommended next steps')
    ) {
      currentSection = 'next';
    } else if (trimmed.startsWith('##') || trimmed.startsWith('---')) {
      if (
        currentSection !== 'timeline' &&
        currentSection !== 'bugs' &&
        currentSection !== 'blockers' &&
        currentSection !== 'discoveries' &&
        currentSection !== 'lessons' &&
        currentSection !== 'next'
      ) {
        currentSection = null;
      }
    }

    // Collect list items
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const item = trimmed.substring(2).trim();
      if (currentSection === 'timeline') {
        if (item.startsWith('[x]')) completedWork.push(item.substring(3).trim());
        else if (item.startsWith('[ ]')) openWork.push(item.substring(3).trim());
      } else if (currentSection === 'bugs') {
        knownIssues.push(item);
      } else if (currentSection === 'blockers') {
        blockers.push(item);
      } else if (currentSection === 'discoveries') {
        discoveries.push(item);
      } else if (currentSection === 'lessons') {
        lessons.push(item);
      } else if (currentSection === 'next') {
        nextSteps.push(item);
      }
    }
  });

  // Calculate estimated context
  // Standard context: engineering_guide + ai_workflow + debugging = ~25k tokens
  const estimatedContext = '25k - 40k tokens';

  // Print AI-optimized resume brief
  console.log(`=== SESSION RESUME BRIEF ===`);
  console.log(`branch: ${branch}`);
  console.log(`commit: ${commit}`);
  console.log(`task:   ${taskTitle}`);
  console.log(`date:   ${date}`);
  console.log(`context_est: ${estimatedContext}`);
  console.log(`============================`);

  console.log(`\n[COMPLETED WORK]`);
  if (completedWork.length > 0) {
    completedWork.forEach((w) => console.log(`* ${w}`));
  } else {
    console.log(`* None.`);
  }

  console.log(`\n[OPEN WORK]`);
  if (openWork.length > 0) {
    openWork.forEach((w) => console.log(`* ${w}`));
  } else {
    console.log(`* None.`);
  }

  console.log(`\n[CURRENT BLOCKERS]`);
  if (blockers.length > 0) {
    blockers.forEach((b) => console.log(`* ${b}`));
  } else {
    console.log(`* None.`);
  }

  console.log(`\n[KNOWN ISSUES]`);
  if (knownIssues.length > 0) {
    knownIssues.forEach((i) => console.log(`* ${i}`));
  } else {
    console.log(`* None.`);
  }

  console.log(`\n[ARCHITECTURAL DISCOVERIES]`);
  if (discoveries.length > 0) {
    discoveries.forEach((d) => console.log(`* ${d}`));
  } else {
    console.log(`* None.`);
  }

  console.log(`\n[LESSONS LEARNED]`);
  if (lessons.length > 0) {
    lessons.forEach((l) => console.log(`* ${l}`));
  } else {
    console.log(`* None.`);
  }

  console.log(`\n[RECOMMENDED NEXT STEP]`);
  if (nextSteps.length > 0) {
    console.log(`* ${nextSteps[0]}`);
  } else {
    console.log(`* Continue feature implementation.`);
  }
  console.log(`============================`);
}

const latestLog = getLatestLogFile();
parseLogAndGenerateSummary(latestLog);
