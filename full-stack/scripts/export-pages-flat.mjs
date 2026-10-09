import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';

// Optional flat bundle for GitHub's browser uploader. Normal /docs builds remain supported.
const out = path.resolve(process.argv[2] || 'pages-flat');
const html = await fs.readFile('docs/index.html', 'utf8');
const base = html.match(/name="preview-base" content="([^"]+)"/)[1];
await fs.mkdir(out, { recursive: true });
let result = html;
for (const file of await fs.readdir('docs/assets')) {
  if (!/\.(js|css)$/.test(file)) throw new Error('Review unsupported build asset: '+file);
  let content = await fs.readFile('docs/assets/'+file,'utf8');
  content = file.endsWith('.js')
    ? content.replaceAll('/images/',base).replaceAll('/fonts/',base)
    : content.replaceAll(base+'images/',base).replaceAll(base+'fonts/',base);
  const name = 'preview-'+createHash('sha256').update(content).digest('hex').slice(0,12)+path.extname(file);
  await fs.writeFile(path.join(out,name),content);
  result = result.replaceAll(base+'assets/'+file,base+name);
}
await fs.writeFile(path.join(out,'index.html'),result);
for (const folder of ['images','fonts']) {
  for (const file of await fs.readdir('public/'+folder)) await fs.copyFile('public/'+folder+'/'+file,path.join(out,file));
}
for (const file of ['favicon.svg']) await fs.copyFile('public/'+file,path.join(out,file));
await fs.writeFile(path.join(out,'.nojekyll'),'');
await fs.copyFile('IMAGE-SOURCES.json',path.join(out,'IMAGE-SOURCES.json'));
await fs.writeFile(path.join(out,'README.md'),`# Banashree silk and sarees\n\n[Open the client preview](https://madhurag123.github.io/banashree-silk-and-sarees/)\n\n24 sample designs and 30 colour choices, including three Mysore Silk designs with three colours each. Selecting a colour updates the matching photograph and stock; the preview bag keeps each colour separately.\n\nThis is a static client design preview. It does not accept real orders, account details, payments or administrator changes. Products, photography, prices and stock are illustrative.\n\nDownload **banashree-source.zip** in this repository for the complete frontend, backend, database schema, admin dashboard, tests and setup instructions. The live GitHub Pages site uses the flat files in the repository root, with Pages configured to main / (root).\n\nImage sources, licenses and generated-image prompts are recorded in IMAGE-SOURCES.json.\n`);
console.log('Flat Pages bundle: '+out);
