#!/usr/bin/env node
// Usage: node add.mjs [--toolbar=bottom-center] [--layout=column] [--theme=m2] page.html [more.html ...]
// Inlines comment-mode.js before </body>. Run again to update an existing copy.
// Toolbar spots: top-left, top-center, top-right, bottom-left, bottom-center, bottom-right.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
const args = process.argv.slice(2);
const spot = (args.find((a) => a.startsWith('--toolbar=')) || '--toolbar=bottom-center').slice(10);
if (!/^(top|bottom)-(left|center|right)$/.test(spot)) { console.error('unknown toolbar spot: ' + spot); process.exit(1); }
const layout = args.includes('--layout=column') ? ", layout: 'column'" : '';
const theme = (args.find((a) => a.startsWith('--theme=')) || '').slice(8);
const themeFile = new URL('themes/' + theme + '.css', import.meta.url);
if (theme && !existsSync(themeFile)) { console.error('unknown theme: ' + theme); process.exit(1); }
const css = theme ? ', css: ' + JSON.stringify(readFileSync(themeFile, 'utf8').trim()).replace(/<\//g, '<\\/') : '';
const code = readFileSync(new URL('comment-mode.js', import.meta.url), 'utf8').replace(/<\/script/gi, '<\\/script');
const block = `<!-- comment-mode:start -->\n<script>\nwindow.commentModeOptions = { toolbar: '${spot}'${layout}${css} };\n${code}</script>\n<!-- comment-mode:end -->\n`;
for (const file of args.filter((a) => !a.startsWith('--'))) {
  let html = readFileSync(file, 'utf8');
  html = html.replace(/<!-- comment-mode:start -->[\s\S]*?<!-- comment-mode:end -->\n?/, '');
  const at = html.lastIndexOf('</body>');
  if (at < 0) { console.error(file + ': no </body>'); process.exitCode = 1; continue; }
  writeFileSync(file, html.slice(0, at) + block + html.slice(at));
  console.log(file + ': comment-mode installed, toolbar ' + spot + (layout ? ', column layout' : ''));
}
