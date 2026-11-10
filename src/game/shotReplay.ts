/**
 * A technique seen from outside: the same charge and ball, flying to where it was aimed (it hurts nothing).
 * Used for the co-op partner's shots (ArenaScene.replayShot) and by the replay viewer (ReplayScene).
 */
import type Phaser from 'phaser';
import type { Fx } from './fx';
import { charge, recipeFor } from './supertech';
import { animeOf, animeShot } from './fxAnime';
import { movieOf, movieShot } from './fxMovie';
import { victorOf, victorShot } from './fxVictor';
import { isSetsuna, setsunaShot } from './fxSetsuna';
import { isCataclysm, cataclysmShot } from './fxCataclysm';
import { solo183Of, solo183Shot, solo189Of, solo189Shot } from './fxCombo183';
import type { FxMsg } from './coopArena';

export function drawShot(scene: Phaser.Scene, fx: Fx, m: FxMsg) {
  const r = recipeFor({ name: m.name, element: m.element, power: m.power } as never, m.rarity as never);
  charge(fx, r, m.x, m.y, m.lv);
  const ball = scene.add.image(m.x, m.y, r.ballTexture).setScale(r.ballScale).setDepth(8901);
  const anime = animeOf(m.name);
  if (anime && anime !== 'brisa') animeShot(scene as never, anime, ball, m.lv);
  const mv = movieOf(m.name);
  if (mv) movieShot(scene as never, mv, ball, m.lv);
  const vb = victorOf(m.name);
  if (vb) victorShot(scene as never, vb, ball, m.lv);
  if (isSetsuna(m.name)) setsunaShot(scene as never, ball, m.lv);
  if (isCataclysm(m.name)) cataclysmShot(scene as never, ball, m.lv);
  const s183 = solo183Of(m.name);
  if (s183) solo183Shot(scene as never, s183, ball, m.lv);
  const s189 = solo189Of(m.name);
  if (s189) solo189Shot(scene as never, s189, ball, m.lv);
  const ms = Math.max(200, Math.min(900, Math.hypot(m.tx - m.x, m.ty - m.y) / 0.32));
  scene.tweens.add({ targets: ball, x: m.tx, y: m.ty, duration: ms, onComplete: () => { fx.burst(r.style, m.tx, m.ty, 5, 40); ball.destroy(); } });
}
