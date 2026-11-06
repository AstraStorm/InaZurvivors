/**
 * pre-2.0: off-screen culling. Phaser only culls tilemap layers; every sprite, ball, pickup and technique drawing was
 * sent to the GPU even far outside the camera (in co-op the partner's whole team fights off screen). Each frame,
 * whatever lies outside the camera view (plus a margin, so nothing pops in at the edge) is filtered out of that camera
 * with `cameraFilter`, which leaves `visible` alone: game code that hides a ball on purpose is never overridden.
 * Only drawing is skipped; the simulation keeps running for everything.
 */
import Phaser from 'phaser';

type GO = Phaser.GameObjects.GameObject & { x?: number; y?: number; scrollFactorX?: number; displayWidth?: number; displayHeight?: number; originX?: number; originY?: number };

/** how far a technique drawing reaches from its own position (its graphics are drawn around their origin) */
const GRAPHICS_REACH = 260;
/** a footballer (container: body, head, shadow, aura) */
const CONTAINER_REACH = 80;

export interface CullStats { checked: number; culled: number }

export function cullOffscreen(scene: Phaser.Scene, margin = 96): CullStats {
  const cam = scene.cameras.main, v = cam.worldView, bit = cam.id;
  const L = v.x - margin, R = v.right + margin, T = v.y - margin, B = v.bottom + margin;
  let checked = 0, culled = 0;
  for (const raw of scene.children.list) {
    const o = raw as GO;
    if (o.x === undefined || o.y === undefined) continue;
    if (o.scrollFactorX === 0) continue; // screen overlays
    let cx = o.x, cy = o.y, r: number;
    if (o instanceof Phaser.GameObjects.Graphics) {
      if (cx === 0 && cy === 0) continue; // drawn in world coordinates: its extent is unknown, always drawn
      r = GRAPHICS_REACH;
    } else if (o instanceof Phaser.GameObjects.Container) r = CONTAINER_REACH;
    else if (o instanceof Phaser.GameObjects.Particles.ParticleEmitter || o instanceof Phaser.Tilemaps.TilemapLayer || o instanceof Phaser.GameObjects.Blitter) continue;
    else if (o.displayWidth !== undefined && o.displayHeight !== undefined) {
      const w = Math.abs(o.displayWidth), h = Math.abs(o.displayHeight);
      cx += (0.5 - (o.originX ?? 0.5)) * w; cy += (0.5 - (o.originY ?? 0.5)) * h;
      r = Math.max(w, h) * 0.75; // rotation-proof
    } else continue;
    checked++;
    const out = cx + r < L || cx - r > R || cy + r < T || cy - r > B;
    if (out) { o.cameraFilter |= bit; culled++; } else if (o.cameraFilter & bit) o.cameraFilter &= ~bit;
  }
  return { checked, culled };
}
