/**
 * Supertechnique sequences. Every shot runs anticipation -> charge -> release -> flight -> impact -> recovery, and a
 * recipe (picked from the technique's own name/element, scaled by level and rarity) supplies each phase.
 * Effects are original procedural recreations; the originals are 3D models.
 */
import type { Rarity, Technique } from '../data/manifest';
import { fxStyle, trajectory, STYLE_COLORS, type Fx, type FxStyle } from './fx';
import { angelWings, boltStorm, energyOrb, flames, funnel, iceSpikes, phoenix, shadows, starburst } from './fxManif';

export type RecipeId = 'fuego' | 'demonio' | 'supernova' | 'tornado' | 'dragon' | 'fenix' | 'meteoro' | 'rayo' | 'hielo' | 'sombra' | 'divino' | 'canon' | 'basico';

export interface Recipe { id: RecipeId; windupSec: number; tier: number; style: FxStyle; ballTexture: string; ballScale: number;
  /** v1.5: the technique draws its own charge (fxAnime): no family manifestation on top (Viento celestial had angel wings) */
  own?: boolean }

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
  // Spanish and English names: the GO movesets come from the wiki, most of them only in English
  const id: RecipeId = /tormenta de fuego|bakunetsu|fire ?storm|llamarada|tornillo ardiente|inferno|blaze|flame/i.test(n) ? 'fuego'
    : /demon|diabl|infern|hell|sat[aá]n|maldit|dem[oó]n|devil|majin|dark matter/i.test(n) ? 'demonio'
    : /supernova|c[oó]smic|galax|astro|espacial|estelar|agujero|omega|cosmo|star|meteor|black hole/i.test(n) ? 'supernova'
    : /tornado|torbellino|cicl[oó]n|remolino|ventisca|tormenta|hurricane|cyclone|typhoon|storm|whirl/i.test(n) ? 'tornado'
      : /drag[oó]n|serpien|serpent|wyvern/i.test(n) ? 'dragon'
        : /f[eé]nix|c[oó]ndor|halc[oó]n|p[aá]jaro|[aá]guila|phoenix|eagle|falcon|hawk|bird|wing|pegasus/i.test(n) ? 'fenix'
          : /divin|celest|[aá]ngel|sagrad|dios|god|heaven|holy|angel|zeus|athena/i.test(n) ? 'divino'
            : trajectory(t) === 'meteoro' ? 'meteoro'
              : style === 'rayo' ? 'rayo' : style === 'hielo' ? 'hielo' : style === 'sombra' ? 'sombra'
                : (t.power ?? 0) >= 60 ? 'canon' : 'basico';
  const tier = techTier(t, rarity);
  // v1.5: Viento celestial is wind, not a divine move: its charge and gust are its own (fxAnime godWindGust)
  // v1.5: Tornado de fuego draws its own spiral of flame (fxAnime), not the generic funnel of «tornado»
  if (/tornado de fuego|fire ?tornado/i.test(n)) return { id: 'tornado', tier, style: 'fuego' as FxStyle, windupSec: WINDUP.tornado + tier * 0.05, ballTexture: 'fx:ball', ballScale: 1, own: true };
  if (/viento celestial|god ?wind/i.test(n)) return { id: 'tornado', tier, style: 'viento' as FxStyle, windupSec: WINDUP.tornado + tier * 0.05, ballTexture: 'fx:ball', ballScale: 1, own: true };
  return { id, tier, style: id === 'supernova' ? 'energia' : style, windupSec: WINDUP[id] + tier * 0.05,
    ballTexture: id === 'supernova' ? 'fx:nova' : 'fx:ball', ballScale: id === 'supernova' ? 1.1 : 1 };
}

/** Phases 1-3: player anticipation is the hop; this draws the charge and any summon at the player. */
export function charge(fx: Fx, r: Recipe, x: number, y: number, level: number) {
  const ms = r.windupSec * 1000;
  const [c1, c2] = STYLE_COLORS[r.style];
  // Fix 1.11: a drawn manifestation per family, on top of the particles below (fxManif.ts)
  const size = (22 + level * 2) * (1 + r.tier * 0.18), w = fx.world, hold = ms + 160;
  const manifest: Partial<Record<RecipeId, () => void>> = {
    fuego: () => flames(w, x, y, size, hold), fenix: () => phoenix(w, x, y, size * 1.3, hold, c1, c2), divino: () => angelWings(w, x, y, size * 1.2, hold),
    tornado: () => funnel(w, x, y, size, hold, c1, c2), supernova: () => starburst(w, x, y, size, hold), rayo: () => boltStorm(w, x, y, size, hold),
    hielo: () => iceSpikes(w, x, y, size, hold), sombra: () => shadows(w, x, y, size, hold), canon: () => energyOrb(w, x, y, size, hold, c1),
    meteoro: () => energyOrb(w, x, y - 30, size * 0.8, hold, c2), basico: () => energyOrb(w, x, y, size * 0.6, hold, c1),
  };
  if (r.own) return;
  manifest[r.id]?.();
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
    case 'dragon': // the dragon itself coils up around the player (fxTech.dragon, called by the scene)
      fx.tornado(x, y + 6, r.style, Math.ceil(level / 2), ms);
      fx.gather(x, y - 18, c1, c2, 8 + level, 36, ms);
      break;
    case 'fenix':
      fx.gather(x, y - 14, c1, c2, 8 + level, 34, ms);
      break;
    case 'divino':
      fx.pillar(x, y + 4, 0xfff0b0, level + 6);
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
