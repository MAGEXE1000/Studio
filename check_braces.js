const fs = require('fs');
const code = fs.readFileSync('temp.js', 'utf8');
let stack = [];
let inString = false, strChar = '';
let inComment = false, inLineComment = false;

for (let i = 0; i < code.length; i++) {
  const ch = code[i];
  const next = code[i+1];
  
  if (inString) {
    if (ch === '\\' && (next === strChar || next === '\\')) {
      i++;
    } else if (ch === strChar) {
      inString = false;
    }
  } else if (inComment) {
    if (ch === '*' && next === '/') {
      inComment = false;
      i++;
    }
  } else if (inLineComment) {
    if (ch === '\n') {
      inLineComment = false;
    }
  } else {
    if (ch === '/' && next === '/') {
      inLineComment = true;
      i++;
    } else if (ch === '/' && next === '*') {
      inComment = true;
      i++;
    } else if (ch === "'" || ch === '"' || ch === '`') {
      inString = true;
      strChar = ch;
    } else if (ch === '{') {
      stack.push(i);
    } else if (ch === '}') {
      stack.pop();
    }
  }
}

if (stack.length > 0) {
  stack.forEach(idx => {
    const line = code.substring(0, idx).split('\n').length;
    console.log('Unclosed { at line ' + line + ' near index ' + idx);
  });
} else {
  console.log('All braces matched perfectly!');
}
