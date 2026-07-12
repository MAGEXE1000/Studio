import fs from 'fs';
import path from 'path';

function searchDirectory(dir) {
  if (dir.includes('node_modules') || dir.includes('.git') || dir.includes('dist')) {
    return;
  }
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      searchDirectory(fullPath);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('installedVersionCode')) {
        console.log(`Found in: ${fullPath}`);
        const lines = content.split('\n');
        lines.forEach((line, idx) => {
          if (line.includes('installedVersionCode')) {
            console.log(`  Line ${idx + 1}: ${line.trim()}`);
          }
        });
      }
    }
  }
}

searchDirectory('packages');
searchDirectory('apps');
