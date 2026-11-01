// Rights check for a public deployment only: technical checks live in integrar_recursos.mjs and comprobar_build.mjs.
//   node tools/comprobar_derechos.mjs                        every required group has a complete authorisation
//   node tools/comprobar_derechos.mjs --recursos <carpeta>   also, dist/ holds no resource from an unauthorised group
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const args = process.argv.slice(2);
const readJson = (file) => JSON.parse(readFileSync(file, 'utf8'));
const errors = [];

const { obligatorios, opcionales } = readJson('config/recursos_obligatorios.json');
const auth = existsSync('config/autorizacion_recursos.json') ? readJson('config/autorizacion_recursos.json').autorizados ?? [] : [];
const incomplete = auth.filter((a) => !['grupo', 'titular', 'documento', 'fecha', 'alcance'].every((k) => String(a[k] ?? '').trim()));
if (incomplete.length) errors.push(`autorización incompleta (grupo, titular, documento, fecha y alcance): ${JSON.stringify(incomplete)}`);
const allowed = new Set(auth.map((a) => a.grupo));
const pending = obligatorios.filter((g) => !allowed.has(g));
if (pending.length) errors.push(`grupos obligatorios sin autorización verificada: ${pending.join(', ')}. No se despliega.`);
console.log(`Autorizados: ${[...allowed].join(', ') || 'ninguno'}. Opcionales pendientes: ${opcionales.filter((g) => !allowed.has(g)).join(', ') || 'ninguno'}.`);

if (args.includes('--recursos')) {
  const root = args[args.indexOf('--recursos') + 1];
  const known = new Map(readJson(join(root, 'indice.json')).archivos.map((f) => [f.ruta, f]));
  const walk = (dir) => readdirSync(dir).flatMap((n) => { const p = join(dir, n); return statSync(p).isDirectory() ? walk(p) : [p]; });
  for (const p of walk('dist')) {
    const f = relative('dist', p).replaceAll('\\', '/');
    if (f === 'PRUEBA_LOCAL_NO_DESPLEGAR') errors.push('es una build de prueba, no desplegable');
    const entry = known.get(f);
    if (entry && !allowed.has(entry.grupo)) errors.push(`recurso sin autorización: ${f} (${entry.grupo})`);
  }
}

if (errors.length) { errors.slice(0, 20).forEach((e) => console.error(`ERROR: ${e}`)); process.exit(1); }
console.log('Derechos comprobados para el despliegue.');
