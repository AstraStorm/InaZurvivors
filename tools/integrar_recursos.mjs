// Copies the resources into public/, stopping if a file is missing or altered. Rights are checked by comprobar_derechos.mjs.
//
//   node tools/integrar_recursos.mjs --recursos <carpeta>
//     every group, for tests and local builds: the build is marked and can never be deployed
//   node tools/integrar_recursos.mjs --recursos <carpeta> --solo-autorizados
//     only the groups in config/autorizacion_recursos.json, for a public deployment
//   node tools/integrar_recursos.mjs --recursos <carpeta> --verificar
//     checks every file against indice.json and copies nothing
import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const args = process.argv.slice(2);
const arg = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };
const fail = (text) => { console.error(`ERROR: ${text}`); process.exit(1); };
const readJson = (file) => JSON.parse(readFileSync(file, 'utf8'));

const required = readJson('config/recursos_obligatorios.json').obligatorios;
const selective = args.includes('--solo-autorizados');
const verifying = args.includes('--verificar');
const allowed = selective ? new Set(readJson('config/autorizacion_recursos.json').autorizados.map((a) => a.grupo)) : null;
// in Actions only the test job may integrate everything: that job cannot upload or deploy anything
if (!selective && !verifying && process.env.GITHUB_ACTIONS && process.env.GITHUB_JOB !== 'prueba-recursos') fail('la integración completa solo puede usarse en el job prueba-recursos');

const root = arg('--recursos');
if (!root || !existsSync(join(root, 'indice.json'))) fail(`no se encuentra indice.json en ${root}`);
const index = readJson(join(root, 'indice.json'));
const missingGroups = required.filter((g) => !index.grupos[g]);
if (missingGroups.length) fail(`el repositorio de recursos no tiene estos grupos obligatorios: ${missingGroups.join(', ')}`);

let copied = 0;
let bytes = 0;
for (const f of index.archivos) {
  if (selective && !allowed.has(f.grupo)) continue;
  const from = join(root, f.ruta);
  if (!existsSync(from)) fail(`falta ${f.ruta}`);
  if (createHash('sha256').update(readFileSync(from)).digest('hex') !== f.sha256) fail(`${f.ruta} no coincide con indice.json`);
  copied++;
  bytes += f.bytes;
  if (verifying) continue;
  const to = join('public', f.ruta);
  mkdirSync(dirname(to), { recursive: true });
  copyFileSync(from, to);
}
if (verifying) { console.log(`${copied} archivos correctos (${(bytes / 1e6).toFixed(1)} MB), versión ${index.version}`); process.exit(0); }
writeFileSync('.env.production.local', `VITE_RECURSOS_VERSION=${index.version}\n`);
if (!selective) writeFileSync('public/PRUEBA_LOCAL_NO_DESPLEGAR', 'Build de prueba: no desplegable.\n');
console.log(`${copied} archivos integrados (${(bytes / 1e6).toFixed(1)} MB), versión ${index.version}${selective ? '' : ', build de prueba'}`);
