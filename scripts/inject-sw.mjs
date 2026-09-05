import { readFile, writeFile, readdir, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';

const root = new URL('../dist/', import.meta.url);
const rootPath = root.pathname;
const files = [];

async function walk(directory) {
  for (const name of await readdir(directory)) {
    const path = join(directory, name);
    const info = await stat(path);
    if (info.isDirectory()) await walk(path);
    else if (!name.endsWith('.map') && name !== 'sw.js' && name !== 'staticwebapp.config.json') files.push('/' + relative(rootPath, path));
  }
}

await walk(rootPath);
const swPath = join(rootPath, 'sw.js');
const source = await readFile(swPath, 'utf8');
await writeFile(swPath, source.replace('__PRECACHE__', JSON.stringify(['/', ...files.sort()])));
console.log(`Service worker precaches ${files.length + 1} files.`);
