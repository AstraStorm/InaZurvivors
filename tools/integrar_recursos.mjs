// Copies into public/ only the resource groups whose distribution is authorised in config/autorizacion_recursos.json.
// Stops with an explicit error when a required group has no authorisation or a file is missing or altered.
//
//   node tools/integrar_recursos.mjs --comprobar                     only checks the authorisation
//   node tools/integrar_recursos.mjs --recursos <carpeta>            integrates the authorised groups
//   node tools/integrar_recursos.mjs --recursos <carpeta> --prueba-local
//     integrates every group for a private test on this machine: the build is marked and can never be deployed
import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const args = process.argv.slice(2);
const arg = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };
const fail = (text) => { console.error(`ERROR: ${text}`); process.exit(1); };
const readJson = (file) => JSON.parse(readFileSync(file, 'utf8'));

const required = readJson('config/recursos_obligatorios.json').obligatorios;
const auth = existsSync('config/autorizacion_recursos.json') ? readJson('config/autorizacion_recursos.json').autorizados ?? [] : [];
const incomplete = auth.filter((a) => !['grupo', 'titular', 'documento', 'fecha', 'alcance'].every((k) => String(a[k] ?? '').trim()));
if (incomplete.length) fail(`autorización incompleta (grupo, titular, documento, fecha y alcance): ${JSON.stringify(incomplete)}`);
const allowed = new Set(auth.map((a) => a.grupo));
const local = args.includes('--prueba-local');
if (local && process.env.GITHUB_ACTIONS) fail('--prueba-local no puede usarse en GitHub Actions');

const unauthorised = required.filter((g) => !allowed.has(g));
if (unauthorised.length && !local) fail(`grupos obligatorios sin autorización verificada: ${unauthorised.join(', ')}. No se compila ni se despliega.`);
if (args.includes('--comprobar')) { console.log('Autorización completa para los grupos obligatorios.'); process.exit(0); }

const root = arg('--recursos');
if (!root || !existsSync(join(root, 'indice.json'))) fail(`no se encuentra indice.json en ${root}`);
const index = readJson(join(root, 'indice.json'));
const missingGroups = required.filter((g) => !index.grupos[g]);
if (missingGroups.length) fail(`el repositorio de recursos no tiene estos grupos obligatorios: ${missingGroups.join(', ')}`);

let copied = 0;
let bytes = 0;
for (const f of index.archivos) {
  if (!local && !allowed.has(f.grupo)) continue;
  const from = join(root, f.ruta);
  if (!existsSync(from)) fail(`falta ${f.ruta}`);
  if (createHash('sha256').update(readFileSync(from)).digest('hex') !== f.sha256) fail(`${f.ruta} no coincide con indice.json`);
  const to = join('public', f.ruta);
  mkdirSync(dirname(to), { recursive: true });
  copyFileSync(from, to);
  copied++;
  bytes += f.bytes;
}
writeFileSync('.env.production.local', `VITE_RECURSOS_VERSION=${index.version}\n`);
if (local) writeFileSync('public/PRUEBA_LOCAL_NO_DESPLEGAR', 'Build de prueba local: no autorizada para publicar.\n');
console.log(`${copied} archivos integrados (${(bytes / 1e6).toFixed(1)} MB), versión ${index.version}${local ? ', SOLO PRUEBA LOCAL' : ''}`);
