/**
 * Supertechnique sequences. Every shot runs anticipation -> charge -> release -> flight -> impact -> recovery, and a
 * recipe (picked from the technique's own name/element, scaled by level and rarity) supplies each phase.
 * Effects are original procedural recreations; the originals are 3D models.
 */
import type { Rarity, Technique } from '../data/manifest';
import { fxStyle, trajectory, STYLE_COLORS, type Fx, type FxStyle } from './fx';

export type RecipeId = 'fuego' | 'demonio' | 'supernova' | 'tornado' | 'dragon' | 'fenix' | 'meteoro' | 'rayo' | 'hielo' | 'sombra' | 'divino' | 'canon' | 'basico';

export interface Recipe { id: RecipeId; windupSec: number; tier: number; style: FxStyle; ballTexture: string; ballScale: number }

const WINDUP: Record<RecipeId, number> = { fuego: 0.62, demonio: 0.6, supernova: 0.55, tornado: 0.42, dragon: 0.4, fenix: 0.4, meteoro: 0.38, rayo: 0.28, hielo: 0.3, sombra: 0.34, divino: 0.42, canon: 0.3, basico: 0.2 };

/**
 * 0 ordinary, 1 strong or epic, 2 legendary, 3 mythic/legend/HÉROE owner: more stages and bigger shapes, never just a
 * recolour. Pass rarity 'leyenda' for a HÉROE.
 */
export function techTier(t: Pick<Technique, 'power'>, rarity: Rarity) {
  if (rarity === 'mitico' || rarity === 'leyenda') return 3;
  if (rarity === 'legendario') return 2;
  return rarity === 'epico' || (t.power ?? 0) >= 60 ? 1 : 0;
}

export function recipeFor(t: Pick<Technique, 'name' | 'element' | 'power'>, rarity: Rarity): Recipe {
  const n = t.name;
  const style = fxStyle(t);
  const id: RecipeId = /tormenta de fuego|bakunetsu|fire ?storm|llamarada|tornillo ardiente/i.test(n) ? 'fuego'
    : /demon|diabl|infern|hell|sat[aá]n|maldit|dem[oó]n/i.test(n) ? 'demonio'
    : /supernova|c[oó]smic|galax|astro|espacial|estelar|agujero/i.test(n) ? 'supernova'
    : /tornado|torbellino|cicl[oó]n|remolino|ventisca|tormenta/i.test(n) ? 'tornado'
      : /drag[oó]n|serpien/i.test(n) ? 'dragon'
        : /f[eé]nix|c[oó]ndor|halc[oó]n|p[aá]jaro|[aá]guila/i.test(n) ? 'fenix'
          : /divin|celest|[aá]ngel|sagrad|dios/i.test(n) ? 'divino'
            : trajectory(t) === 'meteoro' ? 'meteoro'
              : style === 'rayo' ? 'rayo' : style === 'hielo' ? 'hielo' : style === 'sombra' ? 'sombra'
                : (t.power ?? 0) >= 60 ? 'canon' : 'basico';
  const tier = techTier(t, rarity);
  return { id, tier, style: id === 'supernova' ? 'energia' : style, windupSec: WINDUP[id] + tier * 0.05,
    ballTexture: id === 'supernova' ? 'fx:nova' : 'fx:ball', ballScale: id === 'supernova' ? 1.1 : 1 };
}

/** Phases 1-3: player anticipation is the hop; this draws the charge and any summon at the player. */
export function charge(fx: Fx, r: Recipe, x: number, y: number, level: number) {
  const ms = r.windupSec * 1000;
  const [c1, c2] = STYLE_COLORS[r.style];
  switch (r.id) {
    case 'fuego': // preparation -> energy -> fire around the player -> whirl; the ball leaves at the end of the windup
      fx.fireStorm(x, y, level, ms, r.tier >= 3);
      if (r.tier >= 2) fx.pillar(x, y + 4, 0xff6a2a, level + 4);
      break;
    case 'demonio': // the entity is summoned first, then the ball is struck through it
      if (r.tier >= 1) fx.entity('demonio', x, y - 4, ms + 500, r.tier >= 3);
      fx.gather(x, y - 14, 0x8a1aff, 0xff2a2a, 10 + level, 40, ms);
      break;
    case 'supernova':
      fx.gather(x, y - 14, 0xbfa8ff, 0xffffff, 14 + level + r.tier * 4, 46 + level * 2, ms);
      fx.orbit(x, y - 14, 'fx:star', 0xfff2a8, 3 + r.tier, 20 + level, ms);
      break;
    case 'tornado':
      fx.tornado(x, y + 6, r.style, level, ms);
      if (r.tier) fx.groundRing(x, y + 6, 22 + level * 2, c1, ms);
      break;
    case 'dragon':
      fx.tornado(x, y + 6, r.style, Math.ceil(level / 2), ms);
      fx.summon('fx:dragon', x, y - 18, c1, 0.9 + r.tier * 0.35, ms + 140);
      break;
    case 'fenix':
      fx.summon('fx:wings', x, y - 14, c1, 0.9 + r.tier * 0.35, ms + 120);
      fx.gather(x, y - 14, c1, c2, 8 + level, 34, ms);
      break;
    case 'divino':
      fx.pillar(x, y + 4, 0xfff0b0, level + 6);
      fx.summon('fx:wings', x, y - 16, 0xfff6c0, 1 + r.tier * 0.3, ms + 120);
      break;
    case 'meteoro':
      fx.groundRing(x, y + 6, 18 + level * 2, c1, ms);
      fx.gather(x, y - 18, c1, c2, 8 + level, 30, ms);
      break;
    case 'rayo':
      for (let i = 0; i < 2 + r.tier; i++) fx.lightning(x + (i - 1) * 14, y - 60, x, y - 10);
      fx.gather(x, y - 12, c1, c2, 6 + level, 24, ms);
      break;
    case 'hielo':
      fx.groundRing(x, y + 6, 20 + level * 2, c1, ms);
      fx.gather(x, y - 12, c1, c2, 8 + level, 30, ms);
      break;
    case 'sombra':
      fx.gather(x, y - 12, c1, c2, 10 + level, 36, ms);
      if (r.tier) fx.summon('fx:wings', x, y - 14, 0x5a2a90, 0.8 + r.tier * 0.3, ms + 100);
      break;
    case 'canon':
      fx.pillar(x, y + 4, c1, level + 2);
      fx.gather(x, y - 10, c1, c2, 6 + level, 26, ms);
      break;
    default:
      fx.pillar(x, y + 4, c1, level);
  }
}

