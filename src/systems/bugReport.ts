/**
 * «Reportar un bug»: form rules and the technical data attached to a report. Pure helpers (tested); the form, the
 * upload and the server call live in app.ts and online/client.ts. Nothing private goes in: no email, no session, no
 * save file; only what is listed in TECH_FIELDS, which the form also shows to the player.
 */
import { tr } from '../i18n/i18n';
export const CATEGORIES = [
  ['gameplay', 'Gameplay'], ['interfaz', 'Interfaz'], ['graficos', 'Gráficos'], ['gacha', 'Gacha'],
  ['guardado', 'Guardado'], ['online', 'Online'], ['rendimiento', 'Rendimiento'], ['otro', 'Otro'],
] as const;
export const SEVERITIES = [
  ['baja', tr('Baja · detalle menor')], ['media', tr('Media · molesta pero se puede jugar')], ['alta', tr('Alta · impide algo importante')], ['critica', tr('Crítica · no se puede jugar o se pierde progreso')],
] as const;
export const STATUS_LABEL: Record<string, string> = { nuevo: 'Nuevo', revisando: 'Revisando', corregido: 'Corregido', descartado: 'Descartado' };

export const SHOT_MAX_BYTES = 2 * 1024 * 1024;
export const SHOT_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
/** longest side of an attached screenshot after resizing */
export const SHOT_MAX_SIDE = 1600;

export const TECH_FIELDS = [tr('versión del juego y compilación'), tr('navegador y sistema operativo'), tr('resolución de pantalla'),
  tr('arena, dificultad y tiempo de partida (si estabas jugando)'), tr('tu nombre público (si has entrado con Google)'), tr('el código del reporte')];

export interface BugForm { category: string; severity: string; title: string; description: string; steps: string }
export interface RunContext { map: string; difficulty: string; runTimeSec: number }
export interface BugMeta { version: string; build: string; browser: string; os: string; screen: string; map?: string; difficulty?: string; runTimeSec?: number }

/** Error message for the first invalid field, or '' when the form can be sent. */
export function validateBug(f: BugForm): string {
  if (!CATEGORIES.some(([k]) => k === f.category)) return tr('Elige una categoría.');
  if (!SEVERITIES.some(([k]) => k === f.severity)) return tr('Elige la gravedad.');
  if (f.title.trim().length < 4) return tr('El título necesita al menos 4 caracteres.');
  if (f.title.trim().length > 120) return tr('El título puede tener como máximo 120 caracteres.');
  if (f.description.trim().length < 10) return tr('Cuenta qué ha pasado (al menos 10 caracteres).');
  if (f.description.trim().length > 4000 || f.steps.trim().length > 4000) return tr('El texto es demasiado largo (máximo 4000 caracteres).');
  return '';
}

/** Error message when a chosen file can't be attached, or ''. */
export function validateShot(file: { type: string; size: number }): string {
  if (!SHOT_TYPES.includes(file.type)) return tr('La captura tiene que ser PNG, JPG o WebP.');
  if (file.size > 15 * 1024 * 1024) return tr('La imagen es demasiado grande (máximo 15 MB antes de reducirla).');
  return '';
}

/** Browser and OS in plain words, from the user agent (nothing else of it is kept). */
export function describeAgent(ua: string): { browser: string; os: string } {
  const pick = (rx: RegExp, name: string) => { const m = ua.match(rx); return m ? `${name} ${m[1].split('.')[0]}` : ''; };
  const browser = pick(/Edg\/([\d.]+)/, 'Edge') || pick(/OPR\/([\d.]+)/, 'Opera') || pick(/Firefox\/([\d.]+)/, 'Firefox')
    || pick(/Chrome\/([\d.]+)/, 'Chrome') || pick(/Version\/([\d.]+).*Safari/, 'Safari') || 'Otro';
  const os = /Windows NT 10/.test(ua) ? 'Windows 10/11' : /Windows/.test(ua) ? 'Windows' : /Android ([\d.]+)/.test(ua) ? `Android ${ua.match(/Android ([\d.]+)/)![1]}`
    : /iPhone|iPad/.test(ua) ? 'iOS' : /Mac OS X/.test(ua) ? 'macOS' : /CrOS/.test(ua) ? 'ChromeOS' : /Linux/.test(ua) ? 'Linux' : 'Otro';
  return { browser, os };
}

export function buildMeta(version: string, build: string, ua: string, screen: { w: number; h: number; dpr: number }, run: RunContext | null): BugMeta {
  const { browser, os } = describeAgent(ua);
  const meta: BugMeta = { version, build, browser, os, screen: `${screen.w}x${screen.h}${screen.dpr !== 1 ? ` @${Math.round(screen.dpr * 100) / 100}x` : ''}` };
  if (run) Object.assign(meta, { map: run.map, difficulty: run.difficulty, runTimeSec: Math.max(0, Math.round(run.runTimeSec)) });
  return meta;
}
