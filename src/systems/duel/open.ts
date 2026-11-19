/**
 * Modo Duelo: whether its menu tile shows. Always while developing; for players from the 3.0 (author: «el duelo sale con
 * la 3.0, pero yo, desde el panel mío de admin, puedo entrar ya»): admins from now (app.ts asks the server once signed
 * in), everyone else from DUEL_OPEN_AT on the server's clock. DUEL_PUBLIC opens it to everyone before that.
 */
import { serverNow } from '../../online/serverTime';

export const DUEL_PUBLIC = false;
export const DUEL_OPEN_AT = '2026-11-25T12:00:00+01:00';
let admin = false;
export const setDuelAdmin = (yes: boolean) => { admin = yes; };
export const duelOpen = () => import.meta.env.DEV || DUEL_PUBLIC || admin || serverNow().getTime() >= Date.parse(DUEL_OPEN_AT);
