import fs from 'fs';
import path from 'path';

const filepath = 'C:\\Users\\ayuda\\Documents\\Studio\\chordex-app\\packages\\studio-core\\src\\lib\\navigation\\NavigationDispatcher.ts';
if (fs.existsSync(filepath)) {
  const content = fs.readFileSync(filepath, 'utf8');
  console.log(content);
} else {
  console.log('NavigationDispatcher.ts not found at that location.');
}
