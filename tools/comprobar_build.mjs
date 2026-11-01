// Checks dist/ before a deployment: every resource the game asks for is there, nothing unauthorised or private got in,
// and every path uses the production base. Usage: node tools/comprobar_build.mjs --recursos <carpeta> [--prueba-local]
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, relative } from 'node:path';

const args = process.argv.slice(2);
const root = args[args.indexOf('--recursos') + 1];
const local = args.includes('--prueba-local');
const errors = [];
const readJson = (file) => JSON.parse(readFileSync(file, 'utf8'));

const walk = (dir) => readdirSync(dir).flatMap((n) => { const p = join(dir, n); return statSync(p).isDirectory() ? walk(p) : [p]; });
const files = walk('dist').map((p) => relative('dist', p).replaceAll('\\', '/'));
const have = new Set(files);

if (!have.has('index.html')) errors.push('falta index.html');
if (have.has('PRUEBA_LOCAL_NO_DESPLEGAR') && !local) errors.push('es una build de prueba local');
const token = process.env.RECURSOS_TOKEN;
for (const f of files) {
  if (/\.(map|nds|sav|pem|key)$|(^|\/)\.env|(^|\/)\.git|(^|\/)indice\.json$/.test(f)) errors.push(`archivo prohibido: ${f}`);
  if (/\.(html|js|css|json)$/.test(f)) {
    const text = readFileSync(join('dist', f), 'utf8');
    if ((token && text.includes(token)) || /ghp_[A-Za-z0-9]{20}|github_pat_[A-Za-z0-9_]{20}|sb_secret_/.test(text)) errors.push(`credencial en ${f}`);
    if (text.includes('/InaZurivors/')) errors.push(`ruta antigua en ${f}`);
    if (text.includes('sourceMappingURL')) errors.push(`mapa de código en ${f}`);
    if (text.includes('service_role')) errors.push(`clave de servidor en ${f}`);
  }
}
const html = readFileSync('dist/index.html', 'utf8');
if (!/(src|href)="\/InaZurvivors\/assets\//.test(html)) errors.push('index.html no usa la base /InaZurvivors/');

const allowed = new Set(existsSync('config/autorizacion_recursos.json') ? readJson('config/autorizacion_recursos.json').autorizados.map((a) => a.grupo) : []);
const index = readJson(join(root, 'indice.json'));
const known = new Map(index.archivos.map((f) => [f.ruta, f]));
for (const f of files) {
  const entry = known.get(f);
  if (entry && !local && !allowed.has(entry.grupo)) errors.push(`recurso sin autorización: ${f} (${entry.grupo})`);
  if (f.startsWith('a/') && !entry) errors.push(`recurso desconocido: ${f}`);
}

if (!have.has('generated/manifest.json')) errors.push('falta generated/manifest.json');
else {
  const refs = new Set();
  const collect = (v) => {
    if (typeof v === 'string') { if (/^a\/[0-9a-f]{16}\./.test(v)) refs.add(v); }
    else if (v && typeof v === 'object') Object.values(v).forEach(collect);
  };
  const manifest = readJson('dist/generated/manifest.json');
  collect(manifest);
  for (const m of manifest.maps) if (m.baked) for (const t of [...m.baked.tiles, ...(m.baked.props ?? [])]) refs.add(m.baked.base + t.src);
  for (const p of Object.values(manifest.capsule.pieces)) refs.add(manifest.capsule.base + p.file);
  for (const r of [...refs]) if (r.endsWith('.json') && have.has(r)) collect(readJson(join('dist', r)));
  const missing = [...refs].filter((r) => !have.has(r));
  if (missing.length) errors.push(`faltan ${missing.length} recursos del manifest, por ejemplo ${missing[0]}`);
  console.log(`${refs.size} recursos referenciados`);
}
for (const f of index.archivos) {
  if (have.has(f.ruta) && createHash('sha256').update(readFileSync(join('dist', f.ruta))).digest('hex') !== f.sha256) errors.push(`${f.ruta} alterado`);
}

const mb = files.reduce((n, f) => n + statSync(join('dist', f)).size, 0) / 1e6;
console.log(`dist: ${files.length} archivos, ${mb.toFixed(1)} MB`);
if (errors.length) { errors.forEach((e) => console.error(`ERROR: ${e}`)); process.exit(1); }
console.log('Build correcta.');
