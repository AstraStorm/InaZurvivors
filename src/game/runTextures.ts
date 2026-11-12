import type Phaser from 'phaser';

/**
 * 2.11 (players: «en el móvil a veces se reinicia la partida»): the heavy textures of a run — the arena (50-110 MB of
 * GPU memory each), its runtime tileset and the rivals of its map — were never freed, so they piled up run after run
 * (320 MB after four arenas) until the phone killed the page in the middle of the next run.
 *
 * Each run (or replay) says which heavy textures it needs before loading them: whatever an earlier one loaded and this
 * one does not need is removed, so at most one run's set stays in memory and playing the same arena again reloads
 * nothing. It is done at the start of the next run, never at the end of the old one, so a texture can't be removed
 * under a run that is already using it; one still shown by another running scene (menu, lobby) is kept.
 */
const owned = new Set<string>();

export function swapRunTextures(scene: Phaser.Scene, need: Iterable<string>) {
  const keep = new Set(need), tm = scene.textures, shown = new Set<string>();
  for (const s of scene.game.scene.getScenes(true)) {
    if (s === scene) continue;
    for (const o of s.children?.list ?? []) { const k = (o as { texture?: { key?: string } }).texture?.key; if (k) shown.add(k); }
  }
  for (const k of [...owned]) {
    if (keep.has(k) || shown.has(k)) continue;
    // one still loading (the menu was left right away) stays on the list, to be freed by the next swap once it is in
    if (tm.exists(k)) { tm.remove(k); owned.delete(k); }
  }
  for (const k of keep) owned.add(k);
}

/** the heavy textures of a map: its baked arena, its runtime tileset and its own textures */
export function mapTextureKeys(map: { id: string; textures: Record<string, { key: string }>; baked?: { tiles: { src: string }[]; props: { src: string }[] } | null }) {
  return [`tiles:${map.id}`, ...Object.values(map.textures).map((t) => t.key),
    ...(map.baked ? [...map.baked.tiles, ...map.baked.props].map((f) => `bk:${map.id}:${f.src}`) : [])];
}
