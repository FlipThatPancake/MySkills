#!/usr/bin/env node
// Usage: node add.mjs page.html [more.html ...]
// Inlines comment-mode.js before </body>. Run again to update an existing copy.
import { readFileSync, writeFileSync } from 'node:fs';
const dir = new URL('.', import.meta.url);
const code = readFileSync(new URL('comment-mode.js', dir), 'utf8').replace(/<\/script/gi, '<\\/script');
const block = `<!-- comment-mode:start -->\n<script>\n${code}</script>\n<!-- comment-mode:end -->\n`;
for (const file of process.argv.slice(2)) {
  let html = readFileSync(file, 'utf8');
  html = html.replace(/<!-- comment-mode:start -->[\s\S]*?<!-- comment-mode:end -->\n?/, '');
  const at = html.lastIndexOf('</body>');
  if (at < 0) { console.error(file + ': no </body>'); process.exitCode = 1; continue; }
  writeFileSync(file, html.slice(0, at) + block + html.slice(at));
  console.log(file + ': comment-mode installed');
}
