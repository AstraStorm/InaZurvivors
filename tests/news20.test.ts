/** 2.0 (author): the BlueLock news shows itself, pinned, when its banner opens; the 2.0 texts don't name the collab. */
import { describe, expect, it } from 'vitest';
import { allNews, latestNewsId } from '../src/data/news';
import { PUBLIC_RELEASES } from '../src/data/release';

describe('news of the 2.0', () => {
  const before = Date.parse('2026-11-12T11:59:00+01:00'), after = Date.parse('2026-11-12T12:00:00+01:00'); // author: BlueLock at 12:00
  it('the BlueLock news is hidden until its banner opens, then pinned on top', () => {
    expect(allNews(true, before).some((n) => n.id === 'colab-bluelock')).toBe(false);
    const open = allNews(true, after);
    expect(open.find((n) => n.id === 'colab-bluelock')?.pinned).toBe(true);
    expect(open.slice(0, 2).map((n) => n.id)).toContain('colab-bluelock');
    expect(latestNewsId(before)).not.toBe('colab-bluelock');
    // the newest when it opened (a release published later, like the 2.4 of 14-11, is newer still)
    expect(latestNewsId(after)).toBe(PUBLIC_RELEASES[0].date > '2026-11-12' ? `version-${PUBLIC_RELEASES[0].version}` : 'colab-bluelock');
  });
  it('the 2.0 entry and its news only say «a new collab»', () => {
    const v2 = JSON.stringify(PUBLIC_RELEASES.find((r) => r.version === '2.0')) + JSON.stringify(allNews(true, before).find((n) => n.id === 'version-2-0-espiritus'));
    expect(v2).not.toMatch(/blue ?lock|nagi|isagi/i);
    expect(v2).toMatch(/nueva colaboraci/i);
  });
});
