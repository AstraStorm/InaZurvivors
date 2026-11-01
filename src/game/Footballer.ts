/**
 * Runtime composition: Raimon body sprite + original head sprite in one container.
 * Both sheets are indexed by cell; the rig (extracted animation table) gives body/head cells, durations and mirroring.
 * No drop shadow: the DS sprites already read well on the ground and a generic ellipse looked like it was floating.
 */
import Phaser from 'phaser';
import type { BodyInfo, RigAnimation, RosterEntry } from '../data/manifest';
import { animIndex, directionFromVector, flipsFor, frameAt } from './rig';

export const headKey = (id: number) => `head:${id}`;
export const bodyKey = (kind: 'field' | 'gk') => `body:${kind}`;

export class Footballer {
  readonly container: Phaser.GameObjects.Container;
  private body: Phaser.GameObjects.Sprite;
  private head: Phaser.GameObjects.Sprite;
  private anims: Map<number, RigAnimation>;
  private animTime = 0;
  private currentAnim = -1;
  dir = 4;
  moving = false;
  /** animation speed factor: run cycles follow the real ground speed, so feet never slide */
  pace = 1;

  constructor(scene: Phaser.Scene, public readonly entry: RosterEntry, bodyInfo: BodyInfo, x: number, y: number, bodyTexture = bodyKey(entry.body)) {
    this.anims = new Map(bodyInfo.rig.animations.map((a) => [a.index, a]));
    this.body = scene.add.sprite(0, 0, bodyTexture, 0)
      .setOrigin(bodyInfo.originX / bodyInfo.frameW, bodyInfo.originY / bodyInfo.frameH);
    this.head = scene.add.sprite(0, 0, headKey(entry.id), 0)
      .setOrigin(entry.head.originX / entry.head.frameW, entry.head.originY / entry.head.frameH);
    this.container = scene.add.container(x, y, [this.body, this.head]);
    this.update(0);
  }

  get x() { return this.container.x; }
  get y() { return this.container.y; }

  setVelocity(dx: number, dy: number) {
    this.moving = Math.hypot(dx, dy) > 0.01;
    if (this.moving) this.dir = directionFromVector(dx, dy, this.dir);
  }

  /** Standing still facing a given direction (used by followers so they don't flicker between directions). */
  idle(dir?: number) {
    this.moving = false;
    if (dir !== undefined) this.dir = dir;
  }

  update(deltaMs: number) {
    const idx = animIndex(this.dir, this.moving);
    if (idx !== this.currentAnim) {
      this.currentAnim = idx;
      this.animTime = 0;
    }
    this.animTime += deltaMs * (this.moving ? this.pace : 1);
    const anim = this.anims.get(idx) ?? this.anims.get(4);
    if (!anim || !anim.frames.length) return;
    const { frame } = frameAt(anim.frames, this.animTime);
    const flips = flipsFor(anim, frame);
    // body and head always change together, in the same frame, so the head can never be shown alone
    if (frame.b !== null && frame.h !== null) {
      this.body.setFrame(frame.b).setFlipX(flips.body);
      this.head.setFrame(frame.h).setFlipX(flips.head);
    }
    this.container.setDepth(this.container.y);
  }

  /** Small jump used as anticipation before a shot. */
  hop(scene: Phaser.Scene, height = 6, ms = 160) {
    scene.tweens.add({ targets: [this.body, this.head], y: -height, duration: ms / 2, yoyo: true, ease: 'Quad.easeOut' });
  }

  flash(color = 0xff9090) {
    this.body.setTint(color);
    this.head.setTint(color);
    this.container.scene.time.delayedCall(70, () => {
      this.body.clearTint();
      this.head.clearTint();
    });
  }

  destroy() { this.container.destroy(); }
}
