/**
 * Modo Duelo: whether its menu tile shows. Always while developing; for players once DUEL_PUBLIC is true (the mode has
 * no online nor rewards yet).
 */
export const DUEL_PUBLIC = false;
export const duelOpen = () => import.meta.env.DEV || DUEL_PUBLIC;
