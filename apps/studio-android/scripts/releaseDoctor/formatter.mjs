export function formatTable(rows) {
  const header = ['Component', 'Status', 'Details / Diagnostic'];
  const colWidths = [18, 10, 50];

  const pad = (str, len) => (str || '').padEnd(len).substring(0, len);
  const border = '+' + colWidths.map((w) => '-'.repeat(w + 2)).join('+') + '+';

  const lines = [border];
  lines.push('| ' + colWidths.map((w, i) => pad(header[i], w)).join(' | ') + ' |');
  lines.push(border);

  for (const r of rows) {
    const statusText = r.pass ? '\x1b[32mPASS\x1b[0m' : '\x1b[31mFAILED\x1b[0m';
    const statusPad = r.pass ? 'PASS      ' : 'FAILED    ';
    lines.push(`| ${pad(r.name, colWidths[0])} | ${statusPad} | ${pad(r.details || r.rootCause || '', colWidths[2])} |`);
  }
  lines.push(border);
  return lines.join('\n');
}
