import fs from 'fs';
import path from 'path';

const filepath = 'C:\\Users\\ayuda\\Documents\\Studio\\chordex-app\\apps\\studio-android\\src\\App.tsx';
const content = fs.readFileSync(filepath, 'utf8');
const lines = content.split('\n');

console.log('App.tsx main component wrapper:');
let showLines = false;
lines.forEach((line, index) => {
  if (line.includes('export default function App()')) {
    showLines = true;
  }
  if (showLines && index < 1250) {
    if (line.includes('return (') || line.includes('class App extends') || line.includes('const App =') || line.includes('<LifecycleTracker') || line.includes('<div') || line.includes('className="app-main-layout"')) {
      console.log(`  Line ${index + 1}: ${line.trim()}`);
    }
  }
});
