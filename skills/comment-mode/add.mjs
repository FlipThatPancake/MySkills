#!/usr/bin/env node
// Usage: node add.mjs [--toolbar=bottom-center] [--layout=column] [--theme=author|agent-default] [--css=file.css] page.html [more.html ...]
// Inlines comment-mode.js before </body>. Run again to update an existing copy.
// Toolbar spots: top-left, top-center, top-right, bottom-left, bottom-center, bottom-right.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
const args = process.argv.slice(2);
const spot = (args.find((a) => a.startsWith('--toolbar=')) || '--toolbar=bottom-center').slice(10);
if (!/^(top|bottom)-(left|center|right)$/.test(spot)) { console.error('unknown toolbar spot: ' + spot); process.exit(1); }
const layout = args.includes('--layout=column') ? ", layout: 'column'" : '';
const theme = (args.find((a) => a.startsWith('--theme=')) || '--theme=author').slice(8);
const themeFile = theme === 'agent-default' ? null : new URL('themes/' + theme + '.css', import.meta.url);
if (themeFile && !existsSync(themeFile)) { console.error('unknown theme: ' + theme); process.exit(1); }
const own = (args.find((a) => a.startsWith('--css=')) || '').slice(6);
const sheet = [themeFile && readFileSync(themeFile, 'utf8'), own && readFileSync(own, 'utf8')].filter(Boolean).join('\n').trim();
const css = sheet ? ', css: ' + JSON.stringify(sheet).replace(/<\//g, '<\\/') : '';
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
