/**
 * Collection rewards per team. Counts distinct owned players, never copies. A player in several teams counts for each
 * of them. Thresholds shrink for small teams so every reward stays reachable. Claims are stored, so each pays once.
 */
import type { RosterEntry } from '../data/manifest';
import { RARITY_ORDER } from '../data/manifest';
import { grantCopy } from './gacha';
import type { SaveData } from './save';

export type TeamRewardKind = 'crest' | 'kit' | 'captain';

export const teamMembers = (pool: RosterEntry[], team: string) => pool.filter((p) => p.teams.includes(team));

/** Team captain for rewards: its highest-rarity member, first in roster order on ties. A Leyenda is never a reward. */
export function teamCaptain(members: RosterEntry[]) {
  return [...members].filter((p) => p.rarity !== 'leyenda').sort((a, b) => RARITY_ORDER.indexOf(b.rarity) - RARITY_ORDER.indexOf(a.rarity))[0];
}

export function teamProgress(save: SaveData, pool: RosterEntry[], team: string) {
  const members = teamMembers(pool, team);
  const owned = members.filter((p) => save.owned[String(p.id)]).length;
  const goal: Record<TeamRewardKind, number> = { crest: Math.min(3, members.length), kit: Math.min(7, members.length), captain: members.length };
  return { owned, total: members.length, goal, claimed: save.teamRewards[team] ?? {} };
}

export const canClaim = (save: SaveData, pool: RosterEntry[], team: string, kind: TeamRewardKind) => {
  const p = teamProgress(save, pool, team);
  return p.total > 0 && p.owned >= p.goal[kind] && !p.claimed[kind];
};

export function claimTeamReward(save: SaveData, pool: RosterEntry[], team: string, kind: TeamRewardKind): boolean {
  if (!canClaim(save, pool, team, kind)) return false;
  (save.teamRewards[team] ??= {})[kind] = true;
  if (kind === 'captain') grantCopy(save, teamCaptain(teamMembers(pool, team)).id);
  return true;
}

/**
 * Claims every reward that is ready across all teams (`available(team, kind)` filters out rewards with no resource,
 * e.g. a kit that was never exported). Returns what was granted.
 */
export function claimAllTeamRewards(save: SaveData, pool: RosterEntry[], available: (team: string, kind: TeamRewardKind) => boolean) {
  const got: { team: string; kind: TeamRewardKind }[] = [];
  const teams = [...new Set(pool.flatMap((p) => p.teams))];
  for (const team of teams) for (const kind of ['crest', 'kit', 'captain'] as TeamRewardKind[]) {
    if (available(team, kind) && claimTeamReward(save, pool, team, kind)) got.push({ team, kind });
  }
  return got;
}

/** Choosing a favourite team grants its crest and kit outright. */
export function grantFavorite(save: SaveData, team: string, hasKit: boolean) {
  const r = (save.teamRewards[team] ??= {});
  r.crest = true;
  if (hasKit) { r.kit = true; save.kit = team; }
  save.crest = team;
}

export const hasCrest = (save: SaveData, team: string) => !!save.teamRewards[team]?.crest;
export const hasKit = (save: SaveData, team: string) => !!save.teamRewards[team]?.kit;
