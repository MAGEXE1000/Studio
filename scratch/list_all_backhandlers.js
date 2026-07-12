import fs from 'fs';
import path from 'path';

function walk(dir, callback) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filepath = path.join(dir, file);
    const stat = fs.statSync(filepath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== 'dist' && file !== 'build' && file !== 'android') {
        walk(filepath, callback);
      }
    } else {
      if (filepath.endsWith('.ts') || filepath.endsWith('.tsx')) {
        callback(filepath);
      }
    }
  }
}

const rootDir = 'C:\\Users\\ayuda\\Documents\\Studio\\chordex-app';
console.log('Listing all useBackHandler registrations...');

walk(path.join(rootDir, 'packages'), (filepath) => {
  const content = fs.readFileSync(filepath, 'utf8');
  if (content.includes('useBackHandler')) {
    console.log(`\nFile: ${filepath}`);
    const lines = content.split('\n');
    lines.forEach((line, index) => {
      if (line.includes('useBackHandler')) {
        console.log(`  Line ${index + 1}: ${line.trim()}`);
      }
    });
  }
});

walk(path.join(rootDir, 'apps'), (filepath) => {
  const content = fs.readFileSync(filepath, 'utf8');
  if (content.includes('useBackHandler')) {
    console.log(`\nFile: ${filepath}`);
    const lines = content.split('\n');
    lines.forEach((line, index) => {
      if (line.includes('useBackHandler')) {
        console.log(`  Line ${index + 1}: ${line.trim()}`);
      }
    });
  }
});