/** Phase 5: impact, with a shape of its own per recipe. */
export function impact(fx: Fx, r: Recipe, x: number, y: number, radius: number, level: number) {
  const [c1, c2] = STYLE_COLORS[r.style];
  switch (r.id) {
    case 'fuego':
      fx.flashDisc(x, y, radius * 0.6, 0xffe24a, 180);
      fx.ring(x, y, radius * 1.2, 0xff6a2a, 480, 3);
      fx.tornado(x, y + 8, 'fuego', Math.ceil(level / 2) + r.tier, 360);
      fx.rays(x, y, 8 + r.tier * 2, radius, 0xffd080, 360);
      fx.burst('fuego', x, y, 18 + level * 3, 130, true);
      break;
    case 'demonio':
      fx.implode(x, y, radius, 0x8a1aff, 220);
      fx.ring(x, y, radius * 1.1, 0xff2a2a, 420, 3);
      fx.burst('sombra', x, y, 14 + level * 3, 110, true);
      break;
    case 'supernova':
      fx.implode(x, y, radius * 0.9, 0x6a4adf, 160);
      fx.flashDisc(x, y, radius * 0.7, 0xffffff, 200);
      fx.ring(x, y, radius * 1.35, 0x6a4adf, 620, 2);
      fx.ring(x, y, radius, 0xbfa8ff, 420, 3);
      fx.ring(x, y, radius * 0.65, 0xfff2a8, 300, 2);
      fx.rays(x, y, 8 + r.tier * 2, radius * 1.1, 0xfff6d0, 380);
      fx.burst('energia', x, y, 18 + level * 3, 130, true);
      break;
    case 'tornado':
      fx.ring(x, y, radius, c1, 360, 3);
      fx.tornado(x, y + 8, r.style, Math.ceil(level / 2), 300);
      fx.burst(r.style, x, y, 12 + level * 3, 110);
      break;
    case 'dragon':
      fx.ring(x, y, radius, c1, 340, 3);
      fx.summon('fx:dragon', x, y - 8, c2, 1 + r.tier * 0.3, 260);
      fx.burst(r.style, x, y, 12 + level * 3, 110);
      break;
    case 'fenix':
    case 'divino':
      fx.rays(x, y, 8, radius, c2, 340);
      fx.ring(x, y, radius, c1, 340, 2);
      fx.burst(r.style, x, y, 12 + level * 3, 100, true);
      break;
    case 'rayo':
      for (let i = 0; i < 4 + r.tier; i++) {
        const a = (i / (4 + r.tier)) * Math.PI * 2;
        fx.lightning(x, y, x + Math.cos(a) * radius, y + Math.sin(a) * radius);
      }
      fx.burst(r.style, x, y, 10 + level * 2, 90);
      break;
    case 'hielo':
      fx.rays(x, y, 6, radius, c2, 300);
      fx.ring(x, y, radius, c1, 360, 2);
      fx.burst(r.style, x, y, 12 + level * 2, 80);
      break;
    case 'sombra':
      fx.implode(x, y, radius, c1, 320);
      fx.burst(r.style, x, y, 12 + level * 2, 90);
      break;
    default:
      fx.ring(x, y, radius, c1, 340, 3);
      fx.ring(x, y, radius * 0.6, c2, 260, 2);
      fx.burst(r.style, x, y, 12 + level * 3, 100);
  }
}
