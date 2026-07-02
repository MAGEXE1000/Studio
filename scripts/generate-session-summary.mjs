import fs from 'fs';
import path from 'path';

const workspaceRoot = process.cwd();
const logsDir = path.join(workspaceRoot, 'session_logs');

function getLatestLogFile() {
  if (!fs.existsSync(logsDir)) {
    console.error(`ERROR: Session logs directory "${logsDir}" does not exist.`);
    process.exit(1);
  }

  const files = fs.readdirSync(logsDir)
    .filter(f => f.endsWith('.md') && f !== 'index.md')
    .sort(); // Lexicographical sort works because naming is YYYY-MM-DD_session-N.md

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
  let engineer = 'unknown';
  let date = 'unknown';

  let completedWork = [];
  let openWork = [];
  let bugs = [];
  let futureWork = [];

  let currentSection = null;

  lines.forEach(line => {
    const trimmed = line.trim();

    // Parse metadata
    if (trimmed.startsWith('- **Repository Branch**:')) {
      branch = trimmed.split('**:')[1].trim().replace(/`/g, '');
    } else if (trimmed.startsWith('- **Current Commit**:')) {
      commit = trimmed.split('**:')[1].trim().replace(/`/g, '');
    } else if (trimmed.startsWith('- **Task Title**:')) {
      taskTitle = trimmed.split('**:')[1].trim();
    } else if (trimmed.startsWith('- **Engineer**:')) {
      engineer = trimmed.split('**:')[1].trim();
    } else if (trimmed.startsWith('- **Date**:')) {
      date = trimmed.split('**:')[1].trim();
    }

    // Identify sections
    if (trimmed.startsWith('## Execution Timeline')) {
      currentSection = 'timeline';
    } else if (trimmed.startsWith('## Bugs Discovered')) {
      currentSection = 'bugs';
    } else if (trimmed.startsWith('## Future Work')) {
      currentSection = 'future';
    } else if (trimmed.startsWith('## Final Report')) {
      currentSection = 'report';
    } else if (trimmed.startsWith('##') || trimmed.startsWith('---')) {
      if (currentSection !== 'timeline' && currentSection !== 'bugs' && currentSection !== 'future' && currentSection !== 'report') {
        currentSection = null;
      }
    }

    // Collect checklist items or bullet points under sections
    if (currentSection === 'timeline' && (trimmed.startsWith('- [x]') || trimmed.startsWith('* [x]'))) {
      completedWork.push(trimmed.substring(5).trim());
    } else if (currentSection === 'timeline' && (trimmed.startsWith('- [ ]') || trimmed.startsWith('* [ ]'))) {
      openWork.push(trimmed.substring(5).trim());
    } else if (currentSection === 'bugs' && (trimmed.startsWith('- ') || trimmed.startsWith('* '))) {
      bugs.push(trimmed.substring(2).trim());
    } else if (currentSection === 'future' && (trimmed.startsWith('- ') || trimmed.startsWith('* '))) {
      futureWork.push(trimmed.substring(2).trim());
    }
  });

  // Output transition summary brief
  console.log(`=== AI SESSION RESUME BRIEF ===`);
  console.log(`Task:   ${taskTitle}`);
  console.log(`Date:   ${date}`);
  console.log(`Agent:  ${engineer}`);
  console.log(`Branch: ${branch}`);
  console.log(`Commit: ${commit}`);
  console.log(`================================`);
  console.log(`\n### Completed Work:`);
  if (completedWork.length > 0) {
    completedWork.forEach(w => console.log(`✓ ${w}`));
  } else {
    console.log(`- None logged.`);
  }

  console.log(`\n### Open Work / Next Steps:`);
  if (openWork.length > 0) {
    openWork.forEach(w => console.log(`☐ ${w}`));
  } else {
    console.log(`✓ All session tasks completed.`);
  }

  if (bugs.length > 0) {
    console.log(`\n### Bugs Discovered:`);
    bugs.forEach(b => console.log(`⚠ ${b}`));
  }

  if (futureWork.length > 0) {
    console.log(`\n### Recommended Future Work:`);
    futureWork.forEach(f => console.log(`→ ${f}`));
  }
  console.log(`================================`);
}

const latestLog = getLatestLogFile();
parseLogAndGenerateSummary(latestLog);
