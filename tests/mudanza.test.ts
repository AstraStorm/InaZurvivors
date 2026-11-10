/** 2026-11-10: guests bring their save from the old address; the link decodes and never overwrites progress. */
import { describe, expect, it } from 'vitest';
import { decodePayload, hasProgress, mudanzaPlan, MUDANZA_UNTIL } from '../src/systems/mudanza';
import { exportSave, importSave, newSave } from '../src/systems/save';

const b64url = (bytes: Uint8Array) => Buffer.from(bytes).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const gzip = async (text: string) => new Uint8Array(await new Response(new Blob([text]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer());

describe('mudanza desde la dirección antigua', () => {
  it('decodes both payloads (gzip and plain) back to the same save', async () => {
    const s = newSave([1, 2], 1);
    s.coins = 12345;
    s.profile.name = 'Invitado_ñ';
    const json = JSON.stringify(s);
    for (const p of [`g${b64url(await gzip(json))}`, `j${b64url(new TextEncoder().encode(json))}`]) {
      const back = importSave(await decodePayload(p));
      expect([back.coins, back.profile.name]).toEqual([12345, 'Invitado_ñ']);
    }
    // the page may also send the exported format
    expect(importSave(await decodePayload(`j${b64url(new TextEncoder().encode(exportSave(s)))}`)).coins).toBe(12345);
    await expect(decodePayload('xabc')).rejects.toThrow(/no válido/);
  });

  it('takes the save straight away only when this browser has no progress; otherwise the player chooses', () => {
    const fresh = newSave([], null);
    expect([mudanzaPlan(null), mudanzaPlan(fresh)]).toEqual(['tomar', 'tomar']);
    const played = newSave([], null);
    played.stats.runs = 1;
    const onboarded = newSave([], null);
    onboarded.onboardingDone = true;
    expect([hasProgress(played), mudanzaPlan(played), mudanzaPlan(onboarded)]).toEqual([true, 'elegir', 'elegir']);
  });

  it('the notice lasts 3 days after the 2.0', () => {
    expect(new Date(MUDANZA_UNTIL).toISOString()).toBe('2026-11-13T11:00:00.000Z');
  });
});
