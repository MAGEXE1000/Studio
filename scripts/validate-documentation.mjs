import fs from 'fs';
import path from 'path';

const workspaceRoot = process.cwd();
const docsDir = path.join(workspaceRoot, 'docs');

const issues = [];

function logIssue(level, document, line, problem, correction) {
  issues.push({ level, document, line, problem, correction });
}

// Helper to check if a file exists relative to workspace root
function verifyPathExists(filePath, docFile, lineNum, contextStr) {
  // Normalize path separators
  let normalizedPath = filePath.replace(/\\/g, '/');

  // Handle absolute file:/// links by extracting the path after the workspace folder name 'Studio'
  if (normalizedPath.startsWith('file:///')) {
    const studioIdx = normalizedPath.indexOf('/Studio/');
    if (studioIdx !== -1) {
      normalizedPath = normalizedPath.substring(studioIdx + 8); // length of '/Studio/'
    } else {
      // Fallback: strip file:/// and try resolving
      normalizedPath = normalizedPath.replace('file:///', '');
      if (normalizedPath.match(/^[a-zA-Z]:/)) {
        // Windows absolute path
        normalizedPath = path.normalize(normalizedPath);
      }
    }
  }

  // Resolve relative to workspace root if not absolute
  const absolutePath = path.isAbsolute(normalizedPath) 
    ? normalizedPath 
    : path.join(workspaceRoot, normalizedPath);

  // Strip anchor references (e.g. #L10-L20)
  const cleanPath = absolutePath.split('#')[0];

  if (!fs.existsSync(cleanPath)) {
    logIssue(
      'ERROR',
      docFile,
      lineNum,
      `Referenced path does not exist: "${filePath}" (resolved to: "${cleanPath}")`,
      `Verify the file or directory exists in the repository, or update the reference.`
    );
  }
}

function validateFile(file) {
  const filePath = path.join(docsDir, file);
  const relativeDocPath = path.relative(workspaceRoot, filePath);
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  const headers = new Set();
  let currentHeader = null;
  let hasContentUnderHeader = false;
  let inSourceBlock = false;

  lines.forEach((line, index) => {
    const lineNum = index + 1;
    const trimmed = line.trim();

    // Detect Source: blocks
    if (trimmed.startsWith('Source:')) {
      inSourceBlock = true;
      return;
    }

    // Process source files in Source block
    if (inSourceBlock) {
      if (trimmed === '' || trimmed.startsWith('#')) {
        inSourceBlock = false;
      } else if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
        let pathRef = trimmed.substring(2).trim();
        const firstBacktick = pathRef.indexOf('`');
        const secondBacktick = pathRef.indexOf('`', firstBacktick + 1);
        if (firstBacktick !== -1 && secondBacktick !== -1) {
          pathRef = pathRef.substring(firstBacktick + 1, secondBacktick).trim();
        } else {
          pathRef = pathRef.replace(/`/g, '').trim();
        }
        // Skip links that are already verified via link matching
        if (!pathRef.startsWith('[')) {
          verifyPathExists(pathRef, relativeDocPath, lineNum, 'Source Reference');
        }
      }
    }

    // Detect Headers
    if (trimmed.startsWith('#')) {
      // Check if previous header was empty
      if (currentHeader && !hasContentUnderHeader) {
        logIssue(
          'WARNING',
          relativeDocPath,
          currentHeader.line,
          `Section "${currentHeader.title}" has no content.`,
          `Add content to this section or remove the header.`
        );
      }

      const match = trimmed.match(/^(#+)\s+(.+)$/);
      if (match) {
        const title = match[2].trim();
        if (headers.has(title)) {
          logIssue(
            'WARNING',
            relativeDocPath,
            lineNum,
            `Duplicate section header: "${title}"`,
            `Rename the section header to ensure unique navigation targets.`
          );
        }
        headers.add(title);
        currentHeader = { title, line: lineNum };
        hasContentUnderHeader = false;
      }
      return;
    }

    // If we have non-empty text, the current header has content
    if (trimmed !== '' && !trimmed.startsWith('Source:')) {
      hasContentUnderHeader = true;
    }

    // Detect placeholders
    const placeholders = [
      { pattern: /\btodo\b/i, name: 'TODO' },
      { pattern: /\btbd\b/i, name: 'TBD' },
      { pattern: /\bcoming soon\b/i, name: 'Coming Soon' },
      { pattern: /\bcoming_soon\b/i, name: 'Coming Soon' },
      { pattern: /\bplaceholder\b/i, name: 'Placeholder example' }
    ];

    placeholders.forEach(p => {
      if (p.pattern.test(line)) {
        logIssue(
          'WARNING',
          relativeDocPath,
          lineNum,
          `Found placeholder pattern "${p.name}" in text: "${trimmed}"`,
          `Replace the placeholder with actual repository specifications.`
        );
      }
    });

    // Detect Markdown Links
    // Match standard markdown links [label](url)
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let linkMatch;
    while ((linkMatch = linkRegex.exec(line)) !== null) {
      const label = linkMatch[1];
      const url = linkMatch[2].trim();

      // Skip web external URLs, mailto links, pure anchor links, or dummy parameters
      if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('mailto:') || url.startsWith('#') || url === 'url' || url === 'path') {
        continue;
      }

      verifyPathExists(url, relativeDocPath, lineNum, `Markdown Link [${label}]`);
    }
  });

  // Check last header
  if (currentHeader && !hasContentUnderHeader) {
    logIssue(
      'WARNING',
      relativeDocPath,
      currentHeader.line,
      `Section "${currentHeader.title}" has no content.`,
      `Add content to this section or remove the header.`
    );
  }
}

console.log('--- Starting Documentation Validation ---');

if (!fs.existsSync(docsDir)) {
  console.error(`ERROR: Docs directory "${docsDir}" does not exist.`);
  process.exit(1);
}

const docFiles = fs.readdirSync(docsDir).filter(file => file.endsWith('.md'));

docFiles.forEach(file => {
  validateFile(file);
});

console.log(`Scanned ${docFiles.length} documentation files.\n`);

const errors = issues.filter(i => i.level === 'ERROR');
const warnings = issues.filter(i => i.level === 'WARNING');

if (issues.length === 0) {
  console.log('✓ Validation passed! All file references exist and no placeholders were found.');
  process.exit(0);
}

console.log(`Found ${issues.length} issues (${errors.length} errors, ${warnings.length} warnings):\n`);

issues.forEach(i => {
  console.log(`[${i.level}] File: ${i.document} (Line ${i.line})`);
  console.log(`      Problem: ${i.problem}`);
  console.log(`      Fix:     ${i.correction}\n`);
});

if (errors.length > 0) {
  console.log('Validation failed due to file reference errors.');
  process.exit(1);
} else {
  console.log('Validation passed with warnings.');
  process.exit(0);
}
