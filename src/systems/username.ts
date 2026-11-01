/**
 * Username rules, mirrored by the database (supabase/schema.sql): 3-20 characters, letters (no accents), numbers and
 * underscore, spaces at the ends removed, compared ignoring case. The browser check is only informative: uniqueness is
 * decided by the server's unique index when the name is reserved.
 */
export const USERNAME_MIN = 3;
export const USERNAME_MAX = 20;
const RX = /^[A-Za-z0-9_]+$/;

export type UsernameCheck = { ok: true; name: string; key: string } | { ok: false; reason: string };

export function validateUsername(raw: string): UsernameCheck {
  const name = raw.trim();
  if (name.length < USERNAME_MIN) return { ok: false, reason: `Mínimo ${USERNAME_MIN} caracteres` };
  if (name.length > USERNAME_MAX) return { ok: false, reason: `Máximo ${USERNAME_MAX} caracteres` };
  if (!RX.test(name)) return { ok: false, reason: 'Solo letras sin tildes, números y guion bajo' };
  return { ok: true, name, key: name.toLowerCase() };
}
