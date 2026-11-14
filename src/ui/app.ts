/** HTML/CSS front-end: onboarding, main menu, captain/map select, collection, gacha (IE3 capsule machine), upgrades,
 *  options, profile, HUD, level-up, pause and results. */
import type Phaser from 'phaser';
import { rankMark, zEmblem } from './rankZ';
import type { Manifest, MapInfo, Rarity, RosterEntry, Technique } from '../data/manifest';
import { ICON, RARITY_LABEL, RARITY_ORDER } from '../data/manifest';
import { uiIcon, type UiIconName } from './uiIcons';
import { deathCause } from '../systems/deathCause';
import { serverNow, syncServerTime, timeSource, trustedClock } from '../online/serverTime';
import { PASS, PASS_TOTAL, claimPass, passStatus, type PassReward } from '../systems/weeklyPass';
import { applyReward, codePlayer, creatorGiftINA483, hasRedeemed, INA483_ODDS, normalizeCode, redeemLocal, type CodeReward } from '../systems/promo';
import { LOSE_PRIZE, matchDecree, paySectorPrize, REBEL_ENEMY_HP, REBEL_POINTS, SECTOR_START, sectorOf, sectorOpen, sectorRun, sectorWeek, sectorWeekEnd, SIDES, weeklyDecree, WIN_PRIZE, type MatchDecree, type SectorRun, type SideId } from '../systems/sector';
import { activeSeason, addRunXp, buyNormalKey, canClaim as canClaimLevel, claimable, claimLevel, daysTo, giveGoldKey, goldKeyChance, levelOf, levelProgress, rowOpen, seasonEnd, seasonOf, seasonStart, upcomingSeason,
  GOLD_KEY_CHANCE, GOLD_KEY_COOP, LEVEL_XP, LEVELS, MULTI_FICHAS, NORMAL_KEY_PRICE, RANK_PRIZES, RANK_XP, SEASONS, XP_PER_MIN, passPlayersHidden, payRankPrize, type Granted, type SeasonReward, type SeasonTrack } from '../systems/seasonPass';
import { claimSeasonRewards } from '../online/client';
import { clearRoad, compensateJaden202, compensateJaden3, jadenProgress, JADEN_EVERY, JADEN_FIRST, JADEN_ID, ROAD_BY_ID, ROAD_DIFFS, ROAD_SQUAD, roadEligible, roadMatchSec, roadOf, type RoadDiff } from '../systems/road';
import { BANNERS, BANNER_ORDER, bannerPool, bannerPrice, eraOf, featured, featuredMachine, FEATURED_BOOST, perPlayerOdds, rarityOdds, teamChoices, type BannerId } from '../systems/banners';
import { exportSave, importSave, remapIds, remapTechSlots, storeSave, type SaveData, type ParticleLevel, type Rank } from '../systems/save';
import { addCopy, eligibleTeams, pull, recordHistory, DUPLICATE_REFUND_BY, PULL_COST, MAX_STARS, starBonus, onboardingPull, type PullResult } from '../systems/gacha';
import { applyRun, isMapUnlocked, mapTierScale, type RunResult } from '../systems/economy';
import { clearRunCheckpoint, readRunCheckpoint, RUN_CP_MAX_AGE, RUN_CP_QUIET, saveRunCheckpoint } from '../systems/runCheckpoint';
import { DROPS } from '../systems/items';
import { STAT_INFO } from '../systems/playerStats';
import { statChanges, TYPE_LABEL, MAX_TECH_LEVEL } from '../systems/techniques';
import { evolutionLabel, evolvesAt, comboLabel } from '../systems/evolution';
import { modDef } from '../systems/runmods';
import { FORMATIONS, FORMATION_ORDER, type FormationId } from '../systems/formations';
import { CATEGORY_BONUS, MILESTONES, PERKS, PERK_CATEGORIES, buyPerk, categoryLevels, perkCost, perkLevel, perkEffects, perkValue, refundPerks, spentOn, type PerkCategory } from '../systems/perks';
import { MISSIONS, addCounter, claimAllMissions, claimMission, recordCollection, isClaimable, isClaimed, missionProgress, pendingClaims, recordRun, rollPeriods, setPeriodClock, type MissionKind } from '../systems/missions';
import { MAX_TECH_BOOST, boostCost, buyTechBoost, buyTechUnlock, isBought, isLocked, unlockCost } from '../systems/shop';
import { GEAR_SLOTS, applyGear, buildGear, buyGear, equipGear, type GearItem } from '../systems/gear';
import { SAGAS, sagaOf, setTeamLabels, setTeamSagas, teamLabel, teamNames } from '../data/sagas';
import { canClaim, claimAllTeamRewards, claimTeamReward, grantFavorite, hasCrest, hasKit, teamCaptain, teamMembers, teamProgress, type TeamRewardKind } from '../systems/teamRewards';
import { buyOffer, isBought as isOfferBought, msToNextDay, msToNextWeek, PRICE, rollDaily, type Offer } from '../systems/dailyShop';
import { rankDef, RANKS, RANK_ORDER, rankZDaysLeft, rankZLeftMs, rankZOpen } from '../systems/difficulty';
import { squadCombos, COMBOS, COMBO_MAX_LEVEL, comboDamage, playsAs } from '../systems/combos';
/** v1.6: training field limits: footballers on the pitch and active techniques each */
const TRAIN_TEAM = 5, TRAIN_SLOTS = 4;
import { CLUB_CHEMISTRY, kitBonus } from '../systems/kitBonus';
import { squadPotential } from '../systems/synergy';
import { championsTable, recordTriumph } from '../systems/hallOfFame';
import { BUILD, CREATOR_GAMES_URL, CURRENT_PUBLIC, PUBLIC_RELEASES, PUBLIC_VERSION, TIKTOK_PATH, TIKTOK_URL, VERSION_LABEL } from '../data/release';
import { allNews, latestNewsId, NEWS_KIND_LABEL, type NewsItem } from '../data/news';
/** Fix 1.32: news text: escaped, **bold** allowed */
const newsText = (t: string) => esc(t).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
/** «Hoy», «Ayer», «Hace 3 días» or «2 nov» */
function newsRelDate(d: string) {
  const days = Math.round((new Date().setHours(12, 0, 0, 0) - new Date(`${d}T12:00:00`).getTime()) / 86400000);
  return days <= 0 ? tr('Hoy') : days === 1 ? tr('Ayer') : days < 7 ? tr('Hace {days} días', { days }) : new Date(`${d}T12:00:00`).toLocaleDateString(locale(), { day: 'numeric', month: 'short' });
}
import { buildMeta, CATEGORIES, SEVERITIES, SHOT_MAX_BYTES, SHOT_MAX_SIDE, SHOT_TYPES, STATUS_LABEL, TECH_FIELDS, validateBug, validateShot } from '../systems/bugReport';
import { elementIcon, setElementArt } from './elements';
import { prefetchRunArt, showRunLoader } from './runLoader';
import { EXTRA_STARS_MAX, affordableStars, assignPick, buyStars, resetStars185, restoreHeroStars188, capBonusOf, extraStarsOf, hasExtraStars, nextStar, pendingPicks, STAR_CAP_STEP } from '../systems/stars';
import { CHAMPION_CAP, CHAMPION_STATS, CHAMPION_TRAIN, playerStats, resetTraining, statCapOf, trainingOf, trainingUsed, trainMaxOf, trainRoom, trainStat, trimTraining, type StatKey } from '../systems/training';
import { AURA_PCT, AURA_ELEMENT_BONUS, AURA_TECH_DAMAGE, BOND_PCT, EFFECTIVE_STAT_MAX, auraBonus, auraOf, bondOf, canBeAura, carrierForRun, carrierOf, equipAura, inheritedTechs, removeAura, sanitizeAuras, withAura, type AuraBonus } from '../systems/auras';
import { BOND_KIND_LABEL } from '../data/auraBonds';
import { ascendAll, ascendableCount, ASC_BONUS, ASC_COSTS, CHAMPION_COSTS, CHAMPION_LABEL, CHAMPION_MAX, HERO_AURA, HERO_STARS_MAX, championOf, compensateDrakul153, migrateChampions18, migrateHeroes131, type AscStep, ascend, ascMultipliers, effectiveRarity, isHero, isTopRarity, nextStep, rarityUp, sparesOf } from '../systems/ascension';
import { USERNAME_MAX, validateUsername } from '../systems/username';
import { ALTAR_COLOR, ALTAR_ICON, ALTAR_INFO, ALTAR_MODE, ALTAR_REWARD } from '../systems/altars';
import { adaptedPassive, passiveText, talentChanges, talentText } from '../systems/talents';
import { adminSuggestions, adminUpdateSuggestion, claimBugNotices, claimBugRewards, claimSuggestionNotices, mySuggestions, redeemCode, submitSuggestion, type SuggestionRow } from '../online/client';
import { THANKS_EVENT, addThanksTokens, thanksActive, thanksLeftMs, thanksTokens } from '../systems/thanksEvent';
import { BLUELOCK_EVENT, BLUELOCK_WINS_FOR_BANNER, bluelockActive, bluelockDaysToStart, bluelockLeftMs, bluelockUpcoming, recordBluelockWin } from '../systems/collabEvent';
import { gtsDeposit, gtsFeed, gtsMine, gtsSearch, gtsTake, gtsWithdraw, type GtsOffer } from '../online/client';
import { submitTierlist, tierlistFeed, type TierlistRow } from '../online/client';
import { championOfRows, clanInfo, clanOf, clanAnswer, clanCancelRequest, clanClaimMission, clanClaimPrizes, clanCreate, clanKick, clanLastWeek, clanLeave, clanRanking, clanRequest, clanRequests, clanSearch, clanSetRole, clanSubmitRun, clanUpdate, myClan, myClanRequests, type ClanMember, type ClanMission, type ClanPrize, type ClanRole, type MyClan } from '../online/client';
import { addBag, boughtThisWeek, canPay, CLAN_COST, CLAN_ERRORS, CLAN_ITEMS, CLAN_MAX, CLAN_MISSION_TEXT, CLAN_PRIZES, CLAN_REWARD_MULT, CLAN_ROLE_LABEL, CLAN_RUNS_PER_DAY, clanDrops, clanError, clanNameProblem, clanPlayer, clanShop, clanWeekKey, clanWeekLeftMs, payBag, recordBuy, tierOfPos, type ClanBag, type ClanOffer, type ClanTier } from '../systems/clans';
import { cleanTiers, placeIn, tierCount, topicLabel, TIER_COLOR, TIER_MAX, TIER_MIN, TIER_TOPICS, TIERS, type Tier, type Tiers } from '../systems/tierlist';
import { CoopLink, type CoopMsg } from '../online/coop';
import { coopInvite, coopInvitesClaim, friendHeartbeat, friendList, friendRemove, friendRequest, friendRespond, lobbyInfo, type FriendRow, type LobbyInfo } from '../online/client';
import type { CoopRun } from '../game/coopArena';
import { applyCoachPerks, COACH_BY_ID, COACH_PULL_CHANCE, COACHES, coachesOfMachine, coachRun, PASSIVE_ICON, passiveText as coachPassiveText, type CoachDef } from '../data/coaches';
import { clashWith } from '../systems/identity';
import { applyGtsLedger, canLeave, gtsBanned, gtsError, gtsSlots, gtsSpare, type GtsRow } from '../systems/gts';
import { fmtNum, getLang, LANGS, locale, resolveLang, setLang, tr, type Lang } from '../i18n/i18n';
import { tEl, tTech } from '../i18n/data';
import { buzz, HAPTIC, setHaptics } from '../game/haptics';
import { accountId, adminBugReports, adminMetrics, adminPlayerStats, adminUpdateBug, amIAdmin, consumeAuthRedirect, deleteAccount, deleteMyBugReports, deleteShot, myBugReports, notifyBug, shotUrl, submitBugReport, uploadShot, getCloudSave, leaderboard, myPosition, passHolders, sectorSides, profileBanners, profileFrames, sectorClaim, sectorCredit, sectorJoin, sectorStatus, type SectorPrize, type SectorStatus, publicProfile, type PublicProfile, myProfile, onlineConfigured, putCloudSave, reserveUsername, resetMyProgress, signedEmail, signedIn, signInWithGoogle, signOut, submitScore, usernameAvailable, type BoardQuery, type BoardRow, type BugFilter, type BugRow, type CloudSave } from '../online/client';
import { backup, linkPlan, progressOf, summarize, type SaveSummary } from '../online/cloudSync';
import { epochOf, freshProgress, resetSummary } from '../systems/resetProgress';
import { scoreOf, localBoard, mapMult, recordBest } from '../systems/leaderboard';
import { coachRequirement, emblemUnlocked, iconAllowed, DEFAULT_EMBLEM } from '../systems/profileUnlocks';
import { INTRO } from './cinematics';
import { SIGNATURE } from '../data/signatures';
import { bindStick, initGamepad } from './gamepad';
import { confetti, countUp, flyTo } from './rewardFx';
import { frameSvg, pennantEmblem, pennantRibbon, pennantSvg, setPennantLogos } from './pennantArt';
import { FRAMES, isFrame, PENNANTS, PENNANT_BY_ID, PENNANT_EVENT, type PennantDef } from '../data/pennants';
import { buyPennant, equipFrame, equippedFrame, equipPennant, equippedPennant, eventActive, eventLeftMs, eventOdds, givePennant, grantAchievementPennants, hasPennant, pullEvent, visiblePennant, type PennantPull } from '../systems/pennants';
import { MASTERY_BONUS, MASTERY_USES, masteryLevel, recordMastery } from '../systems/mastery';
import { MAX_TEAM, canStartWith, startingTech, type Card } from '../systems/cards';
import { clearSquad, renameSquad, savedSquads, setSquad, SQUAD_SIZE, fillSquad, makeCaptain, placeInSquad, removeFromSquad, squadOf, switchSquad, syncActiveSquad } from '../systems/squad';
import type { ArenaInit, ArenaScene, HudState, MarkerState, Poi, TrainingSetup } from '../game/ArenaScene';
import type { LobbyInit, LobbyPlayer } from '../game/LobbyScene';
import type { ReplayInit, ReplayScene } from '../game/ReplayScene';
import { readReplay, type ReplayEvent } from '../game/replay';
import { adminPruneReplays, adminReplays, adminSpiritStats, recordSpiritRun, replayFile, uploadReplay, type ReplayRow, type SpiritStat } from '../online/client';
import { BOSS_WARN_SEC } from '../systems/bossKit';
import { canLevel, egTokens, KESHIN_BY_ID, type KeshinId, giveKeshinGift, keshinElClass, KESHIN_LABEL, KESHIN_MAX, KESHINS, keshinForRun, keshinLevel, keshinOf, keshinStepCost, levelKeshin, nextCost, passiveText as keshinPassiveText, statBonus, techFor, withKeshinStats, type KeshinDef } from '../systems/keshin';
import { charCanvas, initPreviews, mountPreviews, setPreviewKit } from './sprites';
import { egAwaken, sfx, setVolume } from '../game/sfx';
import { firstPad, moveKey } from '../game/controls';
import { setEgArt } from '../game/fxKeshin';
import { currentTrack, initMusic, setMusicContext, setMusicSource, setMusicVolume, musicUnlocked } from '../game/music';

type Frames = Record<string, { frame: { x: number; y: number; w: number; h: number }; sheet?: number }>;

const esc = (s: unknown) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
/** 1.84: a faceted star (body, a lit facet and a glint), coloured by CSS (.st / .hst, .on) */
const starIcon = (cls: string) => `<svg class="${cls}" viewBox="0 0 24 24"><path class="s-b" d="M12 1.8l3.1 6.6 7.2.8-5.4 4.9 1.5 7.1L12 17.6l-6.4 3.6 1.5-7.1L1.7 9.2l7.2-.8z"/>`
  + `<path class="s-f" d="M12 1.8l3.1 6.6 7.2.8L12 12zM1.7 9.2l7.2-.8L12 12z"/><circle class="s-g" cx="9.4" cy="7.6" r="1.3"/></svg>`;
/** pre-2.0: what a player shows of himself in a co-op room */
interface CoopProfile { coach?: string | null; name: string; icon: { kind: 'emblem' | 'player' | 'coach'; id: number } | null; crest: string; kit: string; pennant: string | null; frame: string | null; wins: number; squad: { id: number; r: string; st: number; hero: boolean }[] }
/** the author's other games (Créditos and the menu bar): a controller */
const GAMEPAD_SVG = '<svg class="dg-pad" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7h10a5 5 0 0 1 4.8 6.4l-1.2 4A2.8 2.8 0 0 1 15.9 18l-1.6-2H9.7l-1.6 2a2.8 2.8 0 0 1-4.7-.6l-1.2-4A5 5 0 0 1 7 7Zm0 3v1.5H5.5v1.5H7v1.5h1.5V13H10v-1.5H8.5V10H7Zm9.3.2a1.1 1.1 0 1 0 0 2.2 1.1 1.1 0 0 0 0-2.2Zm-2 2.3a1.1 1.1 0 1 0 0 2.2 1.1 1.1 0 0 0 0-2.2Z"/></svg>';
const fmtTime = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const RARITY_COLOR: Record<Rarity, string> = { comun: '#9fb0c8', raro: '#4fb3ff', epico: '#b36bff', legendario: '#ffb020', mitico: '#ff4f8b', leyenda: '#fff6c8' };
const ELEMENT_COLOR: Record<string, string> = { Fuego: '#ff6a2a', Aire: '#6ad8ff', Bosque: '#5ee05a', 'Montaña': '#d9a440', Neutro: '#c45aff' };
// 2.3: not tr(): «DEF» is also the Guard stat (GRD)
const POS_LABEL: Record<string, string> = getLang() === 'en' ? { GK: 'GK', DF: 'DF', MF: 'MF', FW: 'FW' }
  : getLang() === 'fr' ? { GK: 'GB', DF: 'DÉF', MF: 'MIL', FW: 'ATT' } : getLang() === 'it' ? { GK: 'POR', DF: 'DIF', MF: 'CEN', FW: 'ATT' }
  : getLang() === 'de' ? { GK: 'TW', DF: 'AB', MF: 'MF', FW: 'ST' }
  : { GK: 'POR', DF: 'DEF', MF: 'MED', FW: 'DEL' };
const FORMATION_ICON = (f: FormationId, size = 46) => {
  const F = FORMATIONS[f];
  const dots = F.slots.map(([x, y]) => `<circle cx="${23 + x * 0.27}" cy="${24 - y * 0.27}" r="3.4" fill="#7fd3ff" stroke="#0a1d48"/>`).join('');
  return `<svg width="${size}" height="${size}" viewBox="0 0 46 46"><rect x="2" y="2" width="42" height="42" rx="6" fill="#0d3a1e" stroke="#5ab45a"/>
    <line x1="2" y1="23" x2="44" y2="23" stroke="#5ab45a" stroke-width="1"/><polygon points="23,5 19,10 27,10" fill="#ffe24a"/>${dots}
    <circle cx="23" cy="24" r="4.2" fill="#f07a12" stroke="#fff" stroke-width="1"/></svg>`;
};

/** marks the public news as read; changes with each public version */
/** Fix 1.32: the menu marks Noticias until the newest item has been seen (timed items count once they show) */
const newsKey = () => `noticias-${latestNewsId(serverNow())}`;
/**
 * The interface was laid out for screens about 460 px on their short side; a phone is smaller (≈330 px tall in landscape),
 * so on touch screens it shrinks to fit, never under 60%. The player's own scale setting multiplies this.
 */
const STAT_SHORT: Record<string, string> = { kick: tr('TIR'), body: tr('FÍS'), guard: tr('DEF'), control: tr('CON'), speed: tr('VEL'), guts: tr('AGA'), stamina: tr('AGU') };
/** Mean of a footballer's stats, rounded: the number shown on the cards. */
export const statMean = (stats: Record<string, number>) => { const v = Object.values(stats); return v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : 0; };
/** Fix 1.22: the pixel football of the matches (makeFxTextures in fx.ts), as a data URL for the gacha scene. */
let ballUrl = '';
export function footballUrl() {
  if (ballUrl) return ballUrl;
  const rows = ['....####....', '..##wwww##..', '.#wwwwwwww#.', '.#ww##www#w#', '#ww####wwww#', '#www##wwww##', '#wwwwwww####', '##wwwwwww##w', '.#w##wwwwww#', '.##www##ww#.', '..##ww##w#..', '....####....'];
  const c = document.createElement('canvas'); c.width = c.height = 12;
  const g = c.getContext('2d')!;
  rows.forEach((row, y) => [...row].forEach((ch, x) => { if (ch !== '.') { g.fillStyle = ch === '#' ? '#202020' : '#ffffff'; g.fillRect(x, y, 1, 1); } }));
  g.fillStyle = '#d8d8e8'; g.fillRect(3, 9, 2, 1); g.fillRect(8, 2, 2, 1);
  return (ballUrl = c.toDataURL());
}
/** Fix 1.13: the stats as a radar, the usual polygon of the games (one corner per stat, 0-100 scale, guides every 25). */
export function statRadar(stats: Record<string, number>, names: Record<string, string>, color: string, aura?: Partial<Record<string, number>>) {
  const keys = Object.keys(stats), n = keys.length, R = 62, cx = 100, cy = 84;
  // v1.5: with an Aura the scale goes to 120 (the effective maximum); the dashed ring marks 99, the normal maximum
  const hasAura = !!aura && keys.some((k) => (aura[k] ?? 0) > 0);
  // 1.8: a Campeón's own stats go past 100 (up to 129): the scale grows with them
  const top = Math.max(hasAura ? EFFECTIVE_STAT_MAX : 100, ...keys.map((k) => (stats[k] ?? 0) + (aura?.[k] ?? 0)));
  const at = (i: number, r: number) => { const a = -Math.PI / 2 + (i / n) * Math.PI * 2; return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]; };
  const poly = (r: (i: number) => number) => keys.map((_, i) => at(i, r(i)).map((v) => v.toFixed(1)).join(',')).join(' ');
  const grid = [0.25, 0.5, 0.75, 1].map((k) => `<polygon points="${poly(() => R * k)}" class="rg"/>`).join('')
    + (top > 100 ? `<polygon points="${poly(() => R * 99 / top)}" class="rg r99"/>` : '');
  const axes = keys.map((_, i) => { const [x, y] = at(i, R); return `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" class="rg"/>`; }).join('');
  const eff = (k: string) => Math.min(top, stats[k] + (aura?.[k] ?? 0));
  const labels = keys.map((k, i) => {
    const [x, y] = at(i, R + 10), side = x > cx + 4 ? 'start' : x < cx - 4 ? 'end' : 'middle';
    const plus = aura?.[k] ? `<tspan class="ra">+${aura[k]}</tspan>` : '';
    return `<text x="${x.toFixed(1)}" y="${(y + (y > cy ? 9 : y < cy - R ? -2 : 3)).toFixed(1)}" text-anchor="${side}">${esc(names[k] ?? k)} <tspan>${hasAura ? eff(k) : stats[k]}</tspan>${plus}</text>`;
  }).join('');
  const base = `<polygon points="${poly((i) => R * Math.min(top, stats[keys[i]]) / top)}" class="rv" style="--rc:${color}"/>`;
  const extra = hasAura ? `<polygon points="${poly((i) => R * eff(keys[i]) / top)}" class="rv-aura"/>` : '';
  return `<svg viewBox="-30 0 260 180" role="img" aria-label="${tr('Estadísticas{x1}', { x1: hasAura ? tr(' (en cian, lo que aporta el Aura)') : '' })}">${grid}${axes}${extra}${base}${labels}</svg>`;
}
export function autoUiScale() {
  const touch = window.matchMedia?.('(pointer: coarse)').matches || 'ontouchstart' in window;
  return touch ? Math.max(0.6, Math.min(1, Math.min(window.innerWidth, window.innerHeight) / 460)) : 1;
}

/** Fits a screenshot in SHOT_MAX_SIDE and the 2 MB limit, re-encoded (which also drops any metadata of the file). */
async function shrinkShot(src: Blob | HTMLImageElement): Promise<Blob> {
  const img = src instanceof Blob ? await createImageBitmap(src) : src;
  const k = Math.min(1, SHOT_MAX_SIDE / Math.max(img.width, img.height));
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(img.width * k)); c.height = Math.max(1, Math.round(img.height * k));
  c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
  for (const q of [0.85, 0.7, 0.5, 0.35]) {
    const b = await new Promise<Blob | null>((r) => c.toBlob(r, 'image/webp', q));
    if (b && b.size <= SHOT_MAX_BYTES) return b;
  }
  throw new Error(tr('La imagen es demasiado pesada incluso reducida. Prueba con otra.'));
}

export class App {
  private root = document.getElementById('ui')!;
  private byId: Map<number, RosterEntry>;
  /** v1.5: the footballers as the current run plays them (Aura and HÉROE techniques included): what level-up cards show */
  private runById = new Map<number, RosterEntry>();
  /** width of each mugshot sheet: the last sheet of the atlas is smaller than the others */
  private mugW: number[] = [];
  private iconW: number;
  private collectionFilter = { q: '', rarity: '', team: '', pos: '', element: '', saga: '', owned: false, upgrade: false };
  private collectionView: 'equipos' | 'todos' | 'fichatron' = 'equipos';
  private collectionLimit = 36;
  /** Fix 1.22: first footballer of a comparison, waiting for the second */
  private compareWith: number | null = null;
  private gear: GearItem[];
  private pulling = false;
  private pullAt = 0; // 1.88: when the pull started (a pull with nothing left on screen no longer locks the machine)
  private tapAt = 0;
  private screenKey = '';
  private perkTab: PerkCategory = 'Combate';
  private lastMusicCtx = '';
  private hudTeamKey = '';
  private lastBannerAt = -1;
  private captainId: number | null;
  private squadSlot = 0;
  private menuKit = '';
  private missionTab: MissionKind = 'diaria';
  private missionFilter: 'todas' | 'disponibles' | 'pendientes' | 'reclamadas' = 'todas';
  private squadFilter = { q: '', rarity: '', pos: '', el: '', sort: 'media' };
  /** Fix 1.32: the player chose a slot on purpose (the next pick goes there) */
  private squadPicked = false;
  private squadLimit = 48;

  constructor(private game: Phaser.Game, private m: Manifest, private save: SaveData,
    private mugFrames: Frames, private iconFrames: Frames) {
    // 2.2: the logos inside banners and frames, by the manifest's paths (the published build renames every file)
    setPennantLogos({ bluelock: m.collab?.bluelock, sector: m.sector?.sector, resistencia: m.sector?.resistencia });
    // author: InaZurvivors x BlueLock is a surprise until it opens — its footballers stay out of the encyclopedia, lists
    // and searches (unless already owned, e.g. the QA accounts); the menu teaser only shows their silhouettes
    if (bluelockUpcoming(serverNow())) m.roster = m.roster.filter((p) => p.exclusive !== 'bluelock' || !!save.owned[String(p.id)]);
    // 2.02 (author): «próximamente» footballers are a secret: nowhere in the game until they are owned
    m.roster = m.roster.filter((p) => p.exclusive !== 'proximamente' || !!save.owned[String(p.id)]);
    // 2.1: the season pass footballers are a surprise until the season opens (the teaser shows them in silhouette)
    if (passPlayersHidden(serverNow())) m.roster = m.roster.filter((p) => p.exclusive !== 'pase' || !!save.owned[String(p.id)]);
    this.byId = new Map(m.roster.map((p) => [p.id, p]));
    setElementArt(m.elements); // author: the original element icons, in every menu from the start
    // the loading screen's runners: their sprites in the cache before the first run (ui/runLoader.ts)
    window.setTimeout(() => prefetchRunArt(m, (save.squad ?? []).map((id) => this.byId.get(id)?.head.texture ?? '').filter(Boolean), m.kits?.[save.kit]?.field ?? null), 1500);
    // 1.93: the clan arena is only for the Juegos del Clan: out of the arena path, the training field and the lists
    this.clanMap = m.maps.find((x) => x.clanOnly) ?? null;
    m.maps = m.maps.filter((x) => !x.clanOnly);
    for (const f of Object.values(mugFrames)) { const s = f.sheet ?? 0; this.mugW[s] = Math.max(this.mugW[s] ?? 0, f.frame.x + f.frame.w); }
    this.iconW = Math.max(...Object.values(iconFrames).map((f) => f.frame.x + f.frame.w));
    this.captainId = save.captainId;
    this.gear = buildGear(m.items.items);
    setPeriodClock(serverNow, trustedClock); // Fix 1.23: missions change day on the server's clock, never the device's
    rollPeriods(save);
    if (remapIds(save, m.idAliases)) storeSave(save); // characters now on another ROM record keep their progress
    if (remapTechSlots(save, m.techRemaps) >= 0) storeSave(save); // repertoires that changed order keep their purchases
    if (migrateHeroes131(save, m.roster)) storeSave(save); // Fix 1.31: Míticos ascended the old way become HÉROE
    if (migrateChampions18(save, m.roster)) storeSave(save); // 1.8: Leyenda HÉROES become Campeón
    if (restoreHeroStars188(save, m.roster)) storeSave(save); // 1.88: the HÉROE hero stars come back
    if (resetStars185(save, m.roster)) storeSave(save); // 1.85: everyone's stars start again under the coin rules
    if (compensateDrakul153(save)) storeSave(save); // Fix 1.53: 3 copies of Drakul for whoever ascended him
    if (creatorGiftINA483(save)) storeSave(save); // 2.3: INA483 also gives the content creators' banner and frame
    // 2.02: Jaden at 3 clears, a copy every 5; 2.3: a copy every 3
    const jadenOwed = compensateJaden202(save, this.byId.get(JADEN_ID)) + compensateJaden3(save, this.byId.get(JADEN_ID));
    this.jadenNotice(jadenOwed);
    if (save.jaden202 || save.jaden3) storeSave(save);
    if (save.auras && sanitizeAuras(save, new Map(m.roster.map((p) => [p.id, p])))) storeSave(save); // v1.5: Auras no longer valid are dropped
    if (this.trimAllTraining(save, m.roster)) storeSave(save); // Fix 1.31: points stuck above 99 come back
    if (m.profile && !iconAllowed(save, m.roster, m.profile.emblems, m.profile.coaches)) save.profile.icon = { kind: 'emblem', id: DEFAULT_EMBLEM };
    initPreviews(m);
    setTeamSagas(m.teamSagas);
    // 1.81: a winged frame reaches 30% of the avatar's width past each side: keep that room so it covers nothing
    // (never where the host sits in a fixed column, as in the ranking rows: there the margin squeezed the avatar to 22 px;
    // those rows give the avatar column room instead, style14.css)
    const roomForWings = (n: ParentNode) => n.querySelectorAll?.<HTMLElement>('.fr-host.wide').forEach((h) => {
      const w = h.offsetWidth;
      h.style.marginInline = `${Math.round(w * 0.3)}px`;
      if (h.offsetWidth < w - 1) h.style.marginInline = '';
    });
    new MutationObserver((list) => { for (const m of list) m.addedNodes.forEach((n) => { if (n instanceof HTMLElement) { if (n.matches('.fr-host.wide')) roomForWings(n.parentElement ?? n); else roomForWings(n); } }); })
      .observe(document.body, { childList: true, subtree: true });
    // Fix 1.32: cards tilt towards the pointer and a glare follows it (CSS reads --rx --ry --gx --gy); mouse only
    let tiltRaf = 0;
    document.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse' || tiltRaf) return;
      tiltRaf = requestAnimationFrame(() => {
        tiltRaf = 0;
        // v1.4: the level-up cards tilt too; Fix 1.41: measured on their wrapper (.lvc), which does not move, so the angle
        // does not feed back on itself, and tilted harder (up to ±11°) so it can actually be seen
        const card = (e.target as Element | null)?.closest?.('.pcard:not(.locked), .lvc, .eg-card') as HTMLElement | null;
        if (!card) return;
        const lv = card.classList.contains('lvc'), eg = card.classList.contains('eg-card'); // author: the spirits' cards tilt gently (they are wide)
        const r = card.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        card.style.setProperty('--ry', `${((x - 0.5) * (lv ? 22 : eg ? 6 : 14)).toFixed(1)}deg`);
        card.style.setProperty('--rx', `${((0.5 - y) * (lv ? 18 : eg ? 5 : 12)).toFixed(1)}deg`);
        card.style.setProperty('--ry-n', ((x - 0.5) * 2).toFixed(2));
        card.style.setProperty('--rx-n', ((0.5 - y) * 2).toFixed(2));
        card.style.setProperty('--gx', `${Math.round(x * 100)}%`);
        card.style.setProperty('--gy', `${Math.round(y * 100)}%`);
      });
    }, { passive: true });
    setLang(resolveLang(save.settings.lang)); // 2.3: before anything is drawn
    setTeamLabels(m.teamLabels);
    setPreviewKit(m.kits?.[save.kit] ?? null);
    initMusic(m.music?.tracks ?? [], m.music?.contexts);
    setMusicSource(save.settings.musicSource);
    this.applyAudio();
    this.applyMotion();
    window.addEventListener('resize', () => this.applyMotion());
    document.addEventListener('click', (e) => { if ((e.target as HTMLElement).closest('button')) sfx('click'); });
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) document.body.classList.add('touch');
    initGamepad(() => {
      if (document.getElementById('pause')) (document.getElementById('resume') as HTMLElement).click();
      else if (document.getElementById('hud')) this.pauseFromHud();
    });
    document.addEventListener('mouseover', (e) => {
      const b = (e.target as HTMLElement).closest('button, .pcard, .team-card');
      if (b && !b.contains(e.relatedTarget as Node)) sfx('hover');
    });
  }

  /**
   * Entry point. The Google session is settled first (so a returning account lands on its own progress), then the intro:
   * whole the first time, only the animated logo afterwards. New players go on to profile creation (with the Google /
   * guest choice when there is no session); anyone with a profile gets a title screen to continue as they are.
   */
  async start() {
    this.startSocial(); // pre-2.0: friends online, co-op invitations
    void syncServerTime().then(() => rollPeriods(this.save)); // daily shop, pass and missions rotate on the server's clock
    let after: (() => void) | null = null;
    if (onlineConfigured()) {
      const ret = await consumeAuthRedirect();
      if (ret?.error) window.setTimeout(() => this.toast(tr('No se pudo entrar con Google: {error}', { error: ret.error }), 5000), 600);
      // Fix 1.32: the game never waits long for the server: after 6 s it opens and the account resolves in the background
      if (signedIn()) {
        const acct = this.resolveAccount();
        after = await Promise.race([acct, new Promise<null>((ok) => window.setTimeout(() => ok(null), 6000))]);
        if (!after) void acct.then((fn) => fn?.()).catch(() => undefined);
      }
      if (ret?.signedIn && !after) window.setTimeout(() => this.toast(this.save.onlineName ? tr('¡Hola de nuevo, {onlineName}!', { onlineName: this.save.onlineName }) : tr('¡Conectado con Google!'), 3500), 600);
    }
    const returning = this.save.onboardingDone;
    void this.intro(this.save.introSeen).then(() => {
      if (!returning) { this.afterIntro(); after?.(); return; }
      this.titleScreen(() => { this.mainMenu(); after?.(); });
    });
  }

  private afterIntro() {
    if (!this.save.onboardingDone) this.createProfile(onlineConfigured() && !signedIn() ? 0 : 1);
    else this.mainMenu();
  }

  /**
   * v1.4: the version stamped onto the opening (it follows PUBLIC_VERSION, so 1.5 shows by itself); the first time a new
   * version is opened it also says «¡NUEVA VERSIÓN!». Remembered in this browser only (a cosmetic, nothing to sync).
   */
  private versionStamp() {
    let fresh = false;
    try { fresh = localStorage.getItem('iz-intro-version') !== PUBLIC_VERSION; localStorage.setItem('iz-intro-version', PUBLIC_VERSION); } catch { /* private window: just the stamp */ }
    const [major, minor = '0'] = PUBLIC_VERSION.split('-')[0].split('.'); // 1.91-pre2.0: the stamp shows 1.91
    return `<div class="vs4${fresh ? ' fresh' : ''}"><i class="vs4-ring"></i><small>${tr('VERSIÓN')}</small><b><span class="vs4-maj">${esc(major)}</span><em>.</em><span class="vs4-min">${esc(minor)}</span></b>${fresh ? `<span class="vs4-new">${tr('¡NUEVA VERSIÓN!')}</span>` : ''}</div>`;
  }

  /** v1.4: the backdrop of the intro and the title: a night stadium, its sweeping lights, speed lines and floating dust. */
  private cineStage() {
    return `<div class="cine-stage"><i class="cs-pitch"></i><i class="cs-light l1"></i><i class="cs-light l2"></i><i class="cs-light l3"></i><i class="cs-lines"></i>${Array.from({ length: 16 }, (_, k) => `<i class="cs-dust" style="--x:${(k * 37) % 100}%;--d:${(k % 8) * -0.9}s;--s:${1 + (k % 3)}px"></i>`).join('')}</div>`;
  }

  /** Returning player: their club is already here, one click (or key) carries on. A guest can still link Google. */
  private titleScreen(next: () => void) {
    const name = this.save.onlineName ?? this.save.profile.name;
    const guest = onlineConfigured() && !signedIn();
    this.show(`<div class="cine cine4 title-screen">${this.cineStage()}<div class="cine-shot in"><div class="logo cine-logo ib-logo4 idle"><h1><span class="p1">INA</span><span class="bolt p2">Z</span><span class="p3">URVIVORS</span><i class="ib-shine"></i><span class="ib-pre ib-v2">2.0</span></h1>
      <div class="sub">${tr('ROGUELITE DE FÚTBOL · FANGAME')}</div></div>
      <p class="cine-text">${tr('¡Hola de nuevo, {name}!', { name: esc(name) })}</p>
      <p class="wiz-next"><button class="btn big" id="tscont">${tr('Continuar ▶')}</button></p>
      ${guest ? `<p class="wiz-next"><button class="btn google-btn" id="tsgoogle"><span class="g-logo">G</span> ${tr('Entrar con Google')}</button></p><p class="note">${tr('Ahora juegas como invitado: tu progreso está en este navegador.')}</p>` : ''}
      </div></div>`, 'title');
    let gone = false;
    // v1.5 (author): a real exit instead of a cut — the logo charges at the camera, the rest drops away, a flash of light
    // covers the change and the menu comes in under it (only transform/opacity: no repaint-heavy animation)
    const go = () => {
      if (gone) return;
      gone = true;
      window.removeEventListener('keydown', key);
      const scr = document.querySelector<HTMLElement>('.title-screen');
      if (!scr || document.body.classList.contains('reduced-motion') || matchMedia('(prefers-reduced-motion: reduce)').matches) { next(); return; }
      sfx('whoosh');
      scr.classList.add('leaving');
      scr.insertAdjacentHTML('beforeend', '<i class="ts-flash"></i>');
      window.setTimeout(() => {
        next();
        // the flash keeps fading over the new screen so the change has no hard edge
        const f = document.createElement('i');
        f.className = 'ts-flash after';
        document.body.appendChild(f);
        window.setTimeout(() => f.remove(), 520);
      }, 560);
    };
    const key = (e: KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') go(); };
    window.addEventListener('keydown', key);
    document.getElementById('tscont')!.addEventListener('click', go);
    document.getElementById('tsgoogle')?.addEventListener('click', () => { void signInWithGoogle(); });
  }

  /**
   * After every Google sign-in. Returning account (it has a global name): its cloud progress is loaded straight away
   * when this browser has none, or the player picks one copy when both have progress. First connection: nothing goes to
   * the cloud until a name is reserved, either in profile creation or, for a guest who already played, in a short
   * welcome step. Returns what must be shown once the screen is up (a choice or that welcome), if anything.
   */
  private async resolveAccount(): Promise<(() => void) | null> {
    try {
      const profile = await myProfile();
      if (!profile) {
        this.save.onlineName = undefined;
        return this.save.onboardingDone ? () => this.welcomeOnline() : null;
      }
      this.save.onlineName = profile.username;
      const cloud = await getCloudSave();
      // progress restarted on another device: this browser's copy is older than the reset and never wins
      if (cloud && epochOf(cloud.data) > epochOf(this.save)) { this.adoptCloud(cloud, this.save.onboardingDone, tr('Tu progreso se reinició: empiezas de nuevo con tu cuenta (la copia anterior de este navegador queda como respaldo).')); return null; }
      const local = summarize(this.save), remote = cloud ? summarize(cloud.data as SaveData) : null;
      const plan = linkPlan(this.save.onboardingDone ? local : null, remote);
      if (plan === 'bajar-nube' && cloud) this.adoptCloud(cloud, this.save.onboardingDone);
      else if (plan === 'elegir' && cloud && this.save.cloudVersion !== cloud.version) return () => { void this.linkCloud(true).then(() => { if (document.querySelector('.menu-root')) this.mainMenu(); }); };
      else if (this.save.onboardingDone) await this.linkCloud();
      void this.linkGuestCodes();
      this.claimName();
      storeSave(this.save);
      return null;
    } catch (e) {
      this.cloudState = { status: 'error', at: Date.now(), msg: (e as Error).message };
      return null;
    }
  }

  /**
   * Fix 1.12: codes redeemed as a guest are recorded on the account when the player signs in, so the account can't
   * redeem them again (the reward is already in this save).
   */
  private async linkGuestCodes() {
    for (const code of [...(this.save.guestCodes ?? [])]) {
      try {
        const r = await redeemCode(code, true);
        if (r.status === 'linked' || r.status === 'used' || r.status === 'invalid') this.save.guestCodes = (this.save.guestCodes ?? []).filter((c) => c !== code);
      } catch { return; } // offline: tried again next time
    }
    this.persist();
  }

  /** Fix 1.12: a combined technique was learned in the run: the participants' portraits close in and its name. */
  /** 1.8: decodes the mugshot sheets once (kept referenced), so the first portrait shown during a run doesn't stall it. */
  private mugWarm: HTMLImageElement[] = [];
  private warmMugs() {
    const sheets = this.m.atlases.mugshots.images ?? [this.m.atlases.mugshots.image];
    if (!this.mugWarm.length) for (const src of sheets) { const i = new Image(); i.src = src; void i.decode?.().catch(() => undefined); this.mugWarm.push(i); }
    // and the notice itself painted once off screen with the squad's faces: layer, fonts and portraits are ready before it is needed
    const box = document.createElement('div');
    box.className = 'combo-unlock';
    box.style.cssText = 'left:-3000px;top:-3000px;animation:none';
    box.innerHTML = `<div class="cu-mugs">${squadOf(this.save, this.byId).slice(0, 7).map((p) => `<span>${this.mug(p.id, 64)}</span>`).join('')}</div><small>${tr('¡NUEVA TÉCNICA COMBINADA!')}</small><b>${tr('Fuego cruzado')}</b>`;
    document.body.appendChild(box);
    window.setTimeout(() => box.remove(), 600);
  }

  /**
   * 1.83 (author: the notice looked odd and still lagged): a portrait drawn once on a 64 px canvas from the decoded sheet,
   * so the browser never scales the whole mugshot sheet (the hitch); null when the sheet isn't decoded yet.
   */
  private mugCanvas(id: number): HTMLCanvasElement | null {
    const entry = this.mugFrames[String(id)], f = entry?.frame;
    const img = this.mugWarm[entry?.sheet ?? 0];
    if (!f || !img?.complete || !img.naturalWidth) return null;
    const c = document.createElement('canvas');
    c.width = 64; c.height = 64;
    c.getContext('2d')?.drawImage(img, f.x, f.y, f.w ?? 64, f.h ?? 64, 0, 0, 64, 64);
    return c;
  }

  /**
   * Fix 1.12 / 1.83: a combined technique was just learned. A slanted golden band sweeps across (like the boss card) with
   * the participants' portraits and names, the name of the technique, its element and power. Only transform and opacity
   * are animated, and the portraits are small canvases.
   */
  private comboUnlock(c: { name: string; ids: number[] }) {
    document.querySelector('.combo-unlock')?.remove();
    const def = COMBOS.find((d) => d.name === c.name);
    const box = document.createElement('div');
    box.className = 'combo-unlock cu2';
    box.style.setProperty('--ec', ELEMENT_COLOR[def?.element ?? ''] ?? '#ffd23f');
    box.innerHTML = `<div class="cu2-band"><i class="cu2-stripes"></i>
      <div class="cu2-mugs">${c.ids.map((id, i) => `<span class="cu2-mug" style="--i:${i}" data-id="${id}"><i></i><small>${esc(this.byId.get(id)?.name.split(' ')[0] ?? '')}</small></span>`).join('')}</div>
      <div class="cu2-tx"><small>${tr('¡NUEVA TÉCNICA COMBINADA!')}</small><b>${esc(c.name)}</b>${def ? `<span class="cu2-meta">${tr('{elementIcon} {element} · Poder {power}', { elementIcon: elementIcon(def.element, 12), element: esc(def.element), power: def.power })}</span>` : ''}</div></div>`;
    for (const slot of box.querySelectorAll<HTMLElement>('.cu2-mug')) {
      const id = Number(slot.dataset.id), cv = this.mugCanvas(id);
      if (cv) slot.querySelector('i')!.replaceWith(cv); else slot.querySelector('i')!.outerHTML = this.mug(id, 64);
    }
    document.body.appendChild(box);
    sfx('legend');
    setTimeout(() => box.classList.add('out'), 2100);
    setTimeout(() => box.remove(), 2600);
  }


  /** Fix 1.12: promotional codes. Online the server decides (once per account); guests redeem on this device. */
  codesModal() {
    document.querySelector('.codes-modal')?.remove();
    const box = document.createElement('div');
    box.className = 'tut-modal codes-modal';
    const online = onlineConfigured() && signedIn();
    box.innerHTML = `<div class="panel codes-panel"><h2>${tr('✉ Canjear código')}</h2>
      <p class="note">${online ? tr('Cada código se canjea una sola vez por cuenta, en cualquier dispositivo.') : tr('Como invitado el código se canjea en este navegador. Al entrar con Google tu cuenta quedará marcada y no podrás canjearlo otra vez.')}</p>
      <div class="codes-row"><input id="code-in" maxlength="32" autocomplete="off" spellcheck="false" placeholder="${tr('CÓDIGO')}"><button class="btn" id="code-go">${tr('Canjear')}</button></div>
      <p id="code-msg" class="code-msg" aria-live="polite"></p>
      <div class="tut-nav"><span class="spacer"></span><button class="btn small blue" id="code-close">${tr('Cerrar')}</button></div></div>`;
    document.body.appendChild(box);
    const input = box.querySelector('#code-in') as HTMLInputElement, msg = box.querySelector('#code-msg') as HTMLElement, go = box.querySelector('#code-go') as HTMLButtonElement;
    const say = (text: string, ok = false) => { msg.textContent = text; msg.className = `code-msg ${ok ? 'ok' : 'bad'}`; };
    box.querySelector('#code-close')!.addEventListener('click', () => { box.remove(); this.mainMenu(); });
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') go.click(); });
    input.focus();
    go.addEventListener('click', async () => {
      const code = normalizeCode(input.value);
      if (!code) return;
      go.disabled = true;
      say('Comprobando…');
      let status: string, reward: CodeReward | undefined;
      try {
        if (online) {
          const r = await redeemCode(code);
          status = r.status; reward = r.reward ?? undefined;
          if (status === 'ok' && reward) applyReward(this.save, code, reward, this.byId, serverNow());
          if (status === 'used' && !hasRedeemed(this.save, code)) (this.save.redeemedCodes ??= []).push(code);
        } else ({ status, reward } = redeemLocal(this.save, code, this.m.roster));
      } catch { status = 'error'; }
      go.disabled = false;
      if (status === 'invalid') { sfx('error'); return say(tr('Ese código no existe.')); }
      if (status === 'used') { sfx('error'); return say(tr('Ya has canjeado este código.')); }
      if (status !== 'ok' || !reward) { sfx('error'); return say(tr('Error de conexión. Inténtalo de nuevo.')); }
      this.persist();
      const gifts = (reward.pennants ?? []).map((id) => PENNANT_BY_ID.get(id)).filter((d): d is PennantDef => !!d).map((d) => `${isFrame(d) ? tr('el marco') : tr('el banner')} «${d.name}»`);
      say(tr('¡Código válido! Recibes {x1}{x2}.', { x1: [reward.tokens ? tr('{tokens} fichas', { tokens: reward.tokens }) : '', reward.eventTokens ? tr('{eventTokens} fichas de evento', { eventTokens: reward.eventTokens }) : '', reward.egTokens ? tr('{egTokens} Fichas EG', { egTokens: reward.egTokens }) : '', reward.coins ? tr('{x1} monedas', { x1: reward.coins.toLocaleString(locale()) }) : '', reward.goldKey ? tr('la Llave dorada del pase') : '', reward.players?.length ? tr('{n} futbolistas', { n: reward.players.length }) : '', ...gifts].filter(Boolean).join(', '), x2: reward.player !== null ? tr(' y un futbolista {x1}', { x1: RARITY_LABEL[this.byId.get(reward.player)?.rarity ?? 'legendario'] }) : '' }), true);
      sfx('legend');
      // 2.3: INA303 gives several footballers at once (reward.players), shown together
      const got = [reward.player, ...(reward.players ?? [])].map((id) => id !== null ? this.byId.get(id) : undefined).filter((x): x is RosterEntry => !!x);
      if (got.length) {
        box.remove();
        await this.capsuleShow(got.map((p) => { const o = this.save.owned[String(p.id)]; return { player: p, isNew: o?.copies === 1, stars: o?.stars ?? 0, refund: 0 }; }), code === 'ASTRA17' ? tr('¡Regalo de bienvenida ASTRA17!') : tr('Código {code}', { code }));
        this.toast(tr('+{tokens} fichas · +{coins} monedas{x1}', { tokens: reward.tokens, coins: reward.coins, x1: gifts.length ? tr(' · banner y marco en tu Perfil') : '' }), 3500);
        this.mainMenu();
      }
    });
  }

  /** The reserved global name is the profile name on every device. */
  private claimName() {
    if (!this.save.onlineName) return;
    this.save.profile.name = this.save.onlineName;
    this.save.nameLocked = true;
  }

  /** First Google connection of a guest who already has progress: reserve the global name, then that progress goes up. */
  private welcomeOnline() {
    if (document.querySelector('.welcome-online')) return;
    const box = document.createElement('div');
    box.className = 'tut-modal welcome-online';
    box.innerHTML = `<div class="panel" style="max-width:520px"><h2>${tr('¡Bienvenido a InaZurvivors online!')}</h2>
      <p class="note">${tr('Es la primera vez que entras con esta cuenta de Google. Reserva tu nombre en todo el mundo: aparecerá en el ranking y es <b>permanente</b>. Después tu progreso de este navegador se guardará en la nube.')}</p>
      <div class="filters"><input id="wo-name" maxlength="${USERNAME_MAX}" autocomplete="off" spellcheck="false" value="${esc(this.save.profile.name)}"><span id="wo-check" class="pcheck"></span></div>
      <div class="tut-nav"><button class="btn small blue" id="wo-later">${tr('Ahora no')}</button><span class="spacer"></span><button class="btn" id="wo-ok">${tr('Reservar nombre y guardar en la nube')}</button></div></div>`;
    document.body.appendChild(box);
    const input = box.querySelector('#wo-name') as HTMLInputElement, out = box.querySelector('#wo-check') as HTMLElement, ok = box.querySelector('#wo-ok') as HTMLButtonElement;
    this.liveNameCheck(input, out, ok);
    box.querySelector('#wo-later')!.addEventListener('click', () => { box.remove(); this.toast(tr('Puedes reservar tu nombre cuando quieras en Perfil.'), 3500); });
    ok.addEventListener('click', () => {
      const v = validateUsername(input.value);
      if (!v.ok) { this.toast(v.reason); return; }
      ok.disabled = true;
      reserveUsername(v.name, String(this.save.profile.icon.id), this.save.crest)
        .then(async (n) => { this.save.onlineName = n; this.claimName(); storeSave(this.save); box.remove(); await this.linkCloud(); this.toast(tr('Nombre «{n}» reservado. Tu progreso ya está en la nube.', { n }), 4000); this.mainMenu(); })
        .catch((e: Error) => { ok.disabled = false; this.toast(/taken/.test(e.message) ? tr('Ese nombre ya está ocupado: prueba otro') : e.message, 3500); });
    });
  }

  /** Rules at once, global availability after a short pause; `button` is enabled only for a free, valid name. */
  private liveNameCheck(input: HTMLInputElement, out: HTMLElement, button?: HTMLButtonElement) {
    let timer = 0, seq = 0;
    const check = () => {
      const v = validateUsername(input.value);
      window.clearTimeout(timer);
      if (!v.ok) { out.className = 'pcheck bad'; out.textContent = v.reason; if (button) button.disabled = true; return; }
      out.className = 'pcheck'; out.textContent = 'Comprobando…'; if (button) button.disabled = true;
      const mine = ++seq;
      timer = window.setTimeout(() => usernameAvailable(v.name).then((free) => {
        if (mine !== seq) return;
        out.className = `pcheck ${free ? 'ok' : 'bad'}`; out.textContent = free ? 'Disponible' : 'Ocupado'; if (button) button.disabled = !free;
      }).catch(() => { if (mine === seq) { out.className = 'pcheck'; out.textContent = tr('No se pudo comprobar ahora'); if (button) button.disabled = false; } }), 450);
    };
    input.addEventListener('input', check);
    check();
  }

  // ------------------------------------------------------------- helpers
  private persist() { syncActiveSquad(this.save); storeSave(this.save); void this.pushCloud(); } // 1.76: the live team also refreshes its saved slot
  private owned(id: number) { return this.save.owned[String(id)]; }
  private unlockedRoster() { return this.m.roster.filter((p) => this.owned(p.id)); }
  private applyAudio() {
    setHaptics(this.save.settings.vibration !== false); // 2.3: applied with the rest of the settings
    setVolume(this.save.settings.muted ? 0 : this.save.settings.volume);
    setMusicVolume(this.save.settings.musicVolume, this.save.settings.muted);
  }
  private applyMotion() {
    document.body.classList.toggle('reduced-motion', this.save.settings.reducedMotion);
    document.documentElement.style.setProperty('--ui-scale', String(Math.round(this.save.settings.uiScale * autoUiScale() * 100) / 100));
    // 2.0 (author: «¿crees que es visible?» on a big monitor): the run HUD was laid out for 1366×768 and stayed that size
    // on big screens; on a computer it now grows with the window (up to 1.6×), so it always looks as designed
    const touch = window.matchMedia?.('(pointer: coarse)').matches || 'ontouchstart' in window;
    const hud = touch ? 1 : Math.max(1, Math.min(1.45, window.innerWidth / 1600, window.innerHeight / 900)); // (author: «redúcelo un poco»)
    document.documentElement.style.setProperty('--hud-scale', String(Math.round(hud * 100) / 100));
  }

  // ---- kit portraits: original head portrait + the ROM's portrait torso of the equipped kit, composed once and cached
  private portraitFrames: Frames | null = null;
  private kitShots = new Map<string, string>();
  private kitWaiting = new Set<string>();
  private imgCache = new Map<string, Promise<HTMLImageElement>>();
  private loadImg(src: string) {
    let p = this.imgCache.get(src);
    if (!p) {
      p = new Promise((ok, ko) => { const im = new Image(); im.onload = () => ok(im); im.onerror = ko; im.src = src; });
      this.imgCache.set(src, p);
    }
    return p;
  }
  /** Data URL of a player wearing the equipped kit, or null (no kit, no torso data, or still being drawn). */
  private kitPortrait(id: number): string | null {
    const kit = this.save.kit ? this.m.kits?.[this.save.kit] : undefined;
    const p = this.byId.get(id);
    if (!kit?.group || !p?.torso || !this.m.atlases.portraits) return null;
    const key = `${this.save.kit}:${id}`;
    const hit = this.kitShots.get(key);
    if (hit !== undefined) return hit || null;
    // Fix 1.23: the torso kind of this kit's wearset (field / goalkeeper), when it isn't the plain 1 / 2
    const torso = kit.bustKinds ? { ...p.torso, kind: kit.bustKinds[p.torso.kind === 2 ? 1 : 0] } : p.torso;
    if (!this.kitWaiting.has(key)) { this.kitWaiting.add(key); void this.drawKitPortrait(key, id, kit.group, torso); }
    return null;
  }
  private async drawKitPortrait(key: string, id: number, group: number, t: { kind: number; build: number; variant: number }) {
    try {
      if (!this.portraitFrames) this.portraitFrames = (await (await fetch(this.m.atlases.portraits!.json)).json()).frames as Frames;
      const fr = this.portraitFrames[String(id)];
      const have = new Set(this.m.kitBusts ?? []);
      const base = group * 1000000 + t.kind * 10000;
      const bust = [base + t.build * 100 + t.variant, base + t.build * 100, base].find((k) => have.has(k));
      if (!fr || bust === undefined) { this.kitShots.set(key, ''); return; }
      const [torso, sheet] = await Promise.all([this.loadImg(this.m.kitBustFiles?.[bust] ?? `generated/kitbusts/${bust}.png`), this.loadImg(this.m.atlases.portraits!.images[fr.sheet ?? 0])]);
      const c = document.createElement('canvas');
      c.width = c.height = 64;
      const g = c.getContext('2d')!;
      g.drawImage(torso, 0, 0);
      g.drawImage(sheet, fr.frame.x, fr.frame.y, 64, 64, 0, 0, 64, 64);
      const url = c.toDataURL();
      this.kitShots.set(key, url);
      if (this.save.kit && key.startsWith(`${this.save.kit}:`)) {
        document.querySelectorAll<HTMLElement>(`[data-kitmug="${id}"]`).forEach((el) => {
          el.style.backgroundImage = `url(${url})`;
          el.style.backgroundPosition = '0 0';
          el.style.backgroundSize = '100% 100%';
        });
      }
    } catch { this.kitShots.set(key, ''); }
  }

  /** Bodyshot of a player. With a kit equipped (Equipaciones), the torso is that kit's (falls back to Raimon while it draws). */
  mug(id: number, size = 64) {
    const kitted = this.kitPortrait(id);
    if (kitted) return `<span class="mug" data-kitmug="${id}" style="width:${size}px;height:${size}px;background-image:url(${kitted});background-size:100% 100%"></span>`;
    const entry = this.mugFrames[String(id)], f = entry?.frame;
    if (!f) return `<span class="mug" style="width:${size}px;height:${size}px"></span>`;
    const k = size / 64;
    const sheet = this.m.atlases.mugshots.images?.[entry.sheet ?? 0] ?? this.m.atlases.mugshots.image;
    return `<span class="mug" data-kitmug="${id}" style="width:${size}px;height:${size}px;background-image:url(${sheet});`
      + `background-position:-${f.x * k}px -${f.y * k}px;background-size:${(this.mugW[entry.sheet ?? 0] ?? 0) * k}px auto"></span>`;
  }
  icon(code: number, scale = 1) {
    const f = this.iconFrames[String(code)]?.frame;
    if (!f) return '<span class="icon"></span>';
    return `<span class="icon" style="width:${16 * scale}px;height:${16 * scale}px;background-image:url(${this.m.atlases.items.image});`
      + `background-position:-${f.x * scale}px -${f.y * scale}px;background-size:${this.iconW * scale}px auto"></span>`;
  }
  private profileIcon(size = 56, ic: { kind: 'emblem' | 'player' | 'coach'; id: number } | null = this.save.profile.icon) {
    if (ic?.kind === 'player' && this.byId.has(ic.id)) return `<span class="avatar" style="width:${size}px;height:${size}px">${this.mug(ic.id, size as 64)}</span>`;
    const list = ic?.kind === 'coach' ? this.m.profile?.coaches : this.m.profile?.emblems;
    const e = (ic ? list?.find((x) => (ic.kind === 'coach' ? x.index : x.teamId) === ic.id) : undefined) ?? this.m.profile?.emblems?.[0];
    return `<span class="avatar" style="width:${size}px;height:${size}px">${e ? `<img src="${e.texture}" alt="">` : ''}</span>`;
  }

  /**
   * 1.76 (author): the player card of the Perfil screen, shared with the profile opened from the ranking so both look the
   * same. `fav` is the favourite-team block (the own one can still be chosen there); unknown numbers show «—».
   */
  private playerCard(v: { tag: string; name: string; icon: string; frame?: string | null; crest?: string | null; pennant?: string | null;
    wins: number; owned: number; heroes: number; fav: string; best: { id: number; mean: number; rarity: Rarity } | null; bestLabel: string;
    runs: number; kills: number; bestTimeSec: number; pulls: number | null; achv: number | null }) {
    const pn = v.pennant && PENNANT_BY_ID.has(v.pennant) ? v.pennant : null;
    const achvAll = MISSIONS.filter((d) => d.kind === 'logro').length;
    const tile = (icon: UiIconName, label: string, val: string | number, cls = '') => `<div class="pf-stat ${cls}"><span class="m4-ic">${uiIcon(icon)}</span><span><small>${label}</small><b>${val}</b></span></div>`;
    return `<div class="pf-card${pn ? ' has-pn' : ''}">${pennantRibbon(pn, false)}<i class="rw-rays"></i>
        <div class="pf-avatar">${this.framed(v.icon, v.frame, true)}${v.crest && this.emblemOf(v.crest) ? `<img class="pf-crest" src="${this.emblemOf(v.crest)}" alt="">` : ''}</div>
        <div class="pf-main"><small>${v.tag}</small><b class="pf-name">${esc(v.name)}</b>
          <div class="pf-tags"><span class="pf-tag">${uiIcon('trophy')}${v.wins} ${v.wins === 1 ? 'victoria' : 'victorias'}</span><span class="pf-tag">${uiIcon('cards')}${v.owned}/${this.m.roster.length}</span>${v.heroes ? `<span class="pf-tag hero">${tr('★ {heroes} HÉROE', { heroes: v.heroes })}</span>` : ''}</div>
          <div class="pf-fav">${v.fav}</div></div>
        ${pn ? `<div class="pf-flag" title="${esc(PENNANT_BY_ID.get(pn)!.name)}">${pennantEmblem(pn)}</div>` : ''}
        ${v.best ? `<div class="pf-best" style="--rc:${RARITY_COLOR[v.best.rarity]}"><small>${v.bestLabel}</small>${this.mug(v.best.id, 72)}<b>${esc(this.byId.get(v.best.id)?.name ?? '')}</b><span>${tr('Media {mean}', { mean: v.best.mean })}</span></div>` : ''}</div>
      <div class="pf-stats">${tile('pitch', tr('Partidas'), v.runs)}${tile('trophy', tr('Victorias'), v.wins, 'gold')}${tile('fire', tr('Eliminaciones'), v.kills.toLocaleString(locale()))}${tile('clock', tr('Mejor tiempo'), fmtTime(v.bestTimeSec))}
        ${tile('capsule', tr('Fichajes'), v.pulls ?? '—')}${tile('cards', tr('Colección'), `${v.owned}/${this.m.roster.length}`)}${tile('crown', tr('Logros'), v.achv === null ? '—' : `${v.achv}/${achvAll}`)}${tile('perks', 'Héroes', v.heroes)}</div>`;
  }
  /** Fix 1.3: the stats the game really uses (rarity band, ascension, HÉROE, training: training.ts); null without data. */
  private statsOf(p: RosterEntry): Record<string, number> | null {
    // 2.0: with his warrior spirit's percentage on the stat of its technique (keshin.ts)
    return p.stats ? withKeshinStats(playerStats(this.save, p, effectiveRarity(this.save, p), isHero(this.save, p.id)), keshinOf(p.id), keshinLevel(this.save, p.id)) : null;
  }
  private rar(p: RosterEntry) {
    const r = effectiveRarity(this.save, p);
    // 1.8: a Leyenda's Campeón level
    const ch = championOf(this.save, p.id);
    if (ch) return `<span class="rar heroe campeon c${ch}">${CHAMPION_LABEL[ch]}</span>`;
    // Fix 1.31: a HÉROE is shown as HÉROE (with its hero stars), not as the rarity it came from
    if (isHero(this.save, p.id)) { const hs = this.owned(p.id)?.heroStars ?? 0; return `<span class="rar heroe">${tr('HÉROE{x1}', { x1: hs ? ` ${'★'.repeat(hs)}` : '' })}</span>`; }
    return `<span class="rar ${r}">${RARITY_LABEL[r].toUpperCase()}</span>`;
  }
  /** Type icon (generic manual of its category) framed in the element colour, plus element and category chips. */
  private techBadge(t: Technique, scale = 3) {
    const e = t.element ?? '';
    return `<span class="lv-techicon" style="--ec:${ELEMENT_COLOR[e] ?? '#8a9bbd'}">${this.icon(ICON.manual[t.type], scale)}<span class="lv-elic">${elementIcon(t.element, 10 + scale * 4)}</span></span>`;
  }
  private techChips(t: Technique) {
    const e = t.element ?? tr('Sin elemento');
    return `<div class="tchips"><span class="tcat">${TYPE_LABEL[t.type]}</span><span class="elem" style="--ec:${ELEMENT_COLOR[e] ?? '#ccc'}">${elementIcon(t.element, 12)}${esc(e)}</span></div>`;
  }
  private elem(p: RosterEntry) {
    const e = String(p.element);
    return `<span class="elem" style="--ec:${ELEMENT_COLOR[e] ?? '#ccc'}">${elementIcon(e, 12)}${esc(e)}</span>`;
  }
  private show(html: string, cls = '') {
    document.getElementById('notibar')?.remove(); // 1.88: the report notifications live on the menu only
    // refreshing the same screen must not replay entrances, lose the scroll or restart CSS animations
    const key = /<h2>(.*?)<\/h2>/.exec(html)?.[1] ?? cls;
    const same = key === this.screenKey;
    const top = same ? this.root.querySelector('.screen, .menu-root')?.scrollTop ?? 0 : 0;
    if (!same) document.querySelectorAll('.toast.screen-bound').forEach((t) => t.remove());
    if (!same) document.getElementById('zabel')?.remove(); // 2.3: Zabel's notice belongs to the screen that opened it (it stayed over the run on phones)
    this.screenKey = key;
    this.root.innerHTML = html.replace(/<img /g, '<img decoding="sync" ');
    // Fix 1.22: looping effects (card glows, sheens...) are anchored to the document clock, so a repaint (selecting a card
    // repaints the screen) continues them exactly where they were instead of restarting them
    for (const a of this.root.getAnimations({ subtree: true })) if (a.effect?.getTiming().iterations === Infinity) a.startTime = 0;
    this.root.className = `${cls}${same ? ' still' : ''}`;
    const first = this.root.firstElementChild;
    if (!same) first?.classList.add('enter');
    if (top && first) first.scrollTop = top;
    mountPreviews();
    // Fix 1.32 perf: a full-screen menu covers the game canvas: the game loop sleeps (it kept drawing the menu pitch and
    // its players 60 times a second under Mi Equipo, the collection, the shop...) and wakes on the main menu and runs
    const covered = !!this.root.querySelector(':scope > .screen');
    const loop = this.game.loop;
    if (covered && loop.running) loop.sleep();
    else if (!covered && !loop.running) loop.wake();
  }
  private on(sel: string, ev: string, fn: (e: Event, el: HTMLElement) => void, scope: ParentNode = this.root) {
    scope.querySelectorAll<HTMLElement>(sel).forEach((el) => el.addEventListener(ev, (e) => fn(e, el)));
  }
  /**
   * 1.88: a tap that always counts. Some Android Chrome never turned a tap on a banner or frame into a click
   * (BUG-954A1821: only the Banner de agradecimiento could be used), so a short touch without movement also fires it,
   * once (the click that may follow is ignored).
   */
  private onTap(sel: string, fn: (el: HTMLElement) => void, scope: ParentNode = this.root) {
    scope.querySelectorAll<HTMLElement>(sel).forEach((el) => {
      let at: { x: number; y: number; id: number } | null = null;
      // shared: the screen is redrawn on the tap, so the click that follows lands on the new copy of the button
      const fire = () => { if (performance.now() - this.tapAt < 600) return; this.tapAt = performance.now(); fn(el); };
      el.addEventListener('pointerdown', (e) => { at = e.pointerType === 'mouse' ? null : { x: e.clientX, y: e.clientY, id: e.pointerId }; });
      el.addEventListener('pointerup', (e) => {
        const a = at; at = null;
        if (a && a.id === e.pointerId && Math.hypot(e.clientX - a.x, e.clientY - a.y) < 12) fire();
      });
      el.addEventListener('pointercancel', () => { at = null; });
      el.addEventListener('click', fire);
    });
  }
  /** Two-step purchase button: the first click arms it, the second confirms. */
  private armed(el: HTMLElement, fn: () => void) {
    if (el.dataset.armed) { fn(); return; }
    el.dataset.armed = '1';
    const label = el.innerHTML; // v1.4: buttons can hold icons and price chips
    el.textContent = tr('¿Confirmar?');
    el.classList.add('arm');
    window.setTimeout(() => {
      if (!el.isConnected) return;
      delete el.dataset.armed;
      el.innerHTML = label ?? '';
      el.classList.remove('arm');
    }, 2500);
  }
  private toast(text: string, ms = 2600) {
    document.querySelectorAll('.toast').forEach((o) => o.remove()); // Fix 1.31: a new notice replaces the old one instead of piling up
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = text;
    document.body.appendChild(t);
    window.setTimeout(() => t.remove(), ms);
  }
  /** Small centred card listing what was just earned; closes itself. */
  private rewardSummary(title: string, lines: string[]) {
    document.getElementById('rsum')?.remove();
    const box = document.createElement('div');
    box.id = 'rsum';
    box.className = 'reward-summary';
    box.innerHTML = `<b>${esc(title)}</b>${lines.map((l) => `<span>${esc(l)}</span>`).join('')}`;
    box.addEventListener('click', () => box.remove());
    document.body.appendChild(box);
    window.setTimeout(() => box.remove(), 3200);
  }
  private emblemOf(team: string) { const n = teamNames(team); return this.m.profile?.emblems?.find((e) => n.includes(e.name))?.texture ?? ''; }
  /** v1.4: the technique a footballer starts each run with: the one chosen (loadout) or his first active one. */
  private startOf(p: RosterEntry) {
    const c = this.save.loadout[String(p.id)];
    return c !== undefined && this.canStartWith(p, c) ? c : startingTech(p);
  }
  /** talents are passive; techniques that only appear later in a run (or only in the shop) must be bought first */
  private canStartWith(p: RosterEntry, i: number) {
    return canStartWith(p, i, this.save.shop.techUnlocks[String(p.id)] ?? []);
  }
  /** Fix 1.53: choices saved before the lock rule fall back to the default technique in a run */
  private validLoadout() {
    return Object.fromEntries(Object.entries(this.save.loadout).filter(([id, i]) => { const p = this.byId.get(Number(id)); return !!p && this.canStartWith(p, i); }));
  }
  private setStart(key: string) {
    const [id, i] = key.split(':').map(Number);
    const p = this.byId.get(id);
    if (!p || !this.canStartWith(p, i)) { sfx('error'); return; }
    this.save.loadout[String(id)] = i;
    this.persist();
    sfx('click');
    this.toast(tr('{pName} empezará con {x1}', { pName: p.name, x1: p.techniques[i].name }), 1800);
  }
  private titlebar(title: string, back?: string) {
    return `<div class="titlebar">${back ? `<button class="tb-back" data-back><span>‹</span>${esc(tr(back))}</button>` : ''}
      <h2>${esc(tr(title))}</h2><span class="spacer"></span><span class="tb-wallet"><span class="tokens" title="${tr('Fichas de Fichaje')}">${this.save.tokens}</span><span class="coins" title="${tr('Monedas')}">${this.save.coins}</span></span></div>`;
  }
  private techHtml(t: Technique) {
    return `<div class="tech">${this.icon(ICON.manual[t.type], 2)}<div><div class="tn">${esc(tTech(t.name))}</div>
      <div class="td">${t.type === 'talento' ? `Talento pasivo · ${esc(talentText(t.id, 1) || tr('sin efecto'))}` : `${TYPE_LABEL[t.type]} · ${esc(t.element ? tEl(t.element) : '—')} · poder ${t.power}`}</div><div class="td">${esc(t.description)}</div></div></div>`;
  }
  /** Player card: bodyshot (torso + head portrait) first, animated minisprite as a corner detail. */
  private pcard(p: RosterEntry, opts: { locked?: boolean; sel?: boolean; badge?: string; captain?: boolean; anim?: number; big?: boolean } = {}) {
    /**
     * Fix 1.32: the card, redrawn as a collectible card of InaZurvivors. A frame of its own per rarity (shape, corners,
     * ornaments and metal), the portrait over the colour of its element with the club crest as a watermark, the mean in a
     * medallion, the name on a ribbon, the stats as small bars, and effects layered by rarity (sweep, foil, sparkles,
     * fire). Everything is inner elements: the old pseudo-element effects stay off this card.
     */
    const o = this.owned(p.id);
    const locked = !!opts.locked;
    const er = locked ? p.rarity : effectiveRarity(this.save, p);
    const hero = !locked && isHero(this.save, p.id);
    const starSvg = (cls: string) => starIcon(cls);
    // 1.84: the 3 extra stars of a HÉROE (crimson) or a Campeón (prismatic)
    const xs = !locked && o && hasExtraStars(this.save, p) ? extraStarsOf(this.save, p.id) : -1;
    // 1.88: the coin extra stars (violet) and, apart, the HÉROE hero stars (crimson, paid with duplicates) as before
    const extra = xs > 0 ? `<span class="hero-stars champ" title="${tr('{xs} de {EXTRA_STARS_MAX} estrellas extra', { xs, EXTRA_STARS_MAX })}">${Array.from({ length: xs }, () => starSvg('hst on')).join('')}</span>` : '';
    const hsN = hero ? Math.min(HERO_STARS_MAX, o?.heroStars ?? 0) : 0;
    const heroStars = extra + (hero ? `<span class="hero-stars" title="${tr('{hsN} de {HERO_STARS_MAX} estrellas de héroe', { hsN, HERO_STARS_MAX })}">${Array.from({ length: HERO_STARS_MAX }, (_, i) => starSvg(`hst${i < hsN ? ' on' : ''}`)).join('')}</span>` : '');
    const stars = !locked && o ? `<div class="stars" title="${tr('{stars} de {MAX_STARS} estrellas', { stars: o.stars, MAX_STARS })}">${Array.from({ length: MAX_STARS }, (_, i) => starSvg(`st${i < o.stars ? ' on' : ''}`)).join('')}${heroStars}</div>` : '<div class="stars"></div>';
    const spare = !locked && o ? sparesOf(this.save, p.id) : 0, step = !locked && o ? nextStep(this.save, p) : null;
    const canAsc = !!step && spare >= step.cost;
    const dup = canAsc ? `<span class="card-dup can-asc" title="${tr('¡Puedes ascender! ({spare} duplicados)', { spare })}">${this.uiPiece('chevron', 'up') || '▲'} ${spare}</span>`
      : spare ? `<span class="card-dup" title="${tr('Duplicados sin usar{x1}', { x1: step ? ` (${step.step === 'heroe' ? tr('HÉROE') : step.step === 'estrella' ? tr('estrella de héroe') : step.step === 'campeon' ? CHAMPION_LABEL[championOf(this.save, p.id) + 1] : 'ascenso'}: ${step.cost})` : '' })}">+${spare}${step ? ` <i>${spare}/${step.cost}</i>` : ''}</span>` : '<span></span>';
    const top = `${opts.badge ? `<span class="badge">${esc(opts.badge)}</span>` : ''}${opts.captain ? '<span class="captain-badge">C</span>' : ''}`;
    const st = !locked && p.stats ? this.statsOf(p) : null;
    const e = String(p.element ?? '');
    const crest = p.teams[0] ? this.emblemOf(p.teams[0]) : ''; // special footballers have no team
    const statKeys = ['kick', 'control', 'guard', 'body', 'speed', 'guts'] as const;
    const bars = st ? `<div class="cc-stats">${statKeys.map((k) => `<span><small>${STAT_SHORT[k]}</small><i style="--v:${st[k]}%"></i><b>${st[k]}</b></span>`).join('')}</div>` : '<div class="cc-stats empty"></div>';
    const tier = hero ? 'heroe' : er;
    const champ = !locked && o ? championOf(this.save, p.id) : 0; // 1.84: Campeón, Campeón+ and Campeón++ look different
    return `<div class="pcard cc t-${tier} r-${er}${champ ? ` champ champ-${champ}` : ''}${locked ? ' locked' : ''}${opts.sel ? ' sel' : ''}${opts.big ? ' big' : ''}${hero ? ' hero' : ''}" data-id="${p.id}" style="--rc:${RARITY_COLOR[er]};--ec:${ELEMENT_COLOR[e] ?? '#8a9bbd'}">
      ${top ? `<div class="pc-top">${top}</div>` : ''}
      <div class="cc-frame"><i class="cc-bevel"></i><i class="cc-crown"></i><i class="cc-orn tl"></i><i class="cc-orn tr"></i><i class="cc-orn bl"></i><i class="cc-orn br"></i>
        <div class="cc-face">
          <div class="cc-art${locked ? ' dark' : ''}">${crest ? `<img class="cc-crest" src="${crest}" alt="">` : ''}<i class="cc-rays"></i>
            ${this.mug(p.id, opts.big ? 152 : 112)}${locked ? '<span class="qmark">?</span><span class="lock-tag">Bloqueado</span>' : opts.big || opts.anim !== undefined ? `<span class="minisprite">${charCanvas(p.id, 2, opts.anim ?? 4)}</span>` : ''}
            <div class="cc-gem" title="${esc(e)}">${locked ? '' : elementIcon(e, 16)}</div>${this.egBadge(p.id, 'cc-eg')}
            ${st ? `<div class="cc-ovr" title="${tr('Media de estadísticas')}"><b>${statMean(st)}</b><small>${POS_LABEL[p.position] ?? p.position}</small></div>` : `<div class="cc-ovr pos"><small>${POS_LABEL[p.position] ?? p.position}</small></div>`}
            <div class="cc-name"><span>${locked ? '???' : esc(p.name)}</span></div></div>
          <div class="cc-rar">${locked ? `<span class="rar ${er}">${RARITY_LABEL[er].toUpperCase()}</span>` : this.rar(p)}</div>
          ${bars}
          <div class="pc-foot">${dup}${stars}${opts.sel ? '<span class="card-check">✔</span>' : '<span></span>'}</div>
        </div>
        <i class="cc-sweep"></i><i class="cc-foil"></i><i class="cc-sparks"></i><i class="pc-glare"></i>
      </div></div>`;
  }

  // ------------------------------------------------------------- intro cinematic
  /** `short`: only the animated logo (every visit after the first). */
  private intro(short = false): Promise<void> {
    this.stopScenes();
    setMusicContext('menu');
    const cast = [...this.m.roster].sort((a, b) => RARITY_ORDER.indexOf(b.rarity) - RARITY_ORDER.indexOf(a.rarity)).slice(0, 5);
    return new Promise((resolve) => {
      // its own screen key: with an empty key show() took it for a repeat of the empty start screen and froze its animations
      this.show(`<div class="cine cine4">${this.cineStage()}<div class="cine-shot" id="shot"></div><i class="cine-bar top"></i><i class="cine-bar bot"></i><button class="btn small blue cine-skip" id="skip">${tr('Saltar ▶▶')}</button></div>`, 'intro');
      let i = 0, timer = 0, done = false;
      const finish = () => {
        if (done) return;
        done = true;
        window.clearTimeout(timer);
        this.save.introSeen = true;
        this.persist();
        resolve();
      };
      const play = () => {
        const shot = (short ? INTRO.filter((s) => s.kind === 'logo') : INTRO)[i++];
        const box = document.getElementById('shot');
        if (!shot || !box) { finish(); return; }
        // v1.4: the words come in one by one; the last one of each sentence lands in yellow
        const words = (t: string, d0 = 0) => t.split(' ').map((w, k, a) => `<span class="cw${k === a.length - 1 ? ' hi' : ''}" style="--d:${d0 + k * 70}ms">${esc(w)}</span>`).join(' ');
        if (shot.kind === 'text') box.innerHTML = `<i class="cine-slash"></i><p class="cine-text">${words(shot.text)}</p>`;
        else if (shot.kind === 'cast') box.innerHTML = `<div class="cine-cast">${cast.map((p, k) => `<span class="cc4" style="--rc:${RARITY_COLOR[p.rarity]};--k:${k}"><i class="cc4-flash"></i>${this.mug(p.id, 128)}<b>${esc(p.name)}</b></span>`).join('')}</div><p class="cine-text">${words(shot.text, 900)}</p>`;
        else if (shot.kind === 'video') box.innerHTML = `<video src="${shot.src}" autoplay muted></video>`;
        else { // own animated title: lightning strikes, the logo slams in, the four elements orbit, balls fly past
          const bolts = Array.from({ length: 5 }, (_, k) => `<svg class="ib-bolt" style="--x:${10 + k * 20}%;--d:${k * 0.12}s" viewBox="0 0 60 100"><polygon points="38,0 6,56 26,56 16,100 56,38 34,38"/></svg>`).join('');
          const orbs = ['Fuego', 'Aire', 'Bosque', 'Montaña'].map((e, k) => `<span class="ib-orb" style="--k:${k}">${elementIcon(e, 40)}</span>`).join('');
          const balls = Array.from({ length: 6 }, (_, k) => `<i class="ib-ball" style="--y:${15 + k * 13}%;--d:${0.4 + k * 0.18}s">⚽</i>`).join('');
          const sparks = Array.from({ length: 18 }, (_, k) => `<i class="ib-spark" style="--a:${k * 20}deg;--r:${120 + (k % 3) * 60}px;--d:${0.95 + (k % 4) * 0.03}s"></i>`).join('');
          box.innerHTML = `<div class="intro-burst">${bolts}${balls}<div class="ib-orbit">${orbs}</div><i class="ib-flash"></i><i class="ib-ring"></i><i class="ib-ring r2"></i>${sparks}
            <div class="logo cine-logo ib-logo4"><h1><span class="p1">INA</span><span class="bolt p2">Z</span><span class="p3">URVIVORS</span><i class="ib-shine"></i><span class="ib-pre ib-v2">2.0</span></h1><div class="sub">${words(tr('ROGUELITE DE FÚTBOL · FANGAME'), 1300)}</div><span class="ver-badge ib-ver">${esc(VERSION_LABEL)}</span></div>${this.versionStamp()}</div>`;
          if (!this.save.settings.reducedMotion) window.setTimeout(() => { sfx('boom'); if (this.save.settings.shake <= 0) return; document.querySelector('.cine4')?.classList.add('shake'); window.setTimeout(() => document.querySelector('.cine4')?.classList.remove('shake'), 420); }, 950);
          if (!this.save.settings.reducedMotion) sfx('legend');
        }
        box.classList.remove('in');
        void box.offsetWidth;
        box.classList.add('in');
        timer = window.setTimeout(play, this.save.settings.reducedMotion ? Math.min(shot.ms, 1500) : shot.ms);
      };
      document.getElementById('skip')!.addEventListener('click', finish);
      play();
    });
  }

  // ------------------------------------------------------------- profile creation (once per profile)
  private createProfile(step = 1, draft = { name: this.save.profile.name, emblem: this.save.profile.icon.id, team: '' }) {
    this.stopScenes();
    setMusicContext('menu');
    // story teams only, those with both crest and kit first; a team without kit art is labelled, not offered as complete
    const mainTeams = new Set(this.m.mainTeams ?? []);
    const teams = eligibleTeams(this.m.roster).filter((t) => mainTeams.has(t) && !!this.emblemOf(t));
    const fullKit = (t: string) => !!this.m.kits?.[t];
    const emblems = (this.m.profile?.emblems ?? []).filter((e, i, a) => e.name !== '???' && a.findIndex((x) => x.name === e.name) === i).slice(0, 36);
    const steps = ['Nombre', 'Avatar', tr('Equipo favorito'), 'Confirmar'];
    const dots = step === 0 ? '' : steps.map((t, i) => `<span class="${i + 1 === step ? 'on' : i + 1 < step ? 'done' : ''}">${i + 1}. ${t}</span>`).join('');
    let body = '';
    const nameOk = validateUsername(draft.name).ok;
    const fixedName = this.save.onlineName; // a Google account that already reserved its name keeps it
    if (fixedName) draft.name = fixedName;
    if (step === 0) {
      body = `<h3>${tr('¡Bienvenido, entrenador!')}</h3>
        <p>${tr('Entra con Google para reservar tu nombre en todo el mundo, aparecer en el ranking mundial y guardar tu progreso en la nube. Si ya jugaste en otro dispositivo, recuperas tu club.')}</p>
        <p class="wiz-next"><button class="btn big google-btn" id="google"><span class="g-logo">G</span> ${tr('Continuar con Google')}</button></p>
        <p class="wiz-next"><button class="btn blue" id="guest">${tr('Jugar como invitado')}</button></p>
        <p class="note">${tr('Como invitado tu progreso se guarda solo en este navegador; puedes entrar con Google más tarde desde Perfil sin perderlo.')}
          <a href="privacidad.html" target="_blank" rel="noopener">${tr('Privacidad y condiciones')}</a></p>`;
    } else if (step === 1 && fixedName) {
      body = `<h3>${tr('¡Hola de nuevo! Tu nombre global ya está reservado')}</h3>
        <div class="name-field"><b class="fixed-name">${esc(fixedName)}</b></div>
        <p class="note">${tr('Es permanente y es el que aparece en el ranking.')}</p>
        <p class="wiz-next"><button class="btn big" id="next">${tr('Siguiente ▶')}</button></p>`;
    } else if (step === 1) {
      body = `<h3>${tr('¡Bienvenido, entrenador! ¿Cómo se llama el capitán de este club?')}</h3>
        <div class="name-field"><input id="pname" maxlength="${USERNAME_MAX}" autocomplete="off" spellcheck="false" value="${esc(draft.name)}" placeholder="${tr('Tu nombre de usuario')}"><span id="pcheck" class="pcheck"></span></div>
        <p class="note">${tr('{x1} <b>{x2}</b>: no se podrá cambiar después. {x3}', { x1: tr('3-20 caracteres: letras sin tildes, números y _.'), x2: tr('El nombre es permanente'), x3: !onlineConfigured() ? tr('Ranking online sin conectar: el nombre es solo de este navegador.') : signedIn() ? tr('Se reserva en todo el mundo para tu cuenta de Google al crear el perfil.') : tr('Como invitado es solo de este navegador; al entrar con Google se reserva en todo el mundo si está libre.') })}</p>
        <p class="wiz-next"><button class="btn big" id="next" ${nameOk ? '' : 'disabled'}>${tr('Siguiente ▶')}</button></p>`;
    } else if (step === 2) {
      body = `<h3>${tr('Elige el escudo de tu avatar')}</h3>
        <div class="crest-pick">${emblems.map((e) => `<button class="crest-btn${e.teamId === draft.emblem ? ' on' : ''}" data-e="${e.teamId}" title="${esc(e.name)}"><img src="${e.texture}" alt=""><small>${esc(e.name)}</small></button>`).join('')}</div>
        <p class="wiz-next"><button class="btn blue" id="prev">${tr('◀ Atrás')}</button> <button class="btn big" id="next">${tr('Siguiente ▶')}</button></p>`;
    } else if (step === 3) {
      body = `<h3>${tr('¿Cuál es tu equipo favorito?')}</h3><p class="note">${tr('Empiezas con su escudo y, si está disponible, su equipación ya puesta. Uno de tus 5 primeros fichajes será de este equipo, con rareza Épica o superior.')}</p>
        <div class="team-picks">${SAGAS.map((sg) => { const list = teams.filter((t) => sagaOf(t) === sg); return list.length ? `<h4>${tr(sg)}</h4><div class="team-grid">${list.map((t) => `<button class="team-card${t === draft.team ? ' on' : ''}" data-t="${esc(t)}">${this.emblemOf(t) ? `<img src="${this.emblemOf(t)}" alt="">` : '<span class="noemblem">⚽</span>'}<span>${esc(teamLabel(t))}</span><small class="fav-tag ${fullKit(t) ? 'full' : ''}">${fullKit(t) ? tr('Escudo y equipación') : tr('Solo escudo')}</small></button>`).join('')}</div>` : ''; }).join('')}</div>
        <p class="wiz-next"><button class="btn blue" id="prev">${tr('◀ Atrás')}</button> <button class="btn big" id="next" ${draft.team ? '' : 'disabled'}>${tr('Siguiente ▶')}</button></p>`;
    } else {
      const em = this.m.profile?.emblems.find((e) => e.teamId === draft.emblem);
      body = `<h3>${tr('Confirma tu club')}</h3>
        <div class="club-card">${em ? `<img src="${em.texture}" alt="">` : ''}<div><b>${esc(draft.name)}</b><small>${tr('Entrenador · nombre permanente')}</small>
          <span>${tr('Equipo favorito: {x1}{x2}', { x1: this.emblemOf(draft.team) ? `<img class="mini-crest" src="${this.emblemOf(draft.team)}" alt="">` : '', x2: esc(teamLabel(draft.team)) })}</span></div></div>
        <p>${tr('{x1} La máquina te dará <b>{x2}</b>, y al menos uno será de {x3} con rareza Épica o superior. Este regalo solo ocurre una vez.', { x1: this.m.kits?.[draft.team] ? tr('Empiezas con la equipación y el escudo de {x1}.', { x1: esc(teamLabel(draft.team)) }) : tr('Empiezas con el escudo de {x1}; este equipo aún no tiene equipación de combate disponible.', { x1: esc(teamLabel(draft.team)) }), x2: tr('5 futbolistas distintos'), x3: esc(teamLabel(draft.team)) })}</p>
        <p class="wiz-next"><button class="btn blue" id="prev">${tr('◀ Atrás')}</button> <button class="btn big" id="go">${tr('Crear perfil y abrir mis 5 cápsulas ▶')}</button></p>`;
    }
    this.show(`<div class="screen center"><div class="logo"><h1>INA<span class="bolt">Z</span>URVIVORS</h1><div class="sub">${tr('ROGUELITE DE FÚTBOL · FANGAME')}</div></div>
      <div class="panel welcome"><div class="wiz-steps">${dots}</div>${body}</div></div>`);
    const keepName = () => { const n = (document.getElementById('pname') as HTMLInputElement | null)?.value.trim(); if (n) draft.name = n; };
    this.on('[data-e]', 'click', (_e, el) => {
      draft.emblem = Number(el.dataset.e);
      this.root.querySelectorAll('.crest-btn').forEach((b) => b.classList.toggle('on', b === el));
      sfx('powerup');
    });
    document.getElementById('google')?.addEventListener('click', () => { void signInWithGoogle(); });
    document.getElementById('guest')?.addEventListener('click', () => this.createProfile(1, draft));
    this.on('[data-t]', 'click', (_e, el) => { const top = this.root.querySelector('.team-picks')?.scrollTop ?? 0; draft.team = el.dataset.t!; this.createProfile(3, draft); this.root.querySelector('.team-picks')!.scrollTop = top; });
    // live name check: rules at once; global availability (only when the online service exists) after a short pause
    const input = document.getElementById('pname') as HTMLInputElement | null;
    if (input) {
      let timer = 0, seq = 0;
      const check = () => {
        const v = validateUsername(input.value);
        const out = document.getElementById('pcheck')!, next = document.getElementById('next') as HTMLButtonElement;
        draft.name = input.value.trim();
        window.clearTimeout(timer);
        if (!v.ok) { out.className = 'pcheck bad'; out.textContent = v.reason; next.disabled = true; return; }
        if (!onlineConfigured()) { out.className = 'pcheck ok'; out.textContent = 'Válido'; next.disabled = false; return; }
        out.className = 'pcheck'; out.textContent = 'Comprobando…'; next.disabled = true;
        const mine = ++seq;
        timer = window.setTimeout(() => {
          usernameAvailable(v.name).then((free) => {
            if (mine !== seq) return;
            out.className = `pcheck ${free ? 'ok' : 'bad'}`; out.textContent = free ? 'Disponible' : 'Ocupado'; next.disabled = !free;
          }).catch(() => { if (mine === seq) { out.className = 'pcheck'; out.textContent = tr('No se pudo comprobar ahora'); next.disabled = false; } });
        }, 450);
      };
      input.addEventListener('input', check);
      check();
    }
    document.getElementById('next')?.addEventListener('click', () => { keepName(); this.createProfile(step + 1, draft); });
    document.getElementById('prev')?.addEventListener('click', () => this.createProfile(step - 1, draft));
    document.getElementById('go')?.addEventListener('click', async (e) => {
      if (this.save.onboardingDone) return;
      const btn = e.currentTarget as HTMLButtonElement;
      btn.disabled = true;
      // first Google connection: the name is reserved now; if someone took it meanwhile, back to step 1
      if (onlineConfigured() && signedIn() && !this.save.onlineName) {
        try { this.save.onlineName = await reserveUsername(draft.name.trim(), String(draft.emblem), ''); } catch (err) {
          const m = (err as Error).message;
          this.toast(/taken/.test(m) ? tr('Alguien acaba de reservar ese nombre: elige otro') : m, 4000);
          if (/taken|invalid_username/.test(m)) this.createProfile(1, draft); else btn.disabled = false;
          return;
        }
      }
      this.save.profile.name = validateUsername(draft.name).ok ? draft.name.trim() : 'Entrenador';
      this.save.nameLocked = true; // permanent from here on
      this.save.profile.icon = { kind: 'emblem', id: draft.emblem };
      // the crest picked as the first avatar is the player's from the start (so it stays valid after a reload)
      const picked = this.m.profile?.emblems.find((e) => e.teamId === draft.emblem);
      const pickedTeam = picked ? [...new Set(this.m.roster.flatMap((p) => p.teams))].find((t) => teamNames(t).includes(picked.name)) : undefined;
      if (pickedTeam) (this.save.teamRewards[pickedTeam] ??= {}).crest = true;
      this.save.favoriteTeam = draft.team;
      grantFavorite(this.save, draft.team, !!this.m.kits?.[draft.team]);
      setPreviewKit(this.m.kits?.[this.save.kit] ?? null);
      const got = onboardingPull(this.m.roster, this.save, Math.random, draft.team);
      this.save.captainId = got[0]?.id ?? null;
      this.captainId = this.save.captainId;
      this.persist();
      if (onlineConfigured() && signedIn() && this.save.onlineName) void this.linkCloud(); // the new club goes up to the cloud
      await this.capsuleShow(got.map((p) => ({ player: p, isNew: true, stars: 0, refund: 0 })), tr('Tus primeros fichajes'));
      this.onboardingSummary(got);
    });
  }

  private onboardingSummary(got: RosterEntry[]) {
    this.show(`<div class="screen">${this.titlebar(tr('¡Tu equipo inicial!'))}
      <div class="panel" style="margin-bottom:12px"><p>${tr('Estos {gotLength} futbolistas ya forman parte de tu colección. En cada partida empiezas con tu capitán y fichas compañeros al subir de nivel (máximo {MAX_TEAM}). Consigue más en la máquina de fichajes.', { gotLength: got.length, MAX_TEAM })}</p></div>
      <div class="grid">${got.map((p, i) => this.pcard(p, { captain: i === 0, anim: 12, big: true })).join('')}</div>
      <p style="text-align:center;margin-top:16px"><button class="btn big" id="menu">${tr('Ir al menú ▶')}</button></p></div>`);
    document.getElementById('menu')!.addEventListener('click', () => this.mainMenu());
  }

  // ------------------------------------------------------------- main menu
  private stopScenes() {
    if (this.game.scene.isActive('Menu') || this.game.scene.isPaused('Menu')) this.game.scene.stop('Menu');
    if (this.game.scene.isActive('Arena') || this.game.scene.isPaused('Arena')) this.game.scene.stop('Arena');
    if (this.game.scene.isActive('Lobby') || this.game.scene.isPaused('Lobby')) this.game.scene.stop('Lobby');
    if (this.game.scene.isActive('Replay') || this.game.scene.isPaused('Replay')) this.game.scene.stop('Replay');
  }

  mainMenu() {
    if (this.recoverRun()) return;
    const owned = this.unlockedRoster();
    // restarted when the kit changed, so the players jogging on the menu pitch wear the equipped one
    if (!this.game.scene.isActive('Menu') || this.menuKit !== this.save.kit) {
      this.stopScenes();
      this.menuKit = this.save.kit;
      this.game.scene.start('Menu', { manifest: this.m, players: owned.slice(0, 8), kit: this.m.kits?.[this.save.kit] ?? null });
    }
    setMusicContext('menu');
    rollPeriods(this.save);
    const feat = this.byId.get(this.save.captainId ?? -1) ?? owned[0] ?? null;
    const pending = pendingClaims(this.save);
    const claims = this.collectionClaims();
    const challenges = MISSIONS.filter((d) => d.kind === 'diaria' || d.kind === 'semanal').filter((d) => !isClaimed(this.save, d)).slice(0, 3);
    const tile = (go: string, icon: UiIconName, label: string, sub: string, badge = 0, hot = false) => `<button class="m4-tile${hot ? ' hot' : ''}" data-go="${go}"><span class="m4-ic">${uiIcon(icon)}</span><span class="m4-tx"><b>${label}</b><small>${sub}</small></span>${badge ? `<span class="m4-badge">${badge}</span>` : ''}</button>`;
    const group = (cls: string, icon: UiIconName, title: string, tiles: string) => `<div class="m4-group ${cls}"><h4>${uiIcon(icon)}${title}</h4><div class="m4-grid">${tiles}</div></div>`;
    const squad = squadOf(this.save, this.byId);
    const unseenLog = this.save.devlogSeen !== newsKey();
    const pass = passStatus(this.save, serverNow());
    const news = allNews(true, serverNow())[0];
    const featR = feat ? effectiveRarity(this.save, feat) : 'comun';
    const featStats = feat ? this.statsOf(feat) : null;
    const promo = this.promoSlides();
    const seasonNow = activeSeason(serverNow()); // 2.1
    this.show(`<div class="menu-root m4"><div class="menu-lights"><i></i><i></i><i></i><b></b><b></b><b></b></div>
      <header class="m4-top">
        <button class="m4-profile" data-go="profile">${this.profileIcon(46)}${this.save.crest && this.emblemOf(this.save.crest) ? `<img class="m4-crest" src="${this.emblemOf(this.save.crest)}" alt="">` : ''}
          <span><b>${esc(this.save.profile.name)}</b><small>${tr('{ownedLength}/{rosterLength} futbolistas · {wins} victorias', { ownedLength: owned.length, rosterLength: this.m.roster.length, wins: this.save.stats.wins })}</small></span></button>
        <button class="m4-clanchip" id="m4clan" data-go="clan">${this.clanChipHtml()}</button>
        <span class="spacer"></span>
        <div class="m4-wallet"><span class="tokens" title="${tr('Fichas de Fichaje')}">${this.save.tokens}</span><span class="coins" title="${tr('Monedas')}">${this.save.coins}</span><span class="egt" title="${tr('Fichas EG')}">${this.egIcon(16)}${egTokens(this.save)}</span></div>
        <nav class="m4-tools">${this.tiktokLink()}
          <a class="m4-tool m4-itch" href="${CREATOR_GAMES_URL}" target="_blank" rel="noopener noreferrer" title="${tr('Otros juegos del creador')}" aria-label="${tr('Otros juegos del creador (se abre en una pestaña nueva)')}">${GAMEPAD_SVG}</a>
          <button class="m4-tool" data-go="devlog" title="${tr('Noticias')}">${uiIcon('news')}<span>${tr('Noticias')}</span>${unseenLog ? '<i class="m4-dot"></i>' : ''}</button>
          <button class="m4-tool" data-go="options" title="${tr('Ajustes')}">${uiIcon('cog')}<span>${tr('Ajustes')}</span></button>
          <button class="m4-tool" id="mute" title="${tr('Sonido')}" aria-pressed="${!this.save.settings.muted}">${uiIcon(this.save.settings.muted ? 'soundOff' : 'soundOn')}</button>
          <button class="m4-tool" id="menubug" title="${tr('Reportar un bug')}">${uiIcon('bug')}</button></nav>
      </header>
      <div class="m4-stage">
        <section class="m4-left">
          ${this.promoHtml(promo)}
          <div class="logo menu-logo brand"><svg class="logo-bolt" viewBox="0 0 60 100"><polygon points="38,0 6,56 26,56 16,100 56,38 34,38"/></svg>
            <h1 aria-label="InaZurvivors"><span class="b1">Ina</span><span class="bz">Z</span><span class="b2">urvivors</span></h1><div class="sub">${tr('ROGUELITE DE FÚTBOL · FANGAME')} <span class="ver-badge">${esc(VERSION_LABEL)}</span></div></div>
          <div class="m4-main">
            <button class="m4-play" data-go="play"><i class="m4-shine"></i><span class="m4-play-ic">${uiIcon('play')}</span>
              <span class="m4-tx"><b>${tr('JUGAR')}</b><small>${squad[0] ? tr('Capitán: {x1} · Rango {difficulty}', { x1: esc(squad[0].name), difficulty: this.save.difficulty }) : tr('Prepara tu equipo')}</small></span></button>
            <button class="m4-team" data-go="squad"><span class="m4-tx"><b>${tr('MI EQUIPO')}</b><small>${tr('{squadLength}/{SQUAD_SIZE} candidatos', { squadLength: squad.length, SQUAD_SIZE })}</small></span>
              <span class="m4-faces">${squad.length ? this.teamFaces(squad) : uiIcon('team')}</span></button>
          </div>
          ${group('g-club', 'team', tr('TU CLUB'), tile('collection', 'cards', tr('COLECCIÓN'), claims ? tr('¡Recompensas!') : tr('{ownedLength} de {rosterLength}', { ownedLength: owned.length, rosterLength: this.m.roster.length }), claims, !!claims)
            + `<button class="m4-tile hot eg-tile" data-go="keshin"><span class="m4-ic">${this.m.eg ? `<img src="${this.m.eg.insignia}" alt="">` : uiIcon('fire')}</span><span class="m4-tx"><b>${tr('ESPÍRITUS')}</b><small>${tr('{egTokens} Fichas EG', { egTokens: egTokens(this.save) })}</small></span><em class="eg-new">2.0</em></button>`
            + tile('perks', 'perks', tr('MEJORAS'), tr('Potencia permanente')) + tile('shop', 'bolt', tr('TÉCNICAS'), tr('Manuales'))
            + tile('training', 'target', tr('ENTRENAMIENTO'), tr('Prueba técnicas')) + tile('coaches', 'crown', tr('ENTRENADORES'), tr('{x1} de {COACHESLength}', { x1: this.save.coaches?.owned.length ?? 0, COACHESLength: COACHES.length })) + tile('kits', 'shirt', tr('EQUIPACIONES'), tr('Uniforme y escudo')) + tile('gear', 'boot', tr('EQUIPAMIENTO'), tr('Botas y accesorios')) + tile('hall', 'trophy', tr('SALÓN'), tr('{x1} victorias', { x1: (this.save.hall ?? []).length })))}
          ${group('g-sign', 'capsule', tr('FICHAJES'), tile('gacha', 'capsule', tr('FICHAJES'), tr('{tokens} fichas', { tokens: this.save.tokens }), 0, true) + (thanksActive(serverNow()) ? tile('thanksev', 'gift', tr('AGRADECIMIENTO'), tr('{x1} fichas de evento', { x1: this.save.eventTokens ?? 0 }), 0, true) : '') + (eventActive(serverNow()) ? tile('pnevent', 'gift', tr('EVENTO'), tr('Banners de leyenda'), 0, true) : '') + tile('daily', 'shop', tr('TIENDA'), tr('Ofertas del día')) + tile('gts', 'gts', tr('GTS'), tr('Intercambios online')) + tile('codes', 'gift', tr('CÓDIGOS'), tr('Canjea regalos')))}
          ${group('g-comp', 'crown', tr('COMPETICIÓN'), tile('missions', 'missions', tr('MISIONES'), pending ? tr('¡Por recoger!') : tr('Recompensas'), pending, !!pending)
            + (seasonNow ? (() => { const st = seasonOf(this.save, seasonNow), n = claimable(st, 'normal').length + claimable(st, 'premium').length;
              return tile('season', 'crown', tr('TEMPORADA'), n ? tr('¡Premios por reclamar!') : tr('Pase · nivel {levelOf}', { levelOf: levelOf(st.xp) }), n, true); })() : '')
            + tile('pass', 'ticket', tr('PASE'), pass.available ? tr('¡Recompensa lista!') : tr('Vuelve mañana'), pass.available ? 1 : 0, pass.available) + tile('ranking', 'crown', tr('RANKING'), onlineConfigured() ? tr('Global') : tr('Tus marcas')) + tile('lobby', 'team', tr('SALA'), tr('Todos los jugadores'), 0, true)
            + tile('road', 'trophy', tr('ROAD TO FF'), this.save.road?.active ? tr('Partido {x1} en juego', { x1: this.save.road.active.level + 1 }) : tr('Nuevo modo'), 0, true) + tile('clan', 'team', tr('CLANES'), this.save.clanSeen ? esc(this.save.clanSeen.name) : tr('Juegos del Clan'), 0, true) + tile('tierlist', 'cards', tr('TIERLISTS'), tr('Crea y comparte'), 0, true) + tile('coop', 'team', tr('COOP'), tr('pre-2.0 · en pruebas'), 0, true) + tile('friends', 'gift', tr('AMIGOS'), tr('Invita al coop')))}
        </section>
        ${feat ? `<section class="m4-hero" data-go="squad" style="--rc:${RARITY_COLOR[featR]}"><div class="m4-aura"></div><div class="m4-ring"></div>
          <div class="m4-hero-art">${this.mug(feat.id, 256)}<span class="m4-hero-sprite">${charCanvas(feat.id, 3, 12)}</span></div>
          <div class="m4-plate"><small>${this.captainId === feat.id ? tr('TU CAPITÁN') : tr('TU ESTRELLA')}</small><b>${esc(feat.name)}</b><div class="m4-tags">${this.rar(feat)} ${this.elem(feat)}</div>
            ${featStats ? `<div class="m4-hstats"><span class="m4-ovr"><small>${tr('MEDIA')}</small>${statMean(featStats)}</span><div class="hero-stats">${statRadar(featStats, STAT_SHORT, RARITY_COLOR[featR])}</div></div>
            <button class="btn small blue" data-sheet="${feat.id}">${tr('Ver ficha')}</button>` : ''}</div></section>` : '<span class="m4-hero"></span>'}
        <aside class="m4-right">
          <button class="m4-news" data-go="devlog"><span class="m4-news-head">${tr('{x1}NOTICIAS{x2}', { x1: uiIcon('news'), x2: unseenLog ? '<em>NUEVO</em>' : '' })}</span>
            <b>${esc(news?.title ?? CURRENT_PUBLIC.title)}</b><span>${esc(news?.summary ?? CURRENT_PUBLIC.tagline)}</span><small>${tr('{VERSION_LABEL} · Leer más ›', { VERSION_LABEL: esc(VERSION_LABEL) })}</small></button>
          <div class="m4-card"><h3>${tr('{x1}Desafíos', { x1: uiIcon('target') })}</h3>${challenges.map((d) => { const pc = Math.min(100, Math.round(missionProgress(this.save, d) / d.goal * 100)); return `<div class="m4-chal"><span>${esc(d.label)}</span><em>${pc}%</em><i style="--p:${pc}%"></i></div>`; }).join('') || `<div class="note">${tr('¡Todo completado por hoy!')}</div>`}</div>
          <div class="m4-card"><h3>${tr('{x1}Arenas', { x1: uiIcon('pitch') })}</h3>${this.m.maps.map((mp) => { const ok = this.save.clearedMaps.includes(mp.id); return `<div class="m4-arena${ok ? ' ok' : ''}"><span class="m4-chk">${ok ? '✔' : ''}</span><span>${esc(mp.name)}</span><span class="m4-ranks">${RANK_ORDER.map((r) => `<i class="${(this.save.clearedRanks[mp.id] ?? []).includes(r) ? 'on' : ''}">${r}</i>`).join('')}</span></div>`; }).join('')}
            <div class="m4-best">${tr('{x1}Mejor tiempo <b>{bestTimeSec}</b> · <b>{kills}</b> {x2}', { x1: uiIcon('clock'), bestTimeSec: fmtTime(this.save.stats.bestTimeSec), kills: this.save.stats.kills, x2: tr('eliminaciones') })}</div></div>
          <div class="m4-card m4-tier" data-go="tierlist"><h3>${tr('{x1}Tierlists de la comunidad', { x1: uiIcon('cards') })}</h3><div id="menutier">${onlineConfigured() ? '<div class="note">Cargando…</div>' : `<div class="note">${tr('Disponible con el servicio online.')}</div>`}</div></div>
          <div class="m4-card m4-gts" data-go="gts"><h3>${tr('{x1}GTS · Intercambios', { x1: uiIcon('gts') })}</h3><div id="menugts">${onlineConfigured() ? '<div class="note">Cargando…</div>' : `<div class="note">${tr('Disponible con el servicio online.')}</div>`}</div></div>
          <button class="m4-help" data-go="tutorial">${tr('{x1}¿Cómo se juega?', { x1: uiIcon('help') })}</button>
        </aside>
      </div>
      <section class="m4-wide">
        <div class="m4-card wide-rank"><div class="wide-head"><h3>${tr('{x1}Ranking mundial', { x1: uiIcon('crown') })}</h3><button class="btn small" data-go="ranking">${tr('Ver todo')}</button></div>
          <div id="menurank">${onlineConfigured() ? '<div class="note">Cargando…</div>' : `<div class="note">${tr('Disponible cuando se active el servicio online.')}</div>`}</div></div>
        <div class="m4-card wide-pass" id="widepass">${this.passWidget()}</div>
      </section>
      <footer class="menu-foot legal-foot"><span>${tr('Fangame gratuito, sin ánimo de lucro y no oficial, creado por AstraStorm17. Inazuma Eleven y todos sus derechos pertenecen a LEVEL-5 y sus respectivos titulares. Este proyecto no está afiliado, patrocinado ni aprobado por LEVEL-5. ·')} <button id="credits" class="legal-link">${tr('Aviso legal')}</button> · ${esc(VERSION_LABEL)}</span></footer>
      ${musicUnlocked() ? '' : `<div class="audio-hint">${tr('Haz clic en cualquier parte para activar la música')}</div>`}</div>`, 'menu-mode');
    this.on('[data-sheet]', 'click', (e, el) => { e.stopPropagation(); this.collection(Number(el.dataset.sheet)); });
    // Fix 1.31: notice when the Colección has something new to collect (once per new reward, not on every visit)
    if (claims > Math.max(0, this.claimsAnnounced)) window.setTimeout(() => { if (this.screenKey === 'menu-mode') this.claimNotice(this.teamClaimList(), tr('¡Para recoger en la Colección!')); }, 400);
    this.claimsAnnounced = claims;
    // 2.0 (author): the launch intro, once per browser, before anything else of the menu
    if (this.launch20Pending()) window.setTimeout(() => { if (this.screenKey === 'menu-mode' && !this.game.scene.isActive('Arena')) this.launch20(); }, 300);
    // 2.0: the Espíritus Guerreros are introduced once per save (no gift: Fichas EG are earned in rank X)
    if (giveKeshinGift(this.save)) {
      this.persist();
      // after any other notice of the menu (Road, achievements): it waits until none is open, and never shows over a run
      const show = (tries: number) => { if (this.screenKey !== 'menu-mode') return; if ((document.querySelector('.modal, .eg-intro, .launch20') || this.game.scene.isActive('Arena')) && tries) { window.setTimeout(() => show(tries - 1), 1000); return; } this.keshinIntro(); };
      window.setTimeout(() => show(30), claims > 0 ? 4200 : 1200);
    }
    // v1.5: an achievement just completed is announced once, with its medal (the claim itself stays in Recompensas)
    recordCollection(this.save, this.m.roster, this.m.mainTeams ?? [], this.auraMaxStat());
    const newFlags = grantAchievementPennants(this.save, this.m.roster); // v1.65: 200 footballers, a Leyenda
    if (newFlags.length) { this.persist(); window.setTimeout(() => this.toast(tr('¡Logro! {x1}. Póntelo en tu Perfil.', { x1: newFlags.map((f) => /^(Marco|Banner|Banderín) /.test(f.name) ? f.name : `${isFrame(f) ? 'Marco' : 'Banner'} ${f.name}`).join(', ') }), 5000), 1500); }
    const shown = new Set(this.save.achShown ?? []);
    const fresh = MISSIONS.filter((d) => d.kind === 'logro' && isClaimable(this.save, d) && !shown.has(d.id));
    if (fresh.length) {
      this.save.achShown = [...shown, ...fresh.map((d) => d.id)];
      this.persist();
      window.setTimeout(() => { if (this.screenKey === 'menu-mode') this.achPop(fresh.map((d) => d.label), fresh[0].tokens); }, claims > 0 ? 2600 : 900);
    }
    this.on('[data-go]', 'click', (_e, el) => {
      const go = el.dataset.go;
      if (go === 'play') {
        if (!this.save.squad.length && this.unlockedRoster().length) { fillSquad(this.save, this.m.roster); this.persist(); } // first game: best seven
        if (squadOf(this.save, this.byId).length) this.mapSelect(); else this.captainSelect();
      }
      if (go === 'squad') this.captainSelect();
      if (go === 'training') this.trainingField(); // v1.6
      if (go === 'coaches') this.coachesScreen(); // pre-2.0
      if (go === 'keshin') this.keshinScreen(); // 2.0
      if (go === 'road') this.roadScreen();
      if (go === 'tierlist') this.tierlistScreen(); // 1.9
      if (go === 'clan') void this.clanScreen(); // 1.93
      if (go === 'pnevent') this.pennantEvent(); // v1.65
      if (go === 'thanksev') { this.gachaBanner = 'evento'; this.gacha(); } // 1.75
      if (go === 'collection') this.collection();
      if (go === 'gts') void this.gts(); // 1.8
      if (go === 'coop') this.coopLobby(); // pre-2.0
      if (go === 'friends') void this.friendsScreen();
      if (go === 'gacha') this.gacha();
      if (go === 'missions') this.missions();
      if (go === 'perks') this.perks();
      if (go === 'shop') this.shop();
      if (go === 'daily') this.dailyShop();
      if (go === 'kits') this.kits();
      if (go === 'gear') this.gearScreen();
      if (go === 'options') this.options();
      if (go === 'profile') this.profile();
      if (go === 'devlog') this.devlog();
      if (go === 'ranking') this.ranking();
      if (go === 'lobby') void this.lobbyScreen();
      if (go === 'hall') this.hallOfFame();
      if (go === 'pass') this.weeklyPass();
      if (go === 'season') this.seasonScreen(); // 2.1
      if (go === 'codes') this.codesModal();
      if (go === 'tutorial') this.tutorial();
    });
    document.getElementById('credits')!.addEventListener('click', () => this.credits());
    document.getElementById('menubug')!.addEventListener('click', () => this.bugReportModal());
    // toggled in place: the menu is never rebuilt for a button press
    document.getElementById('mute')!.addEventListener('click', (e) => {
      this.save.settings.muted = !this.save.settings.muted;
      this.persist();
      this.applyAudio();
      const b = e.currentTarget as HTMLElement;
      b.innerHTML = uiIcon(this.save.settings.muted ? 'soundOff' : 'soundOn');
      b.setAttribute('aria-pressed', String(!this.save.settings.muted));
    });
    document.addEventListener('pointerdown', () => document.querySelector('.audio-hint')?.remove(), { once: true });
    if (onlineConfigured()) void this.fillMenuRank();
    if (onlineConfigured()) void this.fillMenuGts(); // 1.8
    if (onlineConfigured()) { this.tierFeedCache = null; void this.fillTierFeed('menutier', 1, 24); } // 1.9
    this.wirePromo(promo); // 1.9
    this.goldKeyUnlock(); // 2.1: the Llave dorada's unlock, once
    void this.seasonPrizes(); // 2.1: the final ranking of a season that ended
    void this.sectorSync(); // 2.2: the side, the weeks to collect and the week's decree
    void this.fillMenuClan(); // 1.93: the clan chip and the weekly clan prizes
    void this.claimBugBounty(); // 1.85: rewards for fixed bug reports
    this.notiBar(); // 1.88
    if (onlineConfigured() && signedIn()) void this.gtsSync().catch(() => undefined); // 1.8: a trade that happened while away arrives here
    document.getElementById('wpclaim')?.addEventListener('click', (e) => { (e.target as HTMLButtonElement).disabled = true; this.claimPassNow(() => this.mainMenu()); });
    if (this.save.tutorial === 'pendiente' && this.save.onboardingDone) window.setTimeout(() => { if (this.screenKey === 'menu-mode') this.tutorial(); }, 400);
    // 1.75 (author): the thank-you notice, once, while the Banner de agradecimiento is open
    else if (thanksActive(serverNow()) && !this.save.thanksSeen && this.save.onboardingDone) window.setTimeout(() => { if (this.screenKey === 'menu-mode') this.thanksNotice(); }, 600);
    else if (!this.save.roadIntroSeen && this.save.onboardingDone) window.setTimeout(() => { if (this.screenKey === 'menu-mode') this.roadIntro(); }, 700); // pre-2.0
  }

  // ---- 1.9 (author: a juicier menu with the news and new banners in big): the promo carousel at the top of the menu
  private promoTimer = 0;
  private promoIndex = 0;
  private promoSlides() {
    const now = serverNow();
    const art = (ids: number[], size = 128) => ids.map((id, i) => `<span class="m5-who" style="--i:${i}">${this.mug(id, size as 64)}</span>`).join('');
    const slides: { kicker: string; title: string; text: string; cta: string; color: string; art: string; tag?: string; act: () => void }[] = [];
    const news = allNews(true, serverNow())[0];
    if (thanksActive(now)) {
      const pool = bannerPool(this.m.roster, 'evento').filter((p) => p.exclusive);
      slides.push({ kicker: tr('BANNER ESPECIAL'), title: BANNERS.evento.label, text: BANNERS.evento.tagline, cta: tr('¡Fichar ahora!'), color: BANNERS.evento.color, tag: tr('LIMITADO'),
        art: art(featured(pool, 3).map((p) => p.id)), act: () => { this.gachaBanner = 'evento'; this.gacha(); } });
    }
    // author: InaZurvivors x BlueLock — once open, its slide; before, «Próximamente» with the days left and only silhouettes
    if (bluelockActive(now)) slides.push({ kicker: tr('COLABORACIÓN · LIMITADO'), title: tr('InaZurvivors x BlueLock'), text: tr('Nagi e Isagi, solo en su banner. Termina en {x1}.', { x1: this.leftText(bluelockLeftMs(now)) }), cta: tr('¡Fichar ahora!'), color: BANNERS.bluelock.color, tag: tr('NUEVO'),
      art: `<span class="m5-bl">${this.blLogo()}<span class="m5-bl-who">${art(BLUELOCK_EVENT.players)}</span></span>`, act: () => { this.gachaBanner = 'bluelock'; this.gacha(); } });
    else if (bluelockUpcoming(now)) {
      const d = bluelockDaysToStart(now);
      slides.unshift({ kicker: tr('PRÓXIMAMENTE'), title: tr('Nueva colaboración'), text: d > 1 ? tr('Faltan {d} días. ¿Quiénes serán?', { d }) : tr('¡Mañana! ¿Quiénes serán?'), cta: `${d > 1 ? tr('{d} días', { d }) : 'Mañana'}`, color: '#2a5ad8', tag: d > 1 ? tr('{d} DÍAS', { d }) : tr('MAÑANA'),
        art: `<span class="m5-soon"><span class="m5-sil">${art(BLUELOCK_EVENT.players)}</span><b class="m5-q">?</b></span>`, act: () => this.toast(d > 1 ? tr('La nueva colaboración llega en {d} días', { d }) : tr('La nueva colaboración llega mañana')) });
    }
    // 2.1 (author): the season pass — once open, its slide; before, «Próximo pase» with its date and the two stars in silhouette
    const sOpen = activeSeason(now), sNext = upcomingSeason(now);
    if (sOpen) slides.unshift({ kicker: tr('{x1} · PASE', { x1: sOpen.name.toUpperCase() }), title: sOpen.subtitle, text: tr('{LEVELS} niveles jugando partidas. Llave normal en la tienda, llave dorada en los rivales: Cronus al instante y Super Zanark en el nivel 100. Termina en {x1}.', { LEVELS, x1: this.leftText(seasonEnd(sOpen) - +now) }),
      cta: tr('Ver el pase'), color: '#ffcc2a', tag: tr('NUEVO'), art: `<span class="m5-sp">${this.m.pase ? `<img class="m5-key" src="${this.m.pase.dorada}" alt="">` : ''}${art(sOpen.stars)}</span>`, act: () => this.seasonScreen() });
    else if (sNext) {
      const d = daysTo(seasonStart(sNext), now), when = new Date(seasonStart(sNext)).toLocaleString(locale(), { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid' });
      slides.unshift({ kicker: tr('PRÓXIMO PASE'), title: `${sNext.name}: ${sNext.subtitle}`, text: tr('Llega el {when}: {LEVELS} niveles, una llave normal y una dorada, y dos futbolistas nuevos. ¿Quiénes serán?', { when, LEVELS }),
        cta: d > 1 ? tr('{d} días', { d }) : 'Mañana', color: '#ffcc2a', tag: d > 1 ? tr('{d} DÍAS', { d }) : tr('MAÑANA'),
        art: `<span class="m5-soon"><span class="m5-sil">${art(sNext.stars)}</span><b class="m5-q">?</b></span>`, act: () => this.devlog('pase-temporada-1') });
    }
    // (author) Rango Z: the Tuesday update at 12:00; before it, the days left, then a week of «Nuevo»
    if (!rankZOpen(now)) slides.unshift({ kicker: tr('PRÓXIMAMENTE · MARTES 12:00'), title: tr('Rango Z'), text: tr('Más allá del X: más difícil que nada, más puntos en el ranking y las mejores recompensas. {rankZCountdown}.', { rankZCountdown: this.rankZCountdown(true) }),
      cta: this.rankZCountdown(), color: '#ff2a45', tag: rankZDaysLeft(now) > 1 ? tr('{rankZDaysLeft} DÍAS', { rankZDaysLeft: rankZDaysLeft(now) }) : tr('MAÑANA'), art: `<span class="m5-big m5-rz">${zEmblem()}</span>`, act: () => this.toast(tr('El Rango Z llega el martes 10 a las 12:00 · {rankZCountdown}', { rankZCountdown: this.rankZCountdown(true) })) });
    else if (rankZLeftMs(now) === 0 && +now - Date.parse('2026-11-10T12:00:00+01:00') < 7 * 86_400_000) slides.unshift({ kicker: tr('NUEVO RANGO'), title: tr('Rango Z'), text: tr('Más allá del X. Recompensas ×3,2, 60 fichas la primera victoria por arena, 3 Fichas EG por mapa y ×7 de puntos en el ranking.'),
      cta: tr('¡Atrévete!'), color: '#ff2a45', tag: tr('NUEVO'), art: `<span class="m5-big m5-rz">${zEmblem()}</span>`, act: () => { this.save.difficulty = 'Z'; this.persist(); this.mapSelect(); } });
    // a saga machine in the spotlight, a different one each day
    const b = featuredMachine(now); // (author) and its good rarities are likelier today (banners.FEATURED_BOOST)
    slides.push({ kicker: tr('MÁQUINA DESTACADA DE HOY'), title: BANNERS[b].label, text: BANNERS[b].tagline, cta: tr('¡A fichar!'), color: BANNERS[b].color, tag: tr('HOY'),
      art: art(featured(bannerPool(this.m.roster, b), 3).map((p) => p.id)), act: () => { this.gachaBanner = b; this.gacha(); } });
    if (eventActive(now)) slides.push({ kicker: tr('EVENTO'), title: tr('Banners de leyenda'), text: tr('Banners y marcos de perfil por tiempo limitado.'), cta: tr('Ver el evento'), color: '#ffd84a', tag: tr('EVENTO'), art: `<span class="m5-big">${uiIcon('gift')}</span>`, act: () => this.pennantEvent() });
    if (this.byId.has(JADEN_ID)) slides.push({ kicker: tr('MODO DESAFÍO'), title: tr('Road to Fútbol Frontier'), text: tr('Gana en Máxima y llévate a Jaden Evans.'), cta: tr('Jugar el camino'), color: '#ff8a2a', tag: tr('EXCLUSIVO'),
      art: art([JADEN_ID], 160), act: () => this.roadScreen() });
    slides.push({ kicker: tr('NUEVO · CLANES'), title: tr('Juegos del Clan'), text: this.save.clanSeen ? tr('{clanSeenName}: 1 partida al día en la Colina de los Cerezos. Premios cada lunes.', { clanSeenName: this.save.clanSeen.name }) : tr('Funda o únete a un clan, jugad 1 partida al día cada uno y ganad premios cada semana.'),
      cta: this.save.clanSeen ? tr('Jugar por el clan') : tr('Ver los clanes'), color: '#3fd07a', tag: tr('NUEVO'), art: `<span class="m5-big">${uiIcon('team')}</span>`, act: () => void this.clanScreen(this.save.clanSeen ? 'juegos' : undefined) });
    slides.push({ kicker: tr('NUEVO · COMUNIDAD'), title: tr('Crea tu tierlist'), text: tr('Ordena a tus futbolistas favoritos de S a D y publícala: todo el mundo la verá en el menú.'), cta: tr('Crear la mía'), color: '#ff4f6a', tag: tr('NUEVO'),
      art: `<span class="m5-tiers">${TIERS.map((k) => `<i style="--tc:${TIER_COLOR[k]}">${k}</i>`).join('')}</span>`, act: () => { this.tierTab = 'crear'; this.tierlistScreen(); } });
    if (news) slides.push({ kicker: `NOTICIAS · ${VERSION_LABEL}`, title: news.title, text: news.summary, cta: tr('Leer más'), color: '#4fb3ff', tag: this.save.devlogSeen !== newsKey() ? tr('NUEVO') : undefined,
      art: `<span class="m5-big">${uiIcon('news')}</span>`, act: () => this.devlog() });
    // 2.0 (author): the first slide of the menu explains the update and opens its news
    slides.unshift({ kicker: tr('NUEVA VERSIÓN'), title: tr('InaZurvivors 2.0 · Espíritus Guerreros'), text: tr('19 espíritus con definitiva (R), Rango Z, 6 arenas nuevas, técnicas combinadas de leyenda y Fichas EG en clanes y códigos. Toca para verlo todo.'),
      cta: tr('Ver novedades'), color: '#c45aff', tag: '2.0', art: `<span class="m5-big m5-v2">2.0</span>`, act: () => this.devlog('version-2-0-espiritus') });
    // 2.2 (author): the Sector Quinto, first: choose a side for good; afterwards, the side's week
    if (sectorOpen(now)) {
      const sd = this.save.sector?.side, wk = weeklyDecree(now);
      const logos = this.m.sector ? `<span class="m5-sq"><img src="${this.m.sector.sector}" alt=""><b>${this.uiPiece('vs') || 'VS'}</b><img src="${this.m.sector.resistencia}" alt=""></span>` : '';
      slides.unshift(sd
        ? { kicker: tr('SECTOR QUINTO · SEMANA {x1}', { x1: (sectorWeek(now) ?? 0) + 1 }), title: tr('Tu bando: {x1}', { x1: SIDES[sd].name }), text: tr('{x1}Cada victoria suma para tu bando; el jueves a las 12:00 se cuenta la semana.', { x1: wk ? tr('{element} +20 % esta semana. ', { element: wk.element }) : '' }),
          cta: tr('Ver la semana'), color: SIDES[sd].color, tag: tr('SEMANA'), art: logos, act: () => void this.sectorScreen() }
        : { kicker: tr('NUEVO · SECTOR QUINTO'), title: tr('¿Sector Quinto o Resistencia?'), text: tr('Elige tu bando para toda la temporada. Cada semana gana el que mejor juegue: marco, fichas, monedas y copias de sus tres estrellas.'),
          cta: tr('Elegir bando'), color: '#3f6bff', tag: tr('NUEVO'), art: logos, act: () => void this.sectorScreen() });
    }
    // 2.1 (author): the season pass (or its teaser) leads the carousel
    const sp = slides.findIndex((x) => x.kicker === tr('PRÓXIMO PASE') || x.kicker.endsWith(tr('{x1} · PASE', { x1: '' }))); // 2.3: the kickers are translated
    if (sp > 0) slides.unshift(...slides.splice(sp, 1));
    // 2.2: until the player has a side, «elige tu bando» goes before the pass; afterwards right behind it
    const sq = slides.findIndex((x) => x.kicker.includes(tr('SECTOR QUINTO')));
    if (sq > 0) slides.splice(this.save.sector?.side ? 1 : 0, 0, ...slides.splice(sq, 1));
    return slides;
  }
  private promoHtml(slides: ReturnType<App['promoSlides']>) {
    const i = this.promoIndex % slides.length;
    return `<section class="m5-promo" id="m5promo" style="--pc:${slides[i].color}"><div class="m5-track">${slides.map((s, k) => `<button class="m5-slide${k === i ? ' on' : ''}" data-promo="${k}" style="--pc:${s.color}" ${k === i ? '' : 'tabindex="-1" aria-hidden="true"'}>
        <span class="m5-bg"></span><i class="m5-shine"></i><span class="m5-art">${s.art}</span>
        <span class="m5-txt"><small>${esc(s.kicker)}</small><b>${esc(s.title)}</b><span>${esc(s.text)}</span><em class="m5-cta">${esc(s.cta)} ›</em></span>${s.tag ? `<span class="m5-tag">${esc(s.tag)}</span>` : ''}</button>`).join('')}</div>
      <div class="m5-dots">${slides.map((_s, k) => `<i class="${k === i ? 'on' : ''}" data-pdot="${k}"></i>`).join('')}</div>
      <button class="m5-arrow l" data-pmove="-1" aria-label="${tr('Anterior')}">‹</button><button class="m5-arrow r" data-pmove="1" aria-label="${tr('Siguiente')}">›</button></section>`;
  }
  private wirePromo(slides: ReturnType<App['promoSlides']>) {
    const box = document.getElementById('m5promo');
    if (!box) return;
    window.clearInterval(this.promoTimer);
    const go = (k: number) => {
      this.promoIndex = (k + slides.length) % slides.length;
      box.style.setProperty('--pc', slides[this.promoIndex].color);
      box.querySelectorAll<HTMLElement>('.m5-slide').forEach((el, j) => { const on = j === this.promoIndex; el.classList.toggle('on', on); el.tabIndex = on ? 0 : -1; el.setAttribute('aria-hidden', String(!on)); });
      box.querySelectorAll<HTMLElement>('[data-pdot]').forEach((el, j) => el.classList.toggle('on', j === this.promoIndex));
    };
    const restart = () => {
      window.clearInterval(this.promoTimer);
      this.promoTimer = window.setInterval(() => { if (!document.body.contains(box)) { window.clearInterval(this.promoTimer); return; } if (!document.hidden) go(this.promoIndex + 1); }, 5500);
    };
    restart();
    let downX: number | null = null, swiped = false;
    box.addEventListener('pointerdown', (e) => { downX = e.clientX; swiped = false; });
    box.addEventListener('pointerup', (e) => {
      if (downX === null) return;
      const dx = e.clientX - downX; downX = null;
      if (Math.abs(dx) > 40) { swiped = true; go(this.promoIndex + (dx < 0 ? 1 : -1)); restart(); sfx('whoosh'); }
    });
    this.on('[data-pdot]', 'click', (e, el) => { e.stopPropagation(); go(Number(el.dataset.pdot)); restart(); }, box);
    this.on('[data-pmove]', 'click', (e, el) => { e.stopPropagation(); go(this.promoIndex + Number(el.dataset.pmove)); restart(); sfx('click'); }, box);
    this.on('[data-promo]', 'click', (_e, el) => { if (swiped) { swiped = false; return; } window.clearInterval(this.promoTimer); sfx('click'); slides[Number(el.dataset.promo)].act(); }, box);
  }

  // ---- 1.93 (author): clans — create or join (by request or open), the clan's screen and its management, the
  // Juegos del Clan (3 a day on the clan arena, in the clan's kit), weekly prizes and missions, the clan shop
  private clanMap: MapInfo | null = null;
  private clanMatch = false;
  private clanData: MyClan | null | undefined;
  private clanTab: 'clan' | 'juegos' | 'ranking' | 'tienda' | 'admin' = 'clan';
  private clanQuery = '';

  private clanCrest(crest: string, size = 40) {
    const src = crest ? this.emblemOf(crest) : '';
    return `<span class="cl-crest" style="width:${size}px;height:${size}px">${src ? `<img src="${src}" alt="">` : uiIcon('team')}</span>`;
  }
  private clanTag(role: ClanRole) { return `<em class="cl-tag r-${role}">${CLAN_ROLE_LABEL[role]}</em>`; }
  private clanBagHtml(bag: ClanBag, empty = '') {
    const parts = CLAN_ITEMS.filter((it) => (bag[it.id] ?? 0) > 0).map((it) => `<span class="cl-item r-${it.rarity}" title="${esc(it.name)}">${this.icon(it.icon, 1.5)}<b>${bag[it.id]}</b></span>`);
    return parts.join('') || empty;
  }
  private clanChipHtml() {
    const c = this.save.clanSeen;
    return c ? `${this.clanCrest(c.crest, 26)}<span><small>${tr('MI CLAN')}</small><b>${esc(c.name)}</b><em>${tr('{x1}{x2} pts', { x1: c.pos ? `#${c.pos} · ` : '', x2: c.points.toLocaleString(locale()) })}</em></span>`
      : `<span class="cl-crest" style="width:26px;height:26px">${uiIcon('team')}</span><span><small>${tr('CLANES')}</small><b>${tr('Únete a un clan')}</b><em>${tr('Juegos del Clan')}</em></span>`;
  }
  private clanCrestChoices() { return [...new Set(this.m.mainTeams ?? [])].filter((t) => this.emblemOf(t)); }
  private clanKitChoices() { return ['', ...Object.keys(this.m.kits ?? {})]; }

  /** the clan screen: loads the player's clan from the server first */
  async clanScreen(tab?: App['clanTab']) {
    if (tab) this.clanTab = tab;
    setMusicContext('menu');
    if (!onlineConfigured() || !signedIn()) {
      this.show(`<div class="screen clan-screen">${this.titlebar(tr('Clanes'), tr('Menú'))}<div class="panel cl-intro"><h3>${tr('{x1}Clanes', { x1: uiIcon('team') })}</h3>
        <p>${tr('Crea un clan o únete a uno, jugad los <b>Juegos del Clan</b> en la Colina de los Cerezos y competid cada semana por premios: fichas para varios ×10, monedas y futbolistas Míticos, Legendarios y Épicos.')}</p>
        <p class="note">${tr('Para entrar en un clan conéctate con tu cuenta y reserva tu nombre en Perfil.')}</p><button class="btn big" id="clprof">${tr('Ir a Perfil')}</button></div></div>`);
      this.on('[data-back]', 'click', () => this.mainMenu());
      document.getElementById('clprof')!.addEventListener('click', () => this.profile());
      return;
    }
    if (this.clanData === undefined) this.show(`<div class="screen clan-screen">${this.titlebar(tr('Clanes'), tr('Menú'))}<div class="panel"><div class="note">${tr('Cargando tu clan…')}</div></div></div>`);
    try { this.clanData = await myClan(); } catch { if (this.clanData === undefined) { this.toast(tr('Los clanes no responden ahora')); this.mainMenu(); return; } }
    this.rememberClan();
    if (this.clanData) this.clanHome(); else void this.clanJoinScreen();
  }
  private rememberClan() {
    const c = this.clanData;
    this.save.clanSeen = c ? { name: c.name, crest: c.crest, pos: c.pos ?? null, points: Number(c.weekPoints) || 0 } : null;
    this.persist();
  }

  /** no clan yet: found one (15.000 coins) or look for one and ask to join */
  private async clanJoinScreen() {
    const crests = this.clanCrestChoices(), kits = this.clanKitChoices();
    const sample = this.unlockedRoster()[0];
    this.show(`<div class="screen clan-screen">${this.titlebar(tr('Clanes'), tr('Menú'))}
      <div class="cl-grid">
        <div class="panel cl-create"><h3>${tr('{x1}Fundar un clan', { x1: uiIcon('crown') })} <small>${CLAN_COST.toLocaleString(locale())} ◉</small></h3>
          <label class="cl-field">${tr('Nombre')}<input id="clname" maxlength="20" placeholder="${tr('De 3 a 20 caracteres')}"></label><small class="cl-err" id="clnameerr"></small>
          <div class="cl-field">${tr('Escudo')}<div class="cl-crests" id="clcrests">${crests.map((t, i) => `<button class="iconpick${i === 0 ? ' on' : ''}" data-ccrest="${esc(t)}" title="${esc(teamLabel(t))}"><img src="${this.emblemOf(t)}" alt=""></button>`).join('')}</div></div>
          <label class="cl-field">${tr('Equipación')}<select id="clkit">${kits.map((k) => `<option value="${esc(k)}">${esc(k ? teamLabel(k) : 'Raimon')}</option>`).join('')}</select></label>
          <div class="cl-kitprev" id="clkitprev">${sample ? charCanvas(sample.id, 3, 12, '', '') : ''}</div>
          <button class="btn big" id="clcreate" ${this.save.coins >= CLAN_COST ? '' : 'disabled'}>${this.save.coins >= CLAN_COST ? tr('Fundar por {x1} ◉', { x1: CLAN_COST.toLocaleString(locale()) }) : `Necesitas ${CLAN_COST.toLocaleString(locale())} ◉`}</button>
          <p class="note">${tr('Tus compañeros jugarán los Juegos del Clan con esta equipación. El nombre pasa un filtro de palabras prohibidas.')}</p></div>
        <div class="panel cl-find"><h3>${tr('{x1}Buscar clan', { x1: uiIcon('target') })}</h3>
          <div class="filters"><input id="clq" placeholder="${tr('Nombre del clan')}" value="${esc(this.clanQuery)}"><button class="btn small blue" id="clqgo">${tr('Buscar')}</button></div>
          <div id="clmyreq"></div><div class="cl-list" id="cllist"><div class="note">${tr('Cargando…')}</div></div></div>
      </div></div>`);
    mountPreviews();
    this.on('[data-back]', 'click', () => this.mainMenu());
    let crest = crests[0] ?? '';
    this.on('[data-ccrest]', 'click', (_e, el) => { crest = el.dataset.ccrest!; document.querySelectorAll('[data-ccrest]').forEach((b) => b.classList.toggle('on', b === el)); sfx('click'); });
    const kitSel = document.getElementById('clkit') as HTMLSelectElement;
    kitSel.addEventListener('change', () => { if (sample) { document.getElementById('clkitprev')!.innerHTML = charCanvas(sample.id, 3, 12, '', kitSel.value); mountPreviews(); } });
    const nameIn = document.getElementById('clname') as HTMLInputElement;
    nameIn.addEventListener('input', () => { document.getElementById('clnameerr')!.textContent = nameIn.value ? clanNameProblem(nameIn.value) ?? '' : ''; });
    document.getElementById('clcreate')!.addEventListener('click', async (e) => {
      const b = e.currentTarget as HTMLButtonElement;
      const bad = clanNameProblem(nameIn.value);
      if (bad) { document.getElementById('clnameerr')!.textContent = bad; return; }
      if (this.save.coins < CLAN_COST) return;
      b.disabled = true;
      try {
        await clanCreate(nameIn.value.trim().replace(/\s+/g, ' '), crest, kitSel.value);
        this.save.coins -= CLAN_COST; this.persist();
        sfx('legend'); if (this.save.settings.particles !== 'desactivado') confetti(80);
        this.toast(tr('¡Clan {trim} fundado!', { trim: nameIn.value.trim() }));
        this.clanTab = 'clan'; void this.clanScreen();
      } catch (err) { document.getElementById('clnameerr')!.textContent = clanError(String((err as Error)?.message ?? err)); b.disabled = false; }
    });
    const search = async () => {
      const box = document.getElementById('cllist');
      if (!box) return;
      try {
        const [rows, mine] = await Promise.all([clanSearch(this.clanQuery), myClanRequests().catch(() => [])]);
        if (!document.body.contains(box)) return;
        const asked = new Set(mine.map((r) => r.id));
        document.getElementById('clmyreq')!.innerHTML = mine.length ? `<div class="cl-myreq"><small>${tr('TUS SOLICITUDES')}</small>${mine.map((r) => `<span>${this.clanCrest(r.crest, 20)}${esc(r.name)}<button class="btn small blue" data-clcancel="${r.id}">${tr('Cancelar')}</button></span>`).join('')}</div>` : '';
        box.innerHTML = rows.map((c) => `<div class="cl-row"><span class="cl-tap cl-row-main" data-clanid="${c.id}" title="${tr('Ver el clan')}">${this.clanCrest(c.crest, 36)}<span class="cl-row-tx"><b>${esc(c.name)}</b><small>${tr('{members}/{CLAN_MAX} miembros · {x1} pts esta semana · {x2}', { members: c.members, CLAN_MAX, x1: Number(c.week_points ?? 0).toLocaleString(locale()), x2: c.mode === 'abierto' ? 'Abierto' : tr('Con solicitud') })}</small></span></span>
          ${asked.has(c.id) ? '<em class="cl-pend">Solicitud enviada</em>' : c.members >= CLAN_MAX ? '<em class="cl-pend">Lleno</em>' : `<button class="btn small" data-cljoin="${c.id}">${c.mode === 'abierto' ? 'Unirse' : 'Solicitar'}</button>`}</div>`).join('')
          || `<div class="note">${tr('No hay clanes con ese nombre. ¡Funda el tuyo!')}</div>`;
        this.on('[data-cljoin]', 'click', async (_e, el) => {
          (el as HTMLButtonElement).disabled = true;
          try {
            const r = await clanRequest(Number(el.dataset.cljoin));
            if (r === 'joined') { sfx('evolve'); this.toast(tr('¡Ya eres del clan!')); void this.clanScreen('clan'); }
            else { sfx('click'); this.toast(tr('Solicitud enviada: el líder o un oficial la aceptará')); void search(); }
          } catch (err) { this.toast(clanError(String((err as Error)?.message ?? err))); (el as HTMLButtonElement).disabled = false; }
        }, box);
        this.bindClans(box);
        this.on('[data-clcancel]', 'click', async (_e, el) => { await clanCancelRequest(Number(el.dataset.clcancel)).catch(() => undefined); void search(); });
      } catch { box.innerHTML = `<div class="note">${tr('La búsqueda no responde ahora.')}</div>`; }
    };
    const q = document.getElementById('clq') as HTMLInputElement;
    document.getElementById('clqgo')!.addEventListener('click', () => { this.clanQuery = q.value; void search(); });
    q.addEventListener('keydown', (e) => { if (e.key === 'Enter') { this.clanQuery = q.value; void search(); } });
    void search();
  }

  /** the player's clan: a header, then Clan · Juegos · Ranking · Tienda (· Administrar for leaders and officers) */
  private clanHome() {
    const c = this.clanData!;
    const manager = c.me === 'lider' || c.me === 'oficial';
    if (this.clanTab === 'admin' && !manager) this.clanTab = 'clan';
    const left = Math.max(0, CLAN_RUNS_PER_DAY - c.runsToday);
    const tabs: [App['clanTab'], string, number][] = [['clan', 'Clan', 0], ['juegos', tr('Juegos del Clan'), left], ['ranking', 'Ranking', 0], ['tienda', 'Tienda', 0], ...(manager ? [['admin', 'Administrar', c.requests] as [App['clanTab'], string, number]] : [])];
    const sample = this.unlockedRoster()[0];
    this.show(`<div class="screen clan-screen">${this.titlebar(tr('Mi clan'), 'Menú')}
      <div class="cl-head"><div class="cl-head-art">${this.clanCrest(c.crest, 84)}${sample ? `<span class="cl-head-kit">${charCanvas(sample.id, 3, 12, '', c.kit)}</span>` : ''}</div>
        <div class="cl-head-tx"><small>${tr('CLAN · {x1}', { x1: c.mode === 'abierto' ? tr('ABIERTO') : tr('CON SOLICITUD') })}</small><b>${esc(c.name)}</b>
          <span class="cl-head-tags">${this.clanTag(c.me)}<span>${uiIcon('team')}${c.members}/${CLAN_MAX}</span><span>${uiIcon('shirt')}${esc(c.kit ? teamLabel(c.kit) : 'Raimon')}</span></span></div>
        <div class="cl-head-score"><small>${tr('ESTA SEMANA')}</small><b>${Number(c.weekPoints).toLocaleString(locale())}</b><em>${c.pos ? tr('Puesto {pos} de {clans}', { pos: c.pos, clans: c.clans }) : tr('Sin puntos aún')}</em><i>${tr('Cierra en {x1}', { x1: this.leftText(clanWeekLeftMs(serverNow())) })}</i></div></div>
      <div class="tl-tabs cl-tabs">${tabs.map(([id, label, n]) => `<button class="tab${this.clanTab === id ? ' on' : ''}" data-cltab="${id}">${label}${n ? `<span class="m4-badge">${n}</span>` : ''}</button>`).join('')}</div>
      <div id="clbody"></div></div>`);
    mountPreviews();
    this.on('[data-back]', 'click', () => this.mainMenu());
    this.on('[data-cltab]', 'click', (_e, el) => { this.clanTab = el.dataset.cltab as App['clanTab']; sfx('click'); this.clanHome(); });
    const body = document.getElementById('clbody')!;
    if (this.clanTab === 'clan') this.clanTabClan(body);
    else if (this.clanTab === 'juegos') this.clanTabGames(body);
    else if (this.clanTab === 'ranking') void this.clanTabRanking(body);
    else if (this.clanTab === 'tienda') this.clanTabShop(body);
    else void this.clanTabAdmin(body);
  }

  private clanTabClan(body: HTMLElement) {
    const c = this.clanData!;
    const done = (m: ClanMission) => Number(m.progress) >= Number(m.goal);
    const played = c.roster.some((m) => m.username === this.save.onlineName && m.week > 0);
    body.innerHTML = `<div class="cl-grid">
      <div class="panel"><h3>${tr('{x1}Miembros', { x1: uiIcon('team') })} <small>${c.members}/${CLAN_MAX}</small></h3><div class="cl-members">${c.roster.map((m) => `<div class="cl-mem${m.username === this.save.onlineName ? ' me' : ''}">
          ${this.clanTag(m.role)}<b>${esc(m.username)}</b><span class="cl-dots" title="${tr('Partidas de hoy')}">${Array.from({ length: CLAN_RUNS_PER_DAY }, (_x, i) => `<i class="${i < m.today ? 'on' : ''}"></i>`).join('')}</span><em>${tr('{x1} pts', { x1: Number(m.week).toLocaleString(locale()) })}</em></div>`).join('')}</div>
        <button class="btn small blue cl-leave" id="clleave">${tr('Salir del clan')}</button></div>
      <div class="panel"><h3>${tr('{x1}Misiones del clan', { x1: uiIcon('missions') })} <small>${tr('semanales')}</small></h3><div class="cl-missions">${c.missions.map((m) => { const pc = Math.min(100, Math.round(Number(m.progress) / Math.max(1, Number(m.goal)) * 100));
          return `<div class="cl-mis${done(m) ? ' done' : ''}${m.claimed ? ' claimed' : ''}"><span class="cl-mis-tx"><b>${esc(CLAN_MISSION_TEXT[m.id] ?? m.id)}</b><small>${Number(m.progress).toLocaleString(locale())} / ${Number(m.goal).toLocaleString(locale())}</small><i class="cl-bar"><i style="width:${pc}%"></i></i></span>
          <span class="cl-mis-rw">${m.coins ? `${m.coins.toLocaleString(locale())} ◉` : ''}${m.tokens ? tr(' · {tokens} fichas', { tokens: m.tokens }) : ''}</span>
          ${m.claimed ? '<em class="cl-pend">Cobrada</em>' : `<button class="btn small" data-clmis="${m.id}" ${done(m) && played ? '' : 'disabled'}>${tr('Cobrar')}</button>`}</div>`; }).join('')}</div>
        <p class="note">${tr('Cobra cada miembro que haya jugado al menos una partida del clan esta semana. Se reinician los lunes.')}</p></div></div>`;
    this.on('[data-clmis]', 'click', async (_e, el) => {
      (el as HTMLButtonElement).disabled = true;
      try {
        const r = await clanClaimMission(el.dataset.clmis!);
        this.save.coins += r.coins; this.save.tokens += r.tokens; this.persist();
        sfx('powerup'); this.toast(tr('+{x1} ◉ · +{tokens} fichas', { x1: r.coins.toLocaleString(locale()), tokens: r.tokens }));
        void this.clanScreen();
      } catch (err) { this.toast(clanError(String((err as Error)?.message ?? err))); }
    }, body);
    document.getElementById('clleave')!.addEventListener('click', (e) => this.armed(e.currentTarget as HTMLElement, async () => {
      try { await clanLeave(); this.clanData = null; this.rememberClan(); this.toast(tr('Has salido del clan')); void this.clanScreen(); } catch (err) { this.toast(clanError(String((err as Error)?.message ?? err))); }
    }));
  }

  private clanTabGames(body: HTMLElement) {
    const c = this.clanData!;
    const left = Math.max(0, CLAN_RUNS_PER_DAY - c.runsToday);
    const squad = squadOf(this.save, this.byId);
    const mp = this.clanMap;
    body.innerHTML = `<div class="cl-grid">
      <div class="panel cl-games"><div class="cl-games-art">${mp?.minimapTexture ? `<img src="${mp.minimapTexture}" alt="">` : ''}<span><small>${tr('ARENA EXCLUSIVA DE CLANES')}</small><b>${esc(mp?.name ?? tr('Juegos del Clan'))}</b></span></div>
        <p>${tr('{x1} Juegas con <b>{x2}</b> ({x3}) y tu Rango actual (<b>{difficulty}</b>{x4}', { x1: esc(mp?.blurb ?? ''), x2: tr('la equipación del clan'), x3: esc(c.kit ? teamLabel(c.kit) : 'Raimon'), difficulty: this.save.difficulty, x4: tr('): cuanto más alto, más puntos.') })}</p>
        <div class="cl-left"><span class="cl-dots big">${Array.from({ length: CLAN_RUNS_PER_DAY }, (_x, i) => `<i class="${i < c.runsToday ? 'on' : ''}"></i>`).join('')}</span><b>${left ? tr('Te queda tu partida de hoy') : tr('Ya has jugado tu partida de hoy: vuelve mañana')}</b></div>
        <button class="btn big cl-play" id="clplay" ${left && squad.length && mp ? '' : 'disabled'}>${tr('{x1}¡Jugar por el clan!', { x1: uiIcon('play') })}</button>
        <p class="note">${tr('Puntos: rivales derrotados, tiempo aguantado, daño y +300 por ganar, por el Rango (C ×1 · B ×1,25 · A ×1,5 · S ×1,8 · X ×2,2 · Z ×2,8). La partida da sus monedas y fichas normales y, además, objetos del clan.')}</p></div>
      <div class="panel"><h3>${tr('{x1}Objetos del clan', { x1: uiIcon('gift') })}</h3><div class="cl-bag">${CLAN_ITEMS.map((it) => `<span class="cl-item big r-${it.rarity}" title="${esc(it.name)}">${this.icon(it.icon, 2.5)}<b>${this.save.clanItems?.[it.id] ?? 0}</b><small>${esc(it.name)}</small></span>`).join('')}</div>
        <p class="note">${tr('Caen en los Juegos del Clan: 3 cada 60 rivales, 9 más si ganas y más cuanto más alto el Rango. Se gastan en la Tienda del clan.')}</p>
        <button class="btn blue" id="clshop">${tr('Ir a la tienda')}</button></div></div>`;
    document.getElementById('clplay')?.addEventListener('click', () => this.clanPlay());
    document.getElementById('clshop')!.addEventListener('click', () => { this.clanTab = 'tienda'; this.clanHome(); });
  }

  private async clanTabRanking(body: HTMLElement) {
    const c = this.clanData!;
    const prizes = (Object.entries(CLAN_PRIZES) as [ClanTier, (typeof CLAN_PRIZES)[ClanTier]][]).map(([t, p]) => `<div class="cl-prize t-${t}"><b>${p.label}</b><span>${tr('{tokens} fichas · {eg} Fichas EG · {x1} ◉', { tokens: p.tokens, eg: p.eg, x1: p.coins.toLocaleString(locale()) })}</span><small>${p.players.map((x) => `${x.n} ${x.label}`).join(' · ')}</small></div>`).join('');
    body.innerHTML = `<div class="cl-grid"><div class="panel"><h3>${tr('{x1}Ranking de la semana', { x1: uiIcon('crown') })}</h3><div id="clrank" class="cl-list"><div class="note">${tr('Cargando…')}</div></div></div>
      <div class="panel"><h3>${tr('{x1}Premios del lunes', { x1: uiIcon('trophy') })}</h3><div class="cl-prizes">${prizes}</div><p class="note">${tr('Los recibe cada miembro que jugó al menos una partida por el clan esa semana (TOP 1 el primero, TOP 3 hasta el 3.º, TOP 8 hasta el 8.º, el resto si sumó puntos). Se cobran al entrar al menú.')}</p>
        <h3>${tr('{x1}La semana pasada', { x1: uiIcon('clock') })}</h3><div id="cllast" class="cl-list"><div class="note">${tr('Cargando…')}</div></div></div></div>`;
    try {
      const [rows, last] = await Promise.all([clanRanking(), clanLastWeek()]);
      const box = document.getElementById('clrank'), lb = document.getElementById('cllast');
      if (!box || !lb) return;
      box.innerHTML = rows.map((r) => `<div class="cl-row cl-tap${r.id === c.id ? ' me' : ''}" data-clanid="${r.id}" title="${tr('Ver el clan')}"><span class="cl-pos t-${tierOfPos(Number(r.pos))}">${r.pos}</span>${this.clanCrest(r.crest, 30)}<span class="cl-row-tx"><b>${esc(r.name)}</b><small>${tr('{members} miembros', { members: r.members })}</small></span><em>${tr('{x1} pts', { x1: Number(r.points).toLocaleString(locale()) })}</em></div>`).join('') || `<div class="note">${tr('Nadie ha jugado aún esta semana.')}</div>`;
      lb.innerHTML = last.map((r) => `<div class="cl-row cl-tap" data-clan="${esc(r.name)}" title="${tr('Ver el clan')}"><span class="cl-pos t-${r.tier}">${r.pos}</span><span class="cl-row-tx"><b>${esc(r.name)}</b></span><em>${tr('{x1} pts', { x1: Number(r.points).toLocaleString(locale()) })}</em></div>`).join('') || `<div class="note">${tr('Aún no hay semanas cerradas.')}</div>`;
      this.bindClans(box); this.bindClans(lb); // 2.01: tap a clan to see its card
    } catch { const box = document.getElementById('clrank'); if (box) box.innerHTML = `<div class="note">${tr('El ranking no responde ahora.')}</div>`; }
  }

  private clanTabShop(body: HTMLElement) {
    const week = clanWeekKey(serverNow());
    const offers = clanShop(week);
    const bag = this.save.clanItems ?? {};
    const costHtml = (cost: ClanBag) => CLAN_ITEMS.filter((it) => cost[it.id]).map((it) => `<span class="cl-item${(bag[it.id] ?? 0) >= (cost[it.id] ?? 0) ? '' : ' short'}" title="${esc(it.name)}">${this.icon(it.icon, 1.25)}<b>${cost[it.id]}</b></span>`).join('');
    const art = (o: ClanOffer) => o.kind === 'monedas' ? `<span class="cl-off-ic coins">◉</span><b>${tr('{x1} monedas', { x1: o.coins.toLocaleString(locale()) })}</b>`
      : o.kind === 'fichas' ? `<span class="cl-off-ic tokens">${uiIcon('capsule')}</span><b>${tr('{tokens} fichas', { tokens: o.tokens })}</b><small>${tr('un ×10')}</small>`
      : o.kind === 'eg' ? `<span class="cl-off-ic eg">${tr('EG')}</span><b>${tr('{egTokens} Ficha EG', { egTokens: o.egTokens })}</b><small>${tr('Espíritus Guerreros')}</small>`
      : o.kind === 'pennant' ? (() => { const d = PENNANT_BY_ID.get(o.pennant)!; return `${isFrame(d) ? `<span class="fr-prev">${this.framed(this.frameFace(), d.id)}</span>` : `<span class="pn-prev">${pennantRibbon(d)}</span>`}<b>${esc(d.name)}</b><small>${tr('{x1} exclusivo', { x1: isFrame(d) ? 'Marco' : 'Banner' })}</small>`; })()
      : `<span class="cl-off-ic r-${o.rarity}" style="--rc:${RARITY_COLOR[o.rarity]}">${uiIcon('cards')}</span><b>${tr('Futbolista')}</b><small>${esc(o.label)}</small>`;
    body.innerHTML = `<div class="panel cl-shop"><h3>${tr('{x1}Tienda del clan', { x1: uiIcon('shop') })} <small>${tr('se renueva en {x1}', { x1: this.leftText(clanWeekLeftMs(serverNow())) })}</small></h3>
      <div class="cl-bag small">${this.clanBagHtml(bag, `<span class="note">${tr('Aún no tienes objetos: juega los Juegos del Clan.')}</span>`)}</div>
      <div class="cl-offers">${offers.map((o) => { const left = o.stock - boughtThisWeek(this.save, week, o.id); const owned = o.kind === 'pennant' && hasPennant(this.save, o.pennant);
        return `<div class="cl-off${left <= 0 || owned ? ' out' : ''}">${art(o)}<div class="cl-off-cost">${costHtml(o.cost)}</div><small class="cl-stock">${owned ? tr('Ya lo tienes') : `Quedan ${left}/${o.stock}`}</small>
          <button class="btn small" data-cloff="${o.id}" ${left > 0 && !owned && canPay(this.save, o.cost) ? '' : 'disabled'}>${tr('Canjear')}</button></div>`; }).join('')}</div></div>`;
    this.on('[data-cloff]', 'click', (_e, el) => {
      const o = offers.find((x) => x.id === el.dataset.cloff);
      if (!o || !canPay(this.save, o.cost) || boughtThisWeek(this.save, week, o.id) >= o.stock) return;
      payBag(this.save, o.cost); recordBuy(this.save, week, o.id);
      if (o.kind === 'monedas') { this.save.coins += o.coins; this.toast(`+${o.coins.toLocaleString(locale())} ◉`); }
      else if (o.kind === 'fichas') { this.save.tokens += o.tokens; this.toast(tr('+{tokens} fichas', { tokens: o.tokens })); }
      else if (o.kind === 'eg') { this.save.egTokens = (this.save.egTokens ?? 0) + o.egTokens; this.toast(tr('+{egTokens} Ficha EG', { egTokens: o.egTokens })); }
      else if (o.kind === 'pennant') { givePennant(this.save, o.pennant); this.toast(tr('¡{x1}! Póntelo en tu Perfil.', { x1: PENNANT_BY_ID.get(o.pennant)?.name })); }
      this.persist(); sfx('powerup');
      if (o.kind === 'jugador') {
        const p = clanPlayer(this.m.roster, o.odds, Math.random);
        if (p) { const res = addCopy(this.save, p); this.persist(); void this.capsuleShow([{ player: p, ...res }], tr('Tienda del clan')).then(() => void this.clanScreen('tienda')); return; }
      }
      this.clanHome();
    }, body);
  }

  private async clanTabAdmin(body: HTMLElement) {
    const c = this.clanData!;
    const lead = c.me === 'lider';
    const crests = this.clanCrestChoices(), kits = this.clanKitChoices();
    const act = (m: ClanMember) => {
      if (m.username === this.save.onlineName) return `<em class="cl-pend">${tr('Tú')}</em>`;
      const b: string[] = [];
      if (lead && m.role === 'miembro') b.push(`<button class="btn small" data-clrole="${esc(m.username)}" data-r="oficial">${tr('Ascender a oficial')}</button>`);
      if (lead && m.role === 'oficial') b.push(`<button class="btn small blue" data-clrole="${esc(m.username)}" data-r="miembro">${tr('Quitar oficial')}</button>`);
      if (lead) b.push(`<button class="btn small blue" data-clrole="${esc(m.username)}" data-r="lider">${tr('Ceder liderazgo')}</button>`);
      if (lead || m.role === 'miembro') b.push(`<button class="btn small danger" data-clkick="${esc(m.username)}">${tr('Expulsar')}</button>`);
      return b.join('');
    };
    body.innerHTML = `<div class="cl-grid">
      <div class="panel"><h3>${tr('{x1}Solicitudes', { x1: uiIcon('gift') })} <small>${c.requests}</small></h3><div id="clreqs" class="cl-list"><div class="note">${tr('Cargando…')}</div></div></div>
      <div class="panel"><h3>${tr('{x1}Miembros y rangos', { x1: uiIcon('team') })}</h3><div class="cl-members admin">${c.roster.map((m) => `<div class="cl-mem${m.username === this.save.onlineName ? ' me' : ''}">${this.clanTag(m.role)}<b>${esc(m.username)}</b><span class="cl-acts">${act(m)}</span></div>`).join('')}</div>
        <p class="note">${tr('El líder lo gestiona todo. Los oficiales aceptan solicitudes y pueden expulsar a miembros.')}</p></div>
      ${lead ? `<div class="panel cl-edit"><h3>${tr('{x1}Ajustes del clan', { x1: uiIcon('cog') })}</h3>
        <label class="cl-field">${tr('Nombre')}<input id="clename" maxlength="20" value="${esc(c.name)}"></label><small class="cl-err" id="cleerr"></small>
        <div class="cl-field">${tr('Escudo')}<div class="cl-crests">${crests.map((t) => `<button class="iconpick${c.crest === t ? ' on' : ''}" data-ecrest="${esc(t)}" title="${esc(teamLabel(t))}"><img src="${this.emblemOf(t)}" alt=""></button>`).join('')}</div></div>
        <label class="cl-field">${tr('Equipación')}<select id="clekit">${kits.map((k) => `<option value="${esc(k)}" ${k === c.kit ? 'selected' : ''}>${esc(k ? teamLabel(k) : 'Raimon')}</option>`).join('')}</select></label>
        <label class="cl-field">${tr('Entrada')}<select id="clemode"><option value="solicitud" ${c.mode === 'solicitud' ? 'selected' : ''}>${tr('Con solicitud (aceptáis vosotros)')}</option><option value="abierto" ${c.mode === 'abierto' ? 'selected' : ''}>${tr('Abierto (entra cualquiera)')}</option></select></label>
        <button class="btn big" id="clesave">${tr('Guardar cambios')}</button></div>` : ''}</div>`;
    const err = (e: unknown) => this.toast(clanError(String((e as Error)?.message ?? e)));
    this.on('[data-clrole]', 'click', (_e, el) => this.armed(el, async () => { try { await clanSetRole(el.dataset.clrole!, el.dataset.r as ClanRole); sfx('click'); void this.clanScreen('admin'); } catch (e) { err(e); } }), body);
    this.on('[data-clkick]', 'click', (_e, el) => this.armed(el, async () => { try { await clanKick(el.dataset.clkick!); void this.clanScreen('admin'); } catch (e) { err(e); } }), body);
    let crest = c.crest;
    this.on('[data-ecrest]', 'click', (_e, el) => { crest = el.dataset.ecrest!; body.querySelectorAll('[data-ecrest]').forEach((b) => b.classList.toggle('on', b === el)); }, body);
    document.getElementById('clesave')?.addEventListener('click', async (e) => {
      const name = (document.getElementById('clename') as HTMLInputElement).value.trim().replace(/\s+/g, ' ');
      const bad = name !== c.name ? clanNameProblem(name) : null;
      if (bad) { document.getElementById('cleerr')!.textContent = bad; return; }
      (e.currentTarget as HTMLButtonElement).disabled = true;
      try {
        await clanUpdate(name !== c.name ? name : null, crest, (document.getElementById('clekit') as HTMLSelectElement).value, (document.getElementById('clemode') as HTMLSelectElement).value as 'abierto' | 'solicitud');
        sfx('powerup'); this.toast(tr('Clan actualizado')); void this.clanScreen('admin');
      } catch (x) { document.getElementById('cleerr')!.textContent = clanError(String((x as Error)?.message ?? x)); (e.currentTarget as HTMLButtonElement).disabled = false; }
    });
    try {
      const reqs = await clanRequests();
      const box = document.getElementById('clreqs');
      if (!box) return;
      box.innerHTML = reqs.map((r) => `<div class="cl-row"><span class="cl-row-tx"><b>${esc(r.username)}</b><small>${new Date(r.created_at).toLocaleString(locale())}</small></span>
        <button class="btn small" data-clans="${esc(r.username)}" data-ok="1">${tr('Aceptar')}</button><button class="btn small blue" data-clans="${esc(r.username)}" data-ok="">${tr('Rechazar')}</button></div>`).join('') || `<div class="note">${tr('No hay solicitudes pendientes.')}</div>`;
      this.on('[data-clans]', 'click', async (_e, el) => {
        (el as HTMLButtonElement).disabled = true;
        try { await clanAnswer(el.dataset.clans!, !!el.dataset.ok); sfx(el.dataset.ok ? 'evolve' : 'click'); void this.clanScreen('admin'); } catch (e) { err(e); void this.clanScreen('admin'); }
      }, box);
    } catch (e) { const box = document.getElementById('clreqs'); if (box) box.innerHTML = `<div class="note">${esc(clanError(String((e as Error)?.message ?? e)))}</div>`; }
  }

  /** a Juegos del Clan match: the squad, on the clan arena, in the clan's kit */
  private clanPlay() {
    const c = this.clanData;
    const squad = squadOf(this.save, this.byId);
    if (!c || !this.clanMap) return;
    if (c.runsToday >= CLAN_RUNS_PER_DAY) { this.toast(CLAN_ERRORS.clan_daily_limit); return; }
    if (!squad.length) { this.captainSelect(); return; }
    this.clanMatch = true;
    this.startRun(this.clanMap.id, [squad[0]], squad);
  }

  /** end of a clan match: the normal results (half coins and fichas), then the points sent and the items found */
  private clanEnd(r: RunResult & { level: number }) {
    r.runId ??= `${Date.now()}`;
    this.results(r);
    this.clanMatch = false;
    const bag = clanDrops({ kills: r.kills, victory: r.victory, rank: r.rank }, Math.random);
    addBag(this.save, bag);
    this.persist();
    const box = document.createElement('div');
    box.className = 'modal clan-end';
    const draw = (score: string) => {
      box.innerHTML = `<div class="panel cl-end-card"><small>${tr('JUEGOS DEL CLAN · {x1}', { x1: esc(this.clanData?.name ?? '') })}</small><h2>${r.victory ? tr('¡Victoria para el clan!') : tr('Partida del clan')}</h2>
        <div class="cl-end-score">${score}</div><h3>${tr('Objetos encontrados')}</h3><div class="cl-bag">${this.clanBagHtml(bag, `<span class="note">${tr('Esta vez no ha caído nada.')}</span>`)}</div>
        <div class="cp-actions"><button class="btn big" id="clendok">${tr('Ver el clan')}</button><button class="btn blue" id="clendx">${tr('Cerrar')}</button></div></div>`;
      box.querySelector('#clendok')!.addEventListener('click', () => { box.remove(); void this.clanScreen('juegos'); });
      box.querySelector('#clendx')!.addEventListener('click', () => box.remove());
    };
    draw(`<div class="note">${tr('Enviando los puntos…')}</div>`);
    (document.body.querySelector('#ui') ?? this.root).appendChild(box);
    clanSubmitRun(r.runId, r.kills, r.timeSec, r.damage ?? 0, r.rank ?? 'C', r.victory)
      .then((res) => {
        if (this.clanData) { this.clanData.runsToday += 1; this.clanData.weekPoints = Number(res.weekPoints); }
        this.save.clanSeen = this.save.clanSeen ? { ...this.save.clanSeen, points: Number(res.weekPoints) } : this.save.clanSeen; this.persist();
        sfx('powerup');
        draw(`<b class="cl-pts">${tr('+{x1} pts', { x1: res.points.toLocaleString(locale()) })}</b><span>${tr('El clan suma')} <b>${Number(res.weekPoints).toLocaleString(locale())}</b> ${tr('esta semana · te quedan')} <b>${res.left}</b> ${tr('partidas hoy')}</span>`);
      })
      .catch((err) => draw(`<div class="note">${esc(clanError(String((err as Error)?.message ?? err)))}</div>`));
  }

  /** menu: the clan chip and, once a week, the clan prizes */
  private async fillMenuClan() {
    if (!onlineConfigured() || !signedIn()) return;
    try {
      this.clanData = await myClan();
      this.rememberClan();
      const chip = document.getElementById('m4clan');
      if (chip) chip.innerHTML = this.clanChipHtml();
      const prizes = await clanClaimPrizes();
      if (prizes.length) void this.clanPrizeShow(prizes);
    } catch { /* the chip keeps the last known clan */ }
  }
  private async clanPrizeShow(prizes: ClanPrize[]) {
    const won: PullResult[] = [];
    for (const z of prizes) {
      this.save.coins += z.coins; this.save.tokens += z.tokens;
      this.save.egTokens = (this.save.egTokens ?? 0) + (CLAN_PRIZES[z.tier]?.eg ?? 0); // author: Fichas EG by position
      for (const g of CLAN_PRIZES[z.tier]?.players ?? []) for (let i = 0; i < g.n; i++) {
        const p = clanPlayer(this.m.roster, g.odds, Math.random);
        if (p) won.push({ player: p, ...addCopy(this.save, p) });
      }
    }
    this.persist();
    const box = document.createElement('div');
    box.className = 'modal clan-end';
    box.innerHTML = `<div class="panel cl-end-card"><small>${tr('PREMIOS DE CLAN')}</small><h2>${tr('¡Cierre de la semana!')}</h2>${prizes.map((z) => `<div class="cl-prize t-${z.tier}"><b>${tr('{x1} · puesto {pos}', { x1: CLAN_PRIZES[z.tier]?.label ?? z.tier, pos: z.pos })}</b><span>${esc(z.clan)}</span><small>${tr('+{tokens} fichas · +{x1} Fichas EG · +{x2} ◉ · {x3}', { tokens: z.tokens, x1: CLAN_PRIZES[z.tier]?.eg ?? 0, x2: z.coins.toLocaleString(locale()), x3: (CLAN_PRIZES[z.tier]?.players ?? []).map((g) => `${g.n} ${g.label}`).join(' · ') })}</small></div>`).join('')}
      <div class="cp-actions"><button class="btn big" id="clprok">${won.length ? tr('¡Abrir los fichajes!') : 'Genial'}</button></div></div>`;
    (document.body.querySelector('#ui') ?? this.root).appendChild(box);
    if (this.save.settings.particles !== 'desactivado') confetti(120);
    sfx('legend');
    box.querySelector('#clprok')!.addEventListener('click', () => { box.remove(); if (won.length) void this.capsuleShow(won, tr('Premios de clan')).then(() => this.mainMenu()); });
  }

  // ---- 1.9 (author): tier lists — make your own, publish it, everyone sees the latest ones in the menu
  private tierTab: 'comunidad' | 'crear' = 'comunidad';
  private tierPick: number | null = null;
  private tierQuery = '';
  private tierOwnedOnly = false;
  private tierFeedCache: TierlistRow[] | null = null;

  /** A tier list drawn like a screenshot: coloured tier labels and the bodyshots in each row. */
  private tierBoard(tiers: Tiers, size = 40, edit = false) {
    return `<div class="tl-board${edit ? ' edit' : ''}">${TIERS.map((k) => `<div class="tl-row" data-tier="${k}" style="--tc:${TIER_COLOR[k]}"><b class="tl-lab">${k}</b>
      <div class="tl-cells">${(tiers[k] ?? []).filter((id) => this.byId.has(id)).map((id) => `<span class="tl-p${this.tierPick === id ? ' on' : ''}" data-tp="${id}" ${edit ? 'draggable="true"' : ''} title="${esc(this.byId.get(id)!.name)}">${this.mug(id, size as 64)}</span>`).join('')
        || (edit ? `<em class="tl-empty">${tr('Toca un futbolista y luego esta fila')}</em>` : '')}</div></div>`).join('')}</div>`;
  }
  private tierCard(r: TierlistRow, size = 32) {
    const tiers = cleanTiers(r.tiers, (id) => this.byId.has(id));
    return `<div class="tl-card"><div class="tl-card-head"><b>${esc(topicLabel(r.topic))}</b><small>${tr('de')} <b>${esc(r.username)}</b> · ${new Date(r.updated_at).toLocaleDateString(locale())}</small></div>${this.tierBoard(tiers, size)}</div>`;
  }

  tierlistScreen() {
    setMusicContext('menu');
    const draft = this.save.tierDraft ?? { topic: 'general', tiers: {} };
    const tiers = cleanTiers(draft.tiers, (id) => this.byId.has(id));
    const topic = TIER_TOPICS.find((t) => t.id === draft.topic) ?? TIER_TOPICS[0];
    const placed = new Set(TIERS.flatMap((k) => tiers[k] ?? []));
    const q = this.tierQuery.trim().toLowerCase();
    const owned = new Set(this.unlockedRoster().map((p) => p.id));
    const pool = this.m.roster.filter((p) => !placed.has(p.id) && (!topic.pos || p.position === topic.pos) && (!this.tierOwnedOnly || owned.has(p.id))
      && (!q || p.name.toLowerCase().includes(q))).sort((a, b) => Number(owned.has(b.id)) - Number(owned.has(a.id)) || this.meanOf(b) - this.meanOf(a)).slice(0, 80);
    const n = tierCount(tiers);
    const online = onlineConfigured() && signedIn();
    const body = this.tierTab === 'comunidad'
      ? `<div class="panel"><h3>${tr('{x1}Tierlists de la comunidad', { x1: uiIcon('crown') })} <small>${tr('las últimas publicadas')}</small></h3><div id="tlfeed" class="tl-feed">${onlineConfigured() ? '<div class="note">Cargando…</div>' : `<div class="note">${tr('Disponible con el servicio online.')}</div>`}</div></div>`
      : `<div class="panel tl-editor"><div class="tl-topics">${TIER_TOPICS.map((t) => `<button class="pill${t.id === topic.id ? ' on' : ''}" data-ttopic="${t.id}">${esc(t.label)}</button>`).join('')}</div>
          <div class="tl-shot" id="tlshot"><div class="tl-card-head"><b>${esc(topic.label)}</b><small>${tr('de <b>{profileName}</b> · {n}/{TIER_MAX}', { profileName: esc(this.save.profile.name), n, TIER_MAX })}</small></div>${this.tierBoard(tiers, 44, true)}</div>
          <div class="cp-actions"><button class="btn big" id="tlpub" ${n >= TIER_MIN ? '' : 'disabled'}>${n >= TIER_MIN ? tr('Publicar para todos ▶') : tr('Coloca al menos {TIER_MIN}', { TIER_MIN })}</button><button class="btn blue" id="tlclear" ${n ? '' : 'disabled'}>${tr('Vaciar')}</button></div>
          ${online ? '' : `<p class="note">${tr('Para publicarla conéctate con tu cuenta (Perfil). Mientras, se guarda aquí.')}</p>`}</div>
        <div class="panel"><h3>${tr('{x1}Futbolistas', { x1: uiIcon('team') })} <small>${this.tierPick ? `<b>${esc(this.byId.get(this.tierPick)?.name ?? '')}</b> ${tr('elegido: toca una fila')}` : tr('toca uno y luego una fila, o arrástralo')}</small></h3>
          <div class="filters"><input id="tlq" placeholder="${tr('Buscar futbolista')}" value="${esc(this.tierQuery)}"><button class="pill${this.tierOwnedOnly ? ' on' : ''}" id="tlowned">${tr('Solo los míos')}</button></div>
          <div class="tl-pool">${pool.map((p) => `<span class="tl-p${this.tierPick === p.id ? ' on' : ''}${owned.has(p.id) ? '' : ' nown'}" data-tp="${p.id}" draggable="true" title="${esc(p.name)}">${this.mug(p.id, 44)}<small>${esc(p.name)}</small></span>`).join('') || `<div class="note">${tr('Nadie con ese nombre.')}</div>`}</div></div>`;
    this.show(`<div class="screen tierlist-screen">${this.titlebar(tr('Tierlists'), tr('Menú'))}
      <div class="tl-tabs"><button class="tab${this.tierTab === 'comunidad' ? ' on' : ''}" data-ttab="comunidad">${tr('{x1}Comunidad', { x1: uiIcon('crown') })}</button><button class="tab${this.tierTab === 'crear' ? ' on' : ''}" data-ttab="crear">${tr('{x1}Crear la mía', { x1: uiIcon('cards') })}</button></div>
      ${body}</div>`);
    this.on('[data-back]', 'click', () => this.mainMenu());
    this.on('[data-ttab]', 'click', (_e, el) => { this.tierTab = el.dataset.ttab as 'comunidad' | 'crear'; sfx('click'); this.tierlistScreen(); });
    if (this.tierTab === 'comunidad') { void this.fillTierFeed('tlfeed', 20, 40); return; }
    const saveDraft = (t: Tiers, topicId: string = topic.id) => { this.save.tierDraft = { topic: topicId, tiers: t as Record<string, number[]> }; this.persist(); };
    this.on('[data-ttopic]', 'click', (_e, el) => { saveDraft(tiers, el.dataset.ttopic!); sfx('click'); this.tierlistScreen(); });
    const keepScroll = () => { const y = document.querySelector('.screen')?.scrollTop ?? 0; this.tierlistScreen(); const s = document.querySelector('.screen'); if (s) s.scrollTop = y; };
    // tap: pick a footballer (from the pool or a row), then a row puts him there; a picked one tapped again leaves the list
    this.on('[data-tp]', 'click', (e, el) => {
      e.stopPropagation();
      const id = Number(el.dataset.tp);
      if (this.tierPick === id) { this.tierPick = null; if (placed.has(id)) { saveDraft(placeIn(tiers, id, null)); sfx('click'); } }
      else this.tierPick = id;
      keepScroll();
    });
    this.on('.tl-board.edit .tl-row', 'click', (_e, el) => {
      if (this.tierPick === null) return;
      saveDraft(placeIn(tiers, this.tierPick, el.dataset.tier as Tier)); this.tierPick = null; sfx('pickup'); keepScroll();
    });
    // drag and drop (desktop)
    this.on('[data-tp]', 'dragstart', (e, el) => { (e as DragEvent).dataTransfer?.setData('text/plain', el.dataset.tp!); });
    this.on('.tl-board.edit .tl-row', 'dragover', (e) => e.preventDefault());
    this.on('.tl-board.edit .tl-row', 'drop', (e, el) => {
      e.preventDefault();
      const id = Number((e as DragEvent).dataTransfer?.getData('text/plain'));
      if (id) { saveDraft(placeIn(tiers, id, el.dataset.tier as Tier)); this.tierPick = null; sfx('pickup'); keepScroll(); }
    });
    this.on('.tl-pool', 'dragover', (e) => e.preventDefault());
    this.on('.tl-pool', 'drop', (e) => { e.preventDefault(); const id = Number((e as DragEvent).dataTransfer?.getData('text/plain')); if (placed.has(id)) { saveDraft(placeIn(tiers, id, null)); keepScroll(); } });
    const qi = document.getElementById('tlq') as HTMLInputElement;
    let qt = 0;
    qi.addEventListener('input', () => { window.clearTimeout(qt); qt = window.setTimeout(() => { this.tierQuery = qi.value; this.tierlistScreen(); const n2 = document.getElementById('tlq') as HTMLInputElement; n2.focus(); n2.setSelectionRange(n2.value.length, n2.value.length); }, 250); });
    document.getElementById('tlowned')!.addEventListener('click', () => { this.tierOwnedOnly = !this.tierOwnedOnly; this.tierlistScreen(); });
    document.getElementById('tlclear')!.addEventListener('click', () => { saveDraft({}); this.tierPick = null; this.tierlistScreen(); });
    document.getElementById('tlpub')!.addEventListener('click', async (e) => {
      if (!onlineConfigured() || !signedIn()) { this.toast(tr('Conéctate con tu cuenta en Perfil para publicarla')); return; }
      const b = e.currentTarget as HTMLButtonElement;
      b.disabled = true;
      try {
        await submitTierlist(topic.id, tiers as Record<string, number[]>);
        sfx('evolve'); this.toast(tr('¡Publicada! Ya sale en el menú de todos'));
        this.tierFeedCache = null; this.tierTab = 'comunidad'; this.tierlistScreen();
      } catch (err) {
        const m = String((err as Error)?.message ?? err);
        this.toast(/too_fast/.test(m) ? tr('Acabas de publicar: espera un minuto') : /no_username/.test(m) ? tr('Reserva tu nombre en Perfil para publicar') : /invalid_tiers/.test(m) ? tr('La lista no es válida') : tr('No se pudo publicar ahora'));
        b.disabled = false;
      }
    });
  }

  private async fillTierFeed(boxId: string, limit: number, size: number) {
    const box = document.getElementById(boxId);
    if (!box || !onlineConfigured()) return;
    try {
      const rows = this.tierFeedCache ?? (this.tierFeedCache = await tierlistFeed(20));
      if (!document.body.contains(box)) return;
      const shown = rows.filter((r) => tierCount(cleanTiers(r.tiers, (id) => this.byId.has(id))) >= TIER_MIN).slice(0, limit);
      box.innerHTML = shown.map((r) => this.tierCard(r, size)).join('') || `<div class="note">${tr('Aún no hay ninguna. ¡Publica la primera!')}</div>`;
    } catch { box.innerHTML = `<div class="note">${tr('Las tierlists no responden ahora.')}</div>`; }
  }

  /** Fix 1.31: training points that no stat can use (it already reaches 99) go back to the player, on load. */
  private trimAllTraining(save: SaveData, roster: RosterEntry[]) {
    let back = 0;
    for (const p of roster) if (save.owned[String(p.id)]?.train && p.stats) back += trimTraining(save, p, effectiveRarity(save, p), isHero(save, p.id));
    return back;
  }

  // ------------------------------------------------------------- ascension
  /** Ascension screen: current and next stage, duplicates, cost, before/after, unlocks, confirm and transformation. */
  ascension(id: number, back: () => void) {
    const p = this.byId.get(id);
    if (!p || !this.owned(id)) return;
    const next = nextStep(this.save, p);
    const spares = sparesOf(this.save, id);
    const now = ascMultipliers(this.save, p);
    const after = next ? { damage: now.damage * ASC_BONUS[next.step].damage, hp: now.hp * ASC_BONUS[next.step].hp } : now;
    const curR = effectiveRarity(this.save, p);
    const hs = this.owned(id)?.heroStars ?? 0;
    // Fix 1.51: the next rarity counts from the one he already reached (an Épico ascended to Legendario goes on to Mítico)
    const ch = championOf(this.save, id);
    const up = rarityUp(curR), label = next?.step === 'ascenso' ? `${RARITY_LABEL[up].toUpperCase()}${up === curR ? ' +' : ''}` : next?.step === 'estrella' ? tr('HÉROE {x1}', { x1: '★'.repeat(hs + 1) }) : next?.step === 'campeon' ? CHAMPION_LABEL[ch + 1] : tr('HÉROE');
    const pct = (v: number) => `+${Math.round((v - 1) * 100)}%`;
    const starUnlocks = [tr('Estrella de héroe {x1} de {HERO_STARS_MAX}: +{x2}% daño, +{x3}% vida y +1 a todas sus estadísticas', { x1: hs + 1, HERO_STARS_MAX, x2: Math.round((ASC_BONUS.estrella.damage - 1) * 100), x3: Math.round((ASC_BONUS.estrella.hp - 1) * 100) })];
    // 1.8: what each Campeón level brings
    const champUnlocks = [tr('{x1}: el límite de sus estadísticas sube de {x2} a {x3}', { x1: CHAMPION_LABEL[ch + 1], x2: statCapOf(this.save, p), x3: statCapOf(this.save, p) + CHAMPION_CAP }),
      tr('+{CHAMPION_STATS} a todas sus estadísticas y +{CHAMPION_TRAIN} puntos de entrenamiento para repartir', { CHAMPION_STATS, CHAMPION_TRAIN }),
      tr('+{x1}% daño y +{x2}% vida en partida', { x1: Math.round((ASC_BONUS.campeon.damage - 1) * 100), x2: Math.round((ASC_BONUS.campeon.hp - 1) * 100) }),
      ch + 1 < CHAMPION_MAX ? tr('Después: {x1} ({x2} duplicados)', { x1: CHAMPION_LABEL[ch + 2], x2: CHAMPION_COSTS[ch + 1] }) : tr('Es el último nivel: Campeón++')];
    const unlocks = next?.step === 'campeon' ? champUnlocks : !next && ch ? [tr('{x1}: estadísticas hasta {x2} y {x3} puntos de entrenamiento', { x1: CHAMPION_LABEL[ch], x2: statCapOf(this.save, p), x3: trainMaxOf(this.save, id) })]
      : next?.step === 'estrella' ? starUnlocks : next?.step === 'heroe' || (!next && isHero(this.save, id))
      ? [tr('Técnica de HÉROE: {x1}', { x1: p.heroTech ? tTech(p.heroTech.name) : tr('ninguna documentada para este jugador') }), tr('{label} (habilidad original de InaZurvivors): {description}', { label: HERO_AURA.label, description: HERO_AURA.description }), tr('Marco dorado e insignia HÉROE en la colección')]
      : [up === curR ? tr('Ascendido: sigue siendo {x1}, con la bonificación de ascensión', { x1: RARITY_LABEL[up] }) : tr('Rareza {x1} (sin cambiar de personaje): sus estadísticas suben a las de un {x2}', { x1: RARITY_LABEL[up], x2: RARITY_LABEL[up] }),
        isTopRarity(up) ? tr('Después, la ascensión HÉROE ({x1} duplicados)', { x1: (ASC_COSTS[p.rarity] ?? ASC_COSTS.legendario).heroe }) : tr('Después, la siguiente ascensión: {x1} ({x2} duplicados)', { x1: RARITY_LABEL[rarityUp(up)], x2: ASC_COSTS[up].ascenso })];
    const box = document.createElement('div');
    box.className = 'tut-modal asc-modal';
    box.innerHTML = `<div class="panel asc-card${isHero(this.save, id) ? ' is-hero' : ''}" style="--rc:${RARITY_COLOR[curR]}">
      <h2>${next ? (next.step === 'estrella' ? tr('Estrellas de héroe') : next.step === 'campeon' ? tr('Camino del Campeón') : 'Ascensión') : ch ? `¡${CHAMPION_LABEL[ch]}!` : tr('¡HÉROE {x1}!', { x1: '★'.repeat(hs) })}</h2>
      <div class="asc-row"><div class="asc-art">${this.mug(id, 128)}${charCanvas(id, 3, 12)}</div>
        <div class="asc-info"><b>${esc(p.name)}</b>
          <div class="asc-step">${this.rar(p)}${next ? ` <em>»</em> <span class="rar ${next.step === 'ascenso' ? up : 'heroe'}">${label}</span>` : ''}</div>
          ${next ? `<div class="asc-cost${spares >= next.cost ? ' ok' : ''}">${tr('Duplicados:')} <b>${spares}/${next.cost}</b>${spares >= next.cost ? '' : ` · te faltan ${next.cost - spares}`}</div>` : ''}
          <div class="asc-stats"><span>${tr('Daño en partida')}</span><b>${pct(now.damage)}</b>${next ? `<em>»</em><b class="up">${pct(after.damage)}</b>` : ''}
            <span>${tr('Vida aportada')}</span><b>${pct(now.hp)}</b>${next ? `<em>»</em><b class="up">${pct(after.hp)}</b>` : ''}</div>
          <ul class="gi-list">${unlocks.map((u) => `<li>${esc(u)}</li>`).join('')}</ul>
          <div class="note">${tr('Los duplicados se consumen; las estrellas ya ganadas se conservan.')}</div></div></div>
      <div class="tut-nav"><button class="btn small blue" id="ascclose">${tr('Cerrar')}</button><span class="spacer"></span>
        ${next ? `<button class="btn big" id="ascgo" ${spares >= next.cost ? '' : 'disabled'}>${tr('Ascender ({cost} duplicados)', { cost: next.cost })}</button>` : ''}</div></div>`;
    document.body.appendChild(box);
    mountPreviews();
    const close = () => { box.remove(); back(); };
    box.querySelector('#ascclose')!.addEventListener('click', close);
    const go = box.querySelector('#ascgo') as HTMLButtonElement | null;
    go?.addEventListener('click', () => this.armed(go, async () => {
      go.disabled = true; // one operation: the button can't fire twice while the animation plays
      const step = ascend(this.save, p);
      if (!step) { sfx('error'); return; }
      // Fix 1.31: training points the new stats can't use any more come back
      const returned = trimTraining(this.save, p, effectiveRarity(this.save, p), isHero(this.save, p.id));
      this.persist();
      if (returned) window.setTimeout(() => this.toast(tr('Te devolvemos {returned} {x1} de entrenamiento: esas estadísticas ya llegan a su máximo', { returned, x1: returned === 1 ? 'punto' : 'puntos' }), 4500), 1600);
      box.querySelector('.asc-card')!.classList.add('transform');
      sfx('legend');
      if (this.save.settings.particles !== 'desactivado') confetti(step === 'ascenso' ? 50 : 90);
      await wait(1400);
      box.remove();
      await this.ascensionCard(p, step);
      this.ascension(id, back);
    }));
  }

  /** Fix 1.23: the new card after an ascension, with the same entrance as a gacha reveal (rays, flash, rarity shine). */
  private ascensionCard(p: RosterEntry, step: AscStep) {
    return new Promise<void>((resolve) => {
      const r = effectiveRarity(this.save, p), hero = step !== 'ascenso';
      const heroLabel = step === 'campeon' ? CHAMPION_LABEL[championOf(this.save, p.id)] : step === 'estrella' ? tr('HÉROE {x1}', { x1: '★'.repeat(this.owned(p.id)?.heroStars ?? 1) }) : tr('HÉROE');
      const tier = r === 'leyenda' || hero ? 3 : r === 'mitico' ? 2 : r === 'legendario' ? 1 : 0;
      const ov = document.createElement('div');
      ov.className = `reveal asc-reveal${tier >= 1 ? ' legend' : ''}${tier >= 2 ? ' myth' : ''}${hero ? ' leyenda' : ''}`;
      ov.style.setProperty('--rc', `${RARITY_COLOR[r]}55`);
      ov.innerHTML = `<div class="rays"></div><div class="flash go"></div>
        <div class="reveal-card from-scene"><div class="rarity-big t${tier}" style="color:${hero ? '#ffd21f' : RARITY_COLOR[r]}">${hero ? heroLabel : RARITY_LABEL[r].toUpperCase()}</div>
          ${this.pcard(p, { anim: 12, big: true })}<div class="newtag">${step === 'campeon' ? `¡${CHAMPION_LABEL[championOf(this.save, p.id)]}!` : step === 'estrella' ? tr('¡NUEVA ESTRELLA DE HÉROE!') : hero ? tr('¡HÉROE!') : tr('¡ASCENDIDO!')}</div><button class="btn big">${tr('Aceptar')}</button></div>`;
      document.body.appendChild(ov);
      mountPreviews();
      sfx(hero ? 'leyenda' : tier >= 2 ? 'myth' : 'legend');
      const close = () => { window.removeEventListener('keydown', keys, true); ov.remove(); resolve(); };
      const keys = (e: KeyboardEvent) => { if (e.code === 'Space' || e.code === 'Enter' || e.code === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); } };
      window.addEventListener('keydown', keys, true);
      ov.querySelector('.btn')!.addEventListener('click', close);
    });
  }

  // ------------------------------------------------------------- hall of fame
  /** Every victory with the squad that won it, plus the players who have won the most. */
  hallOfFame() {
    setMusicContext('menu');
    const hall = this.save.hall ?? [];
    const mapName = (id: string) => this.m.maps.find((x) => x.id === id)?.name ?? id;
    const champs = championsTable(this.save).slice(0, 10).filter((c) => this.byId.has(c.id));
    const top = champs.map((c, i) => { const p = this.byId.get(c.id)!; return `<div class="hof-champ${i < 3 ? ` top${i + 1}` : ''}" style="--rc:${RARITY_COLOR[p.rarity]};--d:${i * 50}ms">
      <span class="rk-pos">${i < 3 ? ['🥇', '🥈', '🥉'][i] : `#${i + 1}`}</span>${this.mug(p.id, 64)}<b>${esc(p.name)}</b>
      <small>${tr('{wins} {x1} · {captain} de capitán · mejor rango {best}', { wins: c.wins, x1: c.wins === 1 ? 'victoria' : 'victorias', captain: c.captain, best: c.best })}</small></div>`; }).join('');
    const rows = hall.slice(0, 60).map((t, i) => `<div class="hof-run" style="--d:${Math.min(i, 15) * 40}ms">
      <span class="rank-btn r-${t.rank} rk-r">${rankMark(t.rank)}</span>
      <span class="hof-meta"><b>${esc(mapName(t.map))}</b><small>${tr('{x1} · {time} · {kills} eliminaciones · {x2} daño{x3}', { x1: new Date(t.at).toLocaleDateString(locale()), time: fmtTime(t.time), kills: t.kills, x2: t.damage.toLocaleString(locale()), x3: t.endless ? ` · ∞ ${fmtTime(t.endless)}` : '' })}</small></span>
      <span class="hof-team">${t.team.filter((id) => this.byId.has(id)).map((id, k) => `<span class="hof-p${k === 0 ? ' cap' : ''}" title="${esc(this.byId.get(id)!.name)}">${this.mug(id, 44)}${k === 0 ? '<i>C</i>' : ''}</span>`).join('')}</span></div>`).join('');
    const byMap = this.m.maps.map((mp) => `${esc(mp.name)}: ${hall.filter((t) => t.map === mp.id).length}`).join(' · ');
    this.show(`<div class="screen">${this.titlebar(tr('Salón de la fama'), 'Menú')}
      <div class="panel"><b class="hof-total">${hall.length} ${hall.length === 1 ? 'victoria' : 'victorias'}</b><div class="note">${byMap}${this.save.stats.bestEndless ? tr(' · Récord infinito {bestEndless}', { bestEndless: fmtTime(this.save.stats.bestEndless) }) : ''}</div></div>
      ${champs.length ? `<div class="panel"><h3>${tr('Leyendas de tu club')}</h3><div class="hof-champs">${top}</div></div>` : ''}
      <div class="panel"><h3>${tr('Victorias')}</h3><div class="hof-list">${rows || `<div class="note">${tr('Aún no has ganado ninguna partida. ¡La primera victoria quedará aquí con tu equipo!')}</div>`}</div></div></div>`);
    this.on('[data-back]', 'click', () => this.mainMenu());
  }

  // ------------------------------------------------------------- ranking
  private rankQuery: BoardQuery = { map: null, rank: null, order: 'score' };

  /** TOP 15 + my position. Online when the service is configured; otherwise this device's best marks. */
  ranking() {
    setMusicContext('menu');
    const q = this.rankQuery;
    const online = onlineConfigured();
    // v1.4: the filters are chips (one tap) instead of drop-down lists
    const multTxt = (id: string) => `×${String(+mapMult(id).toFixed(2)).replace('.', ',')}`; // 2.01: the arena's difficulty, visible
    const chips = (key: 'map' | 'rank' | 'order', opts: [string, string][], cur: string) => `<div class="rk-chips" data-rq="${key}">${opts.map(([v, l]) => `<button class="rk-chip${cur === v ? ' on' : ''}" data-v="${v}">${esc(l)}</button>`).join('')}</div>`;
    this.show(`<div class="screen rk-screen">${this.titlebar(tr('Ranking'), tr('Menú'))}
      <div class="rk-hero"><span class="rk-hero-ic">${uiIcon('crown')}</span><div><b>${online ? tr('RANKING MUNDIAL') : tr('TUS MARCAS')}</b>
        <small>${online ? tr('Top 15 de todos los jugadores, cada uno con su mejor marca.') : tr('El servicio online no está activado en esta versión: solo aparecen las marcas de este dispositivo.')}</small></div>
        <details class="rk-how"><summary>${tr('{x1}¿Cómo se calculan los puntos?', { x1: uiIcon('help') })}</summary><div>${tr('Puntos = (segundos × 10 + √daño × 2) × rango × arena. El rango es lo que más cuenta: C ×1, B ×1,6, A ×2,4, S ×3,4, X ×4,8 y Z ×7. La arena suma un 5% por cada etapa del camino, también las nuevas: {x1}.', { x1: this.m.maps.map((mp) => `${esc(mp.name)} ${multTxt(mp.id)}`).join(' · ') })}</div></details></div>
      ${online ? this.rankSeasonStrip() : ''}
      <div class="rk-filters">
        <div class="rk-fg"><small>${tr('{x1}Ordenar', { x1: uiIcon('target') })}</small>${chips('order', [['score', tr('Puntos')], ['rank', tr('Rango')], ['time', tr('Tiempo')], ['damage', tr('Daño')]], q.order)}</div>
        <div class="rk-fg"><small>${tr('{x1}Rango', { x1: uiIcon('crown') })}</small>${chips('rank', [['', tr('Todos')], ...RANK_ORDER.map((r) => [r, r] as [string, string])], q.rank ?? '')}</div>
        <div class="rk-fg wide"><small>${tr('{x1}Arena', { x1: uiIcon('pitch') })}</small>${chips('map', [['', tr('Todas')], ...this.m.maps.map((mp) => [mp.id, `${mp.name} ${multTxt(mp.id)}`] as [string, string])], q.map ?? '')}</div></div>
      <div class="rank-list" id="rlist"><div class="note">${tr('Cargando…')}</div></div><div id="rme" class="rk-me"></div></div>`);
    this.on('[data-back]', 'click', () => this.mainMenu());
    this.on('.rk-chip', 'click', (_e, el) => {
      const key = (el.parentElement as HTMLElement).dataset.rq as 'map' | 'rank' | 'order', v = el.dataset.v ?? '';
      el.parentElement!.querySelectorAll('.rk-chip').forEach((c) => c.classList.toggle('on', c === el));
      this.rankQuery = { ...this.rankQuery, [key]: key === 'order' ? v as BoardQuery['order'] : v || null };
      void this.fillRanking();
    });
    void this.fillRanking();
  }

  private async fillRanking() {
    const q = this.rankQuery;
    const list = document.getElementById('rlist'), me = document.getElementById('rme');
    if (!list || !me) return;
    const mapName = (id: string) => `${this.m.maps.find((x) => x.id === id)?.name ?? id} · ×${String(+mapMult(id).toFixed(2)).replace('.', ',')}`; // 2.01: with the arena's multiplier
    const row = (pos: number, name: string, captain: number, crest: string, map: string, rank: string, time: number, damage: number, mine = false, score?: number) => {
      const p = this.byId.get(captain), pts = score ?? scoreOf({ map, rank, time, damage }), rb = this.flagMini(name);
      return `<div class="rank-row${pos <= 3 ? ` top${pos}` : ''}${mine ? ' mine' : ''}${rb ? ' has-pn' : ''}" style="--d:${Math.min(pos, 15) * 40}ms"${onlineConfigured() ? ` data-user="${esc(name)}" title="${tr('Ver el perfil de {name}', { name: esc(name) })}"` : ''}>
        ${rb}<span class="rk-pos">${pos <= 3 ? ['🥇', '🥈', '🥉'][pos - 1] : `#${pos}`}</span>
        ${this.framed(`<span class="rk-av${p ? ` r-${p.rarity}` : ''}${this.champLevel(name, captain) ? ' champ' : ''}">${p ? this.mug(p.id, 48) : ''}</span>`, this.frameOf(name))}
        <span class="rk-name"><b class="${this.goldName(name).trim()}">${esc(name)}</b>${this.clanBadge(name)}${this.sideBadge(name)}${this.champTag(name, captain)}<small>${esc(mapName(map))}</small></span>
        ${crest && this.emblemOf(crest) ? `<img class="rk-crest" src="${this.emblemOf(crest)}" alt="">` : '<span class="rk-crest"></span>'}
        <span class="rank-btn r-${rank} rk-r">${rankMark(rank)}</span>
        <span class="rk-num rk-pts${q.order === 'score' || q.order === 'rank' ? ' on' : ''}"><b>${pts.toLocaleString(locale())}</b><small>${tr('puntos')}</small></span>
        <span class="rk-num${q.order === 'time' ? ' on' : ''}"><b>${fmtTime(time)}</b><small>${tr('tiempo')}</small></span><span class="rk-num${q.order === 'damage' ? ' on' : ''}"><b>${damage.toLocaleString(locale())}</b><small>${tr('daño')}</small></span></div>`;
    };
    type RowArgs = readonly [number, string, number, string, string, string, number, number, boolean, number | undefined];
    const metric = (time: number, damage: number, pts: number) => q.order === 'time' ? [fmtTime(time), 'tiempo'] : q.order === 'damage' ? [damage.toLocaleString(locale()), 'daño'] : [pts.toLocaleString(locale()), 'puntos'];
    const podium = (top: readonly RowArgs[]) => `<div class="rk-podium">${top.map(([pos, name, captain, crest, map, rank, time, damage, , score]) => {
      const p = this.byId.get(captain), pts = score ?? scoreOf({ map, rank, time, damage }), [big, unit] = metric(time, damage, pts);
      return `<div class="rk-pod p${pos}" style="--d:${pos * 90}ms"${onlineConfigured() ? ` data-user="${esc(name)}" title="${tr('Ver el perfil de {name}', { name: esc(name) })}"` : ''}><span class="rk-medal">${pos}</span>
        ${this.framed(`<span class="rk-pmug${p ? ` r-${p.rarity}` : ''}${this.champLevel(name, captain) ? ' champ' : ''}">${p ? this.mug(p.id, pos === 1 ? 112 : 88) : ''}</span>`, this.frameOf(name))}
        ${this.namePlate('rk-pname', name)}${this.clanBadge(name)}${this.sideBadge(name)}${this.champTag(name, captain)}<small>${p ? esc(p.name) : ''} · ${esc(mapName(map))}</small>
        <div class="rk-pbig"><b>${big}</b><small>${unit}</small></div>
        <div class="rk-pmeta">${crest && this.emblemOf(crest) ? `<img class="rk-crest" src="${this.emblemOf(crest)}" alt="">` : ''}<span class="rank-btn r-${rank}">${rankMark(rank)}</span>
          <span><b>${fmtTime(time)}</b><small>${tr('tiempo')}</small></span><span><b>${damage.toLocaleString(locale())}</b><small>${tr('daño')}</small></span></div>
        <i class="rk-step"><b>${pos}</b></i></div>`;
    }).join('')}</div>`;
    if (!onlineConfigured()) {
      const rows = localBoard(this.save, q.map, q.rank, q.order);
      const all = rows.slice(0, 15).map((m) => [m.pos, this.save.profile.name, m.captainId, this.save.crest, m.map, m.rank, m.time, m.damage, true, m.score] as const);
      list.innerHTML = all.length ? podium(all.slice(0, 3)) + all.slice(3).map((r) => row(...r)).join('') : `<div class="note">${tr('Aún no hay marcas: termina una partida.')}</div>`;
      me.innerHTML = '';
      return;
    }
    try {
      const rows = await leaderboard(q);
      await Promise.all([this.loadFlags(rows.map((r) => r.username)), this.loadChamps(rows.map((r) => ({ username: r.username, captain: r.captain_id })))]); // v1.65; 2.0 champions
      const all = rows.map((r) => [Number(r.pos), r.username, r.captain_id, r.crest, r.map, r.rank, r.time_sec, Number(r.damage), false, r.score == null ? undefined : Number(r.score)] as const);
      list.innerHTML = all.length ? podium(all.slice(0, 3)) + all.slice(3).map((r) => row(...r)).join('') : `<div class="note">${tr('Nadie ha jugado este tablero todavía.')}</div>`;
      const mine = signedIn() ? await myPosition(q) : null;
      me.innerHTML = mine ? `<h3>${tr('{x1}Mi posición', { x1: uiIcon('target') })}</h3>${row(Number(mine.pos), mine.username, mine.captain_id, mine.crest, mine.map, mine.rank, mine.time_sec, Number(mine.damage), true, mine.score == null ? undefined : Number(mine.score))}`
        : `<div class="note">${signedIn() ? tr('Aún no tienes marca en este tablero.') : tr('Conecta tu cuenta en Perfil para aparecer aquí.')}</div>`;
      this.bindUsers(list); this.bindUsers(me);
    } catch (err) {
      // Fix 1.32: a clear message and a retry instead of the server's raw text
      void err;
      list.innerHTML = `<div class="panel rank-down"><b>${tr('El ranking no está disponible ahora mismo')}</b><div class="note">${tr('El servidor está saturado o no hay conexión. Tu partida y tus marcas no se pierden.')}</div><button class="btn small" id="rretry">${tr('Reintentar')}</button></div>`;
      document.getElementById('rretry')?.addEventListener('click', () => { list.innerHTML = '<div class="note">Cargando…</div>'; void this.fillRanking(); });
    }
  }

  // ------------------------------------------------------------- v1.65 profile banners
  /** banner of each name on the ranking (lowercase name → id), filled before a board is drawn */
  private flagCache = new Map<string, string>();
  private async loadFlags(names: string[]) {
    const want = [...new Set(names.filter(Boolean))];
    if (!want.length || !onlineConfigured()) return;
    await Promise.all([
      profileBanners(want).then((got) => { for (const n of want) this.flagCache.delete(n.toLowerCase()); for (const r of got) if (PENNANT_BY_ID.has(r.banner)) this.flagCache.set(r.username.toLowerCase(), r.banner); }).catch(() => { /* the board shows without banners */ }),
      profileFrames(want).then((got) => { for (const n of want) this.frameCache.delete(n.toLowerCase()); for (const r of got) if (isFrame(PENNANT_BY_ID.get(r.frame))) this.frameCache.set(r.username.toLowerCase(), r.frame); }).catch(() => { /* without frames */ }),
      passHolders(want).then((got) => { for (const n of want) this.goldCache.delete(n.toLowerCase()); for (const r of got) this.goldCache.add(r.username.toLowerCase()); }).catch(() => { /* names in white (the function may not be on the server yet) */ }), // 2.11
      clanOf(want).then((got) => { for (const n of want) this.clanCache.delete(n.toLowerCase()); for (const r of got) this.clanCache.set(r.username.toLowerCase(), { name: r.clan, crest: r.crest }); }).catch(() => { /* without clans */ }), // 1.93
      sectorSides(want).then((got) => { for (const n of want) this.sideCache.delete(n.toLowerCase()); for (const r of got) if (r.side in SIDES) this.sideCache.set(r.username.toLowerCase(), r.side as SideId); }).catch(() => { /* without sides */ }), // 2.2
    ]);
  }
  /** 2.0 (author: «que en el ranking se vea si es campeón o no»): the Camino del Campeón level of each row's captain
   *  (lowercase name|captain → 1..3); one's own comes from the save */
  private champCache = new Map<string, number>();
  private async loadChamps(rows: { username: string; captain: number }[]) {
    if (!rows.length || !onlineConfigured()) return;
    try {
      const got = await championOfRows(rows);
      for (const r of rows) this.champCache.delete(`${r.username.toLowerCase()}|${r.captain}`);
      for (const r of got) if (r.champion > 0) this.champCache.set(`${r.username.toLowerCase()}|${r.captain_id}`, r.champion);
    } catch { /* the board shows without it (the function may not be on the server yet) */ }
  }
  private champLevel(name: string, captain: number) {
    const me = (this.save.onlineName ?? this.save.profile.name).toLowerCase() === name.toLowerCase();
    return me ? championOf(this.save, captain) : this.champCache.get(`${name.toLowerCase()}|${captain}`) ?? 0;
  }
  private champTag(name: string, captain: number) {
    const c = this.champLevel(name, captain);
    return c ? `<span class="rk-champ c${c}" title="${tr('Su capitán es {x1}', { x1: CHAMPION_LABEL[c] })}">♛ ${CHAMPION_LABEL[c]}</span>` : '';
  }
  /** 1.93: the clan of each name on the ranking (lowercase name → clan) */
  private clanCache = new Map<string, { name: string; crest: string }>();
  private clanBadge(name: string) {
    const me = (this.save.onlineName ?? this.save.profile.name).toLowerCase() === name.toLowerCase();
    const c = me && this.save.clanSeen ? { name: this.save.clanSeen.name, crest: this.save.clanSeen.crest } : this.clanCache.get(name.toLowerCase());
    return c ? `<span class="rk-clan" data-clan="${esc(c.name)}" title="${tr('Ver el clan {cName}', { cName: esc(c.name) })}">${c.crest && this.emblemOf(c.crest) ? `<img src="${this.emblemOf(c.crest)}" alt="">` : uiIcon('team')}<em>${esc(c.name)}</em></span>` : '';
  }
  /** 2.2 (author: «que se vea en el ranking el bando»): Sector Quinto or Resistencia next to the name (lowercase name → side) */
  private sideCache = new Map<string, SideId>();
  private sideBadge(name: string) {
    const me = (this.save.onlineName ?? this.save.profile.name).toLowerCase() === name.toLowerCase();
    const id = me && signedIn() ? sectorOf(this.save).side ?? this.sideCache.get(name.toLowerCase()) : this.sideCache.get(name.toLowerCase());
    const s = id ? SIDES[id] : null, logo = id ? this.m.sector?.[id] : null;
    return s ? `<span class="rk-side sd-${s.id}" title="${tr('Bando: {sName}', { sName: esc(s.name) })}">${logo ? `<img src="${logo}" alt="">` : ''}<em>${esc(s.name)}</em></span>` : '';
  }
  /** v1.65: avatar frame of each name on the ranking (lowercase name → id) */
  private frameCache = new Map<string, string>();
  private frameOf(name: string) {
    const me = (this.save.onlineName ?? this.save.profile.name).toLowerCase() === name.toLowerCase();
    return me ? equippedFrame(this.save)?.id : this.frameCache.get(name.toLowerCase());
  }
  /** an avatar inside its frame (unchanged without one); `square` for the profile icons */
  private framed(html: string, id: string | null | undefined, square = false) {
    const svg = frameSvg(id, square);
    const wide = !!(id && PENNANT_BY_ID.get(id)?.wings); // 1.81: winged frames are wider and keep room for their wings
    return svg ? `<span class="fr-host${square ? ' sq' : ''}${wide ? ' wide' : ''}">${html}<span class="fr-ov">${svg}</span></span>` : html;
  }
  /** 2.11: a number in the saga's digits (tools/ui_assets.py), each glyph cut from its strip; other characters stay text */
  private digitsHtml(text: string, colour: 'naranja' | 'morado' = 'naranja') {
    const d = this.m.ui?.digits?.[colour];
    if (!d) return esc(text);
    return `<span class="dgs" style="--dg:url(${d.png})">${[...text].map((ch) => {
      const n = ch.charCodeAt(0) - 48;
      if (n < 0 || n > 9) return ch === ' ' ? '<span class="dg-sp"></span>' : `<span class="dg-t">${esc(ch)}</span>`;
      const [x, w] = d.glyphs[n];
      return `<i class="dg" style="width:${w}px;background-position:-${x}px 0"></i>`;
    }).join('')}</span>`;
  }
  /** 2.11: a detail of the saga's interface (VS badge, chevron, lightning hexagon); '' without it */
  private uiPiece(id: 'vs' | 'chevron' | 'chevron_azul' | 'rayo_hex' | 'rayo_hex_rojo', cls = '') {
    const src = this.m.ui?.pieces?.[id];
    return src ? `<img class="ui-pc ui-${id}${cls ? ` ${cls}` : ''}" src="${src}" alt="">` : '';
  }
  /** the face a frame is shown on in the cards: the captain, or the profile icon */
  private frameFace() {
    const cap = this.save.captainId != null && this.byId.has(this.save.captainId) ? this.save.captainId : null;
    return `<span class="fr-face">${cap != null ? this.mug(cap, 56) : this.profileIcon(56)}</span>`;
  }
  /** the banner ribbon behind a name on a board: mine from my save, the rest from the server ('' without one) */
  private flagMini(name: string) {
    const me = (this.save.onlineName ?? this.save.profile.name).toLowerCase() === name.toLowerCase();
    const id = me ? equippedPennant(this.save)?.id : this.flagCache.get(name.toLowerCase());
    return id ? pennantRibbon(id) : '';
  }
  /** 2.11 (author): the names of whoever holds this season's Llave dorada go in gold on the boards; mine from my save */
  private goldCache = new Set<string>();
  private goldName(name: string) {
    const me = (this.save.onlineName ?? this.save.profile.name).toLowerCase() === name.toLowerCase();
    const def = me ? activeSeason(serverNow()) : null;
    return (me ? !!def && this.save.season?.id === def.id && this.save.season.gold : this.goldCache.has(name.toLowerCase())) ? ' pass-gold' : '';
  }
  /** a podium name on its banner ribbon (author: banners across, Clash Royale style) */
  private namePlate(cls: string, name: string) {
    const rb = this.flagMini(name);
    return `<b class="${cls}${rb ? ' pn-plate' : ''}${this.goldName(name)}">${rb}<span>${esc(name)}</span></b>`;
  }
  private pennantCard(def: PennantDef, extra = '', attrs = '') {
    return `<div class="pn-card r-${def.rarity}" style="--rc:${RARITY_COLOR[def.rarity]}" ${attrs} title="${esc(def.tagline)}">${isFrame(def) ? `<span class="fr-prev">${this.framed(this.frameFace(), def.id)}</span>` : `<span class="pn-prev">${pennantRibbon(def)}</span>`}<b>${esc(def.name)}</b><small>${RARITY_LABEL[def.rarity]}</small>${extra}</div>`;
  }
  /** Perfil: every banner, the owned ones to wear (tap again to take it off), the rest with how to get them */
  private pennantPanel() {
    // 1.81: a code's banner is only listed for whoever owns it
    const list = PENNANTS.filter((d) => visiblePennant(this.save, d));
    const eq = this.save.pennants?.equipped, owned = list.filter((d) => hasPennant(this.save, d.id)).length;
    const how = (d: PennantDef) => d.source === 'tienda' ? tr('Tienda · {x1} ◉', { x1: d.price?.toLocaleString(locale()) }) : d.source === 'logro' ? tr('Logro: {how}', { how: d.how }) : d.source === 'codigo' ? (d.how ?? tr('Código')) : d.source === 'clan' ? tr('Tienda del clan') : d.source === 'colab' ? tr('Colaboración BlueLock: {how}{x1}', { how: d.how, x1: d.id === 'colab-bluelock' && !hasPennant(this.save, d.id) ? ` (${Math.min(this.save.blWins ?? 0, BLUELOCK_WINS_FOR_BANNER)}/${BLUELOCK_WINS_FOR_BANNER})` : '' }) : tr('Evento por tiempo limitado');
    return `<div class="panel pf-pennants"><h3>${tr('{x1}Banners', { x1: uiIcon('crown') })} <small>${owned}/${list.length}</small></h3>
      <p class="note">${tr('Tu banner sale junto a tu nombre en el ranking y en tu perfil, también cuando otros lo abren.')}</p>
      <div class="pn-grid">${list.map((d) => { const own = hasPennant(this.save, d.id);
        return `<button class="pn-pick${own ? '' : ' locked'}${eq === d.id ? ' on' : ''}" data-pn="${d.id}">${this.pennantCard(d, `<span class="pn-how">${own ? (eq === d.id ? '★ Equipado' : 'Equipar') : esc(how(d))}</span>`)}</button>`; }).join('')}</div></div>
      ${this.framePanel(how)}`;
  }
  /** v1.65 (author): Perfil » Marcos — like the banners: wear one around your avatar, tap again to take it off */
  private framePanel(how: (d: PennantDef) => string) {
    const list = FRAMES.filter((d) => visiblePennant(this.save, d));
    const eq = this.save.pennants?.frame, owned = list.filter((d) => hasPennant(this.save, d.id)).length;
    return `<div class="panel pf-pennants pf-frames"><h3>${tr('{x1}Marcos', { x1: uiIcon('crown') })} <small>${owned}/${list.length}</small></h3>
      <p class="note">${tr('Tu marco rodea tu icono en el ranking y en tu perfil, también cuando otros lo abren.')}</p>
      <div class="pn-grid">${list.map((d) => { const own = hasPennant(this.save, d.id);
        return `<button class="pn-pick${own ? '' : ' locked'}${eq === d.id ? ' on' : ''}" data-fr="${d.id}">${this.pennantCard(d, `<span class="pn-how">${own ? (eq === d.id ? '★ Equipado' : 'Equipar') : esc(how(d))}</span>`)}</button>`; }).join('')}</div></div>`;
  }
  private leftText(ms: number) {
    const d = Math.floor(ms / 86_400_000), h = Math.floor(ms / 3_600_000) % 24, m = Math.floor(ms / 60_000) % 60;
    return d ? `${d} d ${h} h` : `${h} h ${m} min`;
  }
  private eventLeftText(now: number | Date) {
    const ms = eventLeftMs(now), d = Math.floor(ms / 86_400_000), h = Math.floor(ms / 3_600_000) % 24, m = Math.floor(ms / 60_000) % 60;
    return d ? `${d} d ${h} h` : `${h} h ${m} min`;
  }
  /**
   * v1.65 (author): the limited-time banner event — three days, paid with coins (1.500 a pull, 10.000 the ×10), it
   * drops only its ten banners; the Mítico Supernova Oscura only comes from here, at 3%. A banner already owned gives
   * coins back.
   */
  private pennantEvent(results?: PennantPull[]) {
    setMusicContext('gacha');
    const now = serverNow(), open = eventActive(now), c = this.save.coins;
    const odds = eventOdds();
    const res = results ? `<div class="panel pn-results"><h3>${results.some((r) => r.isNew) ? tr('¡Premios nuevos!') : 'Resultado'}</h3><div class="pn-grid pn-reveal">${results.map((r, k) =>
      this.pennantCard(r.def, r.isNew ? `<em class="pn-new">${tr('¡NUEVO!')}</em>` : `<em class="pn-dup">${tr('Repetido · +{refund} ◉', { refund: r.refund })}</em>`, `data-k="${k}" style="--rc:${RARITY_COLOR[r.def.rarity]};--k:${k}"`)).join('')}</div></div>` : '';
    this.show(`<div class="screen pn-screen">${this.titlebar(PENNANT_EVENT.name, tr('Menú'))}
      <div class="panel pn-hero"><div class="pn-hero-art">${pennantRibbon('supernova')}</div>
        <div class="pn-hero-tx"><small>${tr('EVENTO POR TIEMPO LIMITADO')}</small><b>${tr('Banners y marcos de leyenda')}</b>
          <p>${tr('Diez banners y diez marcos nuevos para tu perfil, del Neumático de Entrenamiento a La Tierra. Los dos <b>Míticos Supernova Oscura</b> (banner y marco) solo salen aquí, con un 3% cada uno. Si te sale uno que ya tienes, recuperas monedas.')}</p>
          <div class="pn-left">${open ? `${tr('Termina en <b>{eventLeftText}</b>', { eventLeftText: this.eventLeftText(now) })}` : +now < Date.parse(PENNANT_EVENT.start) ? tr('Todavía no ha empezado') : tr('El evento ha terminado')}</div>
          <div class="pn-buy"><button class="btn big" id="pn1" ${!open || c < PENNANT_EVENT.cost ? 'disabled' : ''}>${tr('Tirada · {x1} ◉', { x1: PENNANT_EVENT.cost.toLocaleString(locale()) })}</button>
            <button class="btn big blue" id="pn10" ${!open || c < PENNANT_EVENT.multiCost ? 'disabled' : ''}>×10 · ${PENNANT_EVENT.multiCost.toLocaleString(locale())} ◉</button></div>
          <small class="note">${tr('Tienes {x1} ◉', { x1: c.toLocaleString(locale()) })}</small></div></div>
      ${res}
      <div class="panel"><h3>${tr('{x1}Banners y marcos del evento', { x1: uiIcon('capsule') })}</h3><div class="pn-grid">${odds.map((o) =>
        this.pennantCard(o.def, `<span class="pn-odds">${+o.pct.toFixed(2)}%</span>${hasPennant(this.save, o.def.id) ? '<span class="pn-own">✔ Tuyo</span>' : ''}`)).join('')}</div></div></div>`);
    this.on('[data-back]', 'click', () => this.mainMenu());
    const pull = (n: 1 | 10) => {
      const r = pullEvent(this.save, n, serverNow());
      if (!r) { sfx('error'); this.toast(eventActive(serverNow()) ? tr('No tienes monedas suficientes') : tr('El evento no está activo')); return; }
      this.persist();
      const best = r.some((x) => x.def.rarity === 'mitico' || x.def.rarity === 'legendario');
      sfx(best ? 'legend' : 'buy');
      if (best && this.save.settings.particles !== 'desactivado') confetti(80);
      this.pennantEvent(r);
    };
    document.getElementById('pn1')?.addEventListener('click', () => pull(1));
    document.getElementById('pn10')?.addEventListener('click', (e) => this.armed(e.currentTarget as HTMLElement, () => pull(10)));
  }

  /** v1.6 (author): another player's club, opened from the ranking — icon, crest, favourite team, totals and squad */
  // ------------------------------------------------------------- pre-2.0 Road to Fútbol Frontier
  /** the road match being played (diff, level), so the end of the run goes to the road */
  private roadMatch: { diff: RoadDiff; level: number } | null = null;
  private roadPick: number[] = [];
  private roadDiff: RoadDiff = 'facil';

  /** the notice of the new mode, once */
  private roadIntro() {
    if (document.querySelector('.road-intro')) return;
    sfx('reveal');
    const jaden = this.byId.get(JADEN_ID);
    const box = document.createElement('div');
    box.className = 'modal road-intro';
    box.innerHTML = `<div class="panel road-intro-card"><small>${tr('¡NUEVO MODO!')}</small><h2>${tr('Road to Fútbol Frontier')}</h2>
      <p>${tr('Elige a <b>5 futbolistas del Raimon o de Inazuma Japan</b> (sin Auras; tu entrenador sí cuenta) y supera <b>3, 4 o 5 partidos seguidos</b> hasta la final del Estadio Zeus. Si pierdes uno, se acaba el camino.')}</p>
      <ul><li>${tr('En <b>Máxima</b>, un <b>Legendario o mejor</b> asegurado al completarlo.')}</li><li>${tr('{x1} <b>{x2}</b> {x3} <b>{x4}</b>{x5}; cada {JADEN_EVERY} más, otra copia suya.', { x1: tr('Complétalo en Máxima'), x2: tr('{JADEN_FIRST} veces', { JADEN_FIRST }), x3: tr('y ficharás a la Leyenda'), x4: tr('Jaden Evans'), x5: jaden ? ` <span class="road-jmug">${this.mug(JADEN_ID, 40)}</span>` : '', JADEN_EVERY })}</li><li>${tr('Nuevos logros en Misiones.')}</li></ul>
      <div class="cp-actions"><button class="btn big" id="rdgo">${tr('¡Vamos!')}</button><button class="btn blue" id="rdlater">${tr('Más tarde')}</button></div></div>`;
    this.root.appendChild(box);
    const done = () => { box.remove(); this.save.roadIntroSeen = true; this.persist(); };
    box.querySelector('#rdgo')!.addEventListener('click', () => { done(); this.roadScreen(); });
    box.querySelector('#rdlater')!.addEventListener('click', done);
  }

  /** pre-2.0: the mode's screen — difficulty, the five, the coach, the road in progress and the way to Jaden */
  roadScreen() {
    setMusicContext('menu');
    const road = roadOf(this.save), active = road.active;
    const pool = this.unlockedRoster().filter(roadEligible).sort((a, b2) => this.meanOf(b2) - this.meanOf(a));
    this.roadPick = this.roadPick.filter((id) => pool.some((p) => p.id === id)).slice(0, ROAD_SQUAD);
    const coach = this.benchCoach();
    const maxClears = road.clears.maxima ?? 0, { left: toJaden, frac: jadenFrac } = jadenProgress(maxClears);
    const ownsJaden = !!this.save.owned[String(JADEN_ID)];
    const mapName = (id: string) => this.m.maps.find((m) => m.id === id)?.name ?? id;
    const diffs = ROAD_DIFFS.map((d) => `<button class="rd-diff${d.id === this.roadDiff ? ' on' : ''} d-${d.id}" data-rdiff="${d.id}" ${active ? 'disabled' : ''}>
        <small>${tr('{mapsLength} PARTIDOS · RANGO {rank}', { mapsLength: d.maps.length, rank: d.rank })}</small><b>${d.label}</b>
        <span class="rd-path">${d.maps.map((m, i) => `<i title="${esc(mapName(m))}">${i + 1}</i>`).join('<em></em>')}</span>
        <span class="rd-prize">${tr('{x1} ◉ · {tokens} fichas{x2}', { x1: d.coins.toLocaleString(locale()), tokens: d.tokens, x2: d.legendary ? ' · <b>Legendario+ asegurado</b>' : '' })}</span>
        <span class="rd-clears">${tr('Completado {x1} {x2}', { x1: road.clears[d.id] ?? 0, x2: (road.clears[d.id] ?? 0) === 1 ? 'vez' : 'veces' })}</span></button>`).join('');
    const slots = Array.from({ length: ROAD_SQUAD }, (_, i) => { const p = this.byId.get(this.roadPick[i]); return `<span class="rd-slot${p ? ' full' : ''}${i === 0 ? ' cap' : ''}">${p ? `${this.mug(p.id, 48)}<small>${esc(p.name)}</small>` : `<b>${i + 1}</b>`}${i === 0 ? '<em>C</em>' : ''}</span>`; }).join('');
    const grid = pool.map((p) => { const r = effectiveRarity(this.save, p), on = this.roadPick.includes(p.id);
      return `<button class="rd-pick r-${r}${on ? ' on' : ''}" data-rpick="${p.id}" style="--rc:${RARITY_COLOR[r]}">${this.mug(p.id, 40)}<span><b>${esc(p.name)}</b><small>${esc(teamLabel(p.teams.find((t) => t.includes('Inazuma') || t.includes('Raimon')) ?? ''))}</small></span></button>`; }).join('');
    const act = active ? ROAD_BY_ID.get(active.diff)! : null;
    this.show(`<div class="screen road-screen">${this.titlebar(tr('Road to Fútbol Frontier'), 'Menú')}
      <div class="rd-hero"><div><small>${tr('MODO DESAFÍO')}</small><b>${tr('Road to Fútbol Frontier')}</b><span>${tr('5 futbolistas del Raimon o de Inazuma Japan, sin Auras, partido tras partido hasta la final del Estadio Zeus. Si pierdes uno, se acaba el camino.')}</span></div>
        <div class="rd-jaden${ownsJaden ? ' own' : ''}"><span class="rd-jart">${this.mug(JADEN_ID, 80)}${ownsJaden ? '' : '<i class="rd-lock">🔒</i>'}</span><span><small>${ownsJaden ? tr('OTRA COPIA DE JADEN EN') : tr('JADEN EVANS EN')}</small><b>${tr('{toJaden} {x1} en Máxima', { toJaden, x1: toJaden === 1 ? 'victoria' : 'victorias' })}</b><i style="width:${jadenFrac * 100}%"></i></span></div></div>
      ${active && act ? `<div class="panel rd-active"><h3>${tr('{x1}Camino en curso · {label}', { x1: uiIcon('trophy'), label: act.label })}</h3>
          <span class="rd-path big">${act.maps.map((m, i) => `<i class="${i < active.level ? 'done' : i === active.level ? 'now' : ''}" title="${esc(mapName(m))}">${i < active.level ? '✔' : i + 1}</i>`).join('<em></em>')}</span>
          <p class="note">${tr('{x1} <b>{x2}</b> (partido {x3} de {mapsLength}, {x4} min).', { x1: tr('Siguiente:'), x2: esc(mapName(act.maps[active.level])), x3: active.level + 1, mapsLength: act.maps.length, x4: active.level + 1 })}</p>
          <div class="rd-squad">${active.squad.map((id, i) => `<span class="rd-slot full${i === 0 ? ' cap' : ''}">${this.mug(id, 48)}<small>${esc(this.byId.get(id)?.name ?? '?')}</small>${i === 0 ? '<em>C</em>' : ''}</span>`).join('')}</div>
          <div class="cp-actions"><button class="btn big" id="rdnext">${tr('Jugar el partido {x1} ▶', { x1: active.level + 1 })}</button><button class="btn blue" id="rdquit">${tr('Abandonar el camino')}</button></div></div>`
        : `<div class="panel"><h3>${tr('{x1}Dificultad', { x1: uiIcon('target') })}</h3><div class="rd-diffs">${diffs}</div></div>
      <div class="panel"><h3>${tr('{x1}Tus 5', { x1: uiIcon('team') })} <small>${tr('{roadPickLength}/{ROAD_SQUAD} · el primero es el capitán · sin Auras', { roadPickLength: this.roadPick.length, ROAD_SQUAD })}</small></h3><div class="rd-squad">${slots}</div>
        <div class="rd-coach">${coach ? `${this.coachArt(coach, 40)}<span><small>${tr('ENTRENADOR')}</small><b>${esc(coach.name)}</b></span>` : `<span class="note">${tr('Sin entrenador en el banquillo.')}</span>`}<button class="btn small blue" id="rdcoach">${coach ? 'Cambiar' : tr('Elegir entrenador')}</button></div>
        <button class="btn big rd-start" id="rdstart" ${this.roadPick.length === ROAD_SQUAD ? '' : 'disabled'}>${this.roadPick.length === ROAD_SQUAD ? tr('¡Empezar en {x1}! ▶', { x1: ROAD_BY_ID.get(this.roadDiff)!.label }) : tr('Elige {x1} más', { x1: ROAD_SQUAD - this.roadPick.length })}</button></div>
      <div class="panel"><h3>${tr('{x1}Raimon e Inazuma Japan', { x1: uiIcon('cards') })} <small>${tr('{poolLength} en tu colección', { poolLength: pool.length })}</small></h3>${pool.length ? `<div class="rd-grid">${grid}</div>` : `<p class="note">${tr('Aún no tienes futbolistas del Raimon o de Inazuma Japan: consíguelos en la máquina Fútbol Frontier o Mundial FFI.')}</p>`}</div>`}
    </div>`);
    this.on('[data-back]', 'click', () => this.mainMenu());
    this.on('[data-rdiff]', 'click', (_e, el) => { this.roadDiff = el.dataset.rdiff as RoadDiff; this.roadScreen(); });
    this.on('[data-rpick]', 'click', (_e, el) => {
      const id = Number(el.dataset.rpick);
      if (this.roadPick.includes(id)) this.roadPick = this.roadPick.filter((x) => x !== id);
      else if (this.roadPick.length < ROAD_SQUAD) this.roadPick.push(id);
      else { sfx('error'); this.toast(tr('Ya tienes 5: quita uno para cambiarlo')); return; }
      sfx('click'); this.roadScreen();
    });
    document.getElementById('rdcoach')?.addEventListener('click', () => this.coachesScreen('road'));
    document.getElementById('rdstart')?.addEventListener('click', () => {
      if (this.roadPick.length !== ROAD_SQUAD) return;
      roadOf(this.save).active = { diff: this.roadDiff, level: 0, squad: [...this.roadPick] };
      this.persist();
      this.roadPlay();
    });
    document.getElementById('rdnext')?.addEventListener('click', () => this.roadPlay());
    document.getElementById('rdquit')?.addEventListener('click', (e) => this.armed(e.currentTarget as HTMLElement, () => { delete roadOf(this.save).active; this.persist(); this.roadScreen(); }));
  }

  /** the next match of the road in progress */
  private roadPlay() {
    const a = this.save.road?.active, d = a ? ROAD_BY_ID.get(a.diff) : undefined;
    const squad = (a?.squad ?? []).map((id) => this.byId.get(id)!).filter((p) => p && this.owned(p.id));
    if (!a || !d || squad.length !== ROAD_SQUAD) { this.toast(tr('No se pudo empezar el partido')); return; }
    this.roadMatch = { diff: a.diff, level: a.level };
    this.startRun(d.maps[a.level], [squad[0]], squad);
  }

  /** the end of a road match: the normal results, and on top of them where the road goes */
  private roadEnd(r: RunResult & { level: number }) {
    const m = this.roadMatch!;
    this.results(r);
    this.roadMatch = null;
    const road = roadOf(this.save), d = ROAD_BY_ID.get(m.diff)!;
    const box = document.createElement('div');
    box.className = 'modal road-end';
    const mapName = (id: string) => this.m.maps.find((x) => x.id === id)?.name ?? id;
    const finish = (html: string, onOk: () => void, okLabel: string, extra = '') => {
      box.innerHTML = `<div class="panel road-end-card">${html}<div class="cp-actions"><button class="btn big" id="rdok">${okLabel}</button>${extra}</div></div>`;
      document.body.querySelector('#ui')?.appendChild(box) ?? this.root.appendChild(box);
      box.querySelector('#rdok')!.addEventListener('click', () => { box.remove(); onOk(); });
      box.querySelector('#rdlater')?.addEventListener('click', () => box.remove());
    };
    if (!r.victory) {
      delete road.active; this.persist();
      finish(`<small>${tr('ROAD TO FÚTBOL FRONTIER · {toUpperCase}', { toUpperCase: d.label.toUpperCase() })}</small><h2>${tr('Eliminados')}</h2><p>${tr('{x1} <b>{x2} de {mapsLength}</b> ({x3}). El camino vuelve a empezar.', { x1: tr('Caísteis en el partido'), x2: m.level + 1, mapsLength: d.maps.length, x3: esc(mapName(d.maps[m.level])) })}</p>`,
        () => this.roadScreen(), tr('Volver a intentarlo'), '<button class="btn blue" id="rdlater">Cerrar</button>');
      return;
    }
    const level = m.level + 1;
    if (level < d.maps.length) {
      road.active = { ...road.active!, level }; this.persist();
      finish(`<small>${tr('ROAD TO FÚTBOL FRONTIER · {toUpperCase}', { toUpperCase: d.label.toUpperCase() })}</small><h2>${tr('¡Partido {level} superado!', { level })}</h2>
        <span class="rd-path big">${d.maps.map((_x, i) => `<i class="${i < level ? 'done' : i === level ? 'now' : ''}">${i < level ? '✔' : i + 1}</i>`).join('<em></em>')}</span>
        <p>${tr('Siguiente:')} <b>${esc(mapName(d.maps[level]))}</b>.</p>`, () => this.roadPlay(), tr('Jugar el partido {x1} ▶', { x1: level + 1 }), `<button class="btn blue" id="rdlater">${tr('Más tarde')}</button>`);
      return;
    }
    // the road is cleared
    const { jaden, clears } = clearRoad(this.save, m.diff);
    this.save.coins += d.coins; this.save.tokens += d.tokens;
    addCounter(this.save, `road_${m.diff}`, 1);
    const prizes: PullResult[] = [];
    if (d.legendary) {
      const id = codePlayer(this.m.roster, INA483_ODDS, Math.random), p = id === null ? undefined : this.byId.get(id);
      if (p) prizes.push({ player: p, ...addCopy(this.save, p) });
    }
    const j = jaden ? this.byId.get(JADEN_ID) : undefined;
    if (j) prizes.push({ player: j, ...addCopy(this.save, j) });
    this.persist();
    if (this.save.settings.particles !== 'desactivado') confetti(120);
    sfx('legend');
    finish(`<small>${tr('ROAD TO FÚTBOL FRONTIER · {toUpperCase}', { toUpperCase: d.label.toUpperCase() })}</small><h2>${tr('¡Camino completado!')}</h2>
      <p>${tr('Habéis ganado los {mapsLength} partidos hasta la final del Estadio Zeus. Completado', { mapsLength: d.maps.length })} <b>${clears} ${clears === 1 ? 'vez' : 'veces'}</b> ${tr('en {label}.', { label: d.label })}</p>
      <p class="rd-prize big">${tr('+{x1} ◉ · +{tokens} fichas{x2}{x3}', { x1: d.coins.toLocaleString(locale()), tokens: d.tokens, x2: d.legendary ? tr(' · un Legendario o mejor') : '', x3: jaden ? ` · ${jaden === 'new' ? tr('¡JADEN EVANS!') : tr('otra copia de Jaden Evans')}` : '' })}</p>
      ${m.diff === 'maxima' && !jaden ? `<p class="note">${tr('{x1} en {left} victorias más en Máxima.', { x1: this.save.owned[String(JADEN_ID)] ? tr('Otra copia de Jaden Evans') : tr('Jaden Evans'), left: jadenProgress(clears).left })}</p>` : ''}`,
      () => { if (prizes.length) void this.capsuleShow(prizes, tr('Road to Fútbol Frontier')).then(() => this.roadScreen()); else this.roadScreen(); }, prizes.length ? tr('¡Abrir premios!') : 'Genial');
  }

  // ------------------------------------------------------------- pre-2.0 coaches
  /** the coach on the bench (owned), if any */
  private benchCoach(): CoachDef | undefined {
    const id = this.save.coaches?.bench;
    return id && this.save.coaches?.owned.includes(id) ? COACH_BY_ID.get(id) : undefined;
  }
  private coachTex(id: string) { return this.m.coaches?.find((c) => c.id === id)?.texture ?? ''; }
  /** a coach's portrait in a frame of his rarity; locked = a silhouette */
  private coachArt(c: CoachDef, size: number, locked = false) {
    const tex = this.coachTex(c.id);
    return `<span class="co-art r-${c.rarity}${locked ? ' locked' : ''}" style="--rc:${RARITY_COLOR[c.rarity]};width:${size}px;height:${size}px">${tex ? `<img src="${tex}" alt="">` : ''}${locked ? '<b>?</b>' : ''}</span>`;
  }
  private coachPassives(c: CoachDef) {
    return `<ul class="co-passives">${c.passives.map((p) => `<li><i>${PASSIVE_ICON[p.kind]}</i>${esc(coachPassiveText(p))}</li>`).join('')}</ul>`;
  }
  private machineLabel(id: string) { return (BANNERS as Record<string, { label: string }>)[id]?.label ?? id; }

  /** a pull of `n` capsules at machine `m`: 2% each for a coach of that machine not owned yet */
  private rollCoach(m: string, n: number): CoachDef | null {
    const owned = new Set(this.save.coaches?.owned ?? []);
    const pool = coachesOfMachine(m as never).filter((c) => !owned.has(c.id));
    if (!pool.length) return null;
    for (let k = 0; k < n; k++) {
      if (Math.random() >= COACH_PULL_CHANCE) continue;
      const c = pool[Math.floor(Math.random() * pool.length)];
      this.save.coaches = { owned: [...owned, c.id], bench: this.save.coaches?.bench ?? c.id }; // the first one goes straight to the bench
      return c;
    }
    return null;
  }

  /** the row of a machine's coaches, under its featured players */
  private machineCoaches(m: string) {
    const list = coachesOfMachine(m as never);
    if (!list.length) return '';
    const owned = new Set(this.save.coaches?.owned ?? []);
    return `<div class="feat-row co-row"><small>${tr('ENTRENADORES · {x1}% por cápsula', { x1: Math.round(COACH_PULL_CHANCE * 100) })}</small><div>${list.map((c) => `<span class="co-feat${owned.has(c.id) ? ' own' : ''}" title="${esc(c.name)}${owned.has(c.id) ? tr(' (ya lo tienes)') : ''}">${this.coachArt(c, 44, !owned.has(c.id))}<small>${esc(c.name)}</small></span>`).join('')}</div></div>`;
  }

  /** a new coach: his card, big, with his passives */
  private coachReveal(c: CoachDef) {
    sfx('legend');
    if (this.save.settings.particles !== 'desactivado') confetti(60);
    const box = document.createElement('div');
    box.className = 'modal co-reveal';
    box.innerHTML = `<div class="panel co-reveal-card r-${c.rarity}" style="--rc:${RARITY_COLOR[c.rarity]}"><small>${tr('¡NUEVO ENTRENADOR!')}</small>${this.coachArt(c, 160)}
      <h2>${esc(c.name)}</h2><span class="rar ${c.rarity}">${RARITY_LABEL[c.rarity].toUpperCase()}</span><em>${esc(c.team)}</em><p class="co-quote">«${esc(c.quote)}»</p>${this.coachPassives(c)}
      <p class="note">${this.save.coaches?.bench === c.id ? tr('Ya está en tu banquillo.') : tr('Ponlo en el banquillo en Mi Equipo o en Entrenadores.')}</p><button class="btn big">${tr('¡Genial!')}</button></div>`;
    this.root.appendChild(box);
    box.querySelector('.btn')!.addEventListener('click', () => box.remove());
  }

  /** Mi Equipo: the bench, with the coach and what he gives */
  private benchPanel() {
    const c = this.benchCoach(), n = this.save.coaches?.owned.length ?? 0;
    return `<div class="panel bench-panel${c ? ` r-${c.rarity}` : ' empty'}" ${c ? `style="--rc:${RARITY_COLOR[c.rarity]}"` : ''}>
      <div class="bench-tag">${tr('BANQUILLO')}</div>
      ${c ? `${this.coachArt(c, 96)}<div class="bench-tx"><small>${tr('ENTRENADOR · {team}', { team: esc(c.team) })}</small><b>${esc(c.name)}</b><span class="rar ${c.rarity}">${RARITY_LABEL[c.rarity].toUpperCase()}</span>${this.coachPassives(c)}</div>`
        : `<span class="co-art empty-art"><b>?</b></span><div class="bench-tx"><small>${tr('ENTRENADOR')}</small><b>${tr('Banquillo vacío')}</b><p class="note">${n ? tr('Elige a uno de tus entrenadores.') : tr('Los entrenadores salen en las máquinas de fichajes de su saga ({x1}% por cápsula). Cada uno da pasivas a todo el equipo.', { x1: Math.round(COACH_PULL_CHANCE * 100) })}</p></div>`}
      <button class="btn small blue" data-go-coaches>${c ? 'Cambiar' : tr('Ver entrenadores')}</button></div>`;
  }

  /** pre-2.0: every coach — owned ones can go on the bench, the rest say where they come from */
  coachesScreen(back: 'menu' | 'squad' | 'road' = 'menu') {
    setMusicContext('menu');
    const owned = new Set(this.save.coaches?.owned ?? []), bench = this.save.coaches?.bench;
    const order = (c: CoachDef) => (owned.has(c.id) ? 0 : 100) - RARITY_ORDER.indexOf(c.rarity);
    const cards = [...COACHES].sort((a, b2) => order(a) - order(b2)).map((c) => {
      const own = owned.has(c.id);
      return `<div class="co-card r-${c.rarity}${own ? '' : ' locked'}${bench === c.id ? ' on' : ''}" style="--rc:${RARITY_COLOR[c.rarity]}">
        ${this.coachArt(c, 112, !own)}<div class="co-card-tx"><small>${esc(c.team)}</small><b>${own ? esc(c.name) : '???'}</b><span class="rar ${c.rarity}">${RARITY_LABEL[c.rarity].toUpperCase()}</span>
        ${own ? `<p class="co-quote">«${esc(c.quote)}»</p>` : ''}${this.coachPassives(c)}
        ${own ? `<button class="btn small${bench === c.id ? ' blue' : ''}" data-bench="${c.id}">${bench === c.id ? tr('✔ En el banquillo') : tr('Al banquillo')}</button>`
          : `<p class="co-where">${tr('{x1} <b>{x2}</b> ({x3}% por cápsula)', { x1: tr('🔒 Sale en la máquina'), x2: esc(this.machineLabel(c.machine)), x3: Math.round(COACH_PULL_CHANCE * 100) })}</p>`}</div></div>`;
    }).join('');
    this.show(`<div class="screen coaches-screen">${this.titlebar('Entrenadores', back === 'squad' ? tr('Mi Equipo') : back === 'road' ? tr('Road to FF') : 'Menú')}
      <div class="panel co-head"><b>${tr('{size} de {COACHESLength} entrenadores', { size: owned.size, COACHESLength: COACHES.length })}</b><p class="note">${tr('Uno se sienta en el <b>banquillo</b> y da sus pasivas a todo el equipo durante la partida: su formación, objetos raros, afinidad con un elemento, daño, defensa o técnicas combinadas.')}</p></div>
      <div class="co-grid">${cards}</div></div>`);
    this.on('[data-back]', 'click', () => (back === 'squad' ? this.captainSelect() : back === 'road' ? this.roadScreen() : this.mainMenu()));
    this.on('[data-bench]', 'click', (_e, el) => {
      const id = el.dataset.bench!;
      this.save.coaches = { owned: [...owned], ...(bench === id ? {} : { bench: id }) };
      this.persist(); sfx('click'); this.coachesScreen(back);
    });
  }

  // ------------------------------------------------------------- 2.0 Espíritus Guerreros (keshin.ts)
  /** the Ficha EG icon (its own pixel art) */
  /** (author) the collab's celebration in its machine: the banner (3 wins while open) and the frame (Nagi and Isagi), with progress */
  private blRewards() {
    const wins = Math.min(this.save.blWins ?? 0, BLUELOCK_WINS_FOR_BANNER);
    const item = (art: string, label: string, done: boolean, prog: string) =>
      `<span class="bl-rw${done ? ' done' : ''}"><span class="bl-rw-art">${art}</span><span><b>${label}</b><em>${done ? tr('¡Conseguido! Póntelo en tu Perfil') : prog}</em></span></span>`;
    return `<div class="bl-rewards"><small>${tr('RECOMPENSAS DE LA COLABORACIÓN')}</small><div>
      ${item(pennantSvg('colab-bluelock', 30), tr('Banner InaZurvivors x BlueLock'), hasPennant(this.save, 'colab-bluelock'), tr('Gana {BLUELOCK_WINS_FOR_BANNER} partidas · {wins}/{BLUELOCK_WINS_FOR_BANNER}', { BLUELOCK_WINS_FOR_BANNER, wins }))}
      ${item(`<span class="bl-rw-fr">${frameSvg('marco-bluelock')}</span>`, tr('Marco BlueLock'), hasPennant(this.save, 'marco-bluelock'), tr('Ficha a Nagi y a Isagi · {x1}/2', { x1: BLUELOCK_EVENT.players.filter((id) => this.save.owned[String(id)]).length }))}
    </div></div>`;
  }

  /** author: «InaZurvivors x BlueLock» — the game's name, an x and the BlueLock logo */
  private blLogo() {
    const logo = this.m.collab?.bluelock;
    return `<span class="bl-logo"><b class="bl-iz">InaZurvivors</b><i class="bl-x">×</i>${logo ? `<img src="${logo}" alt="${tr('BlueLock')}">` : '<b>BlueLock</b>'}</span>`;
  }
  private egIcon(size = 18) { const src = this.m.eg?.ficha; return src ? `<img class="eg-fic" src="${src}" alt="${tr('Ficha EG')}" style="width:${size}px;height:${size}px">` : '<b class="eg-fic">EG</b>'; }
  /** the symbol of a spirit level: II…Ω are drawn; level I has none */
  private egLevel(lv: number, h = 26) {
    const src = this.m.eg?.levels[String(lv)];
    // the symbols are the games' pixel art (24 px high): shown at whole multiples of it, never smoothed
    return lv >= 2 ? (src ? `<img class="eg-lvsym" src="${src}" alt="${KESHIN_LABEL[lv]}" style="height:${Math.max(12, Math.round(h / 12) * 12)}px">` : `<b class="eg-lvsym">${KESHIN_LABEL[lv]}</b>`) : '';
  }
  /** 2.0 (author: «mejora los logos de los miembros del equipo en el botón de Mi Equipo»): the captain bigger with his C,
   *  rarity rings that glow, each awakened warrior spirit as a tiny medal, the free places as dashed rings; they fan out on hover */
  private teamFaces(squad: RosterEntry[]) {
    const faces = squad.slice(0, SQUAD_SIZE).map((p, i) => {
      const r = effectiveRarity(this.save, p), k = keshinOf(p.id), lv = k ? keshinLevel(this.save, p.id) : 0;
      return `<span class="m4-face r-${r}${i === 0 ? ' cap' : ''}" style="--rc:${RARITY_COLOR[r]};--i:${i}" title="${esc(p.name)}">${this.mug(p.id, i === 0 ? 38 : 30)}`
        + `${i === 0 ? '<b class="m4-c">C</b>' : ''}${k && lv ? `<i class="m4-eg" style="--kc:${k.color}">${this.egArt(k)}</i>` : ''}</span>`;
    });
    for (let i = squad.length; i < SQUAD_SIZE; i++) faces.push(`<span class="m4-face empty" style="--i:${i}"><b>+</b></span>`);
    return faces.join('');
  }
  /** the footballer whose spirit is the active one in this run (its ultimate on R), for the signing cards */
  private ultActiveId: number | null = null;
  private ultCalmTimer = 0;
  /** 2.0 (author: «haz más visible lo de la ulti»): when the ultimate fills, a big call in the middle of the screen */
  private ultToast(k: KeshinDef, tech: string) {
    document.querySelector('.ult-toast')?.remove();
    const pad = !!firstPad(), touch = document.body.classList.contains('touch');
    const box = document.createElement('div');
    box.className = 'ult-toast';
    box.style.setProperty('--kc', k.color);
    box.innerHTML = `<i class="ut-rays"></i><span class="ut-art">${this.egArt(k)}</span><div class="ut-tx"><small>${tr('¡DEFINITIVA LISTA!')}</small><b>${esc(tech)}</b>
      <em>${pad ? `${tr('Pulsa')} <kbd>Y</kbd>` : touch ? tr('Toca su botón') : `${tr('Pulsa')} <kbd>R</kbd>`}</em></div>`;
    document.getElementById('hud')?.appendChild(box);
    setTimeout(() => box.classList.add('out'), 1500);
    setTimeout(() => box.remove(), 1900);
  }
  /** 2.0 (author: «cuando fiches a un jugador que salga EG si tiene, hazlo chulo y juiced»): his warrior spirit bursts
   *  out behind him in its colour, its name and level, and whether it is the team's active one or gives its passive */
  private egJoin(e: { playerId: number; active: boolean }) {
    const k = keshinOf(e.playerId), p = this.byId.get(e.playerId), lv = keshinLevel(this.save, e.playerId);
    if (!k || !p) return;
    document.querySelector('.eg-join')?.remove();
    const box = document.createElement('div');
    box.className = `eg-join${e.active ? ' active' : ''}`;
    box.style.setProperty('--kc', k.color);
    box.innerHTML = `<i class="ej-flash"></i><i class="ej-rays"></i>
      <div class="ej-card"><span class="ej-art">${this.egArt(k)}${lv >= 2 ? `<span class="ej-lv">${this.egLevel(lv, 22)}</span>` : ''}
          <span class="ej-mug">${this.mug(p.id, 72)}<small>${esc(p.name)}</small></span></span>
        <div class="ej-tx"><small>${tr('¡FICHAJE! {x1} TRAE SU', { x1: esc(p.name.toUpperCase()) })}</small><em>${tr('ESPÍRITU GUERRERO')}</em><b>${esc(k.name)}</b>
          <span class="ej-role">${e.active ? `${tr('★ ACTIVO · Definitiva')} <i>${esc(tTech(techFor(k, lv).name))}</i> ${tr('con R')}` : `PASIVA · ${esc(k.passive.name)}: ${esc(keshinPassiveText(k, lv))}`}</span></div></div>`;
    document.getElementById('hud')?.appendChild(box);
    sfx('legend');
    setTimeout(() => box.classList.add('out'), 2300);
    setTimeout(() => box.remove(), 2800);
  }
  /** 2.0 (author: «las ultis con la R»): the active warrior spirit's button, bottom right. Its portrait fills up as it
   *  charges; when the ultimate is ready the button springs out, glows in the spirit's colour and shows how to fire it:
   *  R on a keyboard, Y / Triangle on a pad, a tap on a touch screen */
  private renderUlts(s: HudState) {
    const dock = document.getElementById('ultdock');
    if (!dock) return;
    const u = s.ults?.[0], k = u ? keshinOf(u.playerId) : null;
    this.ultActiveId = u?.playerId ?? null;
    const sig = u && k ? String(u.playerId) : '';
    if (dock.dataset.sig !== sig) {
      dock.dataset.sig = sig;
      dock.innerHTML = u && k ? `<button class="ult-btn" data-ult="${u.playerId}" title="${esc(u.tech)} · ${esc(k.name)} (R)">
          <i class="ult-ring"></i>${this.egArt(k, 'ult-art')}<b class="ult-t"></b><em class="ult-pc"></em><kbd class="ult-key"></kbd>${this.uiPiece('rayo_hex', 'ult-bolt')}</button>
        <div class="ult-info"><small>${esc(k.name.toUpperCase())}</small><b>${esc(u.tech)}</b><em class="ult-state"></em></div>` : '';
      dock.classList.remove('ready');
    }
    if (!u || !k) return;
    // (author: «ponlo abajo a la izquierda») on a computer it sits bottom-left (styleHud20.css .ult-dock.left)
    dock.classList.toggle('left', window.matchMedia('(min-width: 901px) and (min-height: 521px)').matches);
    const ready = u.cd <= 0, pad = !!firstPad(), touch = document.body.classList.contains('touch');
    dock.style.setProperty('--cd', String(u.cd)); dock.style.setProperty('--kc', k.color);
    if (ready !== dock.classList.contains('ready')) {
      dock.classList.toggle('ready', ready);
      const hudEl = document.getElementById('hud');
      hudEl?.classList.toggle('ult-ready', ready); // the edges of the screen glow in its colour
      hudEl?.style.setProperty('--ultc', k.color);
      // (author: «que no salga todo el rato, que salga las 3 veces indicando y se apague») when it fills it springs out and
      // flashes three times with the screen's edges, says so in the middle of the screen, then calms down until it is used
      window.clearTimeout(this.ultCalmTimer);
      dock.classList.remove('pop', 'calm');
      if (ready) {
        void dock.offsetWidth; dock.classList.add('pop'); sfx('powerup');
        this.ultToast(k, u.tech);
        this.ultCalmTimer = window.setTimeout(() => dock.classList.add('calm'), 3400);
      }
    }
    const key = pad ? 'Y' : touch ? '' : 'R';
    const kb = dock.querySelector<HTMLElement>('.ult-key')!;
    if (kb.textContent !== key) kb.textContent = key;
    kb.hidden = !key;
    const t = dock.querySelector<HTMLElement>('.ult-t')!, txt = ready ? '' : String(Math.ceil(u.left));
    if (t.textContent !== txt) t.textContent = txt;
    const pc = dock.querySelector<HTMLElement>('.ult-pc')!, pcTxt = ready ? tr('¡YA!') : `${Math.floor((1 - u.cd) * 100)}%`;
    if (pc.textContent !== pcTxt) pc.textContent = pcTxt;
    const st = dock.querySelector<HTMLElement>('.ult-state')!, stTxt = ready ? (pad ? tr('¡LISTA! Pulsa Y') : touch ? tr('¡LISTA! Tócala') : tr('¡LISTA! Pulsa R')) : `Cargando ${Math.round((1 - u.cd) * 100)}%`;
    if (st.textContent !== stTxt) st.textContent = stTxt;
  }
  private egArt(k: KeshinDef, cls = '') { const src = this.m.eg?.spirits[k.id]; return src ? `<img class="eg-art-img ${cls}" src="${src}" alt="${esc(k.name)}">` : `<b class="eg-art-img ${cls}">${esc(k.name[0])}</b>`; }
  /** the badge of a footballer who can call a spirit (lit once unlocked, with its level symbol) */
  private egBadge(id: number, cls = '') {
    if (!keshinOf(id) || !this.m.eg) return '';
    const lv = keshinLevel(this.save, id);
    // (author: «que los EGs se vean más grandes»): the spirit's own portrait, with the EG badge on its corner
    const k = keshinOf(id)!;
    return `<span class="eg-badge ${cls}${lv ? ' on' : ''}" style="--kc:${k.color}" title="${esc(k.name)}${lv ? tr(' · nivel {x1}', { x1: KESHIN_LABEL[lv] }) : tr(' · sin despertar')}"><span class="eg-bart">${this.egArt(k)}</span><img class="eg-bins" src="${this.m.eg.insignia}" alt="${tr('EG')}">${lv >= 2 ? this.egLevel(lv, 14) : ''}</span>`;
  }
  /** the spirit's portrait beside a footballer's face in Mi Equipo (grey until it is awakened) */
  private egMedal(id: number) {
    const k = keshinOf(id);
    if (!k || !this.m.eg) return '';
    const lv = keshinLevel(this.save, id);
    return `<span class="sq-eg${lv ? ' on' : ''}" style="--kc:${k.color}" title="${esc(k.name)}${lv ? tr(' · nivel {x1}', { x1: KESHIN_LABEL[lv] }) : tr(' · sin despertar')}"><span class="sq-eg-art">${this.egArt(k)}</span>${lv >= 2 ? this.egLevel(lv, 14) : ''}</span>`;
  }
  private egTypeLabel(k: KeshinDef) { return k.type === 'parada' ? 'Parada' : k.type === 'regate' ? 'Regate' : k.type === 'defensa' ? 'Defensa' : 'Tiro'; }

  /** 2.0: every warrior spirit, who calls it and the level of each one; unlocked and levelled with Fichas EG */
  keshinScreen(back: 'menu' | number = 'menu', focus?: number) {
    setMusicContext('collection');
    const have = egTokens(this.save);
    const pips = (lv: number) => `<span class="eg-pips">${Array.from({ length: KESHIN_MAX }, (_, i) => `<i class="${i < lv ? 'on' : ''}${i === KESHIN_MAX - 1 ? ' om' : ''}">${KESHIN_LABEL[i + 1]}</i>`).join('')}</span>`;
    const holderRow = (k: KeshinDef, h: { id: number; name: string }) => {
      const p = this.byId.get(h.id);
      if (!p) return '';
      const own = !!this.owned(h.id), lv = keshinLevel(this.save, h.id), cost = nextCost(this.save, h.id), why = canLevel(this.save, h.id);
      const b = statBonus(k, Math.max(1, lv));
      const btn = !own ? `<span class="eg-need">${tr('🔒 Consíguelo en Fichajes')}</span>`
        : cost === null ? `<span class="eg-max">${tr('{egLevel} MÁXIMO', { egLevel: this.egLevel(KESHIN_MAX, 22) })}</span>`
        : `<button class="btn small eg-buy${why === 'ok' ? ' can' : ''}" data-eglv="${h.id}" ${why === 'ok' ? '' : 'disabled'}>${lv ? `Subir a ${KESHIN_LABEL[lv + 1]}` : 'Desbloquear'} · ${this.egIcon(14)} ${cost}</button>`;
      return `<div class="eg-holder${own ? '' : ' off'}${lv ? ' lit' : ''}${focus === h.id ? ' focus' : ''}" data-egh="${h.id}">
        <span class="eg-hmug">${this.mug(h.id, 44)}</span>
        <div class="eg-htx"><b>${esc(p.name)}</b>${lv ? `<span class="eg-hlv">${this.egLevel(lv, 18) || `<em>${tr('Nivel I')}</em>`}<small>+${Math.round(b.pct * 100)}% ${STAT_SHORT[b.key]}</small></span>` : `<small class="note">${own ? tr('Sin despertar') : tr('No está en tu colección')}</small>`}
          ${pips(lv)}</div>${btn}</div>`;
    };
    const cards = KESHINS.map((k) => {
      const best = Math.max(0, ...k.holders.map((h) => keshinLevel(this.save, h.id)));
      const shown = Math.max(1, best);
      const t = techFor(k, shown);
      return `<article class="eg-card ${keshinElClass(k)}${best ? ' awake' : ''}${best >= KESHIN_MAX ? ' omega' : ''}" style="--kc:${k.color};--ec:${ELEMENT_COLOR[k.element]}" data-egcard="${k.id}">
        <div class="eg-stage" data-egview="${k.id}" title="${tr('Ver la carta')}"><i class="eg-rays"></i><i class="eg-ring"></i><i class="eg-embers"></i>${this.egArt(k)}<span class="eg-zoom">${tr('VER CARTA')}</span>
          <span class="eg-elem">${elementIcon(k.element, 18)}</span>${best >= 2 ? `<span class="eg-best">${this.egLevel(best, 30)}</span>` : ''}</div>
        <div class="eg-body"><small class="eg-title">${esc(k.title)}</small><h3>${esc(k.name)}</h3>
          <div class="eg-chips"><span class="eg-chip el">${esc(tEl(k.element))}</span><span class="eg-chip">${this.egTypeLabel(k)}</span><span class="eg-chip st">+${STAT_SHORT[statBonus(k, 1).key]}</span></div>
          <div class="eg-tech"><span class="eg-k">${tr('DEFINITIVA · tecla R')}</span><b>${esc(tTech(t.name))}</b><small>${tr('Potencia {power}{x1} · la lanzas tú con R o su botón (cada {ultCooldownSec} s; mejórala en Mejoras · «Espíritu despierto»)', { power: t.power, x1: best ? '' : tr(' (nivel I)'), ultCooldownSec: perkEffects(this.save).ultCooldownSec })}</small></div>
          <div class="eg-pas"><span class="eg-k">${tr('PASIVA · {passiveName}', { passiveName: esc(k.passive.name) })}</span><p>${esc(keshinPassiveText(k, shown))}${best ? '' : ` <small>${tr('(nivel I)')}</small>`}</p><small class="eg-game">${tr('En GO: «{game}»', { game: esc(k.passive.game) })}</small></div>
          <div class="eg-holders">${k.holders.map((h) => holderRow(k, h)).join('')}</div></div>${this.egFrame(best)}</article>`;
    }).join('');
    const awake = Object.keys(this.save.keshin ?? {}).filter((id) => keshinOf(Number(id))).length;
    const total = KESHINS.reduce((n, k) => n + k.holders.filter((h) => this.byId.has(h.id)).length, 0);
    this.show(`<div class="screen eg-screen">${this.titlebar(tr('Espíritus Guerreros'), back === 'menu' ? 'Menú' : 'Colección')}
      <header class="eg-head"><i class="eg-head-glow"></i>
        <div class="eg-logo"><small>${tr('INAZURVIVORS 2.0')}</small><b>${tr('ESPÍRITUS GUERREROS')}</b><span>${tr('Despierta el espíritu que llevan dentro tus futbolistas')}</span></div>
        <div class="eg-wallet" title="${tr('Fichas EG')}">${this.egIcon(30)}<span><small>${tr('FICHAS EG')}</small><b>${have}</b></span></div>
        <div class="eg-howto">
          <div><b>${awake}/${total}</b><small>${tr('despertados')}</small></div>
          <div><b>${tr('Despertar')}</b><small>${this.egIcon(12)} ${keshinStepCost(1)}</small></div>
          <div><b>${tr('Subir nivel')}</b><small>${tr('II {egIcon}1 · III 2 · IV 3 · V 4 · Ω 5', { egIcon: this.egIcon(12) })}</small></div>
          <div class="eg-levels">${[2, 3, 4, 5, 6].map((l) => this.egLevel(l, 22)).join('')}</div>
          <p class="note">${tr('Mientras su futbolista juega, el espíritu da su <b>pasiva a todo el equipo</b>, sube un <b>% la estadística</b> de su técnica (se acumula con cada nivel) y le enseña su <b>supertécnica</b>. Las Fichas EG se ganan venciendo arenas en rango A, S y X, superando rangos por primera vez y aguantando en el infinito.')}</p></div>
      </header>
      <div class="eg-grid">${cards}</div></div>`);
    this.on('[data-back]', 'click', () => (back === 'menu' ? this.mainMenu() : this.collection(back)));
    this.on('[data-eglv]', 'click', (_e, el) => {
      const id = Number(el.dataset.eglv), k = keshinOf(id)!, before = keshinLevel(this.save, id);
      const r = levelKeshin(this.save, id);
      if (typeof r !== 'number') { sfx('error'); this.toast(r === 'poor' ? tr('Te faltan Fichas EG') : tr('No se puede ahora')); return; }
      this.persist();
      const y = window.scrollY;
      this.keshinSummon(k, id, before, r, () => { this.keshinScreen(back, id); window.scrollTo(0, y); });
    });
    this.on('[data-egview]', 'click', (_e, el) => this.keshinCard(el.dataset.egview as KeshinDef['id']));
    if (focus) window.setTimeout(() => this.root.querySelector(`[data-egh="${focus}"]`)?.scrollIntoView({ block: 'center', behavior: 'smooth' }), 60);
  }

  /** (author: «juiced y currada, que deje ver la tarjeta con lo 3D») the spirit's trading card, big: it turns in 3D after the
   *  pointer (or a finger), floats on its own and shines like foil; a tap turns it over (who calls it and what each level
   *  gives), a drag spins it, the arrows go through the spirits; Esc or a tap outside closes it */
  private keshinCard(id: KeshinDef['id']) {
    const i0 = KESHINS.findIndex((k) => k.id === id);
    if (i0 < 0) return;
    document.querySelector('.egx')?.remove();
    const box = document.createElement('div');
    box.className = 'egx';
    document.body.appendChild(box);
    sfx('whoosh');
    let idx = i0, base = 0, dragX = 0, dragging = false, moved = false, x0 = 0, rx = 0, ry = 0, raf = 0;
    const t0 = performance.now();
    const render = () => {
      const k = KESHINS[idx];
      const best = Math.max(0, ...k.holders.map((h) => keshinLevel(this.save, h.id))), shown = Math.max(1, best), t = techFor(k, shown), sb = statBonus(k, 1).key;
      const holders = k.holders.filter((h) => this.byId.has(h.id)).map((h) => {
        const lv = keshinLevel(this.save, h.id), own = !!this.owned(h.id);
        return `<div class="egx-h${own ? '' : ' off'}${lv ? ' lit' : ''}">${this.mug(h.id, 40)}<b>${esc(this.byId.get(h.id)!.name)}</b><span>${lv ? (this.egLevel(lv, 18) || tr('Nivel I')) : own ? tr('Sin despertar') : tr('No lo tienes')}</span></div>`;
      }).join('');
      const rows = Array.from({ length: KESHIN_MAX }, (_, n) => n + 1).map((lv) => `<tr class="${lv <= best ? 'on' : ''}${lv === KESHIN_MAX ? ' om' : ''}"><th>${lv >= 2 ? this.egLevel(lv, 16) : 'I'}</th><td>+${Math.round(statBonus(k, lv).pct * 100)}% ${STAT_SHORT[sb]}</td><td>${techFor(k, lv).power}</td><td>${esc((keshinPassiveText(k, lv).match(/[+-]\d+(?:,\d+)?%/g) ?? []).join(' ') || '—')}</td></tr>`).join('');
      box.className = `egx ${keshinElClass(k)}${best ? ' awake' : ''}${best >= KESHIN_MAX ? ' omega' : ''}`;
      box.style.setProperty('--kc', k.color);
      box.style.setProperty('--ec', ELEMENT_COLOR[k.element]);
      box.innerHTML = `<i class="egx-bg"></i><i class="egx-rays"></i>
        <button class="egx-nav prev" aria-label="${tr('Anterior')}">‹</button>
        <div class="egx-scene"><div class="egx-card in">
          <div class="egx-face egx-front"><i class="egx-foil"></i>
            <div class="egx-top">${elementIcon(k.element, 26)}<small>${esc(k.title)}</small>${best >= 2 ? `<span class="egx-lv">${this.egLevel(best, 34)}</span>` : ''}</div>
            <div class="egx-art"><i class="egx-art-rays"></i>${this.egArt(k)}${best ? '' : `<span class="egx-sleep">${tr('SIN DESPERTAR')}</span>`}</div>
            <h2>${esc(k.name)}</h2>
            <div class="egx-chips"><span>${esc(tEl(k.element))}</span><span>${this.egTypeLabel(k)}</span><span>+${STAT_SHORT[sb]}</span></div>
            <div class="egx-box"><small>${tr('DEFINITIVA · R')}</small><b>${esc(tTech(t.name))}</b><em>${tr('Potencia {power}', { power: t.power })}</em></div>
            <div class="egx-box pas"><small>${tr('PASIVA · {passiveName}', { passiveName: esc(k.passive.name) })}</small><p>${esc(keshinPassiveText(k, shown))}</p></div>
            <div class="egx-foot"><span>${tr('{x1}ESPÍRITU GUERRERO', { x1: this.m.eg ? `<img src="${this.m.eg.insignia}" alt="">` : '' })}</span><span>${idx + 1}/${KESHINS.length}</span></div>
            <i class="egx-glare"></i>${this.egFrame(best)}</div>
          <div class="egx-face egx-back"><i class="egx-foil"></i>
            <div class="egx-back-logo">${this.m.eg ? `<img src="${this.m.eg.insignia}" alt="">` : ''}<b>${esc(k.name)}</b><small>${tr('En GO: «{game}»', { game: esc(k.passive.game) })}</small></div>
            <h3>${tr('Lo despiertan')}</h3><div class="egx-hs">${holders}</div>
            <h3>${tr('Por nivel')}</h3><p class="egx-pt">${esc(k.passive.name)}: ${esc(keshinPassiveText(k, 1).replace(/^[+-]\d+(?:,\d+)?%\s*/, ''))}</p><table class="egx-t"><tr><th></th><th>${tr('Estad.')}</th><th>${tr('Pot.')}</th><th>${esc(k.passive.name)}</th></tr>${rows}</table>
            <i class="egx-glare"></i></div>
        </div></div>
        <button class="egx-nav next" aria-label="${tr('Siguiente')}">›</button>
        <div class="egx-hint">${tr('Mueve el ratón o arrastra para girarla · tócala para darle la vuelta · ← → otro espíritu · Esc para cerrar')}</div>
        <button class="btn small egx-close">${tr('Cerrar')}</button>`;
      const card = box.querySelector<HTMLElement>('.egx-card')!;
      box.querySelector('.prev')!.addEventListener('click', (e) => { e.stopPropagation(); go(-1); });
      box.querySelector('.next')!.addEventListener('click', (e) => { e.stopPropagation(); go(1); });
      box.querySelector('.egx-close')!.addEventListener('click', close);
      const scene = box.querySelector<HTMLElement>('.egx-scene')!;
      scene.addEventListener('pointerdown', (e) => { dragging = true; moved = false; x0 = e.clientX; dragX = 0; scene.setPointerCapture(e.pointerId); });
      scene.addEventListener('pointermove', (e) => {
        const r = scene.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        if (dragging) { dragX = e.clientX - x0; if (Math.abs(dragX) > 6) moved = true; }
        ry = (x - 0.5) * 30; rx = (0.5 - y) * 24;
        card.style.setProperty('--gx', `${Math.round(x * 100)}%`); card.style.setProperty('--gy', `${Math.round(y * 100)}%`);
      });
      scene.addEventListener('pointerup', () => {
        if (!dragging) return;
        dragging = false;
        if (!moved) { base += 180; sfx('whoosh'); } // a tap turns it over
        else base = Math.round((base + dragX * 0.6) / 180) * 180; // a drag spins it, and it settles on a face
        dragX = 0;
      });
      scene.addEventListener('pointerleave', () => { if (!dragging) { rx = 0; ry = 0; } });
    };
    const go = (d: number) => { idx = (idx + d + KESHINS.length) % KESHINS.length; base = 0; sfx('click'); render(); };
    const tick = () => {
      if (!box.isConnected) return;
      const card = box.querySelector<HTMLElement>('.egx-card'), t = (performance.now() - t0) / 1000;
      if (card) { // it floats and sways on its own, plus the pointer's tilt and the turn
        const turn = base + ry + Math.sin(t * 0.9) * 4 + dragX * 0.6;
        card.style.transform = `translateY(${(Math.sin(t * 1.6) * 6).toFixed(1)}px) rotateX(${(rx + Math.cos(t * 1.1) * 3).toFixed(1)}deg) rotateY(${turn.toFixed(1)}deg)`;
      }
      raf = requestAnimationFrame(tick);
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') go(-1);
      else if (e.key === 'ArrowRight') go(1);
      else if (e.key === ' ') { e.preventDefault(); base += 180; }
    };
    const close = () => { cancelAnimationFrame(raf); document.removeEventListener('keydown', key); box.classList.add('out'); window.setTimeout(() => box.remove(), 220); };
    box.addEventListener('click', (e) => { const el = e.target as HTMLElement; if (el === box || el.classList.contains('egx-bg') || el.classList.contains('egx-rays')) close(); });
    document.addEventListener('keydown', key);
    render();
    raf = requestAnimationFrame(tick);
  }

  /** the awakening (or a new level): the spirit comes out of the dark over its footballer, its level symbol falls in */
  private keshinSummon(k: KeshinDef, id: number, from: number, to: number, done: () => void) {
    const p = this.byId.get(id)!, b = statBonus(k, to), t = techFor(k, to);
    const box = document.createElement('div');
    box.className = `eg-summon ${keshinElClass(k)}${from ? ' up' : ' first'}${to >= KESHIN_MAX ? ' omega' : ''}`;
    box.style.setProperty('--kc', k.color);
    box.style.setProperty('--ec', ELEMENT_COLOR[k.element]);
    box.innerHTML = `<i class="es-dark"></i><i class="es-burst"></i><i class="es-rays"></i><i class="es-ring r1"></i><i class="es-ring r2"></i><i class="es-sparks">${Array.from({ length: 18 }, (_, i) => `<b style="--a:${i * 20}deg;--d:${(i % 6) * 70}ms"></b>`).join('')}</i>
      <div class="es-center"><div class="es-fw"><div class="es-spirit">${this.egArt(k, 'es-img')}</div>${this.egFrame(from || to)}</div><div class="es-player">${this.mug(id, 64)}</div></div>
      <div class="es-text"><small>${from ? tr('¡EL ESPÍRITU CRECE!') : tr('¡ESPÍRITU GUERRERO DESPERTADO!')}</small><b>${esc(k.name)}</b><span>${esc(p.name)} · ${esc(k.title)}</span>
        <div class="es-lv">${to >= 2 ? this.egLevel(to, 64) : `<em>${tr('NIVEL I')}</em>`}</div>
        <ul class="es-gain"><li>+${Math.round(b.pct * 100)}% ${STAT_SHORT[b.key]}</li><li>${esc(k.passive.name)}: ${esc(keshinPassiveText(k, to))}</li><li>${tr('Definitiva (R): {tName} · potencia {power}', { tName: esc(tTech(t.name)), power: t.power })}</li></ul>
        <button class="btn big es-ok">${tr('¡Genial!')}</button></div>`;
    document.body.appendChild(box);
    egAwaken(k.element, to >= KESHIN_MAX ? 'omega' : from ? 'up' : 'first'); // 2.1 (author): epic, and by its affinity
    if (from) window.setTimeout(() => { // (author) a level up makes the frame burst and grow
      const fr = box.querySelector('.es-fw .eg-frame');
      if (fr) { fr.className = `eg-frame fl-${Math.min(KESHIN_MAX, to)} grow`; }
    }, 1000);
    if (this.save.settings.particles !== 'desactivado') window.setTimeout(() => confetti(), 900);
    let closed = false;
    const close = () => { if (closed) return; closed = true; box.classList.add('out'); window.setTimeout(() => { box.remove(); done(); }, 260); };
    window.setTimeout(() => box.querySelector('.es-ok')?.addEventListener('click', close), 500);
  }

  /** 2.1 (author): the frame of a spirit by its affinity, growing with its level (1..6 = I..Ω; 0 shows as I): a border,
   *  corner ornaments, edge ornaments from III, a pulsing glow from V, a double border at Ω (styleEgFrames.css) */
  private egFrame(lv: number) {
    const n = Math.max(1, Math.min(KESHIN_MAX, lv));
    return `<i class="eg-frame fl-${n}"><i class="ef-ring"></i>${['c1', 'c2', 'c3', 'c4'].map((c) => `<i class="ef-c ${c}"></i>`).join('')}${['m1', 'm2', 'm3', 'm4'].map((c) => `<i class="ef-m ${c}"></i>`).join('')}</i>`;
  }

  /** the panel of a footballer's spirit in his sheet (Colección) */
  private keshinPanel(d: RosterEntry) {
    const k = keshinOf(d.id);
    if (!k) return '';
    const lv = keshinLevel(this.save, d.id), b = statBonus(k, Math.max(1, lv));
    return `<div class="eg-panel ${keshinElClass(k)}${lv ? ' lit' : ''}" style="--kc:${k.color};--ec:${ELEMENT_COLOR[k.element]}">${this.egFrame(lv)}
      <span class="eg-pimg">${this.egArt(k)}</span>
      <div class="eg-ptx"><small>${tr('ESPÍRITU GUERRERO')}</small><b>${esc(k.name)} ${lv >= 2 ? this.egLevel(lv, 20) : lv ? `<em>${tr('Nivel I')}</em>` : ''}</b>
        <span>${lv ? `+${Math.round(b.pct * 100)}% ${STAT_SHORT[b.key]} · ${esc(k.passive.name)} · ${esc(tTech(techFor(k, lv).name))}` : tr('Sin despertar · {passiveName} y {techName}', { passiveName: esc(k.passive.name), techName: esc(k.tech.name) })}</span></div>
      <button class="btn small${lv ? ' blue' : ''}" data-keshin="${d.id}">${lv ? tr('Ver espíritu') : `Despertar · ${this.egIcon(14)} ${nextCost(this.save, d.id)}`}</button></div>`;
  }

  /** 2.0 launch notice: the gift of Fichas EG (once) */
  /**
   * 2.0 (author: «muy épico»): the launch intro, once per browser — a lightning bolt and a shockwave, the logo slams in,
   * a giant «2.0» drops with electricity, the 19 spirits light up in a ring round it in their affinity colours, the
   * novelties come in one by one, and the board's 2.0 news is one click away.
   */
  /**
   * (author) the spirits orbit the «2.0»: an oval sized by the number every frame (so it never reaches «ESPÍRITUS
   * GUERREROS» below, on any screen), in front bigger and over the number, behind smaller, dimmer and under it; the
   * pointer (mouse or finger) pushes the nearby ones away and they drift back to their orbit.
   */
  private launchOrbit(box: HTMLElement) {
    const wrap = box.querySelector('.l2-vw') as HTMLElement | null, num = box.querySelector('.l2-v') as HTMLElement | null;
    const spans = [...box.querySelectorAll<HTMLElement>('.l2-ring span')];
    if (!wrap || !num || !spans.length) return;
    const push = spans.map(() => ({ x: 0, y: 0 }));
    let px = -9999, py = -9999;
    box.addEventListener('pointermove', (e) => { px = e.clientX; py = e.clientY; });
    box.addEventListener('pointerdown', (e) => { px = e.clientX; py = e.clientY; });
    box.addEventListener('pointerleave', () => { px = -9999; py = -9999; });
    const t0 = performance.now();
    const frame = (now: number) => {
      if (!box.isConnected) return;
      const t = (now - t0) / 1000, w = wrap.getBoundingClientRect(), r = num.getBoundingClientRect();
      const cx = r.left - w.left + r.width / 2, cy = r.top - w.top + r.height * 0.44;
      const Rx = Math.min(r.width * 1.05 + 60, window.innerWidth / 2 - 22), Ry = r.height * 0.36; // wide, with depth
      spans.forEach((s, i) => {
        const a = (i / spans.length) * Math.PI * 2 + t * 0.32, depth = Math.sin(a); // +1 in front (bottom of the oval), -1 behind
        const x = cx + Math.cos(a) * Rx, y = cy + depth * Ry;
        const p = push[i], dx = w.left + x + p.x - px, dy = w.top + y + p.y - py, d = Math.hypot(dx, dy) || 1;
        if (d < 120) { const f = ((120 - d) / 120) * 7; p.x += (dx / d) * f; p.y += (dy / d) * f; }
        p.x *= 0.92; p.y *= 0.92;
        const appear = Math.max(0, Math.min(1, (t - 1.2 - i * 0.06) / 0.45)), sc = (0.55 + (depth + 1) * 0.4) * (0.5 + 0.5 * appear); // (author) the nearer, the bigger: 0.55 behind, 1.35 in front
        s.style.transform = `translate(${(x + p.x).toFixed(1)}px, ${(y + p.y).toFixed(1)}px) scale(${sc.toFixed(3)})`;
        s.style.zIndex = depth > 0 ? '3' : '1';
        s.style.opacity = (appear * (0.4 + (depth + 1) * 0.3)).toFixed(3);
      });
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }

  private launch20Pending() {
    try { return localStorage.getItem('iz-launch-2.0') !== '1'; } catch { return false; }
  }
  private launch20() {
    try { localStorage.setItem('iz-launch-2.0', '1'); } catch { /* private window: it may show again */ }
    const rel = PUBLIC_RELEASES[0];
    const box = document.createElement('div');
    box.className = 'launch20';
    const ring = KESHINS.map((k, i) => `<span style="--d:${i * 60}ms;--kc:${k.color}">${this.egArt(k)}</span>`).join('');
    const feats = rel.features.slice(0, 10).map((f, i) => `<b style="--d:${i * 110}ms">${f.icon} ${esc(f.title)}</b>`).join('');
    box.innerHTML = `<i class="l2-rays"></i><i class="l2-glow"></i><i class="l2-shock"></i><i class="l2-bolt"></i><i class="l2-flash"></i>
      <div class="l2-main"><div class="l2-logo">INAZURVIVORS</div><div class="l2-vw"><div class="l2-ring">${ring}</div><div class="l2-v">2.0</div></div><div class="l2-sub">${tr('ESPÍRITUS GUERREROS')}</div>
        <div class="l2-feats">${feats}</div>
        <div class="l2-btns"><button class="btn big blue" data-l2news>${tr('Ver todas las novedades')}</button><button class="btn big" data-l2go>${tr('¡A jugar! ▶')}</button></div></div>
      <button class="l2-skip" data-l2go>${tr('Saltar')}</button>`;
    document.body.appendChild(box);
    this.launchOrbit(box);
    window.setTimeout(() => sfx('boom'), 150);
    window.setTimeout(() => egAwaken('Fuego', 'omega'), 450);
    window.setTimeout(() => sfx('legend'), 2200);
    if (this.save.settings.particles !== 'desactivado') window.setTimeout(() => confetti(140), 1200);
    let closed = false;
    const close = (news: boolean) => {
      if (closed) return; closed = true;
      document.removeEventListener('keydown', onKey);
      box.classList.add('out');
      window.setTimeout(() => { box.remove(); if (news) this.devlog('version-2-0-espiritus'); }, 420);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(false); };
    document.addEventListener('keydown', onKey);
    box.querySelectorAll('[data-l2go]').forEach((b) => b.addEventListener('click', () => close(false)));
    box.querySelector('[data-l2news]')!.addEventListener('click', () => close(true));
  }

  private keshinIntro() {
    const box = document.createElement('div');
    box.className = 'eg-intro';
    box.innerHTML = `<div class="eg-intro-card"><i class="eg-head-glow"></i><small>${tr('INAZURVIVORS 2.0')}</small><b>${tr('¡Llegan los Espíritus Guerreros!')}</b>
      <div class="eg-intro-row">${KESHINS.map((k, i) => `<span style="--kc:${k.color};--d:${i * 70}ms">${this.egArt(k)}</span>`).join('')}</div>
      <p>${tr('{x1} <b>{x2}</b> para darle su pasiva, más estadísticas y su supertécnica. Los que lo tienen llevan esta insignia: {x3}', { x1: tr('Algunos futbolistas llevan dentro un espíritu guerrero. Despiértalo con'), x2: tr('Fichas EG'), x3: this.m.eg ? `<img class="eg-inline" src="${this.m.eg.insignia}" alt="">` : '' })}</p>
      <div class="eg-gift">${this.egIcon(34)}<small>${tr('Fichas EG: <b>1</b> por mapa en rango X y <b>3</b> en rango Z · <b>3</b> con el código EGu3rr3r0 · hasta <b>6</b> por semana en la tienda del clan · <b>12 / 8 / 5 / 2</b> en los premios semanales del clan')}</small></div>
      <p class="tut-nav"><button class="btn blue" data-close>${tr('Luego')}</button><span class="spacer"></span><button class="btn big" data-go-eg>${tr('Ver espíritus ▶')}</button></p></div>`;
    document.body.appendChild(box);
    sfx('legend');
    box.querySelector('[data-close]')!.addEventListener('click', () => box.remove());
    box.querySelector('[data-go-eg]')!.addEventListener('click', () => { box.remove(); this.keshinScreen(); });
  }

  // ------------------------------------------------------------- pre-2.0 co-op
  private coop: CoopLink | null = null;
  /** pre-2.0: the partner's card (squad, kit, name, icon, crest, banner, frame), from his «hello»; a co-op run in progress */
  private coopPartner: CoopProfile | null = null;
  private coopTick = 0;
  private coopOnEvent: ((m: CoopMsg) => void) | null = null;
  private coopRunActive = false;
  private coopMap = '';
  private coopAbort: AbortController | null = null;

  /** what this player shows of himself in the room */
  private coopMe(): CoopProfile {
    const squad = squadOf(this.save, this.byId);
    return {
      name: this.save.onlineName || this.save.profile.name, icon: this.save.profile.icon, crest: this.save.crest ?? '', kit: this.save.kit,
      pennant: this.save.pennants?.equipped ?? null, frame: this.save.pennants?.frame ?? null, wins: this.save.stats.wins, coach: this.benchCoach()?.id ?? null,
      squad: squad.map((p) => ({ id: p.id, r: effectiveRarity(this.save, p), st: (this.save.owned[String(p.id)]?.stars ?? 0) + (this.save.owned[String(p.id)]?.extraStars ?? 0), hero: isHero(this.save, p.id) })),
    };
  }

  /** a player's card in the room: his banner across the top, framed icon, crest, and his squad with the captain first */
  private coopCard(p: CoopProfile, mine: boolean) {
    const cap = this.byId.get(p.squad[0]?.id ?? -1);
    const emblem = p.crest ? this.emblemOf(p.crest) : '';
    const squad = p.squad.map((c, i) => {
      if (!this.byId.has(c.id)) return '';
      const r = (c.r in RARITY_COLOR ? c.r : 'comun') as Rarity;
      return `<span class="cp-mug r-${r}${i === 0 ? ' cap' : ''}${c.hero ? ' hero' : ''}" style="--rc:${RARITY_COLOR[r]}" title="${esc(this.byId.get(c.id)!.name)}">${this.mug(c.id, i === 0 ? 64 : 40)}${i === 0 ? '<em class="cp-c">C</em>' : ''}${c.st ? `<small>★${c.st}</small>` : ''}</span>`;
    }).join('');
    return `<div class="cp-pc${mine ? ' me' : ' them'}">
      <div class="cp-ribbon">${p.pennant ? pennantRibbon(p.pennant) : '<i class="cp-noribbon"></i>'}</div>
      <div class="cp-id">${this.framed(this.profileIcon(72, p.icon), p.frame)}
        <div class="cp-who"><small>${mine ? 'TÚ' : tr('TU COMPAÑERO')}</small><b>${esc(p.name)}</b>
          <span>${tr('{x1}{x2} · {wins} victorias', { x1: emblem ? `<img src="${emblem}" alt="">` : '', x2: esc(p.crest ? teamLabel(p.crest) : tr('Sin escudo')), wins: p.wins })}</span></div></div>
      <div class="cp-capline"><span>${cap ? `${tr('Capitán: <b>{capName}</b>', { capName: esc(cap.name) })}` : tr('Sin capitán')}</span><span>${tr('{squadLength} en el equipo', { squadLength: p.squad.length })}</span></div>
      <div class="cp-squad">${squad || `<span class="note">${tr('Sin equipo todavía')}</span>`}</div>
      ${(() => { const co = p.coach ? COACH_BY_ID.get(p.coach) : undefined; return co ? `<div class="cp-coach">${this.coachArt(co, 34)}<span><small>${tr('ENTRENADOR')}</small><b>${esc(co.name)}</b></span></div>` : ''; })()}</div>`;
  }

  /**
   * pre-2.0 (author): co-op for two, by room code or a friend's invitation. Linked, the room shows both players' cards
   * (banner, frame, crest and squad); the host picks the arena and starts. Only for signed-in players.
   */
  coopLobby(state: { busy?: string; code?: string; error?: string; join?: string } = {}) {
    setMusicContext('menu');
    const link = this.coop?.open ? this.coop : null;
    const ok = onlineConfigured() && signedIn();
    const hero = `<div class="cp-hero"><div class="cp-hero-tx"><small>${tr('MODO COOPERATIVO')}</small><b>${tr('Juega con un amigo')}</b>
        <span>${tr('Cada uno con su equipo, los mismos rivales y una sola barra de experiencia. Si uno cae, el otro lo levanta.')}</span>${activeSeason(serverNow()) && !this.save.season?.gold ? `<span class="cp-gold">${tr('{x1}Llave dorada ×{GOLD_KEY_COOP} en cooperativo: {x2}% por rival', { x1: this.m.pase ? `<img src="${this.m.pase.dorada}" alt="">` : '', GOLD_KEY_COOP, x2: (GOLD_KEY_CHANCE * GOLD_KEY_COOP * 100).toLocaleString(locale(), { maximumFractionDigits: 3 }) })}</span>` : ''}</div>
      <span class="cp-test" title="${tr('Puede tener fallos: si ves alguno, repórtalo desde el 🐞')}">${tr('EN PRUEBAS')}</span></div>`;
    let body: string;
    if (!ok) body = `<div class="panel cp-panel"><p class="note">${tr('El cooperativo necesita una cuenta: entra con Google en Ajustes.')}</p></div>`;
    else if (link) {
      const me = this.coopMe(), pa = this.coopPartner;
      const maps = this.m.maps.filter((mp) => isMapUnlocked(mp, this.save));
      if (!maps.some((mp) => mp.id === this.coopMap)) this.coopMap = maps[0]?.id ?? '';
      body = `<div class="cp-room">
        <div class="cp-vs">${this.coopCard(me, true)}
          <div class="cp-mid"><b class="cp-hands">${uiIcon('team')}</b><span class="cp-chip" id="cpping">${tr('Ping…')}</span><span class="cp-chip" id="cproute"></span><small>${tr('Sala {code}', { code: esc(link.code) })}</small></div>
          ${pa ? this.coopCard(pa, false) : `<div class="cp-pc them wait"><i class="cp-dots"><b></b><b></b><b></b></i><span>${tr('Preparando a {partner}…', { partner: esc(link.partner) })}</span></div>`}</div>
        ${link.role === 'host' ? `<div class="panel cp-panel"><h3>${tr('{x1}Elige la arena', { x1: uiIcon('pitch') })} <small>${tr('con tu rango {difficulty}', { difficulty: esc(this.save.difficulty) })}</small></h3>
            <div class="cp-maps">${maps.map((mp) => `<button class="cp-map-card${mp.id === this.coopMap ? ' on' : ''}" data-cpmap="${esc(mp.id)}"><small>${uiIcon('clock')}${fmtTime(mp.durationSec)}</small><b>${esc(mp.name)}</b>${mp.boss !== null ? `<span class="cp-boss">${this.mug(mp.boss, 40)}</span>` : ''}</button>`).join('')}</div>
            <button class="btn big cp-go" id="cpgo" ${pa ? '' : 'disabled'}>${pa ? tr('¡A jugar juntos! ▶') : tr('Esperando el equipo de tu compañero…')}</button></div>`
          : `<div class="panel cp-panel cp-waitpanel"><i class="cp-dots"><b></b><b></b><b></b></i><p>${pa ? `${tr('Esperando a que <b>{partner}</b> elija la arena y empiece…', { partner: esc(link.partner) })}` : 'Preparando…'}</p></div>`}
        <div class="cp-actions"><button class="btn" id="cpleave">${tr('Salir de la sala')}</button></div></div>`;
    } else if (state.code) {
      body = `<div class="cp-two"><div class="panel cp-panel cp-codebox"><small>${tr('CÓDIGO DE LA SALA')}</small><b class="cp-code">${esc(state.code)}</b>
          <button class="btn small blue" id="cpcopy">${tr('Copiar código')}</button><p class="note">${tr('Pásaselo a tu compañero o invita a un amigo. Esperando a que entre… (la sala dura 15 minutos)')}</p>
          <i class="cp-dots"><b></b><b></b><b></b></i><button class="btn" id="cpcancel">${tr('Cancelar')}</button></div>
        <div class="panel cp-panel"><h3>${tr('{x1}Invita a un amigo', { x1: uiIcon('team') })}</h3><div class="cp-friends" id="cpfriends"><p class="note">${tr('Cargando amigos…')}</p></div></div></div>`;
    } else if (state.busy) body = `<div class="panel cp-panel cp-waitpanel"><i class="cp-dots"><b></b><b></b><b></b></i><p>${esc(state.busy)}</p><button class="btn" id="cpcancel">${tr('Cancelar')}</button></div>`;
    else body = `<div class="cp-two">
        <div class="panel cp-panel cp-choice"><span class="cp-big-ic">${uiIcon('crown')}</span><b>${tr('Crear sala')}</b><p class="note">${tr('Eres el anfitrión: eliges la arena y se juega con tu rango.')}</p><button class="btn big" id="cpcreate">${tr('Crear sala')}</button></div>
        <div class="panel cp-panel cp-choice"><span class="cp-big-ic">${uiIcon('team')}</span><b>${tr('Unirse')}</b><p class="note">${tr('Escribe el código que te ha pasado tu compañero.')}</p>
          <div class="cp-join"><input id="cpcode" maxlength="6" placeholder="${tr('CÓDIGO')}" autocomplete="off" spellcheck="false" value="${esc(state.join ?? '')}"><button class="btn big blue" id="cpjoin">${tr('Unirse')}</button></div></div></div>
      <div class="panel cp-panel"><h3>${tr('{x1}Amigos', { x1: uiIcon('team') })} <button class="btn small blue" id="cpfriendsbtn">${tr('Gestionar amigos')}</button></h3><div class="cp-friends" id="cpfriends"><p class="note">${tr('Cargando amigos…')}</p></div></div>`;
    this.show(`<div class="screen coop-screen">${this.titlebar(tr('Cooperativo'), tr('Menú'))}${hero}${state.error ? `<p class="cp-err">${esc(state.error)}</p>` : ''}${body}</div>`);
    this.on('[data-back]', 'click', () => { this.coopAbort?.abort(); this.mainMenu(); });
    const fail = (e: unknown) => { this.coopAbort = null; if ((e as Error).message !== 'cancelado') this.coopLobby({ error: (e as Error).message }); };
    const adopt = (l: CoopLink) => { this.coopAbort = null; this.coop = l; this.coopPartner = null; this.coopLobby(); };
    const host = () => {
      this.coopAbort = new AbortController();
      this.coopLobby({ busy: tr('Creando la sala…') });
      CoopLink.host((code) => this.coopLobby({ code }), this.coopAbort.signal).then(adopt, fail);
    };
    const join = (raw?: string) => {
      const code = (raw ?? (document.getElementById('cpcode') as HTMLInputElement | null)?.value ?? '').trim().toUpperCase();
      if (!/^[A-Z2-9]{6}$/.test(code)) { this.coopLobby({ error: tr('El código tiene 6 letras y números.'), join: code }); return; }
      this.coopAbort = new AbortController();
      this.coopLobby({ busy: tr('Entrando en la sala {code}…', { code }) });
      CoopLink.join(code, this.coopAbort.signal).then(adopt, fail);
    };
    document.getElementById('cpcreate')?.addEventListener('click', host);
    document.getElementById('cpjoin')?.addEventListener('click', () => join());
    document.getElementById('cpcode')?.addEventListener('keydown', (e) => { if ((e as KeyboardEvent).key === 'Enter') join(); });
    document.getElementById('cpcancel')?.addEventListener('click', () => { this.coopAbort?.abort(); this.coopAbort = null; this.coopLobby(); });
    document.getElementById('cpcopy')?.addEventListener('click', () => { void navigator.clipboard?.writeText(state.code ?? '').then(() => this.toast(tr('Código copiado'))).catch(() => undefined); });
    document.getElementById('cpfriendsbtn')?.addEventListener('click', () => this.friendsScreen());
    document.getElementById('cpleave')?.addEventListener('click', () => { this.coop?.close(); this.coop = null; this.coopPartner = null; this.coopLobby(); });
    this.on('[data-cpmap]', 'click', (_e, el) => { this.coopMap = el.dataset.cpmap!; this.root.querySelectorAll('.cp-map-card').forEach((b) => b.classList.toggle('on', b === el)); });
    document.getElementById('cpgo')?.addEventListener('click', () => {
      if (!this.coopMap || !this.coopPartner || !this.coop?.open) return;
      const seed = Math.floor(Math.random() * 1e9);
      this.coop.send({ t: 'go', map: this.coopMap, rank: this.save.difficulty, seed });
      this.coopStart(this.coopMap, this.save.difficulty);
    });
    if (ok && !link) void this.coopFriendsPanel(state.code ?? null);
    if (state.join && !state.error && !state.busy) join(state.join); // from a friend's invitation
    clearInterval(this.coopTick);
    if (link) {
      if (link.onEvent !== this.coopOnEvent) this.coopListen(link); // a new link, or back from a run (it cleared them)
      void link.route().then((r) => { const el = document.getElementById('cproute'); if (el) el.textContent = r === 'retransmitida' ? tr('Por servidor de paso') : tr('Conexión directa'); });
      // one timer per render (cleared above), and the chip only changes when the reading does: no flicker
      const ping = () => {
        const el = document.getElementById('cpping');
        if (!el || !this.coop?.open) { clearInterval(this.coopTick); return; }
        const tx = this.coop.rtt ? `Ping ${this.coop.rtt} ms` : 'Ping…';
        if (el.textContent !== tx) el.textContent = tx;
      };
      ping();
      this.coopTick = window.setInterval(ping, 500);
    }
  }

  /** the room's friends list: who is online, and an «Invitar» button while this player hosts an empty room */
  private async coopFriendsPanel(code: string | null) {
    const box = () => document.getElementById('cpfriends');
    let rows: FriendRow[] = [];
    try { rows = (await friendList()).filter((f) => f.status === 'amigo'); } catch (e) { const b = box(); if (b) b.innerHTML = `<p class="note">${esc((e as Error).message)}</p>`; return; }
    const b = box();
    if (!b) return;
    if (!rows.length) { b.innerHTML = `<p class="note">${tr('Aún no tienes amigos añadidos. Añádelos en «Gestionar amigos» o desde su perfil en el ranking.')}</p>`; return; }
    b.innerHTML = rows.map((f) => `<div class="cp-fr${f.online ? ' on' : ''}">${this.profileIcon(32, this.iconFrom(f.avatar))}<b>${esc(f.username)}</b><span class="cp-dot">${f.online ? tr('En línea') : 'Desconectado'}</span>
      ${code ? `<button class="btn small" data-invite="${esc(f.username)}">${tr('Invitar')}</button>` : ''}</div>`).join('');
    this.on('[data-invite]', 'click', (_e, el) => {
      const name = el.dataset.invite!;
      (el as HTMLButtonElement).disabled = true;
      coopInvite(name, code!).then(() => { el.textContent = tr('Invitado ✔'); this.toast(tr('Invitación enviada a {name}', { name })); })
        .catch((err: Error) => { (el as HTMLButtonElement).disabled = false; this.toast(err.message, 4000); });
    }, b);
  }

  /** the avatar a friend row carries (the same text the profile keeps) */
  private iconFrom(avatar: string): { kind: 'emblem' | 'player' | 'coach'; id: number } | null {
    const id = Number(avatar);
    if (!avatar || !Number.isFinite(id)) return null;
    // the server keeps the number only: a crest when there is one with that id (the default icons), else a footballer
    return { kind: this.m.profile?.emblems?.some((e) => e.teamId === id) || !this.byId.has(id) ? 'emblem' : 'player', id };
  }

  /** pre-2.0: friends — add by global name, answer requests, see who is online, remove */
  async friendsScreen() {
    setMusicContext('menu');
    const ok = onlineConfigured() && signedIn();
    this.show(`<div class="screen friends-screen">${this.titlebar(tr('Amigos'), tr('Cooperativo'))}
      <div class="panel cp-panel"><h3>${tr('{x1}Añadir amigo', { x1: uiIcon('team') })}</h3>${ok ? `<div class="cp-join"><input id="fradd" maxlength="20" placeholder="${tr('Nombre global')}" autocomplete="off" spellcheck="false"><button class="btn blue" id="fraddgo">${tr('Enviar solicitud')}</button></div>
        <p class="note">${tr('También puedes añadir a alguien desde su perfil en el ranking.')}</p>` : `<p class="note">${tr('Necesitas una cuenta: entra con Google en Ajustes.')}</p>`}</div>
      <div id="frlist"><p class="note">${tr('Cargando…')}</p></div></div>`);
    this.on('[data-back]', 'click', () => this.coopLobby());
    if (!ok) return;
    const send = () => {
      const name = (document.getElementById('fradd') as HTMLInputElement).value.trim();
      if (!name) return;
      friendRequest(name).then((r) => { this.toast(r === 'aceptada' ? tr('¡Ahora eres amigo de {name}!', { name }) : r === 'ya_amigos' ? tr('Ya eres amigo de {name}', { name }) : `Solicitud enviada a ${name}`); void this.friendsScreen(); })
        .catch((e: Error) => this.toast(e.message, 4000));
    };
    document.getElementById('fraddgo')?.addEventListener('click', send);
    document.getElementById('fradd')?.addEventListener('keydown', (e) => { if ((e as KeyboardEvent).key === 'Enter') send(); });
    let rows: FriendRow[] = [];
    try { rows = await friendList(); } catch (e) { const l = document.getElementById('frlist'); if (l) l.innerHTML = `<p class="note">${esc((e as Error).message)}</p>`; return; }
    const list = document.getElementById('frlist');
    if (!list) return;
    const row = (f: FriendRow, actions: string) => `<div class="cp-fr${f.online ? ' on' : ''}">${this.profileIcon(36, this.iconFrom(f.avatar))}<b data-user="${esc(f.username)}">${esc(f.username)}</b>
      ${f.status === 'amigo' ? `<span class="cp-dot">${f.online ? tr('En línea') : 'Desconectado'}</span>` : ''}<span class="spacer"></span>${actions}</div>`;
    const got = rows.filter((f) => f.status === 'recibida'), mine = rows.filter((f) => f.status === 'amigo'), sent = rows.filter((f) => f.status === 'enviada');
    list.innerHTML = `${got.length ? `<div class="panel cp-panel"><h3>${tr('{x1}Solicitudes', { x1: uiIcon('gift') })} <small>${got.length}</small></h3>${got.map((f) => row(f, `<button class="btn small" data-fra="${esc(f.username)}">${tr('Aceptar')}</button><button class="btn small blue" data-frx="${esc(f.username)}">${tr('Rechazar')}</button>`)).join('')}</div>` : ''}
      <div class="panel cp-panel"><h3>${tr('{x1}Tus amigos', { x1: uiIcon('team') })} <small>${mine.length}/100</small></h3>${mine.length ? mine.map((f) => row(f, `<button class="btn small blue" data-frrm="${esc(f.username)}">${tr('Quitar')}</button>`)).join('') : `<p class="note">${tr('Todavía ninguno.')}</p>`}</div>
      ${sent.length ? `<div class="panel cp-panel"><h3>${tr('{x1}Enviadas', { x1: uiIcon('clock') })}</h3>${sent.map((f) => row(f, `<button class="btn small blue" data-frrm="${esc(f.username)}">${tr('Cancelar')}</button>`)).join('')}</div>` : ''}`;
    const act = (p: Promise<unknown>, msg: string) => p.then(() => { this.toast(msg); void this.friendsScreen(); }).catch((e: Error) => this.toast(e.message, 4000));
    this.on('[data-fra]', 'click', (_e, el) => act(friendRespond(el.dataset.fra!, true), tr('¡Ahora eres amigo de {fra}!', { fra: el.dataset.fra })), list);
    this.on('[data-frx]', 'click', (_e, el) => act(friendRespond(el.dataset.frx!, false), tr('Solicitud rechazada')), list);
    this.on('[data-frrm]', 'click', (_e, el) => this.armed(el, () => act(friendRemove(el.dataset.frrm!), 'Hecho')), list);
    this.bindUsers(list);
  }

  /**
   * pre-2.0: while the game is open with an account, it tells the server once a minute (friends see «en línea») and looks
   * for co-op invitations every 15 seconds outside a run; an invitation asks right away whether to join.
   */
  private socialStarted = false;
  private startSocial() {
    if (this.socialStarted) return;
    this.socialStarted = true;
    const live = () => onlineConfigured() && signedIn() && document.visibilityState === 'visible';
    const beat = () => { if (live()) void friendHeartbeat().catch(() => undefined); };
    beat();
    window.setInterval(beat, 60_000);
    window.setInterval(() => {
      if (!live() || this.arena()?.scene.isActive() || this.coop?.open || document.querySelector('.coop-invite')) return;
      void coopInvitesClaim().then((rows) => { const r = rows[rows.length - 1]; if (r) this.coopInviteNotice(r.from_name, r.code); }).catch(() => undefined);
    }, 15_000);
  }

  private coopInviteNotice(from: string, code: string) {
    sfx('reveal');
    const box = document.createElement('div');
    box.className = 'modal coop-invite';
    box.innerHTML = `<div class="panel cp-panel cp-invite"><span class="cp-big-ic">${uiIcon('team')}</span><h2>${tr('¡{from} te invita!', { from: esc(from) })}</h2>
      <p>${tr('Quiere jugar contigo en <b>cooperativo</b>. La invitación dura dos minutos.')}</p>
      <div class="cp-actions"><button class="btn big" id="cpinvok">${tr('Unirme')}</button><button class="btn blue" id="cpinvno">${tr('Ahora no')}</button></div></div>`;
    this.root.appendChild(box);
    box.querySelector('#cpinvok')!.addEventListener('click', () => { box.remove(); this.coopLobby({ join: code }); });
    box.querySelector('#cpinvno')!.addEventListener('click', () => box.remove());
  }

  /**
   * pre-2.0: the lobby's side of the link, hooked once per link: cards are exchanged, and the host's «go» starts the run
   * on both screens. A «hello» is answered once per link (marked as a reply), never from a render, and the room repaints
   * only when the partner's card changed: answering on every repaint made the two lobbies repaint each other without end
   * (the ping blinked, «¡A jugar juntos!» could not be clicked), and a partner still on that build must not restart it.
   */
  private coopListen(link: CoopLink) {
    let answered = false;
    link.onEvent = this.coopOnEvent = (m: CoopMsg) => {
      if (m.t === 'hello') {
        const p = m.me as CoopProfile;
        const before = JSON.stringify(this.coopPartner);
        this.coopPartner = { ...p, squad: (p.squad ?? []).filter((c) => this.byId.has(c.id)) };
        if (!m.reply && !answered) { answered = true; link.send({ t: 'hello', me: this.coopMe(), reply: true }); }
        if (this.screenKey === tr('Cooperativo') && this.coop === link && JSON.stringify(this.coopPartner) !== before) this.coopLobby();
      } else if (m.t === 'go' && link.role === 'guest') this.coopStart(String(m.map), m.rank as Rank);
    };
    link.onClose = (why) => { this.coop = null; this.coopPartner = null; if (this.screenKey === tr('Cooperativo')) this.coopLobby({ error: `Sala cerrada: ${why}` }); };
    link.send({ t: 'hello', me: this.coopMe() });
  }

  /** both screens start the same arena; each one plays with his own squad */
  private coopStart(mapId: string, rank: Rank) {
    const link = this.coop, partner = this.coopPartner;
    const squad = squadOf(this.save, this.byId);
    if (!link?.open || !partner || !squad.length || !this.m.maps.some((mp) => mp.id === mapId)) { this.toast(tr('No se pudo empezar la partida juntos')); return; }
    const team = partner.squad.map((c) => this.byId.get(c.id)!).filter(Boolean);
    this.startRun(mapId, [squad[0]], squad, undefined, { role: link.role, link, rank, partner: { name: partner.name || link.partner, team, kit: this.m.kits?.[partner.kit] ?? null } });
  }

  private async otherProfile(username: string) {
    document.getElementById('opf')?.remove();
    const box = document.createElement('div');
    box.className = 'modal';
    box.id = 'opf';
    box.innerHTML = `<div class="panel opf-panel"><div class="note">${tr('Cargando el perfil de {username}…', { username: esc(username) })}</div></div>`;
    this.root.appendChild(box);
    const close = () => box.remove();
    box.addEventListener('click', (e) => { if (e.target === box) close(); });
    let p: PublicProfile | null = null;
    try { p = await publicProfile(username); } catch { /* shown below */ }
    if (!box.isConnected) return;
    if (!p) { box.innerHTML = `<div class="panel opf-panel"><p>${tr('No se pudo cargar el perfil de {username}.', { username: esc(username) })}</p><button class="btn" data-close>${tr('Cerrar')}</button></div>`; box.querySelector('[data-close]')!.addEventListener('click', close); return; }
    const mapName = (id: string) => this.m.maps.find((x) => x.id === id)?.name ?? id;
    // 2.2 (author): their footballers as they really are: Campeón level, HÉROE stars, ascension, and normal + coin stars
    const level = (e: RosterEntry, o: { hero?: boolean; heroStars?: number; asc?: boolean; ascMitico?: boolean; ascRarity?: string | null; champion?: number }) => {
      const ch = Math.max(0, Math.min(CHAMPION_MAX, o.champion ?? 0));
      if (ch) return { label: CHAMPION_LABEL[ch], color: '#ffd84a', cls: ` champ c${ch}`, rank: 300 + ch };
      if (o.hero) return { label: tr('HÉROE{x1}', { x1: o.heroStars ? ' ' + '★'.repeat(o.heroStars) : '' }), color: '#ffd84a', cls: ' hero', rank: 200 + (o.heroStars ?? 0) };
      const r = ((o.asc || o.ascMitico) ? (o.ascRarity ?? 'mitico') : e.rarity) as Rarity;
      return { label: RARITY_LABEL[r] ?? r, color: RARITY_COLOR[r] ?? '#8a9bbd', cls: '', rank: RARITY_ORDER.indexOf(r) };
    };
    const starTxt = (n: number, x: number) => (n || x ? ` · ${'★'.repeat(n)}${x ? `<em class="opf-xs">+${x}★</em>` : ''}` : '');
    const squad = p.squad.filter((s) => this.byId.has(s.id)).map((s) => {
      const e = this.byId.get(s.id)!, lv = level(e, s);
      const aura = s.aura ? this.byId.get(Number(s.aura)) : undefined;
      return `<div class="opf-pl${lv.cls}" style="--rc:${lv.color}">${p!.captain === s.id ? '<span class="opf-cap">C</span>' : ''}${this.mug(s.id, 64)}
        <b>${esc(e.name)}</b><small>${esc(lv.label)}${starTxt(s.stars, s.extraStars ?? 0)}</small>
        ${aura ? `<span class="opf-aura" title="${tr('Aura: {auraName}', { auraName: esc(aura.name) })}">${tr('{mug}<em>Aura</em>', { mug: this.mug(aura.id, 24) })}</span>` : ''}</div>`;
    }).join('');
    // 2.2 (author): «que se puedan ver los jugadores de los demás maxeados»: their Campeones and HÉROES from the whole
    // collection, highest first (Campeón++ … HÉROE), up to 12
    const maxed = Object.entries(p.collection ?? {}).flatMap(([id, o]) => {
      const e = this.byId.get(Number(id));
      if (!e || !(o.champion || o.hero)) return [];
      return [{ e, o, lv: level(e, o) }];
    }).sort((a, b) => b.lv.rank - a.lv.rank || (b.o.stars ?? 0) + (b.o.extraStars ?? 0) - (a.o.stars ?? 0) - (a.o.extraStars ?? 0)).slice(0, 12);
    const maxedHtml = maxed.map(({ e, o, lv }) => `<div class="opf-pl${lv.cls}" style="--rc:${lv.color}">${this.mug(e.id, 56)}<b>${esc(e.name)}</b><small>${esc(lv.label)}${starTxt(o.stars ?? 0, o.extraStars ?? 0)}</small></div>`).join('');
    // 1.76: the best footballer and his mean, worked out from their collection exactly like the own Perfil does
    const theirs = { owned: p.collection ?? {} } as unknown as SaveData;
    let best: { id: number; mean: number; rarity: Rarity } | null = null;
    for (const id of Object.keys(p.collection ?? {})) {
      const e = this.byId.get(Number(id));
      if (!e?.stats) continue;
      const r = effectiveRarity(theirs, e), mean = statMean(playerStats(theirs, e, r, isHero(theirs, e.id)));
      if (!best || mean > best.mean) best = { id: e.id, mean, rarity: r };
    }
    const claimed = new Set(p.achievements ?? []);
    const fav = p.favorite ? `${this.emblemOf(p.favorite) ? `<img src="${this.emblemOf(p.favorite)}" alt="">` : ''}<span><small>${tr('EQUIPO FAVORITO')}</small><b>${esc(teamLabel(p.favorite))}</b></span>`
      : `<span><small>${tr('EQUIPO FAVORITO')}</small><b>${tr('Aún sin elegir')}</b></span>`;
    box.innerHTML = `<div class="panel opf-panel opf-full"><button class="btn small blue opf-x" data-close>✕</button>
      ${this.playerCard({ tag: tr('PERFIL DE JUGADOR{x1}', { x1: p.joined ? ` · desde ${esc(new Date(p.joined).toLocaleDateString(locale()))}` : '' }), name: p.username, icon: this.profileIcon(112, p.icon),
        frame: p.frame, crest: p.crest, pennant: p.banner ?? null, wins: p.stats.wins, owned: p.owned, heroes: p.heroes, fav, best, bestLabel: tr('SU MEJOR FUTBOLISTA'),
        runs: p.stats.runs, kills: p.stats.kills, bestTimeSec: p.stats.bestTimeSec, pulls: p.stats.pulls ?? null,
        achv: p.achievements ? MISSIONS.filter((d) => d.kind === 'logro' && claimed.has(d.id)).length : null })}
      <h3>${tr('{x1}Su equipo', { x1: uiIcon('team') })}</h3><div class="opf-squad">${squad || `<div class="note">${tr('Todavía no ha elegido equipo.')}</div>`}</div>
      ${maxedHtml ? `<h3>${tr('{x1}Sus futbolistas al máximo', { x1: uiIcon('crown') })}</h3><div class="opf-squad opf-maxed">${maxedHtml}</div>` : ''}
      ${p.marks.length ? `<h3>${tr('{x1}Mejores marcas', { x1: uiIcon('crown') })}</h3><div class="opf-marks">${p.marks.map((m) => `<span class="opf-mark"><span class="rank-btn r-${esc(m.rank)}">${rankMark(esc(m.rank))}</span>${esc(mapName(m.map))}<b>${fmtTime(m.time_sec)}</b><small>${tr('{x1} daño', { x1: Number(m.damage).toLocaleString(locale()) })}</small></span>`).join('')}</div>` : ''}
    </div>`;
    box.querySelector('[data-close]')!.addEventListener('click', close);
    // pre-2.0: add as a friend (for the co-op)
    if (onlineConfigured() && signedIn() && p.username !== this.save.onlineName) {
      const add = document.createElement('button');
      add.className = 'btn small opf-friend';
      add.textContent = tr('+ Añadir amigo');
      add.addEventListener('click', () => { add.disabled = true; friendRequest(p.username).then((r) => { add.textContent = r === 'enviada' ? tr('Solicitud enviada ✔') : tr('¡Ya sois amigos! ✔'); }).catch((e: Error) => { add.disabled = false; this.toast(e.message, 4000); }); });
      box.querySelector('.opf-panel')?.insertBefore(add, box.querySelector('.opf-panel h3'));
    }
  }

  /** v1.6: every ranking name opens that player's profile */
  private bindUsers(root: HTMLElement | null) {
    root?.querySelectorAll<HTMLElement>('[data-user]').forEach((el) => el.addEventListener('click', () => void this.otherProfile(el.dataset.user!)));
    this.bindClans(root);
  }
  /** 2.01: a clan's name or crest (ranking badges, clan ranking, search) opens its card; it wins over the player's row */
  private bindClans(root: HTMLElement | null) {
    root?.querySelectorAll<HTMLElement>('[data-clan], [data-clanid]').forEach((el) => el.addEventListener('click', (e) => {
      e.stopPropagation();
      void this.clanCard(el.dataset.clanid ? { id: Number(el.dataset.clanid) } : { name: el.dataset.clan! });
    }));
  }

  /** 2.01 (author): the card of any clan: its information, its points (this week, last week, in total) and its members */
  private async clanCard(q: { id?: number; name?: string }) {
    document.querySelector('.cl-info-modal')?.remove();
    const box = document.createElement('div');
    box.className = 'tut-modal cl-info-modal';
    box.innerHTML = `<div class="panel cl-info"><button class="cl-info-x" data-x title="${tr('Cerrar')}">✕</button><div class="note">${tr('Cargando el clan…')}</div></div>`;
    document.body.appendChild(box);
    sfx('click');
    const close = () => { window.removeEventListener('keydown', keys, true); box.remove(); };
    const keys = (e: KeyboardEvent) => { if (e.code === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); } };
    window.addEventListener('keydown', keys, true);
    box.addEventListener('click', (e) => { if (e.target === box || (e.target as HTMLElement).closest('[data-x]')) close(); });
    let c: Awaited<ReturnType<typeof clanInfo>>;
    try { c = await clanInfo(q); } catch { c = undefined as never; }
    const panel = box.querySelector('.cl-info');
    if (!panel || !document.body.contains(box)) return;
    if (!c) { panel.innerHTML = `<button class="cl-info-x" data-x title="${tr('Cerrar')}">✕</button><div class="note">${c === null ? tr('Ese clan ya no existe.') : tr('Los clanes no responden ahora.')}</div>`; return; }
    const n = (v: number) => Number(v || 0).toLocaleString(locale());
    const mine = this.save.clanSeen?.name.toLowerCase() === c.name.toLowerCase();
    const canJoin = !this.save.clanSeen && signedIn() && c.members < CLAN_MAX;
    const sample = this.unlockedRoster()[0];
    const top = Math.max(1, ...c.roster.map((m) => Number(m.week)));
    const lw = c.lastWeek;
    panel.innerHTML = `<button class="cl-info-x" data-x title="${tr('Cerrar')}">✕</button>
      <div class="cl-head cl-info-head"><div class="cl-head-art">${this.clanCrest(c.crest, 72)}${sample ? `<span class="cl-head-kit">${charCanvas(sample.id, 3, 12, '', c.kit)}</span>` : ''}</div>
        <div class="cl-head-tx"><small>${tr('CLAN · {x1}{x2}', { x1: c.mode === 'abierto' ? tr('ABIERTO') : tr('CON SOLICITUD'), x2: mine ? tr(' · EL TUYO') : '' })}</small><b>${esc(c.name)}</b>
          <span class="cl-head-tags"><span>${uiIcon('team')}${c.members}/${CLAN_MAX}</span><span>${uiIcon('shirt')}${esc(c.kit ? teamLabel(c.kit) : 'Raimon')}</span>${c.leader ? `<span>${uiIcon('crown')}${esc(c.leader)}</span>` : ''}<span>${tr('{x1}Desde {x2}', { x1: uiIcon('clock'), x2: new Date(c.created_at).toLocaleDateString(locale()) })}</span></span></div>
        <div class="cl-head-score"><small>${tr('ESTA SEMANA')}</small><b>${n(c.weekPoints)}</b><em>${c.pos ? tr('Puesto {pos} de {clans}', { pos: c.pos, clans: c.clans }) : tr('Sin puntos aún')}</em></div></div>
      <div class="cl-info-stats">
        <span><small>${tr('Semana pasada')}</small><b>${lw ? `#${lw.pos}` : '—'}</b><em>${lw ? `${n(lw.points)} pts` : tr('sin jugar')}</em></span>
        <span><small>${tr('Mejor puesto')}</small><b>${c.bestPos ? `#${c.bestPos}` : '—'}</b><em>${c.titles ? `${c.titles} ${c.titles === 1 ? 'semana' : 'semanas'} TOP 1` : tr('sin títulos')}</em></span>
        <span><small>${tr('Puntos totales')}</small><b>${n(c.totalPoints)}</b><em>${tr('desde que se fundó')}</em></span>
        <span><small>${tr('Partidas')}</small><b>${n(c.runs)}</b><em>${c.runs ? `${Math.round(c.wins / c.runs * 100)}% ganadas` : '—'}</em></span></div>
      <h3>${tr('{x1}Miembros', { x1: uiIcon('team') })}</h3>
      <div class="cl-members cl-info-mem">${c.roster.map((m) => `<div class="cl-mem${m.username === this.save.onlineName ? ' me' : ''}" data-user="${esc(m.username)}" title="${tr('Ver el perfil de {username}', { username: esc(m.username) })}">
          ${this.clanTag(m.role)}<b>${esc(m.username)}</b><span class="cl-info-bar"><i style="width:${Math.round(Number(m.week) / top * 100)}%"></i></span>
          <em>${tr('{n} pts', { n: n(m.week) })}<small>${tr('{n} en total', { n: n(m.total) })}</small></em></div>`).join('') || `<div class="note">${tr('Sin miembros.')}</div>`}</div>
      <div class="cl-info-foot"><small>${tr('Puntos de esta semana y del total con este clan. Toca a un miembro para ver su perfil.')}</small>
        ${mine ? '<button class="btn small" data-go-clan>Ir a mi clan</button>' : canJoin ? `<button class="btn small" data-join>${c.mode === 'abierto' ? 'Unirse' : tr('Solicitar unirse')}</button>` : ''}</div>`;
    mountPreviews();
    panel.querySelectorAll<HTMLElement>('[data-user]').forEach((el) => el.addEventListener('click', () => { close(); void this.otherProfile(el.dataset.user!); }));
    panel.querySelector('[data-go-clan]')?.addEventListener('click', () => { close(); void this.clanScreen('clan'); });
    panel.querySelector<HTMLButtonElement>('[data-join]')?.addEventListener('click', async (e) => {
      const b = e.currentTarget as HTMLButtonElement;
      b.disabled = true;
      try {
        const r = await clanRequest(c!.id);
        close();
        if (r === 'joined') { sfx('evolve'); this.toast(tr('¡Ya eres del clan!')); void this.clanScreen('clan'); }
        else { sfx('click'); this.toast(tr('Solicitud enviada: el líder o un oficial la aceptará')); }
      } catch (err) { this.toast(clanError(String((err as Error)?.message ?? err))); b.disabled = false; }
    });
  }

  /** Main-menu TOP 5 of the global board (time survived, all arenas and ranks) and the player's own position. */
  /**
   * Fix 1.12: the big ranking of the main menu, from the real Supabase board: a podium for the top 3 (captain portrait,
   * crest, rank, time, damage), places 4-15 in a scrolling list and the player's own position pinned below.
   */
  // ------------------------------------------------------------- 1.8 GTS
  private gtsTab: 'mios' | 'buscar' | 'historial' = 'mios';
  private gtsQuery = '';
  private gtsOnlyMine = false;
  private gtsRows: GtsRow[] = [];
  private gtsOffers: GtsOffer[] | null = null;

  /** Reads the ledger and applies to the save whatever is new; plays the arrival of what came in. */
  private async gtsSync(animate = true) {
    if (!onlineConfigured() || !signedIn()) return [];
    this.gtsRows = await gtsMine();
    const ev = applyGtsLedger(this.save, this.gtsRows);
    if (ev.length) { this.persist(); void this.pushCloud(true); }
    if (animate) for (const e of ev.filter((x) => x.kind === 'recibido')) await this.gtsAnim('vuelve', e.arrived!, tr('¡Te han cambiado a {x1}! Llega {x2}{x3}.', { x1: this.byId.get(e.left!)?.name ?? '?', x2: this.byId.get(e.arrived!)?.name ?? '?', x3: e.other ? tr(' de {other}', { other: e.other }) : '' }));
    return ev;
  }

  /**
   * The footballer leaving (runs up into a beam of light and goes off as a capsule) or arriving (the capsule comes down,
   * opens and he lands). Resolves when it ends or is clicked.
   */
  private gtsAnim(kind: 'se-va' | 'vuelve', id: number, text: string, other?: number): Promise<void> {
    return new Promise((resolve) => {
      const p = this.byId.get(id);
      const box = document.createElement('div');
      box.className = `modal gts-anim ${kind}`;
      box.innerHTML = `<div class="gts-stage"><i class="gts-beam"></i><i class="gts-ring"></i><span class="gts-capsule">${uiIcon('capsule')}</span>
        <span class="gts-runner">${charCanvas(id, 4, kind === 'se-va' ? 8 : 4)}</span>
        ${other !== undefined ? `<span class="gts-runner gts-other">${charCanvas(other, 4, 4)}</span>` : ''}</div>
        <div class="gts-caption"><span class="gts-mug" style="--rc:${p ? RARITY_COLOR[p.rarity] : '#8a9bbd'}">${this.mug(id, 64)}</span><b>${esc(text)}</b><small>${tr('Toca para seguir')}</small></div>`;
      this.root.appendChild(box);
      mountPreviews();
      sfx(kind === 'se-va' ? 'whoosh' : 'legend');
      let gone = false;
      const done = () => { if (gone) return; gone = true; box.remove(); resolve(); };
      box.addEventListener('click', () => { if (performance.now() - t0 > 500) done(); });
      const t0 = performance.now();
      window.setTimeout(done, 3600);
    });
  }

  /** The GTS: your deposits (slots), search other players' deposits, and the history of your exchanges. */
  async gts() {
    setMusicContext('menu');
    const online = onlineConfigured() && signedIn();
    const render = () => {
      const slots = gtsSlots(this.save);
      const open = this.gtsRows.filter((r) => r.role === 'deposito' && r.status === 'open');
      const name = (id: number) => esc(this.byId.get(id)?.name ?? '?');
      const face = (id: number, size = 48) => { const p = this.byId.get(id); return `<span class="gts-face" style="--rc:${p ? RARITY_COLOR[p.rarity] : '#8a9bbd'}">${this.mug(id, size as 64)}</span>`; };
      const pair = (give: number, want: number) => `<div class="gts-pair">${face(give)}<span class="gts-arrow">⇄</span>${face(want)}</div><div class="gts-names"><b>${name(give)}</b><span>${tr('por')}</span><b>${name(want)}</b></div>`;
      let body = '';
      if (!online) body = `<div class="panel"><p>${tr('La GTS es un banco online de futbolistas: dejas una copia repetida pidiendo otro futbolista a cambio, y cualquiera que tenga el que pides puede cambiártelo aunque no estés conectado.')}</p>
        <p class="note">${tr('Para usarla tienes que entrar con tu cuenta.')}</p><p><button class="btn" data-go2="profile">${tr('Ir a Perfil para entrar')}</button></p></div>`;
      else if (this.gtsTab === 'mios') {
        body = `<div class="gts-slots">${Array.from({ length: 5 }, (_, i) => {
          const r = open[i];
          if (r) return `<div class="gts-slot on">${pair(r.give_id, r.want_id)}<small>${tr('Esperando desde {x1}', { x1: new Date(r.created_at).toLocaleDateString(locale()) })}</small><button class="btn small blue" data-withdraw="${r.id}">${tr('Recuperar')}</button></div>`;
          if (i < slots) return `<button class="gts-slot free" id="${i === open.length ? 'gtsnew' : ''}"><span class="gts-plus">+</span><b>${tr('Dejar un futbolista')}</b><small>${tr('Solo copias repetidas')}</small></button>`;
          return `<div class="gts-slot locked"><span class="gts-plus">🔒</span><small>${tr('Mejora la «Ventanilla GTS» en Mejoras')}</small></div>`;
        }).join('')}</div>
        <p class="note">${tr('Huecos: {openLength}/{slots}. La copia que dejas va sin entrenamiento, estrellas ni ascensión: tu futbolista se queda con todo. Un HÉROE ascendido sí puede dejar sus copias repetidas. No se pueden dejar Leyenda ni futbolistas de evento, ni repetir un cambio.', { openLength: open.length, slots })}</p>`;
      } else if (this.gtsTab === 'buscar') {
        const q = this.gtsQuery.trim().toLowerCase();
        const offers = (this.gtsOffers ?? []).filter((o) => !q || (this.byId.get(o.give_id)?.name ?? '').toLowerCase().includes(q) || (this.byId.get(o.want_id)?.name ?? '').toLowerCase().includes(q))
          .filter((o) => !this.gtsOnlyMine || gtsSpare(this.save, o.want_id) > 0);
        body = `<div class="filters"><input id="gtsq" placeholder="${tr('Buscar futbolista (el que quieres o el que piden)')}" value="${esc(this.gtsQuery)}">
          <label class="note"><input type="checkbox" id="gtsmine" ${this.gtsOnlyMine ? 'checked' : ''}> ${tr('Solo los que puedo cambiar')}</label><button class="btn small blue" id="gtsreload">${tr('↻ Actualizar')}</button></div>
          <div class="gts-list">${this.gtsOffers === null ? '<div class="note">Cargando…</div>' : offers.map((o) => {
            const can = gtsSpare(this.save, o.want_id) > 0;
            return `<div class="gts-offer${can ? ' can' : ''}"><div class="gts-who"><small>${tr('{username} deja', { username: esc(o.username) })}</small></div>${pair(o.give_id, o.want_id)}
              <button class="btn small${can ? '' : ' blue'}" data-take="${o.id}" ${can ? '' : 'disabled'} title="${can ? tr('Das tu copia repetida y te llevas el suyo') : tr('Necesitas una copia repetida del que pide')}">${can ? 'Cambiar' : tr('No lo tienes repetido')}</button></div>`;
          }).join('') || `<div class="note">${tr('No hay depósitos que coincidan.')}</div>`}</div>`;
      } else {
        const hist = this.gtsRows.filter((r) => r.status !== 'open');
        body = `<div class="gts-list">${hist.map((r) => `<div class="gts-offer"><div class="gts-who"><small>${r.role === 'tomado' ? tr('Cambiaste con {x1}', { x1: esc(r.other ?? '?') }) : r.status === 'traded' ? tr('{x1} te lo cambió', { x1: esc(r.other ?? '?') }) : tr('Lo recuperaste')}</small></div>
          ${r.role === 'tomado' ? pair(r.want_id, r.give_id) : pair(r.give_id, r.want_id)}<small>${new Date(r.closed_at ?? r.created_at).toLocaleDateString(locale())}</small></div>`).join('') || `<div class="note">${tr('Todavía no has hecho ningún cambio.')}</div>`}</div>`;
      }
      this.show(`<div class="screen gts-screen">${this.titlebar(tr('GTS · Estación de intercambio'), 'Menú')}
        <div class="gts-hero"><span class="gts-globe">${uiIcon('gts')}</span><div><b>${tr('Estación Global de Intercambio')}</b><small>${tr('Deja una copia repetida, pide el futbolista que te falta y recoge tu cambio cuando vuelvas.')}</small></div></div>
        ${online ? `<div class="rw-tabs gts-tabs">${([['mios', tr('Mis depósitos')], ['buscar', tr('Buscar')], ['historial', tr('Historial')]] as const).map(([k, l]) => `<button class="rw-tab${this.gtsTab === k ? ' on' : ''}" data-gtab="${k}"><span class="rw-tab-tx"><b>${l}</b></span></button>`).join('')}</div>` : ''}
        ${body}</div>`);
      this.on('[data-back]', 'click', () => this.mainMenu());
      this.on('[data-go2]', 'click', () => this.profile());
      this.on('[data-gtab]', 'click', (_e, el) => { this.gtsTab = el.dataset.gtab as typeof this.gtsTab; if (this.gtsTab === 'buscar' && this.gtsOffers === null) void loadOffers(); render(); });
      document.getElementById('gtsnew')?.addEventListener('click', () => this.gtsDepositModal(() => { render(); }));
      this.on('[data-withdraw]', 'click', (_e, el) => this.armed(el, async () => {
        try {
          const id = Number(el.dataset.withdraw);
          if (!(await gtsWithdraw(id))) { this.toast(tr('Ese depósito ya no está: puede que alguien te lo acabe de cambiar.')); await this.gtsSync(); render(); return; }
          const row = this.gtsRows.find((r) => r.id === id);
          await this.gtsSync(false);
          if (row) await this.gtsAnim('vuelve', row.give_id, tr('{x1} vuelve a tu club.', { x1: this.byId.get(row.give_id)?.name ?? '?' }));
          render();
        } catch (e) { this.toast(gtsError(e), 4000); }
      }));
      this.on('[data-take]', 'click', (_e, el) => this.armed(el, async () => {
        const o = this.gtsOffers?.find((x) => x.id === Number(el.dataset.take));
        if (!o) return;
        try {
          await this.pushCloud(true); // the server checks the spare copy against the cloud save
          await gtsTake(o.id);
          await this.gtsSync(false);
          await this.gtsAnim('se-va', o.want_id, tr('{x1} se va con {username}…', { x1: this.byId.get(o.want_id)?.name ?? '?', username: o.username }));
          await this.gtsAnim('vuelve', o.give_id, tr('¡Llega {x1}!', { x1: this.byId.get(o.give_id)?.name ?? '?' }));
          this.gtsOffers = this.gtsOffers?.filter((x) => x.id !== o.id) ?? null;
          render();
        } catch (e) { this.toast(gtsError(e), 4000); void loadOffers(); }
      }));
      document.getElementById('gtsq')?.addEventListener('change', (e) => { this.gtsQuery = (e.target as HTMLInputElement).value; render(); });
      document.getElementById('gtsmine')?.addEventListener('change', (e) => { this.gtsOnlyMine = (e.target as HTMLInputElement).checked; render(); });
      document.getElementById('gtsreload')?.addEventListener('click', () => void loadOffers());
    };
    const loadOffers = async () => {
      try { this.gtsOffers = await gtsSearch(null, null); } catch { this.gtsOffers = []; this.toast(tr('No se pudo cargar la GTS.')); }
      if (this.screenKey === 'gts' || document.querySelector('.gts-screen')) render();
    };
    render();
    if (online) {
      try { await this.gtsSync(); } catch (e) { this.toast(gtsError(e), 4000); }
      if (this.gtsTab === 'buscar') await loadOffers(); else render();
    }
  }

  /** Two steps: the spare copy to leave, then the footballer asked for in exchange. */
  private gtsDepositModal(after: () => void) {
    let give: number | null = null, q = '';
    const box = document.createElement('div');
    box.className = 'modal';
    this.root.appendChild(box);
    const close = () => box.remove();
    const draw = () => {
      const ql = q.trim().toLowerCase();
      const list = give === null
        ? this.unlockedRoster().filter((p) => !canLeave(this.save, p)).sort((a, b) => RARITY_ORDER.indexOf(b.rarity) - RARITY_ORDER.indexOf(a.rarity) || a.name.localeCompare(b.name, 'es'))
        : this.m.roster.filter((p) => p.id !== give && !gtsBanned(p)).sort((a, b) => RARITY_ORDER.indexOf(b.rarity) - RARITY_ORDER.indexOf(a.rarity) || a.name.localeCompare(b.name, 'es'));
      const shown = list.filter((p) => !ql || p.name.toLowerCase().includes(ql)).slice(0, 120);
      box.innerHTML = `<div class="panel gts-pick"><div class="gts-pick-head"><b>${give === null ? tr('1. ¿Qué copia repetida dejas?') : tr('2. ¿Qué futbolista pides a cambio de {x1}?', { x1: esc(this.byId.get(give)?.name ?? '') })}</b>
        <button class="btn small blue" id="gpclose">✕</button></div>
        <input id="gpq" placeholder="${tr('Buscar por nombre')}" value="${esc(q)}">
        <div class="gts-pick-grid">${shown.map((p) => `<button class="gts-pickcard" data-pick="${p.id}" style="--rc:${RARITY_COLOR[p.rarity]}">${this.mug(p.id, 48)}<b>${esc(p.name)}</b><small>${RARITY_LABEL[p.rarity]}${give === null ? tr(' · {gtsSpare} de sobra', { gtsSpare: gtsSpare(this.save, p.id) }) : this.save.owned[String(p.id)] ? tr(' · lo tienes') : ''}</small></button>`).join('')
          || `<div class="note">${give === null ? tr('No tienes copias repetidas que se puedan dejar.') : tr('Nadie con ese nombre.')}</div>`}</div>
        ${give !== null ? `<p><button class="btn small blue" id="gpback">${tr('‹ Elegir otra copia')}</button></p>` : ''}</div>`;
      box.querySelector('#gpclose')!.addEventListener('click', close);
      box.querySelector('#gpback')?.addEventListener('click', () => { give = null; q = ''; draw(); });
      const inp = box.querySelector('#gpq') as HTMLInputElement;
      inp.addEventListener('change', () => { q = inp.value; draw(); });
      box.querySelectorAll<HTMLElement>('[data-pick]').forEach((el) => el.addEventListener('click', async () => {
        const id = Number(el.dataset.pick);
        if (give === null) { give = id; q = ''; draw(); return; }
        const want = id, left = give;
        close();
        try {
          await this.pushCloud(true);
          await gtsDeposit(left, want);
          await this.gtsSync(false);
          await this.gtsAnim('se-va', left, tr('{x1} se va a la GTS. Pides a {x2}.', { x1: this.byId.get(left)?.name ?? '?', x2: this.byId.get(want)?.name ?? '?' }));
        } catch (e) { this.toast(gtsError(e), 4500); }
        after();
      }));
    };
    draw();
  }

  /**
   * 1.85 (author): bug bounty. Every report the admin marks «corregido» gives its reporter 100 fichas (the server keeps
   * them until claimed). Checked when the main menu opens (at most once a minute), then a thank-you notice.
   */
  private bugBountyAt = 0;
  private async claimBugBounty() {
    if (!onlineConfigured() || !signedIn() || Date.now() - this.bugBountyAt < 60000) return;
    this.bugBountyAt = Date.now();
    let rows: { code: string; title: string; tokens: number }[] = [];
    let notes: { code: string; title: string; status: string; reply: string }[] = [];
    let ideas: { code: string; title: string; status: string; reply: string }[] = [];
    try { [rows, notes, ideas] = await Promise.all([claimBugRewards().catch(() => []), claimBugNotices().catch(() => []), claimSuggestionNotices().catch(() => [])]); } catch { return; }
    notes = [...(notes ?? []), ...(ideas ?? []).filter((n) => n.status !== 'descartada')];
    rows ??= []; notes ??= [];
    // 1.88 (author): replies and fixed reports go to the notification bar at the top; a discarded report tells nothing
    const keep = notes.filter((n) => n.status !== 'descartado' && (n.reply || n.status === 'corregido'));
    if (keep.length) {
      const inbox = (this.save.bugInbox ??= []);
      for (const n of keep) { const k = inbox.findIndex((x) => x.code === n.code); const item = { ...n, at: Date.now() }; if (k >= 0) inbox[k] = item; else inbox.unshift(item); }
      this.save.bugInbox = inbox.slice(0, 20);
      this.persist();
      this.notiBar();
    }
    if (!rows.length) return;
    const total = rows.reduce((a, r) => a + (r.tokens ?? 0), 0);
    this.save.tokens += total;
    this.persist();
    document.querySelector('.bounty-modal')?.remove();
    const box = document.createElement('div');
    box.className = 'tut-modal bounty-modal';
    box.innerHTML = `<div class="panel bounty-panel"><div class="bn-ic">🐞</div><h2>${tr('¡Gracias por ayudar!')}</h2>
      <p>${rows.length === 1 ? tr('Tu reporte se ha corregido') : tr('{rowsLength} reportes tuyos se han corregido', { rowsLength: rows.length })}:</p>
      <ul class="bn-list">${rows.slice(0, 6).map((r) => `<li><b>${esc(r.code)}</b> ${esc(r.title)} <em>+${r.tokens}</em></li>`).join('')}</ul>
      <div class="bn-total">${tr('+{total} fichas', { total })}</div>
      <p class="note">${tr('Cada bug que reportes y se corrija te da 100 fichas. Repórtalos desde el 🐞 del menú o en Ajustes.')}</p>
      <div class="tut-nav"><span class="spacer"></span><button class="btn" data-close>${tr('¡Genial!')}</button></div></div>`;
    document.body.appendChild(box);
    sfx('legend');
    box.querySelector('[data-close]')!.addEventListener('click', () => { box.remove(); this.mainMenu(); });
  }

  /**
   * 1.88 (author): answers to the player's bug reports as a notification at the top of the menu: tap to read it, ✕ to
   * delete it. They stay (in the save) until he deletes them.
   */
  private notiBar() {
    document.getElementById('notibar')?.remove();
    const inbox = this.save.bugInbox ?? [];
    if (!inbox.length || !document.querySelector('.m4-stage')) return;
    const bar = document.createElement('div');
    bar.id = 'notibar';
    bar.className = 'notibar';
    bar.innerHTML = inbox.slice(0, 3).map((n, i) => `<div class="nb-item" data-i="${i}">
      <button class="nb-head" data-open="${i}"><span class="nb-ic">${n.status === 'corregido' ? '✅' : n.code.startsWith('IDEA') ? '💡' : '💬'}</span>
        <span class="nb-tx"><b>${n.status === 'corregido' ? tr('Tu reporte se ha corregido') : n.status === 'aceptada' ? tr('¡Tu recomendación ha sido aceptada!') : n.code.startsWith('IDEA') ? tr('Respuesta a tu recomendación') : tr('Respuesta a tu reporte')}</b><small>${esc(n.code)} · ${esc(n.title)}</small></span><em>${tr('Ver')}</em></button>
      <button class="nb-x" data-del="${i}" title="${tr('Borrar')}">✕</button>
      <div class="nb-body" hidden>${n.reply ? `<p>${esc(n.reply)}</p>` : n.status === 'aceptada' ? `<p>${tr('¡Gracias por la idea! La tendremos en cuenta.')}</p>` : `<p>${tr('¡Gracias por avisar! Ya está arreglado.')}</p>`}</div></div>`).join('')
      + (inbox.length > 3 ? `<div class="nb-more">${tr('+{x1} más', { x1: inbox.length - 3 })}</div>` : '');
    document.body.appendChild(bar);
    bar.querySelectorAll<HTMLElement>('[data-open]').forEach((b) => b.addEventListener('click', () => {
      const body = b.parentElement!.querySelector('.nb-body') as HTMLElement;
      body.hidden = !body.hidden; b.querySelector('em')!.textContent = body.hidden ? 'Ver' : 'Ocultar';
    }));
    bar.querySelectorAll<HTMLElement>('[data-del]').forEach((b) => b.addEventListener('click', () => {
      (this.save.bugInbox ?? []).splice(Number(b.dataset.del), 1);
      this.persist(); sfx('click'); this.notiBar();
    }));
  }

  /** Main menu: the latest movements of the GTS, loaded after the menu is shown. */
  private async fillMenuGts() {
    const box = document.getElementById('menugts');
    if (!box || !onlineConfigured()) return;
    try {
      const rows = (await gtsFeed()).filter((r) => this.byId.has(r.give_id) && this.byId.has(r.want_id)).slice(0, 4);
      if (!document.body.contains(box)) return;
      box.innerHTML = rows.map((r) => `<div class="gts-feed${r.status === 'traded' ? ' done' : ''}">${this.mug(r.give_id, 26 as 64)}<span>${r.status === 'traded' ? '⇄' : '→'}</span>${this.mug(r.want_id, 26 as 64)}
        <small><b>${esc(r.username)}</b> ${r.status === 'traded' ? 'cambió' : 'deja'} ${esc(this.byId.get(r.give_id)!.name)}</small></div>`).join('') || `<div class="note">${tr('Aún no hay intercambios. ¡Sé el primero!')}</div>`;
    } catch { box.innerHTML = `<div class="note">${tr('La GTS no responde ahora.')}</div>`; }
  }

  private async fillMenuRank() {
    const box = document.getElementById('menurank');
    if (!box) return;
    try {
      const q: BoardQuery = { map: null, rank: null, order: 'score' }; // Fix 1.31: the menu shows the points ranking
      const [top, mine] = await Promise.all([leaderboard(q), signedIn() ? myPosition(q) : Promise.resolve(null)]);
      await Promise.all([this.loadFlags(top.map((r) => r.username)), this.loadChamps(top.map((r) => ({ username: r.username, captain: r.captain_id })))]); // v1.65; 2.0 champions
      const el = document.getElementById('menurank');
      if (!el) return;
      const crest = (c: string) => (c && this.emblemOf(c) ? `<img class="wr-crest" src="${this.emblemOf(c)}" alt="">` : '<span class="wr-crest"></span>');
      const cap = (id: number) => this.byId.get(id);
      const pts = (r: BoardRow) => r.score == null ? scoreOf({ map: r.map, rank: r.rank, time: r.time_sec, damage: Number(r.damage) }) : Number(r.score);
      const podium = top.slice(0, 3).map((r) => {
        const p = cap(r.captain_id), pos = Number(r.pos);
        return `<div class="wr-pod p${pos}" data-user="${esc(r.username)}" title="${tr('Ver el perfil de {username}', { username: esc(r.username) })}"><span class="wr-medal">${['🥇', '🥈', '🥉'][pos - 1]}</span>
          ${this.framed(`<span class="wr-mug${p ? ` r-${p.rarity}` : ''}${this.champLevel(r.username, r.captain_id) ? ' champ' : ''}">${p ? this.mug(p.id, pos === 1 ? 96 : 80) : ''}</span>`, this.frameOf(r.username))}
          ${this.namePlate('wr-name', r.username)}${this.clanBadge(r.username)}${this.champTag(r.username, r.captain_id)}<small class="wr-cap">${p ? esc(p.name) : ''}</small>
          <div class="wr-pts"><b>${pts(r).toLocaleString(locale())}</b> <small>${tr('puntos')}</small></div>
          <div class="wr-stats">${crest(r.crest)}<span class="rank-btn r-${r.rank}">${rankMark(r.rank)}</span><span><b>${fmtTime(r.time_sec)}</b><small>${tr('tiempo')}</small></span><span><b>${Number(r.damage).toLocaleString(locale())}</b><small>${tr('daño')}</small></span></div></div>`;
      }).join('');
      const row = (r: BoardRow, me = false) => {
        const p = cap(r.captain_id), rb = this.flagMini(r.username);
        return `<div class="wr-row${me ? ' me' : ''}${rb ? ' has-pn' : ''}" data-user="${esc(r.username)}" title="${tr('Ver el perfil de {username}', { username: esc(r.username) })}">${rb}<span class="wr-pos">#${r.pos}</span>${this.framed(`<span class="wr-mini">${p ? this.mug(p.id, 40) : ''}</span>`, this.frameOf(r.username))}
          <span class="wr-who"><b class="${this.goldName(r.username).trim()}">${esc(r.username)}</b>${this.clanBadge(r.username)}${this.champTag(r.username, r.captain_id)}<small>${p ? esc(p.name) : ''}</small></span>${crest(r.crest)}
          <span class="rank-btn r-${r.rank}">${rankMark(r.rank)}</span><span class="wr-num"><b>${tr('{x1} pts', { x1: pts(r).toLocaleString(locale()) })}</b><small>${tr('{time_sec} · {x1} daño', { time_sec: fmtTime(r.time_sec), x1: Number(r.damage).toLocaleString(locale()) })}</small></span></div>`;
      };
      el.innerHTML = top.length
        ? `<div class="wr-podium">${podium}</div><div class="wr-list">${top.slice(3, 15).map((r) => row(r)).join('')}</div>`
          + (mine ? `<div class="wr-mine"><small>${tr('Tu posición')}</small>${row(mine, true)}</div>` : signedIn() ? `<div class="note">${tr('Juega una partida para aparecer en el ranking.')}</div>` : `<div class="note">${tr('Entra con Google para aparecer en el ranking.')}</div>`)
        : `<div class="note">${tr('Aún nadie en el ranking: ¡sé el primero!')}</div>`;
      this.bindUsers(el);
    } catch { const el = document.getElementById('menurank'); if (el) el.innerHTML = `<div class="note">${tr('El ranking no está disponible ahora mismo.')} <button class="linkbtn" id="mrretry">${tr('Reintentar')}</button></div>`; document.getElementById('mrretry')?.addEventListener('click', () => void this.fillMenuRank()); }
  }

  /**
   * Sala de jugadores: everyone on the points ranking (one row per player, their best mark; 2.2: all of them, no longer only the top 100) walking about as
   * the captain of that mark; the own captain is the current one and is walked by hand. Pointer over someone (or, on a
   * touch screen, walking up to them) shows their card: captain's mugshot, name and ranking.
   */
  private async lobbyScreen() {
    this.stopScenes();
    setMusicContext('menu');
    const myCap = this.byId.get(this.save.captainId ?? -1) ?? squadOf(this.save, this.byId)[0] ?? this.unlockedRoster()[0] ?? null;
    this.show(`<div class="lobby" id="lobby">${this.titlebar(tr('Sala de jugadores'), 'Menú')}
      <div class="lb-info" id="lbinfo">${uiIcon('team')}<span>${tr('Cargando jugadores…')}</span></div><div class="lb-card" id="lbcard" hidden></div><div class="joy" id="joy"><b><i></i></b></div></div>`, 'lobby-mode');
    const key = this.screenKey;
    this.on('[data-back]', 'click', () => this.mainMenu());
    bindStick(document.getElementById('joy')!);
    type Row = { name: string; captain: RosterEntry; pos: number | null; rank: string | null; pts: number | null; me: boolean; kit?: string; friend?: boolean };
    const rows = new Map<string, Row>();
    let note = '';
    const pts = (r: BoardRow) => r.score == null ? scoreOf({ map: r.map, rank: r.rank, time: r.time_sec, damage: Number(r.damage) }) : Number(r.score);
    let mine: BoardRow | null = null;
    if (onlineConfigured()) {
      try {
        const q: BoardQuery = { map: null, rank: null, order: 'score' };
        const [top, me] = await Promise.all([leaderboard(q, 1000), signedIn() ? myPosition(q).catch(() => null) : Promise.resolve(null)]);
        mine = me;
        for (const r of top) {
          const cap = this.byId.get(r.captain_id);
          if (cap && !(mine && r.username.toLowerCase() === mine.username.toLowerCase())) rows.set(`u:${r.username.toLowerCase()}`, { name: r.username, captain: cap, pos: Number(r.pos), rank: r.rank, pts: pts(r), me: false });
        }
        note = tr('{x1} jugadores en la sala', { x1: rows.size + (myCap ? 1 : 0) });
        // 2.3 (author): kit, side, clan, banner and frame of everyone in one call, and who are one's friends
        const names = [...rows.values()].map((r) => r.name);
        const [info, friends] = await Promise.all([
          lobbyInfo(names).catch(() => [] as LobbyInfo[]),
          signedIn() ? friendList().catch(() => [] as FriendRow[]) : Promise.resolve([] as FriendRow[]),
        ]);
        const pals = new Set(friends.filter((f) => f.status === 'amigo').map((f) => f.username.toLowerCase()));
        for (const i of info) {
          const n = i.username.toLowerCase(), r = rows.get(`u:${n}`);
          if (r) r.kit = i.kit;
          this.flagCache.delete(n); this.frameCache.delete(n); this.clanCache.delete(n); this.sideCache.delete(n);
          if (i.banner && PENNANT_BY_ID.has(i.banner)) this.flagCache.set(n, i.banner);
          if (i.frame && isFrame(PENNANT_BY_ID.get(i.frame))) this.frameCache.set(n, i.frame);
          if (i.clan) this.clanCache.set(n, { name: i.clan, crest: i.crest ?? '' });
          if (i.side && i.side in SIDES) this.sideCache.set(n, i.side as SideId);
        }
        for (const [k, r] of rows) if (pals.has(k.slice(2))) r.friend = true;
      } catch { note = tr('El ranking no responde ahora: solo estás tú en la sala.'); }
    } else note = tr('El servicio online no está activado en esta versión: solo estás tú en la sala.');
    if (this.screenKey !== key) return; // left while the players were loading
    if (myCap) rows.set('me', { name: mine?.username ?? this.save.onlineName ?? this.save.profile.name, captain: myCap, pos: mine ? Number(mine.pos) : null, rank: mine?.rank ?? null, pts: mine ? pts(mine) : null, me: true, kit: this.save.kit });
    const touch = document.body.classList.contains('touch');
    const info = document.getElementById('lbinfo');
    if (info) info.innerHTML = `${uiIcon('team')}<span>${esc(note)}<small>${touch ? tr('Muévete con el joystick y acércate a alguien para ver su ficha; tócala para abrir su perfil.') : tr('Muévete con WASD o flechas y pasa el ratón por encima de alguien para ver su ficha; haz clic para abrir su perfil.')}</small></span>
      <span class="lb-legend"><i class="t1">♛</i>${tr('Top 3')} <i class="fr">♥</i>${tr('Amigos')}</span>`;
    const card = document.getElementById('lbcard')!;
    const zoom = parseFloat(getComputedStyle(this.root).zoom) || 1;
    let shown: string | null = null;
    const onFocus: LobbyInit['onFocus'] = (k, x, y, feet) => {
      const r = k ? rows.get(k) : undefined;
      if (!r) { if (shown !== null) { card.hidden = true; shown = null; } return; }
      if (shown !== k) {
        shown = k;
        const c = r.captain, rar = r.me ? effectiveRarity(this.save, c) : c.rarity; // the others' ascensions are not public
        card.style.setProperty('--rc', RARITY_COLOR[rar]);
        // 2.3: the same look as the profile and the ranking (banner, frame, clan, side), plus friend and podium tags
        const kitName = r.kit && this.m.kits?.[r.kit] ? teamLabel(r.kit) : '';
        const tags = `${r.me ? `<em>${tr('TÚ')}</em>` : ''}${r.friend ? `<em class="fr">${tr('♥ AMIGO')}</em>` : ''}${r.pos !== null && r.pos <= 3 ? `<em class="top t${r.pos}">♛ TOP ${r.pos}</em>` : ''}`;
        card.innerHTML = `<span class="lb-mug r-${rar}">${this.framed(this.mug(c.id, 64), this.frameOf(r.name), true)}</span><div class="lb-txt">${this.namePlate('lb-name', r.name)}
          ${tags ? `<span class="lb-tags">${tags}</span>` : ''}<small>${tr('Capitán: {cName}', { cName: esc(c.name) })}${kitName ? ` · ${tr('Equipación: {x1}', { x1: esc(kitName) })}` : ''}</small>
          ${this.clanBadge(r.name) || this.sideBadge(r.name) ? `<span class="lb-badges">${this.clanBadge(r.name)}${this.sideBadge(r.name)}</span>` : ''}
          ${r.pos !== null && r.rank ? `<span class="lb-rank"><span class="lb-pos">#${r.pos}</span><span class="rank-btn r-${r.rank}">${rankMark(r.rank)}</span><span class="lb-pts"><b>${r.pts!.toLocaleString(locale())}</b> ${tr('pts')}</span></span>` : `<span class="lb-rank none">${tr('Sin marca en el ranking')}</span>`}
          ${r.me ? '' : `<span class="lb-open">${touch ? tr('Toca para ver su perfil') : tr('Clic para ver su perfil')}</span>`}</div>`;
        card.dataset.user = r.me ? '' : r.name;
        card.hidden = false;
      }
      // over the head; under the feet when the bar would cover it, and never past the sides of the screen
      const cx = x / zoom, cy = y / zoom, w = card.offsetWidth, h = card.offsetHeight, vw = this.root.clientWidth;
      const top = (document.querySelector('#lobby .titlebar')?.getBoundingClientRect().bottom ?? 0) / zoom + 6;
      const below = cy - h - 8 < top, left = Math.min(Math.max(cx - w / 2, 6), Math.max(6, vw - w - 6));
      card.classList.toggle('below', below);
      card.style.setProperty('--ax', `${Math.round(cx - left)}px`);
      card.style.transform = `translate(${Math.round(left)}px, ${Math.round(below ? feet / zoom + 8 : cy - h)}px)`;
    };
    // 2.3: on touch screens the card itself opens the profile; with a mouse, a click on the player (onPick)
    card.classList.toggle('tap', touch);
    card.addEventListener('click', () => { if (card.dataset.user) void this.otherProfile(card.dataset.user); });
    const icons = (r: Row) => {
      const c = this.clanBadge(r.name) ? (r.me && this.save.clanSeen ? this.save.clanSeen.crest : this.clanCache.get(r.name.toLowerCase())?.crest) : '';
      const sideId = r.me && signedIn() ? sectorOf(this.save).side : this.sideCache.get(r.name.toLowerCase());
      return [c ? this.emblemOf(c) : '', sideId ? this.m.sector?.[sideId] ?? '' : ''].filter(Boolean);
    };
    const players: LobbyPlayer[] = [...rows].map(([k, r]) => ({ key: k, name: r.name, captain: r.captain, me: r.me, kit: r.kit ? this.m.kits?.[r.kit] ?? null : null,
      friend: r.friend, top: r.pos !== null && r.pos <= 3 ? r.pos : undefined, icons: icons(r),
      clanmate: !r.me && !!this.save.clanSeen && this.clanCache.get(r.name.toLowerCase())?.name === this.save.clanSeen.name }));
    const onPick = (k: string) => { const r = rows.get(k); if (r && !r.me) void this.otherProfile(r.name); };
    const init: LobbyInit = { manifest: this.m, players, kit: this.m.kits?.[this.save.kit] ?? null, moveKeys: this.save.settings.moveKeys, touch, onFocus, onPick };
    this.game.scene.start('Lobby', init);
  }

  /** Fix 1.12: the weekly pass in the main menu, the seven days at a glance (days 1, 4 and 7 stand out). */
  /** 2.0: the art of a pass reward — the IE3 capsule machine's own pieces (blue capsule = ×10 pull, gold coin, gold capsule =
   *  footballer) and, on day 7, the crest of the chosen team */
  private passArt(i: number, cls = '') {
    const r = PASS[i];
    const team = r.jugador?.team ? this.emblemOf(this.passTeam || this.save.favoriteTeam || '') : '';
    const src = team || (r.kind === 'fichas' ? this.cap('cap_azul_spin0') : r.kind === 'monedas' ? this.cap('coin_oro') : this.cap('cap_amarillo_spin0'));
    return src ? `<img class="wp2-art ${cls}${team ? ' crest' : ''}" src="${src}" alt="">` : `<span class="wp2-art ${cls}">${r.kind === 'monedas' ? '◉' : '★'}</span>`;
  }
  /** 2.0: everything a day gives, as chips (fichas, coins, the footballer) */
  private passItems(r: PassReward) {
    return `<span class="wp3-items">${r.jugador ? `<i class="wp3-it pl">★ ${esc(r.jugador.label)}</i>` : ''}${r.fichas ? `<i class="wp3-it tk">${tr('{x1}+{fichas} fichas', { x1: this.cap('cap_azul_spin0') ? `<img src="${this.cap('cap_azul_spin0')}" alt="">` : '', fichas: r.fichas })}</i>` : ''}${r.monedas ? `<i class="wp3-it cn">◉ +${r.monedas.toLocaleString(locale())}</i>` : ''}</span>`;
  }
  /** 2.0: the odds of a footballer reward, as a bar of rarity colours with its legend */
  private passOdds(r: PassReward) {
    if (!r.jugador) return '';
    const parts = RARITY_ORDER.filter((x) => (r.jugador!.odds[x] ?? 0) > 0);
    return `<span class="wp3-odds" title="${parts.map((x) => `${RARITY_LABEL[x]} ${r.jugador!.odds[x]}%`).join(' · ')}"><span class="wp3-bar">${parts.map((x) => `<i style="flex:${r.jugador!.odds[x]};--rc:${RARITY_COLOR[x]}"></i>`).join('')}</span>
      <small>${parts.map((x) => `<b style="color:${RARITY_COLOR[x]}">${RARITY_LABEL[x].slice(0, 3)}</b> ${r.jugador!.odds[x]}%`).join(' · ')}</small></span>`;
  }
  private passCount(left: number) { return `${Math.floor(left / 3600000)} h ${String(Math.floor(left / 60000) % 60).padStart(2, '0')} min`; }

  private passWidget() {
    const now = serverNow(), st = passStatus(this.save, now), left = msToNextDay(now);
    const days = PASS.map((r, i) => {
      const state = i < st.index ? 'reclamado' : i === st.index ? (st.available ? 'disponible' : 'siguiente') : 'bloqueado';
      return `<div class="wp2-mini ${state}${i === PASS.length - 1 ? ' grand' : ''}" title="${tr('Día {x1}: {label}', { x1: i + 1, label: esc(r.label) })}"><small>${i + 1}</small>${this.passArt(i)}${state === 'reclamado' ? '<i class="wp2-ok">✔</i>' : ''}</div>`;
    }).join('<i class="wp2-link"></i>');
    return `<div class="wide-head"><h3>${tr('✦ Pase semanal')}</h3><small>${st.available ? tr('¡Tienes una recompensa lista!') : tr('Siguiente en {passCount}', { passCount: this.passCount(left) })}</small></div>
      <div class="wp2-strip" style="--p:${st.index / (PASS.length - 1)}">${days}</div>
      <div class="wp-foot"><span>${tr('Día {x1} de {PASSLength} · {x2}', { x1: st.index + 1, PASSLength: PASS.length, x2: esc(PASS[st.index].label) })}</span>${st.available ? '<button class="btn" id="wpclaim">Reclamar</button>' : '<button class="btn small" data-go="pass">Ver pase</button>'}</div>`;
  }

  /** Claims today's pass reward (team reward: the favourite team, or the one chosen on the pass screen). */
  private claimPassNow(after: () => void) {
    // Fix 1.23: a new day of the pass needs the server's clock (a different date on the device paid it again)
    if (!trustedClock()) { void syncServerTime(); sfx('error'); this.toast(tr('Necesitas conexión para reclamar el pase (hora del servidor).')); after(); return; }
    const res = claimPass(this.save, this.m.roster, serverNow(), Math.random, bannerPool(this.m.roster, 'equipo', this.passTeam || this.save.favoriteTeam || ''));
    if (!res) { sfx('error'); after(); return; }
    this.persist();
    sfx('legend');
    if (res.player) void this.capsuleShow([{ player: res.player, isNew: this.save.owned[String(res.player.id)]?.copies === 1, stars: this.save.owned[String(res.player.id)]?.stars ?? 0, refund: 0 }], tr('Pase semanal')).then(after);
    else { this.toast(`¡${res.reward.label}!`); after(); }
  }

  /** Online account box (profile screen). Without a configured service it only says so: nothing pretends to be online. */
  private accountPanel() {
    if (!onlineConfigured()) {
      return `<div class="panel"><h3>${tr('Cuenta online')}</h3><div class="note">${tr('El servicio online no está activado en esta versión. Tu progreso se guarda en este navegador (Ajustes » Exportar/Importar para llevarlo a otro). Con el servicio activo podrás entrar con Google, reservar tu nombre en todo el mundo, aparecer en el ranking global y guardar en la nube.')}</div></div>`;
    }
    if (!signedIn()) {
      return `<div class="panel account"><h3>${tr('Cuenta online')}</h3><div class="note">${tr('Estás jugando como invitado: tu progreso se guarda solo en este navegador. Entra con Google para reservar tu nombre en todo el mundo, aparecer en el ranking y guardar en la nube. Tu correo es privado: nunca aparece en el ranking.')}</div>
        <p><button class="btn google-btn" id="acgoogle"><span class="g-logo">G</span> ${tr('Continuar con Google')}</button></p>
        <p class="note"><a href="privacidad.html" target="_blank" rel="noopener">${tr('Privacidad y condiciones')}</a></p></div>`;
    }
    const cs = this.cloudState;
    return `<div class="panel account"><h3>${tr('Cuenta online')}</h3><div class="note">${tr('Conectado con Google{x1} (solo tú lo ves).', { x1: signedEmail() ? ` como ${esc(signedEmail())}` : '' })}</div>
      ${this.save.onlineName ? `<p>${tr('Nombre global: <b>{onlineName}</b> (permanente)', { onlineName: esc(this.save.onlineName) })}</p>` : `<p class="note">${tr('Reserva tu nombre global. Si «{profileName}» ya está ocupado, elige otro: tu progreso no se toca.', { profileName: esc(this.save.profile.name) })}</p>
        <div class="filters"><input id="acname" maxlength="${USERNAME_MAX}" value="${esc(this.save.profile.name)}"><span id="acnamecheck" class="pcheck"></span><button class="btn small" id="acreserve">${tr('Reservar nombre')}</button></div>`}
      <p class="note">${tr('Nube: {x1}', { x1: cs.status === 'ok' ? tr('sincronizado (versión {x1}{x2})', { x1: this.save.cloudVersion ?? 0, x2: cs.at ? `, ${new Date(cs.at).toLocaleTimeString(locale())}` : '' }) : cs.status === 'pendiente' ? tr('cambios pendientes de subir…') : cs.status === 'conflicto' ? `<b>${tr('conflicto')}</b>${tr(': otro dispositivo guardó una versión más nueva')}` : cs.status === 'error' ? `error (${esc(cs.msg)})` : tr('sin vincular todavía') })}</p>
      <p><button class="btn small" id="aclink">${tr('Revisar guardado en la nube')}</button> <button class="btn small blue" id="acout">${tr('Cerrar sesión')}</button> <button class="btn small" id="acdel">${tr('Eliminar cuenta y datos')}</button></p>
      <p class="note"><a href="privacidad.html" target="_blank" rel="noopener">${tr('Privacidad y condiciones')}</a></p></div>`;
  }

  private bindAccount(refresh: () => void) {
    const val = (id: string) => (document.getElementById(id) as HTMLInputElement | null)?.value.trim() ?? '';
    const fail = (e: Error) => this.toast(e.message, 4000);
    document.getElementById('acgoogle')?.addEventListener('click', () => { void signInWithGoogle(); });
    const nameInput = document.getElementById('acname') as HTMLInputElement | null;
    if (nameInput) this.liveNameCheck(nameInput, document.getElementById('acnamecheck')!);
    document.getElementById('acreserve')?.addEventListener('click', () => {
      const v = validateUsername(val('acname'));
      if (!v.ok) { this.toast(v.reason); return; }
      reserveUsername(v.name, String(this.save.profile.icon.id), this.save.crest)
        .then(async (n) => { this.save.onlineName = n; this.claimName(); storeSave(this.save); await this.linkCloud(); this.toast(tr('Nombre reservado. Tu progreso ya está en la nube.'), 3500); refresh(); })
        .catch((e: Error) => this.toast(/taken/.test(e.message) ? tr('Ese nombre ya está ocupado: prueba otro') : e.message, 3500));
    });
    document.getElementById('aclink')?.addEventListener('click', () => { void this.linkCloud(true).then(refresh); });
    document.getElementById('acout')?.addEventListener('click', () => {
      void this.pushCloud(true).finally(() => { signOut(); this.cloudLinked = false; this.cloudState = { status: 'nada', at: 0, msg: '' }; this.toast(tr('Sesión cerrada. Sigues jugando como invitado en este navegador.'), 3500); refresh(); });
    });
    const del = document.getElementById('acdel');
    del?.addEventListener('click', () => this.armed(del, () => {
      deleteAccount().then(() => { this.save.onlineName = undefined; this.save.cloudVersion = undefined; this.cloudLinked = false; this.persist(); this.toast(tr('Cuenta y datos online eliminados. Tu guardado local sigue aquí.'), 4500); refresh(); }).catch(fail);
    }));
  }

  private eventKey = '';
  private eventTimer = 0;
  /** arena and rank of the run being played, for bug reports */
  private runInfo: { map: string; difficulty: string } | null = null;

  // ---- «Reiniciar progreso»: start again as a new player, keeping the Google account and the global name
  private resetProgressModal() {
    if (document.querySelector('.reset-modal')) return;
    const online = onlineConfigured() && signedIn() && !!this.save.onlineName;
    const word = online ? this.save.onlineName! : tr('REINICIAR');
    const r = resetSummary(this.save);
    const box = document.createElement('div');
    box.className = 'tut-modal reset-modal';
    box.innerHTML = `<div class="panel" style="max-width:640px"><h2>${tr('Reiniciar progreso')}</h2>
      <p>${tr('Vuelves a empezar como un jugador nuevo: intro, equipo favorito, tus 5 primeros fichajes y tutorial.')}</p>
      <h4>${tr('Se borra')}</h4><ul class="reset-list">
        <li>${tr('Colección: {players} futbolistas, {duplicates} duplicados, {ascended} ascendidos (Mítico/Héroe)', { players: r.players, duplicates: r.duplicates, ascended: r.ascended })}</li>
        <li>${tr('{coins} monedas y {tokens} fichas', { coins: r.coins, tokens: r.tokens })}</li>
        <li>${tr('Mejoras permanentes ({upgrades} niveles), {gear} objetos de equipo, técnicas compradas y maestría', { upgrades: r.upgrades, gear: r.gear })}</li>
        <li>${tr('Equipaciones y escudos desbloqueados ({kits} equipaciones) y recompensas de equipo', { kits: r.kits })}</li>
        <li>${tr('Misiones ({missionsClaimed} cobradas) y tienda del día', { missionsClaimed: r.missionsClaimed })}</li>
        <li>${tr('Estadísticas ({runs} partidas, {wins} victorias), {bests} récords, salón de la fama ({hall}) y arenas superadas', { runs: r.runs, wins: r.wins, bests: r.bests, hall: r.hall })}</li>
        <li>${tr('Equipo favorito, Mi Equipo, capitán y onboarding')}</li>
        ${online ? `<li>${tr('Tus marcas del ranking mundial (las de los demás no se tocan)')}</li>` : ''}
      </ul>
      <h4>${tr('Se conserva')}</h4><ul class="reset-list keep">
        ${online ? `<li>${tr('Tu cuenta de Google y tu nombre global <b>{word}</b> (sigue siendo tuyo)', { word: esc(word) })}</li>` : `<li>${tr('Nada de cuenta online (juegas como invitado): el nombre lo eliges otra vez, con el actual como sugerencia')}</li>`}
        <li>${tr('Ajustes de sonido, gráficos y controles')}</li>
      </ul>
      <p class="note">${tr('Antes de borrar se guarda una copia{x1} en este navegador, por si hubiera que recuperarla. {x2}', { x1: online ? tr(' en el servidor y otra') : '', x2: online ? tr('Los demás dispositivos con tu cuenta también empezarán de cero al conectarse: su copia antigua no puede sobrescribir la nueva.') : '' })}</p>
      <div class="filters"><input id="rs-word" autocomplete="off" spellcheck="false" placeholder="${tr('Escribe {word} para confirmar', { word: esc(word) })}"></div>
      <div class="tut-nav"><button class="btn small blue" id="rs-no">${tr('Cancelar')}</button><span class="spacer"></span><button class="btn" id="rs-ok" disabled>${tr('Reiniciar mi progreso')}</button></div></div>`;
    document.body.appendChild(box);
    const input = box.querySelector('#rs-word') as HTMLInputElement, ok = box.querySelector('#rs-ok') as HTMLButtonElement;
    input.addEventListener('input', () => { ok.disabled = input.value.trim() !== word; });
    box.querySelector('#rs-no')!.addEventListener('click', () => box.remove());
    ok.addEventListener('click', () => {
      ok.disabled = true;
      this.resetProgress(online).then(() => box.remove()).catch((e: Error) => { ok.disabled = false; this.toast(tr('No se pudo reiniciar: {message}', { message: e.message }), 5000); });
    });
  }

  /** Backup first, then the server (online) or this browser only (guest); nothing local changes if the server says no. */
  private async resetProgress(online: boolean) {
    window.clearTimeout(this.cloudTimer); // a pending upload of the old progress must not go out
    const fresh = freshProgress(this.save);
    if (online) {
      const r = await resetMyProgress(fresh);
      fresh.progressEpoch = r.epoch;
      fresh.cloudVersion = r.version;
    }
    backup('local', this.save);
    this.replaceSave(fresh);
    this.cloudLinked = online;
    this.cloudState = online ? { status: 'ok', at: Date.now(), msg: '' } : { status: 'nada', at: 0, msg: '' };
    this.toast(tr('Progreso reiniciado. ¡Bienvenido de nuevo, entrenador!'), 4000);
    void this.intro().then(() => this.afterIntro());
  }

  /** Swaps the whole save in place (other parts of the game hold this object) and stores it. */
  private replaceSave(next: SaveData) {
    for (const k of Object.keys(this.save)) delete (this.save as unknown as Record<string, unknown>)[k];
    Object.assign(this.save, next);
    this.captainId = this.save.captainId;
    setPreviewKit(this.m.kits?.[this.save.kit] ?? null);
    setLang(resolveLang(this.save.settings.lang)); // 2.3
    this.applyAudio();
    storeSave(this.save);
  }

  /** Another device reset the progress: this one drops its stale copy (kept as backup) and starts again too. */
  private reloadAfterReset(cloud: CloudSave) {
    this.adoptCloud(cloud, true, tr('Tu progreso se reinició desde otro dispositivo: empiezas de nuevo (la copia anterior queda como respaldo).'));
    if (!document.getElementById('hud')) this.afterIntro();
  }

  // ---- cloud save: link on sign-in, debounced push after every save, conflicts never overwrite silently
  private cloudState: { status: 'nada' | 'ok' | 'pendiente' | 'conflicto' | 'error'; at: number; msg: string } = { status: 'nada', at: 0, msg: '' };
  private cloudTimer = 0;
  private cloudLinked = false;

  /**
   * First sign-in on this device (or «Revisar guardado»): compare the local and the cloud copies and let the player choose.
   * Whatever is replaced is kept as a recoverable backup in this browser first.
   */
  private async linkCloud(ask = false) {
    if (!onlineConfigured() || !signedIn() || !this.save.onlineName) return; // no cloud copy before the name exists
    try {
      const cloud = await getCloudSave();
      if (cloud && epochOf(cloud.data) > epochOf(this.save)) { this.reloadAfterReset(cloud); return; }
      const local = summarize(this.save), remote = cloud ? summarize(cloud.data as SaveData) : null;
      const plan = linkPlan(local, remote);
      if (plan === 'subir-local' || (plan === 'nada' && !cloud)) { this.cloudLinked = true; this.save.cloudVersion = 0; await this.pushCloud(true); return; }
      if (plan === 'bajar-nube' && cloud) { this.adoptCloud(cloud); return; }
      if (cloud && (ask || this.save.cloudVersion !== cloud.version)) {
        const choice = await this.chooseSave(local, remote!, cloud.updated_at);
        if (choice === 'nube') this.adoptCloud(cloud);
        else if (choice === 'local') { backup('nube', cloud.data); this.cloudLinked = true; this.save.cloudVersion = cloud.version; await this.pushCloud(true); }
        return;
      }
      this.cloudLinked = true;
      this.cloudState = { status: 'ok', at: Date.now(), msg: '' };
    } catch (e) { this.cloudState = { status: 'error', at: Date.now(), msg: (e as Error).message }; }
  }

  /** `hadLocal`: this browser had progress of its own (kept as a backup); false on a fresh device. */
  private adoptCloud(cloud: CloudSave, hadLocal = true, note = '') {
    if (hadLocal) backup('local', this.save);
    const next = importSave(JSON.stringify(cloud.data));
    const name = this.save.onlineName ?? next.onlineName; // the account's name, whatever the copy says
    for (const k of Object.keys(this.save)) delete (this.save as unknown as Record<string, unknown>)[k];
    Object.assign(this.save, next, { cloudVersion: cloud.version, onlineName: name });
    setLang(resolveLang(this.save.settings.lang)); // 2.3
    remapIds(this.save, this.m.idAliases);
    remapTechSlots(this.save, this.m.techRemaps);
    migrateHeroes131(this.save, this.m.roster);
    migrateChampions18(this.save, this.m.roster);
    restoreHeroStars188(this.save, this.m.roster); // 1.88
    resetStars185(this.save, this.m.roster); // 1.85
    compensateDrakul153(this.save);
    creatorGiftINA483(this.save); // 2.3
    this.jadenNotice(compensateJaden202(this.save, this.byId.get(JADEN_ID)) + compensateJaden3(this.save, this.byId.get(JADEN_ID))); // 2.02, 2.3
    if (this.save.auras) sanitizeAuras(this.save, this.byId); // v1.5
    this.trimAllTraining(this.save, this.m.roster);
    this.captainId = this.save.captainId;
    this.cloudLinked = true;
    this.cloudState = { status: 'ok', at: Date.now(), msg: '' };
    this.claimName();
    storeSave(this.save);
    this.toast(note || (hadLocal ? tr('Progreso de la nube cargado (tu copia local anterior se guardó como respaldo).') : tr('Progreso recuperado de la nube.')), 4500);
  }

  private chooseSave(local: SaveSummary, cloud: SaveSummary, at: string): Promise<'local' | 'nube' | 'cancelar'> {
    return new Promise((resolve) => {
      const row = (t: string, s: SaveSummary, best: boolean) => `<div class="save-pick${best ? ' best' : ''}"><b>${t}</b><span>${esc(s.name)}</span>
        <small>${tr('{players} futbolistas · {heroes} héroes · {wins} victorias · {runs} partidas · {coins} monedas · {tokens} fichas', { players: s.players, heroes: s.heroes, wins: s.wins, runs: s.runs, coins: s.coins, tokens: s.tokens })}</small></div>`;
      const box = document.createElement('div');
      box.className = 'tut-modal';
      box.innerHTML = `<div class="panel" style="max-width:620px"><h2>${tr('¿Qué progreso quieres usar?')}</h2>
        <p class="note">${tr('Hay un guardado en la nube ({x1}) distinto del de este navegador. El que no elijas se guarda como respaldo aquí; nada se pierde.', { x1: new Date(at).toLocaleString(locale()) })}</p>
        ${row(tr('Este navegador'), local, progressOf(local) >= progressOf(cloud))}${row('Nube', cloud, progressOf(cloud) > progressOf(local))}
        <div class="tut-nav"><button class="btn small blue" data-c="cancelar">${tr('Ahora no')}</button><span class="spacer"></span><button class="btn" data-c="local">${tr('Usar este navegador')}</button><button class="btn" data-c="nube">${tr('Usar la nube')}</button></div></div>`;
      document.body.appendChild(box);
      box.querySelectorAll<HTMLElement>('[data-c]').forEach((b) => b.addEventListener('click', () => { box.remove(); resolve(b.dataset.c as 'local' | 'nube' | 'cancelar'); }));
    });
  }

  private cloudBusy = false;
  private cloudAgain = false;
  /** Uploads the save on top of the version it was based on. A newer copy elsewhere stops it: conflict, not overwrite. */
  private async pushCloud(now = false) {
    if (!onlineConfigured() || !signedIn() || !this.cloudLinked) return;
    window.clearTimeout(this.cloudTimer);
    const go = async () => {
      // Fix 1.32: never two uploads at once (they queued on the same row and wedged the database); what changes during
      // an upload goes in the next one
      if (this.cloudBusy) { this.cloudAgain = true; return; }
      this.cloudBusy = true;
      try {
        const v = await putCloudSave(this.save, this.save.cloudVersion ?? 0);
        this.save.cloudVersion = v;
        storeSave(this.save);
        this.cloudState = { status: 'ok', at: Date.now(), msg: '' };
      } catch (e) {
        const m = (e as Error).message;
        if (/progress_reset/.test(m)) { const cloud = await getCloudSave(); if (cloud) this.reloadAfterReset(cloud); }
        else if (/version_conflict/.test(m)) { this.cloudState = { status: 'conflicto', at: Date.now(), msg: m }; this.cloudLinked = false; this.toast(tr('Otro dispositivo guardó un progreso más nuevo. Revisa Perfil » Vincular.'), 5000); }
        else if (/too_fast/.test(m)) this.cloudTimer = window.setTimeout(() => void go(), 3000);
        else { this.cloudState = { status: 'error', at: Date.now(), msg: m }; this.cloudTimer = window.setTimeout(() => void go(), 30000); } // retry calmly
      } finally {
        this.cloudBusy = false;
        if (this.cloudAgain) { this.cloudAgain = false; this.cloudTimer = window.setTimeout(() => void go(), 2500); }
      }
    };
    if (now) await go();
    else { this.cloudState = { ...this.cloudState, status: 'pendiente' }; this.cloudTimer = window.setTimeout(() => void go(), 5000); }
  }

  // ------------------------------------------------------------- news board (Fix 1.32)
  private newsSel = '';
  /** Noticias: every news item on the left (tag, pinned, date, unread dot), the chosen one in full on the right. */
  devlog(sel?: string) {
    setMusicContext('menu');
    const items = allNews(onlineConfigured(), serverNow());
    // first visit to the board: the old updates count as read, only the news of this version shows as new
    if (!this.save.newsRead) this.save.newsRead = items.filter((n) => n.version && n.version !== PUBLIC_VERSION).map((n) => n.id);
    this.save.devlogSeen = newsKey();
    const cur = items.find((n) => n.id === (sel ?? this.newsSel)) ?? items[0];
    this.newsSel = cur?.id ?? '';
    if (cur && !this.save.newsRead.includes(cur.id)) this.save.newsRead = [...this.save.newsRead, cur.id].slice(-200);
    this.persist();
    const listTop = this.root.querySelector('.nb-list')?.scrollTop ?? 0;
    const list = items.map((n) => `<button class="nb-item k-${n.kind}${n.id === cur?.id ? ' on' : ''}" data-news="${esc(n.id)}">
        <span class="nb-ic">${this.newsLogo(n)}</span><span class="nb-txt"><span class="nb-meta"><em class="nb-tag">${NEWS_KIND_LABEL[n.kind]}</em>${n.pinned ? '<i class="nb-pin">📌</i>' : ''}<small>${esc(newsRelDate(n.date))}</small>${this.save.newsRead!.includes(n.id) ? '' : `<i class="nb-dot" title="${tr('Sin leer')}"></i>`}</span>
        <b>${esc(n.title)}</b><small class="nb-sum">${esc(n.summary)}</small></span></button>`).join('');
    this.show(`<div class="screen news-board">${this.titlebar(tr('Noticias'), tr('Menú'))}
      <div class="nb-mast"><svg class="nb-mast-bolt" viewBox="0 0 60 100"><polygon points="38,0 6,56 26,56 16,100 56,38 34,38"/></svg><div><b>${tr('LA GACETA {x1}', { x1: '<span>INAZURVIVORS</span>' })}</b>
        <small>${tr('Noticias, avisos y todas las actualizaciones · {VERSION_LABEL}', { VERSION_LABEL: esc(VERSION_LABEL) })}</small></div><span class="nb-mast-n">${items.filter((x) => !this.save.newsRead!.includes(x.id)).length || '✔'}<small>${items.some((x) => !this.save.newsRead!.includes(x.id)) ? tr('sin leer') : tr('al día')}</small></span></div>
      <div class="nb"><aside class="nb-list">${list}</aside><article class="nb-detail" id="nbdetail">${cur?.id === 'version-2-0-espiritus' ? `<p class="nb-replay"><button class="btn big" id="newsl2">${tr('▶ Ver la presentación de la 2.0')}</button></p>` : ''}${cur ? this.newsDetail(cur) : ''}</article></div></div>`);
    const listEl = this.root.querySelector('.nb-list');
    if (listEl) listEl.scrollTop = listTop; // choosing an item keeps the list where it was
    this.on('[data-back]', 'click', () => this.mainMenu());
    this.on('[data-news]', 'click', (_e, el) => { this.devlog(el.dataset.news); document.getElementById('nbdetail')?.scrollTo(0, 0); if (window.innerWidth < 760) document.getElementById('nbdetail')?.scrollIntoView({ behavior: 'smooth' }); });
    document.getElementById('newsplay')?.addEventListener('click', () => { this.mainMenu(); (this.root.querySelector('[data-go="play"]') as HTMLElement | null)?.click(); });
    document.getElementById('newsbug')?.addEventListener('click', () => this.bugReportModal());
    document.getElementById('newsl2')?.addEventListener('click', () => this.launch20()); // (author) the 2.0 intro, again
  }

  /**
   * v1.4: the logo of a news item, an original crest per kind: updates carry the InaZurvivors bolt and their version,
   * news a newspaper, notices an exclamation mark and events a star.
   */
  private newsLogo(n: NewsItem) {
    const C: Record<string, [string, string]> = { actualizacion: ['#2fbf62', '#0a4a22'], fix: ['#ff9a2a', '#6a2a00'], novedad: ['#3a7bff', '#0a2a6a'], aviso: ['#e8484e', '#5a0a10'], evento: ['#b36bff', '#3a0a6a'] };
    const [c1, c2] = C[n.kind] ?? C.novedad;
    const inner = n.kind === 'fix' ? '<path d="M39 14a9 9 0 0 0-11 11L16 37a4 4 0 0 0 6 6l12-12a9 9 0 0 0 11-11l-6 6-5-1-1-5z" fill="#fff" stroke="#5a2a00" stroke-width="1.5"/>'
      : n.kind === 'actualizacion' ? '<polygon points="29,8 15,33 24,33 19,52 37,26 28,26" fill="#ffe24a" stroke="#5a3a00" stroke-width="1.5"/>'
      : n.kind === 'aviso' ? '<rect x="27" y="12" width="6" height="24" rx="3" fill="#fff"/><circle cx="30" cy="44" r="4" fill="#fff"/>'
      : n.kind === 'evento' ? '<path d="m30 12 5 11 12 1-9 8 3 12-11-6-11 6 3-12-9-8 12-1z" fill="#ffe24a" stroke="#5a3a00" stroke-width="1.5"/>'
      : '<rect x="16" y="15" width="28" height="30" rx="2" fill="#fff"/><rect x="20" y="19" width="20" height="6" fill="#0a2a6a"/><rect x="20" y="29" width="20" height="2.5" fill="#7f95b5"/><rect x="20" y="34" width="20" height="2.5" fill="#7f95b5"/><rect x="20" y="39" width="13" height="2.5" fill="#7f95b5"/>';
    const ver = n.version ? `<text x="30" y="66" text-anchor="middle" font-size="10" fill="#fff" stroke="#000" stroke-width="2.5" paint-order="stroke" font-family="'Press Start 2P', monospace">${esc(n.version)}</text>` : '';
    return `<svg class="nb-logo" viewBox="0 0 60 ${n.version ? 70 : 60}" aria-hidden="true"><defs><linearGradient id="nbg-${n.kind}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs>
      <path d="M30 2 54 10v18c0 14-10 24-24 30C16 52 6 42 6 28V10z" fill="url(#nbg-${n.kind})" stroke="#fff" stroke-width="2.5"/><path d="M30 7 49 13v15c0 11-8 19-19 24" fill="none" stroke="#ffffff55" stroke-width="2"/>${inner}${ver}</svg>`;
  }

  private newsDetail(n: NewsItem) {
    const body = n.blocks.map((b) => {
      if ('h' in b) return `<h3 class="nb-h">${b.icon ? `<span>${esc(b.icon)}</span>` : ''}${newsText(b.h)}</h3>`;
      if ('p' in b) return `<p>${newsText(b.p)}</p>`;
      if ('list' in b) return `<ul class="nb-ul">${b.list.map((x) => `<li>${newsText(x)}</li>`).join('')}</ul>`;
      if ('callout' in b) return `<div class="nb-box ${b.callout}"><em>${b.callout === 'aviso' ? tr('AVISO') : b.callout === 'nuevo' ? tr('NUEVO') : tr('INFO')}</em><p>${newsText(b.text)}</p></div>`;
      return '<hr class="nb-hr">';
    }).join('');
    const long = new Date(`${n.date}T12:00:00`).toLocaleDateString(locale(), { day: 'numeric', month: 'long', year: 'numeric' });
    return `<header class="nb-hero k-${n.kind}"><span class="nb-ic big">${this.newsLogo(n)}</span><div>
        <div class="nb-meta"><em class="nb-tag">${NEWS_KIND_LABEL[n.kind]}</em>${n.pinned ? '<i class="nb-pin">📌 Fijada</i>' : ''}<small>${esc(long)}</small>${n.version ? `<small>· v${esc(n.version)}</small>` : ''}</div>
        <h2>${esc(n.title)}</h2><p>${esc(n.summary)}</p></div></header>
      <div class="nb-body">${body}</div>
      <footer class="nb-foot"><button class="btn" id="newsplay">${tr('▶ Jugar')}</button><button class="btn blue" id="newsbug">${tr('Reportar un bug')}</button>${this.tiktokLink(tr('Vídeos del desarrollo'))}</footer>`;
  }

  private tiktokLink(label = '') {
    return `<a class="tiktok${label ? ' wide' : ''}" href="${TIKTOK_URL}" target="_blank" rel="noopener noreferrer" title="${tr('Síguenos en TikTok')}" aria-label="${tr('Síguenos en TikTok')}"><svg viewBox="0 0 24 24" aria-hidden="true"><path class="tk-a" d="${TIKTOK_PATH}"/><path class="tk-b" d="${TIKTOK_PATH}"/><path d="${TIKTOK_PATH}"/></svg>${label ? `<span>${esc(label)}</span>` : ''}</a>`;
  }

  // ------------------------------------------------------------- bug reports
  /** Report form. Works over the pause menu too: the keyboard goes to the form while it is open. */
  private bugReportModal() {
    if (document.querySelector('.bug-modal')) return;
    const kb = this.game.input.keyboard;
    const hadCapture = kb?.preventDefault ?? false;
    if (kb) kb.preventDefault = false;
    const box = document.createElement('div');
    box.className = 'tut-modal bug-modal';
    document.body.appendChild(box);
    const close = () => { box.remove(); if (kb) kb.preventDefault = hadCapture; };
    const inRun = !!document.getElementById('hud');
    if (!onlineConfigured() || !signedIn()) {
      box.innerHTML = `<div class="panel bug-card"><h2>${tr('Reportar un bug')}</h2>
        <p class="note">${onlineConfigured() ? tr('Para enviar un reporte necesitas entrar con Google: así evitamos el spam y puedes seguir el estado de tus reportes.') : tr('El envío de reportes no está disponible en esta versión.')}${inRun && onlineConfigured() ? tr(' Termina la partida y entra desde Perfil.') : ''}</p>
        <div class="tut-nav"><button class="btn small blue" id="bgclose">${tr('Cerrar')}</button><span class="spacer"></span>${onlineConfigured() && !inRun ? `<button class="btn google-btn" id="bggoogle"><span class="g-logo">G</span> ${tr('Continuar con Google')}</button>` : ''}</div></div>`;
      box.querySelector('#bgclose')!.addEventListener('click', close);
      box.querySelector('#bggoogle')?.addEventListener('click', () => { void signInWithGoogle(); });
      return;
    }
    const clientId = crypto.randomUUID(); // one form, one report, however many times the button is pressed
    let shot: Blob | null = null, uploadedPath: string | null = null, shotUrlLocal = '';
    box.innerHTML = `<div class="panel bug-card"><h2>${tr('Reportar un bug')}</h2>
      <div class="bug-grid">
        <label>${tr('Categoría')}<select id="bgcat"><option value="">${tr('Elige…')}</option>${CATEGORIES.map(([k, t]) => `<option value="${k}">${t}</option>`).join('')}</select></label>
        <label>${tr('Gravedad')}<select id="bgsev"><option value="">${tr('Elige…')}</option>${SEVERITIES.map(([k, t]) => `<option value="${k}">${t}</option>`).join('')}</select></label>
      </div>
      <label>${tr('Título')}<input id="bgtitle" maxlength="120" autocomplete="off" placeholder="${tr('Resume el problema en una frase')}"></label>
      <label>${tr('¿Qué ha ocurrido?')}<textarea id="bgdesc" maxlength="4000" rows="4" placeholder="${tr('Qué esperabas y qué ha pasado')}"></textarea></label>
      <label>${tr('Pasos para reproducirlo (opcional)')}<textarea id="bgsteps" maxlength="4000" rows="2" placeholder="1. … 2. …"></textarea></label>
      <div class="bug-shot"><button class="btn small blue" id="bgfile">${tr('Adjuntar captura')}</button>${inRun ? `<button class="btn small blue" id="bgsnap">${tr('Usar la pantalla de la partida')}</button>` : ''}
        <input id="bgfileinput" type="file" accept="${SHOT_TYPES.join(',')}" hidden><span id="bgshotinfo" class="note">${tr('PNG, JPG o WebP. Se reduce a 2 MB como máximo.')}</span></div>
      <details class="bug-tech"><summary>${tr('Qué información técnica se envía')}</summary><ul>${TECH_FIELDS.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
        <p class="note">${tr('Nunca se envían tu correo, tu sesión ni tu partida guardada. Solo tú y el administrador podéis ver el reporte y su captura.')} <a href="privacidad.html" target="_blank" rel="noopener">${tr('Privacidad')}</a></p></details>
      <div id="bgerr" class="bug-err" role="alert"></div>
      <div class="tut-nav"><button class="btn small blue" id="bgclose">${tr('Cerrar')}</button><button class="btn small blue" id="bgmine">${tr('Mis reportes')}</button><button class="btn small blue" id="bgidea">${tr('💡 Recomendar algo')}</button><span class="spacer"></span><button class="btn" id="bgsend">${tr('Enviar reporte')}</button></div></div>`;
    const $ = <T extends HTMLElement>(id: string) => box.querySelector(`#${id}`) as T;
    const err = (t: string) => { $('bgerr').textContent = t; };
    $('bgidea')?.addEventListener('click', () => { close(); this.suggestionModal(); }); // 1.88
    const setShot = async (src: Blob | HTMLImageElement) => {
      try {
        shot = await shrinkShot(src);
        uploadedPath = null;
        if (shotUrlLocal) URL.revokeObjectURL(shotUrlLocal);
        shotUrlLocal = URL.createObjectURL(shot);
        $('bgshotinfo').innerHTML = `<img class="bug-thumb" src="${shotUrlLocal}" alt="${tr('Captura adjunta')}"> ${Math.ceil(shot.size / 1024)} KB`;
      } catch (e) { shot = null; err((e as Error).message); }
    };
    $('bgclose').addEventListener('click', close);
    $('bgmine').addEventListener('click', () => { close(); this.myBugsModal(); });
    const input = $<HTMLInputElement>('bgfileinput');
    $('bgfile').addEventListener('click', () => input.click());
    input.addEventListener('change', () => {
      const f = input.files?.[0];
      if (!f) return;
      const bad = validateShot(f);
      if (bad) { err(bad); return; }
      err('');
      void setShot(f);
    });
    box.querySelector('#bgsnap')?.addEventListener('click', () => {
      this.game.renderer.snapshot((img) => { void setShot(img as HTMLImageElement); });
    });
    $('bgsend').addEventListener('click', async () => {
      const val = (id: string) => $<HTMLInputElement>(id).value;
      const form = { category: val('bgcat'), severity: val('bgsev'), title: val('bgtitle'), description: val('bgdesc'), steps: val('bgsteps') };
      const bad = validateBug(form);
      if (bad) { err(bad); return; }
      const btn = $<HTMLButtonElement>('bgsend');
      btn.disabled = true; btn.textContent = 'Enviando…'; err('');
      try {
        if (shot && !uploadedPath) {
          const path = `${accountId()}/${clientId}.${shot.type === 'image/webp' ? 'webp' : 'jpg'}`;
          await uploadShot(path, shot);
          uploadedPath = path;
        }
        const run = inRun && this.runInfo ? { ...this.runInfo, runTimeSec: this.arena()?.elapsedSec ?? 0 } : null;
        const meta = buildMeta(PUBLIC_VERSION, BUILD, navigator.userAgent, { w: window.innerWidth, h: window.innerHeight, dpr: window.devicePixelRatio || 1 }, run);
        const code = await submitBugReport({ clientId, ...form, meta, screenshot: uploadedPath });
        void notifyBug(code);
        sfx('powerup');
        box.innerHTML = `<div class="panel bug-card bug-ok"><div class="bug-tick">✔</div><h2>${tr('¡Reporte enviado!')}</h2><p>${tr('Gracias por ayudar a mejorar InaZurvivors.')}</p>
          <p class="bug-code" id="bgcode">${esc(code)}</p><p class="note">${tr('Guarda este código. Puedes seguir su estado en «Mis reportes».')}</p>
          <div class="tut-nav"><button class="btn small blue" id="bgmine">${tr('Mis reportes')}</button><span class="spacer"></span><button class="btn" id="bgclose">${tr('Cerrar')}</button></div></div>`;
        $('bgclose').addEventListener('click', close);
        $('bgmine').addEventListener('click', () => { close(); this.myBugsModal(); });
      } catch (e) {
        const m = (e as Error).message;
        err(/too_fast/.test(m) ? tr('Acabas de enviar un reporte: espera un minuto antes del siguiente.') : /daily_limit/.test(m) ? tr('Has llegado al límite de 10 reportes al día. ¡Gracias! Vuelve mañana.')
          : /invalid_screenshot/.test(m) ? tr('La captura no se ha podido validar. Vuelve a adjuntarla.') : /Failed to fetch|NetworkError/i.test(m) ? tr('Sin conexión con el servidor. Tu texto sigue aquí: prueba otra vez.') : tr('No se pudo enviar: {m}', { m }));
        btn.disabled = false; btn.textContent = tr('Enviar reporte');
      }
    });
  }

  private async myBugsModal() {
    const box = document.createElement('div');
    box.className = 'tut-modal bug-modal';
    box.innerHTML = '<div class="panel bug-card"><h2>Mis reportes</h2><div id="mblist" class="note">Cargando…</div><div class="tut-nav"><button class="btn small blue" id="mbclose">Cerrar</button><span class="spacer"></span><button class="btn small" id="mbdel" hidden>Borrar mis reportes</button></div></div>';
    document.body.appendChild(box);
    box.querySelector('#mbclose')!.addEventListener('click', () => box.remove());
    const list = box.querySelector('#mblist') as HTMLElement;
    try {
      const rows = await myBugReports();
      list.innerHTML = rows.map((r) => `<div class="bug-row"><code>${esc(r.code)}</code><b>${esc(r.title)}</b><span class="bug-st st-${esc(r.status)}">${esc(STATUS_LABEL[r.status] ?? r.status)}</span><small>${new Date(r.created_at).toLocaleDateString(locale())}</small></div>`).join('') || tr('Todavía no has enviado ningún reporte.');
      const del = box.querySelector('#mbdel') as HTMLButtonElement;
      if (rows.length) del.hidden = false;
      del.addEventListener('click', () => this.armed(del, async () => {
        const paths = await deleteMyBugReports();
        await Promise.all(paths.filter((x): x is string => !!x).map((x) => deleteShot(x)));
        box.remove();
        this.toast(tr('Tus reportes y sus capturas se han borrado.'), 3500);
      }));
    } catch (e) { list.textContent = tr('No se pudieron cargar: {x1}', { x1: (e as Error).message }); }
  }

  /**
   * 1.88 (author): recommendations, next to the bug reports. A signed-in player sends an idea and follows it in «Mis
   * recomendaciones» (Pendiente / Aceptada / Descartada); the admin panel marks them and can answer.
   */
  private static readonly IDEA_STATUS: Record<string, string> = { pendiente: 'Pendiente', aceptada: 'Aceptada', descartada: 'Descartada' };
  private suggestionModal() {
    document.querySelector('.idea-modal')?.remove();
    const box = document.createElement('div');
    box.className = 'tut-modal bug-modal idea-modal';
    document.body.appendChild(box);
    const kb = this.game.input.keyboard, had = kb?.preventDefault ?? false;
    if (kb) kb.preventDefault = false;
    const close = () => { box.remove(); if (kb) kb.preventDefault = had; };
    if (!onlineConfigured() || !signedIn()) {
      box.innerHTML = `<div class="panel bug-card"><h2>${tr('💡 Recomendaciones')}</h2><p class="note">${onlineConfigured() ? tr('Para enviar una recomendación necesitas entrar con tu cuenta.') : tr('No disponible en esta versión.')}</p>
        <div class="tut-nav"><span class="spacer"></span><button class="btn small blue" data-close>${tr('Cerrar')}</button></div></div>`;
      box.querySelector('[data-close]')!.addEventListener('click', close);
      return;
    }
    box.innerHTML = `<div class="panel bug-card"><h2>${tr('💡 Recomendaciones')}</h2>
      <p class="note">${tr('¿Una idea para el juego? Cuéntanosla. Verás si la aceptamos en «Mis recomendaciones».')}</p>
      <label>${tr('Título')}<input id="idtitle" maxlength="120" autocomplete="off" placeholder="${tr('Tu idea en una frase')}"></label>
      <label>${tr('Cuéntanos más')}<textarea id="iddesc" maxlength="4000" rows="5" placeholder="${tr('Qué te gustaría ver y por qué')}"></textarea></label>
      <div id="iderr" class="bug-err" role="alert"></div>
      <div class="tut-nav"><button class="btn small blue" data-close>${tr('Cerrar')}</button><button class="btn small blue" id="idmine">${tr('Mis recomendaciones')}</button><span class="spacer"></span><button class="btn" id="idsend">${tr('Enviar')}</button></div></div>`;
    box.querySelector('[data-close]')!.addEventListener('click', close);
    box.querySelector('#idmine')!.addEventListener('click', () => { close(); void this.mySuggestionsModal(); });
    const send = box.querySelector('#idsend') as HTMLButtonElement, err = box.querySelector('#iderr') as HTMLElement;
    send.addEventListener('click', async () => {
      const title = (box.querySelector('#idtitle') as HTMLInputElement).value.trim(), desc = (box.querySelector('#iddesc') as HTMLTextAreaElement).value.trim();
      if (title.length < 4) { err.textContent = tr('Ponle un título (4 letras como mínimo).'); return; }
      if (desc.length < 10) { err.textContent = tr('Cuéntanos un poco más (10 letras como mínimo).'); return; }
      send.disabled = true; err.textContent = '';
      try {
        const code = await submitSuggestion(title, desc);
        sfx('powerup');
        box.querySelector('.bug-card')!.innerHTML = `<h2>${tr('¡Gracias!')}</h2><p>${tr('Hemos recibido tu recomendación.')}</p><p class="bug-code">${esc(code)}</p>
          <div class="tut-nav"><button class="btn small blue" id="idmine2">${tr('Mis recomendaciones')}</button><span class="spacer"></span><button class="btn" data-close2>${tr('Cerrar')}</button></div>`;
        box.querySelector('[data-close2]')!.addEventListener('click', close);
        box.querySelector('#idmine2')!.addEventListener('click', () => { close(); void this.mySuggestionsModal(); });
      } catch (e) {
        send.disabled = false;
        const m = (e as Error).message;
        err.textContent = /too_fast/.test(m) ? tr('Espera un minuto antes de enviar otra.') : /daily_limit/.test(m) ? tr('Has enviado 5 hoy: vuelve mañana.') : tr('No se pudo enviar: {m}', { m });
      }
    });
  }
  private async mySuggestionsModal() {
    const box = document.createElement('div');
    box.className = 'tut-modal bug-modal idea-modal';
    box.innerHTML = '<div class="panel bug-card"><h2>Mis recomendaciones</h2><div id="milist" class="note">Cargando…</div><div class="tut-nav"><span class="spacer"></span><button class="btn small blue" data-close>Cerrar</button></div></div>';
    document.body.appendChild(box);
    box.querySelector('[data-close]')!.addEventListener('click', () => box.remove());
    const list = box.querySelector('#milist') as HTMLElement;
    try {
      const rows = await mySuggestions();
      list.className = '';
      list.innerHTML = rows.length ? rows.map((r) => `<div class="bug-row"><code>${esc(r.code)}</code><b>${esc(r.title)}</b><span class="bug-st idea-${esc(r.status)}">${esc(App.IDEA_STATUS[r.status] ?? r.status)}</span><small>${new Date(r.created_at).toLocaleDateString(locale())}</small></div>`).join('')
        : `<p class="note">${tr('Aún no has enviado ninguna.')}</p>`;
    } catch (e) { list.textContent = tr('No se pudieron cargar: {x1}', { x1: (e as Error).message }); }
  }
  private async adminSuggestionsPanel(status: string | null = null) {
    setMusicContext('menu');
    this.show(`<div class="screen">${this.titlebar(tr('Panel de recomendaciones'), 'Ajustes')}<div class="panel"><div class="seg" id="idst">
      ${[['', tr('Todas')], ...Object.entries(App.IDEA_STATUS)].map(([k, t]) => `<button data-v="${k}" class="${(status ?? '') === k ? 'on' : ''}">${t}</button>`).join('')}</div>
      <div id="idlist" class="note">${tr('Cargando…')}</div></div></div>`);
    this.on('[data-back]', 'click', () => this.options());
    this.on('#idst button', 'click', (_e, el) => { void this.adminSuggestionsPanel(el.dataset.v || null); });
    const list = document.getElementById('idlist')!;
    try {
      const rows = await adminSuggestions(status);
      if (!document.getElementById('idlist')) return;
      list.className = '';
      list.innerHTML = rows.length ? rows.map((r, i) => `<button class="bug-row admin" data-i="${i}"><code>${esc(r.code)}</code><b>${esc(r.title)}</b><span class="bug-st idea-${esc(r.status)}">${esc(App.IDEA_STATUS[r.status] ?? r.status)}</span><small>${esc(r.username ?? '')} · ${new Date(r.created_at).toLocaleDateString(locale())}</small></button>`).join('')
        : `<p class="note">${tr('No hay recomendaciones.')}</p>`;
      this.on('#idlist .bug-row.admin', 'click', (_e, el) => this.adminSuggestionDetail(rows[Number(el.dataset.i)], status));
    } catch (e) { list.textContent = /forbidden/.test((e as Error).message) ? tr('No tienes permiso para ver este panel.') : tr('No se pudo cargar: {x1}', { x1: (e as Error).message }); }
  }
  private adminSuggestionDetail(r: SuggestionRow, back: string | null) {
    const box = document.createElement('div');
    box.className = 'tut-modal bug-modal';
    box.innerHTML = `<div class="panel bug-card wide"><h2>${esc(r.code)}</h2><h3>${esc(r.title)}</h3><p class="note">${esc(r.username ?? tr('(sin nombre)'))} · ${new Date(r.created_at).toLocaleString(locale())}</p>
      <p class="bug-text">${esc(r.description ?? '')}</p>
      <h4>${tr('Estado')}</h4><div class="seg" id="sdst">${Object.entries(App.IDEA_STATUS).map(([k, t]) => `<button data-v="${k}" class="${k === r.status ? 'on' : ''}">${t}</button>`).join('')}</div>
      <h4>${tr('Respuesta al jugador')}</h4><textarea id="sdreply" rows="3" maxlength="2000" placeholder="${tr('Opcional: le saldrá como notificación')}">${esc(r.reply ?? '')}</textarea>
      <p class="note">${tr('Si la aceptas o le respondes, le llega una notificación. Si la descartas, no recibe nada.')}</p>
      <div class="tut-nav"><button class="btn small blue" data-close>${tr('Cerrar')}</button><span class="spacer"></span><button class="btn" id="sdsave">${tr('Guardar')}</button></div></div>`;
    document.body.appendChild(box);
    let st = r.status;
    box.querySelectorAll<HTMLElement>('#sdst button').forEach((b) => b.addEventListener('click', () => { st = b.dataset.v!; box.querySelectorAll('#sdst button').forEach((x) => x.classList.toggle('on', x === b)); }));
    box.querySelector('[data-close]')!.addEventListener('click', () => box.remove());
    box.querySelector('#sdsave')!.addEventListener('click', () => {
      adminUpdateSuggestion(r.code, st, (box.querySelector('#sdreply') as HTMLTextAreaElement).value)
        .then(() => { box.remove(); this.toast(tr('Recomendación actualizada')); void this.adminSuggestionsPanel(back); }).catch((e: Error) => this.toast(e.message, 4000));
    });
  }

  /** Bug panel. The button only appears for admins, but what protects the data is the server, which refuses everyone else. */
  private async adminBugs(filter: BugFilter = { category: null, severity: null, status: null, from: null, to: null, order: 'fecha' }) {
    setMusicContext('menu');
    const opt = (list: readonly (readonly [string, string])[], cur: string | null, all: string) => `<option value="">${all}</option>${list.map(([k, t]) => `<option value="${k}"${k === cur ? ' selected' : ''}>${t.split(' · ')[0]}</option>`).join('')}`;
    this.show(`<div class="screen">${this.titlebar(tr('Panel de bugs'), 'Ajustes')}<div class="panel"><div class="filters">
      <select id="adcat">${opt(CATEGORIES, filter.category, tr('Todas las categorías'))}</select><select id="adsev">${opt(SEVERITIES, filter.severity, tr('Toda gravedad'))}</select>
      <select id="adst">${opt(Object.entries(STATUS_LABEL), filter.status, tr('Todos los estados'))}</select>
      <label class="note">${tr('Desde')} <input id="adfrom" type="date" value="${(filter.from ?? '').slice(0, 10)}"></label><label class="note">${tr('Hasta')} <input id="adto" type="date" value="${(filter.to ?? '').slice(0, 10)}"></label>
      <select id="adord"><option value="fecha"${filter.order === 'fecha' ? ' selected' : ''}>${tr('Más recientes')}</option><option value="prioridad"${filter.order === 'prioridad' ? ' selected' : ''}>${tr('Prioridad')}</option></select></div>
      <div id="adlist" class="note">${tr('Cargando…')}</div></div></div>`);
    this.on('[data-back]', 'click', () => this.options());
    const read = (id: string) => (document.getElementById(id) as HTMLInputElement).value || null;
    ['adcat', 'adsev', 'adst', 'adfrom', 'adto', 'adord'].forEach((id) => document.getElementById(id)!.addEventListener('change', () => {
      const to = read('adto');
      void this.adminBugs({ category: read('adcat'), severity: read('adsev'), status: read('adst'), from: read('adfrom'), to: to ? new Date(new Date(to).getTime() + 86400000).toISOString().slice(0, 10) : null, order: (read('adord') ?? 'fecha') as BugFilter['order'] });
    }));
    const list = document.getElementById('adlist')!;
    try {
      const rows = await adminBugReports(filter);
      if (!document.getElementById('adlist')) return;
      list.innerHTML = rows.length ? rows.map((r, i) => `<button class="bug-row admin" data-i="${i}"><code>${esc(r.code)}</code><b>${esc(r.title)}</b><span class="bug-sev sv-${esc(r.severity)}">${esc(r.severity)}</span><span class="bug-st st-${esc(r.status)}">${esc(STATUS_LABEL[r.status] ?? r.status)}</span><small>${esc(r.category)} · v${esc(r.game_version ?? '')} · ${new Date(r.created_at).toLocaleString(locale())}${r.screenshot_path ? ' · 📷' : ''}</small></button>`).join('') : tr('No hay reportes con estos filtros.');
      this.on('.bug-row.admin', 'click', (_e, el) => this.adminBugDetail(rows[Number(el.dataset.i)], filter));
    } catch (e) { list.textContent = /forbidden/.test((e as Error).message) ? tr('No tienes permiso para ver este panel.') : tr('No se pudo cargar: {x1}', { x1: (e as Error).message }); }
  }

  /** Fix 1.41: how many people play (accounts only: guests never reach the server). The server refuses non-admins. */
  private async adminPlayers(tab: 'players' | 'metrics' | 'replays' = 'players', days = 30) {
    this.show(`<div class="screen">${this.titlebar(tr('Panel de jugadores'), 'Ajustes')}<div class="panel"><div class="seg" id="aptabs"><button data-t="players" class="${tab === 'players' ? 'on' : ''}">${tr('Jugadores')}</button><button data-t="metrics" class="${tab === 'metrics' ? 'on' : ''}">${tr('Métricas')}</button><button data-t="replays" class="${tab === 'replays' ? 'on' : ''}">${tr('Repeticiones')}</button></div><div id="aplist" class="note">${tr('Cargando…')}</div></div></div>`);
    this.on('[data-back]', 'click', () => this.options());
    this.on('#aptabs button', 'click', (_e, el) => { void this.adminPlayers(el.dataset.t as 'players' | 'metrics' | 'replays', days); });
    if (tab === 'metrics') return this.adminMetricsView(days);
    if (tab === 'replays') return this.adminReplaysView();
    const box = document.getElementById('aplist')!;
    const ago = (iso: string | null) => {
      if (!iso) return '—';
      const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
      return m < 60 ? `hace ${m} min` : m < 1440 ? `hace ${Math.round(m / 60)} h` : `hace ${Math.round(m / 1440)} d`;
    };
    try {
      const s = await adminPlayerStats(200);
      if (!document.getElementById('aplist')) return;
      const tile = (n: number, t: string) => `<div class="ap-tile"><b>${n.toLocaleString(locale())}</b><span>${t}</span></div>`;
      box.className = '';
      box.innerHTML = `<div class="ap-tiles">${tile(s.accounts, 'cuentas')}${tile(s.played, 'han jugado')}${tile(s.runs, 'partidas')}${tile(s.active_24h, 'activos 24 h')}${tile(s.active_7d, tr('activos 7 días'))}${tile(s.new_7d, tr('nuevos 7 días'))}${tile(s.ranked_runs, tr('partidas al ranking'))}${tile(s.kills, tr('rivales derrotados'))}</div>
        <p class="note">${tr('Solo cuenta cuentas con sesión iniciada: quien juega como invitado guarda en su navegador y el servidor no sabe de él. {x1} cuenta(s) aún sin nombre de usuario.', { x1: s.accounts - s.with_name })}</p>
        <div class="ap-table"><div class="ap-row ap-head"><span>${tr('Usuario')}</span><span>${tr('Última vez')}</span><span>${tr('Partidas')}</span><span>${tr('Ranking')}</span><span>${tr('Mejor tiempo')}</span><span>${tr('Colección')}</span><span>${tr('Alta')}</span></div>
        ${s.players.map((p) => `<div class="ap-row"><b>${esc(p.username ?? tr('(sin nombre)'))}</b><span>${ago(p.last_seen)}</span><span>${p.runs}</span><span>${p.ranked_runs}</span><span>${Math.floor(p.best_time / 60)}:${String(p.best_time % 60).padStart(2, '0')}</span><span>${p.owned}</span><span>${new Date(p.created_at).toLocaleDateString(locale())}</span></div>`).join('')}</div>`;
    } catch (e) { box.textContent = /forbidden/.test((e as Error).message) ? tr('No tienes permiso para ver este panel.') : tr('No se pudo cargar: {x1}', { x1: (e as Error).message }); }
  }

  // ---- 2.1 (author): the ranking by seasons — its strip on the ranking screen and the final prizes on the menu
  private seasonPrizesAt = 0;
  /** the prizes of a ranking season that ended: asked at most every 10 minutes from the menu, shown once */
  private async seasonPrizes() {
    if (!onlineConfigured() || !signedIn() || !SEASONS.some((d) => +serverNow() >= seasonEnd(d))) return;
    if (Date.now() - this.seasonPrizesAt < 600_000) return;
    this.seasonPrizesAt = Date.now();
    let rows: Awaited<ReturnType<typeof claimSeasonRewards>>;
    try { rows = await claimSeasonRewards(); } catch { this.seasonPrizesAt = 0; return; }
    if (!rows?.length) return;
    for (const r of rows) {
      const got = payRankPrize(this.save, r, this.byId);
      this.persist();
      this.seasonPrizeModal(r, got.players.map((x) => x.player));
    }
  }
  private seasonPrizeModal(r: { season: string; pos: number; tokens: number; coins: number; eg: number; pennants: string[] }, players: RosterEntry[] = []) {
    const def = SEASONS.find((d) => d.id === r.season);
    sfx(r.pos <= 3 ? 'legend' : 'buy');
    if (r.pos <= 15 && this.save.settings.particles !== 'desactivado') confetti(r.pos <= 3 ? 160 : 90);
    const medal = r.pos === 1 ? '🥇' : r.pos === 2 ? '🥈' : r.pos === 3 ? '🥉' : `#${r.pos}`;
    document.body.insertAdjacentHTML('beforeend', `<div class="gk-unlock rs-end" id="rsend"><div class="gk-u-in">
      <span class="gk-u-rays"></span><span class="rs-medal${r.pos <= 3 ? ' top' : ''}">${medal}</span>
      <small>${tr('{x1} · RANKING FINAL', { x1: esc((def?.name ?? r.season).toUpperCase()) })}</small><b>${r.pos <= 15 ? tr('¡Puesto {pos} del mundo!', { pos: r.pos }) : `Puesto ${r.pos}`}</b>
      <div class="rs-gifts"><span><b>${r.tokens.toLocaleString(locale())}</b> ${tr('fichas')}</span><span><b>${r.coins.toLocaleString(locale())}</b> ${tr('monedas')}</span><span>${tr('{egIcon}<b>{eg}</b> Fichas EG', { egIcon: this.egIcon(18), eg: r.eg })}</span></div>
      ${players.length || r.pennants.length ? `<div class="rs-extra">${players.map((player) => `<span class="gk-u-star">${this.mug(player.id, 64)}<span><em>${RARITY_LABEL[player.rarity].toUpperCase()}</em>${esc(player.name)}</span></span>`).join('')}
        ${r.pennants.map((id) => PENNANT_BY_ID.get(id)).filter((d): d is PennantDef => !!d).map((d) => `<span class="rs-pn">${isFrame(d) ? this.framed(this.frameFace(), d.id) : pennantSvg(d, 40)}<small>${esc(d.name)}</small></span>`).join('')}</div>` : ''}
      <p class="note">${tr('El ranking empieza de cero en la nueva temporada. ¡A por el siguiente!')}</p>
      <div class="gk-u-btns"><button class="btn" id="rsok">${tr('¡Genial!')}</button></div></div></div>`);
    document.getElementById('rsok')!.addEventListener('click', () => document.getElementById('rsend')?.remove());
  }
  /** the ranking screen: the season under way, its time left and what each place wins */
  private rankSeasonStrip() {
    const now = serverNow(), def = activeSeason(now), next = upcomingSeason(now);
    const d = def ?? next;
    if (!d) return '';
    const prizes = RANK_PRIZES.map((p) => {
      const pn = p.pennants(d.id).map((id) => PENNANT_BY_ID.get(id)).filter((x): x is PennantDef => !!x);
      const pl = p.players.map((id) => this.byId.get(id));
      return `<div class="rs-tier t-${p.tier}"><span class="rs-tl">${p.tier === 'top1' ? '🥇' : p.tier === 'top3' ? '🥈🥉' : ''}<b>${esc(p.label)}</b></span>
        <span class="rs-tg">${tr('{x1} fichas · {x2} ◉ · {eg} Fichas EG{x3}', { x1: p.fichas.toLocaleString(locale()), x2: p.monedas.toLocaleString(locale()), eg: p.eg, x3: pl.map((x) => ` · <em>${x ? esc(x.name) : '¿?'}</em>`).join('') })}</span>
        <span class="rs-tp">${pn.map((x) => isFrame(x) ? `<span class="rs-fr${x.wings ? ' w' : ''}" title="${esc(x.name)}">${frameSvg(x)}</span>` : `<span title="${esc(x.name)}">${pennantSvg(x, 22)}</span>`).join('')}</span></div>`;
    }).join('');
    return `<details class="rs-strip" ${def ? '' : 'open'}><summary><span class="rs-sic">${uiIcon('trophy')}</span><span><small>${def ? tr('{x1} · TERMINA EN {x2}', { x1: esc(def.name.toUpperCase()), x2: esc(this.leftText(seasonEnd(def) - +now)) }) : tr('EMPIEZA EL {x1}', { x1: new Date(seasonStart(d)).toLocaleString(locale(), { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid' }).toUpperCase() })}</small>
      <b>${tr('Ranking por temporadas · premios al terminar')}</b></span><em class="rs-more">${tr('Ver premios')}</em></summary>
      <div class="rs-tiers">${prizes}</div><p class="note">${tr('Cuenta tu mejor marca en la clasificación general (por puntos). Al terminar la temporada, los premios te llegan al entrar en el juego y el ranking empieza de cero.')}</p></details>`;
  }

  // ---- 2.1 (author): the season pass (systems/seasonPass.ts)
  /** a run's pass EXP (not training), said in a toast; levels gained are shown in the pass */
  private seasonRunXp(r: RunResult & { level: number }) {
    if (this.lastRunTraining) return;
    const got = addRunXp(this.save, r.timeSec, (r.rank ?? 'C') as Rank, serverNow());
    if (!got || !got.xp) return;
    this.persist();
    window.setTimeout(() => this.toast(got.to > got.from ? tr('Pase de temporada: +{xp} EXP · ¡nivel {to}!', { xp: got.xp, to: got.to }) : tr('Pase de temporada: +{xp} EXP', { xp: got.xp }), 3500), 900);
  }

  /** the Llave dorada dropped in a run: unlocked at once, the big notice over the HUD */
  private goldKeyDropped() {
    if (!giveGoldKey(this.save, serverNow())) return;
    this.persist();
    const key = this.m.pase?.dorada;
    document.getElementById('hud')?.insertAdjacentHTML('beforeend', `<div class="gk-flow" id="gkflow"><span class="gk-rays"></span>${key ? `<img class="gk-key" src="${key}" alt="">` : ''}
      <span class="gk-tx"><small>${tr('LLAVE DORADA')}</small><b>${tr('¡Has obtenido el pase premium!')}</b><em>${tr('Ábrelo en el menú al terminar la partida')}</em></span></div>`);
    window.setTimeout(() => document.getElementById('gkflow')?.remove(), 4200);
  }

  /** the menu after a Llave dorada: its unlock, once (the key turns into the lock, the premium row opens) */
  private goldKeyUnlock() {
    const def = activeSeason(serverNow());
    if (!def || !this.save.season || this.save.season.id !== def.id || !this.save.season.gold || this.save.season.goldSeen !== false) return;
    this.save.season.goldSeen = true;
    this.persist();
    sfx('legend');
    if (this.save.settings.particles !== 'desactivado') confetti(140);
    const key = this.m.pase?.dorada, star = def.stars[0];
    document.body.insertAdjacentHTML('beforeend', `<div class="gk-unlock" id="gkunlock"><div class="gk-u-in">
      <span class="gk-u-rays"></span><span class="gk-u-lock"><i></i>${key ? `<img class="gk-u-key" src="${key}" alt="">` : ''}</span>
      <small>${esc(def.name.toUpperCase())} · ${esc(def.subtitle.toUpperCase())}</small><b>${tr('PASE PREMIUM DESBLOQUEADO')}</b>
      ${star ? `<span class="gk-u-star">${this.mug(star, 96)}<span><em>${tr('Nivel 1')}</em>${tr('{x1} ya te espera', { x1: esc(this.byId.get(star)?.name ?? '') })}</span></span>` : ''}
      <div class="gk-u-btns"><button class="btn" id="gkgo">${tr('Ver el pase')}</button><button class="btn blue" id="gkclose">${tr('Cerrar')}</button></div></div></div>`);
    const close = () => document.getElementById('gkunlock')?.remove();
    document.getElementById('gkclose')!.addEventListener('click', close);
    document.getElementById('gkgo')!.addEventListener('click', () => { close(); this.seasonScreen(); });
  }

  /** a reward's picture and its words */
  private seasonRewardArt(r: SeasonReward, small = false): { art: string; label: string; rar?: Rarity } {
    switch (r.kind) {
      case 'monedas': return { art: `<span class="sp-ic sp-coin">◉</span>`, label: tr('{x1} monedas', { x1: r.n.toLocaleString(locale()) }) };
      case 'fichas': return { art: `<span class="sp-ic sp-tok">${uiIcon('capsule')}</span>`, label: tr('{rN} fichas', { rN: r.n }) };
      case 'multi': return { art: `<span class="sp-ic sp-multi">${uiIcon('capsule')}<b>×10</b></span>`, label: tr('Tirada ×10 ({MULTI_FICHAS} fichas)', { MULTI_FICHAS }) };
      case 'eg': return { art: `<span class="sp-ic sp-eg">${this.egIcon(small ? 22 : 28)}</span>`, label: r.n > 1 ? tr('{rN} Fichas EG', { rN: r.n }) : tr('{rN} Ficha EG', { rN: r.n }) };
      case 'jugador': { const p = this.byId.get(r.id); return { art: `<span class="sp-mug">${this.mug(r.id, small ? 40 : 56)}</span>`, label: p?.name ?? 'Futbolista', rar: p?.rarity }; }
      case 'banner': { const d = PENNANT_BY_ID.get(r.id); return { art: `<span class="sp-pn">${pennantSvg(r.id, small ? 26 : 34)}</span>`, label: `Banner: ${d?.name ?? r.id}`, rar: d?.rarity }; }
      case 'marco': { const d = PENNANT_BY_ID.get(r.id); return { art: `<span class="sp-fr">${this.framed(this.frameFace(), r.id)}</span>`, label: `Marco: ${d?.name ?? r.id}`, rar: d?.rarity }; }
    }
  }

  /** pays some levels; says what came in one toast (and a footballer's arrival on its own) */
  private seasonClaim(levels: [SeasonTrack, number][]) {
    const def = activeSeason(serverNow());
    if (!def) return;
    const got: Granted[] = [];
    let waiting = false;
    for (const [track, lv] of levels) { const g = claimLevel(this.save, def, track, lv, this.byId); if (g) got.push(g); else waiting = true; }
    if (!got.length) { if (waiting) this.toast(tr('Recarga el juego para recibir este premio.')); sfx('error'); return; }
    this.persist();
    sfx(got.some((g) => g.player && (g.player.rarity === 'leyenda' || g.player.rarity === 'legendario')) ? 'legend' : 'buy');
    const sum = { monedas: 0, fichas: 0, eg: 0 };
    for (const g of got) {
      if (g.reward.kind === 'monedas') sum.monedas += g.reward.n;
      if (g.reward.kind === 'fichas') sum.fichas += g.reward.n;
      if (g.reward.kind === 'multi') sum.fichas += MULTI_FICHAS;
      if (g.reward.kind === 'eg') sum.eg += g.reward.n;
    }
    const parts = [sum.monedas && tr('{x1} monedas', { x1: sum.monedas.toLocaleString(locale()) }), sum.fichas && tr('{fichas} fichas', { fichas: sum.fichas }), sum.eg && tr('{eg} Fichas EG', { eg: sum.eg }),
      ...got.filter((g) => g.player).map((g) => `${g.player!.name}${g.isNew ? tr(' (¡nuevo!)') : ''}`),
      ...got.filter((g) => g.reward.kind === 'banner' || g.reward.kind === 'marco').map((g) => PENNANT_BY_ID.get((g.reward as { id: string }).id)?.name ?? '')].filter(Boolean);
    this.toast(tr('Pase: {x1}', { x1: parts.join(' · ') }), 4500);
    if (got.some((g) => g.player && (g.player.rarity === 'leyenda' || g.player.rarity === 'legendario')) && this.save.settings.particles !== 'desactivado') confetti(90);
    this.seasonScreen();
  }

  /** the pass: level and EXP, the two keys, and the two rows of 100 levels side by side */
  seasonScreen() {
    setMusicContext('menu');
    const now = serverNow(), def = activeSeason(now);
    if (!def) { this.toast(tr('El pase de temporada aún no ha empezado.')); this.mainMenu(); return; }
    const st = seasonOf(this.save, def), lv = levelOf(st.xp), keys = this.m.pase;
    const ready = (['normal', 'premium'] as SeasonTrack[]).reduce((n, t) => n + claimable(st, t).length, 0);
    const cell = (track: SeasonTrack, level: number) => {
      const r = (track === 'normal' ? def.normal : def.premium)[level - 1];
      const { art, label, rar } = this.seasonRewardArt(r, true);
      const done = (track === 'normal' ? st.claimedNormal : st.claimedPremium).includes(level);
      const open = rowOpen(st, track), reached = level <= lv, can = canClaimLevel(st, track, level);
      const big = r.kind === 'jugador' || r.kind === 'banner' || r.kind === 'marco';
      // 2.11: amounts big with their unit under them; prizes say their rarity; a shut row shows its key, not a padlock
      const words = r.kind === 'monedas' ? `<b class="sp-amt coin">${r.n.toLocaleString(locale())}</b><small>${tr('monedas')}</small>`
        : r.kind === 'fichas' ? `<b class="sp-amt tok">${r.n}</b><small>${tr('fichas')}</small>`
        : r.kind === 'eg' ? `<b class="sp-amt eg">${r.n}</b><small>${r.n > 1 ? tr('Fichas EG') : tr('Ficha EG')}</small>`
        : r.kind === 'multi' ? `<small class="sp-nm">${tr('Tirada ×10')}</small>`
        : `<small class="sp-nm">${esc(label.replace(/^(Banner|Marco): /, ''))}</small>${rar ? `<em class="sp-tag">${r.kind === 'jugador' ? RARITY_LABEL[rar] : r.kind === 'marco' ? 'Marco' : 'Banner'}</em>` : ''}`;
      const key = keys?.[track === 'normal' ? 'normal' : 'dorada'];
      return `<button class="sp-cell ${track} k-${r.kind}${done ? ' done' : can ? ' can' : ''}${reached ? '' : ' far'}${open ? '' : ' shut'}${big ? ' big' : ''}" ${can ? `data-claim="${track}:${level}"` : 'tabindex="-1"'}
        style="${rar ? `--rc:${RARITY_COLOR[rar]}` : ''}" title="${esc(label)}">${art}${words}${done ? '<i class="sp-ok">✔</i>' : !open ? `<i class="sp-lock">${key ? `<img src="${key}" alt="">` : '🔒'}</i>` : ''}</button>`;
    };
    // the next big prize ahead (a footballer, banner or frame), to have something to aim at
    const next = Array.from({ length: LEVELS - lv }, (_, k) => lv + 1 + k).flatMap((n) => (['premium', 'normal'] as SeasonTrack[]).map((t) => [t, n] as [SeasonTrack, number]))
      .find(([t, n]) => ['jugador', 'banner', 'marco'].includes((t === 'normal' ? def.normal : def.premium)[n - 1].kind));
    const nextTxt = next ? (() => { const { label } = this.seasonRewardArt((next[0] === 'normal' ? def.normal : def.premium)[next[1] - 1]);
      return `${tr('Próximo gran premio: <b>{label}</b> · nivel {x1} {x2} · faltan {x3}', { label: esc(label), x1: next[1], x2: next[0] === 'premium' ? '(premium)' : '', x3: next[1] - lv })}`; })() : tr('¡Todos los grandes premios alcanzados!');
    const finale = def.premium[LEVELS - 1]?.kind === 'jugador' ? (def.premium[LEVELS - 1] as { id: number }).id : null;
    const keyCard = (kind: 'normal' | 'dorada') => {
      const has = kind === 'normal' ? st.normal : st.gold, img = keys?.[kind];
      return `<div class="sp-key ${kind}${has ? ' has' : ''}">${img ? `<img src="${img}" alt="">` : ''}<span><b>${kind === 'normal' ? tr('Llave normal') : tr('Llave dorada')}</b>
        <small>${kind === 'normal' ? (has ? tr('Fila normal abierta') : tr('Abre la fila normal · Tienda')) : (has ? tr('¡Fila premium abierta!') : tr('Cae al derrotar rivales: {x1}% por rival · ×{GOLD_KEY_COOP} en cooperativo', { x1: (GOLD_KEY_CHANCE * 100).toLocaleString(locale(), { maximumFractionDigits: 3 }), GOLD_KEY_COOP }))}</small></span>
        ${kind === 'normal' && !has ? `<button class="btn small" id="spbuy" ${this.save.coins < NORMAL_KEY_PRICE ? 'disabled' : ''}>${NORMAL_KEY_PRICE.toLocaleString(locale())} ◉</button>` : has ? '<em class="sp-has">✔</em>' : ''}</div>`;
    };
    const left = seasonEnd(def) - +now;
    // the season's star prizes, up front: where they are and whether they are already yours
    const stars = ([['premium', 1], ['premium', 25], ['premium', 75], ['premium', 100]] as [SeasonTrack, number][]).map(([t, n]) => {
      const r = (t === 'normal' ? def.normal : def.premium)[n - 1], { art, label, rar } = this.seasonRewardArt(r);
      const done = (t === 'normal' ? st.claimedNormal : st.claimedPremium).includes(n);
      return `<div class="sp-star${done ? ' done' : ''}" style="--rc:${rar ? RARITY_COLOR[rar] : '#ffcc2a'}">${art}<span><em>${rar ? RARITY_LABEL[rar].toUpperCase() : ''}</em><b>${esc(label.replace(/^(Banner|Marco): /, ''))}</b><small>${tr('{x1} · nivel {n}{x2}', { x1: t === 'premium' ? 'Premium' : 'Normal', n, x2: done ? ' · ✔ tuyo' : '' })}</small></span></div>`;
    }).join('');
    const showcase = `<span class="sp-show-t">${tr('PREMIOS ESTRELLA')}</span>${stars}`;
    this.show(`<div class="screen sp-screen">${this.titlebar(tr('Pase de temporada'), 'Menú')}
      <section class="sp-head">${finale != null ? `<span class="sp-hero" aria-hidden="true">${this.mug(finale, 160)}</span>` : ''}<div class="sp-lv"><small>${tr('NIVEL')}</small><b>${lv}</b><em>/ ${LEVELS}</em></div>
        <div class="sp-info"><small>${tr('{x1} · TERMINA EN {x2}', { x1: esc(def.name.toUpperCase()), x2: esc(this.leftText(left)) })}</small><b>${esc(def.subtitle)}</b>
          <div class="sp-xp"><i style="width:${(levelProgress(st.xp) * 100).toFixed(1)}%"></i><span>${lv >= LEVELS ? tr('¡Pase completo!') : `${st.xp % LEVEL_XP} / ${LEVEL_XP} EXP`}</span></div>
          <span class="sp-how">${tr('EXP por minuto jugado ({XP_PER_MIN}/min) × rango: {x1}', { XP_PER_MIN, x1: (['C', 'B', 'A', 'S', 'X', 'Z'] as Rank[]).map((k) => `${k} ×${RANK_XP[k].toLocaleString(locale())}`).join(' · ') })}</span></div>
        <div class="sp-keys">${keyCard('normal')}${keyCard('dorada')}</div></section>
      <section class="sp-show">${showcase}</section>
      <div class="sp-bar"><span class="sp-next">${nextTxt}</span><button class="btn small" id="spall" ${ready ? '' : 'disabled'}>${tr('Reclamar todo{x1}', { x1: ready ? ` (${ready})` : '' })}</button></div>
      <div class="sp-wrap"><div class="sp-rows" aria-hidden="true"><span class="sp-rl"></span><span class="sp-rl normal">${keys ? `<img src="${keys.normal}" alt="">` : ''}<b>${tr('NORMAL')}</b></span><span class="sp-rl premium">${keys ? `<img src="${keys.dorada}" alt="">` : ''}<b>${tr('PREMIUM')}</b></span></div>
      <div class="sp-track" id="sptrack">${Array.from({ length: LEVELS }, (_, k) => k + 1).map((n) => `<div class="sp-col${n <= lv ? ' got' : ''}${n === lv ? ' now' : ''}${n % 10 === 0 ? ' ten' : ''}" data-lv="${n}">
        <span class="sp-n">${n}${n === lv ? `<i class="sp-you">${tr('TÚ')}</i>` : ''}</span>${cell('normal', n)}${cell('premium', n)}</div>`).join('')}</div></div>
      <p class="note">${tr('Las llaves y los niveles son de esta temporada: cuando termine, empieza una nueva con su propio pase. La EXP cuenta aunque no tengas llave: al abrir una fila puedes reclamar todo lo que ya hayas alcanzado.')}</p></div>`);
    this.on('[data-back]', 'click', () => this.mainMenu());
    const track = document.getElementById('sptrack')!;
    const at = track.querySelector<HTMLElement>(`[data-lv="${Math.max(1, Math.min(LEVELS, lv))}"]`);
    if (at) track.scrollLeft = Math.max(0, at.offsetLeft - track.clientWidth / 2 + at.offsetWidth / 2);
    track.addEventListener('wheel', (e) => { if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) { track.scrollLeft += e.deltaY; e.preventDefault(); } }, { passive: false });
    this.on('[data-claim]', 'click', (_e, el) => { const [t, n] = el.dataset.claim!.split(':'); this.seasonClaim([[t as SeasonTrack, Number(n)]]); });
    document.getElementById('spall')?.addEventListener('click', () => this.seasonClaim((['normal', 'premium'] as SeasonTrack[]).flatMap((t) => claimable(st, t).map((n) => [t, n] as [SeasonTrack, number]))));
    const buy = document.getElementById('spbuy');
    if (buy) buy.addEventListener('click', () => this.armed(buy, () => {
      if (buyNormalKey(this.save, serverNow())) { this.persist(); sfx('buy'); this.toast(tr('¡Llave normal! La fila normal del pase está abierta.'), 3500); } else sfx('error');
      this.seasonScreen();
    }));
  }

  // ------------------------------------------------------------- 2.2 Sector Quinto
  /** the decree chosen for the match about to start, the run's changes, and whether a won run credits the side */
  private sectorChoice: { decree: MatchDecree; rebel: boolean } | null = null;
  private runSector: SectorRun | null = null;
  private runSectorCredit: { rebel: boolean } | null = null;
  private sectorAt = 0;
  private sectorLast: SectorStatus | null = null;

  /** Zabel speaks: his bust and a box with his words; `extra` goes under them; each button resolves with its value */
  private zabelSay(o: { kicker: string; lines: string[]; extra?: string; buttons: [string, string, string][] }): Promise<string> {
    return new Promise((resolve) => {
      document.getElementById('zabel')?.remove();
      const z = this.m.goCoaches?.find((c) => c.id === 'zabel'), logo = this.m.sector?.sector;
      document.body.insertAdjacentHTML('beforeend', `<div class="zb-wrap" id="zabel"><div class="zb-in">
        ${z ? `<img class="zb-bust" src="${z.bust}" alt="">` : ''}
        <div class="zb-box">${logo ? `<img class="zb-logo" src="${logo}" alt="">` : ''}<small>${esc(o.kicker)}</small><b class="zb-name">${tr('Zabel · Emperador Sagrado')}</b>
          ${o.lines.map((l, i) => `<p style="--i:${i}">${esc(l)}</p>`).join('')}${o.extra ?? ''}
          <div class="zb-btns">${o.buttons.map(([l, c, v]) => `<button class="btn ${c}" data-zb="${esc(v)}">${l}</button>`).join('')}</div></div></div></div>`);
      document.querySelectorAll<HTMLElement>('#zabel [data-zb]').forEach((b) => b.addEventListener('click', () => { sfx('click'); document.getElementById('zabel')?.remove(); resolve(b.dataset.zb!); }));
    });
  }

  /** before a plain match of a side's member: the Sector's decree, accepted or defied */
  private zabelDecree(d: MatchDecree, go: (rebel: boolean) => void) {
    const wk = weeklyDecree(serverNow());
    sfx('bossdrop');
    void this.zabelSay({ kicker: tr('DECRETO DEL SECTOR QUINTO'), lines: [d.line],
      extra: `<div class="zb-dec"><b>${esc(d.title)}</b>${wk ? `<small>${tr('Y para todos esta semana: {element} +{x1} %', { element: esc(tEl(wk.element)), x1: Math.round(wk.bonus * 100) })}</small>` : ''}</div>
        <div class="zb-opts"><span><b>${tr('Acatar')}</b>${tr('Se aplica el decreto. Puntos normales para tu bando.')}</span>
          <span class="rb"><b>${tr('Rebelarse')}</b>${tr('Sin decreto, pero el Sector envía a sus SEED: rivales +{x1} % de vida y muchos más SEED. Puntos ×{x2}.', { x1: Math.round((REBEL_ENEMY_HP - 1) * 100), x2: String(REBEL_POINTS).replace('.', ',') })}</span></div>`,
      buttons: [[tr('Acatar'), 'blue', 'a'], [tr('¡Rebelarse! ×{x1}', { x1: fmtNum(REBEL_POINTS) }), 'sq-rebel', 'r'], [tr('Volver'), 'small ghost', 'x']] })
      .then((v) => { if (v !== 'x') go(v === 'r'); });
  }

  /** the side as the server says (every 5 minutes from the menu), the weeks to collect (shown once) and, once a week,
   *  Zabel's new weekly decree */
  private async sectorSync(force = false): Promise<SectorStatus | null> {
    const now = serverNow();
    if (!onlineConfigured() || +now < Date.parse(SECTOR_START)) return null;
    if (!force && Date.now() - this.sectorAt < 300_000) return this.sectorLast;
    this.sectorAt = Date.now();
    try { this.sectorLast = await sectorStatus(); } catch { this.sectorAt = 0; return null; }
    const st = sectorOf(this.save);
    if (signedIn() && (st.side ?? null) !== this.sectorLast.side) { st.side = this.sectorLast.side; this.persist(); }
    if (signedIn() && this.sectorLast.side) {
      try {
        for (const r of await sectorClaim()) {
          const got = paySectorPrize(this.save, r, this.byId);
          if (got.paid) { this.persist(); this.sectorPrizeModal(r, got); }
        }
      } catch { /* collected next time */ }
    }
    const w = sectorWeek(now), wk = weeklyDecree(now);
    if (w !== null && wk && st.weekSeen !== w && this.screenKey === 'menu-mode' && !document.getElementById('zabel')) {
      st.weekSeen = w;
      this.persist();
      void this.zabelSay({ kicker: tr('SECTOR QUINTO · SEMANA {x1}', { x1: w + 1 }), lines: [wk.line], extra: `<div class="zb-dec"><b>${esc(wk.title)}</b><small>${tr('Para todos, hasta el jueves a las 12:00')}</small></div>`,
        buttons: [[tr('Entendido'), 'blue', 'ok'], [tr('Ver el Sector'), '', 'go']] }).then((v) => { if (v === 'go') void this.sectorScreen(); });
    }
    return this.sectorLast;
  }

  /** a collected week: who won, what came in */
  private sectorPrizeModal(r: SectorPrize, got: ReturnType<typeof paySectorPrize>) {
    const side = SIDES[r.side], other = SIDES[r.side === 'sector' ? 'resistencia' : 'sector'], logo = this.m.sector?.[r.winner === 'empate' ? r.side : r.winner];
    sfx(r.won ? 'legend' : 'buy');
    if (r.won && this.save.settings.particles !== 'desactivado') confetti(120);
    const title = r.winner === 'empate' ? tr('¡Empate! Los dos bandos ganan la semana') : r.won ? tr('¡{sideName} gana la semana!', { sideName: side.name }) : tr('Esta semana gana {otherName}', { otherName: other.name });
    document.body.insertAdjacentHTML('beforeend', `<div class="gk-unlock rs-end sq-end" id="sqend"><div class="gk-u-in">
      <span class="gk-u-rays"></span>${logo ? `<img class="sq-end-logo" src="${logo}" alt="">` : ''}
      <small>${tr('SECTOR QUINTO · SEMANA {x1} · TU BANDO: {x2}', { x1: r.week + 1, x2: esc(side.name.toUpperCase()) })}</small><b>${esc(title)}</b>
      <div class="rs-gifts"><span><b>${r.tokens}</b> ${tr('fichas')}</span><span><b>${r.coins.toLocaleString(locale())}</b> ◉</span>
        ${got.players.map((x) => `<span>${this.mug(x.player.id, 32)}<b>${esc(x.player.name)}</b>${x.isNew ? tr(' ¡nuevo!') : tr(' +1 copia')}</span>`).join('')}</div>
      ${got.frame ? `<div class="rs-extra"><span class="rs-pn">${this.framed(this.frameFace(), side.frame)}<small>${esc(PENNANT_BY_ID.get(side.frame)?.name ?? '')}</small></span></div>` : ''}
      ${r.won ? '' : `<p class="note">${tr('Por jugar con tu bando esta semana. ¡A por la siguiente!')}</p>`}
      <div class="gk-u-btns"><button class="btn" id="sqok">${tr('¡Vamos!')}</button></div></div></div>`);
    document.getElementById('sqok')!.addEventListener('click', () => document.getElementById('sqend')?.remove());
  }

  /** the event's screen: the week's decree, the two sides and their standing, the prizes, past weeks, joining */
  async sectorScreen() {
    setMusicContext('menu');
    this.show(`<div class="screen sq-screen">${this.titlebar(tr('Sector Quinto'), 'Menú')}<div id="sqbody"><div class="note">${tr('Cargando…')}</div></div></div>`);
    this.on('[data-back]', 'click', () => this.mainMenu());
    const st = sectorOf(this.save);
    if (!st.introSeen) {
      st.introSeen = true;
      this.persist();
      await this.zabelSay({ kicker: tr('SECTOR QUINTO'), lines: [tr('El fútbol necesita orden. A partir de hoy, el Sector Quinto decide cómo se juega cada partido.'),
        tr('Únete a nosotros… o intenta resistir. Cada semana veremos qué bando juega mejor.')], buttons: [[tr('Continuar'), 'blue', 'ok']] });
    }
    const s = await this.sectorSync(true);
    const body = document.getElementById('sqbody');
    if (!body) return;
    const now = serverNow(), w = sectorWeek(now), wk = weeklyDecree(now), logos = this.m.sector;
    const mine = s?.side ?? st.side ?? null;
    const z = this.m.goCoaches?.find((c) => c.id === 'zabel');
    const card = (id: SideId) => {
      const d = SIDES[id], can = s?.canJoin[id] ?? false;
      const join = mine ? (mine === id ? `<em class="sq-you">${tr('TU BANDO')}</em>` : '') : !signedIn() ? ''
        : `<button class="btn${can ? '' : ' off'}" data-join="${id}" ${can ? '' : 'disabled'}>${can ? `Unirme a ${esc(d.short)}` : tr('Va por delante: entra en el otro')}</button>`;
      return `<div class="sq-side s-${id}${mine === id ? ' mine' : ''}" style="--sc:${d.color}">${logos ? `<img class="sq-logo" src="${logos[id]}" alt="">` : ''}
        <b>${esc(d.name)}</b><small>${esc(d.motto)}</small><span class="sq-n">${s ? (s.members[id] === 1 ? tr('1 miembro') : tr('{members} miembros', { members: s.members[id] })) : ''}</span>
        <div class="sq-stars">${d.players.map((pid) => { const p = this.byId.get(pid); return p ? `<span class="r-${p.rarity}" title="${esc(p.name)}">${this.mug(pid, 44)}</span>` : ''; }).join('')}</div>${join}</div>`;
    };
    const a = { sector: s?.avg.sector ?? 0, resistencia: s?.avg.resistencia ?? 0 }, tot = Math.max(1, a.sector + a.resistencia);
    const left = w !== null ? this.leftText(sectorWeekEnd(w) - +now) : '';
    const frame = (id: SideId) => `<span class="sq-fr">${this.framed(this.frameFace(), SIDES[id].frame)}</span>`;
    body.innerHTML = `
      ${wk ? `<section class="sq-dec">${z ? `<img class="sq-zb" src="${z.face}" alt="">` : ''}<div><small>${tr('DECRETO DE LA SEMANA {x1} · SE CUENTA EN {x2}', { x1: (w ?? 0) + 1, x2: esc(left.toUpperCase()) })}</small>
        <b>${esc(wk.title.replace('Decreto semanal: ', ''))}</b><p>«${esc(wk.line)}»</p></div></section>` : `<p class="note">${tr('El Sector Quinto ha terminado esta temporada.')}</p>`}
      <section class="sq-sides">${card('sector')}<span class="sq-vs">${this.uiPiece('vs') || 'VS'}</span>${card('resistencia')}</section>
      ${s && w !== null ? `<section class="sq-stand"><small>${tr('ESTA SEMANA · MEDIA POR JUGADOR ACTIVO')}</small>
        <div class="sq-bar"><i class="b-sector" style="width:${(a.sector / tot * 100).toFixed(1)}%"></i><i class="b-resistencia" style="width:${(a.resistencia / tot * 100).toFixed(1)}%"></i></div>
        <div class="sq-nums"><span><b>${a.sector.toLocaleString(locale())}</b> ${tr('· {sector} activos', { sector: s.active.sector })}</span><span>${tr('{resistencia} activos ·', { resistencia: s.active.resistencia })} <b>${a.resistencia.toLocaleString(locale())}</b></span></div>
        ${mine ? `<p class="sq-me">${tr('{x1} <b>{x2}</b> · suma ganando partidas (rebelarte da ×{x3})', { x1: tr('Tus puntos esta semana:'), x2: s.myPoints.toLocaleString(locale()), x3: String(REBEL_POINTS).replace('.', ',') })}</p>` : ''}</section>` : ''}
      <section class="sq-prizes"><small>${tr('PREMIOS DE CADA SEMANA')}</small>
        <div><b>${tr('Bando ganador')}</b><span>${tr('{tokens} fichas · {x1} ◉ · una copia de sus tres estrellas · el marco del bando (la primera vez)', { tokens: WIN_PRIZE.tokens, x1: WIN_PRIZE.coins.toLocaleString(locale()) })}</span>${mine ? frame(mine) : `${frame('sector')}${frame('resistencia')}`}</div>
        <div><b>${tr('Bando perdedor')}</b><span>${tr('{tokens} fichas · {x1} ◉ si jugaste esa semana', { tokens: LOSE_PRIZE.tokens, x1: LOSE_PRIZE.coins.toLocaleString(locale()) })}</span></div></section>
      ${s?.results.length ? `<section class="sq-hist"><small>${tr('SEMANAS ANTERIORES')}</small>${s.results.map((r) => `<div><b>${tr('Semana {x1}', { x1: r.week + 1 })}</b><span>${r.winner === 'empate' ? 'Empate' : `Gana ${esc(SIDES[r.winner].name)}`}</span><em>${r.sector.toLocaleString(locale())} – ${r.resistencia.toLocaleString(locale())}</em></div>`).join('')}</section>` : ''}
      <p class="note">${tr('{x1}El bando es para toda la temporada y no se puede cambiar. Para que la lucha sea justa, el bando que vaya por delante en miembros no admite a nadie más hasta que el otro lo alcance. Cuentan las victorias de partidas normales (sin cooperativo, Road, clan ni entrenamiento).', { x1: !signedIn() ? tr('Para elegir bando necesitas conectar tu cuenta (Perfil): los bandos se cuentan en el servidor. ') : '' })}</p>`;
    this.on('[data-join]', 'click', (_e, el) => void this.sectorJoinFlow(el.dataset.join as SideId));
  }

  private async sectorJoinFlow(id: SideId) {
    const d = SIDES[id];
    const ok = await this.zabelSay({ kicker: tr('UNA DECISIÓN PARA TODA LA TEMPORADA'), lines: [tr('¿{x1}? Piénsalo bien: no podrás cambiar de bando hasta que termine la temporada.', { x1: d.name })],
      buttons: [[tr('Sí, {x1}', { x1: esc(d.short) }), 'blue', 'ok'], [tr('Pensarlo'), 'small ghost', 'no']] });
    if (ok !== 'ok') return;
    try {
      await sectorJoin(id);
      sectorOf(this.save).side = id;
      this.persist();
      sfx('legend');
      await this.zabelSay({ kicker: d.name.toUpperCase(), lines: id === 'sector'
        ? [tr('Bienvenido al Sector Quinto. Aquí el fútbol se juega como yo digo.'), tr('Acata mis decretos y tu bando ganará.')]
        : [tr('La Resistencia… Veremos cuánto aguanta vuestro viento.'), tr('Rebélate si quieres: el Sector Quinto también sabe jugar duro.')], buttons: [[tr('¡A jugar!'), 'blue', 'ok']] });
    } catch (e) {
      const m = (e as Error).message;
      this.toast(/side_full/.test(m) ? tr('{dName} va por delante en miembros: ahora solo se puede entrar en el otro bando.', { dName: d.name })
        : /already_in_side/.test(m) ? tr('Ya tienes bando.') : /no_username/.test(m) ? tr('Primero reserva tu nombre en Perfil.') : /sector_closed/.test(m) ? tr('El Sector Quinto no está abierto ahora.') : tr('No se pudo unir al bando. Inténtalo de nuevo.'), 5000);
    }
    this.sectorAt = 0;
    void this.sectorScreen();
  }

  /** 2.02: the Jadens given for clears made under the old Road rule, said once the menu is up */
  private jadenNotice(n: number) {
    if (n > 0) window.setTimeout(() => this.toast(tr('Road to Fútbol Frontier: ahora Jaden sale a las 3 victorias en Máxima y otra copia cada 3. Por tus victorias recibes {x1}.', { x1: n === 1 ? 'a Jaden Evans' : tr('{n} Jaden Evans (él y sus copias)', { n }) }), 7000), 2500);
  }

  /** 2.02: the run's recording goes to the server in the background (a failure only loses this replay) */
  private sendReplay(r: RunResult & { level: number }) {
    // 2.02 Métricas: which spirit played and what its ultimates did (added up per day on the server, no account kept)
    const sp = this.arena()?.spiritStats();
    if (sp && r.timeSec >= 30 && onlineConfigured() && signedIn()) void recordSpiritRun(sp.spirit, sp.casts, sp.damage).catch((e) => console.warn('[spirits]', e));
    const rec = this.arena()?.takeReplay();
    if (!rec || r.timeSec < 60 || !r.runId) return;
    const runId = r.runId;
    void rec.finish()
      .then((blob) => uploadReplay(runId, blob, { map: r.mapId, rank: r.rank ?? 'C', timeSec: r.timeSec, victory: r.victory, kills: r.kills, level: r.level,
        captainId: r.captainId ?? null, team: r.teamIds ?? [], version: PUBLIC_VERSION }))
      .catch((e) => console.warn('[replay]', e));
  }

  /** 2.02 (admin): the recorded runs, newest first, filtered by player */
  private async adminReplaysView(user = '') {
    const box = document.getElementById('aplist');
    if (!box) return;
    box.className = '';
    box.innerHTML = `<div class="rp-bar"><input id="rpuser" placeholder="${tr('Usuario (vacío = todos)')}" value="${esc(user)}" maxlength="20" autocomplete="off">
      <button class="btn small blue" id="rpfind">${tr('Buscar')}</button><span class="spacer"></span><button class="btn small" id="rpprune">${tr('Borrar las de más de 30 días (no las del ranking)')}</button></div>
      <div id="rprows" class="note">${tr('Cargando…')}</div>`;
    const find = () => { void this.adminReplaysView((document.getElementById('rpuser') as HTMLInputElement).value.trim()); };
    document.getElementById('rpfind')!.addEventListener('click', find);
    document.getElementById('rpuser')!.addEventListener('keydown', (e) => { if ((e as KeyboardEvent).key === 'Enter') find(); });
    const prune = document.getElementById('rpprune') as HTMLButtonElement;
    prune.addEventListener('click', async () => {
      if (!prune.classList.contains('sure')) { prune.classList.add('sure'); prune.textContent = tr('¿Seguro? Pulsa otra vez'); return; }
      prune.disabled = true;
      try { this.toast(tr('{x1} repeticiones borradas', { x1: await adminPruneReplays(30) })); } catch (e) { this.toast((e as Error).message); }
      void this.adminReplaysView(user);
    });
    const list = document.getElementById('rprows')!;
    try {
      const rows = await adminReplays(user || null, 150);
      if (!document.getElementById('rprows')) return;
      if (!rows.length) { list.textContent = user ? tr('No hay repeticiones de {user}.', { user }) : tr('Aún no hay repeticiones: se graban las partidas en solitario de quien juega con sesión iniciada.'); return; }
      const mapName = (id: string) => this.m.maps.find((m) => m.id === id)?.name ?? id;
      const kb = rows.reduce((n, r) => n + r.bytes, 0) / 1024;
      list.className = '';
      list.innerHTML = `<p class="note">${tr('{rowsLength} repeticiones · {x1} en total. Cada jugador guarda sus 3 últimas y las de sus marcas del ranking.', { rowsLength: rows.length, x1: kb > 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${Math.round(kb)} KB` })}</p>
        <div class="ap-table rp-table"><div class="ap-row ap-head"><span>${tr('Usuario')}</span><span>${tr('Fecha')}</span><span>${tr('Arena')}</span><span>${tr('Rango')}</span><span>${tr('Duración')}</span><span>${tr('Resultado')}</span><span>${tr('Capitán')}</span><span></span></div>
        ${rows.map((r, i) => { const cap = r.captain_id !== null ? this.byId.get(r.captain_id) : undefined; return `<div class="ap-row">
          <b>${esc(r.username)}</b><span>${new Date(r.created_at).toLocaleString(locale(), { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
          <span>${esc(mapName(r.map))}</span><span><span class="rank-btn r-${esc(r.rank)} rp-rank">${rankMark(r.rank)}</span></span><span>${fmtTime(r.time_sec)}</span>
          <span class="${r.victory ? 'rp-win' : 'rp-loss'}">${tr('{x1} · Nv {level}', { x1: r.victory ? 'Victoria' : 'Derrota', level: r.level })}</span><span class="rp-cap">${cap ? `${this.mug(cap.id, 24)}${esc(cap.name)}` : '—'}</span>
          <span><button class="btn small blue" data-rp="${i}">${tr('▶ Ver')}</button></span></div>`; }).join('')}</div>`;
      this.on('[data-rp]', 'click', (_e, el) => { void this.replayViewer(rows[Number(el.dataset.rp)], user); }, list);
    } catch (e) { list.textContent = /forbidden/.test((e as Error).message) ? tr('No tienes permiso para ver este panel.') : tr('No se pudo cargar: {x1}', { x1: (e as Error).message }); }
  }

  /** a line of the replay's log, or null for what is not worth a line (shots: they are seen on the pitch) */
  private replayEventText(e: ReplayEvent): string | null {
    const who = (id: unknown) => this.byId.get(Number(id))?.name ?? `#${id}`;
    const tech = (id: unknown, i: unknown) => this.byId.get(Number(id))?.techniques[Number(i)]?.name ?? 'técnica';
    switch (e.k) {
      case 'card': {
        const c = e.card as { kind: string; playerId?: number; tech?: number; toLevel?: number; id?: string; amount?: number };
        const txt = c.kind === 'recruit' ? tr('Ficha a {who}', { who: who(c.playerId) })
          : c.kind === 'learn' ? `${who(c.playerId)} aprende ${tech(c.playerId, c.tech)}`
          : c.kind === 'upgrade' ? `${tech(c.playerId, c.tech)} (${who(c.playerId)}) a Nv ${c.toLevel}`
          : c.kind === 'combo' ? `Combinada ${COMBOS.find((x) => x.id === c.id)?.name ?? c.id} Nv ${c.toLevel}`
          : c.kind === 'heal' ? tr('+{x1}% de vida', { x1: Math.round((c.amount ?? 0) * 100) })
          : modDef(String(c.id))?.label ?? String(c.id);
        return `<b class="rl-card">${tr('Nv {lv}', { lv: e.lv })}</b> ${esc(txt)}`;
      }
      case 'hurt': return e.atk === 'entrada' && e.dmg < 15 ? null : `<b class="rl-hurt">−${e.dmg}</b> ${esc(e.by || 'Rival')} · ${esc(e.atk)}`;
      case 'boss': return `<b class="rl-boss">${tr('JEFE')}</b> ${tr('¡Llega {eName}!', { eName: esc(e.name) })}`;
      case 'ult': return `<b class="rl-ult">${tr('ULTI')}</b> ${esc(who(e.id))}`;
      case 'formation': return `<b class="rl-form">${tr('Formación')}</b> ${esc(FORMATIONS[e.f as FormationId]?.label ?? e.f)}`;
      case 'end': return `<b class="${e.win ? 'rl-win' : 'rl-hurt'}">${tr('FIN')}</b> ${tr('{x1} · {x2} rivales · Nv {level}', { x1: e.win ? 'Victoria' : 'Derrota', x2: e.kills.toLocaleString(locale()), level: e.level })}`;
      default: return null;
    }
  }

  /** 2.02 (admin): watching one recorded run, with play/pause, speed, the timeline and a log of what happened */
  private async replayViewer(row: ReplayRow, backUser: string) {
    this.stopScenes();
    const cap = row.captain_id !== null ? this.byId.get(row.captain_id) : undefined;
    const mapName = this.m.maps.find((m) => m.id === row.map)?.name ?? row.map;
    this.show(`<div class="rplay" id="rplay">${this.titlebar(tr('Repetición'), tr('Panel'))}
      <div class="rp-info">${cap ? `<span class="rp-mug">${this.mug(cap.id, 40)}</span>` : ''}<span><b>${esc(row.username)}</b><small>${tr('{mapName} · Rango {rank} · {x1} · v{version}', { mapName: esc(mapName), rank: esc(row.rank), x1: new Date(row.created_at).toLocaleString(locale()), version: esc(row.version) })}</small></span></div>
      <div class="rp-log" id="rplog"></div>
      <div class="rp-load" id="rpload">${tr('Descargando la repetición…')}</div>
      <div class="rp-ctl" id="rpctl" hidden>
        <button class="btn small blue rp-play" id="rpplay" title="${tr('Espacio')}">❚❚</button>
        <span class="rp-time" id="rptime">0:00</span>
        <div class="rp-track"><div class="rp-marks" id="rpmarks"></div><input type="range" id="rpseek" min="0" max="1" step="0.1" value="0"></div>
        <div class="seg rp-speed" id="rpspeed">${[1, 2, 4, 8].map((x) => `<button data-x="${x}" class="${x === 1 ? 'on' : ''}">×${x}</button>`).join('')}</div>
        <div class="rp-hp" title="${tr('Vida del equipo')}"><i id="rphp"></i></div>
      </div></div>`, 'replay-mode');
    const key = this.screenKey;
    const keys = new AbortController();
    const leave = () => { keys.abort(); this.stopScenes(); void this.adminPlayers('replays').then(() => { if (backUser) void this.adminReplaysView(backUser); }); };
    this.on('[data-back]', 'click', leave);
    const load = document.getElementById('rpload')!;
    let rp: Awaited<ReturnType<typeof readReplay>>;
    try { rp = await readReplay(await replayFile(row.path)); } catch (e) { load.textContent = (e as Error).message; return; }
    if (this.screenKey !== key) return;
    load.remove();
    document.getElementById('rpctl')!.hidden = false;
    const seek = document.getElementById('rpseek') as HTMLInputElement, time = document.getElementById('rptime')!, play = document.getElementById('rpplay')!;
    const hp = document.getElementById('rphp')!, log = document.getElementById('rplog')!;
    seek.max = String(rp.duration);
    const dur = Math.max(1, rp.duration);
    // the timeline: bosses, cards and the hard hits
    document.getElementById('rpmarks')!.innerHTML = rp.events.filter(({ e }) => e.k === 'boss' || e.k === 'card' || (e.k === 'hurt' && e.dmg >= 15))
      .map(({ t, e }) => `<i class="rm-${e.k}" style="left:${(t / dur * 100).toFixed(2)}%"></i>`).join('');
    const scene = () => this.game.scene.getScene('Replay') as ReplayScene | null;
    let dragging = false;
    const init: ReplayInit = {
      manifest: this.m, replay: rp, roster: this.byId, settings: this.save.settings,
      onTick: (s) => {
        time.textContent = `${fmtTime(s.t)} / ${fmtTime(s.duration)}`;
        if (!dragging) seek.value = String(s.t);
        play.textContent = s.playing ? '❚❚' : '▶';
        hp.style.width = `${Math.max(0, Math.min(100, (s.hp / Math.max(1, s.max)) * 100))}%`;
      },
      onEvent: (t, e) => {
        const txt = this.replayEventText(e);
        if (!txt) return;
        log.insertAdjacentHTML('afterbegin', `<div><em>${fmtTime(t)}</em> ${txt}</div>`);
        while (log.children.length > 8) log.lastElementChild!.remove();
      },
    };
    this.game.scene.start('Replay', init);
    const toggle = () => { const s = scene(); if (!s) return; if (!s.playing && seek.valueAsNumber >= rp.duration - 0.1) s.seek(0); s.playing = !s.playing; };
    play.addEventListener('click', toggle);
    seek.addEventListener('input', () => { dragging = true; scene()?.seek(seek.valueAsNumber); log.innerHTML = ''; });
    seek.addEventListener('change', () => { dragging = false; });
    this.on('#rpspeed button', 'click', (_e, el) => {
      const s = scene(); if (s) s.speed = Number(el.dataset.x);
      document.querySelectorAll('#rpspeed button').forEach((b) => b.classList.toggle('on', b === el));
    });
    document.addEventListener('keydown', (e) => {
      if (this.screenKey !== key) { keys.abort(); return; }
      if ((e.target as HTMLElement).closest('input:not([type=range]), textarea')) return;
      const s = scene();
      if (!s) return;
      if (e.key === ' ') { e.preventDefault(); toggle(); }
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); s.seek(seek.valueAsNumber + (e.key === 'ArrowRight' ? 5 : -5)); log.innerHTML = ''; }
    }, { signal: keys.signal });
  }

  /** Métricas: activity per Madrid day, peak hours, retention and what people play. Plain CSS bars, no chart library. */
  private async adminMetricsView(days: number) {
    const box = document.getElementById('aplist')!;
    try {
      const [m, sp] = await Promise.all([adminMetrics(days), adminSpiritStats(days).catch(() => [] as SpiritStat[])]);
      if (!document.getElementById('aplist')) return;
      const n = (v: number) => v.toLocaleString(locale());
      const pct = (a: number, b: number) => b ? `${Math.round((a / b) * 100)} %` : '—';
      const tile = (v: string, t: string) => `<div class="ap-tile"><b>${v}</b><span>${t}</span></div>`;
      const sum = (k: 'new' | 'players' | 'runs') => m.daily.reduce((a, d) => a + d[k], 0);
      const today = m.daily[m.daily.length - 1];
      const step = Math.max(1, Math.ceil(m.daily.length / 8));
      const cols = (vals: number[], labels: string[], tips: string[]) => {
        const max = Math.max(1, ...vals);
        return `<div class="mt-cols">${vals.map((v, i) => `<div class="mt-col" title="${esc(tips[i])}"><i style="height:${Math.round((v / max) * 100)}%"></i><small>${esc(labels[i])}</small></div>`).join('')}</div>`;
      };
      const daily = (k: 'new' | 'players' | 'runs', title: string) => `<h4>${title} <small>${tr('(máx. {x1} · total {x2})', { x1: n(Math.max(0, ...m.daily.map((d) => d[k]))), x2: n(sum(k)) })}</small></h4>`
        + cols(m.daily.map((d) => d[k]),
          m.daily.map((d, i) => (m.daily.length - 1 - i) % step === 0 ? `${d.day.slice(8)}/${d.day.slice(5, 7)}` : ''),
          m.daily.map((d) => `${new Date(d.day + 'T12:00').toLocaleDateString(locale(), { weekday: 'short', day: 'numeric', month: 'short' })}: ${d[k]}`));
      const rows = (items: { label: string; n: number }[]) => {
        const max = Math.max(1, ...items.map((x) => x.n)), tot = items.reduce((a, x) => a + x.n, 0);
        return items.length ? `<div class="mt-rows">${items.map((x) => `<div class="mt-row"><span>${esc(x.label)}</span><div><i style="width:${(x.n / max) * 100}%"></i></div><b>${n(x.n)} <small>${pct(x.n, tot)}</small></b></div>`).join('')}</div>` : `<p class="note">${tr('Sin datos todavía.')}</p>`;
      };
      const mapName = (id: string) => this.m.maps.find((x) => x.id === id)?.name ?? id;
      box.className = '';
      box.innerHTML = `<div class="seg small" id="mtdays">${[7, 30, 90].map((d) => `<button data-d="${d}" class="${d === days ? 'on' : ''}">${tr('{d} días', { d })}</button>`).join('')}</div>
        <div class="ap-tiles">${tile(n(m.online_now), 'conectados ahora')}${tile(n(m.online_1h), tr('conectados última hora'))}${tile(n(today.players), 'han jugado hoy')}${tile(n(today.runs), tr('partidas hoy'))}${tile(n(today.new), 'cuentas nuevas hoy')}${tile(pct(m.retention.d1, m.retention.d1_base), tr('vuelven al día siguiente ({d1}/{d1_base})', { d1: m.retention.d1, d1_base: m.retention.d1_base }))}${tile(pct(m.retention.d7, m.retention.d7_base), tr('siguen tras 7 días ({d7}/{d7_base})', { d7: m.retention.d7, d7_base: m.retention.d7_base }))}${tile(pct(m.totals.wins, m.totals.runs), tr('partidas ganadas'))}${tile(n(m.totals.pulls), tr('fichajes en la máquina'))}</div>
        ${daily('players', tr('Jugadores por día'))}${daily('runs', tr('Partidas por día'))}${daily('new', tr('Cuentas nuevas por día'))}
        <h4>${tr('Horas punta')} <small>${tr('(partidas de los últimos {days} días, hora de España)', { days: m.days })}</small></h4>
        ${cols(m.hours, m.hours.map((_, h) => h % 3 === 0 ? `${h}h` : ''), m.hours.map((v, h) => tr('{h}:00–{h}:59: {v} partidas', { h, v })))}
        <div class="mt-split"><div><h4>${tr('Arenas más jugadas')}</h4>${rows(m.maps.map((x) => ({ label: mapName(x.map), n: x.n })))}</div>
        <div><h4>${tr('Rangos')}</h4>${rows(m.ranks.map((x) => ({ label: tr('Rango {rank}', { rank: x.rank }), n: x.n })))}</div>
        <div><h4>${tr('Capitanes favoritos')}</h4>${rows(m.captains.map((x) => ({ label: this.byId.get(x.id)?.name ?? `#${x.id}`, n: x.n })))}</div></div>
        ${this.spiritMetrics(sp, days)}
        <h4>${tr('Comunidad')}</h4><div class="ap-tiles">${tile(n(m.social.friendships), 'amistades')}${tile(n(m.social.clans), 'clanes')}${tile(n(m.social.clan_members), tr('miembros de clan'))}${tile(n(m.social.coop_7d), tr('partidas co-op (7 días)'))}${tile(n(m.social.tierlists), 'tierlists')}${tile(n(m.social.bugs_open), 'bugs abiertos')}${tile(n(m.social.ideas_open), 'ideas pendientes')}</div>
        <p class="note">${tr('Partidas por día, horas, arenas, rangos y capitanes salen de las partidas enviadas al ranking (solo cuentas con sesión; los invitados no cuentan). Arenas, rangos y capitanes son de todo el historial.')}</p>`;
      this.on('#mtdays button', 'click', (_e, el) => { void this.adminPlayers('metrics', Number(el.dataset.d)); });
    } catch (e) { box.textContent = /forbidden/.test((e as Error).message) ? tr('No tienes permiso para ver este panel.') : tr('No se pudo cargar: {x1}', { x1: (e as Error).message }); }
  }

  /** 2.02 Métricas: the warrior spirits most played and the ones whose ultimates take the most health */
  private spiritMetrics(sp: SpiritStat[], days: number) {
    if (!sp.length) return `<h4>${tr('Espíritus guerreros')}</h4><p class="note">${tr('Sin datos todavía: se cuentan las partidas terminadas desde la 2.02.')}</p>`;
    const n = (v: number) => Math.round(v).toLocaleString(locale());
    const name = (id: string) => KESHIN_BY_ID.get(id as KeshinId)?.name ?? id;
    const list = (items: { id: string; v: number; sub: string }[]) => {
      const max = Math.max(1, ...items.map((x) => x.v));
      return `<div class="mt-rows">${items.map((x) => `<div class="mt-row"><span>${esc(name(x.id))}</span><div><i style="width:${(x.v / max) * 100}%"></i></div><b>${n(x.v)} <small>${esc(x.sub)}</small></b></div>`).join('')}</div>`;
    };
    const used = [...sp].sort((a, b) => b.runs - a.runs).map((x) => ({ id: x.spirit, v: x.runs, sub: tr('partidas · {n} ultis', { n: n(x.casts) }) }));
    const dmg = [...sp].filter((x) => x.casts > 0).sort((a, b) => b.damage / b.casts - a.damage / a.casts)
      .map((x) => ({ id: x.spirit, v: x.damage / x.casts, sub: tr('por ulti · {n} en total', { n: n(x.damage) }) }));
    return `<div class="mt-split"><div><h4>${tr('Espíritus más usados')} <small>${tr('({days} días)', { days })}</small></h4>${list(used)}</div>
      <div><h4>${tr('Espíritus que más vida quitan')} <small>${tr('(media por ulti)')}</small></h4>${dmg.length ? list(dmg) : `<p class="note">${tr('Aún nadie ha lanzado una ulti.')}</p>`}</div></div>
      <p class="note">${tr('Cuenta el espíritu activo del equipo (el primero por la izquierda) en cada partida terminada con sesión iniciada. El daño es el que hace el equipo en los 3 s siguientes a cada ulti.')}</p>`;
  }

  private adminBugDetail(r: BugRow, filter: BugFilter) {
    const box = document.createElement('div');
    box.className = 'tut-modal bug-modal';
    const f = (k: string, v: unknown) => v || v === 0 ? `<div><small>${k}</small>${esc(String(v))}</div>` : '';
    box.innerHTML = `<div class="panel bug-card wide"><h2>${esc(r.code)}</h2><h3>${esc(r.title)}</h3>
      <div class="bug-facts">${f('Categoría', r.category)}${f('Gravedad', r.severity)}${f('Versión', r.game_version)}${f('Compilación', r.build)}${f('Jugador', r.username)}${f('Navegador', r.browser)}${f('Sistema', r.os)}${f('Pantalla', r.screen)}${f('Arena', r.map)}${f('Dificultad', r.difficulty)}${f(tr('Tiempo (s)'), r.run_time_sec)}${f('Fecha', new Date(r.created_at).toLocaleString(locale()))}</div>
      <h4>${tr('Qué ha ocurrido')}</h4><p class="bug-text">${esc(r.description ?? '')}</p>${r.steps ? `<h4>${tr('Pasos')}</h4><p class="bug-text">${esc(r.steps)}</p>` : ''}
      <div id="adshot" class="note">${r.screenshot_path ? tr('Cargando captura…') : tr('Sin captura.')}</div>
      <h4>${tr('Estado')}</h4><div class="seg" id="adstatus">${Object.entries(STATUS_LABEL).map(([k, t]) => `<button data-v="${k}" class="${k === r.status ? 'on' : ''}">${t}</button>`).join('')}</div>
      <h4>${tr('Notas privadas')}</h4><textarea id="adnotes" rows="3" maxlength="4000">${esc(r.admin_notes ?? '')}</textarea>
      <h4>${tr('Respuesta al jugador')}</h4><textarea id="adreply" rows="3" maxlength="2000" placeholder="${tr('Le saldrá al jugador la próxima vez que abra el juego')}">${esc(r.reply ?? '')}</textarea>
      <p class="note">${tr('Al responder, o al marcarlo como corregido o descartado, el jugador recibe un aviso. Las notas privadas nunca las ve.')}</p>
      <div class="tut-nav"><button class="btn small blue" id="adclose">${tr('Cerrar')}</button><span class="spacer"></span><button class="btn" id="adsave">${tr('Guardar')}</button></div></div>`;
    document.body.appendChild(box);
    let status = r.status, url = '';
    if (r.screenshot_path) shotUrl(r.screenshot_path).then((u) => { url = u; box.querySelector('#adshot')!.innerHTML = `<a href="${u}" target="_blank" rel="noopener"><img class="bug-full" src="${u}" alt="${tr('Captura del reporte')}"></a>`; }).catch((e: Error) => { box.querySelector('#adshot')!.textContent = e.message; });
    const shut = () => { if (url) URL.revokeObjectURL(url); box.remove(); };
    box.querySelectorAll<HTMLElement>('#adstatus button').forEach((b) => b.addEventListener('click', () => { status = b.dataset.v!; box.querySelectorAll('#adstatus button').forEach((x) => x.classList.toggle('on', x === b)); }));
    box.querySelector('#adclose')!.addEventListener('click', shut);
    box.querySelector('#adsave')!.addEventListener('click', () => {
      adminUpdateBug(r.code, status, (box.querySelector('#adnotes') as HTMLTextAreaElement).value, (box.querySelector('#adreply') as HTMLTextAreaElement).value)
        .then(() => { shut(); this.toast(tr('Reporte actualizado')); void this.adminBugs(filter); }).catch((e: Error) => this.toast(e.message, 4000));
    });
  }

  // ------------------------------------------------------------- tutorial
  /** Short visual tour; can be skipped at any step, and replayed from the options. */
  tutorial(step = 0) {
    const cap = squadOf(this.save, this.byId)[0] ?? this.unlockedRoster()[0];
    const mugs = squadOf(this.save, this.byId).slice(0, 5).map((p) => this.mug(p.id, 40)).join('');
    const slides: { title: string; text: string; art: string }[] = [
      { title: tr('Sobrevive y gana'), text: tr('Aguanta las oleadas de rivales hasta que llegue el jefe y derrótalo. Solo tu capitán recibe daño: si su vida llega a cero, pierdes (pero te quedas las monedas).'),
        art: cap ? `<div class="tut-hero">${this.mug(cap.id, 96)}${charCanvas(cap.id, 3, 12)}</div>` : '' },
      { title: 'Muévete', text: tr('WASD o flechas (o el joystick táctil / mando). Las técnicas se lanzan solas: tú solo te colocas. ¡Pruébalo aquí!'),
        art: '<div class="tut-pitch" id="tutpitch"><span class="tut-ball" id="tutball">⚽</span></div><div class="keys"><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd></div>' },
      { title: tr('Vida compartida'), text: tr('Todo el equipo comparte una barra. Si un rival toca a cualquiera, capitán o compañero, baja para todos.'),
        art: `<div class="tut-hp"><i></i></div><div class="tut-row">${mugs}</div>` },
      { title: tr('Ficha en la partida'), text: tr('Empiezas solo con el capitán. Al subir de nivel aparecen cartas para fichar a tus candidatos de Mi Equipo (máximo {MAX_TEAM} en el campo).', { MAX_TEAM }),
        art: `<div class="tut-row"><span class="tut-card">${tr('¡NUEVO FICHAJE!')}</span><span class="tut-card">${tr('MEJORA · TIRO')}</span><span class="tut-card">${tr('OBJETO')}</span></div>` },
      { title: 'Supertécnicas', text: tr('Tiro, regate, defensa y parada atacan solos; los talentos son pasivos. Mejóralas hasta nivel 10 y evolucionan.'),
        art: `<div class="tut-row">${(['tiro', 'regate', 'defensa', 'parada', 'talento'] as const).map((t) => `<span class="tut-type">${this.icon(ICON.manual[t], 3)}<small>${TYPE_LABEL[t]}</small></span>`).join('')}</div>` },
      { title: 'Formaciones', text: tr('Teclas 1, 2 y 3. Ofensiva: más daño y más riesgo. Equilibrada: neutra. Defensiva: menos daño recibido. Toca una:'),
        art: `<div class="tut-row" id="tutform">${FORMATION_ORDER.map((f) => `<button class="tut-f" data-f="${f}">${FORMATION_ICON(f, 56)}<small>[${FORMATIONS[f].key}] ${FORMATIONS[f].label}</small></button>`).join('')}</div><div class="note" id="tutfdesc"></div>` },
      { title: tr('Objetos y experiencia'), text: tr('Chispa verde, balón azul y rayo dorado dan experiencia (de menos a más). La comida cura y los objetos especiales te ayudan un rato.'),
        art: `<div class="tut-row"><span class="orb o0"></span><span class="orb o1"></span><span class="orb o2"></span>${this.icon(206, 3)}${this.icon(303, 3)}</div>` },
      { title: tr('Fichajes y fichas'), text: tr('Las Fichas de Fichaje se ganan jugando y con misiones. En la máquina, ×1 cuesta {PULL_COST}. Un futbolista nuevo es tuyo para siempre; un duplicado le da estrellas.', { PULL_COST }),
        art: this.cap('coin_oro') ? `<img class="tut-img" src="${this.cap('coin_oro')}" alt="">` : '' },
      { title: tr('Mejoras permanentes'), text: tr('Las monedas compran mejoras que duran para siempre: vida, daño, imán, ranuras de técnica y más.'),
        art: `<div class="tut-row"><span class="tut-card">${tr('▲ MEJORAS')}</span><span class="tut-card">${tr('★ TÉCNICAS')}</span></div>` },
      { title: tr('Prepara tu equipo'), text: tr('En Mi Equipo eliges 7 candidatos y el capitán. Luego, JUGAR, elige rango (C es el más fácil) y ¡al campo!'),
        art: `<div class="tut-row">${mugs}</div>` },
    ];
    const s = slides[Math.max(0, Math.min(step, slides.length - 1))];
    const last = step >= slides.length - 1;
    document.getElementById('tut')?.remove();
    const box = document.createElement('div');
    box.id = 'tut';
    box.className = 'tut-modal';
    box.innerHTML = `<div class="tut-card-main panel"><div class="tut-step">${step + 1}/${slides.length}</div><h2>${esc(s.title)}</h2>
      <div class="tut-art">${s.art}</div><p>${esc(s.text)}</p>
      <div class="tut-dots">${slides.map((_, i) => `<i class="${i === step ? 'on' : ''}"></i>`).join('')}</div>
      <div class="tut-nav"><button class="btn small blue" id="tutskip">${tr('Saltar tutorial')}</button><span class="spacer"></span>
        ${step ? `<button class="btn small blue" id="tutprev">${tr('◀ Atrás')}</button>` : ''}<button class="btn" id="tutnext">${last ? tr('¡A jugar!') : tr('Siguiente ▶')}</button></div></div>`;
    document.body.appendChild(box);
    mountPreviews();
    const close = (state: 'hecho' | 'omitido') => {
      window.removeEventListener('keydown', keys);
      box.remove();
      if (this.save.tutorial !== 'hecho') this.save.tutorial = state;
      this.persist();
    };
    // the movement slide is playable: the ball follows WASD/arrows inside its little pitch
    let bx = 50, by = 50;
    const keys = (e: KeyboardEvent) => {
      const k = moveKey(e);
      const ball = document.getElementById('tutball');
      if (ball && ['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) {
        bx = Math.max(5, Math.min(95, bx + (k === 'd' || k === 'arrowright' ? 6 : k === 'a' || k === 'arrowleft' ? -6 : 0)));
        by = Math.max(10, Math.min(90, by + (k === 's' || k === 'arrowdown' ? 8 : k === 'w' || k === 'arrowup' ? -8 : 0)));
        ball.style.left = `${bx}%`; ball.style.top = `${by}%`;
        e.preventDefault();
        return;
      }
      if (k === 'enter') document.getElementById('tutnext')?.click();
      if (k === 'escape') close('omitido');
    };
    window.addEventListener('keydown', keys);
    box.querySelectorAll<HTMLElement>('.tut-f').forEach((b) => b.addEventListener('click', () => {
      box.querySelectorAll('.tut-f').forEach((x) => x.classList.toggle('on', x === b));
      document.getElementById('tutfdesc')!.textContent = FORMATIONS[b.dataset.f as FormationId].description;
    }));
    document.getElementById('tutskip')!.addEventListener('click', () => close('omitido'));
    document.getElementById('tutprev')?.addEventListener('click', () => { window.removeEventListener('keydown', keys); this.tutorial(step - 1); });
    document.getElementById('tutnext')!.addEventListener('click', () => {
      if (last) { close('hecho'); return; }
      window.removeEventListener('keydown', keys);
      this.tutorial(step + 1);
    });
  }

  // ------------------------------------------------------------- play flow: Mi Equipo -> arena -> run (team starts with the captain only)
  /** Fix 1.31: the team synergies of the seven candidates, big and clear (element resonance, club chemistry, captain) */
  private squadSynergyPanel(squad: RosterEntry[]) {
    if (!squad.length) return '';
    const kit = this.save.kit || 'Raimon';
    const pot = squadPotential(squad, kit, teamLabel(kit), perkEffects(this.save).synergy);
    const el = pot.elements.map((x) => {
      const ec = ELEMENT_COLOR[x.element] ?? '#ccc';
      const pips = Array.from({ length: 5 }, (_, i) => `<i class="${i < x.techs ? 'on' : ''}"></i>`).join('');
      return `<div class="syn-card${x.reach ? ' on' : ''}" style="--ec:${ec}"><span class="syn-ic">${elementIcon(x.element, 26)}</span><div><b>${tr('Resonancia {element}', { element: esc(tEl(x.element)) })}</b>
        <span class="syn-pips">${pips}</span><small>${x.techs === 1 ? tr('1 técnica de {element} en el equipo', { element: esc(tEl(x.element)) }) : tr('{techs} técnicas de {element} en el equipo', { techs: x.techs, element: esc(tEl(x.element)) })} · ${x.players === 1 ? tr('1 futbolista') : tr('{players} futbolistas', { players: x.players })}</small></div>
        <em>${x.reach ? `hasta +${Math.round(x.reach * 100)}%` : `${x.techs}/3`}</em></div>`;
    }).join('');
    const ch = pot.chemistry, cap = pot.captain;
    // Fix 1.32: combined techniques of the squad, two (or three) footballers linked by a chain; the missing ones greyed out
    const byName = new Map(this.m.roster.map((x) => [x.name, x]));
    // v1.5 (author): Auras count here too — a participant carried as Aura shows as present, with its carrier named
    const carrierOfName = new Map<string, string>();
    for (const q of squad) { const an = this.auraEntryOf(q.id)?.name; if (an) carrierOfName.set(an, q.name); }
    const combos = squadCombos(squad, [...carrierOfName.keys()]).map((c) => {
      const who = c.combo.needs.map((n) => {
        // Fix 1.51: a counterpart (Xene for Xavier, Shawn + Axel for Shawn...) plays the part too
        const x = squad.find((q) => playsAs(q.name, n.player)) ?? byName.get(n.player);
        const self = squad.some((q) => playsAs(q.name, n.player)), viaKey = !self ? [...carrierOfName.keys()].find((an) => playsAs(an, n.player)) : undefined;
        const via = viaKey ? carrierOfName.get(viaKey) : undefined, here = self || !!via;
        return `<span class="cb2-who${here ? '' : ' miss'}${via ? ' via-aura' : ''}" title="${tr('{player}{x1} · Nv {level}{x2}', { player: esc(n.player), x1: n.tech ? ` · ${esc(n.tech)}` : '', level: n.level, x2: via ? tr(' (Aura de {via})', { via: esc(via) }) : here ? '' : tr(' (no está)') })}">${x ? this.mug(x.id, 40) : ''}<em>${tr('Nv{level}', { level: n.level })}</em></span>`;
      }).join('<i class="cb2-link">🔗</i>');
      // 1.88 (author: less text): name, element, power and one state pill
      return `<div class="cb2${c.ready ? ' ready' : ''}${c.viaAura.length ? ' with-aura' : ''}" style="--ec:${ELEMENT_COLOR[c.combo.element] ?? '#ffe27a'}">
        <div class="cb2-team">${who}</div>
        <div class="cb2-info"><b>${esc(tTech(c.combo.name))}</b><span class="cb2-tags">${elementIcon(c.combo.element, 12)}<i>${this.uiPiece('rayo_hex', 'inl') || '⚡'}${c.combo.power}</i>
          ${c.ready ? `<em class="cb2-pill ok">${tr('¡Lista!')}</em>` : `<em class="cb2-pill">${c.missing.length > 1 ? tr('Faltan {missingLength}', { missingLength: c.missing.length }) : tr('Falta {missingLength}', { missingLength: c.missing.length })}</em>`}</span></div></div>`;
    }).join('');
    return `<div class="panel syn-panel"><h3>${tr('Sinergias del equipo')}</h3>
      <div class="note">${tr('Resonancia: 3 técnicas activas del mismo elemento dan <b>+8%</b> de daño a esas técnicas, 5 dan <b>+15%</b>. Las técnicas activas se eligen al subir de nivel en la partida.')}</div>
      ${combos ? `<h3 class="cb-title">${tr('🔗 Técnicas combinadas')} <small class="cb2-count">${tr('{x1} listas', { x1: squadCombos(squad, [...carrierOfName.keys()]).filter((c) => c.ready).length })}</small></h3><div class="cb2-grid">${combos}</div><p class="note cb2-legend">${tr('El nivel bajo cada cara es el que necesita su técnica en la partida.')}</p><h3 class="cb-title">${tr('Elementos y química')}</h3>` : ''}
      <div class="syn-grid">${el}
        <div class="syn-card${ch.bonus ? ' on' : ''}" style="--ec:#7dff9a"><span class="syn-ic">♜</span><div><b>${tr('Química de club')}</b><span class="syn-pips">${Array.from({ length: ch.goal }, (_, i) => `<i class="${i < ch.count ? 'on' : ''}"></i>`).join('')}</span><small>${tr('{hint} (equipación {x1})', { hint: esc(ch.hint), x1: esc(teamLabel(kit)) })}</small></div><em>${ch.bonus ? `+${Math.round(ch.bonus * 100)}%` : `${ch.count}/${ch.goal}`}</em></div>
        ${cap ? `<div class="syn-card${cap.bonus ? ' on' : ''}" style="--ec:${ELEMENT_COLOR[String(cap.element)] ?? '#ffe27a'}"><span class="syn-ic">★</span><div><b>${esc(cap.label)}</b><small>${esc(cap.hint)}</small></div><em>${cap.bonus ? `+${(cap.bonus * 100).toFixed(1).replace('.', ',')}%` : '—'}</em></div>`
          : `<div class="syn-card"><span class="syn-ic">★</span><div><b>${tr('Sinergia elemental')}</b><small>${tr('Compra la mejora «Sinergia elemental»: más daño por cada compañero del elemento del capitán.')}</small></div><em>—</em></div>`}
      </div></div>`;
  }

  // ------------------------------------------------------------- v1.5: Auras
  /** carrier whose Aura is being chosen from the collection (tap flow, also on touch screens) */
  private auraPick: number | null = null;
  /** carrier whose socket has just received a card (plays its landing once) */
  private auraLanded: number | null = null;
  private auraEntryOf(carrierId: number) { const a = auraOf(this.save, carrierId); return a === null ? undefined : this.byId.get(a); }
  private auraBonusOf(p: RosterEntry): AuraBonus | null { const ae = this.auraEntryOf(p.id); return ae ? auraBonus(this.save, p.id, ae) : null; }
  /** own stats (≤ 99), Aura points and effective stats (≤ 120) of a footballer */
  private statSplit(p: RosterEntry) {
    const own = this.statsOf(p) as Record<StatKey, number> | null;
    const b = this.auraBonusOf(p);
    return { own, bonus: b, add: (b?.add ?? {}) as Partial<Record<string, number>>, eff: own ? withAura(own, b) : null };
  }

  /** The small linked card under a squad slot: the Aura (portrait, rarity frame, percentage) or an empty socket. */
  private auraMini(p: RosterEntry) {
    const ae = this.auraEntryOf(p.id);
    const picking = this.auraPick === p.id ? ' picking' : '';
    if (!ae) return `<button class="aura-mini empty${picking}" data-aura-slot="${p.id}" title="${tr('Equipar un Aura (Legendario, Mítico o Leyenda)')}"><span class="am-plus">+</span><small>${tr('AURA')}</small></button>`;
    const er = effectiveRarity(this.save, ae), tier = isHero(this.save, ae.id) ? 'heroe' : er;
    const b = auraBonus(this.save, p.id, ae);
    return `<button class="aura-mini t-${tier}${b.bond ? ' bond' : ''}${picking}${this.auraLanded === p.id ? ' landed' : ''}" data-aura-slot="${p.id}" data-aura-open="${p.id}" style="--rc:${RARITY_COLOR[er]};--ec:${ELEMENT_COLOR[String(ae.element)] ?? '#8a9bbd'}" title="${tr('Aura: {aeName} · pulsa para ver lo que aporta', { aeName: esc(ae.name) })}">
      <span class="am-mug">${this.mug(ae.id, 40)}</span><span class="am-txt"><small>${tr('AURA')}</small><b>${esc(ae.name.split(' ')[0])}</b><em>${b.bond ? '♥ ' : ''}+${Math.round(b.pct * 100)}%</em></span><i class="am-shine"></i></button>`;
  }

  /** Everything an Aura gives its carrier, in a sheet (tap on the small card). */
  private auraInfo(carrierId: number) {
    const p = this.byId.get(carrierId), ae = this.auraEntryOf(carrierId);
    if (!p || !ae) return;
    const b = auraBonus(this.save, p.id, ae), s = this.statSplit(p);
    const er = effectiveRarity(this.save, ae);
    const inh = inheritedTechs(p, ae);
    const sq = squadOf(this.save, this.byId);
    const auraNames = sq.map((x) => this.auraEntryOf(x.id)?.name).filter((x): x is string => !!x);
    const joint = squadCombos(sq, auraNames).filter((c) => c.combo.needs.some((n) => playsAs(ae.name, n.player)) && c.combo.needs.some((n) => playsAs(p.name, n.player) || sq.some((q) => playsAs(q.name, n.player))));
    const rows = STAT_INFO.map((si) => {
      const k = si.key as StatKey, own = s.own?.[k] ?? 0, add = b.add[k] ?? 0, tot = Math.min(EFFECTIVE_STAT_MAX, own + add);
      return `<tr class="${add ? 'up' : ''}"><th>${si.name}</th><td>${own}</td><td class="ai-add">${add ? `+${add}` : '—'}</td><td><b>${tot}</b><small>/${add ? EFFECTIVE_STAT_MAX : 99}</small></td><td class="ai-from">${add ? `${b.from[k]} × ${Math.round(b.pct * 100)}%` : ''}</td></tr>`;
    }).join('');
    const box = document.createElement('div');
    box.className = 'tut-modal aura-modal';
    box.innerHTML = `<div class="panel aura-sheet" style="--rc:${RARITY_COLOR[er]};--ec:${ELEMENT_COLOR[String(ae.element)] ?? '#8a9bbd'}">
      <div class="ai-head"><div class="ai-cards"><div class="ai-carrier">${this.mug(p.id, 64)}<small>${esc(p.name)}</small></div><i class="ai-link">${b.bond ? '♥' : '✦'}</i><div class="ai-aura t-${isHero(this.save, ae.id) ? 'heroe' : er}">${this.mug(ae.id, 64)}<small>${esc(ae.name)}</small></div></div>
        <div><h2>${tr('Aura: {aeName}', { aeName: esc(ae.name) })}</h2><div class="sq-tags">${this.rar(ae)} ${this.elem(ae)} <span class="pos">${esc(ae.teams.slice(0, 2).map(teamLabel).join(' · '))}</span></div>
        <div class="ai-pct${b.bond ? ' bond' : ''}">${tr('{x1} de {x2}', { x1: b.bond ? `♥ Compatibles (${esc(BOND_KIND_LABEL[b.bond.kind])}): <b>${Math.round(BOND_PCT * 100)}%</b>` : `Aura normal: <b>${Math.round(AURA_PCT * 100)}%</b>`, x2: b.keys.length >= 7 ? `<b>${tr('todas')}</b> ${tr('sus estadísticas (Aura legendaria)')}` : tr('sus tres mejores estadísticas') })}</div>
        ${b.bond ? `<p class="note">${esc(b.bond.reason)}</p>` : `<p class="note">${tr('Sin vínculo especial con {pName}. Un compañero de historia, familia o técnica conjunta daría {x1}%.', { pName: esc(p.name), x1: Math.round(BOND_PCT * 100) })}</p>`}</div></div>
      <div class="ai-cols"><div><h3>${tr('Estadísticas de {pName}', { pName: esc(p.name) })}</h3><table class="ai-table"><tr><th></th><th>${tr('Propia')}</th><th>${tr('Aura')}</th><th>${tr('Total')}</th><th></th></tr>${rows}</table>
        <p class="note">${tr('Bonificación = estadística del Aura × {x1}%, redondeada. Lo propio sigue en 99 como máximo; con el Aura, hasta {EFFECTIVE_STAT_MAX}.', { x1: Math.round(b.pct * 100), EFFECTIVE_STAT_MAX })}</p></div>
        <div class="stat-radar">${s.own ? statRadar(s.own, STAT_SHORT, RARITY_COLOR[effectiveRarity(this.save, p)], s.add) : ''}</div></div>
      <h3>${tr('✦ Técnicas heredadas')}</h3><div class="ai-techs">${inh.length ? inh.map((t) => `<span class="ai-tech">${this.icon(ICON.manual[t.type], 1)} ${esc(tTech(t.name))} <small>${tr('{x1} · {x2} · poder {power}', { x1: TYPE_LABEL[t.type], x2: esc(String(t.element ?? '')), power: t.power })}</small></span>`).join('') : `<span class="note">${tr('Ninguna nueva: ya conoce todas las de su Aura.')}</span>`}</div>
      <p class="note">${tr('La primera empieza la partida en una ranura extra de Aura; la segunda puede aprenderse al subir de nivel. Golpean al {x1}% (son una técnica activa de más). No sustituyen a las suyas y desaparecen si quitas el Aura.', { x1: Math.round(AURA_TECH_DAMAGE * 100) })}</p>
      <h3>${tr('{x1} Afinidad de {x2}', { x1: elementIcon(String(ae.element), 18), x2: esc(String(ae.element)) })}</h3><p class="note">${tr('Las técnicas de {pName} de elemento {x1} (también las heredadas) hacen <b>+{x2}%</b> de daño. {pName} sigue siendo de {x3} para todo lo demás.', { pName: esc(p.name), x1: esc(String(ae.element)), x2: Math.round(AURA_ELEMENT_BONUS * 100), x3: esc(tEl(String(p.element))) })}</p>
      ${joint.length ? `<h3>${tr('🔗 Técnicas conjuntas')}</h3><div class="ai-techs">${joint.map((c) => `<span class="ai-tech${c.ready ? ' ready' : ''}"><b>${esc(tTech(c.combo.name))}</b> <small>${c.ready ? tr('¡disponible con este equipo!') : `falta: ${esc(c.missing.join(', '))}`}</small></span>`).join('')}</div>` : ''}
      <div class="tut-nav"><button class="btn small blue" id="aiclose">${tr('Cerrar')}</button><span class="spacer"></span><button class="btn small blue" id="aichange">${tr('Cambiar Aura')}</button><button class="btn small" id="airemove">${tr('Quitar Aura')}</button></div></div>`;
    document.body.appendChild(box);
    const shut = () => box.remove();
    box.addEventListener('click', (e) => { if (e.target === box) shut(); });
    box.querySelector('#aiclose')!.addEventListener('click', shut);
    box.querySelector('#airemove')!.addEventListener('click', () => { removeAura(this.save, p.id); this.persist(); sfx('click'); shut(); this.toast(tr('{aeName} ya no es el Aura de {pName}', { aeName: ae.name, pName: p.name })); this.captainSelect(); });
    box.querySelector('#aichange')!.addEventListener('click', () => { shut(); this.startAuraPick(p.id); });
  }

  /** v1.5: highest effective stat among all carriers (achievements 110 / 120) */
  private auraMaxStat() {
    let best = 0;
    for (const k of Object.keys(this.save.auras ?? {})) {
      const p = this.byId.get(Number(k));
      const e = p?.stats ? this.statSplit(p).eff : null;
      if (e && this.auraEntryOf(p!.id)) best = Math.max(best, ...Object.values(e));
    }
    return best;
  }

  /** 1.75 (author): «¡Gracias por ser más de 50 jugando!» — the Banner de agradecimiento and the code GRACIAS, shown once. */
  private thanksNotice() {
    if (document.querySelector('.thanks-notice')) return;
    const stars = bannerPool(this.m.roster, 'evento').filter((p) => p.exclusive);
    const box = document.createElement('div');
    box.className = 'tut-modal thanks-notice';
    box.innerHTML = `<div class="panel"><div class="th-big">♥</div><h2>${tr('¡Gracias por ser más de 50 personas jugando!')}</h2>
      <p>${tr('Para celebrarlo abrimos el <b>Banner de agradecimiento</b> durante {days} días: Ataque a los Titanes, Los Siete Pecados Capitales y Axel Encapuchado, solo aquí.', { days: THANKS_EVENT.days })}</p>
      <div class="th-row">${stars.map((p) => this.mug(p.id, 44)).join('')}</div>
      <p>${tr('Se tira con <b>fichas de evento</b>: cada partida en <b>Rango S o X</b> te da tantas como fichas normales. {cost} la tirada, {multiCost} el ×10.', { cost: THANKS_EVENT.cost, multiCost: THANKS_EVENT.multiCost })}</p>
      <p>${tr('Y un regalo: canjea el código')}</p><div class="th-code">${tr('GRACIAS')}</div><p>${tr('para un <b>×10 gratis</b> del banner y <b>10.000 monedas</b>.')}</p>
      <div class="tut-nav"><button class="btn small blue" id="thclose">${tr('Cerrar')}</button><span class="spacer"></span><button class="btn small blue" id="thcode">${tr('Canjear código')}</button><button class="btn" id="thgo">${tr('Ir al banner')}</button></div></div>`;
    const done = () => { box.remove(); this.save.thanksSeen = true; this.persist(); };
    box.querySelector('#thclose')!.addEventListener('click', done);
    box.querySelector('#thcode')!.addEventListener('click', () => { done(); this.codesModal(); });
    box.querySelector('#thgo')!.addEventListener('click', () => { done(); this.gachaBanner = 'evento'; this.gacha(); });
    document.body.appendChild(box);
    sfx('legend');
  }

  /** v1.5 (author): the first visit to Mi Equipo explains Auras in four short pages; never again after closing it. */
  private auraIntro() {
    if (document.querySelector('.aura-intro')) return;
    const pages = [
      { ic: '✦', h: tr('¡Nuevo: Auras!'), p: `${tr('Cada plaza de tu equipo tiene ahora una <b>{x1}</b> {x2} <b>{x3}</b>. Ahí pones a otro futbolista de tu colección para que apoye al de la plaza. El Aura no juega: lo potencia.', { x1: tr('carta pequeña'), x2: tr('debajo: su'), x3: tr('Aura') })}`,
        li: [`${tr('Solo pueden ser Aura los <b>Legendarios, Míticos y Leyendas</b>.')}`, tr('Cualquier futbolista puede llevar una, también un Común.'), tr('Una por futbolista. No se gasta nada: tu colección no cambia.')] },
      { ic: '▲', h: tr('Estadísticas hasta 120'), p: `${tr('El Aura suma el <b>{x1}%</b> {x2} <b>{x3}</b> a las mismas del portador.', { x1: Math.round(AURA_PCT * 100), x2: tr('de sus'), x3: tr('tres mejores estadísticas') })}`,
        li: [`${tr('Ejemplo: Tiro 90 + Aura con Tiro 95 » 90 + 14 = <b>104</b>.')}`, `${tr('Lo propio sigue en 99 como máximo; con el Aura, hasta <b>120</b>, y en el combate se nota.')}`, `${tr('En el radar, lo que aporta el Aura se ve en <b style="color:#7ff6ff">cian</b>.')}`] },
      { ic: '♥', h: `Compatibles: ${Math.round(BOND_PCT * 100)}%`, p: `${tr('Si los dos tienen historia (técnica conjunta, amistad, familia o rivalidad), el Aura da el <b>{x1}%</b>{x2} <b>♥</b>.', { x1: Math.round(BOND_PCT * 100), x2: tr('. Al elegir, los compatibles salen primero con') })}`,
        li: [tr('Axel y Shawn, Mark y Nathan, Jude y Celia, Arion y Riccardo...'), tr('Estar en el mismo equipo no basta.')] },
      { ic: '⚡', h: tr('Técnicas y elemento'), p: `${tr('El portador hereda <b>{x1}</b> del Aura: una empieza la partida en una ranura extra y la otra llega como carta al subir de nivel. No sustituyen a las suyas.', { x1: tr('dos técnicas') })}`,
        li: [`${tr('Sus técnicas del elemento del Aura hacen <b>+{x1}%</b>.', { x1: Math.round(AURA_ELEMENT_BONUS * 100) })}`, `${tr('Con el Aura puede lanzar <b>{x1}</b>: Axel con Shawn de Aura, Fuego cruzado.', { x1: tr('técnicas conjuntas') })}`, `<b>${tr('Cómo equiparla:')}</b> ${tr('toca «+ AURA» y elige en tu colección, o arrastra la carta encima.')}`] },
    ];
    let i = 0;
    const box = document.createElement('div');
    box.className = 'tut-modal aura-intro';
    const close = () => {
      box.remove();
      this.save.auraIntroSeen = true; this.persist();
      // point at the first empty socket so the next step is obvious
      const s = document.querySelector<HTMLElement>('.aura-mini.empty');
      if (s) { s.scrollIntoView({ behavior: 'smooth', block: 'center' }); s.classList.add('picking'); window.setTimeout(() => s.classList.remove('picking'), 2400); }
    };
    const draw = () => {
      const pg = pages[i];
      box.innerHTML = `<div class="panel aura-intro-card"><div class="ain-ic">${pg.ic}</div><h2>${pg.h}</h2><p>${pg.p}</p><ul>${pg.li.map((x) => `<li>${x}</li>`).join('')}</ul>
        <div class="ain-dots">${pages.map((_, k) => `<i class="${k === i ? 'on' : ''}"></i>`).join('')}</div>
        <div class="tut-nav">${i ? `<button class="btn small blue" id="ainback">${tr('‹ Atrás')}</button>` : '<button class="btn small blue" id="ainskip">Saltar</button>'}<span class="spacer"></span>
        <button class="btn" id="ainnext">${i < pages.length - 1 ? tr('Siguiente ›') : tr('¡A equipar!')}</button></div></div>`;
      box.querySelector('#ainnext')!.addEventListener('click', () => { if (i < pages.length - 1) { i++; sfx('click'); draw(); } else close(); });
      box.querySelector('#ainback')?.addEventListener('click', () => { i--; sfx('click'); draw(); });
      box.querySelector('#ainskip')?.addEventListener('click', close);
    };
    draw();
    document.body.appendChild(box);
  }

  /** v1.5: «¡LOGRO!» banner: medal of its tier (bronze 10, silver 20, gold 50 fichas), the name and how many more there are. */
  private achPop(labels: string[], tokens: number) {
    document.querySelector('.ach-pop')?.remove();
    const tier = tokens >= 50 ? 'g' : tokens >= 20 ? 's' : 'b';
    const el = document.createElement('button');
    el.className = `ach-pop t-${tier}`;
    el.innerHTML = `<span class="ach-medal">🏆</span><span class="ach-tx"><small>${tr('¡LOGRO CONSEGUIDO!')}</small><b>${esc(labels[0])}</b>${labels.length > 1 ? `<em>${tr('y {x1} más · recógelos en Recompensas', { x1: labels.length - 1 })}</em>` : `<em>${tr('Recógelo en Recompensas')}</em>`}</span><i class="ach-shine"></i>`;
    el.addEventListener('click', () => { el.remove(); this.missions('logro'); });
    document.body.appendChild(el);
    sfx('legend');
    window.setTimeout(() => el.classList.add('out'), 4200);
    window.setTimeout(() => el.remove(), 4700);
  }

  private startAuraPick(carrierId: number) {
    this.auraPick = carrierId;
    this.squadPicked = false;
    this.squadFilter = { ...this.squadFilter, rarity: '' };
    this.captainSelect();
    document.querySelector('.sq-picker')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /** Equips (from a tap in the collection or a drop on the socket) and tells what happened. */
  private tryEquipAura(carrierId: number, auraId: number) {
    const p = this.byId.get(carrierId), ae = this.byId.get(auraId);
    if (!p || !ae) return false;
    const r = equipAura(this.save, p, ae, this.byId); // 1.8: never the same character twice
    if (!r.ok) { this.toast(r.why, 3500); sfx('error'); return false; }
    this.persist();
    const b = auraBonus(this.save, p.id, ae);
    sfx(b.bond ? 'legend' : 'powerup');
    if (b.bond) confetti(18);
    this.toast(tr('{aeName} es el Aura de {pName}{x1}{x2}{x3}', { aeName: ae.name, pName: p.name, x1: b.bond ? tr(' · ♥ ¡compatibles! 20%') : ' · 15%', x2: r.leftSquad ? tr(' (sale del equipo)') : '', x3: r.movedFrom !== null ? ` (deja a ${this.byId.get(r.movedFrom)?.name ?? tr('su portador')})` : '' }), 3500);
    this.auraPick = null;
    this.save.achAura = { ...(this.save.achAura ?? {}), equipped: true, bond: this.save.achAura?.bond || !!b.bond };
    return true;
  }

  /** 1.76 (author): the five saved teams of Mi Equipo — captain portrait, name and size; the open one has its name field. */
  private teamBar() {
    const list = savedSquads(this.save), on = this.save.activeSquad ?? 0;
    return `<div class="team-bar">${list.map((q, i) => {
      const ids = i === on ? squadOf(this.save, this.byId).map((p) => p.id) : q.squad.filter((id) => this.byId.has(id) && this.owned(id));
      return `<button class="team-tab${i === on ? ' on' : ''}" data-team="${i}">${ids[0] !== undefined ? this.mug(ids[0], 32 as 64) : '<span class="team-empty">+</span>'}
        <span><b>${esc(q.name)}</b><small>${ids.length}/${SQUAD_SIZE}</small></span></button>`;
    }).join('')}<label class="team-name">✎ <input id="tmname" maxlength="16" value="${esc(list[on].name)}" aria-label="${tr('Nombre del equipo')}"></label></div>`;
  }

  /** "Mi Equipo": seven candidates (captain first), the captain's starting technique and the starting formation. */
  captainSelect(slot = this.squadSlot) {
    // only the very first time: a saved team switched to empty stays empty until the player fills it (★ Autocompletar)
    if (!this.save.squads && !this.save.squad.length && this.unlockedRoster().length) { fillSquad(this.save, this.m.roster); this.persist(); }
    const squad = squadOf(this.save, this.byId);
    this.captainId = squad[0]?.id ?? null;
    this.squadSlot = Math.max(0, Math.min(slot, squad.length < SQUAD_SIZE ? squad.length : SQUAD_SIZE - 1));
    const cap = squad[0];
    const cur = (this.save.formation as FormationId) in FORMATIONS ? this.save.formation as FormationId : 'equilibrada';
    setMusicContext('map');
    const comboOf = new Map<string, string>();
    const auraNames = squad.map((x) => this.auraEntryOf(x.id)?.name).filter((x): x is string => !!x);
    for (const c of squadCombos(squad, auraNames)) if (c.ready) for (const n of c.combo.needs) if (!comboOf.has(n.player)) comboOf.set(n.player, c.combo.name);
    // a carrier also shows the combination his Aura takes part in
    for (const x of squad) { const an = this.auraEntryOf(x.id)?.name; if (an && comboOf.has(an) && !comboOf.has(x.name)) comboOf.set(x.name, comboOf.get(an)!); }
    const slots = Array.from({ length: SQUAD_SIZE }, (_, i) => {
      const p = squad[i];
      const editing = i === this.squadSlot ? ' editing' : '';
      if (!p) return `<button class="sq-slot empty${editing}" data-slot="${i}"><span class="sq-plus">+</span><small>${i === 0 ? 'Capitán' : tr('Plaza libre')}</small><em>${tr('Arrastra aquí')}</em></button>`;
      // Fix 1.32 (author's choice): the slot keeps its radar and techniques, in a frame of its rarity, and can be dragged
      const er = effectiveRarity(this.save, p), split = p.stats ? this.statSplit(p) : null, st = split?.own ?? null;
      const ae = this.auraEntryOf(p.id), inh = ae ? inheritedTechs(p, ae) : [];
      return `<div class="sq-slot ccs${ae ? ' has-aura' : ''} t-${isHero(this.save, p.id) ? 'heroe' : er} rs-${isHero(this.save, p.id) ? 'heroe' : er}${editing}${i === 0 ? ' cap' : ''}${isHero(this.save, p.id) ? ' hero' : ''}${this.squadLanded === i ? ' landed' : ''}" data-slot="${i}" data-drag="${p.id}" style="--rc:${RARITY_COLOR[er]};--ec:${ELEMENT_COLOR[String(p.element)] ?? '#8a9bbd'}">
        ${i === 0 ? '<span class="captain-badge">C</span>' : `<button class="sq-act" data-captain="${p.id}" title="${tr('Hacer capitán')}">★</button>`}
        <button class="sq-act x" data-remove="${p.id}" title="${tr('Quitar')}">✕</button>
        <div class="sq-head">${this.egMedal(p.id)}<div class="sq-mug">${this.mug(p.id, 64)}${st ? `<span class="sq-ovr${ae ? ' aura' : ''}" title="${tr('Media{x1}', { x1: ae ? tr(' con su Aura') : '' })}">${statMean(split!.eff!)}</span>` : ''}</div></div>
        <b class="sq-name">${esc(p.name)}</b>
        <div class="sq-tags"><span class="pos">${POS_LABEL[p.position] ?? p.position}</span>${this.elem(p)}${this.rar(p)}</div>
        ${comboOf.get(p.name) ? `<span class="sq-combo" title="${tr('Técnica combinada: {x1}', { x1: esc(comboOf.get(p.name)!) })}">🔗 ${esc(comboOf.get(p.name)!)}</span>` : ''}
        ${st ? `<div class="sq-radar">${statRadar(st, STAT_SHORT, RARITY_COLOR[er], split!.add)}</div>` : ''}
        <div class="sq-techs"><small>${tr('TÉCNICA INICIAL')}</small>${p.techniques.slice(0, 5).map((t, ti) => { const usable = this.canStartWith(p, ti), on = this.startOf(p) === ti;
          return `<button class="sq-tech${on ? ' on' : ''}" data-start="${p.id}:${ti}" ${usable ? '' : 'disabled'} title="${esc(tTech(t.name))}${usable ? (on ? tr(' · empieza con esta') : tr(' · pulsa para empezar con esta')) : t.type === 'talento' ? ' · talento pasivo: siempre activo' : tr(' · bloqueada: {x1} en la tienda de técnicas', { x1: isLocked(t) ? tr('solo se aprende comprándola') : tr('aparece en partida desde el nivel {x1}; cómprala para empezar con ella', { x1: Math.floor(t.unlockLevel / 6) }) })}">${this.icon(ICON.manual[t.type], 1)}<span>${esc(tTech(t.name))}</span>${on ? '<em>★</em>' : ''}</button>`; }).join('')}</div>
        ${inh.length ? `<div class="sq-techs aura-techs"><small>${tr('✦ DEL AURA')}</small>${inh.map((t) => `<span class="sq-tech aura" title="${tr('{tName} · heredada de {x1}', { tName: esc(tTech(t.name)), x1: esc(ae!.name) })}">${this.icon(ICON.manual[t.type], 1)}<span>${esc(t.name)}</span></span>`).join('')}</div>` : ''}
        ${this.auraMini(p)}
        <i class="cc-sweep"></i><i class="cc-foil"></i><i class="cc-sparks"></i><i class="cc-bevel"></i><i class="cc-crown"></i></div>`;
    }).join('');
    this.show(`<div class="screen">${this.titlebar(tr('Mi Equipo'), 'Menú')}
      ${this.squadSynergyPanel(squad)}
      ${this.benchPanel()}
      <div class="panel"><div class="note">${tr('Tienes <b>5 equipos</b>: cambia entre ellos arriba. Elige <b>7 candidatos</b>. Empiezas solo con el <b>capitán</b>; al subir de nivel podrás fichar a los otros seis (máximo {MAX_TEAM} en el campo). Pulsa un futbolista de tu colección para añadirlo o quitarlo, pulsa una plaza para cambiarla, o arrastra para colocar e intercambiar. Se guarda solo.', { MAX_TEAM })}</div>
        ${this.teamBar()}
        <div class="squad-row">${slots}</div></div>
      <div class="panel sq-picker"><div class="sq-pick-head"><h3>${tr('Tu colección')}</h3>
          <span class="note">${this.auraPick !== null ? `<span class="aura-pick-note">${tr('{x1} <b>Aura de {x2}</b>{x3}', { x1: tr('✦ Elige el'), x2: esc(this.byId.get(this.auraPick)?.name ?? ''), x3: tr(': un Legendario, Mítico o Leyenda (♥ = compatible, 20%)') })}</span> · <button class="linkbtn" id="aucancel">${tr('cancelar')}</button>` : this.squadPicked ? `${tr('Elige quién va a la <b>{x1}</b> ·', { x1: tr('plaza {x1}{x2}', { x1: this.squadSlot + 1, x2: this.squadSlot === 0 ? ' (capitán)' : '' }) })} <button class="linkbtn" id="sqcancel">${tr('cancelar')}</button>` : squad.length < SQUAD_SIZE ? tr('Pulsa un futbolista para añadirlo o quitarlo · o cógelo y arrástralo a una plaza') : tr('Equipo completo: pulsa una plaza para cambiarla, o un futbolista del equipo para quitarlo')}</span>
          <span class="spacer"></span><button class="btn small" id="sqauto" title="${tr('Rellena las plazas libres con tus mejores futbolistas')}">${tr('★ Autocompletar')}</button><button class="btn small blue" id="sqclear" title="${tr('Deja solo al capitán')}">${tr('Vaciar')}</button></div>
        <div class="filters"><input id="sqq" placeholder="${tr('Buscar nombre o equipo')}" value="${esc(this.squadFilter.q)}">
          <div class="sq-rars" id="sqr" title="${tr('Rareza con la que salió (aunque haya ascendido)')}">${RARITY_ORDER.map((r) => `<button class="rar ${r}${this.squadFilter.rarity.split(',').includes(r) ? ' on' : ''}" data-rar="${r}">${RARITY_LABEL[r]}</button>`).join('')}</div>
          <select id="sqp"><option value="">${tr('Posición')}</option>${Object.entries(POS_LABEL).map(([k, v]) => `<option value="${k}" ${this.squadFilter.pos === k ? 'selected' : ''}>${v}</option>`).join('')}</select>
          <select id="sqe"><option value="">${tr('Elemento')}</option>${['Fuego', 'Aire', 'Bosque', 'Montaña', 'Neutro'].map((e) => `<option value="${e}" ${this.squadFilter.el === e ? 'selected' : ''}>${e}</option>`).join('')}</select>
          <select id="sqs">${[['media', tr('Ordenar: media')], ['rareza', tr('Ordenar: rareza')], ['nombre', tr('Ordenar: nombre')]].map(([v, l]) => `<option value="${v}" ${this.squadFilter.sort === v ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
        <div class="grid" id="sqgrid" style="margin-top:10px"></div></div>
      ${cap ? `<div class="panel detail" style="--rc:${RARITY_COLOR[cap.rarity]}"><div class="art">${this.mug(cap.id, 128)}${charCanvas(cap.id, 3, 12)}</div><div>
        <h3>${tr('Capitán: {capName} {rar} {elem}', { capName: esc(cap.name), rar: this.rar(cap), elem: this.elem(cap) })}</h3>
        <div class="note" style="margin-top:6px">${tr('★ La <b>técnica inicial</b> de cada futbolista se elige en su plaza, arriba: pulsa la técnica con la que quieres que empiece.')}</div>
        <h3 style="margin-top:10px">${tr('Formación inicial')}</h3><div class="formation-pick">${FORMATION_ORDER.map((f) => this.formationCard(f, f === cur)).join('')}</div>
        <p style="text-align:right"><button class="btn big" id="next">${tr('Elegir arena ▶')}</button></p></div></div>` : (this.unlockedRoster().length ? `<div class="panel"><div class="note">${tr('Este equipo está vacío: elige a tus futbolistas en tu colección o pulsa <b>★ Autocompletar</b>.')}</div></div>` : `<div class="panel"><div class="note">${tr('Aún no tienes futbolistas: consíguelos en Fichajes.')}</div></div>`)}
</div>`);
    this.squadGrid();
    this.on('[data-back]', 'click', () => this.mainMenu());
    this.on('[data-slot]', 'click', (e, el) => {
      if ((e.target as HTMLElement).closest('.sq-act, .sq-tech, .aura-mini') || performance.now() - this.dragEndedAt < 300) return;
      const i = Number(el.dataset.slot);
      // Fix 1.32: a slot is «picked» on purpose; clicking it again unpicks it
      this.squadPicked = !(this.squadPicked && this.squadSlot === i);
      this.captainSelect(i);
      if (this.squadPicked) document.querySelector('.sq-picker')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    this.squadDrag(); // Fix 1.32: pick a card up and move it (slots and collection)
    // 1.76 (author): five teams to rotate between; the open one can be renamed
    this.on('[data-team]', 'click', (_e, el) => {
      const i = Number(el.dataset.team);
      if (i === (this.save.activeSquad ?? 0)) return;
      switchSquad(this.save, i); this.persist(); sfx('powerup'); this.squadPicked = false; this.auraPick = null;
      this.toast(`${savedSquads(this.save)[i].name}: ${this.save.squad.length ? 'cargado' : tr('vacío, elige a tus futbolistas')}`);
      this.captainSelect(0);
    });
    document.getElementById('tmname')?.addEventListener('change', (e) => { renameSquad(this.save, this.save.activeSquad ?? 0, (e.target as HTMLInputElement).value); this.persist(); this.captainSelect(); });
    this.squadLanded = -1;
    // v1.5: the Aura socket: an equipped Aura opens its sheet, an empty one starts choosing from the collection
    this.on('[data-aura-slot]', 'click', (e, el) => {
      e.stopPropagation();
      if (performance.now() - this.dragEndedAt < 300) return;
      const id = Number(el.dataset.auraSlot);
      if (el.dataset.auraOpen) { this.auraInfo(id); return; }
      if (this.auraPick === id) { this.auraPick = null; this.captainSelect(); return; }
      this.startAuraPick(id);
    });
    document.getElementById('aucancel')?.addEventListener('click', () => { this.auraPick = null; this.captainSelect(); });
    this.on('[data-go-coaches]', 'click', () => this.coachesScreen('squad')); // pre-2.0: the bench
    if (!this.save.auraIntroSeen && squad.length) this.auraIntro(); // v1.5 (author): how Auras work, the first time
    document.getElementById('sqcancel')?.addEventListener('click', () => { this.squadPicked = false; this.captainSelect(); });
    document.getElementById('sqauto')?.addEventListener('click', () => {
      // the best owned footballers by their real mean (ascension, HÉROE and training included) fill the free slots
      const ids = squadOf(this.save, this.byId).map((p) => p.id);
      const pool = this.unlockedRoster().filter((p) => !ids.includes(p.id)).sort((a, b) => this.meanOf(b) - this.meanOf(a));
      const taken = () => [...ids, ...ids.map((c) => this.save.auras?.[String(c)]).filter((a): a is number => a !== undefined)].map((x) => this.byId.get(x)!).filter(Boolean);
      for (const p of pool) { if (ids.length >= SQUAD_SIZE) break; if (clashWith(p, taken()) || carrierOf(this.save, p.id) !== null) continue; ids.push(p.id); } // 1.8: one of each character
      setSquad(this.save, ids); this.persist(); sfx('powerup'); this.squadPicked = false; this.captainSelect();
    });
    document.getElementById('sqclear')?.addEventListener('click', (e) => this.armed(e.currentTarget as HTMLElement, () => {
      clearSquad(this.save, this.byId); // 1.76: the ones who leave take their Auras off
      this.persist(); sfx('click'); this.squadPicked = false; this.captainSelect(1);
    }));
    this.on('[data-captain]', 'click', (_e, el) => { makeCaptain(this.save, this.byId, Number(el.dataset.captain)); this.persist(); sfx('powerup'); this.captainSelect(0); });
    this.on('[data-remove]', 'click', (_e, el) => { removeFromSquad(this.save, this.byId, Number(el.dataset.remove)); this.persist(); this.captainSelect(); });
    this.on('.fcard', 'click', (_e, el) => { this.save.formation = el.dataset.f!; this.persist(); this.captainSelect(); });
    this.on('[data-start]', 'click', (e, el) => { e.stopPropagation(); this.setStart(el.dataset.start!); this.captainSelect(this.squadSlot); });
    const refilter = () => {
      const v = (id: string) => (document.getElementById(id) as HTMLInputElement | HTMLSelectElement).value;
      // 1.88 (author): several base rarities at once; a footballer counts by the rarity he came out with, not the one he ascended to
      const rars = [...document.querySelectorAll<HTMLElement>('#sqr [data-rar].on')].map((b) => b.dataset.rar).join(',');
      this.squadFilter = { q: v('sqq'), rarity: rars, pos: v('sqp'), el: v('sqe'), sort: v('sqs') || 'media' };
      this.squadLimit = 48;
      this.squadGrid();
    };
    document.getElementById('sqq')!.addEventListener('input', refilter);
    document.querySelectorAll<HTMLElement>('#sqr [data-rar]').forEach((b) => b.addEventListener('click', () => { b.classList.toggle('on'); refilter(); }));
    document.getElementById('sqp')!.addEventListener('change', refilter);
    document.getElementById('sqe')!.addEventListener('change', refilter);
    document.getElementById('sqs')!.addEventListener('change', refilter);
    document.getElementById('next')?.addEventListener('click', () => this.mapSelect());
  }

  private dragEndedAt = 0;
  private squadLanded = -1;
  private dragReady = false;
  /**
   * Fix 1.32: cards of Mi Equipo can be picked up for real: with the mouse (or a pen) a card lifts, follows the pointer
   * leaning with the movement, the slot under it lights up, and on release it flies into that slot (swapping when it
   * was in another one); dropped elsewhere it flies back. A card taken out of the slots and dropped outside them leaves
   * the squad. Touch keeps the taps (dragging would fight the page scroll).
   */
  private squadDrag() {
    if (this.dragReady) return;
    this.dragReady = true;
    type St = { id: number; el: HTMLElement; x0: number; y0: number; pid: number; fromSlot: number; ghost?: HTMLElement; over?: HTMLElement | null; lx: number; tilt: number; auraOk: boolean; snapped: boolean };
    let st: St | null = null;
    let preview: HTMLElement | null = null;
    // v1.5: the Aura sockets are small: within this many pixels of one, the card is pulled into it (magnet)
    const MAGNET = 26;
    const socketNear = (x: number, y: number) => {
      let best: HTMLElement | null = null, bd = Infinity;
      for (const s of document.querySelectorAll<HTMLElement>('.squad-row [data-aura-slot]')) {
        const r = s.getBoundingClientRect();
        const ddx = Math.max(r.left - x, 0, x - r.right), ddy = Math.max(r.top - y, 0, y - r.bottom), d = Math.hypot(ddx, ddy);
        if (d <= MAGNET && d < bd) { bd = d; best = s; }
      }
      return best;
    };
    /** where the ghost goes to sit inside a socket: centred on it and scaled to its size (transform from its start box) */
    const fitInto = (g: HTMLElement, to: DOMRect, extra = 1) => {
      const x0 = parseFloat(g.style.left), y0 = parseFloat(g.style.top), w = g.offsetWidth, h = g.offsetHeight;
      const k = Math.min(to.width / w, to.height / h) * extra;
      return `translate(${(to.left + to.width / 2 - (x0 + w / 2)).toFixed(1)}px, ${(to.top + to.height / 2 - (y0 + h / 2)).toFixed(1)}px) rotate(0deg) scale(${k.toFixed(3)})`;
    };
    this.root.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'touch' || e.button !== 0) return;
      const t = e.target as HTMLElement;
      const el = t.closest<HTMLElement>('[data-drag]');
      if (!el || t.closest('.sq-act, button, select, input')) return;
      const slot = el.closest<HTMLElement>('[data-slot]');
      const dp = this.byId.get(Number(el.dataset.drag));
      st = { id: Number(el.dataset.drag), el, x0: e.clientX, y0: e.clientY, pid: e.pointerId, fromSlot: slot ? Number(slot.dataset.slot) : -1, lx: e.clientX, tilt: 0,
        auraOk: !!dp && canBeAura(this.save, dp) && this.save.captainId !== dp.id, snapped: false };
    });
    window.addEventListener('pointermove', (e) => {
      if (!st || e.pointerId !== st.pid) return;
      const dx = e.clientX - st.x0, dy = e.clientY - st.y0;
      if (!st.ghost) {
        if (Math.hypot(dx, dy) < 7) return;
        const card = st.el.matches('.pcard') ? st.el : st.el.querySelector<HTMLElement>('.pcard') ?? st.el;
        const r = card.getBoundingClientRect();
        const g = card.cloneNode(true) as HTMLElement;
        g.classList.add('drag-ghost');
        Object.assign(g.style, { width: `${r.width}px`, left: `${r.left}px`, top: `${r.top}px` });
        document.body.appendChild(g);
        st.ghost = g;
        st.el.classList.add('drag-src');
        document.body.classList.add('dragging-card', st.auraOk ? 'drag-aura-ok' : 'drag-aura-no'); // v1.5: sockets show if it fits
        sfx('click');
      }
      e.preventDefault();
      // the card leans towards where it is going, and settles when the pointer slows down
      st.tilt = st.tilt * 0.8 + Math.max(-14, Math.min(14, (e.clientX - st.lx) * 0.9)) * 0.2;
      st.lx = e.clientX;
      // v1.5: an Aura socket (under the pointer or within the magnet distance) wins over the slot itself
      const hit = document.elementFromPoint(e.clientX, e.clientY);
      const sock = hit?.closest<HTMLElement>('[data-aura-slot]') ?? socketNear(e.clientX, e.clientY);
      const under = sock ?? hit?.closest<HTMLElement>('[data-slot]') ?? null;
      const snap = !!sock && st.auraOk && Number(sock.dataset.auraSlot) !== st.id;
      if (snap !== st.snapped) { st.ghost.style.transition = 'transform .14s ease-out'; window.setTimeout(() => { if (st?.ghost) st.ghost.style.transition = ''; }, 150); st.snapped = snap; }
      if (snap) {
        // the card shrinks into the socket and the socket shows the Aura exactly as it will look once dropped
        // (portrait, name and percentage framed in the socket), so the fit is never in doubt
        st.ghost.style.transformOrigin = '50% 50%';
        st.ghost.style.transform = fitInto(st.ghost, sock!.getBoundingClientRect(), 1.15);
        const r = sock!.getBoundingClientRect();
        if (!preview || preview.dataset.for !== sock!.dataset.auraSlot) {
          preview?.remove();
          const p = this.byId.get(st.id)!, bond = bondOf(Number(sock!.dataset.auraSlot), p.id);
          preview = document.createElement('div');
          preview.dataset.for = sock!.dataset.auraSlot;
          preview.className = `aura-mini aura-preview t-${isHero(this.save, p.id) ? 'heroe' : effectiveRarity(this.save, p)}${bond ? ' bond' : ''}`;
          preview.style.cssText = `--rc:${RARITY_COLOR[effectiveRarity(this.save, p)]};--ec:${ELEMENT_COLOR[String(p.element)] ?? '#8a9bbd'}`;
          preview.innerHTML = `<span class="am-mug">${this.mug(p.id, 40)}</span><span class="am-txt"><small>${tr('SOLTAR')}</small><b>${esc(p.name.split(' ')[0])}</b><em>${bond ? '♥ ' : ''}+${Math.round((bond ? BOND_PCT : AURA_PCT) * 100)}%</em></span>`;
          document.body.appendChild(preview);
        }
        Object.assign(preview.style, { left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px` });
        st.ghost.style.opacity = '0.25';
      } else {
        preview?.remove(); preview = null;
        st.ghost.style.opacity = '';
        st.ghost.style.transformOrigin = '';
        st.ghost.style.transform = `translate(${dx}px, ${dy}px) rotate(${st.tilt.toFixed(1)}deg) scale(1.08)`;
      }
      st.ghost.classList.toggle('in-socket', snap);
      if (under !== st.over) {
        st.over?.classList.remove('drop', 'drop-bad');
        under?.classList.add(under.dataset.auraSlot && !snap ? 'drop-bad' : 'drop');
        st.over = under;
        if (under) sfx(under.dataset.auraSlot && !snap ? 'error' : 'click');
      }
    }, { passive: false });
    const end = (e: PointerEvent) => {
      if (!st || e.pointerId !== st.pid) return;
      const s0 = st; st = null;
      if (!s0.ghost) return; // no movement: it was a click
      this.dragEndedAt = performance.now();
      document.body.classList.remove('dragging-card', 'drag-aura-ok', 'drag-aura-no');
      preview?.remove(); preview = null;
      s0.over?.classList.remove('drop', 'drop-bad');
      const g = s0.ghost;
      const fly = (to: DOMRect | null, after: () => void) => {
        const r = g.getBoundingClientRect();
        if (to) {
          g.style.transition = 'transform .22s cubic-bezier(.2,.9,.3,1.2), opacity .22s';
          const base = { x: parseFloat(g.style.left), y: parseFloat(g.style.top) };
          g.style.transform = `translate(${to.left - base.x + (to.width - r.width) / 2}px, ${to.top - base.y}px) rotate(0deg) scale(1)`;
        } else { g.style.transition = 'transform .2s, opacity .2s'; g.style.opacity = '0'; }
        window.setTimeout(() => { g.remove(); after(); }, 220);
      };
      const inRow = !!document.elementFromPoint(e.clientX, e.clientY)?.closest('.squad-row');
      if (s0.over?.dataset.auraSlot) {
        const carrier = Number(s0.over.dataset.auraSlot);
        const okDrop = s0.auraOk && s0.id !== carrier;
        if (okDrop) {
          // it settles into the socket (centred, at the socket's size) and fades as the real small card appears there
          g.style.transformOrigin = '50% 50%';
          g.style.transition = 'transform .18s cubic-bezier(.2,.9,.3,1.1), opacity .18s .06s';
          g.style.transform = fitInto(g, s0.over.getBoundingClientRect(), 1);
          g.style.opacity = '0.2';
          window.setTimeout(() => {
            g.remove();
            s0.el.classList.remove('drag-src');
            if (this.tryEquipAura(carrier, s0.id)) this.auraLanded = carrier;
            this.captainSelect();
            this.auraLanded = null;
          }, 190);
        } else {
          fly(s0.el.getBoundingClientRect(), () => { s0.el.classList.remove('drag-src'); this.tryEquipAura(carrier, s0.id); this.captainSelect(); });
        }
      } else if (s0.over) {
        const slot = Number(s0.over.dataset.slot);
        const target = (s0.over.querySelector('.pcard') ?? s0.over).getBoundingClientRect();
        fly(target, () => {
          const clash = placeInSquad(this.save, this.byId, slot, s0.id);
          if (clash) { this.toast(tr('{x1} es el mismo personaje que {clashName}: no pueden estar los dos en tu equipo.', { x1: this.byId.get(s0.id)?.name ?? '', clashName: clash.name }), 3800); sfx('error'); this.captainSelect(); return; }
          this.persist(); sfx('powerup'); this.squadPicked = false; this.squadLanded = slot;
          this.captainSelect(slot);
        });
      } else if (s0.fromSlot >= 0 && !inRow && squadOf(this.save, this.byId).length > 1) {
        // a card taken out of the squad and dropped outside: it leaves
        fly(null, () => { removeFromSquad(this.save, this.byId, s0.id); this.persist(); sfx('click'); this.captainSelect(); });
      } else {
        fly(s0.el.getBoundingClientRect(), () => s0.el.classList.remove('drag-src'));
      }
    };
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
  }

  /** real stat mean of an owned footballer (0 when it has no stats) */
  private meanOf(p: RosterEntry) { const st = this.statsOf(p); return st ? statMean(st) : 0; }

  /** Owned players for the picker, redrawn alone so typing in the search box keeps its focus. */
  private squadGrid() {
    const box = document.getElementById('sqgrid');
    if (!box) return;
    const f = this.squadFilter, q = f.q.trim().toLowerCase();
    const inSquad = new Set(squadOf(this.save, this.byId).map((p) => p.id));
    const meanCache = new Map<number, number>();
    const mean = (p: RosterEntry) => { let v = meanCache.get(p.id); if (v === undefined) { v = this.meanOf(p); meanCache.set(p.id, v); } return v; };
    const rarSet = f.rarity ? new Set(f.rarity.split(',')) : null; // base rarity (p.rarity), never the ascended one
    const list = this.unlockedRoster().filter((p) => (!rarSet || rarSet.has(p.rarity)) && (!f.pos || p.position === f.pos) && (!f.el || String(p.element) === f.el)
      && (!q || p.name.toLowerCase().includes(q) || p.teams.some((t) => teamLabel(t).toLowerCase().includes(q))))
      .sort((a, b) => f.sort === 'nombre' ? a.name.localeCompare(b.name)
        : f.sort === 'rareza' ? RARITY_ORDER.indexOf(effectiveRarity(this.save, b)) - RARITY_ORDER.indexOf(effectiveRarity(this.save, a)) || mean(b) - mean(a)
        : mean(b) - mean(a) || a.name.localeCompare(b.name));
    const sq = squadOf(this.save, this.byId);
    const partners = new Map<string, string>();
    for (const c of squadCombos(sq, sq.map((x) => this.auraEntryOf(x.id)?.name).filter((x): x is string => !!x))) if (!c.ready && c.missing.length === 1) partners.set(c.missing[0], c.combo.name);
    // v1.5: while choosing an Aura, those who can be one come first (compatible ones before all), the rest greyed out
    const ap = this.auraPick;
    if (ap !== null) list.sort((a, b) => Number(canBeAura(this.save, b) && b.id !== ap) - Number(canBeAura(this.save, a) && a.id !== ap) || Number(!!bondOf(ap, b.id)) - Number(!!bondOf(ap, a.id)));
    const auraBadge = (p: RosterEntry) => {
      const c = carrierOf(this.save, p.id);
      if (ap !== null) return !canBeAura(this.save, p) || p.id === ap ? undefined : bondOf(ap, p.id) ? '♥ COMPATIBLE 20%' : c !== null ? tr('✦ AURA DE {x1}', { x1: (this.byId.get(c)?.name ?? '').split(' ')[0].toUpperCase() }) : '✦ AURA 15%';
      return c !== null ? tr('✦ AURA DE {x1}', { x1: (this.byId.get(c)?.name ?? '').split(' ')[0].toUpperCase() }) : undefined;
    };
    box.innerHTML = list.slice(0, this.squadLimit).map((p) => this.pcard(p, { sel: inSquad.has(p.id), badge: auraBadge(p) ?? (inSquad.has(p.id) ? tr('✔ EQUIPO') : partners.has(p.name) ? `🔗 ${partners.get(p.name)}` : undefined) })
      .replace('<div class="pcard', `<div data-drag="${p.id}" class="pcard${inSquad.has(p.id) ? ' in-squad' : ''}${ap !== null ? (canBeAura(this.save, p) && p.id !== ap ? ' aura-ok' : ' aura-no') : ''}${ap !== null && bondOf(ap, p.id) ? ' aura-bond' : ''}`)).join('')
      + (list.length > this.squadLimit ? `<button class="btn blue" id="sqmore">${tr('Mostrar más ({x1})', { x1: list.length - this.squadLimit })}</button>` : '')
      + (list.length ? '' : `<div class="note">${tr('Nadie coincide con el filtro.')}</div>`);
    mountPreviews();
    box.querySelectorAll<HTMLElement>('.pcard[data-id]').forEach((el) => {
      el.addEventListener('click', () => {
        if (performance.now() - this.dragEndedAt < 300) return; // the end of a drag is not a click
        // Fix 1.32: one click adds (first free slot, or the slot picked on purpose) or removes; a full squad asks for a slot
        const id = Number(el.dataset.id), squad = squadOf(this.save, this.byId);
        if (this.auraPick !== null) { // v1.5: choosing an Aura: the tap equips (or explains why not)
          if (this.tryEquipAura(this.auraPick, id)) this.captainSelect();
          return;
        }
        if (inSquad.has(id) && !this.squadPicked) {
          if (squad.length === 1) { this.toast(tr('Tu equipo necesita al menos al capitán')); sfx('error'); return; }
          removeFromSquad(this.save, this.byId, id); sfx('click');
        } else if (this.squadPicked || squad.length < SQUAD_SIZE) {
          const was = carrierOf(this.save, id); // v1.5: an Aura that joins the squad stops being an Aura: say so
          const clash = placeInSquad(this.save, this.byId, this.squadPicked ? this.squadSlot : squad.length, id);
          if (clash) { this.toast(tr('{x1} es el mismo personaje que {clashName}: no pueden estar los dos en tu equipo.', { x1: this.byId.get(id)?.name ?? '', clashName: clash.name }), 3800); sfx('error'); return; }
          sfx('powerup');
          if (was !== null) this.toast(tr('{x1} entra en el equipo y deja de ser el Aura de {x2}', { x1: this.byId.get(id)?.name ?? '', x2: this.byId.get(was)?.name ?? '' }), 3500);
        } else {
          this.toast(tr('Equipo completo: pulsa la plaza que quieres cambiar o quita a alguien')); sfx('error');
          document.querySelector('.squad-row')?.classList.add('ping'); window.setTimeout(() => document.querySelector('.squad-row')?.classList.remove('ping'), 700);
          return;
        }
        this.persist();
        this.squadPicked = false;
        const n = squadOf(this.save, this.byId).length;
        this.captainSelect(n < SQUAD_SIZE ? n : SQUAD_SIZE - 1);
      });
    });
    document.getElementById('sqmore')?.addEventListener('click', () => { this.squadLimit += 48; this.squadGrid(); });
  }

  private formationCard(f: FormationId, on: boolean) {
    const F = FORMATIONS[f];
    return `<button class="fcard${on ? ' on' : ''}" data-f="${f}">${FORMATION_ICON(f, 56)}<div><span class="fk">[${F.key}]</span> <b>${F.label}</b>
      <div class="note">${esc(F.description)}</div></div></button>`;
  }

  /** v1.7: the arena picked on the map path (the next one to beat by default) */
  private mapPick: string | null = null;

  /** v1.7: map path. The arenas as stops of a winding road, each one harder than the one before; a side panel shows the picked one. */
  mapSelect() {
    const maps = this.m.maps;
    const state = (mp: (typeof maps)[number]) => this.save.clearedMaps.includes(mp.id) ? 'cleared' : isMapUnlocked(mp, this.save) ? 'open' : 'locked';
    const next = maps.find((mp) => state(mp) === 'open');
    if (!this.mapPick || !maps.some((mp) => mp.id === this.mapPick)) this.mapPick = next?.id ?? maps[maps.length - 1]?.id ?? null;
    const cleared = maps.filter((mp) => state(mp) === 'cleared').length;
    // snake layout: rows left to right, then right to left; 2 per row on narrow screens
    const per = window.innerWidth < 620 ? 2 : maps.length > 8 ? 4 : 3;
    const rows = Math.ceil(maps.length / per);
    const pos = maps.map((_, i) => {
      const r = Math.floor(i / per), c = i % per;
      const col = r % 2 ? per - 1 - c : c;
      return { x: (col + 0.5) / per * 100, y: (r + 0.5) / rows * 100, r };
    });
    const road = pos.slice(1).map((b, k) => {
      const a = pos[k], mp = maps[k + 1];
      const ax = a.x * 10, ay = a.y * 10, bx = b.x * 10, by = b.y * 10;
      const d = a.r === b.r ? `M${ax} ${ay} C${(ax + bx) / 2} ${ay - 45} ${(ax + bx) / 2} ${by + 45} ${bx} ${by}`
        : `M${ax} ${ay} C${ax + (ax > 500 ? 1 : -1) * 150} ${ay} ${bx + (bx > 500 ? 1 : -1) * 150} ${by} ${bx} ${by}`;
      return `<path class="mp-seg ${state(mp)}" style="--tc:${this.tierColor(mp.tier ?? k + 2)}" d="${d}" vector-effect="non-scaling-stroke"/>`;
    }).join('');
    const nodes = maps.map((mp, i) => {
      const st = state(mp), done = this.save.clearedRanks[mp.id] ?? [];
      return `<button class="mp-node st-${st}${mp.id === next?.id ? ' st-next' : ''}${mp.id === this.mapPick ? ' sel' : ''}" data-pick="${mp.id}"
        style="left:${pos[i].x}%;top:${pos[i].y}%;--tc:${this.tierColor(mp.tier ?? i + 1)}" title="${esc(mp.name)}">
        <span class="mp-disc">${mp.minimapTexture ? `<img src="${mp.minimapTexture}" alt="" loading="lazy">` : ''}
          <i class="mp-num">${mp.tier ?? i + 1}</i>${st === 'locked' ? '<i class="mp-lock">🔒</i>' : st === 'cleared' ? '<i class="mp-ok">✔</i>' : ''}</span>
        <span class="mp-name">${esc(mp.name)}</span>
        <span class="mp-pips">${RANK_ORDER.map((id) => `<i class="${done.includes(id) ? 'on' : ''}"></i>`).join('')}</span></button>`;
    }).join('');
    const rk = this.save.difficulty;
    const zShut = !rankZOpen(serverNow());
    const ranks = RANK_ORDER.map((id) => {
      const R = RANKS[id], shut = id === 'Z' && zShut;
      return `<button class="rk4 r-${id}${id === rk ? ' on' : ''}${shut ? ' rk4-shut' : ''}" data-rank="${id}"${shut ? ` title="${tr('El Rango Z llega el martes a las 12:00')}"` : ''}><span class="rk4-l${id === 'Z' && !shut ? ' rk4-z' : ''}">${shut ? '🔒' : id === 'Z' ? zEmblem() : id}</span><small>${shut ? this.rankZCountdown() : `×${R.reward}`}</small></button>`;
    }).join('');
    this.show(`<div class="screen ms-screen mp-screen">${this.titlebar(tr('Camino de arenas'), tr('Mi Equipo'))}
      <div class="ms-diff r-${rk}"><div class="ms-dl"><small>${tr('DIFICULTAD')}</small><b>${tr('Rango {x1}', { x1: rk === 'Z' ? zEmblem('z-inl') : rk })}</b><p>${tr('{x1} Recompensas ×{x2}.', { x1: esc(rankDef(rk).blurb), x2: RANKS[rk].reward })}</p></div><div class="ms-ranks">${ranks}</div></div>
      <div class="ms-team"><span><small>${tr('TU EQUIPO')}</small><b>${tr('{x1} (capitán) · {squadOfLength}/{SQUAD_SIZE}', { x1: esc(squadOf(this.save, this.byId)[0]?.name ?? '—'), squadOfLength: squadOf(this.save, this.byId).length, SQUAD_SIZE })}</b></span>
        <span class="m4-faces">${squadOf(this.save, this.byId).slice(0, 7).map((p) => { const ae = this.auraEntryOf(p.id); return `<span class="m4-face${ae ? ' with-aura' : ''}" style="--rc:${RARITY_COLOR[effectiveRarity(this.save, p)]}" title="${esc(p.name)}${ae ? ` · Aura: ${esc(ae.name)}` : ''}">${this.mug(p.id, 38)}${ae ? `<i class="ms-aura">${this.mug(ae.id, 40)}</i>` : ''}</span>`; }).join('')}</span>
        <button class="btn small" id="toteam">${tr('{x1} Cambiar equipo', { x1: uiIcon('team') })}</button></div>
      <div class="mp-wrap">
        <div class="mp-board">
          <div class="mp-head"><span><small>${tr('TU RECORRIDO')}</small><b>${tr('{cleared}/{mapsLength} arenas superadas', { cleared, mapsLength: maps.length })}</b></span>
            <span class="mp-prog"><i style="width:${cleared / Math.max(1, maps.length) * 100}%"></i></span>
            <span class="mp-legend"><i class="e"></i>${tr('Fácil')}<i class="h"></i>${tr('Difícil')}<i class="x"></i>${tr('Brutal')}</span></div>
          <div class="mp-road" style="height:${rows * (per === 2 ? 150 : 168)}px">
            <svg class="mp-svg" viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden="true">${road}</svg>${nodes}</div>
        </div>
        <aside class="mp-detail" id="mpdetail"></aside>
      </div></div>`);
    const detail = () => {
      const box = document.getElementById('mpdetail');
      const mp = maps.find((x) => x.id === this.mapPick);
      if (!box || !mp) return;
      const i = maps.indexOf(mp), tier = mp.tier ?? i + 1, st = state(mp), done = this.save.clearedRanks[mp.id] ?? [];
      const sc = mapTierScale(tier);
      const prev = maps.find((x) => `clear:${x.id}` === mp.unlock);
      const bossName = mp.boss !== null ? this.byId.get(mp.boss)?.name ?? this.m.units.find((u) => u.id === mp.boss)?.name ?? '—' : '—';
      const label = ['Paseo', 'Fácil', 'Normal', 'Exigente', 'Difícil', tr('Muy difícil'), 'Brutal', 'Leyenda'][Math.min(7, Math.floor((tier - 1) / maps.length * 8))];
      box.style.setProperty('--tc', this.tierColor(tier));
      box.className = `mp-detail st-${st}`;
      box.innerHTML = `<div class="mp-art">${mp.minimapTexture ? `<img src="${mp.minimapTexture}" alt="">` : ''}
          <span class="mp-stage">${tr('ETAPA {tier} / {mapsLength}', { tier, mapsLength: maps.length })}</span>${st === 'cleared' ? '<span class="mc4-ok">✔ SUPERADA</span>' : ''}
          <h3>${esc(mp.name)}</h3>${st === 'locked' ? `<div class="mc4-lock"><span>🔒</span>${tr('Supera {x1}', { x1: esc(prev?.name ?? tr('la arena anterior')) })}</div>` : ''}</div>
        <div class="mp-body">
          <div class="mp-diffbar"><small>${tr('DIFICULTAD')}</small><span class="mp-meter">${maps.map((_, k) => `<i class="${k < tier ? 'on' : ''}" style="--tc:${this.tierColor(k + 1)}"></i>`).join('')}</span><b>${label}</b></div>
          ${mp.blurb ? `<p class="mp-blurb">${esc(mp.blurb)}</p>` : ''}
          <div class="mp-boss">${mp.boss !== null ? this.mug(mp.boss, 52) : ''}<div><small>${tr('JEFE FINAL')}</small><b>${esc(bossName)}</b></div></div>
          <div class="mc4-chips"><span>${uiIcon('clock')}${fmtTime(mp.durationSec)}</span><span>${tr('{x1}{enemiesLength} rivales', { x1: uiIcon('team'), enemiesLength: mp.enemies.length })}</span><span title="${tr('Multiplicador de puntos del ranking por la dificultad de la arena')}">${tr('{x1}Ranking ×{x2}', { x1: uiIcon('crown'), x2: String(+mapMult(mp.id).toFixed(2)).replace('.', ',') })}</span>${tier > 1 ? `<span class="hard">${tr('{x1}Rivales +{x2}% vida · +{x3}% daño', { x1: uiIcon('fire'), x2: Math.round((sc.hp - 1) * 100), x3: Math.round((sc.damage - 1) * 100) })}</span>` : ''}</div>
          <div class="m4-ranks mc4-ranks">${RANK_ORDER.map((id) => `<i class="${done.includes(id) ? 'on' : ''} r-${id}">${id}</i>`).join('')}<small>${tr('{doneLength}/{RANK_ORDERLength} rangos', { doneLength: done.length, RANK_ORDERLength: RANK_ORDER.length })}</small></div>
          <button class="btn mp-go" data-map="${mp.id}" ${st === 'locked' ? 'disabled' : ''}>${st === 'locked' ? '🔒 Bloqueada' : tr('¡Saltar al campo! ▶')}</button>
        </div>`;
      this.on('[data-map]', 'click', () => {
        const squad = squadOf(this.save, this.byId);
        if (squad.length) this.startRun(mp.id, [squad[0]], squad);
      }, box);
    };
    detail();
    this.on('[data-pick]', 'click', (_e, el) => {
      this.mapPick = el.dataset.pick!;
      document.querySelectorAll('.mp-node.sel').forEach((n) => n.classList.remove('sel'));
      el.classList.add('sel');
      sfx('click');
      detail();
      if (window.innerWidth < 900) document.getElementById('mpdetail')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
    document.querySelector('.mp-node.sel')?.scrollIntoView({ block: 'nearest' });
    document.getElementById('toteam')?.addEventListener('click', () => this.captainSelect());
    this.on('[data-rank]', 'click', (_e, el) => {
      if (el.dataset.rank === 'Z' && !rankZOpen(serverNow())) { this.toast(tr('El Rango Z llega el martes 10 a las 12:00 · {rankZCountdown}', { rankZCountdown: this.rankZCountdown(true) }), 3000); return; }
      this.save.difficulty = el.dataset.rank as Rank; this.persist(); this.mapSelect();
    });
    this.on('[data-back]', 'click', () => this.captainSelect());
  }
  /** days (or hours, on the last day) until Rango Z opens; `long` for a sentence */
  private rankZCountdown(long = false) {
    const now = serverNow(), ms = rankZLeftMs(now), d = rankZDaysLeft(now), h = Math.ceil(ms / 3_600_000);
    if (ms <= 0) return long ? tr('Ya está aquí') : 'Abierto';
    if (h <= 24) return long ? `Faltan ${h} h` : `${h} h`;
    return long ? tr('Faltan {d} días', { d }) : tr('{d} días', { d });
  }
  /** green for the first arenas, then yellow, red and purple for the last ones */
  private tierColor(tier: number) {
    const n = Math.max(2, this.m.maps.length);
    const h = (135 - (tier - 1) / (n - 1) * 195 + 360) % 360;
    return `hsl(${h.toFixed(0)} 80% 55%)`;
  }

  // ------------------------------------------------------------- collection
  /** Fix 1.31: team rewards (crest, kit, captain) ready to collect in the Colección, counted like its own «!» marks. */
  private collectionClaims() { return this.teamClaimList().length; }
  /** v1.4: every team reward ready to collect, with its team, so the notices can say which ones */
  private teamClaimList() {
    const main = new Set(this.m.mainTeams ?? []);
    const teams = [...new Set(this.m.roster.flatMap((p) => p.teams))].filter((t) => main.has(t));
    return teams.flatMap((t) => (['crest', 'kit', 'captain'] as TeamRewardKind[])
      .filter((k) => (k !== 'kit' || !!this.m.kits?.[t]) && canClaim(this.save, this.m.roster, t, k)).map((k) => ({ team: t, kind: k })));
  }
  /** «Raimon: escudo y equipación · Royal Academy: duplicado del capitán» */
  private claimText(list: { team: string; kind: TeamRewardKind }[]) {
    const NAME: Record<TeamRewardKind, string> = { crest: 'escudo', kit: 'equipación', captain: tr('duplicado del capitán') };
    const by = new Map<string, string[]>();
    for (const c of list) by.set(c.team, [...(by.get(c.team) ?? []), NAME[c.kind]]);
    const parts = [...by].map(([t, ks]) => `${teamLabel(t)}: ${ks.length > 1 ? `${ks.slice(0, -1).join(', ')} y ${ks[ks.length - 1]}` : ks[0]}`);
    return parts.length > 3 ? tr('{x1} y {x2} equipo(s) más', { x1: parts.slice(0, 3).join(' · '), x2: parts.length - 3 }) : parts.join(' · ');
  }
  /** a notice that belongs to the screen it was shown on: it leaves with it, and a tap opens the Colección */
  private claimNotice(list: { team: string; kind: TeamRewardKind }[], lead: string) {
    if (!list.length) return;
    this.toast(`${lead} ${this.claimText(list)}`, 5000);
    const t = document.querySelector<HTMLElement>('.toast');
    if (!t) return;
    t.classList.add('screen-bound', 'tappable');
    t.addEventListener('click', () => { t.remove(); this.collectionView = 'equipos'; this.collection(); });
  }
  /** claims already announced, so the notice shows only when something new became collectable */
  private claimsAnnounced = -1;

  collection(detailId?: number) {
    setMusicContext('collection');
    const f = this.collectionFilter;
    const d = detailId ? this.byId.get(detailId) : undefined;
    // the index shows the teams of the story; everyone else is a Fichatrón scout, still fully playable (their ROM groups stay in the data)
    const main = new Set(this.m.mainTeams ?? []);
    const allTeams = [...new Set(this.m.roster.flatMap((p) => p.teams))].filter((t) => main.has(t)).sort();
    const scouts = this.m.roster.filter((p) => !p.teams.some((t) => main.has(t)));
    const elements = [...new Set(this.m.roster.map((p) => String(p.element)))];
    const filtered = this.m.roster.filter((p) => (!f.rarity || p.rarity === f.rarity) && (!f.pos || p.position === f.pos)
      && (!f.element || String(p.element) === f.element) && (!f.team || p.teams.includes(f.team))
      && (this.collectionView !== 'fichatron' || f.q !== '' || !p.teams.some((t) => main.has(t)))
      && (!f.saga || p.teams.some((t) => sagaOf(t) === f.saga)) && (!f.owned || this.owned(p.id)) && (!f.upgrade || this.canUpgrade(p))
      && (!f.q || `${p.name} ${p.nickname}`.toLowerCase().includes(f.q.toLowerCase())))
      // 1.76 (author): by rarity (HÉROE first, then the rarity each one really has), owned before locked, then by name
      .sort((a, b) => this.rarityRank(b) - this.rarityRank(a) || Number(!!this.owned(b.id)) - Number(!!this.owned(a.id)) || a.name.localeCompare(b.name, 'es'));
    const select = (id: string, label: string, opts: [string, string][], cur: string) => `<select id="${id}"><option value="">${label}</option>${opts.map(([v, l]) => `<option value="${esc(v)}" ${cur === v ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>`;
    const showTeams = this.collectionView === 'equipos' && !f.team && !f.q && !f.upgrade;
    const upgradable = this.m.roster.filter((p) => this.canUpgrade(p)).length;
    const rewardOk = (team: string, k: TeamRewardKind) => k !== 'kit' || !!this.m.kits?.[team];
    const teamClaims = allTeams.reduce((n, t) => n + (['crest', 'kit', 'captain'] as TeamRewardKind[]).filter((k) => rewardOk(t, k) && canClaim(this.save, this.m.roster, t, k)).length, 0);
    const teams = allTeams.filter((t) => !f.saga || sagaOf(t) === f.saga);
    const teamCards = SAGAS.map((sg) => {
      const list = teams.filter((t) => sagaOf(t) === sg);
      return list.length ? `<h3 class="saga">${tr(sg)}</h3><div class="team-grid">${list.map((t) => {
        const tp = teamProgress(this.save, this.m.roster, t);
        const claimable = (['crest', 'kit', 'captain'] as TeamRewardKind[]).some((k) => rewardOk(t, k) && canClaim(this.save, this.m.roster, t, k));
        return `<button class="team-card big" data-team="${esc(t)}">${this.emblemOf(t) ? `<img src="${this.emblemOf(t)}" alt="">` : '<span class="noemblem">⚽</span>'}<span class="tc-body"><b>${esc(teamLabel(t))}</b><i class="tc-bar"><i style="width:${tp.owned / Math.max(1, tp.total) * 100}%"></i></i><small>${tr('{owned}/{total} futbolistas', { owned: tp.owned, total: tp.total })}</small></span>${claimable ? '<span class="notif">!</span>' : ''}</button>`;
      }).join('')}</div>` : '';
    }).join('');
    const list = filtered.slice(0, this.collectionLimit);
    const ownedN = this.m.roster.filter((p) => this.owned(p.id)).length;
    this.show(`<div class="screen col-screen">${this.titlebar(tr('Enciclopedia'), tr('Menú'))}
      <div class="col-hero"><span class="col-hero-ic">${uiIcon('cards')}</span><div class="col-hero-tx"><small>${tr('TU COLECCIÓN')}</small><b>${ownedN} <em>${tr('de {rosterLength} futbolistas', { rosterLength: this.m.roster.length })}</em></b>
        <i class="col-bar"><i style="width:${ownedN / Math.max(1, this.m.roster.length) * 100}%"></i></i>
        <div class="col-rars">${RARITY_ORDER.map((r) => `<span class="rar ${r}">${RARITY_LABEL[r]} ${this.m.roster.filter((p) => p.rarity === r && this.owned(p.id)).length}/${this.m.roster.filter((p) => p.rarity === r).length}</span>`).join('')}</div></div>
        ${teamClaims ? `<button class="rw-all" id="teamall"><i class="m4-shine"></i>${tr('RECLAMAR TODO<em>{teamClaims}</em>', { teamClaims })}</button>` : ''}
        ${(() => { const n = ascendableCount(this.save, this.m.roster); return n ? `<button class="rw-all asc-all" id="ascall" title="${tr('Asciende a todos los que tienen duplicados suficientes')}"><i class="m4-shine"></i>${tr('ASCENDER TODOS<em>{n}</em>', { n })}</button>` : ''; })()}</div>
      ${d && this.compareWith && this.compareWith !== d.id && this.byId.get(this.compareWith) ? this.compareHtml(this.byId.get(this.compareWith)!, d) : ''}
      ${d ? this.playerDetail(d) : ''}
      <div class="mis-top"><div class="seg" id="views"><button data-v="equipos" class="${this.collectionView === 'equipos' ? 'on' : ''}">${tr('Por equipos')}</button><button data-v="fichatron" class="${this.collectionView === 'fichatron' ? 'on' : ''}">${tr('Fichatrón')}</button><button data-v="todos" class="${this.collectionView === 'todos' ? 'on' : ''}">${tr('Todos')}</button></div>
        ${this.collectionView === 'fichatron' ? `<span class="note">${tr('Jugadores de Fichatrón / Ojeadores: {x1} de {scoutsLength}. No pertenecen a un equipo de la historia, pero juegan igual que los demás.', { x1: scouts.filter((p) => this.owned(p.id)).length, scoutsLength: scouts.length })}</span>` : ''}
</div>
      ${f.team ? `<button class="btn small blue" id="clearteam">${tr('◀ Ver equipos')}</button>${this.teamHeader(f.team)}` : ''}
      <div class="filters"><input id="fq" placeholder="${tr('Buscar futbolista por nombre')}" value="${esc(f.q)}">
        ${select('fsa', tr('Saga'), SAGAS.map((x) => [x, tr(x)]), f.saga)}
        ${select('fr', tr('Rareza'), RARITY_ORDER.map((r) => [r, RARITY_LABEL[r]]), f.rarity)}
        ${select('fp', tr('Posición'), ['GK', 'DF', 'MF', 'FW'].map((x) => [x, POS_LABEL[x]]), f.pos)}
        ${select('fe', tr('Elemento'), elements.map((x) => [x, tEl(x)]), f.element)}
        <label class="note"><input type="checkbox" id="fo" ${f.owned ? 'checked' : ''}> ${tr('Solo desbloqueados')}</label>
        <label class="note"><input type="checkbox" id="fu" ${f.upgrade ? 'checked' : ''}> ${tr('Se pueden mejorar ({upgradable})', { upgradable })}</label>
</div>
      ${showTeams ? teamCards : `<div class="grid">${list.map((p) => this.pcard(p, { locked: !this.owned(p.id), sel: p.id === detailId })).join('')}</div>
        ${filtered.length > list.length ? `<p style="text-align:center"><button class="btn blue" id="more">${tr('Ver más ({x1})', { x1: filtered.length - list.length })}</button></p>` : ''}`}</div>`);
    this.on('[data-back]', 'click', () => this.mainMenu());
    this.on('.pcard[data-id]', 'click', (_e, el) => { if (this.owned(Number(el.dataset.id))) { this.collection(Number(el.dataset.id)); this.root.querySelector('.screen')?.scrollTo(0, 0); } });
    this.on('[data-keshin]', 'click', (_e, el) => this.keshinScreen(Number(el.dataset.keshin), Number(el.dataset.keshin))); // 2.0
    this.on('[data-ascend]', 'click', (_e, el) => this.ascension(Number(el.dataset.ascend), () => this.collection(Number(el.dataset.ascend))));
    this.on('[data-starbuy]', 'click', (_e, el) => this.starStatPicker(Number(el.dataset.starbuy), 'buy')); // 1.84
    document.getElementById('ascall')?.addEventListener('click', (e) => this.armed(e.currentTarget as HTMLElement, () => { // 1.85: everyone at once
      const done = ascendAll(this.save, this.m.roster);
      if (!done.length) { sfx('error'); return; }
      this.persist(); sfx('legend');
      const steps = done.reduce((a, d) => a + d.steps.length, 0);
      this.toast(`${done.length} ${done.length === 1 ? tr('futbolista ascendido') : tr('futbolistas ascendidos')} (${steps} ${steps === 1 ? 'paso' : 'pasos'}): ${done.slice(0, 4).map((d) => this.byId.get(d.id)?.name ?? '').join(', ')}${done.length > 4 ? '…' : ''}`, 4500);
      this.collection();
    }));
    this.on('[data-starpick]', 'click', (_e, el) => this.starStatPicker(Number(el.dataset.starpick), 'pick'));
    this.on('[data-train]', 'click', (_e, el) => {
      const id = Number(el.dataset.pid);
      const p = this.byId.get(id), key = el.dataset.train as StatKey;
      const room = p?.stats ? trainRoom(this.save, p, effectiveRarity(this.save, p), isHero(this.save, id))[key] : Infinity;
      if (trainStat(this.save, id, key, room)) { this.persist(); sfx('powerup'); this.collection(id); } else sfx('error');
    });
    this.on('[data-trainreset]', 'click', (_e, el) => this.armed(el, () => { const id = Number(el.dataset.trainreset); resetTraining(this.save, id); this.persist(); sfx('click'); this.collection(id); }));
    this.on('[data-compare]', 'click', (_e, el) => { const id = Number(el.dataset.compare); this.compareWith = this.compareWith === id ? null : id; this.collection(id); });
    this.on('[data-uncompare]', 'click', () => { this.compareWith = null; this.collection(detailId); });
    this.on('[data-start]', 'click', (_e, el) => { this.setStart(el.dataset.start!); this.collection(detailId); });
    this.on('[data-aura-info]', 'click', (_e, el) => this.auraInfo(Number(el.dataset.auraInfo))); // v1.5
    this.on('[data-team]', 'click', (_e, el) => { f.team = el.dataset.team!; this.collectionLimit = 36; this.collection(); });
    this.on('[data-reward]', 'click', (_e, el) => {
      if (claimTeamReward(this.save, this.m.roster, f.team, el.dataset.reward as TeamRewardKind)) { this.persist(); sfx('evolve'); confetti(30); this.toast(tr('¡{x1}: {x2} conseguido!', { x1: teamLabel(f.team), x2: ({ crest: tr('escudo'), kit: tr('equipación'), captain: tr('duplicado del capitán') } as Record<string, string>)[el.dataset.reward!] })); }
      this.collection(detailId);
    });
    document.getElementById('teamall')?.addEventListener('click', () => {
      const got = claimAllTeamRewards(this.save, this.m.roster, rewardOk);
      if (!got.length) return;
      this.persist();
      sfx('legend');
      confetti(40);
      const n = (k: TeamRewardKind) => got.filter((g) => g.kind === k).length;
      this.collection(detailId);
      this.rewardSummary(tr('¡Recompensas de equipo!'), [`${n('crest')} escudos`, `${n('kit')} equipaciones`, tr('{x1} duplicados de capitán', { x1: n('captain') })].filter((l) => !l.startsWith('0 ')).concat(this.claimText(got)));
    });
    this.on('#views button', 'click', (_e, el) => { this.collectionView = el.dataset.v as 'equipos' | 'todos' | 'fichatron'; f.team = ''; this.collection(); });
    document.getElementById('clearteam')?.addEventListener('click', () => { f.team = ''; this.collectionView = 'equipos'; this.collection(); });
    document.getElementById('more')?.addEventListener('click', () => {
      const y = this.root.querySelector('.screen')!.scrollTop;
      this.collectionLimit += 36;
      this.collection(detailId);
      this.root.querySelector('.screen')!.scrollTop = y;
    });
    const upd = () => {
      f.q = (document.getElementById('fq') as HTMLInputElement).value;
      f.saga = (document.getElementById('fsa') as HTMLSelectElement).value;
      f.rarity = (document.getElementById('fr') as HTMLSelectElement).value;
      f.pos = (document.getElementById('fp') as HTMLSelectElement).value;
      f.element = (document.getElementById('fe') as HTMLSelectElement).value;
      f.owned = (document.getElementById('fo') as HTMLInputElement).checked;
      f.upgrade = (document.getElementById('fu') as HTMLInputElement).checked;
      this.collectionLimit = 36;
      this.collection(detailId);
    };
    document.getElementById('fq')!.addEventListener('change', upd);
    ['fsa', 'fr', 'fp', 'fe', 'fo', 'fu'].forEach((id) => document.getElementById(id)!.addEventListener('change', upd));
  }

  /** 1.76: owned and with enough spare copies for its next step right now (ascension, HÉROE or a hero star). */
  private canUpgrade(p: RosterEntry) {
    const next = this.owned(p.id) ? nextStep(this.save, p) : null;
    return !!next && sparesOf(this.save, p.id) >= next.cost;
  }
  /** 1.76: sort key of the collection: HÉROE above every rarity; an owned footballer counts with the rarity he reached. */
  private rarityRank(p: RosterEntry) {
    if (!this.owned(p.id)) return RARITY_ORDER.indexOf(p.rarity);
    const ch = championOf(this.save, p.id); // 1.8: Campeón above HÉROE
    if (ch) return RARITY_ORDER.length + ch;
    return isHero(this.save, p.id) ? RARITY_ORDER.length : RARITY_ORDER.indexOf(effectiveRarity(this.save, p));
  }

  private teamHeader(team: string) {
    const tp = teamProgress(this.save, this.m.roster, team);
    const cap = teamCaptain(teamMembers(this.m.roster, team));
    const rewards: [TeamRewardKind, string, boolean][] = [['crest', tr('Escudo del equipo'), true], ['kit', 'Equipación', !!this.m.kits?.[team]], ['captain', tr('Duplicado de {x1}', { x1: this.owned(cap.id) ? cap.name : tr('su capitán') }), true]];
    return `<div class="panel team-head">${this.emblemOf(team) ? `<img src="${this.emblemOf(team)}" alt="">` : ''}
      <div class="th-main"><h3>${esc(teamLabel(team))}</h3><div class="note">${tr('{sagaOf} · {owned}/{total} futbolistas', { sagaOf: tr(sagaOf(team)), owned: tp.owned, total: tp.total })}</div><i class="tc-bar wide"><i style="width:${tp.owned / Math.max(1, tp.total) * 100}%"></i></i></div>
      <div class="th-rewards">${rewards.map(([k, label, ok]) => {
        const got = tp.claimed[k], can = ok && canClaim(this.save, this.m.roster, team, k);
        return `<div class="th-r${got ? ' got' : ''}"><span>${esc(label)}</span><small>${!ok ? tr('Sin recursos') : `${Math.min(tp.owned, tp.goal[k])}/${tp.goal[k]}`}</small><button class="btn small" data-reward="${k}" ${can ? '' : 'disabled'}>${got ? 'Conseguido' : 'Reclamar'}</button></div>`;
      }).join('')}</div></div>`;
  }

  /**
   * Fix 1.12 shop: a featured strip (2 featured, the favourite team's offer, the weekly special) over a grid of the six
   * daily offers, with a rarity filter. Every offer shows portrait, name, rarity, team, price, state and time left.
   */
  private shopFilter = 'todas';
  dailyShop() {
    setMusicContext('menu');
    const now = serverNow();
    const offers = rollDaily(this.save, this.m.roster, now);
    this.persist();
    const hm = (ms: number) => ms >= 86400000 ? `${Math.floor(ms / 86400000)} d ${Math.floor(ms / 3600000) % 24} h` : `${Math.floor(ms / 3600000)} h ${Math.floor(ms / 60000) % 60} min`;
    const dayLeft = hm(msToNextDay(now)), weekLeft = hm(msToNextWeek(now));
    const TAG: Record<string, string> = { destacado: '★ DESTACADO', favorito: tr('♥ TU EQUIPO'), semanal: '◆ SEMANAL', diaria: tr('DEL DÍA') };
    const card = (o: Offer) => {
      const p = this.byId.get(o.playerId)!;
      const sold = isOfferBought(this.save, o);
      const team = p.teams[0] ? teamLabel(p.teams[0]) : '';
      const owned = !!this.save.owned[String(p.id)];
      return `<article class="shop-card r-${p.rarity}${sold ? ' sold' : ''}" data-rar="${p.rarity}" style="--rc:${RARITY_COLOR[p.rarity]}">
        <div class="shop-tag tag-${o.tag ?? 'diaria'}">${TAG[o.tag ?? 'diaria']}</div>
        ${o.discount ? `<div class="shop-off">-${o.discount}%</div>` : ''}
        <div class="shop-art">${this.mug(p.id, 96)}</div>
        <b class="shop-name">${esc(p.name)}</b>
        <div class="shop-meta">${this.rar(p)}<small>${esc(team)}</small></div>
        <div class="shop-state">${sold ? '✔ Comprado' : owned ? tr('Ya lo tienes: cuenta como duplicado') : tr('Nuevo para tu colección')}</div>
        <small class="shop-left">${o.tag === 'semanal' ? tr('Cambia en {weekLeft}', { weekLeft }) : tr('Cambia en {dayLeft}', { dayLeft })}</small>
        <button class="btn small" data-offer="${o.playerId}" ${sold || this.save.coins < o.price ? 'disabled' : ''}>${sold ? 'Comprado' : `${o.discount ? `<s>${PRICE[p.rarity]}</s> ` : ''}${o.price} ◉`}</button>
      </article>`;
    };
    const top = offers.filter((o) => o.tag && o.tag !== 'diaria'), day = offers.filter((o) => !o.tag || o.tag === 'diaria');
    const rars = ['todas', ...RARITY_ORDER.filter((r) => offers.some((o) => this.byId.get(o.playerId)?.rarity === r))];
    this.show(`<div class="screen shop-screen">${this.titlebar(tr('Tienda'), tr('Menú'))}
      <div class="shop-head"><span>${tr('{offersLength} ofertas · {x1}', { offersLength: offers.length, x1: timeSource() === 'servidor' ? tr('hora del servidor') : tr('hora de este dispositivo') })}</span><span>${tr('Diarias: {dayLeft} · Semanal: {weekLeft}', { dayLeft, weekLeft })}</span></div>
      ${eventActive(serverNow()) ? `<button class="pn-eventcta" id="pnevent"><span class="pn-cta-art">${pennantSvg('supernova', 44)}</span><span><small>${tr('EVENTO · TERMINA EN {x1}', { x1: this.eventLeftText(serverNow()) })}</small><b>${tr('Banners y marcos de leyenda')}</b><em>${tr('{x1} ◉ la tirada · Míticos al 3%', { x1: PENNANT_EVENT.cost.toLocaleString(locale()) })}</em></span></button>` : ''}
      ${(() => { const sd = activeSeason(serverNow()); if (!sd) return ''; const has = seasonOf(this.save, sd).normal; // 2.1
        return `<h3 class="shop-sec">${tr('Pase de temporada')}</h3><div class="shop-grid"><article class="shop-card sp-shopkey r-raro" style="--rc:${RARITY_COLOR.raro}"><div class="shop-art">${this.m.pase ? `<img class="sp-shopimg" src="${this.m.pase.normal}" alt="">` : ''}</div>
          <b class="shop-name">${tr('Llave normal')}</b><small class="shop-left">${tr('Abre la fila normal del pase de {sdName}: monedas, fichas, tiradas, los jugadores del Dominio de Zanark, banners y un marco.', { sdName: esc(sd.name) })}</small>
          <button class="btn small" id="shopkey" ${has || this.save.coins < NORMAL_KEY_PRICE ? 'disabled' : ''}>${has ? '✔ Tuya' : `${NORMAL_KEY_PRICE.toLocaleString(locale())} ◉`}</button></article></div>`; })()}
      ${([[tr('Banners de perfil'), PENNANTS], [tr('Marcos de perfil'), FRAMES]] as const).map(([title, list]) => `<h3 class="shop-sec">${title}</h3><div class="shop-grid pn-shop">${list.filter((d) => d.source === 'tienda').map((d) => { const own = hasPennant(this.save, d.id);
        return `<article class="shop-card pn-shopcard r-${d.rarity}" style="--rc:${RARITY_COLOR[d.rarity]}">${isFrame(d) ? `<div class="shop-art fr-prev">${this.framed(this.frameFace(), d.id)}</div>` : `<div class="shop-art pn-prev">${pennantRibbon(d)}</div>`}<b class="shop-name">${esc(d.name)}</b>
          <div class="shop-meta"><span class="rar ${d.rarity}">${RARITY_LABEL[d.rarity].toUpperCase()}</span></div><small class="shop-left">${esc(d.tagline)}</small>
          <button class="btn small" data-pnbuy="${d.id}" ${own || this.save.coins < (d.price ?? 0) ? 'disabled' : ''}>${own ? '✔ Tuyo' : `${d.price?.toLocaleString(locale())} ◉`}</button></article>`; }).join('')}</div>`).join('')}
      <h3 class="shop-sec">${tr('Destacados')}</h3><div class="shop-grid shop-top">${top.map(card).join('')}</div>
      <h3 class="shop-sec">${tr('Del día')} <span class="shop-filters">${rars.map((r) => `<button class="chip${this.shopFilter === r ? ' on' : ''}" data-sf="${r}">${r === 'todas' ? 'Todas' : RARITY_LABEL[r as Rarity]}</button>`).join('')}</span></h3>
      <div class="shop-grid shop-day">${day.filter((o) => this.shopFilter === 'todas' || this.byId.get(o.playerId)?.rarity === this.shopFilter).map(card).join('') || `<p class="note">${tr('Nada de esta rareza hoy.')}</p>`}</div></div>`);
    this.on('[data-back]', 'click', () => this.mainMenu());
    this.on('[data-sf]', 'click', (_e, el) => { this.shopFilter = el.dataset.sf ?? 'todas'; this.dailyShop(); });
    document.getElementById('pnevent')?.addEventListener('click', () => this.pennantEvent());
    const sk = document.getElementById('shopkey'); // 2.1
    if (sk) sk.addEventListener('click', () => this.armed(sk, () => {
      if (buyNormalKey(this.save, serverNow())) { this.persist(); sfx('buy'); this.toast(tr('¡Llave normal! Abre el pase desde Competición > Temporada.'), 4000); } else sfx('error');
      this.dailyShop();
    }));
    this.on('[data-pnbuy]', 'click', (_e, el) => this.armed(el, () => {
      const d = PENNANT_BY_ID.get(el.dataset.pnbuy!);
      if (d && buyPennant(this.save, d.id)) { this.persist(); sfx('buy'); this.toast(tr('¡{dName} es tuyo! Póntelo en tu Perfil.', { dName: d.name }), 3500); } else sfx('error');
      this.dailyShop();
    }));
    this.on('[data-offer]', 'click', (_e, el) => this.armed(el, () => {
      if (buyOffer(this.save, this.m.roster, Number(el.dataset.offer), serverNow())) { this.persist(); sfx('buy'); this.toast(tr('¡Fichado!')); } else sfx('error');
      this.dailyShop();
    }));
  }

  /** Free weekly pass: seven rewards, one claim per day (server day online), skipping days loses nothing. */
  private passTeam = '';
  weeklyPass() {
    setMusicContext('menu');
    const now = serverNow();
    const st = passStatus(this.save, now);
    const teams = teamChoices(this.m.roster, this.m.mainTeams ?? []);
    if (!teams.some((t) => t.team === this.passTeam)) this.passTeam = (teams.find((t) => t.team === this.save.favoriteTeam) ?? teams[0])?.team ?? '';
    // 2.0 (author: «mejora mucho la interfaz del pase»): a road of seven tickets joined by a path that fills, the game's own
    // art on each one, a stamp on the claimed ones, today's ticket glowing, and day 7 as the grand prize
    const left = msToNextDay(now);
    const days = PASS.map((r, i) => {
      const state = i < st.index ? 'reclamado' : i === st.index ? (st.available ? 'disponible' : 'siguiente') : 'bloqueado';
      const grand = i === PASS.length - 1;
      return `<div class="wp2-day ${state}${grand ? ' grand' : ''}${r.tier === 'plus' ? ' plus' : ''} k-${r.kind}" style="--d:${i * 70}ms">
        <span class="wp2-node">${i + 1}</span>
        <div class="wp2-card">${grand ? '<i class="wp3-crown">👑</i><i class="wp3-sparks"></i>' : ''}<small>${tr('DÍA {x1}{x2}', { x1: i + 1, x2: grand ? ' · GRAN PREMIO' : r.tier === 'plus' ? ' · PLUS' : '' })}</small>
          <span class="wp2-stage"><i class="wp2-rays"></i>${this.passArt(i)}</span>${this.passItems(r)}${this.passOdds(r)}
          <em>${state === 'reclamado' ? 'Cobrado' : state === 'disponible' ? tr('¡HOY!') : state === 'siguiente' ? tr('En {passCount}', { passCount: this.passCount(left) }) : 'Bloqueado'}</em>
          ${state === 'reclamado' ? '<i class="wp2-stamp">COBRADO</i>' : state === 'bloqueado' ? '<i class="wp2-lock">🔒</i>' : ''}</div></div>`;
    }).join('');
    const next = PASS[st.index];
    const teamPick = next.jugador?.team ? `<label class="team-sel wp2-team">${tr('Equipo:')} <select id="passteam">${teams.map((t) => `<option value="${esc(t.team)}" ${t.team === this.passTeam ? 'selected' : ''}>${esc(teamLabel(t.team))}</option>`).join('')}</select></label>` : '';
    this.show(`<div class="screen wp2-screen">${this.titlebar(tr('Pase semanal'), 'Menú')}
      <header class="wp2-hero${st.available ? ' hot' : ''}"><i class="wp2-glow"></i>
        <div class="wp2-title"><small>${tr('GRATIS · CICLO DE {PASSLength} DÍAS', { PASSLength: PASS.length })}</small><b>${tr('PASE SEMANAL')}</b>
          <span>${tr('{x1} Si te saltas días no pierdes nada: el pase te espera.', { x1: st.available ? tr('Tu recompensa de hoy te está esperando.') : `${tr('Ya has cobrado hoy. La siguiente llega en <em id="pscount">{passCount}</em>.', { passCount: this.passCount(left) })}` })}</span>
          <div class="wp2-dots">${PASS.map((_, i) => `<i class="${i < st.index ? 'on' : i === st.index ? 'now' : ''}"></i>`).join('')}<small>${st.index}/${PASS.length}</small></div>
          <div class="wp3-total"><small>${tr('CADA SEMANA')}</small><span>${this.cap('cap_azul_spin0') ? `<img src="${this.cap('cap_azul_spin0')}" alt="">` : ''}<b>${PASS_TOTAL.fichas}</b> ${tr('fichas')}</span><span><b>◉ ${PASS_TOTAL.monedas.toLocaleString(locale())}</b> ${tr('monedas')}</span><span><b>★ ${PASS_TOTAL.jugadores}</b> ${tr('futbolistas, hasta Leyenda')}</span></div></div>
        <div class="wp2-today${st.available ? '' : ' wait'}"><small>${st.available ? tr('RECOMPENSA DE HOY') : tr('SIGUIENTE')}</small>
          <span class="wp2-stage big"><i class="wp2-rays"></i>${this.passArt(st.index, 'big')}</span>${this.passItems(next)}${this.passOdds(next)}
          ${st.available ? `${teamPick}<button class="rw-all wp2-claim" id="passclaim"><i class="m4-shine"></i>${tr('¡RECLAMAR!')}</button>` : `<span class="wp2-wait">${uiIcon('clock')} ${this.passCount(left)}</span>`}</div></header>
      <div class="wp2-road" style="--p:${st.index / (PASS.length - 1)}"><i class="wp2-path"><i></i></i>${days}</div>
      <div class="ps4-foot">${tr('{x1}{x2} · tras el día {PASSLength} empieza un ciclo nuevo', { x1: uiIcon('clock'), x2: timeSource() === 'servidor' ? tr('Hora del servidor') : tr('Hora de este dispositivo'), PASSLength: PASS.length })}</div></div>`);
    this.on('[data-back]', 'click', () => this.mainMenu());
    // 2.0: the countdown ticks live while the screen is open
    const tick = window.setInterval(() => {
      const el = document.getElementById('pscount'), w = this.root.querySelector('.wp2-wait'), n = this.root.querySelector('.wp2-day.siguiente em');
      if (!el && !w) { window.clearInterval(tick); return; }
      const t = this.passCount(msToNextDay(serverNow()));
      if (el) el.textContent = t;
      if (w) w.innerHTML = `${uiIcon('clock')} ${t}`;
      if (n) n.textContent = tr('En {t}', { t });
    }, 1000);
    document.getElementById('passteam')?.addEventListener('change', (e) => { this.passTeam = (e.target as HTMLSelectElement).value; this.weeklyPass(); });
    document.getElementById('passclaim')?.addEventListener('click', (e) => {
      const b = e.currentTarget as HTMLButtonElement;
      b.disabled = true;
      // today's ticket pops and gets its stamp before the reward shows
      const day = this.root.querySelector<HTMLElement>('.wp2-day.disponible');
      day?.classList.add('claiming');
      if (day) { flyTo(day, '.coins', 8); flyTo(day, '.tokens', 6); }
      confetti(40);
      window.setTimeout(() => this.claimPassNow(() => this.weeklyPass()), 650);
    });
  }

  kits() {
    setMusicContext('menu');
    const available = Object.keys(this.m.kits ?? {}).filter((t) => hasKit(this.save, t));
    const crests = Object.keys(this.save.teamRewards).filter((t) => hasCrest(this.save, t));
    const sample = this.unlockedRoster()[0];
    const card = (team: string, label: string) => {
      const b = kitBonus(team, this.m.roster);
      return `<button class="kit-card${this.save.kit === team ? ' on' : ''}" data-kit="${esc(team)}">${sample ? charCanvas(sample.id, 3, 12, '', team) : ''}<span>${esc(label)}</span><b class="kit-bonus">${esc(b.name)}</b><small class="kit-desc">${esc(b.description)}</small></button>`;
    };
    this.show(`<div class="screen">${this.titlebar(tr('Equipaciones'), tr('Menú'))}
      <div class="panel"><div class="note">${tr('{x1} <b>{x2}</b>, y si llevas {min} o más jugadores de ese equipo en el campo, «Química de club»: +{x3}% de daño.', { x1: tr('Elige el uniforme de tu escuadra: cambia el cuerpo y conserva la cabeza original y todas las animaciones. Se consiguen con las recompensas de equipo de la Enciclopedia.'), x2: tr('Cada equipación da un bonus'), min: CLUB_CHEMISTRY.min, x3: Math.round((CLUB_CHEMISTRY.damage - 1) * 100) })}</div>
      <div class="kit-grid">${card('', 'Raimon')}${available.map((t) => card(t, teamLabel(t))).join('')}</div></div>
      <div class="panel" style="margin-top:10px"><h3>${tr('Escudo de perfil')}</h3><div class="icon-grid">${crests.filter((t) => this.emblemOf(t)).map((t) => `<button class="iconpick${this.save.crest === t ? ' on' : ''}" data-crest="${esc(t)}" title="${esc(teamLabel(t))}"><img src="${this.emblemOf(t)}" alt=""></button>`).join('') || `<div class="note">${tr('Aún no tienes escudos: reúne 3 futbolistas de un equipo.')}</div>`}</div></div></div>`);
    this.on('[data-back]', 'click', () => this.mainMenu());
    this.on('[data-kit]', 'click', (_e, el) => {
      this.save.kit = el.dataset.kit!;
      setPreviewKit(this.m.kits?.[this.save.kit] ?? null);
      this.persist();
      this.kits();
    });
    this.on('[data-crest]', 'click', (_e, el) => { this.save.crest = el.dataset.crest!; this.persist(); this.kits(); });
  }

  /** Fix 1.22: two footballers side by side: stats with their difference, techniques, talents, rarity and what they share. */
  private compareHtml(a: RosterEntry, b: RosterEntry) {
    const sa = this.statsOf(a) ?? {}, sb = this.statsOf(b) ?? {};
    const rows = STAT_INFO.map((s) => {
      const va = sa[s.key] ?? 0, vb = sb[s.key] ?? 0, d = vb - va;
      return `<tr><td>${s.name}</td><td>${va}</td><td>${vb}</td><td class="${d > 0 ? 'up' : d < 0 ? 'down' : ''}">${d > 0 ? '+' : ''}${d}</td></tr>`;
    }).join('');
    const techs = (p: RosterEntry) => p.techniques.map((t) => `<li>${this.icon(ICON.manual[t.type], 1)} ${esc(tTech(t.name))} <small>${TYPE_LABEL[t.type]}${t.type === 'talento' ? '' : ` · ${t.power}`}</small></li>`).join('');
    const shared = [...new Set(a.teams.filter((t) => b.teams.includes(t) && (this.m.mainTeams ?? []).includes(t)))].map(teamLabel);
    const notes = [a.position !== b.position ? tr('Posiciones distintas ({x1} / {x2}): la comparación es orientativa.', { x1: POS_LABEL[a.position], x2: POS_LABEL[b.position] }) : '',
      a.element === b.element ? tr('Mismo elemento ({element}): suman resonancia de elemento juntos.', { element: a.element }) : '',
      shared.length ? tr('Comparten equipo: {x1} (química de club con 3 o más en el campo).', { x1: esc(shared.slice(0, 3).join(', ')) }) : ''].filter(Boolean);
    return `<div class="panel compare"><h3>${tr('Comparación')} <button class="btn small blue" data-uncompare="1">${tr('✕ Cerrar')}</button></h3>
      <div class="cmp-head">${[a, b].map((p) => `<div>${this.mug(p.id, 64)}<b>${esc(p.name)}</b>${this.rar(p)}<small>${POS_LABEL[p.position]} · ${esc(tEl(String(p.element)))}</small></div>`).join(this.uiPiece('vs', 'cmp-vs') || '<span>VS</span>')}</div>
      <table class="cmp-stats"><tr><th></th><th>${esc(a.nickname || a.name)}</th><th>${esc(b.nickname || b.name)}</th><th>${tr('Dif.')}</th></tr>${rows}</table>
      <div class="cmp-techs"><ul>${techs(a)}</ul><ul>${techs(b)}</ul></div>
      ${notes.map((n) => `<div class="note">${n}</div>`).join('')}</div>`;
  }

  /**
   * 1.84 (author): the stars of an owned footballer: the 5 (copies unlock them, coins buy them) and the 3 extra of a
   * HÉROE or Campeón; the next one with its price and what it still needs; the limits each one raised; picks pending.
   */
  private starPanel(d: RosterEntry) {
    const o = this.owned(d.id)!;
    const xsOk = hasExtraStars(this.save, d), xs = extraStarsOf(this.save, d.id);
    const next = nextStar(this.save, d), pend = pendingPicks(this.save, d.id), caps = capBonusOf(this.save, d.id);
    const names: Record<string, string> = Object.fromEntries(STAT_INFO.map((x) => [x.key, x.short]));
    const big = (on: boolean, cls: string) => starIcon(`${cls}${on ? ' on' : ''}`);
    const capList = Object.entries(caps).filter(([, v]) => v).map(([k, v]) => `<span><b>${names[k] ?? k}</b> ${statCapOf(this.save, d, k as StatKey)} <em>+${v}</em></span>`).join('');
    const why = next && (!next.copiesOk ? tr('Faltan duplicados: {x1} más', { x1: Math.max(0, next.copiesNeed - (o.copies - 1)) }) : !next.coinsOk ? tr('Faltan {x1} monedas', { x1: (next.cost - this.save.coins).toLocaleString(locale()) }) : '');
    return `<div class="star-panel${xsOk ? ' has-x' : ''}${isHero(this.save, d.id) ? ' hero' : championOf(this.save, d.id) ? ' champ' : ''}">
      <div class="sp-row"><span class="sp-stars">${Array.from({ length: MAX_STARS }, (_, i) => big(i < o.stars, 'st')).join('')}</span>
        ${xsOk ? `<span class="sp-x">${Array.from({ length: EXTRA_STARS_MAX }, (_, i) => big(i < xs, 'hst')).join('')}</span>` : ''}</div>
      <div class="sp-info">${tr('{x1} <b>{stars}/{MAX_STARS}</b>{x2} · daño ×{toFixed} · vida ×{toFixed2} · duplicados libres {sparesOf}', { x1: tr('Estrellas'), stars: o.stars, MAX_STARS, x2: xsOk ? ` · extra <b>${xs}/${EXTRA_STARS_MAX}</b>` : '', toFixed: starBonus(o.stars).damage.toFixed(2), toFixed2: starBonus(o.stars).hp.toFixed(2), sparesOf: sparesOf(this.save, d.id) })}</div>
      ${capList ? `<div class="sp-caps">${capList}</div>` : ''}
      ${pend ? `<button class="btn small" data-starpick="${d.id}">${tr('✦ Elige {x1} de límite (+{STAR_CAP_STEP})', { x1: pend === 1 ? tr('la mejora') : `${pend} mejoras`, STAR_CAP_STEP })}</button>` : ''}
      ${next ? `<div class="sp-next"><button class="btn ${next.copiesOk && next.coinsOk ? '' : 'blue'}" data-starbuy="${d.id}" ${next.copiesOk && next.coinsOk ? '' : 'disabled'}>
          ${next.kind === 'extra' ? tr('Estrella extra') : tr('Subir estrella')} ${next.kind === 'extra' ? MAX_STARS + next.n : next.n} · ${next.cost.toLocaleString(locale())} ◉</button>
          <small>${why || tr('+{STAR_CAP_STEP} al límite de la estadística que elijas', { STAR_CAP_STEP })}</small></div>`
        : `<div class="note">${o.stars >= MAX_STARS && !xsOk ? tr('Estrellas completas. Hazlo HÉROE (o Campeón si es Leyenda) para desbloquear 3 estrellas extra.') : tr('¡Todas las estrellas!')}</div>`}
    </div>`;
  }

  /**
   * 1.84 / 1.85 (author): pick the stats whose limits the stars raise. Buying, several stars can go at once (as many as
   * the coins pay, in order): each tap on a stat adds one star to it, − takes it back. Pending picks (stars from before)
   * are given the same way.
   */
  private starStatPicker(id: number, mode: 'buy' | 'pick') {
    const p = this.byId.get(id);
    if (!p) return;
    document.querySelector('.star-pick-modal')?.remove();
    const box = document.createElement('div');
    box.className = 'tut-modal star-pick-modal';
    const aff = affordableStars(this.save, p);
    const max = mode === 'buy' ? aff.n : pendingPicks(this.save, id);
    if (!max) { sfx('error'); return; }
    const order: StatKey[] = [];
    const draw = () => {
      const n = order.length, cost = aff.costs.slice(0, n).reduce((a, b) => a + b, 0);
      const count = (k: string) => order.filter((x) => x === k).length;
      box.innerHTML = `<div class="panel sp-pick"><h2>${mode === 'buy' ? tr('Subir estrellas') : tr('Mejoras de límite')}</h2>
        <p class="note">${tr('Toca una estadística por cada estrella: su límite sube +{STAR_CAP_STEP}. Puedes repetir la misma.{x1}', { STAR_CAP_STEP, x1: mode === 'buy' ? ` ${tr('Te llega para <b>{max}</b> {x1}.', { max, x1: max === 1 ? 'estrella' : 'estrellas' })}` : ` Te quedan <b>${max}</b>.` })}</p>
        <div class="sp-grid">${STAT_INFO.map((x) => { const c = count(x.key), cap = statCapOf(this.save, p, x.key as StatKey);
          return `<div class="sp-opt${c ? ' on' : ''}"><button class="sp-add" data-k="${x.key}" ${n >= max ? 'disabled' : ''}><b>${x.short}</b><span>${cap} → <em>${cap + STAR_CAP_STEP * c}</em></span><small>${esc(x.name)}</small></button>${c ? `<button class="sp-rm" data-rm="${x.key}">−${c > 1 ? ` ${c}` : ''}</button>` : ''}</div>`; }).join('')}</div>
        <div class="tut-nav"><button class="btn small blue" data-close>${tr('Cancelar')}</button><span class="spacer"></span>
          <button class="btn" data-ok ${n ? '' : 'disabled'}>${mode === 'buy' ? `Subir ${n} ${n === 1 ? 'estrella' : 'estrellas'}${n ? ` · ${cost.toLocaleString(locale())} ◉` : ''}` : `Aplicar ${n}`}</button></div></div>`;
      box.querySelector('[data-close]')!.addEventListener('click', () => box.remove());
      box.querySelectorAll<HTMLElement>('.sp-add').forEach((b) => b.addEventListener('click', () => { if (order.length < max) { order.push(b.dataset.k as StatKey); sfx('click'); draw(); } }));
      box.querySelectorAll<HTMLElement>('.sp-rm').forEach((b) => b.addEventListener('click', () => { const k = order.lastIndexOf(b.dataset.rm as StatKey); if (k >= 0) order.splice(k, 1); draw(); }));
      box.querySelector('[data-ok]')!.addEventListener('click', () => {
        const done = mode === 'buy' ? buyStars(this.save, p, order) : order.filter((k) => assignPick(this.save, id, k)).length;
        box.remove();
        if (!done) { sfx('error'); return; }
        this.persist(); sfx(mode === 'buy' ? 'legend' : 'powerup');
        this.toast(mode === 'buy' ? `${p.name}: +${done} ${done === 1 ? 'estrella' : 'estrellas'}` : tr('{pName}: {done} {x1} de límite', { pName: p.name, done, x1: done === 1 ? 'mejora' : 'mejoras' }), 3000);
        this.collection(id);
      });
    };
    document.body.appendChild(box);
    draw();
  }

  /** Fix 1.3: training of an owned footballer: up to 20 points, one Ficha de entrenamiento each, freely returned. */
  private trainingHtml(d: RosterEntry) {
    if (!this.owned(d.id)) return '';
    const used = trainingUsed(this.save, d.id), trained = trainingOf(this.save, d.id), have = this.save.trainTokens ?? 0;
    const tmax = trainMaxOf(this.save, d.id), cap = statCapOf(this.save, d); // 1.8: a Campeón trains more and higher
    const can = have > 0 && used < tmax;
    const room = d.stats ? trainRoom(this.save, d, effectiveRarity(this.save, d), isHero(this.save, d.id)) : null;
    return `<div class="train-box"><div class="train-head"><b>${tr('Entrenamiento {used}/{tmax}', { used, tmax })}</b><span>${tr('Fichas de entrenamiento: <b>{have}</b>', { have })}</span>
      ${used ? `<button class="btn small blue" data-trainreset="${d.id}">${tr('Devolver puntos')}</button>` : ''}</div>
      <div class="train-row">${STAT_INFO.map((s) => { const full = (room?.[s.key as StatKey] ?? 1) <= 0; // Fix 1.31: a stat at 99 takes no more points
        return `<button class="btn small${full ? ' maxed' : ''}" data-train="${s.key}" data-pid="${d.id}" ${can && !full ? '' : 'disabled'} title="${full ? tr('Al máximo ({cap})', { cap }) : ''}">${s.short}${trained[s.key as StatKey] ? ` +${trained[s.key as StatKey]}` : ''} ${full ? tr('MÁX') : '＋'}</button>`; }).join('')}</div>
      <div class="note">${tr('Cada ficha suma 1 punto a la estadística que elijas (máximo {tmax} para este futbolista). Se ganan con victorias, rangos superados, supervivencia infinita, misiones semanales y logros.', { tmax })}</div></div>`;
  }

  private playerDetail(d: RosterEntry) {
    const o = this.owned(d.id);
    const statNames: Record<string, string> = { kick: 'Tiro', body: 'Físico', guard: 'Defensa', control: 'Control', speed: 'Velocidad', guts: 'Agallas', stamina: 'Aguante' };
    const active = this.startOf(d);
    const reps = Array.from({ length: Math.max(4, d.techniques.length) }, (_, i) => d.techniques[i]); // GO players can know more than 4
    return `<div class="panel detail r-${d.rarity}${isHero(this.save, d.id) ? ' is-hero' : ''}" style="--rc:${RARITY_COLOR[d.rarity]}"><div class="art">${this.mug(d.id, 128)}${charCanvas(d.id, 3, 12)}</div><div>
      <h3>${esc(d.name)} “${esc(d.nickname)}” ${this.rar(d)} ${this.elem(d)}</h3>
      <div class="note">${POS_LABEL[d.position]} · ${esc(d.teams.filter((t) => (this.m.mainTeams ?? []).includes(t)).slice(0, 5).map(teamLabel).join(', ') || (d.exclusive === 'bluelock' ? tr('Colaboración InaZurvivors x BlueLock') : d.exclusive === 'evento' ? tr('Colaboración · Banner de agradecimiento') : tr('Jugador de Fichatrón / Ojeador')))}${(() => { const sg = [...new Set(d.teams.map(sagaOf).filter(Boolean))]; return sg.length ? ` · Saga: ${esc(sg.join(', '))}` : ''; })()}</div>
      ${o ? `<p><button class="btn small blue" data-compare="${d.id}">${this.compareWith === d.id ? tr('Elige otro futbolista para comparar…') : tr('⇄ Comparar con otro')}</button></p>` : ''}
      ${o ? this.starPanel(d) : ''}
      ${o && (nextStep(this.save, d) || isHero(this.save, d.id) || championOf(this.save, d.id)) ? `<p><button class="btn ${nextStep(this.save, d) ? 'big' : 'blue'}" data-ascend="${d.id}">${!nextStep(this.save, d) ? (championOf(this.save, d.id) ? tr('★ Ver {x1}', { x1: CHAMPION_LABEL[championOf(this.save, d.id)] }) : tr('★ Ver HÉROE')) : nextStep(this.save, d)!.step === 'campeon' ? `♛ ${CHAMPION_LABEL[championOf(this.save, d.id) + 1]} (${sparesOf(this.save, d.id)}/${nextStep(this.save, d)!.cost})` : nextStep(this.save, d)!.step === 'estrella' ? tr('★ Estrella de héroe ({sparesOf}/{x1})', { sparesOf: sparesOf(this.save, d.id), x1: nextStep(this.save, d)!.cost }) : tr('▲ Ascensión ({sparesOf}/{x1})', { sparesOf: sparesOf(this.save, d.id), x1: nextStep(this.save, d)!.cost })}</button></p>` : ''}
      ${this.keshinPanel(d)}
      ${d.heroTech ? `<div class="note">${tr('Técnica de HÉROE:')} <b>${esc(tTech(d.heroTech.name))}</b>${isHero(this.save, d.id) ? tr(' (desbloqueada)') : ''}</div>` : ''}
      ${(() => { const pa = adaptedPassive(d); return (pa ? `<div class="note">${tr('Pasiva:')} <b>${esc(pa.name)}</b> · ${esc(passiveText(pa))} <small>${tr('(adaptación de InaZurvivors)')}</small></div>` : '') + d.techniques.filter((t) => t.type === 'talento').map((t) => `<div class="note">${tr('Talento:')} <b>${esc(t.name)}</b> · ${esc(talentText(t.id, 1))} <small>${tr('(efecto adaptado; sube con el nivel de la técnica)')}</small></div>`).join(''); })()}
      <h3 style="margin-top:8px">${tr('Repertorio (2 técnicas activas en combate)')}</h3>
      ${reps.map((t, i) => (t ? `<div class="rep">${i === active ? '<span class="tag start">★ Inicial</span>' : o && this.canStartWith(d, i) ? `<button class="ts-start" data-start="${d.id}:${i}">${tr('☆ Empezar con esta')}</button>` : isLocked(t) && !isBought(this.save, d.id, i) ? '<span class="tag">Tienda</span>' : ''}${this.techHtml(t)}<div class="note">${tr('Maestría {x1}/{MASTERY_USESLength} · +{x2}% daño · {x3} usos', { x1: masteryLevel(this.save.mastery[String(t.id)] ?? 0), MASTERY_USESLength: MASTERY_USES.length, x2: masteryLevel(this.save.mastery[String(t.id)] ?? 0) * MASTERY_BONUS * 100, x3: this.save.mastery[String(t.id)] ?? 0 })}</div></div>`
        : `<div class="rep"><div class="tech"><div class="note">${tr('Ficha pendiente: sin datos de origen para esta técnica.')}</div></div></div>`)).join('')}
      ${d.stats ? (() => { const sp = this.statSplit(d), ae = this.auraEntryOf(d.id), eff: Record<string, number> = sp.eff ?? this.statsOf(d)!; return `<h3 style="margin-top:8px">${tr('Estadísticas · media {statMean}{x1}', { statMean: statMean(eff), x1: ae ? ` <small class="note">${tr('(con su Aura {aeName}; propia {x1})', { aeName: esc(ae.name), x1: statMean(sp.own!) })}</small>` : '' })}</h3><div class="stat-radar">${statRadar(sp.own ?? this.statsOf(d)!, statNames, RARITY_COLOR[effectiveRarity(this.save, d)], sp.add)}</div>
        ${ae ? `<p><button class="btn small blue" data-aura-info="${d.id}">${tr('✦ Ver su Aura')}</button></p>` : ''}
        ${this.trainingHtml(d)}
        <div class="stat-explain">${STAT_INFO.map((s) => { const add = sp.add[s.key] ?? 0, own = sp.own?.[s.key as StatKey] ?? eff[s.key]; return `<div><b>${s.name} ${eff[s.key] ?? '—'}${add ? ` <small class="ai-break">${own} + <i>${tr('{add} Aura', { add })}</i> = ${eff[s.key]}/${EFFECTIVE_STAT_MAX}</small>` : ''}</b><span>${esc(s.what(eff[s.key] ?? 60))}</span></div>`; }).join('')}</div>
        <div class="note">${tr('Valores centrados en 60: por encima suman, por debajo restan. Cada técnica usa las estadísticas de su futbolista. Lo propio llega a 99; con un Aura, hasta {EFFECTIVE_STAT_MAX}.', { EFFECTIVE_STAT_MAX })}</div><div class="bars-mini">${Object.entries(eff).map(([k, v]) => `<span>${statNames[k] ?? k}</span><i style="width:${Math.min(100, v / EFFECTIVE_STAT_MAX * 100)}%"></i>`).join('')}</div>${d.statsSource === 'derivado' ? `<div class="note">${tr('Estadísticas estimadas por posición y rareza: las de IE3 aún no se han descifrado.')}</div>` : ''}`; })() : ''}
      </div></div>`;
  }

  // ------------------------------------------------------------- gacha: IE3 capsule machine (sheet pieces)
  private cap(name: string) { const c = this.m.capsule; return c?.pieces[name] ? `${c.base}${c.pieces[name].file}` : ''; }
  private capColor(r: Rarity) { return this.m.capsule?.rarityColor?.[r] ?? 'rojo'; }

  private gachaBanner: BannerId = 'evento'; // the special banner opens first
  private gachaTeam = '';
  private tabScroll = 0;
  /** 1.88: a pull is only in progress while its knob turns or its capsule is on screen; a lost one frees the machine */
  private pullBusy() { return this.pulling && (performance.now() - this.pullAt < 5000 || !!this.root.querySelector('.reveal')); }
  gacha() {
    const thanksOpen = thanksActive(serverNow()), blOpen = bluelockActive(serverNow());
    if (this.gachaBanner === 'evento' && !thanksOpen) this.gachaBanner = blOpen ? 'bluelock' : 'ff'; // 1.75: only while the event is open
    if (this.gachaBanner === 'bluelock' && !blOpen) this.gachaBanner = 'ff'; // author: InaZurvivors x BlueLock, only while it is open
    const banner = BANNERS[this.gachaBanner];
    const ev = banner.id === 'evento' || banner.id === 'bluelock', wallet = ev ? this.save.eventTokens ?? 0 : this.save.tokens, unit = ev ? tr('fichas de evento') : 'fichas';
    const teams = teamChoices(this.m.roster, this.m.mainTeams ?? []);
    if (banner.id === 'equipo' && !teams.some((t) => t.team === this.gachaTeam)) this.gachaTeam = (teams.find((t) => t.team === this.save.favoriteTeam) ?? teams[0])?.team ?? '';
    const pool = bannerPool(this.m.roster, banner.id, this.gachaTeam);
    const hot = featuredMachine(serverNow()) === banner.id; // (author) today's featured machine: better odds
    const real = rarityOdds(pool, banner.id, hot);
    const each = perPlayerOdds(pool, banner.id, hot);
    const price = bannerPrice(pool, banner.id); // Fix 1.31: by how many Míticos the machine holds
    const PULL_COST = price.cost, MULTI_COST = price.multiCost, HUNDRED_COST = MULTI_COST * 10; // 2.01: ×100 = ten ×10
    const tabs = BANNER_ORDER.filter((b) => (b !== 'evento' || thanksOpen) && (b !== 'bluelock' || blOpen)).map((b) => {
      const bp = bannerPool(this.m.roster, b, this.gachaTeam);
      const pr = b === 'equipo' ? { cost: BANNERS.equipo.cost } : bannerPrice(bp, b);
      const star = featured(bp, 1)[0]; // v1.4: each machine shows its best player
      return `<button class="banner-tab bt4${b === banner.id ? ' on' : ''}${featuredMachine(serverNow()) === b ? ' hot' : ''}" data-banner="${b}" style="--bc:${BANNERS[b].color}">${featuredMachine(serverNow()) === b ? '<i class="bt-hot">HOY ★</i>' : ''}
        <span class="bt-art">${star ? this.mug(star.id, 64) : uiIcon('capsule')}</span>
        <span class="bt-tx"><b>${esc(BANNERS[b].label)}</b><small>${esc(BANNERS[b].tagline)}</small></span><em class="bt-price">${pr.cost}</em></button>`;
    }).join('');
    const teamSel = banner.id === 'equipo' ? `<label class="team-sel">${tr('Equipo:')} <select id="gteam">${teams.map((t) => `<option value="${esc(t.team)}" ${t.team === this.gachaTeam ? 'selected' : ''}>${esc(teamLabel(t.team))} (${t.size})</option>`).join('')}</select></label>` : '';
    // the special banner shows all its stars
    const feat = featured(pool, ev ? pool.filter((p) => p.exclusive).length : 5).map((p) => `<span class="feat r-${p.rarity}" style="--rc:${RARITY_COLOR[p.rarity]}" title="${esc(p.name)}">${this.mug(p.id, 48)}<small>${esc(p.name)}</small></span>`).join('');
    const odds = RARITY_ORDER.map((r) => `<div class="odd"><span class="rar ${r}">${RARITY_LABEL[r].toUpperCase()}</span><i style="--w:${Math.max(1.5, real[r])}%;--c:${RARITY_COLOR[r]}"></i><b>${real[r] ? tr('{x1}% · c/u {x2}%', { x1: (+real[r].toFixed(2)).toLocaleString(locale()), x2: (+each[r].toFixed(3)).toLocaleString(locale()) }) : tr('vacía')}</b></div>`).join('');
    const empty = RARITY_ORDER.filter((r) => !real[r]).map((r) => RARITY_LABEL[r]);
    const hist = (this.save.gachaHistory ?? []).slice(0, 12).map((h) => {
      const p = this.byId.get(h.id);
      return p ? `<span class="hist r-${p.rarity}" style="--rc:${RARITY_COLOR[p.rarity]}" title="${esc(p.name)}">${this.mug(p.id, 40)}${h.isNew ? '<em>NUEVO</em>' : ''}</span>` : '';
    }).join('');
    const sb = starBonus(1);
    const has = !!this.m.capsule;
    setMusicContext('gacha');
    this.show(`<div class="screen gacha-screen">${this.titlebar(tr('Máquina de fichajes'), 'Menú')}
      ${thanksOpen && !ev ? `<button class="pn-eventcta thanks-cta" id="thanksev"><span class="th-faces">${bannerPool(this.m.roster, 'evento').filter((p) => p.exclusive).slice(0, 5).map((p) => this.mug(p.id, 40)).join('')}</span><span><small>${tr('EVENTO · TERMINA EN {x1}', { x1: this.leftText(thanksLeftMs(serverNow())) })}</small><b>${tr('Banner de agradecimiento')}</b><em>${tr('Ataque a los Titanes, Los Siete Pecados Capitales y Axel Encapuchado · {cost} fichas de evento la tirada', { cost: THANKS_EVENT.cost })}</em></span></button>` : ''}
      ${blOpen && banner.id !== 'bluelock' ? `<button class="pn-eventcta bl-cta" id="blev"><span class="th-faces">${BLUELOCK_EVENT.players.map((id) => this.mug(id, 40)).join('')}</span><span><small>${tr('COLABORACIÓN · TERMINA EN {x1}', { x1: this.leftText(bluelockLeftMs(serverNow())) })}</small><b>${tr('InaZurvivors x BlueLock')}</b><em>${tr('Nagi e Isagi · {cost} fichas de evento la tirada', { cost: BLUELOCK_EVENT.cost })}</em></span></button>` : ''}
      ${eventActive(serverNow()) ? `<button class="pn-eventcta" id="pnevent"><span class="pn-cta-art">${pennantSvg('supernova', 44)}</span><span><small>${tr('EVENTO · TERMINA EN {x1}', { x1: this.eventLeftText(serverNow()) })}</small><b>${tr('Banners de leyenda')}</b><em>${tr('Se paga con monedas · Mítico al 3%')}</em></span></button>` : ''}
      <div class="banner-tabs">${tabs}</div>
      <div class="banner-head bh4${banner.id === 'bluelock' ? ' bh-bl' : ''}" style="--bc:${banner.color}"><div class="bh-tx"><small>${banner.id === 'bluelock' ? tr('COLABORACIÓN') : tr('MÁQUINA')}</small>${banner.id === 'bluelock' ? this.blLogo() : `<b>${esc(banner.label)}</b>`}<span>${tr('{tagline} · {poolLength} futbolistas', { tagline: esc(banner.tagline), poolLength: pool.length })}</span> ${teamSel}
          <div class="bh-chips"><span>${uiIcon('capsule')}×1 · <b>${PULL_COST}</b>${ev ? tr(' de evento') : ''}</span><span>${uiIcon('capsule')}×10 · <b>${MULTI_COST}</b>${ev ? tr(' de evento') : ''}</span><span>${uiIcon('capsule')}×100 · <b>${HUNDRED_COST}</b>${ev ? tr(' de evento') : ''}</span>${ev ? `<span>${tr('Termina en')} <b>${this.leftText(banner.id === 'bluelock' ? bluelockLeftMs(serverNow()) : thanksLeftMs(serverNow()))}</b></span>` : ''}<span class="ok">${tr('×10: Épico o mejor asegurado')}</span>${hot ? `<span class="hot">${tr('★ Destacada hoy: Épico ×{x1} · Legendario, Mítico y Leyenda ×{x2}', { x1: String(FEATURED_BOOST.epico).replace('.', ','), x2: String(FEATURED_BOOST.legendario).replace('.', ',') })}</span>` : ''}</div>
          <details class="rk-how"><summary>${tr('{x1}Precio y reglas', { x1: uiIcon('help') })}</summary><div>${ev ? tr('Los futbolistas especiales solo salen aquí, con {x1} Comunes, Raros y Épicos de relleno. Se paga con fichas de evento: cada partida en Rango S o X te da tantas como fichas normales mientras dura el evento.', { x1: pool.filter((p) => !p.exclusive).length }) : banner.id === 'equipo' ? tr('Solo futbolistas del equipo elegido; las rarezas altas tienen un tope por jugador.') : tr('Cada futbolista sale en una sola máquina: la de la primera saga en la que aparece. Precio según sus Míticos ({mythics}): sin estrellas 5 · sin Míticos 10 · de 1 a 5 Míticos 15 · 6 o más 20.', { mythics: price.mythics })}</div></details>${banner.id === 'bluelock' ? this.blRewards() : ''}</div>
        <div class="feat-row"><small>${tr('DESTACADOS')}</small><div>${feat}</div></div>${this.machineCoaches(banner.id)}</div>
      <div class="ie3-machine">${has ? `<div class="ds-top"><img id="globe" src="${this.cap('globe0')}" alt=""></div>
        <div class="ds-bottom" style="background-image:url(${this.cap('panel_bottom')})">
          <img class="goal" src="${this.cap('goal_slot')}" alt=""><div class="knobwrap"><img class="kbase" src="${this.cap('knob_base')}" alt="">
          <img id="knob" class="knob" src="${this.cap('knob00')}" alt=""></div>
          <div class="coins-row"><button class="coinbtn" data-pull="1" ${wallet < PULL_COST ? 'disabled' : ''}><img src="${this.cap('coin_rojo')}" alt=""><span>×1<br>${PULL_COST}</span></button>
          <button class="coinbtn" data-pull="10" ${wallet < MULTI_COST ? 'disabled' : ''}><img src="${this.cap('coin_oro')}" alt=""><span>×10<br>${MULTI_COST}</span></button>
          <button class="coinbtn c100" data-pull="100" ${wallet < HUNDRED_COST ? 'disabled' : ''}><img src="${this.cap('coin_oro')}" alt=""><span>×100<br>${HUNDRED_COST}</span></button></div>
        </div>` : `<div class="own-machine"><div class="om-dome">${Array.from({ length: 14 }, (_, i) => `<i style="--x:${(i * 37) % 80 + 6}%;--y:${(i * 53) % 60 + 25}%;--c:${['#ff4f5a', '#4fb3ff', '#ffe24a', '#5cdc6a', '#b36bff', '#ff9a3a'][i % 6]};--d:${(i % 5) * 0.3}s"></i>`).join('')}</div>
          <div class="om-body"><div class="om-knob" id="ownknob"><b></b></div><div class="om-slot"></div></div>
          <div class="coins-row"><button class="btn" data-pull="1" ${wallet < PULL_COST ? 'disabled' : ''}>×1 · ${PULL_COST} ${unit}</button>
          <button class="btn" data-pull="10" ${wallet < MULTI_COST ? 'disabled' : ''}>×10 · ${MULTI_COST} ${unit}</button>
          <button class="btn c100" data-pull="100" ${wallet < HUNDRED_COST ? 'disabled' : ''}>×100 · ${HUNDRED_COST} ${unit}</button></div></div>`}</div>
      <div class="gacha-info">
        <div class="panel gi gi-wallet"><h3>${tr('{x1}Tus {unit}', { x1: uiIcon('capsule'), unit })}</h3><div class="gi-big"><span class="tokens${ev ? ' ev-tok' : ''}">${wallet}</span></div>
          <div class="note">${tr('{x1} <b>{PULL_COST}</b> {x2} <b>{MULTI_COST}</b> {x3} <b>{HUNDRED_COST}</b> (diez ×10 de golpe, un Épico o mejor asegurado en cada diez). {x4}{x5}', { x1: tr('×1 cuesta'), PULL_COST, x2: tr('· ×10 cuesta'), MULTI_COST, x3: tr('(con un Épico o mejor asegurado) · ×100 cuesta'), HUNDRED_COST, x4: wallet < PULL_COST ? `Te faltan ${PULL_COST - wallet}.` : tr('Te llega para {x1} tirada(s).', { x1: Math.floor(wallet / PULL_COST) }), x5: ev ? tr(' Las fichas de evento se ganan jugando en Rango S o X.') : '' })}</div></div>
        <div class="panel gi"><h3>${tr('{x1}Cómo conseguir fichas', { x1: uiIcon('gift') })}</h3><ul class="gi-list"><li>${tr('Jugar partidas (más si ganas)')}</li><li>${tr('Misiones diarias, semanales y logros')}</li><li>${tr('Altares y fichas en el campo')}</li><li>${tr('Primera victoria en cada arena y rango')}</li></ul></div>
        <details class="panel gi gi-rules"><summary><h3>${tr('{x1}Nuevo, duplicado y ascensión', { x1: uiIcon('help') })}</h3></summary><ul class="gi-list"><li><b class="newtag">${tr('NUEVO')}</b>${tr(': se desbloquea para siempre y ya puede ir en Mi Equipo.')}</li>
          <li><b>${tr('Duplicado')}</b>${tr(': sirve para ascender al futbolista; si ya no puede ascender más, se convierte en monedas.')}</li><li><b>${tr('Estrellas')}</b> ${tr('(hasta {MAX_STARS}): se compran con monedas en su ficha (10.000, 20.000… 50.000). Cada una da +{x1}% daño, +{x2}% vida y +5 al límite de la estadística que elijas. Los HÉROES y Campeones tienen 3 estrellas extra (100.000, 110.000 y 120.000).', { MAX_STARS, x1: Math.round((sb.damage - 1) * 100), x2: Math.round((sb.hp - 1) * 100) })}</li>
          <li>${tr('Los duplicados también pagan la <b>ascensión</b> de cualquier futbolista (Fix 1.53): cada ascensión sube una rareza y cuesta según la rareza desde la que sube (Común {ascenso}, Raro {ascenso2}, Épico {ascenso3}, Legendario {ascenso4}). Al llegar a Mítico, el HÉROE cuesta según la rareza con la que nació: Común {heroe}, Raro {heroe2}, Épico {heroe3}, Legendario {heroe4}, Mítico {heroe5} y Leyenda {heroe6}. Después, cada HÉROE gana hasta {HERO_STARS_MAX} estrellas de héroe (Mítico {estrella} duplicados cada una).', { ascenso: ASC_COSTS.comun.ascenso, ascenso2: ASC_COSTS.raro.ascenso, ascenso3: ASC_COSTS.epico.ascenso, ascenso4: ASC_COSTS.legendario.ascenso, heroe: ASC_COSTS.comun.heroe, heroe2: ASC_COSTS.raro.heroe, heroe3: ASC_COSTS.epico.heroe, heroe4: ASC_COSTS.legendario.heroe, heroe5: ASC_COSTS.mitico.heroe, heroe6: ASC_COSTS.leyenda.heroe, HERO_STARS_MAX, estrella: ASC_COSTS.mitico.estrella })}</li>
          <li>${tr('Con {MAX_STARS} estrellas y HÉROE, cada copia da monedas (de {comun} a {leyenda} según la rareza).', { MAX_STARS, comun: DUPLICATE_REFUND_BY.comun, leyenda: DUPLICATE_REFUND_BY.leyenda })}</li></ul></details>
        <div class="panel gi gi-odds"><h3>${tr('{x1}Probabilidades', { x1: uiIcon('target') })}</h3><div class="odds">${odds}</div>${empty.length ? `<div class="note">${tr('{x1}: sin futbolistas por ahora; su probabilidad pasa a la rareza inferior.', { x1: esc(empty.join(', ')) })}</div>` : ''}</div>
      </div>
      <div class="panel gi-hist"><h3>${tr('{x1}Últimas tiradas', { x1: uiIcon('clock') })}</h3><div class="hist-row">${hist || `<span class="note">${tr('Aún no has tirado.')}</span>`}</div>
        <div class="note">${tr('Fichas = máquina de cápsulas · Monedas = mejoras y tiendas. Gráficos de la máquina: Inazuma Eleven 3 (hoja de The Spriters Resource, ripeada por Avegaille), recurso local.')}</div></div></div>`);
    this.on('[data-back]', 'click', () => this.mainMenu());
    document.getElementById('pnevent')?.addEventListener('click', () => { if (!this.pulling) this.pennantEvent(); });
    // 1.88: the tab row keeps its scroll when the machine changes, and the chosen one stays in sight
    const row = this.root.querySelector<HTMLElement>('.banner-tabs');
    if (row) {
      row.scrollLeft = this.tabScroll;
      const on = row.querySelector<HTMLElement>('.banner-tab.on');
      if (on && (on.offsetLeft < row.scrollLeft || on.offsetLeft + on.offsetWidth > row.scrollLeft + row.clientWidth)) row.scrollLeft = on.offsetLeft - 8;
      row.addEventListener('scroll', () => { this.tabScroll = row.scrollLeft; }, { passive: true });
      this.tabScroll = row.scrollLeft;
    }
    const pick = (b: BannerId) => { if (this.pullBusy()) return; this.pulling = false; this.gachaBanner = b; this.gacha(); };
    this.onTap('#thanksev', () => pick('evento'));
    this.onTap('#blev', () => pick('bluelock'));
    this.onTap('[data-banner]', (el) => pick(el.dataset.banner as BannerId));
    document.getElementById('gteam')?.addEventListener('change', (e) => { this.gachaTeam = (e.target as HTMLSelectElement).value; this.gacha(); });
    this.on('[data-pull]', 'click', async (_e, el) => {
      if (this.pullBusy()) return; // one transaction at a time: a double click can never charge twice
      this.pulling = true;
      this.pullAt = performance.now();
      const b = BANNERS[this.gachaBanner];
      const bpool = bannerPool(this.m.roster, b.id, this.gachaTeam);
      const bp = bannerPrice(bpool, b.id);
      const claimsBefore = new Set(this.teamClaimList().map((c) => `${c.team}|${c.kind}`));
      const res = pull(bpool, this.save, Number(el.dataset.pull) as 1 | 10 | 100, Math.random, { cost: bp.cost, multiCost: bp.multiCost, odds: rarityOdds(bpool, b.id, featuredMachine(serverNow()) === b.id), currency: b.id === 'evento' || b.id === 'bluelock' ? 'eventTokens' : 'tokens' });
      if (!res) { this.pulling = false; return; }
      recordHistory(this.save, res);
      addCounter(this.save, 'news', res.filter((x) => x.isNew).length);
      const coachGot = this.rollCoach(b.id, res.length); // pre-2.0
      this.persist();
      this.root.querySelectorAll<HTMLButtonElement>('[data-pull], [data-back]').forEach((b) => (b.disabled = true));
      try {
        await this.turnKnob();
        await this.capsuleShow(res, res.length > 1 ? `Fichaje ×${res.length}` : 'Fichaje');
      } finally {
        this.pulling = false;
      }
      this.gachaSummary(res);
      if (coachGot) window.setTimeout(() => this.coachReveal(coachGot), 350);
      // v1.4: a pull that completes a team reward (crest, kit, captain) says which team, right away
      const fresh = this.teamClaimList().filter((c) => !claimsBefore.has(`${c.team}|${c.kind}`));
      if (fresh.length) window.setTimeout(() => this.claimNotice(fresh, tr('¡Nueva recompensa de equipo!')), 300);
      this.claimsAnnounced = this.collectionClaims(); // already told: the menu does not repeat it
    });
    if (has) this.animateGlobe();
  }

  /** ms between globe frames: idle shuffle, faster while the knob turns */
  private globeMs = 520;
  private animateGlobe() {
    let i = 0;
    const tick = () => {
      const g = document.getElementById('globe') as HTMLImageElement | null;
      if (!g) return;
      g.src = this.cap(`globe${i++ % 3}`);
      setTimeout(tick, this.globeMs);
    };
    tick();
  }

  private async turnKnob() {
    const own = document.getElementById('ownknob');
    if (own) { // web build machine: one smooth eased turn
      sfx('whoosh');
      own.classList.add('turn');
      document.querySelector('.own-machine')?.classList.add('shake');
      await wait(650);
      document.querySelector('.own-machine')?.classList.remove('shake');
      return;
    }
    const k = document.getElementById('knob') as HTMLImageElement | null;
    if (!k) return;
    // one clockwise turn like a real crank: it starts heavy, runs, and brakes; a ratchet click every quarter turn
    const TURN_MS = 1050;
    const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
    const timeAt = (p: number) => { let lo = 0, hi = 1; for (let n = 0; n < 20; n++) { const m = (lo + hi) / 2; if (ease(m) < p) lo = m; else hi = m; } return lo * TURN_MS; };
    const show = (f: number) => { k.src = this.cap(`knob${String(f).padStart(2, '0')}`); };
    this.globeMs = 110;
    let prev = 0;
    for (let f = 1; f <= 24; f++) {
      const at = timeAt(f / 24);
      await wait(at - prev);
      prev = at;
      show(f % 24);
      if (f % 6 === 0) sfx('click');
    }
    // the spring of the crank pushes it a hair past and back
    show(1); await wait(70); show(0);
    this.globeMs = 520;
    const machine = document.querySelector('.ie3-machine');
    machine?.classList.add('shake');
    sfx('kick');
    await wait(380);
    machine?.classList.remove('shake');
  }

  /** Capsule falls (spin frames), wobbles, opens (open + halves) and reveals the card. Used by gacha and onboarding. */
  private async capsuleShow(results: PullResult[], title: string) {
    let skip = false;
    this.revealSpeed = 1;
    if (results.length > 10) { // 2.01: a ×100 only plays its Legendario-or-better capsules, then shows everything at once
      const best = results.filter((r) => RARITY_ORDER.indexOf(r.player.rarity) >= RARITY_ORDER.indexOf('legendario'));
      for (let i = 0; i < best.length && !skip; i++) skip = await this.revealOne(best[i], true, `${title} · lo mejor ${i + 1}/${best.length}`);
      await this.skippedSummary(results, title);
      return;
    }
    for (let i = 0; i < results.length && !skip; i++) skip = await this.revealOne(results[i], results.length > 1, `${title} ${results.length > 1 ? `${i + 1}/${results.length}` : ''}`);
    if (skip) await this.skippedSummary(results, title);
  }
  /** 2.01: the same player pulled several times in a big pull is one card with ×n (the new copy first) */
  private groupPulls(results: PullResult[]) {
    const by = new Map<number, { r: PullResult; n: number }>();
    for (const r of results) {
      const g = by.get(r.player.id);
      if (!g) by.set(r.player.id, { r, n: 1 });
      else { g.n++; if (r.isNew) g.r = r; }
    }
    return [...by.values()];
  }

  /** Fix 1.31: after «Saltar todo», everything the pull gave at once (best first), closed with a click or Space/Enter/Esc. */
  private skippedSummary(results: PullResult[], title: string): Promise<void> {
    return new Promise((resolve) => {
      const rank = (r: PullResult) => RARITY_ORDER.indexOf(r.player.rarity) * 2 + (r.isNew ? 1 : 0);
      const groups = results.length > 10 ? this.groupPulls(results) : results.map((r) => ({ r, n: 1 }));
      const sorted = groups.sort((a, b) => rank(b.r) - rank(a.r));
      const badge = (r: PullResult) => r.isNew ? tr('NUEVO') : r.refund ? `+${r.refund} ◉` : r.starReady ? `★${r.starReady} lista` : r.toStar ? `${r.toStar[0]}/${r.toStar[1]} ★` : r.forAscension ? '+1 ascenso' : `★${r.stars}`;
      const main = new Set(this.m.mainTeams ?? []);
      const teamOf = (r: PullResult) => teamLabel(r.player.teams.find((t) => main.has(t)) ?? r.player.teams[0] ?? '') || 'Fichatrón';
      const what = (r: PullResult) => r.isNew ? `<em class="ps-new">${tr('¡NUEVO!')}</em>` : r.refund ? `<em>${tr('Duplicado · +{refund} monedas', { refund: r.refund })}</em>` : r.starReady ? `<em class="ps-star">${tr('¡Estrella {starReady} lista! Súbela en su ficha', { starReady: r.starReady })}</em>` : nextStep(this.save, r.player) && sparesOf(this.save, r.player.id) >= nextStep(this.save, r.player)!.cost ? `<em class="ps-asc">${tr('Duplicado · ¡ya puede ascender!')}</em>` : r.toStar ? `<em>${tr('Duplicado · {x1}/{x2} hacia ★', { x1: r.toStar[0], x2: r.toStar[1] })}</em>` : '<em>Duplicado</em>';
      const dupTeams = new Map<string, number>();
      for (const r of results) if (!r.isNew) dupTeams.set(teamOf(r), (dupTeams.get(teamOf(r)) ?? 0) + 1);
      const news = results.filter((r) => r.isNew).length;
      const ov = document.createElement('div');
      ov.className = 'reveal pull-summary';
      ov.innerHTML = `<div class="pull-summary-box"><h3>${tr('{title} · todo lo que has fichado', { title: esc(title) })}</h3>
        <div class="note">${[news ? `${news} ${news === 1 ? 'fichaje nuevo' : 'fichajes nuevos'}` : '', results.length - news ? `${results.length - news} ${results.length - news === 1 ? 'duplicado' : 'duplicados'}` : ''].filter(Boolean).join(' · ')}</div>
        ${dupTeams.size ? `<div class="ps-teams">${tr('Duplicados por equipo: {x1}', { x1: [...dupTeams].map(([t, n]) => `<span>${esc(t)} ×${n}</span>`).join('') })}</div>` : ''}
        <div class="grid">${sorted.map(({ r, n }) => `<div class="ps-item r-${r.player.rarity}${r.isNew ? ' is-new' : ''}">${this.pcard(r.player, { badge: badge(r) })}${n > 1 ? `<i class="ps-n">×${n}</i>` : ''}<div class="ps-cap"><b>${esc(teamOf(r))}</b>${what(r)}</div></div>`).join('')}</div>
        <button class="btn big">${tr('Aceptar')}</button></div>`;
      this.root.appendChild(ov);
      mountPreviews();
      sfx('reveal');
      const shownAt = performance.now();
      const close = () => { window.removeEventListener('keydown', keys, true); ov.remove(); resolve(); };
      const keys = (e: KeyboardEvent) => {
        if (e.repeat || performance.now() - shownAt < 200) return;
        if (!['Space', 'Enter', 'NumpadEnter', 'Escape'].includes(e.code)) return;
        e.preventDefault(); e.stopPropagation(); close();
      };
      window.addEventListener('keydown', keys, true);
      ov.querySelector('.btn')!.addEventListener('click', close);
    });
  }

  /** Fix 1.22: ×2 in multi pulls, remembered while the pull lasts */
  private revealSpeed = 1;

  private revealOne(r: PullResult, multi: boolean, title: string): Promise<boolean> {
    return new Promise((resolve) => {
      const p = r.player;
      const special = p.rarity === 'legendario' || p.rarity === 'mitico' || p.rarity === 'leyenda';
      const col = this.capColor(p.rarity);
      const ov = document.createElement('div');
      ov.className = `reveal${p.rarity === 'legendario' ? ' legend' : ''}${p.rarity === 'mitico' ? ' myth' : ''}${p.rarity === 'leyenda' ? ' myth leyenda' : ''}`;
      const tier = p.rarity === 'leyenda' ? 3 : p.rarity === 'mitico' ? 2 : special ? 1 : 0;
      ov.style.setProperty('--rc', `${RARITY_COLOR[p.rarity]}55`);
      const has = !!this.m.capsule;
      ov.innerHTML = `<div class="rays"></div><div class="reveal-title">${esc(title)}</div>
        ${has ? '<img class="cap-sprite" id="capimg" alt="">' : `<div class="capsule" style="--c:${RARITY_COLOR[p.rarity]}"><div class="top"></div><div class="bot"></div></div>`}
        <div class="flash"></div><button class="btn small blue skip">${multi ? tr('Saltar todo') : 'Saltar'}</button>${multi ? `<button class="btn small speed${this.revealSpeed > 1 ? ' on' : ''}">×2</button>` : ''}`;
      this.root.appendChild(ov);
      if (special) HAPTIC.legend(); // 2.3: a Legendario or better buzzes as it is revealed
      let done = false;
      const finish = (skipAll: boolean) => { if (done) return; done = true; window.removeEventListener('keydown', keys, true); ov.remove(); resolve(skipAll); };
      let skipAnim = false;
      // Fix 1.23: Space (or Enter) skips the animation and, on the card, accepts it; Esc skips the whole ×10
      const shownAt = performance.now();
      const keys = (e: KeyboardEvent) => {
        if (e.repeat || performance.now() - shownAt < 120) return; // a press held from the previous card doesn't count
        if (e.code === 'Escape' && multi) { e.preventDefault(); e.stopPropagation(); finish(true); return; }
        if (e.code !== 'Space' && e.code !== 'Enter' && e.code !== 'NumpadEnter') return;
        e.preventDefault(); e.stopPropagation();
        const accept = ov.querySelector<HTMLElement>('.reveal-card .btn');
        if (accept) accept.click(); else skipAnim = true;
      };
      window.addEventListener('keydown', keys, true);
      ov.querySelector('.skip')?.addEventListener('click', (e) => {
        e.stopPropagation();
        if (multi) finish(true);
        else skipAnim = true; // single pull: jump to the card, the result is still shown
      });
      const img = ov.querySelector('#capimg') as HTMLImageElement | null;
      // frames differ in size: draw each at 3x its real pixels instead of stretching them to one box
      const frame = (name: string) => {
        const k = `cap_${col}_${name}`;
        const piece = this.m.capsule?.pieces[k];
        if (!img || !piece) return;
        img.src = this.cap(k);
        img.style.width = `${piece.w * 3}px`;
        img.style.height = `${piece.h * 3}px`;
      };
      ov.querySelector('.speed')?.addEventListener('click', (e) => { e.stopPropagation(); this.revealSpeed = this.revealSpeed > 1 ? 1 : 2; (e.currentTarget as HTMLElement).classList.toggle('on', this.revealSpeed > 1); });
      const pause = async (ms: number) => { for (let t = 0; t < ms / this.revealSpeed && !skipAnim; t += 30) await wait(30); };
      /**
       * Fix 1.22: Legendario, Mítico and Leyenda get a scene instead of the plain capsule. The real minisprite of the
       * footballer, hidden as a silhouette, walks in, stops, gets a ball and kicks it into the capsule, which breaks open;
       * then the bodyshot and the card. Same story for the three, a different staging for each: gold and an elegant
       * flash for Legendario; energy around the player, tension and a prismatic burst for Mítico; a spotlight, a crown,
       * a dramatic pause and a shattering capsule for Leyenda. The reward was already saved before any of this.
       */
      const cine = async () => {
        ov.classList.add('cine', `cine-${p.rarity}`);
        const stage = document.createElement('div');
        stage.className = 'cr-stage';
        stage.innerHTML = `<div class="cr-bg"></div><div class="cr-floor"></div>${p.rarity === 'leyenda' ? '<div class="cr-spot"></div><div class="cr-crown">♛</div>' : ''}
          <div class="cr-runner"><div class="cr-aura"></div>${charCanvas(p.id, 4, 10, 'cr-sil')}</div>${['', ' ghost g1', ' ghost g2', ' ghost g3'].map((g) => `<div class="cr-ball${g}"><i style="background-image:url(${footballUrl()})"></i></div>`).join('')}<div class="cr-hand">✋</div>
          <div class="cr-burst"></div><div class="cr-flash"></div><div class="cr-mug"><div class="cr-halo"></div>${this.mug(p.id, 128)}</div>`;
        // the footballer's own technique: a goalkeeper stops the ball, a shooter kicks it, a dribbler or defender charges
        const actives = p.techniques.filter((t) => t.type !== 'talento');
        const best = (type: string) => actives.filter((t) => t.type === type).sort((x, y) => y.power - x.power)[0];
        const shot = actives.find((t) => t.name === SIGNATURE[p.name]) ?? (p.position === 'GK' ? best('parada') : best('tiro')) ?? actives[0];
        const act = shot?.type === 'parada' ? 'parada' : shot?.type === 'regate' || shot?.type === 'defensa' ? 'carga' : 'tiro';
        const ec = ELEMENT_COLOR[String(shot?.element ?? p.element)] ?? RARITY_COLOR[p.rarity];
        stage.style.setProperty('--ec', ec);
        if (shot) stage.insertAdjacentHTML('beforeend', `<div class="cr-cutin"><div class="ci-band"><span class="ci-mug">${this.mug(p.id, 64)}</span><span class="ci-text"><b>¡${esc(shot.name.toUpperCase())}!</b><small>${esc(p.name)}</small></span></div></div>`);
        ov.insertBefore(stage, ov.firstChild);
        mountPreviews();
        const runner = stage.querySelector('.cr-runner') as HTMLElement, sprite = stage.querySelector('canvas.char') as HTMLCanvasElement;
        const balls = [...stage.querySelectorAll('.cr-ball')] as HTMLElement[];
        const ball = balls[0];
        if (img) { img.classList.add('cr-cap'); img.style.setProperty('--glow', RARITY_COLOR[p.rarity]); frame('spin0'); }
        const T = { legendario: { walk: 1100, pose: 350, hold: 0 }, mitico: { walk: 1200, pose: 650, hold: 0 }, leyenda: { walk: 1500, pose: 500, hold: 1000 } }[p.rarity as 'legendario']!;
        if (p.rarity === 'leyenda') { sfx('whoosh'); await pause(700); } // the spotlight and the crown come first
        runner.style.transition = `transform ${T.walk / this.revealSpeed}ms linear`;
        await wait(20);
        runner.classList.add('walk');
        for (let s = 0; s < T.walk && !skipAnim; s += 300) { sfx('click'); await pause(300); }
        sprite.dataset.anim = '2'; // standing, facing the capsule
        stage.classList.add('pose');
        if (p.rarity === 'mitico') { for (let b = 0; b < 3 && !skipAnim; b++) { sfx('click'); await pause(T.pose / 3); } } else await pause(T.pose);
        if (T.hold) { stage.classList.add('hold'); await pause(T.hold); stage.classList.remove('hold'); } // the dramatic pause of Leyenda
        if (act !== 'parada') { ball.classList.add('in'); await pause(220); }
        // the name of the technique crosses the screen, as when a supertechnique is used in a match
        if (shot) { stage.classList.add('cutin'); sfx('whoosh'); await pause(p.rarity === 'leyenda' ? 950 : 800); stage.classList.remove('cutin'); stage.classList.add('cutout'); }
        if (act === 'parada') {
          // the capsule fires the ball at the goalkeeper, who stops it with the technique's hand; the stop breaks it open
          sfx('kick');
          for (const b of balls) b.classList.add('save');
          await pause(420);
          for (const b of balls) b.classList.add('caught');
          stage.classList.add('catch'); sfx('hit');
          await pause(520);
        } else if (act === 'carga') {
          sprite.dataset.anim = '10'; // a burst run with the ball at the feet, straight into the capsule
          sfx('sweep');
          runner.style.transition = 'transform .34s cubic-bezier(.5,0,.9,.6)';
          runner.classList.add('dash'); for (const b of balls) b.classList.add('dash');
          await pause(340);
        } else {
          sprite.dataset.anim = '18'; // the kick
          sfx('kick');
          await pause(160);
          for (const b of balls) b.classList.add('shot');
          await pause(380);
        }
        // the capsule breaks open
        sfx('boom');
        if (this.save.settings.shake > 0 && p.rarity !== 'legendario') ov.classList.add('quake');
        if (img) { frame('open'); await pause(110); for (const h of ['half0', 'half1', 'half2']) { frame(h); await pause(70); } img.classList.add('pop'); }
        stage.classList.add('open');
        sprite.classList.remove('cr-sil'); // the silhouette shows who it is
        sprite.dataset.anim = '12';
        ov.classList.remove('quake');
        await pause(p.rarity === 'leyenda' ? 1100 : 850); // the bodyshot rises out of the flash and holds a moment
        stage.classList.add('to-card'); // ...then it hands over to the card, crossfading (no cut)
      };
      const seq = async () => {
        if (special) await cine();
        else if (img) {
          // Fix 1.22: common, rare and epic open fast (about 1.3 s): roll, settle, a beat for epic, open
          img.style.setProperty('--glow', RARITY_COLOR[p.rarity]);
          frame('spin0');
          img.classList.add('roll-in');
          const steps = 8;
          for (let k = 0; k < steps && !skipAnim; k++) { frame(`spin${k % 6}`); await wait((28 + 60 * (k / steps) ** 2) / this.revealSpeed); }
          if (!skipAnim) sfx('kick');
          img.classList.remove('roll-in');
          img.classList.add('settle');
          await pause(220);
          img.classList.remove('settle');
          if (p.rarity === 'epico') { img.classList.add('charge', 'c1'); sfx('click'); await pause(240); } // epic charges once
          if (p.rarity === 'raro') ov.classList.add('rare-flash');
          frame('open');
          sfx('whoosh');
          await pause(120);
          // the two halves fly apart (the sheet's own frames) and the player comes out
          for (const h of ['half0', 'half1', 'half2']) { frame(h); await pause(80); }
          img.classList.remove('charge', `c${tier}`);
          ov.classList.remove('quake');
          img.classList.add('pop');
        } else {
          await wait(900);
          ov.querySelector('.capsule')?.classList.add('open');
        }
        sfx(p.rarity === 'epico' ? 'legend' : (['reveal', 'legend', 'myth', 'leyenda'] as const)[tier]);
        if (special && this.save.settings.flashes) ov.querySelector('.flash')!.classList.add('go');
        const n = this.save.settings.particles === 'desactivado' ? 0 : (p.rarity === 'comun' ? 10 : p.rarity === 'raro' ? 18 : p.rarity === 'epico' ? 30 : [20, 44, 70, 100][tier]) * (this.save.settings.particles === 'reducido' ? 0.5 : 1);
        for (let i = 0; i < n; i++) {
          const s = document.createElement('i');
          s.className = 'spark';
          const a = Math.random() * Math.PI * 2, d = 80 + Math.random() * (special ? 280 : 150);
          s.style.setProperty('--dx', `${Math.cos(a) * d}px`);
          s.style.setProperty('--dy', `${Math.sin(a) * d}px`);
          s.style.setProperty('--c', i % 3 ? RARITY_COLOR[p.rarity] : '#fff');
          ov.appendChild(s);
        }
        await wait(special ? 220 : 120);
        const card = document.createElement('div');
        card.className = 'reveal-card';
        card.innerHTML = `<div class="rarity-big t${tier}" style="color:${RARITY_COLOR[p.rarity]}">${RARITY_LABEL[p.rarity].toUpperCase()}</div>
          ${this.pcard(p, { anim: 12, big: true })}<div class="${r.isNew ? 'newtag' : 'stars'}">${r.isNew ? tr('¡NUEVO FICHAJE!') : r.refund ? tr('Al máximo: +{refund} monedas', { refund: r.refund }) : r.starReady ? tr('¡Estrella {starReady} lista para subir!', { starReady: r.starReady }) : r.toStar ? tr('Duplicado · {x1}/{x2} para la siguiente ★', { x1: r.toStar[0], x2: r.toStar[1] }) : r.forAscension ? tr('Duplicado · +1 para ascender') : tr('Duplicado · {x1}', { x1: '★'.repeat(r.stars) })}</div>
          <button class="btn big">${multi ? tr('Siguiente ▶') : 'Aceptar'}</button>`;
        ov.appendChild(card);
        if (special) card.classList.add('from-scene');
        mountPreviews();
        card.querySelector('.btn')!.addEventListener('click', () => finish(false));
      };
      // 1.88: a failing animation never leaves the pull hanging (the reward was already saved)
      seq().catch((e) => { console.error('reveal', e); finish(false); });
    });
  }

  private gachaSummary(res: PullResult[]) {
    this.gacha();
    const panel = document.createElement('div');
    panel.className = 'panel';
    panel.style.marginTop = '14px';
    const groups = res.length > 10 ? this.groupPulls(res) : res.map((r) => ({ r, n: 1 })); // 2.01: ×100 grouped
    panel.innerHTML = `<h3>${tr('Resultado ({resLength})', { resLength: res.length })}</h3><div class="grid">${groups.map(({ r, n }) => this.pcard(r.player, {
      badge: `${r.isNew ? tr('NUEVO') : r.refund ? `+${r.refund}` : `★${r.stars}`}${n > 1 ? ` ×${n}` : ''}` })).join('')}</div>`;
    this.root.querySelector('.screen')!.appendChild(panel);
    mountPreviews();
  }

  // ------------------------------------------------------------- upgrades, options, profile
  perks(cat: PerkCategory = this.perkTab) {
    setMusicContext('menu');
    this.perkTab = cat;
    const levels = categoryLevels(this.save, cat);
    const next = MILESTONES.find((m) => levels < m);
    // v1.4: each category with its own colour and icon; cards with the level, now » next and the price on the button
    const CAT: Record<PerkCategory, [UiIconName, string]> = { Supervivencia: ['soundOn', '#5cdc6a'], Combate: ['fire', '#ff6a3a'], Progresión: ['perks', '#4fd8ff'], Economía: ['shop', '#ffd23f'], Equipo: ['team', '#c58bff'] };
    CAT.Supervivencia[0] = 'target';
    const [cic, cc] = CAT[cat];
    const top = MILESTONES[MILESTONES.length - 1];
    const cards = PERKS.filter((p) => p.category === cat).map((p, i) => {
      const lv = perkLevel(this.save, p.id);
      const cost = perkCost(p, lv);
      const max = lv >= p.max;
      const blocked = !!p.requires && !perkLevel(this.save, p.requires);
      const poor = !max && !blocked && this.save.coins < cost;
      return `<div class="pk-card${max ? ' max' : ''}${blocked ? ' blocked' : ''}${lv ? ' some' : ''}" style="--d:${i * 40}ms">
        <div class="pk-top"><span class="pk-ic">${uiIcon(cic)}</span><b>${esc(p.label)}</b><span class="pk-lv"><em>${lv}</em>/${p.max}</span></div>
        <div class="pk-desc">${esc(p.description)}</div>
        <div class="pk-val"><span class="now">${lv ? perkValue(p, lv) : '—'}</span>${max ? `<span class="maxed">${tr('MÁXIMO')}</span>` : `<i>›</i><span class="nx">${perkValue(p, lv + 1)}</span>`}</div>
        <div class="pk-pips">${Array.from({ length: p.max }, (_, k) => `<i class="${k < lv ? 'on' : ''}"></i>`).join('')}</div>
        <button class="pk-buy${poor ? ' poor' : ''}" data-perk="${p.id}" ${max || blocked || poor ? 'disabled' : ''}>${max ? '✔ COMPLETA' : blocked ? tr('🔒 Requiere la anterior') : `<span class="rw-chip c">${cost}</span>${poor ? tr('Te faltan monedas') : tr('MEJORAR')}`}</button></div>`;
    }).join('');
    this.show(`<div class="screen pk-screen" style="--cc:${cc}">${this.titlebar(tr('Mejoras permanentes'), 'Menú')}
      <div class="pk-tabs" id="cats">${PERK_CATEGORIES.map((c) => `<button data-c="${c}" class="pk-tab${c === cat ? ' on' : ''}" style="--cc:${CAT[c][1]}"><span class="m4-ic">${uiIcon(CAT[c][0])}</span><b>${tr(c)}</b><small>${tr('{categoryLevels} niveles', { categoryLevels: categoryLevels(this.save, c) })}</small></button>`).join('')}</div>
      <div class="pk-hero"><span class="pk-hero-ic">${uiIcon(cic)}</span><div class="pk-hero-tx"><small>${tr('BONIFICACIÓN DE {toUpperCase}', { toUpperCase: tr(cat).toUpperCase() })}</small><b>${esc(CATEGORY_BONUS[cat])}</b>
        <div class="pk-track"><i style="width:${Math.min(100, levels / top * 100)}%"></i>${MILESTONES.map((m) => `<span class="pk-ms${levels >= m ? ' got' : ''}" style="left:${m / top * 100}%"><em>${m}</em></span>`).join('')}</div>
        <span class="note">${next ? tr('{levels}/{next} niveles en esta categoría para el siguiente premio (acumulable).', { levels, next }) : tr('¡Todos los premios de esta categoría conseguidos!')}</span></div></div>
      <div class="pk-cards">${cards}</div>
      <div class="pk-foot"><span>${tr('Invertido: <b>{spentOn}</b> monedas · pulsa dos veces para confirmar cada compra', { spentOn: spentOn(this.save) })}</span><button class="btn small blue" id="refund" ${spentOn(this.save) ? '' : 'disabled'}>${tr('Reiniciar y recuperar todo')}</button></div></div>`);
    this.on('[data-back]', 'click', () => this.mainMenu());
    this.on('#cats button', 'click', (_e, el) => this.perks(el.dataset.c as PerkCategory));
    document.getElementById('refund')!.addEventListener('click', (e) => this.armed(e.currentTarget as HTMLElement, () => { refundPerks(this.save); this.persist(); sfx('buy'); this.perks(); }));
    this.on('[data-perk]', 'click', (_e, el) => this.armed(el, () => {
      const ok = buyPerk(this.save, el.dataset.perk!);
      if (ok) { this.persist(); sfx('powerup'); } else sfx('error');
      const id = el.dataset.perk;
      this.perks();
      if (ok) document.querySelector(`[data-perk="${id}"]`)?.closest('.pk-card')?.classList.add('bought');
    }));
  }

  /** v1.4: one pending refresh of the rewards screen after the claim animations (several quick claims share it) */
  private misRefresh = 0;
  missions(kind: MissionKind = this.missionTab, filter = this.missionFilter) {
    setMusicContext('menu');
    rollPeriods(this.save);
    recordCollection(this.save, this.m.roster, this.m.mainTeams ?? [], this.auraMaxStat());
    this.missionTab = kind;
    this.missionFilter = filter;
    window.clearTimeout(this.misRefresh);
    const mult = perkEffects(this.save).missionMult;
    const TABS: [MissionKind, string, UiIconName, string][] = [['diaria', tr('Diarias'), 'clock', tr('Se reinician a medianoche')], ['semanal', tr('Semanales'), 'missions', tr('Se reinician el lunes')],
      ['partida', tr('De partida'), 'pitch', tr('En una sola partida')], ['logro', tr('Logros'), 'trophy', tr('Para siempre')]];
    const state = (d: (typeof MISSIONS)[number]) => (isClaimed(this.save, d) ? 'reclamadas' : isClaimable(this.save, d) ? 'disponibles' : 'pendientes');
    const ready = MISSIONS.filter((d) => isClaimable(this.save, d));
    const pend = (k: MissionKind) => ready.filter((d) => d.kind === k).length;
    const sumCoins = ready.reduce((n, d) => n + Math.round(d.coins * mult), 0), sumTokens = ready.reduce((n, d) => n + d.tokens, 0);
    const list = MISSIONS.filter((d) => d.kind === kind && (filter === 'todas' || state(d) === filter))
      .sort((x, y) => ['disponibles', 'pendientes', 'reclamadas'].indexOf(state(x)) - ['disponibles', 'pendientes', 'reclamadas'].indexOf(state(y)));
    const icon = TABS.find((t) => t[0] === kind)![2];
    const rows = list.map((d, i) => {
      const p = Math.min(d.goal, missionProgress(this.save, d)), st = state(d), pc = Math.round(p / d.goal * 100);
      // v1.5: achievements show their category and a medal of their tier (bronze 10, silver 20, gold 50 fichas)
      const cat = d.kind !== 'logro' ? null : /^a_/.test(d.id) ? ['aura', '✦ AURAS'] : /^c_|col|equipo|mitico|heroe|ascenso|fichajes|eras/.test(d.id) ? ['col', tr('★ COLECCIÓN')]
        : /^g_|niveles|combos/.test(d.id) ? ['prog', tr('▲ PROGRESIÓN')] : ['comb', '⚔ COMBATE'];
      const tier = d.kind !== 'logro' ? '' : d.tokens >= 50 ? ' tier-g' : d.tokens >= 20 ? ' tier-s' : ' tier-b';
      return `<div class="rw-card ${st}${tier}" data-mid="${d.id}" style="--d:${Math.min(i, 12) * 35}ms;--w:${pc}%"><i class="rw-shine"></i>
        <span class="rw-ic">${cat ? `<span class="rw-medal">${st === 'disponibles' ? '🏆' : cat[1].slice(0, 1)}</span>` : uiIcon(st === 'disponibles' ? 'gift' : icon)}</span>
        <div class="rw-body">${cat ? `<small class="rw-cat c-${cat[0]}">${cat[1]}</small>` : ''}<b>${esc(d.label)}</b><div class="rw-bar"><i></i><span>${p.toLocaleString(locale())} / ${d.goal.toLocaleString(locale())}</span></div></div>
        <div class="rw-rew"><span class="rw-chip c">${Math.round(d.coins * mult)}</span>${d.tokens ? `<span class="rw-chip t">${d.tokens}</span>` : ''}${d.train ? `<span class="rw-chip tr" title="${tr('Fichas de entrenamiento')}">${tr('+{train} ENT', { train: d.train })}</span>` : ''}${d.dupe ? `<span class="rw-chip dp" title="${tr('Duplicado de uno de tus Legendarios o Míticos')}">${tr('+1 DUP')}</span>` : ''}</div>
        ${st === 'disponibles' ? `<button class="rw-btn" data-claim="${d.id}">${tr('¡RECLAMAR!')}</button>` : st === 'reclamadas' ? '<span class="rw-done">✔ COBRADA</span>' : `<span class="rw-pc">${pc}%</span>`}
        <span class="rw-stamp">${tr('¡COBRADA!')}</span></div>`;
    }).join('') || `<div class="rw-empty">${tr('{x1}Nada en esta lista.', { x1: uiIcon('target') })}</div>`;
    this.show(`<div class="screen rw-screen">${this.titlebar(tr('Recompensas'), tr('Menú'))}
      <div class="rw-hero${ready.length ? ' hot' : ''}"><span class="rw-hero-ic">${uiIcon('gift')}</span>
        <div class="rw-hero-tx"><small>${tr('MISIONES Y LOGROS')}</small><b>${ready.length ? (ready.length === 1 ? tr('¡1 recompensa lista!') : tr('¡{n} recompensas listas!', { n: ready.length })) : tr('Todo cobrado')}</b>
          <div class="rw-sum">${ready.length ? `<span class="rw-chip c big">${sumCoins}</span><span class="rw-chip t big">${sumTokens}</span>` : `<span class="note">${tr('Juega partidas para completar más misiones.')}</span>`}</div></div>
        <button class="rw-all" id="claimall" ${ready.length ? '' : 'disabled'}><i class="m4-shine"></i>${tr('RECLAMAR TODO{x1}', { x1: ready.length ? `<em>${ready.length}</em>` : '' })}</button></div>
      <div class="rw-tabs" id="tabs">${TABS.map(([k, l, ic, sub]) => { const all = MISSIONS.filter((d) => d.kind === k), done = all.filter((d) => isClaimed(this.save, d)).length;
        return `<button data-k="${k}" class="rw-tab${k === kind ? ' on' : ''}"><span class="m4-ic">${uiIcon(ic)}</span><span class="rw-tab-tx"><b>${l}</b><small>${sub}</small><i style="--p:${Math.round(done / Math.max(1, all.length) * 100)}%"></i></span>${pend(k) ? `<span class="m4-badge">${pend(k)}</span>` : ''}</button>`; }).join('')}</div>
      <div class="rk-chips rw-filter" id="mfilter">${[['todas', tr('Todas')], ['disponibles', tr('Para cobrar')], ['pendientes', tr('En curso')], ['reclamadas', tr('Cobradas')]].map(([k, l]) => `<button data-f="${k}" class="rk-chip${k === filter ? ' on' : ''}">${l}</button>`).join('')}</div>
      <div class="rw-list">${rows}</div></div>`);
    this.on('[data-back]', 'click', () => this.mainMenu());
    this.on('#tabs button', 'click', (_e, el) => this.missions(el.dataset.k as MissionKind));
    this.on('#mfilter button', 'click', (_e, el) => this.missions(kind, el.dataset.f as typeof filter));
    const wallet = () => [this.root.querySelector<HTMLElement>('.titlebar .coins'), this.root.querySelector<HTMLElement>('.titlebar .tokens')] as const;
    const tick = (c0: number, t0: number) => { // the wallet counts up as the coins land
      const [wc, wt] = wallet();
      window.setTimeout(() => { if (wc) countUp(wc, c0, this.save.coins, 650); if (wt) countUp(wt, t0, this.save.tokens, 650); }, 420);
    };
    const refreshSoon = (ms: number) => { window.clearTimeout(this.misRefresh); this.misRefresh = window.setTimeout(() => { if (this.screenKey === tr('Recompensas')) this.missions(kind, filter); }, ms); }; // same screen: show() keeps the scroll
    const celebrate = (card: HTMLElement) => {
      card.classList.add('claiming');
      const btn = card.querySelector('.rw-btn, .rw-rew') ?? card;
      flyTo(btn, '.coins', 9);
      if (card.querySelector('.rw-chip.t')) flyTo(btn, '.tokens', 5);
    };
    document.getElementById('claimall')?.addEventListener('click', (e) => {
      const b = e.currentTarget as HTMLButtonElement;
      if (b.disabled) return;
      b.disabled = true;
      const c0 = this.save.coins, t0 = this.save.tokens, dupeBefore = this.save.missions.lastDupe;
      const cards = [...this.root.querySelectorAll<HTMLElement>('.rw-card.disponibles')];
      const got = claimAllMissions(this.save, mult, this.m.roster);
      if (!got.count) return;
      this.persist(); // saved before any animation, so closing the tab can't lose it
      sfx('legend');
      // the cards of this list pop one after another; the other tabs are paid in the same go
      cards.forEach((c, i) => window.setTimeout(() => { celebrate(c); sfx('pickup', 1 + i * 0.05); }, i * 90));
      if (!cards.length) { flyTo(b, '.coins', 16); if (got.tokens) flyTo(b, '.tokens', 8); }
      tick(c0, t0);
      const dupe = this.save.missions.lastDupe !== dupeBefore && this.save.missions.lastDupe ? this.byId.get(this.save.missions.lastDupe) : undefined;
      window.setTimeout(() => { confetti(50); this.rewardBurst(got, dupe?.name); }, Math.min(900, cards.length * 90 + 350));
      refreshSoon(Math.min(900, cards.length * 90 + 350) + 200);
    });
    this.on('[data-claim]', 'click', (_e, el) => {
      const card = el.closest('.rw-card') as HTMLElement;
      if (!card || card.classList.contains('claiming')) return;
      const c0 = this.save.coins, t0 = this.save.tokens;
      const coins = claimMission(this.save, el.dataset.claim!, mult, this.m.roster);
      if (!coins && this.save.tokens === t0) { sfx('error'); return; }
      this.persist();
      sfx('buy');
      (el as HTMLButtonElement).disabled = true;
      celebrate(card);
      tick(c0, t0);
      refreshSoon(1100);
    });
  }

  /** v1.4: the summary after «Reclamar todo»: the totals count up in big numbers, then it closes itself. */
  private rewardBurst(got: { count: number; coins: number; tokens: number }, dupe?: string) {
    document.getElementById('rsum')?.remove();
    const box = document.createElement('div');
    box.id = 'rsum';
    box.className = 'rw-burst';
    box.innerHTML = `<div class="rw-burst-card"><i class="rw-rays"></i><small>${got.count} ${got.count === 1 ? tr('MISIÓN COBRADA') : tr('MISIONES COBRADAS')}</small><b>${tr('¡Recompensas!')}</b>
      <div class="rw-burst-row"><span class="rw-chip c huge"><em id="rbc">+0</em></span>${got.tokens ? `<span class="rw-chip t huge"><em id="rbt">+0</em></span>` : ''}</div>
      ${dupe ? `<div class="rw-burst-dupe">${tr('+1 duplicado de <b>{dupe}</b>', { dupe: esc(dupe) })}</div>` : ''}<span class="note">${tr('Toca para cerrar')}</span></div>`;
    const close = () => { box.classList.add('out'); window.setTimeout(() => box.remove(), 220); };
    box.addEventListener('click', close);
    document.body.appendChild(box);
    countUp(box.querySelector('#rbc') as HTMLElement, 0, got.coins, 900, '+');
    const t = box.querySelector('#rbt') as HTMLElement | null;
    if (t) countUp(t, 0, got.tokens, 900, '+');
    window.setTimeout(close, 3200);
  }

  /** v1.6 (author): filters of the technique shop's squad list, kept while the game is open */
  private techShopFilter = { q: '', rarity: '', element: '', type: '', pending: false };

  /** True when this footballer still has something to buy: a technique to unlock or a manual short of the maximum */
  private shopPending(p: RosterEntry) {
    return p.techniques.some((t, i) => (i !== startingTech(p) && i !== this.startOf(p) && !isBought(this.save, p.id, i) && t.type !== 'talento')
      || (this.save.shop.techBoosts[String(t.id)] ?? 0) < MAX_TECH_BOOST);
  }

  shop(playerId?: number) {
    setMusicContext('menu');
    const owned = this.unlockedRoster();
    const f = this.techShopFilter;
    const elements = [...new Set(owned.map((o) => String(o.element)))].sort((a, b) => a.localeCompare(b, 'es'));
    const types = (['tiro', 'regate', 'defensa', 'parada', 'talento'] as const).filter((t) => owned.some((o) => o.techniques.some((x) => x.type === t)));
    const p = this.byId.get(playerId ?? this.captainId ?? owned[0]?.id ?? -1);
    const rows = p?.techniques.map((t, i) => {
      const lv = this.save.shop.techBoosts[String(t.id)] ?? 0;
      const locked = isLocked(t) && !isBought(this.save, p.id, i);
      const bought = isBought(this.save, p.id, i);
      const start = i === this.startOf(p);
      const state = start ? ['★ INICIAL', 'ok'] : bought ? [tr('DESBLOQUEADA'), 'ok'] : locked ? [tr('SOLO COMPRANDO'), 'lock'] : [tr('DESDE NIVEL {x1}', { x1: Math.floor(t.unlockLevel / 6) }), 'lv'];
      return `<div class="ts-tech ${state[1]}" style="--d:${i * 50}ms">${this.techHtml(t)}
        <div class="ts-status"><span class="ts-badge ${state[1]}">${state[0]}</span>
          <div class="ts-pips" title="${tr('Manuales de daño')}">${Array.from({ length: MAX_TECH_BOOST }, (_, k) => `<i class="${k < lv ? 'on' : ''}"></i>`).join('')}<small>${tr('Manual {lv}/{MAX_TECH_BOOST} · +{x1}% daño', { lv, MAX_TECH_BOOST, x1: lv * 5 })}</small></div>
          <small class="ts-why">${locked ? tr('Solo se aprende comprándola.') : bought || start ? tr('Aparece desde el nivel 1 de la partida.') : tr('Aparece sola en partida a partir del nivel {x1}; comprándola, desde el 1.', { x1: Math.floor(t.unlockLevel / 6) })}</small></div>
        <div class="shop-btns">${t.type === 'talento' ? '' : start ? `<span class="ts-start on">${tr('★ Técnica inicial')}</span>` : this.canStartWith(p, i) ? `<button class="ts-start" data-start="${p.id}:${i}">${tr('☆ Empezar con esta')}</button>` : ''}
        ${start || i === startingTech(p) || bought ? '' : `<button class="btn small" data-unlock="${i}" ${this.save.coins < unlockCost(t) ? 'disabled' : ''}>${tr('Desbloquear · {unlockCost} ◉', { unlockCost: unlockCost(t) })}</button>`}
        <button class="btn small blue" data-boost="${i}" ${lv >= MAX_TECH_BOOST || this.save.coins < boostCost(t, lv) ? 'disabled' : ''}>${lv >= MAX_TECH_BOOST ? tr('Manual MÁX') : `Manual · ${boostCost(t, lv)} ◉`}</button></div></div>`;
    }).join('') ?? '';
    const pr = p ? effectiveRarity(this.save, p) : 'comun';
    this.show(`<div class="screen ts-screen">${this.titlebar(tr('Tienda de técnicas'), 'Menú')}
      <div class="ts-wrap">
        <aside class="ts-side"><h4>${tr('{x1}Tu plantilla', { x1: uiIcon('team') })} <small id="tscount">${owned.length}</small></h4>
          <div class="ts-filters"><input id="tsq" type="search" placeholder="${tr('Buscar futbolista o técnica…')}" value="${esc(f.q)}" autocomplete="off">
            <div class="ts-frow"><select id="tsr"><option value="">${tr('Rareza')}</option>${RARITY_ORDER.map((r) => `<option value="${r}" ${f.rarity === r ? 'selected' : ''}>${RARITY_LABEL[r]}</option>`).join('')}<option value="heroe" ${f.rarity === 'heroe' ? 'selected' : ''}>${tr('HÉROE')}</option></select>
              <select id="tse"><option value="">${tr('Elemento')}</option>${elements.map((e) => `<option value="${esc(e)}" ${f.element === e ? 'selected' : ''}>${esc(tEl(e))}</option>`).join('')}</select></div>
            <div class="ts-frow"><select id="tst"><option value="">${tr('Tipo de técnica')}</option>${types.map((t) => `<option value="${t}" ${f.type === t ? 'selected' : ''}>${esc(TYPE_LABEL[t])}</option>`).join('')}</select>
              <label class="ts-chk"><input type="checkbox" id="tsp" ${f.pending ? 'checked' : ''}>${tr('Por comprar')}</label></div></div>
          <div class="ts-list">${owned.map((o) => { const r = effectiveRarity(this.save, o); return `<button class="ts-pick${o.id === p?.id ? ' on' : ''}" data-p="${o.id}" style="--rc:${RARITY_COLOR[r]}"
              data-name="${esc([o.name, o.nameEn ?? '', ...o.techniques.map((t) => t.name)].join(' ').toLowerCase())}" data-r="${isHero(this.save, o.id) ? 'heroe' : r}" data-el="${esc(String(o.element))}"
              data-types="${[...new Set(o.techniques.map((t) => t.type))].join(' ')}" data-pend="${this.shopPending(o) ? 1 : 0}">${this.mug(o.id, 36)}<span><b>${esc(o.name)}</b><small>${tr('{x1} · {techniquesLength} técnicas', { x1: RARITY_LABEL[r], techniquesLength: o.techniques.length })}</small></span></button>`; }).join('')}</div></aside>
        <section class="ts-main">${p ? `<div class="ts-head" style="--rc:${RARITY_COLOR[pr]}"><span class="ts-mug">${this.mug(p.id, 96)}</span>
            <div><small>${tr('REPERTORIO')}</small><b>${esc(p.name)}</b><div class="ts-tags">${this.rar(p)} ${this.elem(p)}</div>
            <p>${tr('Cada futbolista solo usa su propio repertorio. Aquí desbloqueas sus técnicas y compras <b>manuales</b> de daño permanente (subir de nivel una técnica en partida es aparte).')}</p></div></div>
          <div class="ts-techs">${rows}</div>` : `<div class="note">${tr('Aún no tienes futbolistas.')}</div>`}</section>
      </div></div>`);
    { const list = this.root.querySelector<HTMLElement>('.ts-list'), on = this.root.querySelector<HTMLElement>('.ts-pick.on');
      if (list && on) list.scrollTop = on.offsetTop - list.offsetTop - list.clientHeight / 2 + on.offsetHeight / 2; } // the chosen player stays in view, the page does not jump
    this.on('[data-back]', 'click', () => this.mainMenu());
    this.on('[data-p]', 'click', (_e, el) => this.shop(Number(el.dataset.p)));
    // v1.6: the list is filtered in place (no redraw), so typing keeps the focus
    const apply = () => {
      const q = f.q.trim().toLowerCase();
      let shown = 0;
      this.root.querySelectorAll<HTMLElement>('.ts-pick').forEach((b) => {
        const ok = (!q || (b.dataset.name ?? '').includes(q)) && (!f.rarity || b.dataset.r === f.rarity) && (!f.element || b.dataset.el === f.element)
          && (!f.type || (b.dataset.types ?? '').split(' ').includes(f.type)) && (!f.pending || b.dataset.pend === '1');
        b.hidden = !ok;
        if (ok) shown++;
      });
      const c = document.getElementById('tscount');
      if (c) c.textContent = shown === owned.length ? String(owned.length) : `${shown}/${owned.length}`;
    };
    document.getElementById('tsq')?.addEventListener('input', (e) => { f.q = (e.target as HTMLInputElement).value; apply(); });
    document.getElementById('tsr')?.addEventListener('change', (e) => { f.rarity = (e.target as HTMLSelectElement).value; apply(); });
    document.getElementById('tse')?.addEventListener('change', (e) => { f.element = (e.target as HTMLSelectElement).value; apply(); });
    document.getElementById('tst')?.addEventListener('change', (e) => { f.type = (e.target as HTMLSelectElement).value; apply(); });
    document.getElementById('tsp')?.addEventListener('change', (e) => { f.pending = (e.target as HTMLInputElement).checked; apply(); });
    apply();
    this.on('[data-start]', 'click', (_e, el) => { this.setStart(el.dataset.start!); this.shop(p?.id); });
    this.on('[data-unlock]', 'click', (_e, el) => this.armed(el, () => { if (p && buyTechUnlock(this.save, p, Number(el.dataset.unlock))) { this.persist(); sfx('buy'); } this.shop(p?.id); }));
    this.on('[data-boost]', 'click', (_e, el) => this.armed(el, () => { if (p && buyTechBoost(this.save, p, Number(el.dataset.boost))) { this.persist(); sfx('buy'); } this.shop(p?.id); }));
  }

  gearScreen() {
    setMusicContext('menu');
    const g = this.save.gear;
    const cols = GEAR_SLOTS.map((sl) => `<h3 class="saga">${sl.label}</h3><div class="perk-grid">${this.gear.filter((i) => i.slot === sl.id).map((it) => {
      const mine = g.owned.includes(it.id), on = g.equipped[it.slot] === it.id;
      return `<div class="perk gear${on ? ' on' : ''}"><div class="gear-row">${this.icon(it.icon, 2)}<div><b>${esc(it.name)}</b><div class="note">${esc(it.effect)}${it.note ? ` · ${esc(it.note)}` : ''}</div></div></div>
        ${mine ? `<button class="btn small blue" data-eq="${it.id}">${on ? 'Quitar' : 'Equipar'}</button>` : `<button class="btn small" data-buy="${it.id}" ${this.save.coins < it.price ? 'disabled' : ''}>${it.price} ◉</button>`}</div>`;
    }).join('')}</div>`).join('');
    this.show(`<div class="screen">${this.titlebar(tr('Equipamiento'), tr('Menú'))}<div class="panel"><div class="note">${tr('Bonificaciones para todo el equipo. No cambian la equipación Raimon que se ve en combate.')}</div>${cols}</div></div>`);
    this.on('[data-back]', 'click', () => this.mainMenu());
    const keep = (fn: () => void) => { const y = this.root.querySelector('.screen')!.scrollTop; fn(); this.gearScreen(); this.root.querySelector('.screen')!.scrollTop = y; };
    this.on('[data-buy]', 'click', (_e, el) => this.armed(el, () => keep(() => { const it = this.gear.find((x) => x.id === el.dataset.buy); if (it && buyGear(this.save, it)) { this.persist(); sfx('buy'); } })));
    this.on('[data-eq]', 'click', (_e, el) => keep(() => { const it = this.gear.find((x) => x.id === el.dataset.eq); if (it && equipGear(this.save, it)) this.persist(); }));
  }

  /** Credits and legal notice. Only verifiable authorship and real licences; no permission is claimed for anything. */
  credits() {
    setMusicContext('menu');
    const link = (href: string, text: string) => `<a href="${href}" target="_blank" rel="noopener noreferrer">${text}</a>`;
    this.show(`<div class="screen">${this.titlebar(tr('Créditos y aviso legal'), 'Menú')}<div class="panel legal">
      <h3>${tr('InaZurvivors — Proyecto de fans no oficial')}</h3>
      <p>${tr('InaZurvivors es un fangame independiente y gratuito desarrollado por AstraStorm17, inspirado en la franquicia Inazuma Eleven.')}</p>
      <p>${tr('Inazuma Eleven, sus personajes, nombres, diseños, logotipos, música y materiales originales son propiedad de LEVEL-5 y/o sus respectivos titulares.')}</p>
      <p>${tr('Este proyecto no está afiliado, patrocinado ni aprobado por LEVEL-5.')}</p>
      <p>${tr('El código y los materiales originales desarrollados específicamente para InaZurvivors pertenecen a sus respectivos autores.')}</p>
      <p>${tr('Los recursos gráficos y sonoros de terceros conservan sus derechos originales.')}</p>
      <p>${tr('La inclusión de créditos y este aviso no implica la existencia de una licencia o autorización para distribuir material protegido.')}</p>
      <h3>${tr('Desarrollo')}</h3>
      <ul><li>${tr('Diseño, dirección y desarrollo: AstraStorm17.')}</li><li>${tr('Programación con asistencia de Claude (Anthropic).')}</li></ul>
      <h3>${tr('Recursos de terceros y su procedencia')}</h3>
      <ul>
        <li>${tr('Futbolistas, retratos, cuerpos, escudos, objetos, arenas y música: Inazuma Eleven 2 (LEVEL-5), extraídos de una copia propia del juego.')}</li>
        <li>${tr('Futbolistas, retratos y escudos de las sagas Mundial, GO, Chrono Stones, Galaxy, Ares y Orion: Inazuma Eleven 3 (LEVEL-5) con el parche de fans «Great Road of Heroes 3.1». Autoría del parche: no verificada; base y añadidos del parche no se pueden separar.')}</li>
        <li>${tr('Máquina de cápsulas: gráficos de Inazuma Eleven 3 (LEVEL-5), hoja publicada en {x1}, ripeada por Avegaille.', { x1: link('https://www.spriters-resource.com/', tr('The Spriters Resource')) })}</li>
        <li>${tr('Nombres en español e inglés de parte de las técnicas: {x1} (Fandom), contenido bajo {x2}.', { x1: link('https://inazuma-eleven.fandom.com/', tr('Inazuma Eleven Wiki')), x2: link('https://www.fandom.com/licensing', tr('CC BY-SA')) })}</li>
        <li>${tr('Motor: {x1} © Richard Davey, Phaser Studio Inc. ({x2}). Herramienta: {x3} (MIT).', { x1: link('https://phaser.io/', 'Phaser'), x2: link('https://opensource.org/license/mit', 'licencia MIT'), x3: link('https://vite.dev/', 'Vite') })}</li>
        <li>${tr('Fuente: Press Start 2P © The Press Start 2P Project Authors ({x1}), vía Fontsource.', { x1: link('https://openfontlicense.org/', tr('SIL Open Font License 1.1')) })}</li>
        <li>${tr('Creados para InaZurvivors: efectos de supertécnicas, efectos de sonido, iconos de elemento, orbes, música «Generada» e interfaz.')}</li>
      </ul>
      <h3>${tr('Redes sociales')}</h3><p>${this.tiktokLink(tr('Síguenos en TikTok'))}</p>
      <h3>${tr('Sobre el desarrollador')}</h3><p>${tr('AstraStorm también ha creado otros videojuegos.')}</p>
      <p><a class="btn small blue dev-games" id="devgames" href="${CREATOR_GAMES_URL}" target="_blank" rel="noopener noreferrer" aria-label="${tr('Otros juegos del creador (se abre en una pestaña nueva)')}">${GAMEPAD_SVG}<span>${tr('Otros juegos del creador')}</span><svg class="dg-ext" viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4h6v6h-2V7.4l-7.3 7.3-1.4-1.4L16.6 6H14V4ZM5 6h6v2H6v10h10v-5h2v7H4V6h1Z"/></svg></a></p>
      <h3>${tr('Enlaces oficiales')}</h3><p>${link('https://www.level5.co.jp/', tr('LEVEL-5'))} · ${link('https://www.inazuma.jp/', tr('Inazuma Eleven'))}</p>
      <h3>${tr('Privacidad')}</h3><p>${tr('Sin cuenta, InaZurvivors no recopila datos personales: tu progreso se guarda solo en este navegador. Con cuenta online (Google) se guardan tu correo de Google (privado), tu nombre, tus marcas y tu guardado.')} <a href="privacidad.html" target="_blank" rel="noopener">${tr('Privacidad y condiciones')}</a></p>
      <p class="note">${tr('{VERSION_LABEL} · compilación interna {BUILD}', { VERSION_LABEL: esc(VERSION_LABEL), BUILD: esc(BUILD) })}</p></div></div>`);
    this.on('[data-back]', 'click', () => this.mainMenu());
  }

  options() {
    setMusicContext('menu');
    const s = this.save.settings;
    const seg = (id: string, vals: [string, string][], cur: string) => `<div class="seg" data-seg="${id}">${vals.map(([v, l]) => `<button data-v="${v}" class="${cur === v ? 'on' : ''}">${l}</button>`).join('')}</div>`;
    this.show(`<div class="screen">${this.titlebar(tr('Opciones'), tr('Menú'))}<div class="panel">
      <h3>${tr('Sonido')}</h3>
      <div class="opt-row"><span>${tr('Música')}</span><input type="range" id="mvol" min="0" max="1" step="0.05" value="${s.musicVolume}"></div>
      <div class="opt-row"><span>${tr('Efectos')}</span><input type="range" id="vol" min="0" max="1" step="0.05" value="${s.volume}"></div>
      <div class="opt-row"><span>${tr('Silenciar todo')}</span>${seg('muted', [['0', tr('No')], ['1', tr('Sí')]], s.muted ? '1' : '0')}</div>
      <div class="opt-row"><span>${tr('Fuente de música')}</span>${seg('musicSource', [['local', tr('Inazuma Eleven (ROM)')], ['original', tr('Generada')]], s.musicSource)}</div>
      <div class="note">${tr('Ahora suena: {x1}. Por defecto suena la música de Inazuma Eleven exportada de tu copia. «Generada» usa temas creados para este proyecto.', { x1: esc(currentTrack() || '—') })}</div>
      <h3 style="margin-top:12px">${tr('Efectos visuales')}</h3>
      <div class="opt-row"><span>${tr('Partículas')}</span>${seg('particles', [['completo', tr('Completas')], ['reducido', tr('Reducidas')], ['desactivado', tr('Desactivadas')]], s.particles)}</div>
      <div class="opt-row"><span>${tr('Sacudida de cámara')}</span><input type="range" id="shake" min="0" max="1" step="0.05" value="${s.shake}"></div>
      <div class="opt-row"><span>${tr('Destellos')}</span>${seg('flashes', [['1', tr('Activados')], ['0', tr('Desactivados')]], s.flashes ? '1' : '0')}</div>
      <div class="opt-row"><span>${tr('Reducir movimiento')}</span>${seg('reducedMotion', [['0', tr('No')], ['1', tr('Sí')]], s.reducedMotion ? '1' : '0')}</div>
      <div class="opt-row"><span>${tr('Vibración (móvil)')}</span>${seg('vibration', [['1', tr('Activada')], ['0', tr('Desactivada')]], s.vibration === false ? '0' : '1')}</div>
      <div class="opt-row"><span>${tr('Números de daño')}</span>${seg('damageNumbers', [['1', tr('Visibles')], ['0', tr('Ocultos')]], s.damageNumbers ? '1' : '0')}</div>
      <div class="opt-row"><span>${tr('Calidad gráfica')}</span>${seg('quality', [['alta', tr('Alta')], ['media', tr('Media')], ['baja', tr('Baja')]], s.quality)}</div>
      <h3 style="margin-top:12px">${tr('Pantalla y controles')}</h3>
      <div class="opt-row"><span>${tr('Pantalla completa')}</span><button class="btn small blue" id="fs">${document.fullscreenElement ? 'Salir' : 'Activar'}</button></div>
      <div class="opt-row"><span>${tr('Cámara')}</span>${seg('camera', [['cerca', tr('Cerca')], ['normal', tr('Normal')], ['lejos', tr('Lejos')]], s.camera)}</div>
      <div class="opt-row"><span>${tr('Escala de interfaz')}</span>${seg('uiScale', [['0.85', '85%'], ['1', '100%'], ['1.15', '115%'], ['1.3', '130%']], String(s.uiScale))}</div>
      <div class="opt-row"><span>${tr('Movimiento')}</span>${seg('moveKeys', [['ambos', tr('WASD y flechas')], ['wasd', tr('Solo WASD')], ['flechas', tr('Solo flechas')]], s.moveKeys)}</div>
      <div class="opt-row"><span>${tr('Idioma')}</span>${seg('lang', [['', tr('Automático (navegador)')], ...LANGS.map((l): [string, string] => [l.id, l.label])], s.lang ?? '')}</div>
      <div class="opt-row"><span>${tr('Tutorial')}</span><button class="btn small blue" id="tutagain">${tr('Ver otra vez')}</button></div>
      <h3 style="margin-top:12px">${tr('Privacidad')}</h3>
      <div class="opt-row"><span>${tr('Compartir mis partidas')}<small class="opt-note">${tr('Con la sesión iniciada, cada partida en solitario se graba (posiciones, técnicas y cartas, sin nada personal) para que el autor vea cómo se juega y equilibre el juego. Se guardan tus 3 últimas y las de tus marcas del ranking.')}</small></span>${seg('shareReplays', [['1', tr('Sí')], ['0', tr('No')]], s.shareReplays === false ? '0' : '1')}</div>
      <h3 style="margin-top:12px">${tr('Copia de seguridad')}</h3>
      <div class="opt-row"><span>${tr('Tu progreso')}</span><div><button class="btn small" id="export">${tr('Exportar')}</button> <button class="btn small blue" id="import">${tr('Importar')}</button><input type="file" id="importfile" accept=".json,application/json" hidden></div></div>
      <h3 style="margin-top:12px">${tr('Ayuda')}</h3>
      <div class="opt-row"><span>${tr('¿Algo no funciona?')}</span><div><button class="btn small" id="optbug">${tr('Reportar un bug')}</button> <button class="btn small" id="optidea">${tr('Recomendaciones')}</button> <button class="btn small blue" id="optadmin" hidden>${tr('Panel de bugs')}</button> <button class="btn small blue" id="optideas" hidden>${tr('Panel de recomendaciones')}</button> <button class="btn small blue" id="optplayers" hidden>${tr('Panel de jugadores')}</button></div></div>
      <h3 style="margin-top:12px">${tr('Empezar de cero')}</h3>
      <div class="opt-row"><span>${tr('Reiniciar progreso')}</span><button class="btn small" id="resetprog">${tr('Reiniciar progreso…')}</button></div>
      <p class="note">${tr('Vuelves a empezar como un jugador nuevo{x1}. No es lo mismo que eliminar la cuenta.', { x1: this.save.onlineName ? tr(', conservando tu cuenta de Google y tu nombre «{onlineName}»', { onlineName: esc(this.save.onlineName) }) : '' })}</p>
      <p class="note">${tr('Controles: WASD/flechas mover · 1/2/3 formación · Esc/P pausa.')}</p>
      <p class="note">${tr('Tu progreso se guarda en este navegador.{x1}', { x1: onlineConfigured() ? tr(' Si entras con Google, también en la nube y en todos tus dispositivos.') : tr(' Usa Exportar/Importar para llevarlo contigo.') })}</p></div></div>`);
    this.on('[data-back]', 'click', () => this.mainMenu());
    document.getElementById('mvol')!.addEventListener('input', (e) => { s.musicVolume = Number((e.target as HTMLInputElement).value); this.applyAudio(); this.persist(); });
    document.getElementById('vol')!.addEventListener('input', (e) => { s.volume = Number((e.target as HTMLInputElement).value); this.applyAudio(); this.persist(); });
    document.getElementById('shake')!.addEventListener('input', (e) => { s.shake = Number((e.target as HTMLInputElement).value); this.persist(); });
    document.getElementById('tutagain')!.addEventListener('click', () => this.tutorial());
    document.getElementById('resetprog')!.addEventListener('click', () => this.resetProgressModal());
    document.getElementById('optbug')!.addEventListener('click', () => this.bugReportModal());
    document.getElementById('optadmin')!.addEventListener('click', () => { void this.adminBugs(); });
    document.getElementById('optidea')!.addEventListener('click', () => this.suggestionModal()); // 1.88
    document.getElementById('optideas')!.addEventListener('click', () => { void this.adminSuggestionsPanel(); });
    document.getElementById('optplayers')!.addEventListener('click', () => { void this.adminPlayers(); });
    if (onlineConfigured() && signedIn()) amIAdmin().then((yes) => { for (const id of ['optadmin', 'optplayers', 'optideas']) { const b = document.getElementById(id); if (b) b.hidden = !yes; } }).catch(() => undefined);
    document.getElementById('fs')!.addEventListener('click', () => {
      const done = () => this.options();
      (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen()).then(done, done);
    });
    document.getElementById('export')!.addEventListener('click', () => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([exportSave(this.save)], { type: 'application/json' }));
      a.download = `inazurivors-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
      this.toast(tr('Copia exportada'));
    });
    const file = document.getElementById('importfile') as HTMLInputElement;
    document.getElementById('import')!.addEventListener('click', (e) => this.armed(e.currentTarget as HTMLElement, () => file.click()));
    file.addEventListener('change', async () => {
      const f = file.files?.[0];
      if (!f) return;
      try {
        const next = importSave(await f.text());
        for (const k of Object.keys(this.save)) delete (this.save as unknown as Record<string, unknown>)[k];
        Object.assign(this.save, next);
        this.captainId = this.save.captainId;
        setLang(resolveLang(this.save.settings.lang)); // 2.3
        this.persist();
        this.applyAudio();
        this.toast(tr('Copia importada'));
        this.mainMenu();
      } catch (err) {
        sfx('error');
        this.toast((err as Error).message);
      }
    });
    this.on('[data-seg] button', 'click', (_e, el) => {
      const key = el.parentElement!.dataset.seg!;
      const v = el.dataset.v!;
      if (key === 'particles') s.particles = v as ParticleLevel;
      if (key === 'flashes') s.flashes = v === '1';
      if (key === 'damageNumbers') s.damageNumbers = v === '1';
      if (key === 'vibration') { s.vibration = v === '1'; if (s.vibration) buzz(40); }
      if (key === 'shareReplays') s.shareReplays = v === '1';
      if (key === 'muted') s.muted = v === '1';
      if (key === 'reducedMotion') { s.reducedMotion = v === '1'; this.applyMotion(); }
      if (key === 'uiScale') { s.uiScale = Number(v); this.applyMotion(); }
      if (key === 'quality') s.quality = v as 'alta' | 'media' | 'baja';
      if (key === 'moveKeys') s.moveKeys = v as 'ambos' | 'wasd' | 'flechas';
      if (key === 'camera') s.camera = v as 'cerca' | 'normal' | 'lejos';
      if (key === 'musicSource') { s.musicSource = v as 'original' | 'local'; setMusicSource(s.musicSource); }
      if (key === 'lang') { s.lang = v as '' | Lang; if (resolveLang(s.lang) !== getLang()) { this.persist(); location.reload(); return; } }
      this.applyAudio();
      this.persist();
      this.options();
    });
  }

  profile(tab: 'emblem' | 'player' | 'coach' = this.save.profile.icon.kind) {
    setMusicContext('menu');
    const ic = this.save.profile.icon;
    // only what the player has earned can be equipped; the rest shows its lock and how to get it
    type Pick = { id: number; html: string; label: string; ok: boolean; why: string };
    const items: Pick[] = tab === 'emblem'
      ? (this.m.profile?.emblems ?? []).map((e) => ({ id: e.teamId!, html: `<img src="${e.texture}" alt="">`, label: e.name, ok: emblemUnlocked(this.save, e), why: tr('Reclama el escudo en la Enciclopedia (3 futbolistas del equipo)') }))
        .sort((a, b) => Number(b.ok) - Number(a.ok))
      : tab === 'coach' ? (this.m.profile?.coaches ?? []).map((e, k) => { const r = coachRequirement(this.save, this.m.roster, k); return { id: e.index!, html: `<img src="${e.texture}" alt="">`, label: e.name, ok: r.ok, why: r.label }; })
        : this.unlockedRoster().map((p) => ({ id: p.id, html: this.mug(p.id, 48), label: p.name, ok: true, why: '' }));
    const got = items.filter((x) => x.ok).length;
    const st = this.save.stats;
    const teams = eligibleTeams(this.m.roster);
    // v1.4: a player card at the top; the favourite team is chosen once and then stays (it shapes the shop and the pass)
    const fav = this.save.favoriteTeam;
    const owned = this.unlockedRoster();
    const heroes = Object.values(this.save.owned).filter((o) => o.hero).length;
    const achv = MISSIONS.filter((d) => d.kind === 'logro' && isClaimed(this.save, d)).length;
    const best = owned.slice().sort((x, y) => this.meanOf(y) - this.meanOf(x))[0];
    const tabs: ['emblem' | 'player' | 'coach', string, UiIconName][] = [['emblem', tr('Escudos de equipo'), 'shirt'], ['player', 'Jugadores', 'team'], ['coach', 'Entrenadores', 'crown']];
    this.show(`<div class="screen pf-screen">${this.titlebar(tr('Perfil'), tr('Menú'))}
      ${this.playerCard({ tag: signedIn() ? tr('JUGADOR CON CUENTA') : tr('JUGADOR INVITADO'), name: this.save.onlineName || this.save.profile.name, icon: this.profileIcon(112),
        frame: equippedFrame(this.save)?.id, crest: this.save.crest, pennant: equippedPennant(this.save)?.id ?? null, wins: st.wins, owned: owned.length, heroes,
        fav: fav ? `${this.emblemOf(fav) ? `<img src="${this.emblemOf(fav)}" alt="">` : ''}<span><small>${tr('EQUIPO FAVORITO')}</small><b>${esc(teamLabel(fav))}</b></span><em title="${tr('El equipo favorito se elige una vez y no se puede cambiar')}">${tr('🔒 Para siempre')}</em>`
          : `<span><small>${tr('EQUIPO FAVORITO')}</small><b>${tr('Aún sin elegir')}</b></span><select id="pteam"><option value="">${tr('Elige… (solo una vez)')}</option>${teams.map((t) => `<option value="${esc(t)}">${esc(teamLabel(t))}</option>`).join('')}</select>`,
        best: best ? { id: best.id, mean: this.meanOf(best), rarity: effectiveRarity(this.save, best) } : null, bestLabel: tr('TU MEJOR FUTBOLISTA'),
        runs: st.runs, kills: st.kills, bestTimeSec: st.bestTimeSec, pulls: st.pulls, achv })}
      ${this.pennantPanel()}
      ${this.accountPanel()}
      <div class="panel pf-icons"><h3>${tr('{x1}Icono de perfil', { x1: uiIcon('target') })} <small>${tr('{got}/{itemsLength} desbloqueados{x1}', { got, itemsLength: items.length, x1: tab === 'player' ? tr(' · los de tu colección') : '' })}</small></h3>
        <div class="rw-tabs pf-tabs" id="tabs">${tabs.map(([k, l, i]) => `<button data-t="${k}" class="rw-tab${tab === k ? ' on' : ''}"><span class="m4-ic">${uiIcon(i)}</span><span class="rw-tab-tx"><b>${l}</b></span></button>`).join('')}</div>
        <div class="icon-grid">${items.map((it) => `<button class="iconpick${ic.kind === tab && ic.id === it.id ? ' on' : ''}${it.ok ? '' : ' locked'}" data-id="${it.id}" ${it.ok ? '' : 'disabled'} title="${esc(it.label)}${it.ok ? '' : ` · ${esc(it.why)}`}">${it.html}${it.ok ? '' : '<span class="lockic">🔒</span>'}</button>`).join('')}</div></div></div>`);
    this.on('[data-back]', 'click', () => this.mainMenu());
    document.getElementById('pteam')?.addEventListener('change', (e) => {
      const sel = e.target as HTMLSelectElement, v = sel.value;
      if (!v) return;
      // chosen once: a second tap confirms, then it is fixed
      if (sel.dataset.armed !== v) { sel.dataset.armed = v; this.toast(tr('¿Seguro? {teamLabel} será tu equipo favorito para siempre. Elígelo otra vez para confirmar.', { teamLabel: teamLabel(v) }), 4000); sel.value = ''; return; }
      this.save.favoriteTeam = v; this.persist(); sfx('legend'); confetti(30); this.profile(tab);
    });
    this.on('#tabs button', 'click', (_e, el) => this.profile(el.dataset.t as 'emblem' | 'player' | 'coach'));
    this.bindAccount(() => this.profile(tab));
    this.onTap('[data-pn]', (el) => { // v1.65: wear a banner, or take it off with a second tap
      const id = el.dataset.pn!;
      if (!hasPennant(this.save, id)) { sfx('error'); return; }
      equipPennant(this.save, this.save.pennants?.equipped === id ? null : id);
      this.persist(); sfx('click'); this.profile(tab);
    });
    this.onTap('[data-fr]', (el) => { // v1.65: wear a frame, or take it off with a second tap
      const id = el.dataset.fr!;
      if (!hasPennant(this.save, id)) { sfx('error'); return; }
      equipFrame(this.save, this.save.pennants?.frame === id ? null : id);
      this.persist(); sfx('click'); this.profile(tab);
    });
    this.on('.iconpick', 'click', (_e, el) => {
      const it = items.find((x) => x.id === Number(el.dataset.id));
      if (!it?.ok) { sfx('error'); this.toast(it?.why ?? 'Bloqueado'); return; }
      this.save.profile.icon = { kind: tab, id: it.id };
      this.persist();
      this.profile(tab);
    });
  }

  // ------------------------------------------------------------- v1.6 training field
  /** v1.6 (author): what the training field remembers while the game is open (players, techniques and levels, combos, arena) */
  private train: { ids: number[]; techs: Record<number, Record<number, number>>; combos: Record<string, number>; map: string } | null = null;
  private inTraining = false;

  /**
   * v1.6 (author): the training field. Up to five of your footballers, the techniques each one uses and at which level
   * (all of his repertoire, Aura techniques included), and the combined techniques they can perform together. Played on
   * a pitch with a steady crowd of rivals: nobody gets hurt, nothing is earned and nothing counts for missions or ranking.
   */
  private trainingField() {
    this.stopScenes();
    setMusicContext('menu');
    const owned = this.unlockedRoster();
    if (!this.train) {
      const ids = squadOf(this.save, this.byId).slice(0, TRAIN_TEAM).map((p) => p.id);
      this.train = { ids: ids.length ? ids : owned.slice(0, 1).map((p) => p.id), techs: {}, combos: {}, map: this.m.maps[0]?.id ?? '' };
    }
    const trn = this.train;
    trn.ids = trn.ids.filter((id) => this.owned(id) && this.byId.has(id));
    const team = trn.ids.map((id) => this.runEntry(this.byId.get(id)!));
    for (const p of team) if (!trn.techs[p.id]) { // first time: his first three techniques (talents are passive) at level 5
      const idx = p.techniques.map((t, i) => (t.type === 'talento' ? -1 : i)).filter((i) => i >= 0).slice(0, 3);
      trn.techs[p.id] = Object.fromEntries(idx.map((i) => [i, 5]));
    }
    const auraNames = team.map((p) => p.aura?.name).filter((x): x is string => !!x);
    const combos = squadCombos(team, auraNames);
    for (const id of Object.keys(trn.combos)) if (!combos.some((c) => c.ready && c.combo.id === id)) delete trn.combos[id];
    const stepper = (key: string, lv: number, max: number) => `<span class="tr-lv"><button data-step="${key}:-1" ${lv <= 1 ? 'disabled' : ''}>−</button><b>${tr('Nv {lv}', { lv })}</b><button data-step="${key}:1" ${lv >= max ? 'disabled' : ''}>+</button></span>`;
    const card = (p: RosterEntry) => {
      const lv = trn.techs[p.id] ?? {}, active = Object.keys(lv).length;
      return `<div class="panel tr-player" style="--rc:${RARITY_COLOR[effectiveRarity(this.save, p)]}">
        <div class="tr-head">${this.mug(p.id, 48)}<div><b>${esc(p.name)}</b><small>${this.rar(p)} ${this.elem(p)}${p.aura ? ` · Aura: ${esc(p.aura.name)}` : ''}</small></div>
          <button class="btn small blue" data-rm="${p.id}" title="${tr('Quitar')}">✕</button></div>
        <div class="tr-techs">${p.techniques.map((t, i) => {
          if (t.type === 'talento') return '';
          const on = lv[i] !== undefined;
          return `<div class="tr-tech${on ? ' on' : ''}"><button class="tr-pick" data-tt="${p.id}:${i}" ${!on && active >= TRAIN_SLOTS ? 'disabled' : ''}>${this.techBadge(t, 1)}<span>${esc(tTech(t.name))}${t.aura !== undefined ? ' <em>Aura</em>' : ''}</span></button>${on ? stepper(`t:${p.id}:${i}`, lv[i], MAX_TECH_LEVEL) : ''}</div>`;
        }).join('')}</div><small class="note">${tr('{active}/{TRAIN_SLOTS} técnicas activas', { active, TRAIN_SLOTS })}</small></div>`;
    };
    const free = owned.filter((p) => !trn.ids.includes(p.id)).sort((a, b) => a.name.localeCompare(b.name, 'es'));
    this.show(`<div class="screen tr-screen">${this.titlebar(tr('Campo de entrenamiento'), 'Menú')}
      <p class="note">${tr('Prueba las técnicas de tus futbolistas al nivel que quieras, también las combinadas que puedan hacer juntos (con sus Auras incluidas). Nadie recibe daño y no se gana nada: ni recompensas, ni misiones, ni ranking.')}</p>
      <div class="tr-bar"><label>${tr('Arena')} <select id="trmap">${this.m.maps.map((mp) => `<option value="${esc(mp.id)}" ${mp.id === trn.map ? 'selected' : ''}>${esc(mp.name)}</option>`).join('')}</select></label>
        ${trn.ids.length < TRAIN_TEAM ? `<label>${tr('Añadir futbolista')} <select id="tradd"><option value="">${tr('Elige…')}</option>${free.map((p) => `<option value="${p.id}">${esc(p.name)}</option>`).join('')}</select></label>` : `<span class="note">${tr('Equipo completo ({TRAIN_TEAM})', { TRAIN_TEAM })}</span>`}
        <button class="btn big" id="trgo" ${team.length ? '' : 'disabled'}>${tr('¡A ENTRENAR!')}</button></div>
      <div class="tr-grid">${team.map(card).join('') || `<div class="panel note">${tr('Añade al menos un futbolista.')}</div>`}</div>
      <div class="panel tr-combos"><h3>${tr('{x1}Técnicas combinadas', { x1: uiIcon('bolt') })}</h3>${combos.map((c) => {
        const on = trn.combos[c.combo.id] !== undefined;
        return c.ready ? `<div class="tr-tech${on ? ' on' : ''}"><button class="tr-pick" data-tc="${c.combo.id}"><span>${esc(tTech(c.combo.name))}${c.viaAura.length ? ` <em>${tr('con Aura')}</em>` : ''}</span></button>${on ? stepper(`c:${c.combo.id}`, trn.combos[c.combo.id], COMBO_MAX_LEVEL) : ''}</div>`
          : `<div class="tr-tech off"><span>${esc(tTech(c.combo.name))}</span><small>${tr('Falta: {x1}', { x1: c.missing.map(esc).join(', ') })}</small></div>`;
      }).join('') || `<p class="note">${tr('Ninguno de estos futbolistas participa en una técnica combinada.')}</p>`}</div></div>`);
    const redraw = () => this.trainingField();
    this.on('[data-back]', 'click', () => this.mainMenu());
    document.getElementById('trmap')?.addEventListener('change', (e) => { trn.map = (e.target as HTMLSelectElement).value; });
    document.getElementById('tradd')?.addEventListener('change', (e) => { const id = Number((e.target as HTMLSelectElement).value); if (id && trn.ids.length < TRAIN_TEAM) { trn.ids.push(id); redraw(); } });
    this.on('[data-rm]', 'click', (_e, el) => { trn.ids = trn.ids.filter((id) => id !== Number(el.dataset.rm)); redraw(); });
    this.on('[data-tt]', 'click', (_e, el) => {
      const [id, i] = el.dataset.tt!.split(':').map(Number), lv = (trn.techs[id] ??= {});
      if (lv[i] !== undefined) delete lv[i]; else if (Object.keys(lv).length < TRAIN_SLOTS) lv[i] = 5;
      redraw();
    });
    this.on('[data-tc]', 'click', (_e, el) => { const id = el.dataset.tc!; if (trn.combos[id] !== undefined) delete trn.combos[id]; else trn.combos[id] = 3; redraw(); });
    this.on('[data-step]', 'click', (_e, el) => {
      const parts = el.dataset.step!.split(':'), d = Number(parts.pop());
      if (parts[0] === 't') { const lv = trn.techs[Number(parts[1])]; const i = Number(parts[2]); lv[i] = Math.max(1, Math.min(MAX_TECH_LEVEL, lv[i] + d)); }
      else trn.combos[parts[1]] = Math.max(1, Math.min(COMBO_MAX_LEVEL, trn.combos[parts[1]] + d));
      redraw();
    });
    document.getElementById('trgo')?.addEventListener('click', () => {
      const ids = trn.ids.filter((id) => Object.keys(trn.techs[id] ?? {}).length);
      if (!ids.length) { sfx('error'); this.toast(tr('Activa al menos una técnica')); return; }
      const setup: TrainingSetup = { members: ids.map((id) => ({ id, slots: Object.keys(trn.techs[id]).map(Number), levels: { ...trn.techs[id] } })), combos: { ...trn.combos } };
      const raw = ids.map((id) => this.byId.get(id)!);
      this.startRun(trn.map || this.m.maps[0].id, raw, raw, setup);
    });
  }

  // ------------------------------------------------------------- run
  /** `candidates`: the squad of seven; only they can be recruited during the run (and only their sprites load). */
  /**
   * A footballer as he plays: a HÉROE brings its exclusive technique as a fifth repertoire entry; Fix 1.3: real stats
   * (rarity band, ascension, HÉROE, training); v1.5: a carrier plays with his Aura (stats up to 120, inherited techniques).
   */
  private runEntry(p: RosterEntry): RosterEntry {
    // 2.0: his warrior spirit (keshin.ts): its supertechnique after the HÉROE one, and the link for its passive
    const base: RosterEntry = keshinForRun({ ...(isHero(this.save, p.id) && p.heroTech ? { ...p, techniques: [...p.techniques, p.heroTech] } : p), stats: this.statsOf(p) ?? p.stats }, keshinLevel(this.save, p.id));
    if (this.roadMatch) return base; // pre-2.0: Road to Fútbol Frontier is played without Auras
    const a = auraOf(this.save, p.id), ae = a === null ? undefined : this.byId.get(a);
    return ae ? carrierForRun(this.save, base, base.stats as Record<StatKey, number> | null, ae) : base;
  }

  /** 2.1: the last run was on the training field (no pass EXP) */
  private lastRunTraining = false;
  private recoverTimer = 0;
  startRun(mapId: string, team: RosterEntry[], candidates: RosterEntry[] = team, training?: TrainingSetup, coop?: CoopRun & { rank: Rank }) {
    // 2.2 Sector Quinto: in a plain solo match of the event, a member of a side meets Zabel's decree first (accept or
    // rebel); every plain match of the event gets the weekly decree and SEED rivals
    const plain = !training && !coop && !this.roadMatch && !this.clanMatch;
    const side = this.save.sector?.side;
    if (plain && side && sectorOpen(serverNow()) && !this.sectorChoice) {
      const decree = matchDecree(Date.now());
      this.zabelDecree(decree, (rebel) => { this.sectorChoice = { decree, rebel }; this.startRun(mapId, team, candidates, training, coop); });
      return;
    }
    const choice = this.sectorChoice;
    this.sectorChoice = null;
    this.runSector = plain ? sectorRun(serverNow(), choice?.decree ?? null, choice?.rebel ?? false) : null;
    this.runSectorCredit = plain && !!side && !!this.runSector ? { rebel: choice?.rebel ?? false } : null;
    this.lastRunTraining = !!training;
    const found = this.m.maps.find((x) => x.id === mapId) ?? (this.clanMap?.id === mapId ? this.clanMap : undefined)!;
    const kitKey = this.clanMatch ? (this.clanData?.kit ?? '') : this.save.kit; // 1.93: the Juegos del Clan are played in the clan's kit
    const map = this.roadMatch ? { ...found, durationSec: roadMatchSec(this.roadMatch.level) } : found; // 1.91: road matches of 1 to 5 minutes
    this.coopRunActive = !!coop; // pre-2.0: co-op runs never go to the ranking
    const heroed = (p: RosterEntry) => this.runEntry(p);
    this.inTraining = !!training;
    const runTeam = team.map(heroed), runUnlocked = candidates.filter((p) => this.owned(p.id)).map(heroed);
    this.runById = new Map([...runUnlocked, ...runTeam].map((p) => [p.id, p]));
    setEgArt(this.m.eg?.spirits ?? {}); // 2.0: the ultimates' banners show the spirits' portraits
    const runAuras = [...new Set([...runTeam, ...runUnlocked].map((p) => p.aura?.id).filter((x): x is number => x !== undefined))].map((id) => this.byId.get(id)!).filter(Boolean);
    const stars: Record<string, number> = {};
    for (const [k, v] of Object.entries(this.save.owned)) stars[k] = v.stars + (v.extraStars ?? 0); // 1.88: extra stars count
    this.hudTeamKey = '';
    this.lastBannerAt = -1;
    this.stopScenes();
    this.lastMusicCtx = 'run';
    setMusicContext('run');
    this.show(`<div class="hud" id="hud"><div class="hurt" id="hurt"></div>
      <div class="vitals cap-panel">
        <div class="cap-crest" title="${esc(this.save.crest ? teamLabel(this.save.crest) : 'InaZurvivors')}"><img src="${this.emblemOf(this.save.crest) || 'logo-192.png'}" alt=""><small>${esc(this.save.crest ? teamLabel(this.save.crest) : 'InaZurvivors')}</small></div>
        <div class="vbars">
          <div class="cap-name"><b>${esc(team[0]?.name ?? 'Capitán')}</b><span>${tr('CAPITÁN')}</span>${(() => { const k = team[0] && keshinOf(team[0].id), lv = k ? keshinLevel(this.save, team[0].id) : 0; return k && lv ? `<span class="cap-eg" style="--kc:${k.color}" title="${esc(k.title)}">${this.egArt(k)}<em>${esc(k.name)}</em>${lv >= 2 ? this.egLevel(lv, 12) : ''}</span>` : ''; })()}<em class="crit-tag" id="crittag">${tr('¡CRÍTICO!')}</em></div>
          <div class="hp-bar" id="hpbar"><i class="ghost"></i><i class="fill"></i><span></span></div>
          <div class="rev-chip none" id="revchip" title="${tr('Revivir: si tu capitán cae, se levanta y gasta una carga')}">${tr('✚ Revivir <b>0</b>')}</div>
          <div class="xp-row"><div class="lv-badge" id="lvbadge"><small>${tr('NV')}</small><b>1</b></div><div class="xp-bar" id="xpbar"><i></i><span id="xptext"></span></div></div>
          <div class="hud-stats"><span id="kills"></span><span class="st-coins" id="runcoins"></span><span class="st-tokens" id="runtokens"></span></div>
        </div></div>
      <div class="res-chips" id="reson"></div>
      <div class="top-right"><div class="clock" id="clock"><span class="ck-ic">${uiIcon('clock')}</span><b id="clocktxt"></b><i class="ck-bar"><i id="clockbar"></i></i></div>
        <div class="formation-hud" id="fbtns">${FORMATION_ORDER.map((f) => `<button data-f="${f}" title="${esc(FORMATIONS[f].description)}">${FORMATION_ICON(f, 40)}<kbd>${FORMATIONS[f].key}</kbd><span>${FORMATIONS[f].label}</span></button>`).join('')}</div>
        <div class="fdesc" id="fdesc"></div>
        <button class="btn small blue pausebtn" id="pausebtn">${tr('II Pausa')}</button></div>
      <div class="bossbar" id="boss" style="display:none"><span class="bb-mug"></span><div class="bb-head"><span class="bb-ic">${uiIcon('crown')}</span><span class="bb-names"><small class="bb-title"></small><b class="bb-name"></b></span><span class="bb-phase"></span></div><div class="bb-bar"><i class="bb-ghost"></i><i class="bb-fill"></i><i class="bb-tick" style="left:33.333%"></i><i class="bb-tick" style="left:66.667%"></i><em class="bb-pct"></em></div><div class="bb-pop"></div></div>
      <canvas class="minimap" id="minimap" width="132" height="100" aria-hidden="true"></canvas><div class="edge-marks" id="marks"></div>
      <div class="altar-hud" id="altar"></div><div class="event-card" id="eventcard"></div><div class="event-result" id="eventresult"></div><div class="buffs" id="buffs"></div><div class="combo-hud" id="combohud"></div><div class="team-hud" id="hudteam"></div><div class="ult-dock" id="ultdock"></div><div id="bannerbox"></div><div class="joy" id="joy"><b><i></i></b></div></div>`, 'run-mode');
    this.keepCombosAboveTeam();
    this.warmMugs(); // 1.8: the mugshot sheets decoded now, not in the middle of the run when a combined technique is learned
    bindStick(document.getElementById('joy')!);
    document.getElementById('pausebtn')!.addEventListener('click', () => this.pauseFromHud());
    this.root.querySelectorAll<HTMLElement>('#fbtns button').forEach((b) => b.addEventListener('click', () => this.arena()?.selectFormation(b.dataset.f as FormationId)));
    document.getElementById('ultdock')!.addEventListener('pointerdown', (e) => { // 2.0: the ultimates, by touch or click (R on a keyboard)
      const b = (e.target as HTMLElement).closest<HTMLElement>('[data-ult]');
      if (b) { e.preventDefault(); e.stopPropagation(); this.arena()?.requestUlt(Number(b.dataset.ult)); }
    });
    const init: ArenaInit = {
      rank: coop?.rank ?? (this.roadMatch ? ROAD_BY_ID.get(this.roadMatch.diff)!.rank : this.save.difficulty),
      road: !!this.roadMatch,
      coop: coop ? { role: coop.role, link: coop.link, partner: coop.partner } : undefined,
      onPickup: (id, label, info) => {
        if (this.save.seenItems.includes(id)) return;
        this.save.seenItems.push(id);
        this.persist();
        this.toast(tr('Nuevo: {label}. {info}', { label, info }), 4500);
      },
      asc: Object.fromEntries(candidates.map((p) => [String(p.id), { ...ascMultipliers(this.save, p), hero: isHero(this.save, p.id) || championOf(this.save, p.id) > 0 }])),
      manifest: this.m, map, team: runTeam, unlocked: runUnlocked, auras: runAuras, stars, settings: this.save.settings,
      perks: (() => { const e = applyGear(perkEffects(this.save), this.save, this.gear); kitBonus(this.save.kit, this.m.roster).apply(e); applyCoachPerks(this.benchCoach(), e); return e; })(),
      coach: coachRun(this.benchCoach()), // pre-2.0: his formation and element
      // 2.1: the season pass's Llave dorada (×2 in co-op), only while a season is open and the key isn't owned
      goldKey: training ? undefined : { chance: goldKeyChance(this.save, serverNow(), !!coop), texture: this.m.pase?.dorada ?? null },
      sector: this.runSector, // 2.2
      // 2.02: recorded for the author (Ajustes > «Compartir mis partidas»); the upload happens in results()
      record: !training && !coop && this.save.settings.shareReplays !== false && onlineConfigured() && signedIn() ? { kit: kitKey || null, version: PUBLIC_VERSION } : undefined,
      kitTeam: kitKey || 'Raimon', shop: this.save.shop, mastery: this.save.mastery, loadout: this.validLoadout(), training, kit: this.m.kits?.[kitKey] ?? null, formation: (this.save.formation as FormationId) in FORMATIONS ? this.save.formation as FormationId : 'equilibrada',
      hooks: {
        hud: (s) => this.renderHud(s),
        markers: (m) => this.renderMarkers(m),
        coopPicking: (name) => this.coopPickingPill(name),
        event: (r) => this.eventCard(r),
        combo: (c) => this.comboUnlock(c),
        egJoin: (e) => this.egJoin(e), // 2.0
        bossWarn: () => this.bossWarnFx(),
        bossIntro: (b) => this.bossIntroFx(b),
        bossDefeated: () => this.bossDefeatedFx(),
        levelUp: (cards, rerolls, reroll, level) => this.levelUpModal(cards, rerolls, reroll, level),
        end: (r) => { clearRunCheckpoint(); this.seasonRunXp(r); if (this.roadMatch) this.roadEnd(r); else if (this.clanMatch) this.clanEnd(r); else this.results(r); },
        // BUG-1BDD9F9B: the rewards so far, paid by recoverRun() if the page dies before the run ends (not road/clan/co-op)
        checkpoint: (r) => { if (!training && !coop && !this.roadMatch && !this.clanMatch) saveRunCheckpoint(r); },
        goldKey: () => this.goldKeyDropped(), // 2.1
        pause: () => this.pauseModal(),
        bossDown: () => this.bossDownModal(),
        dismiss: (ids) => this.dismissModal(ids),
      },
    };
    this.runInfo = { map: map.name, difficulty: this.save.difficulty };
    // author: a loading screen with the team running instead of a spinner (ui/runLoader.ts)
    const kitInfo = this.m.kits?.[kitKey];
    const loader = showRunLoader(this.m, runTeam, map.name, kitInfo?.field ?? null);
    init.hooks.loading = (p: number) => loader.progress(p);
    init.hooks.ready = () => loader.done();
    if (training) document.getElementById('hud')?.insertAdjacentHTML('beforeend', `<div class="train-tag">${tr('ENTRENAMIENTO · sin daño ni recompensas · Pausa para salir')}</div>`);
    this.game.scene.start('Arena', init);
  }

  private arena() { return this.game.scene.getScene('Arena') as ArenaScene | null; }

  /** After the first boss: finish with the victory, or stay for endless survival. */
  private bossDownModal(): Promise<'end' | 'continue'> {
    return new Promise((resolve) => {
      sfx('legend');
      const box = document.createElement('div');
      box.className = 'modal';
      box.id = 'bossdown';
      box.innerHTML = `<div class="panel" style="max-width:560px;text-align:center"><div class="result-banner win">${tr('¡JEFE DERROTADO!')}</div>
        <p>${tr('La victoria ya es tuya. ¿Terminas aquí o sigues sobreviviendo?')}</p>
        <div class="choice2"><button class="btn big" id="bd-end">${tr('TERMINAR PARTIDA')}<small>${tr('Victoria y recompensas ahora')}</small></button>
        <button class="btn big blue" id="bd-go">${tr('CONTINUAR SOBREVIVIENDO')}<small>${tr('Cinco fases hasta el Infierno. Cada minuto jugado da recompensa y los jefes regresan.')}</small></button></div>
        <p class="note">${tr('Récord actual: {x1} en supervivencia infinita. Lo ganado se conserva al caer o al retirarte desde Pausa.', { x1: fmtTime(this.save.stats.bestEndless ?? 0) })}</p></div>`;
      this.root.appendChild(box);
      const done = (c: 'end' | 'continue') => { box.remove(); resolve(c); };
      box.querySelector('#bd-end')!.addEventListener('click', () => done('end'));
      box.querySelector('#bd-go')!.addEventListener('click', () => done('continue'));
    });
  }

  /** What a combined technique gains from one level to the next (same formulas as ArenaScene.comboShot/runCombos). */
  private comboGains(d: (typeof COMBOS)[number], to: number) {
    const from = to - 1;
    const cd = (l: number) => d.cooldownMs * (1 - 0.06 * (l - 1)) / 1000;
    const rows = [
      `${tr('Daño <b>{comboDamage} → {comboDamage2}</b>', { comboDamage: comboDamage(d, from), comboDamage2: comboDamage(d, to) })}`,
      `Recarga <b>${cd(from).toFixed(1)} s → ${cd(to).toFixed(1)} s</b>`,
      `${tr('Atraviesa <b>{x1} → {x2}</b> rivales', { x1: 4 + from, x2: 4 + to })}`,
      `${tr('Explosión <b>+{x1}%</b> más grande', { x1: Math.round(((40 + to * 6) / (40 + from * 6) - 1) * 100) })}`,
    ];
    if (d.effect === 'tierra' || d.effect === 'tierra-inf') rows.push(`Cometas <b>${8 + from * 2} → ${8 + to * 2}</b>`);
    return `<div class="lv-desc lv-gains">${tr('Nv {from} → Nv {to}', { from, to })}<br>${rows.join('<br>')}</div>`;
  }

  /** Altar de despido: pick the teammate who leaves the run (1-9 also pick, Esc = nobody). */
  private dismissModal(ids: number[]): Promise<number | null> {
    return new Promise((resolve) => {
      sfx('reveal');
      const name = (id: number) => this.m.roster.find((p) => p.id === id)?.name ?? '?';
      const box = document.createElement('div');
      box.className = 'modal';
      box.id = 'dismiss';
      box.innerHTML = `<div class="panel" style="max-width:620px;text-align:center"><div class="lvl-title">${tr('✖ ALTAR DE DESPIDO')}</div>
        <p>${tr('Elige a quién echas del equipo. Pierdes sus técnicas y su parte de la vida, y su hueco queda libre para otro fichaje. El capitán no se puede echar.')}</p>
        <div class="dm-list">${ids.map((id, i) => `<button class="btn dm-pick" data-id="${id}">${this.mug(id, 48)}<span><b>${esc(name(id))}</b><small>${i < 9 ? `Tecla ${i + 1}` : ''}</small></span></button>`).join('')}</div>
        <p><button class="btn blue" id="dm-none">${tr('No echar a nadie')}</button></p></div>`;
      this.root.appendChild(box);
      const shownAt = performance.now();
      const done = (id: number | null) => { window.removeEventListener('keydown', keys, true); box.remove(); if (id !== null) sfx('hurt'); resolve(id); };
      const keys = (e: KeyboardEvent) => {
        if (e.repeat || performance.now() - shownAt < 150) return;
        const n = /^(?:Digit|Numpad)([1-9])$/.exec(e.code)?.[1];
        if (e.code === 'Escape') { e.preventDefault(); e.stopPropagation(); done(null); return; }
        if (n && ids[Number(n) - 1] !== undefined) { e.preventDefault(); e.stopPropagation(); done(ids[Number(n) - 1]!); }
      };
      window.addEventListener('keydown', keys, true);
      box.querySelectorAll<HTMLElement>('.dm-pick').forEach((el) => el.addEventListener('click', () => done(Number(el.dataset.id))));
      box.querySelector('#dm-none')!.addEventListener('click', () => done(null));
    });
  }

  private pauseFromHud() {
    if (this.game.scene.isActive('Arena')) {
      this.arena()!.scene.pause();
      this.pauseModal();
    }
  }

  /**
   * 1.81 (author: the combined techniques were hidden under the players): the team panel grows to two rows with 6-7
   * players, so the combo chips can't sit at a fixed height. They follow the panel's real top edge instead.
   */
  private keepCombosAboveTeam() {
    const team = document.getElementById('hudteam'), ch = document.getElementById('combohud'), dock = document.getElementById('ultdock');
    if (!team || !ch || typeof ResizeObserver === 'undefined') return;
    const place = () => {
      if (!ch.isConnected) { ro.disconnect(); return; }
      const box = ch.offsetParent?.getBoundingClientRect(), t = team.getBoundingClientRect();
      if (!box || !t.height) return;
      // 2.0: over the ultimate too when it sits above the plates; screen pixels divided by the HUD's zoom
      const d = dock?.classList.contains('above') && dock.offsetHeight ? dock.getBoundingClientRect().top : Infinity;
      const zoom = parseFloat(getComputedStyle(this.root).zoom) || 1;
      ch.style.bottom = `${Math.max(8, Math.round((box.bottom - Math.min(t.top, d)) / zoom + 10))}px`;
    };
    const ro = new ResizeObserver(place);
    ro.observe(team);
    if (dock) ro.observe(dock);
    place();
  }

  /**
   * 1.82 (author: the boss bars had fallen behind the new look): name plate, phase pips, a fill with a trail that
   * catches up after each hit, the phase thresholds marked, the bar shaking on hits, «¡FASE n!» when it changes and
   * hazard stripes once it is close to falling.
   */
  private bossBarState: { key: string; hp: number; phase: number; hitAt: number } | null = null;
  private renderBossBar(s: HudState) {
    const box = document.getElementById('boss');
    if (!box) return;
    const b = s.boss;
    box.style.display = b ? '' : 'none';
    if (!b) { this.bossBarState = null; return; }
    const key = `${b.name}|${b.rival}`;
    const fresh = this.bossBarState?.key !== key;
    if (fresh) {
      box.classList.remove('enter'); void box.offsetWidth; box.classList.add('enter');
      box.classList.toggle('rival', b.rival);
      box.querySelector('.bb-title')!.textContent = b.rival ? tr('DESAFÍO DE RIVAL') : b.title.toUpperCase();
      box.querySelector('.bb-name')!.textContent = b.name;
      this.bossBarState = { key, hp: b.hp, phase: b.phase, hitAt: 0 };
      void this.bossMug(box.querySelector('.bb-mug') as HTMLElement, b.name);
    }
    const st = this.bossBarState!;
    const phases = b.rival ? 2 : 3;
    const pctv = Math.max(0, Math.min(100, (b.hp / Math.max(1, b.maxHp)) * 100));
    (box.querySelector('.bb-fill') as HTMLElement).style.width = `${pctv}%`;
    (box.querySelector('.bb-ghost') as HTMLElement).style.width = `${pctv}%`;
    box.querySelector('.bb-pct')!.textContent = `${Math.ceil(pctv)}%`;
    box.querySelectorAll<HTMLElement>('.bb-tick').forEach((t, i) => { t.style.display = b.rival && i === 1 ? 'none' : ''; if (b.rival) t.style.left = '50%'; });
    const pipHtml = Array.from({ length: phases }, (_, i) => `<i class="${i < b.phase ? 'done' : i === b.phase ? 'now' : ''}"></i>`).join('') + `<span>${tr('FASE {x1}', { x1: b.phase + 1 })}</span>`;
    const ph = box.querySelector('.bb-phase') as HTMLElement;
    if (ph.dataset.v !== String(b.phase)) { ph.dataset.v = String(b.phase); ph.innerHTML = pipHtml; }
    box.classList.toggle('low', pctv <= 25);
    const now = performance.now();
    if (b.hp < st.hp && now - st.hitAt > 120) { st.hitAt = now; box.classList.remove('hit'); void box.offsetWidth; box.classList.add('hit'); }
    if (b.phase > st.phase && !fresh) {
      const pop = box.querySelector('.bb-pop') as HTMLElement;
      pop.textContent = b.rival ? tr('¡SE PONE SERIO!') : tr('¡FASE {x1}!', { x1: b.phase + 1 });
      pop.classList.remove('on'); void pop.offsetWidth; pop.classList.add('on');
      box.classList.remove('phase-up'); void box.offsetWidth; box.classList.add('phase-up');
    }
    st.hp = b.hp; st.phase = b.phase;
  }

  /**
   * 1.84 (author): the boss's portrait beside its health bar, wearing its own team's kit (the kit busts of its team, as
   * the player's portraits wear the player's kit); its plain mugshot when the team has no kit; nothing if not in the roster.
   */
  private async bossMug(el: HTMLElement, name: string) {
    el.innerHTML = ''; el.classList.remove('on');
    const p = this.m.roster.find((x) => x.name === name);
    if (!p) return;
    const team = p.teams.find((t) => this.m.kits?.[t]?.group);
    let url: string | null = null;
    if (team && p.torso && this.m.atlases.portraits) {
      const kit = this.m.kits![team]!, key = `boss:${team}:${p.id}`;
      const torso = kit.bustKinds ? { ...p.torso, kind: kit.bustKinds[p.torso.kind === 2 ? 1 : 0] } : p.torso;
      if (!this.kitShots.has(key)) await this.drawKitPortrait(key, p.id, kit.group!, torso);
      url = this.kitShots.get(key) || null;
    }
    if (!el.isConnected) return;
    if (url) el.innerHTML = `<img src="${url}" alt="">`;
    else { const cv = this.mugCanvas(p.id); if (cv) el.appendChild(cv); else el.innerHTML = this.mug(p.id, 64); }
    el.classList.add('on');
  }

  /** 1.82: the alarm a moment before the boss enters (ArenaScene BOSS_WARN_SEC) */
  private bossWarnFx() {
    document.getElementById('bosswarn')?.remove();
    const strip = Array.from({ length: 8 }, () => '<span>⚠ PELIGRO</span>').join('');
    this.root.insertAdjacentHTML('beforeend', `<div class="boss-warn${this.save.settings.flashes ? '' : ' calm'}" id="bosswarn" aria-live="assertive">
      <i class="bw-vig"></i><div class="bw-band top"><div>${strip}${strip}</div></div><div class="bw-band bot"><div>${strip}${strip}</div></div>
      <div class="bw-center"><b>${tr('¡PELIGRO!')}</b><small>${tr('SE ACERCA EL JEFE')}</small></div></div>`);
    sfx('alarm');
    window.setTimeout(() => document.getElementById('bosswarn')?.classList.add('out'), BOSS_WARN_SEC * 1000);
    window.setTimeout(() => document.getElementById('bosswarn')?.remove(), BOSS_WARN_SEC * 1000 + 500);
  }

  /** 1.82: the boss's entrance card: a slanted red band sweeps in with its title and name */
  private bossIntroFx(b: { name: string; title: string; again: boolean }) {
    document.getElementById('bosswarn')?.remove();
    document.getElementById('bossintro')?.remove();
    this.root.insertAdjacentHTML('beforeend', `<div class="boss-intro" id="bossintro"><div class="bi-band"><i class="bi-stripes"></i>${this.uiPiece('vs', 'bi-vs')}
      <div class="bi-tx"><small>${b.again ? tr('¡VUELVE!') : tr('JEFE FINAL')} · ${esc(b.title.toUpperCase())}</small><b>${esc(b.name)}</b></div></div></div>`);
    sfx('bossdrop');
    window.setTimeout(() => document.getElementById('bossintro')?.remove(), 2700);
  }

  /** 1.82: the boss falls: a gold card while the explosions run, before the choice */
  private bossDefeatedFx() {
    document.getElementById('bossintro')?.remove();
    const bar = document.getElementById('boss');
    if (bar) bar.style.display = 'none'; // the scene holds still during the finale: the HUD would keep the last health
    this.bossBarState = null;
    this.root.insertAdjacentHTML('beforeend', `<div class="boss-intro boss-down" id="bossintro"><div class="bi-band"><i class="bi-stripes"></i>
      <div class="bi-tx"><small>${tr('VICTORIA')}</small><b>${tr('¡JEFE DERROTADO!')}</b></div></div></div>`);
    window.setTimeout(() => document.getElementById('bossintro')?.remove(), 1700);
  }

  private lastHudHp: number | null = null;
  /** v1.7: last HUD state, for the pause screen (combined techniques still to learn) */
  private lastHud: HudState | null = null;
  private renderHud(s: HudState) {
    this.lastHud = s;
    const ch = document.getElementById('combohud');
    if (ch) {
      // v1.7: combinations within reach (everyone on the pitch) show how many participants already have their level
      const goals = s.comboGoals.filter((g) => g.complete).map((g) => {
        const ok = g.parts.filter((p) => p.have >= p.need).length;
        return `<div class="combo-chip goal${g.ready ? ' ready' : ''}" title="${esc(g.parts.map((p) => `${p.player}: ${(!p.anyTech && p.tech) || p.bestTech || tr('su mejor técnica')} Nv ${p.have}/${p.need}`).join(' · '))}">🔗 <b>${esc(tTech(g.name))}</b> ${g.ready ? tr('¡lista!') : `${ok}/${g.parts.length}`}</div>`;
      }).join('');
      const html = s.combos.map((c) => `<div class="combo-chip${c.cd <= 0.02 ? ' ready' : ''}"><b>${esc(c.name)}</b>${this.comboTag(c.name, c.level)}<i style="width:${Math.round((1 - c.cd) * 100)}%"></i></div>`).join('') + goals;
      if (ch.innerHTML !== html) ch.innerHTML = html;
    }
    const rev = document.getElementById('revchip');
    if (rev) {
      const txt = `${s.revives}/${s.reviveMax}`;
      if (rev.dataset.v !== txt) { rev.dataset.v = txt; rev.querySelector('b')!.textContent = txt; rev.classList.toggle('none', s.revives <= 0); }
    }
    const hud = document.getElementById('hud');
    if (!hud) return;
    const pct = (a: number, b: number) => `${Math.max(0, Math.min(100, (a / Math.max(1, b)) * 100))}%`;
    const hp = document.getElementById('hpbar')!;
    const w = pct(s.hp, s.maxHp);
    (hp.querySelector('.fill') as HTMLElement).style.width = w;
    (hp.querySelector('.ghost') as HTMLElement).style.width = w;
    hp.querySelector('span')!.textContent = `${Math.max(0, Math.ceil(s.hp))} / ${s.maxHp}`;
    const low = s.hp / s.maxHp < 0.3;
    hp.classList.toggle('low', low);
    document.getElementById('crittag')?.classList.toggle('on', low);
    // a big hit (8% of max health or more) shakes the bar; the ghost part shows what was just lost
    const lost = (this.lastHudHp ?? s.hp) - s.hp;
    if (lost >= s.maxHp * 0.08) { hp.classList.remove('hit'); void hp.offsetWidth; hp.classList.add('hit'); }
    this.lastHudHp = s.hp;
    hp.classList.toggle('shielded', s.shield > 0);
    hp.classList.toggle('healed', s.now - (s.healAt ?? -10) < 0.5); // 2.0: the bar glows green on a heal
    (document.querySelector('#xpbar i') as HTMLElement).style.width = pct(s.xp, s.xpNext);
    document.getElementById('xptext')!.textContent = `${s.xp} / ${s.xpNext} EXP`;
    const badge = document.getElementById('lvbadge')!;
    if (badge.lastElementChild!.textContent !== String(s.level)) {
      badge.lastElementChild!.textContent = String(s.level);
      for (const el of [badge, document.getElementById('xpbar')!]) { el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); }
    }
    const stat = (id: string, text: string, digits = false) => {
      const el = document.getElementById(id)!;
      if (el.dataset.v === text) return;
      el.dataset.v = text;
      if (digits) el.innerHTML = this.digitsHtml(text); else el.textContent = text; // 2.11: the saga's digits
      el.classList.remove('pop');
      void el.offsetWidth;
      el.classList.add('pop');
    };
    stat('runcoins', s.runCoins ? `◉ +${s.runCoins}` : '', true);
    // pre-2.0: the partner's chip (name, health, down), and this player's own «down» state
    const co = this.arena()?.coopHud();
    if (co) {
      let el = document.getElementById('coophud');
      if (!el) { el = document.createElement('div'); el.id = 'coophud'; el.className = 'coop-hud'; (document.querySelector('#hud .cap-panel .vbars') ?? document.getElementById('hud'))?.appendChild(el); }
      const pct = Math.round((co.hp / Math.max(1, co.max)) * 100);
      // IDEA-45F61B95: seconds left of a revive, «seleccionando», and the partner's Auras and combined techniques in small
      const left = (k: number) => `${(3 * (1 - Math.min(1, k))).toFixed(1)} s`;
      // 1.91: on phones the chip folds into one line (name, bar, ✦/🔗 counts); the Aura and combo rows only on big screens
      el.classList.toggle('off', !co.connected);
      const counts = (co.meta.auras.length ? `✦${co.meta.auras.length}` : '') + (co.meta.combos.length ? ` 🔗${co.meta.combos.length}` : '');
      const html = `<small>${co.connected ? tr('COMPAÑERO') : tr('DESCONECTADO')}</small><b>${co.connected ? '' : '<span class="ch-ic">⚠</span>'}${esc(co.name)}${co.picking ? ' <span class="ch-pick">✋<span class="ch-pt"> seleccionando…</span></span>' : ''}</b><i class="ch-bar${co.down ? ' down' : ''}"><i style="width:${co.down ? 0 : pct}%"></i></i>${counts ? `<span class="ch-n">${counts.trim()}</span>` : ''}`
        + (co.down ? `<em>${co.partnerRevive > 0 ? tr('Levantándolo · {left}', { left: left(co.partnerRevive) }) : tr('¡Ha caído! Ve a su lado (3 s)')}</em>` : '')
        + (co.meDown ? `<em class="me">${tr('Has caído · {x1}', { x1: co.revive > 0 ? `te levantan · ${left(co.revive)}` : tr('espera a tu compañero') })}</em>` : '')
        + (co.meta.auras.length ? `<span class="ch-row">${co.meta.auras.map((a) => `<i class="ch-aura" style="--ec:${a.element ? ELEMENT_COLOR[a.element] ?? '#c9a0ff' : '#c9a0ff'}" title="${esc(a.carrier)}">✦ ${esc(a.name)}</i>`).join('')}</span>` : '')
        + (co.meta.combos.length ? `<span class="ch-row">${co.meta.combos.map((c) => `<i class="ch-combo">🔗 ${esc(c.name)}${this.comboTag(c.name, c.level)}</i>`).join('')}</span>` : '');
      if (el.innerHTML !== html) el.innerHTML = html;
    }
    stat('runtokens', s.runTokens ? `+${s.runTokens}` : '');
    // Fix 1.31: the synergies as big chips (icon, bonus, progress to the next step); a chip pops when it goes up
    const syn = s.synergies ?? [];
    const synKey = syn.map((x) => `${x.key}:${x.count}:${x.bonus}`).join('|');
    const resEl = document.getElementById('reson')!;
    if (resEl.dataset.k !== synKey) {
      const before = new Map((resEl.dataset.k ?? '').split('|').filter(Boolean).map((k) => { const [a, , b] = k.split(':'); return [a, Number(b)] as [string, number]; }));
      resEl.dataset.k = synKey;
      resEl.innerHTML = syn.map((x) => {
        const ec = x.element ? ELEMENT_COLOR[x.element] ?? '#ffe27a' : x.kind === 'quimica' ? '#7dff9a' : '#ffe27a';
        const icon = x.kind === 'quimica' ? '<span class="syn-ic">♜</span>' : x.element ? `<span class="syn-ic">${elementIcon(x.element, 18)}</span>` : '';
        const pips = Array.from({ length: x.goal }, (_, i) => `<i class="${i < x.count ? 'on' : ''}"></i>`).join('');
        const up = x.bonus > (before.get(x.key) ?? 0) ? ' up' : '';
        return `<div class="syn-chip${x.bonus > 0 ? ' on' : ''}${up}" style="--ec:${ec}" title="${esc(x.hint)}">${icon}<span class="syn-txt"><small>${esc(x.label)}</small><span class="syn-pips">${pips}</span></span><b>${x.bonus > 0 ? `+${Math.round(x.bonus * 100)}%` : `${x.count}/${x.goal}`}</b></div>`;
      }).join('');
    }
    // the captain panel grows (Revivir row, small screens): the chips always sit right under it, never over kills/coins
    const capPanel = document.querySelector<HTMLElement>('#hud .cap-panel');
    // 2.0: the UI is zoomed on phones (#ui zoom): screen rects are divided by it before they become CSS tops
    const uiZoom = parseFloat(getComputedStyle(this.root).zoom) || 1;
    if (capPanel && resEl.offsetParent) {
      const top = Math.round((capPanel.getBoundingClientRect().bottom - resEl.offsetParent.getBoundingClientRect().top) / uiZoom + 6);
      if (resEl.dataset.top !== String(top)) { resEl.dataset.top = String(top); resEl.style.setProperty('top', `${top}px`, 'important'); }
    }
    // 2.0: phone portrait: clock, formations and pause go right under the captain panel, the minimap under them
    const topRight = document.querySelector<HTMLElement>('#hud .top-right'), mm = document.getElementById('minimap');
    if (capPanel && topRight?.offsetParent && matchMedia('(max-width: 620px) and (min-height: 521px)').matches) {
      const top = Math.round((capPanel.getBoundingClientRect().bottom - topRight.offsetParent.getBoundingClientRect().top) / uiZoom + 6);
      if (topRight.dataset.top !== String(top)) { topRight.dataset.top = String(top); topRight.style.setProperty('top', `${top}px`, 'important'); }
      if (mm) { const mt = Math.round((topRight.getBoundingClientRect().bottom - topRight.offsetParent.getBoundingClientRect().top) / uiZoom + 6); if (mm.dataset.top !== String(mt)) { mm.dataset.top = String(mt); mm.style.setProperty('top', `${mt}px`, 'important'); } }
    } else if (topRight?.dataset.top) { delete topRight.dataset.top; topRight.style.removeProperty('top'); if (mm) { delete mm.dataset.top; mm.style.removeProperty('top'); } }
    // pre-2.0: the partner's chip makes the captain panel taller; the event box goes under the panel and the chips
    const altEl = document.getElementById('altar');
    if (co && capPanel && altEl?.offsetParent) {
      const low = Math.max(capPanel.getBoundingClientRect().bottom, resEl.childElementCount ? resEl.getBoundingClientRect().bottom : 0);
      const top = Math.round((low - altEl.offsetParent.getBoundingClientRect().top) / uiZoom + 6);
      if (altEl.dataset.top !== String(top)) { altEl.dataset.top = String(top); altEl.style.setProperty('top', `${top}px`, 'important'); }
    }
    // 2.11: the knock-outs in the saga's digits (redrawn only when they change); the clock keeps its own text (author)
    const setDigits = (el: HTMLElement, text: string, colour: 'naranja' | 'morado') => { if (el.dataset.v !== text) { el.dataset.v = text; el.innerHTML = this.digitsHtml(text, colour); } };
    document.getElementById('clocktxt')!.textContent = s.endless ? `∞ ${fmtTime(s.endless.sec)} · ${s.endless.phase}` : `${fmtTime(s.timeSec)} / ${fmtTime(s.durationSec)}`;
    // v1.4: the clock fills up towards the boss and warms up in the last minute
    (document.getElementById('clockbar') as HTMLElement).style.width = `${s.endless ? 100 : Math.min(100, s.timeSec / Math.max(1, s.durationSec) * 100)}%`;
    document.getElementById('clock')!.classList.toggle('late', !s.endless && s.durationSec - s.timeSec < 60);
    setDigits(document.getElementById('kills')!, `✖ ${s.kills}`, 'morado');
    this.root.querySelectorAll<HTMLElement>('#fbtns button').forEach((b) => b.classList.toggle('on', b.dataset.f === s.formation));
    this.renderUlts(s);
    const F = FORMATIONS[s.formation];
    const dmg = Math.round((F.damageMult - 1) * 100), taken = Math.round((F.damageTakenMult - 1) * 100);
    document.getElementById('fdesc')!.textContent = dmg || taken ? tr('Daño {x1}{dmg}% · recibido {x2}{taken}%', { x1: dmg >= 0 ? '+' : '', dmg, x2: taken >= 0 ? '+' : '', taken }) : tr('Sin modificadores');
    this.renderBossBar(s);
    const want = s.boss ? 'boss' : s.timeSec > s.durationSec * 0.5 ? 'run2' : 'run';
    if (want !== this.lastMusicCtx) { this.lastMusicCtx = want; setMusicContext(want); }
    const alt = document.getElementById('altar')!;
    this.renderEvent(s, alt);
    const labels: Record<string, string> = { escudo: 'Escudo', xp: tr('Exp ×2'), dano: tr('Daño +50%'), recarga: tr('Recarga -40%'), velocidad: tr('Velocidad +30%') };
    document.getElementById('buffs')!.innerHTML = s.buffs.map((b) => `<span class="buff b-${b.id}"><i style="width:${b.left / b.total * 100}%"></i>${b.label ?? labels[b.id] ?? DROPS.find((d) => d.id === b.id)?.label ?? ''}</span>`).join('');
    document.getElementById('hurt')!.classList.toggle('on', this.save.settings.flashes && s.now - s.hurtAt < 0.12);
    if (s.formationChangedAt > 0 && s.formationChangedAt !== this.lastBannerAt) {
      this.lastBannerAt = s.formationChangedAt;
      document.getElementById('bannerbox')!.innerHTML = `<div class="banner">${tr('{FORMATION_ICON} FORMACIÓN {toUpperCase}', { FORMATION_ICON: FORMATION_ICON(s.formation, 34), toUpperCase: F.label.toUpperCase() })}</div>`;
    }
    const key = `${s.team.map((t) => t.id).join(',')}|${s.ults?.[0]?.playerId ?? ''}`; // 2.0: and which spirit is the active one
    const teamEl = document.getElementById('hudteam')!;
    if (key !== this.hudTeamKey) {
      this.hudTeamKey = key;
      const slots = Array.from({ length: MAX_TEAM }, (_, i) => s.team[i]);
      teamEl.innerHTML = slots.map((t, i) => {
        if (!t) return `<div class="plate empty" title="${tr('Ficha al subir de nivel')}"><b>+</b><span>${tr('Ficha al subir de nivel')}</span></div>`;
        const p = this.byId.get(t.id)!;
        // 2.0: an awakened warrior spirit shows on the plate (its portrait, its level, its colour round the face)
        const k = keshinOf(t.id), klv = k ? keshinLevel(this.save, t.id) : 0;
        // (author) the active spirit is the leftmost one: its plate says ULTI; the others give only their passive
        const active = !!k && klv > 0 && s.ults?.[0]?.playerId === t.id;
        const eg = k && klv ? `<span class="pl-eg" title="${tr('{kName} · nivel {x1} · {x2}', { kName: esc(k.name), x1: KESHIN_LABEL[klv], x2: active ? tr('activo: su definitiva con R') : tr('solo su pasiva (el activo es el de más a la izquierda)') })}">${this.egArt(k)}${klv >= 2 ? this.egLevel(klv, 11) : ''}</span><b class="pl-egtag">${active ? '★ ULTI · R' : tr('PASIVA')}</b>` : '';
        return `<div class="plate${i === 0 ? ' cap' : ''}${eg ? ` has-eg ${active ? 'eg-active' : 'eg-passive'}` : ''}" data-m="${t.id}" style="--rc:${RARITY_COLOR[p.rarity]};--ec:${ELEMENT_COLOR[String(p.element)] ?? '#ccc'}${k ? `;--kc:${k.color}` : ''}">
          <div class="pl-head"><span class="pl-mug">${this.mug(t.id, 40)}</span>${eg}${i === 0 ? '<span class="pl-c">C</span>' : ''}
          <span class="pl-elem" title="${esc(tEl(p.element))}">${elementIcon(String(p.element), 18)}</span>
          <span class="pl-name">${esc(p.name)}<small>${POS_LABEL[p.position]} · ${esc(tEl(p.element))}</small></span>${t.aura ? `<span class="pl-aura" title="${tr('Aura: {auraName}', { auraName: esc(t.aura.name) })}">${this.mug(t.aura.id, 40)}</span>` : ''}</div>
          ${t.techs.map((_, k) => `<div class="pl-tech" data-k="${k}"><span class="pl-icon"><i class="cd"></i></span><span class="pl-tn"></span><span class="pl-pips"></span></div>`).join('')}</div>`;
      }).join('');
    }
    s.team.forEach((t) => {
      const el = teamEl.querySelector(`[data-m="${t.id}"]`);
      if (!el) return;
      el.querySelectorAll<HTMLElement>('.pl-tech').forEach((c) => {
        const k = Number(c.dataset.k);
        const tc = t.techs[k];
        const sig = tc ? `${tc.name}|${tc.level}|${tc.evolution}|${tc.combo ?? ''}|${tc.comboNeed ?? ''}` : '';
        if (c.dataset.sig !== sig) {
          c.dataset.sig = sig;
          c.classList.toggle('free', !tc);
          c.classList.toggle('combo', !!tc?.combo); // v1.7: raise this one to unlock a combined technique
          c.title = tc?.combo ? tr('Súbela a Nv {x1} para desbloquear {combo}', { x1: tc.comboNeed ?? '?', combo: tc.combo }) : '';
          c.classList.toggle('aura', !!tc?.aura); // v1.5: inherited from the Aura
          (c.querySelector('.pl-tn') as HTMLElement).innerHTML = tc ? `<span class="tn-row"><span class="tn-txt">${esc(tTech(tc.name))}</span>${this.evoTag(tc.evolution)}${tc.combo && tc.comboNeed ? `<em class="pl-need">${tr('🔗Nv{comboNeed}', { comboNeed: tc.comboNeed })}</em>` : ''}</span>` : tr('Ranura libre');
          (c.querySelector('.pl-pips') as HTMLElement).innerHTML = tc ? Array.from({ length: MAX_TECH_LEVEL }, (_, n) => `<i class="${n < tc.level ? 'on' : ''}"></i>`).join('') : '';
          c.querySelector('.pl-icon .icon')?.remove();
          if (tc) (c.querySelector('.pl-icon') as HTMLElement).insertAdjacentHTML('afterbegin', this.icon(ICON.manual[tc.type], 1.25));
        }
        if (tc) {
          (c.querySelector('.cd') as HTMLElement).style.setProperty('--p', `${Math.round(tc.cd * 100)}%`);
          c.classList.toggle('ready', tc.cd < 0.02);
        }
        if (s.upgraded && s.upgraded.playerId === t.id && s.upgraded.slot === k && s.now - s.upgraded.at < 1.2) c.classList.add('up');
        else c.classList.remove('up');
      });
    });
  }

  /** 1.81: the logo of a technique level step (+1, N3, S, ∞, GO...), or its text when the logo is missing */
  /** IDEA-B1D93E8F: a combined technique's level as its logo (level 1 has none) */
  private comboTag(name: string, level: number) {
    const d = COMBOS.find((x) => x.name === name);
    return d ? this.evoTag(comboLabel(d.power, level)) : level > 1 ? ` Nv ${level}` : '';
  }
  private evoTag(label: string, big = false) {
    if (!label) return '';
    const src = this.m.evoIcons?.[label];
    return src ? `<img class="evo-ic${big ? ' big' : ''}" src="${src}" alt="${esc(label)}" title="${esc(label)}">` : `<span class="evo-tx">${esc(label)}</span>`;
  }

  private statDiff(t: Technique, from: number) {
    const rows = t.type === 'talento' ? talentChanges(t.id, from) : statChanges(t, from);
    return `<table class="diff">${rows.map((r) => `<tr><td>${r.label}</td><td>${r.from}</td><td>${r.from ? '»' : ''}</td><td><b>${r.to}</b></td></tr>`).join('')}</table>`;
  }

  /** Before accepting: what it is. During: goal, progress, time, how it is won and lost. */
  private renderEvent(s: HudState, alt: HTMLElement) {
    const a = s.altar, card = document.getElementById('eventcard')!;
    const key = a ? `${a.type}|${a.state}|${a.inside}` : '';
    if (key !== this.eventKey) {
      this.eventKey = key;
      card.classList.toggle('on', !!a && a.state === 'idle' && a.inside);
      card.innerHTML = '';
      if (a?.state === 'idle' && a.inside) {
        const i = ALTAR_INFO[a.type], r = a.rival;
        card.innerHTML = `<div class="ev-head"><span class="ev-ic" style="color:#${ALTAR_COLOR[a.type].toString(16).padStart(6, '0')}">${ALTAR_ICON[a.type]}</span><div><b>${esc(a.label)}</b><small class="ev-d ev-${i.difficulty === 'Difícil' ? 'hard' : i.difficulty === 'Media' ? 'mid' : 'easy'}">${i.difficulty}</small></div></div>
          ${r ? `<div class="ev-rival">${r.id ? this.mug(r.id, 56) : ''}<div><b>${esc(r.name)}</b>${r.team ? `<small>${esc(teamLabel(r.team))}</small>` : ''}</div></div>` : ''}
          <p>${esc(i.description)}</p><dl><dt>${tr('Objetivo')}</dt><dd>${esc(a.task)}${a.goal > 1 ? ` (${a.goal})` : ''}</dd><dt>${tr('Tiempo')}</dt><dd>${Math.ceil(a.timeLeft)} s</dd><dt>${tr('Premio')}</dt><dd>${esc(ALTAR_REWARD[a.type])}</dd><dt>${tr('Fallas si')}</dt><dd>${esc(i.fail)}</dd></dl>
          <button class="btn" id="evgo">${tr('Aceptar{x1}', { x1: document.body.classList.contains('touch') ? '' : ' <kbd>E</kbd>' })}</button>`;
        card.querySelector('#evgo')!.addEventListener('click', () => this.arena()?.acceptAltar());
      }
    }
    const text = !a ? '' : a.state === 'idle' ? `${ALTAR_ICON[a.type]} ${a.label} · a ${a.dist} m · ${Math.ceil(a.waitLeft)} s` : '';
    if (!a || a.state === 'idle') { if (alt.textContent !== text) alt.textContent = text; }
    else {
      const seconds = ALTAR_MODE[a.type] === 'tiempo' || ALTAR_MODE[a.type] === 'tiempo-dentro';
      const prog = seconds ? `${Math.floor(a.progress)}/${Math.ceil(a.goal)} s` : `${Math.floor(a.progress)}/${a.goal}`;
      const html = `<b>${ALTAR_ICON[a.type]} ${esc(a.label)}</b><span class="ev-t">${Math.ceil(a.timeLeft)} s</span><div class="ev-goal">${esc(a.task)} · ${prog}</div><div class="ev-bar"><i style="width:${Math.min(100, a.progress / a.goal * 100)}%"></i></div><small>${tr('Falla si: {x1}', { x1: esc(ALTAR_INFO[a.type].fail) })}</small>`;
      if (alt.innerHTML !== html) alt.innerHTML = html;
    }
    alt.classList.toggle('on', !!a);
    alt.classList.toggle('active', a?.state === 'active');
  }

  private eventCard(r: { ok: boolean; title: string; detail: string }) {
    const box = document.getElementById('eventresult');
    if (!box) return;
    box.className = `event-result show ${r.ok ? 'ok' : 'bad'}`;
    box.innerHTML = `<b>${r.ok ? tr('¡DESAFÍO SUPERADO!') : tr('Desafío fallido')}</b><span>${esc(r.title)}</span><em>${esc(r.detail)}</em>`;
    window.clearTimeout(this.eventTimer);
    this.eventTimer = window.setTimeout(() => { box.className = 'event-result'; }, 3200);
  }

  /** pre-2.0 (IDEA-45F61B95): a pill on top of everything (the cards too) while the partner chooses his card */
  private coopPickingPill(name: string | null) {
    let el = document.getElementById('coop-pick');
    if (!name) { el?.remove(); return; }
    if (!el) { el = document.createElement('div'); el.id = 'coop-pick'; el.className = 'coop-pick'; document.body.appendChild(el); }
    el.innerHTML = `<i class="cp-dots"><b></b><b></b><b></b></i><span><b>${esc(name)}</b> ${tr('está seleccionando…')}</span>`;
  }

  /** Minimap and, for what is off screen, up to three arrows: the most important first, the nearest of each kind. */
  private renderMarkers(m: MarkerState) {
    const cv = document.getElementById('minimap') as HTMLCanvasElement | null, marks = document.getElementById('marks');
    if (!cv || !marks) return;
    const ctx = cv.getContext('2d')!, W = cv.width, H = cv.height, sx = W / m.world.w, sy = H / m.world.h;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#06204acc'; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#ffffff55'; ctx.strokeRect(m.view.x * sx, m.view.y * sy, m.view.w * sx, m.view.h * sy);
    const hex = (c: number) => `#${c.toString(16).padStart(6, '0')}`;
    for (const p of m.pois) {
      ctx.fillStyle = hex(p.color);
      const r = p.priority >= 3 ? 4 : 3;
      ctx.fillRect(p.x * sx - r / 2, p.y * sy - r / 2, r, r);
      if (p.priority >= 3) { ctx.strokeStyle = hex(p.color); ctx.strokeRect(p.x * sx - 5, p.y * sy - 5, 10, 10); } // events stand out
    }
    ctx.fillStyle = '#fff'; ctx.fillRect(m.player.x * sx - 2, m.player.y * sy - 2, 4, 4);
    for (const p of m.pois) if (p.kind === 'companero') { // pre-2.0: the partner, a ringed dot above the rest
      ctx.fillStyle = hex(p.color); ctx.beginPath(); ctx.arc(p.x * sx, p.y * sy, 3, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.stroke();
    }
    const off = m.pois.filter((p) => p.x < m.view.x || p.x > m.view.x + m.view.w || p.y < m.view.y || p.y > m.view.y + m.view.h);
    const dist = (p: Poi) => Math.hypot(p.x - m.player.x, p.y - m.player.y);
    const bestOfKind = [...new Map(off.sort((a, b) => dist(a) - dist(b)).reverse().map((p) => [p.kind, p])).values()].sort((a, b) => b.priority - a.priority).slice(0, 3);
    const w = m.view.screenW, h = m.view.screenH, cx = w / 2, cy = h / 2;
    marks.innerHTML = bestOfKind.map((p) => {
      const ang = Math.atan2(p.y - m.player.y, p.x - m.player.x);
      const k = Math.min((cx - 46) / (Math.abs(Math.cos(ang)) || 1e-6), (cy - 56) / (Math.abs(Math.sin(ang)) || 1e-6));
      const left = cx + Math.cos(ang) * k, top = cy + Math.sin(ang) * k;
      return `<div class="edge-mark" style="left:${left | 0}px;top:${top | 0}px;--c:${hex(p.color)}"><i style="transform:translate(${(Math.cos(ang) * 28) | 0}px,${(Math.sin(ang) * 28) | 0}px) rotate(${ang}rad)">▶</i><b>${esc(p.icon)}</b><small>${Math.round(dist(p) / 32)} m</small></div>`;
    }).join('');
  }

  private cardHtml(c: Card, i: number) {
    const html = this.cardHtmlBase(c, i);
    // v1.7: a card that brings a combined technique closer says which one and what it still needs
    const hints = (c.kind === 'upgrade' || c.kind === 'learn') ? c.combo ?? [] : [];
    if (!hints.length) return html;
    const tag = `<div class="lv-combo">${hints.map((h) => `<span class="${h.reaches ? 'done' : ''}">🔗 <b>${esc(h.name)}</b> ${h.reaches ? tr('· ¡la desbloquea!') : `· pide Nv ${h.need}`}</span>`).join('')}</div>`;
    return html.replace('class="lvcard ', 'class="lvcard for-combo ').replace(/<\/button>$/, `${tag}</button>`);
  }
  private cardHtmlBase(c: Card, i: number) {
    const runP = (id: number) => this.runById.get(id) ?? this.byId.get(id)!;
    const auraTag = (p: RosterEntry) => p.aura ? `<div class="lv-aura">${tr('✦ Aura: {auraName}', { auraName: esc(p.aura.name) })}</div>` : '';
    if (c.kind === 'recruit') {
      const p = runP(c.playerId);
      // Fix 1.41 (author): the card shows the technique he really starts with (the one chosen in Mi Equipo), not his first one
      const start = p.techniques[this.startOf(this.byId.get(p.id) ?? p)] ?? p.techniques[0];
      // 2.0: a footballer with an awakened spirit says so on the card: its portrait, and whether it will be the active one
      const k = keshinOf(p.id), klv = k ? keshinLevel(this.save, p.id) : 0;
      const egBox = k && klv ? `<div class="lv-eg" style="--kc:${k.color}"><span class="lv-eg-art">${this.egArt(k)}</span><span class="lv-eg-tx"><small>${tr('ESPÍRITU GUERRERO{x1}', { x1: klv >= 2 ? ` · ${KESHIN_LABEL[klv]}` : '' })}</small><b>${esc(k.name)}</b>
        <em>${this.ultActiveId === null ? tr('★ Será tu EG activo: {x1} con R', { x1: esc(techFor(k, klv).name) }) : `Pasiva: ${esc(k.passive.name)}`}</em></span></div>` : '';
      return `<button class="lvcard recruit${egBox ? ' has-eg' : ''}" data-i="${i}" style="--rc:${RARITY_COLOR[p.rarity]}${k ? `;--kc:${k.color}` : ''}"><div class="lv-ribbon">${egBox ? tr('¡FICHAJE CON ESPÍRITU!') : tr('¡NUEVO FICHAJE!')}</div>
        <div class="lv-type">${tr('FICHAJE · {rar}', { rar: this.rar(p) })}</div><div class="lv-art">${egBox ? `<span class="lv-art-eg">${this.egArt(k!)}</span>` : ''}${this.mug(p.id, 128)}<span class="minisprite">${charCanvas(p.id, 2, 12)}</span></div>
        <div class="lv-name">${esc(p.name)}</div><div class="lv-sub">${POS_LABEL[p.position]} · ${this.elem(p)}</div>
        <div class="lv-techs">${[start].filter(Boolean).map((t) => `<div>${this.icon(ICON.manual[t.type], 1.5)} ${esc(tTech(t.name))} <small>${TYPE_LABEL[t.type]}</small></div>`).join('')}</div>${auraTag(p)}${egBox}</button>`;
    }
    if (c.kind === 'upgrade') {
      const p = runP(c.playerId);
      const t = p.techniques[c.tech];
      const pips = Array.from({ length: MAX_TECH_LEVEL }, (_, k) => `<i class="${k < c.toLevel - 1 ? 'on' : k === c.toLevel - 1 ? 'new' : ''}"></i>`).join('');
      const evo = evolvesAt(t, c.toLevel - 1);
      const now = evolutionLabel(t, c.toLevel - 1);
      return `<button class="lvcard upgrade${evo ? ' evolves' : ''}" data-i="${i}" style="--rc:${RARITY_COLOR[p.rarity]}">${evo ? `<div class="lv-ribbon">${tr('¡EVOLUCIÓN {evoTag}!', { evoTag: this.evoTag(evo) })}</div>` : ''}
        <div class="lv-type">${tr('{x1}MEJORA · {x2}', { x1: t.aura !== undefined ? tr('AURA · ') : '', x2: TYPE_LABEL[t.type].toUpperCase() })}</div>
        <div class="lv-art">${this.mug(p.id, 96)}${this.techBadge(t)}</div>
        <div class="lv-name">${esc(tTech(t.name))}${this.evoTag(now)}</div><div class="lv-sub">${esc(p.name)}</div>${this.techChips(t)}
        <div class="lv-level">${this.evoTag(evolutionLabel(t, c.toLevel - 1), true) || 'Base'} <span>»</span> <b>${this.evoTag(evolutionLabel(t, c.toLevel), true) || `Nv ${c.toLevel}`}</b><span class="pips">${pips}</span></div>
        ${this.statDiff(t, c.toLevel - 1)}</button>`;
    }
    if (c.kind === 'learn') {
      const p = runP(c.playerId);
      const t = p.techniques[c.tech];
      return `<button class="lvcard learn${t.aura !== undefined ? ' from-aura' : ''}" data-i="${i}" style="--rc:${RARITY_COLOR[p.rarity]}"><div class="lv-ribbon">${t.aura !== undefined ? tr('TÉCNICA DEL AURA · {x1}', { x1: esc(p.aura?.name ?? '') }) : tr('SEGUNDA TÉCNICA')}</div>
        <div class="lv-type">${tr('APRENDER · {x1}', { x1: TYPE_LABEL[t.type].toUpperCase() })}</div>
        <div class="lv-art">${this.mug(p.id, 96)}${this.techBadge(t)}</div>
        <div class="lv-name">${esc(tTech(t.name))}</div><div class="lv-sub">${tr('{pName} · poder {power} · Nv 1/{MAX_TECH_LEVEL}', { pName: esc(p.name), power: t.power, MAX_TECH_LEVEL })}</div>${this.techChips(t)}
        <div class="lv-desc">${esc(t.description)}</div></button>`;
    }
    if (c.kind === 'combo') {
      const d = COMBOS.find((x) => x.id === c.id)!;
      const ids = d.needs.map((n) => this.m.roster.find((p) => p.name === n.player)?.id).filter((x): x is number => x !== undefined);
      const t = { id: 0, name: d.name, description: '', type: 'tiro', element: d.element, power: d.power, cost: 0, unlockLevel: 1, growth: null } as unknown as Technique;
      return `<button class="lvcard combo" data-i="${i}" style="--rc:#ffe24a"><div class="lv-ribbon">${c.toLevel === 1 ? tr('¡TÉCNICA COMBINADA!') : tr('MEJORA COMBINADA')}</div>
        <div class="lv-type">${tr('COMBINADA · RANURA ESPECIAL')}</div>
        <div class="lv-art combo-art">${ids.map((id) => this.mug(id, 64)).join('')}${this.techBadge(t, 2)}</div>
        <div class="lv-name">${esc(d.name)}${this.evoTag(comboLabel(d.power, c.toLevel))}</div><div class="lv-sub">${esc(d.needs.map((n) => n.player).join(' + '))}</div>${this.techChips(t)}
        ${c.toLevel > 1 ? `<div class="lv-level">${this.evoTag(comboLabel(d.power, c.toLevel - 1), true) || 'Base'} <span>»</span> <b>${this.evoTag(comboLabel(d.power, c.toLevel), true)}</b></div>` : ''}
        ${c.toLevel > 1 ? this.comboGains(d, c.toLevel) : `<div class="lv-desc">${tr('Se lanza sola mientras estén todos en el campo. No ocupa ninguna ranura de técnica.')}</div>`}</button>`;
    }
    if (c.kind === 'stat' || c.kind === 'passive') {
      const d = modDef(c.id)!;
      return `<button class="lvcard ${c.kind}" data-i="${i}"><div class="lv-type">${c.kind === 'stat' ? tr('ESTADÍSTICA DEL EQUIPO') : tr('OBJETO PASIVO')}</div>
        <div class="lv-art">${this.icon(d.icon, 5)}</div><div class="lv-name">${esc(d.label)}</div><div class="lv-sub">${esc(d.description)}</div></button>`;
    }
    return `<button class="lvcard heal" data-i="${i}"><div class="lv-type">${tr('RECUPERACIÓN')}</div><div class="lv-art">${this.icon(ICON.riceBall, 5)}</div>
      <div class="lv-name">${tr('Bola de arroz')}</div><div class="lv-sub">${tr('Recupera {x1}% de la vida del capitán', { x1: Math.round(c.amount * 100) })}</div></button>`;
  }

  private levelUpModal(cards: Card[], rerolls: number, reroll: () => Card[], level: number): Promise<Card> {
    return new Promise((resolve) => {
      let chosen = false;
      const shownAt = performance.now();
      const pick = (el: HTMLElement, cs: Card[]) => {
        if (chosen) return;
        if (performance.now() < Number(el.closest<HTMLElement>('.lvc')?.dataset.ready ?? 0)) return; // still turning over: no picks by accident
        chosen = true;
        window.removeEventListener('keydown', keys, true);
        el.classList.add('picked');
        sfx('powerup');
        setTimeout(() => { document.getElementById('lvl')?.remove(); resolve(cs[Number(el.dataset.i)]); }, 180);
      };
      let current: Card[] = cards;
      // 1, 2, 3 pick a card here; the scene is paused, so the same press never reaches the formations. A key held from
      // the fight repeats: only a fresh press after the cards have appeared counts
      const keys = (e: KeyboardEvent) => {
        if (e.repeat || performance.now() - shownAt < 150) return;
        const n = /^Digit([1-9])$/.exec(e.code)?.[1] ?? /^Numpad([1-9])$/.exec(e.code)?.[1];
        const el = n ? document.querySelector<HTMLElement>(`#lvl .lvcard[data-i="${Number(n) - 1}"]`) : null;
        if (!el) return;
        e.preventDefault();
        e.stopPropagation();
        pick(el, current);
      };
      window.addEventListener('keydown', keys, true);
      const render = (cs: Card[], left: number, first: boolean) => {
        document.getElementById('lvl')?.remove();
        this.root.insertAdjacentHTML('beforeend', `<div class="levelup${first ? ' first' : ''}" id="lvl"><div class="lv-rays"></div>
          <div class="lv-title"><span>${level ? tr('¡NIVEL {level}!', { level }) : tr('¡RECOMPENSA!')}</span><small>${tr('Elige una mejora para tu equipo')}</small></div>
          <div class="lv-cards n${cs.length}">${cs.map((c, i) => this.cardHtml(c, i)).join('')}</div>
          <div class="lv-bottom"><button class="btn big blue reroll" id="reroll" ${left > 0 ? '' : 'disabled'}>${tr('⟳ CAMBIAR CARTAS')} <span class="rr-count">${left}</span></button></div></div>`);
        mountPreviews();
        const modal = document.getElementById('lvl')!;
        current = cs;
        modal.querySelectorAll<HTMLElement>('.lvcard').forEach((el, k) => {
          el.insertAdjacentHTML('afterbegin', `<kbd class="lv-key">${Number(el.dataset.i) + 1}</kbd>`);
          el.insertAdjacentHTML('beforeend', '<i class="lv-glare"></i>');
          // v1.4: each card comes in face down and turns over, one after another (a card back with the InaZurvivors bolt)
          const kind = ['recruit', 'upgrade', 'learn', 'combo', 'stat', 'passive', 'heal'].find((c) => el.classList.contains(c)) ?? 'heal';
          const wrap = document.createElement('div');
          const still = document.body.classList.contains('reduced-motion') || matchMedia('(prefers-reduced-motion: reduce)').matches;
          wrap.className = `lvc k-${kind}${still ? ' ready' : ''}`;
          wrap.style.setProperty('--k', String(k));
          wrap.dataset.ready = String(performance.now() + (still ? 0 : 420 + k * 160));
          wrap.innerHTML = `<div class="lvc-in"><div class="lvc-back"><svg viewBox="0 0 60 100"><polygon points="38,0 6,56 26,56 16,100 56,38 34,38"/></svg><b>INAZURVIVORS</b></div></div>`;
          el.replaceWith(wrap);
          wrap.firstElementChild!.prepend(el);
          // Fix 1.41: the whole slot picks (the card or anything around it), and the card goes flat once it has turned over
          wrap.addEventListener('click', () => pick(el, cs));
          wrap.firstElementChild!.addEventListener('animationend', (e) => { if ((e as AnimationEvent).animationName === 'lvcFlip') wrap.classList.add('ready'); });
          window.setTimeout(() => wrap.classList.add('ready'), still ? 0 : 1000 + k * 160); // backup if animationend never comes (tab in background)
          if (!document.body.classList.contains('reduced-motion')) window.setTimeout(() => sfx('whoosh', 1 + k * 0.12), 260 + k * 160);
        });
        document.getElementById('reroll')?.addEventListener('click', () => {
          const next = reroll();
          if (next.length) render(next, left - 1, false);
        });
      };
      render(cards, rerolls, true);
    });
  }

  /** v1.7: pause screen: combined techniques the team can still learn, with what each participant needs */
  private pauseCombos() {
    const goals = (this.lastHud?.comboGoals ?? []).slice().sort((a, b) => Number(b.ready) - Number(a.ready) || Number(b.complete) - Number(a.complete)).slice(0, 6);
    if (!goals.length) return '';
    // 1.88 (author: less text): each participant with his level now / needed, ✔ when reached; one state pill
    return `<h3>${tr('Técnicas combinadas')}</h3><div class="cb2-grid">${goals.map((g) => {
      const def = COMBOS.find((c) => c.id === g.id);
      const parts = g.parts.map((p) => `<span class="cb2-who${p.memberId === null ? ' miss' : p.have >= p.need ? ' ok' : ''}" title="${esc(p.player)} · ${esc((!p.anyTech && p.tech) || p.bestTech || tr('su mejor técnica'))}">${p.memberId !== null ? this.mug(p.memberId, 40) : '<i class="cb2-q">?</i>'}<em>${p.memberId === null ? '—' : p.have >= p.need ? '✔' : `${p.have}/${p.need}`}</em></span>`).join('<i class="cb2-link">🔗</i>');
      return `<div class="cb2${g.ready ? ' ready' : ''}" style="--ec:${ELEMENT_COLOR[def?.element ?? ''] ?? '#ffe27a'}"><div class="cb2-team">${parts}</div>
        <div class="cb2-info"><b>${esc(g.name)}</b><span class="cb2-tags">${g.ready ? `<em class="cb2-pill ok">${tr('¡Lista!')}</em>` : g.complete ? `<em class="cb2-pill">${tr('Sube niveles')}</em>` : '<em class="cb2-pill off">Falta gente</em>'}</span></div></div>`;
    }).join('')}</div>`;
  }


  private pauseModal() {
    document.getElementById('pause')?.remove();
    const s = this.save.settings;
    // 1.82 (author: the pause had fallen behind the new look): a header with how the run is going, actions on the left,
    // formation, captain and combined techniques on the right
    const h = this.lastHud;
    const sw = (id: string, label: string, on: boolean) => `<button class="pz-sw${on ? ' on' : ''}" id="${id}"><i></i>${label}</button>`;
    const b = this.arena()?.buildStats();
    const tile = (label: string, v: string) => `<span class="pz-tile"><small>${label}</small><b>${v}</b></span>`;
    this.root.insertAdjacentHTML('beforeend', `<div class="modal pause-modal" id="pause"><div class="pz">
      <div class="pz-head"><b class="pz-title">${tr('PAUSA')}</b>${h ? `<div class="pz-stats">
        <span>${uiIcon('clock')}<b>${fmtTime(h.timeSec)}</b> / ${fmtTime(h.durationSec)}</span><span>☠ <b>${h.kills}</b></span>
        <span>${tr('NV <b>{level}</b>', { level: h.level })}</span><span>◉ <b>${h.runCoins}</b></span>${h.boss ? `<span class="pz-boss">${uiIcon('crown')}<b>${esc(h.boss.name)}</b> ${Math.ceil(h.boss.hp / Math.max(1, h.boss.maxHp) * 100)}%</span>` : ''}</div>` : ''}</div>
      <div class="pz-body">
        <aside class="pz-side">
          <button class="pz-btn primary" id="resume">${tr('▶ Continuar')}</button>
          <div class="pz-box"><h4>${tr('Ajustes rápidos')}</h4>
            <div class="seg pz-seg" id="pp">${(['completo', 'reducido', 'desactivado'] as ParticleLevel[]).map((v) => `<button data-v="${v}" class="${s.particles === v ? 'on' : ''}">${v === 'completo' ? 'Todas' : v === 'reducido' ? 'Pocas' : 'Sin'}</button>`).join('')}</div>
            <small class="pz-cap">${tr('Partículas')}</small>
            ${sw('toggleshake', 'Sacudida', s.shake > 0)}${sw('toggleflash', 'Destellos', s.flashes)}${sw('togglemute', 'Sonido', !s.muted)}</div>
          <button class="pz-btn" id="pausebug">${tr('{x1}Reportar un bug', { x1: uiIcon('bug') })}</button>
          <button class="pz-btn danger" id="quit">${this.inTraining ? tr('Salir del entrenamiento') : tr('Abandonar partida')}</button>
          <p class="note">${this.inTraining ? tr('Vuelves al campo de entrenamiento con la misma configuración.') : tr('Al abandonar conservas las monedas ganadas.')}</p>
        </aside>
        <div class="pz-main">
          <section><h3>${tr('Formación')}</h3><div class="formation-pick pz-forms">${FORMATION_ORDER.map((f) => this.formationCard(f, false)).join('')}</div></section>
          ${b ? `<section><h3>${tr('Tu capitán ahora')}</h3><div class="pz-tiles">${tile(tr('Daño recibido'), `${b.damageTakenPct}%`)}${tile('Recarga', `${b.cooldownPct}%`)}${tile('Área', `${b.areaPct}%`)}
            ${tile('Suerte', `+${b.luckPct}%`)}${tile('Recogida', `${b.pickupPx} px`)}${tile('Revivir', String(b.revives))}</div>
            <p class="note">${tr('Solo el capitán recibe daño: tus compañeros son invulnerables. Recogida máx. 130 px.')}</p></section>` : ''}
          ${(() => { const c = this.pauseCombos(); return c ? `<section>${c.replace('<h3 style="margin-top:12px">', '<h3>')}</section>` : ''; })()}
        </div>
      </div></div></div>`);
    const close = () => { document.getElementById('pause')?.remove(); this.game.scene.resume('Arena'); };
    document.getElementById('resume')!.addEventListener('click', close);
    this.on('#pause .fcard', 'click', (_e, el) => { this.arena()?.selectFormation(el.dataset.f as FormationId); close(); });
    // the running match works on a copy of the settings: hand it the change at once, not only from the next match on
    const live = () => { this.arena()?.liveSettings(s); this.persist(); this.pauseModal(); };
    this.on('#pp button', 'click', (_e, el) => { s.particles = el.dataset.v as ParticleLevel; live(); });
    document.getElementById('toggleshake')!.addEventListener('click', () => { s.shake = s.shake > 0 ? 0 : 0.35; live(); });
    document.getElementById('toggleflash')!.addEventListener('click', () => { s.flashes = !s.flashes; live(); });
    document.getElementById('togglemute')!.addEventListener('click', () => { s.muted = !s.muted; this.applyAudio(); this.persist(); this.pauseModal(); });
    document.getElementById('pausebug')!.addEventListener('click', () => this.bugReportModal());
    document.getElementById('quit')!.addEventListener('click', () => {
      document.getElementById('pause')?.remove();
      if (this.inTraining) { this.inTraining = false; this.trainingField(); return; } // v1.6: no results, no rewards
      this.game.scene.resume('Arena');
      this.arena()?.forceEnd();
    });
  }

  /**
   * BUG-1BDD9F9B: a run cut by the page itself (iOS reloads the tab when it runs out of memory, or after it was hidden)
   * is paid from its last checkpoint, as if it had ended there: what leaving it from the pause menu would have paid.
   * A checkpoint written moments ago may belong to a run still going on in another tab: it waits until it goes quiet.
   */
  private recoverRun(): boolean {
    const cp = readRunCheckpoint();
    if (!cp) return false;
    const age = Date.now() - cp.at;
    if (age < RUN_CP_QUIET) {
      window.clearTimeout(this.recoverTimer);
      this.recoverTimer = window.setTimeout(() => { if (document.querySelector('.m4-tile') && !this.game.scene.isActive('Arena')) this.recoverRun(); }, RUN_CP_QUIET - age + 500);
      return false;
    }
    clearRunCheckpoint();
    if (age > RUN_CP_MAX_AGE) return false;
    this.lastRunTraining = false; this.coopRunActive = false;
    this.seasonRunXp(cp.r);
    this.results(cp.r, true);
    window.setTimeout(() => this.toast(tr('Tu última partida se cortó a los {x1}: aquí tienes lo que llevabas ganado.', { x1: fmtTime(cp.r.timeSec) }), 6000), 4600); // after the pass EXP toast
    return true;
  }

  private results(r: RunResult & { level: number }, recovered = false) {
    if (!recovered) this.sendReplay(r);
    document.getElementById('lvl')?.remove();
    document.getElementById('pause')?.remove();
    const effects = perkEffects(this.save);
    const clanMul = this.clanMatch ? CLAN_REWARD_MULT : 1; // 1.93: the Juegos del Clan paid half; full since the 1-a-day limit
    const { rewards, total, records, tokens, tokenTotal: tokens0, training, trainTotal, eg, egTotal: eg0 } = applyRun(this.save, r, effects.coinMult, effects.rewardMult * clanMul, effects.extraTokens, effects.egChance);
    let tokenTotal = tokens0;
    if (this.clanMatch) {
      // every line of fichas at half (the coins were already halved through rewardMult)
      if (CLAN_REWARD_MULT < 1) for (const t of tokens) { const half = Math.floor(t.coins * CLAN_REWARD_MULT); this.save.tokens -= t.coins - half; tokenTotal -= t.coins - half; t.coins = half; t.label += ' · clan ½'; }
      this.save.clearedMaps = this.save.clearedMaps.filter((x) => x !== r.mapId);
      this.save.egTokens = Math.max(0, (this.save.egTokens ?? 0) - eg0); // 2.0: no Fichas EG in the Juegos del Clan
      eg.length = 0;
      if (this.save.clearedRanks) delete this.save.clearedRanks[r.mapId];
    }
    const evTokens = thanksTokens(r.rank, tokenTotal, serverNow()); // 1.75: Rango S / X while the Banner de agradecimiento is open
    addThanksTokens(this.save, evTokens);
    if (r.victory) recordBluelockWin(this.save, serverNow()); // (author) 3 wins while it is open: the BlueLock banner
    const cap = this.byId.get(r.teamIds?.[0] ?? -1);
    r.captainEra = cap ? eraOf(cap) : undefined;
    r.favoriteOnPitch = (r.teamIds ?? []).filter((id) => this.save.favoriteTeam && this.byId.get(id)?.teams.includes(this.save.favoriteTeam)).length;
    recordRun(this.save, r);
    recordMastery(this.save, r.techById ?? {});
    const runId = r.runId ?? `${Date.now()}`;
    // Fix 1.51 (author): only a completed run (the arena won, endless survival after it included) counts for the ranking
    const coopRun = this.coopRunActive || !!this.roadMatch || this.clanMatch;
    this.coopRunActive = false;
    const best = r.victory && !coopRun && recordBest(this.save, runId, { map: r.mapId, rank: r.rank ?? 'C', time: Math.floor(r.timeSec), damage: r.damage ?? 0, captainId: r.captainId ?? 0, at: new Date().toISOString() });
    if (best) records.push('ranking');
    if (r.victory) recordTriumph(this.save, { runId, at: new Date().toISOString(), map: r.mapId, rank: r.rank ?? 'C', team: r.teamIds ?? (r.captainId ? [r.captainId] : []),
      time: Math.floor(r.timeSec), kills: r.kills, damage: r.damage ?? 0, endless: Math.floor(r.endlessSec ?? 0) });
    this.persist();
    if (r.victory && !coopRun && onlineConfigured() && signedIn() && this.save.onlineName) {
      const credit = this.runSectorCredit;
      submitScore(runId, r.mapId, r.rank ?? 'C', r.timeSec, r.damage ?? 0, r.captainId ?? 0)
        .then((res) => {
          this.toast(res === 'duplicate' ? tr('Esta partida ya estaba en el ranking') : tr('Marca enviada al ranking global'));
          // 2.2: the run's server points go to the player's side (×1.5 after rebelling)
          if (res === 'ok' && credit) void sectorCredit(runId, credit.rebel).then((pts) => {
            const sd = this.save.sector?.side;
            if (pts > 0 && sd) window.setTimeout(() => this.toast(tr('{x1}: +{x2} puntos para tu bando{x3}', { x1: SIDES[sd].name, x2: pts.toLocaleString(locale()), x3: credit.rebel ? ' (rebelde ×1,5)' : '' }), 4000), 2600);
          }).catch((e) => console.warn('[sector]', e));
        })
        .catch((err: Error) => this.toast(tr('Ranking: {message}', { message: err.message }), 4000));
    }
    this.persist();
    const pending = pendingClaims(this.save);
    const map = this.m.maps.find((x) => x.id === r.mapId) ?? this.clanMap!;
    window.setTimeout(() => this.game.scene.stop('Arena'), 0);
    setMusicContext('menu');
    // what the run was: everything here comes from the result already saved above, the animation only shows it
    const team = (r.teamIds ?? []).map((id) => this.byId.get(id)).filter((x): x is RosterEntry => !!x);
    const uses = r.techById ?? {};
    const usesOf = (x: RosterEntry) => x.techniques.reduce((n, t) => n + (uses[String(t.id)] ?? 0), 0);
    const mvp = [...team].sort((a, b) => usesOf(b) - usesOf(a))[0];
    const techs = Object.entries(uses).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([id, n]) => ({ name: team.flatMap((x) => x.techniques).find((t) => String(t.id) === id)?.name ?? '', n })).filter((t) => t.name);
    const owned = this.unlockedRoster().length;
    const recName: Record<string, string> = { tiempo: tr('Mejor tiempo'), eliminaciones: tr('Más eliminaciones'), nivel: tr('Mayor nivel'), ranking: tr('Nueva mejor marca'), infinito: tr('Récord en infinito') };
    const stat = (label: string, value: string, rec: boolean, i: number) => `<div class="stat res-in${rec ? ' rec' : ''}" data-rec="${tr('¡RÉCORD!')}" style="--d:${250 + i * 110}ms"><span class="note">${label}</span><b>${value}</b>${rec ? `<em>${tr('¡RÉCORD!')}</em>` : ''}</div>`;
    const crest = this.emblemOf(this.save.crest);
    const inf = (r.endlessSec ?? 0) > 0;
    this.show(`<div class="screen res-screen ${r.victory ? 'res-win' : 'res-lose'}" id="resroot"><button class="btn small blue res-skip" id="resskip">${tr('Saltar ▶▶')}</button>
      <div class="res-head">${crest ? `<img class="res-crest" src="${crest}" alt="">` : ''}<div class="result-banner ${r.victory ? 'win' : 'lose'}">${r.victory ? tr('¡VICTORIA!') : tr('FIN DE LA PARTIDA')}</div></div>
      <div class="res-squad">${team.map((x, i) => `<span class="res-in${x === mvp ? ' mvp' : ''}" style="--d:${i * 90}ms">${this.mug(x.id, 56)}${x === mvp ? '<small>MVP</small>' : ''}</span>`).join('')}</div>
      <div class="panel" style="max-width:820px;margin:0 auto"><h3>${esc(map.name)} · ${RANKS[r.rank ?? 'C'].label}${r.victory ? ' · superada' : ''}</h3>
      <div class="result-grid">${stat(tr('Tiempo'), fmtTime(r.timeSec), records.includes('tiempo'), 0)}${stat(tr('Eliminaciones'), String(r.kills), records.includes('eliminaciones'), 1)}
        ${stat(tr('Daño'), (r.damage ?? 0).toLocaleString(locale()), false, 2)}${stat(tr('Nivel'), String(r.level), records.includes('nivel'), 3)}${stat(tr('Minijefes'), String(r.minibosses), false, 4)}</div>
      ${(() => { const c = deathCause(r.death); return c ? `<div class="res-death res-in" style="--d:700ms"><b>${r.victory ? tr('Fin de la supervivencia infinita') : tr('Causa de la derrota')}</b><span>${esc(c.line)}</span>
        <span>${tr('Último golpe: {x1} de daño a los {x2} · Sobreviviste {timeSec}', { x1: r.death!.dmg, x2: fmtTime(r.death!.at), timeSec: fmtTime(r.timeSec) })}</span><span class="note">${tr('Consejo: {tip}', { tip: esc(c.tip) })}</span></div>` : ''; })()}
      ${inf ? `<div class="res-inf res-in" style="--d:800ms"><b>${tr('Supervivencia infinita')}</b><span>${tr('Tiempo extra {x1} · Fase alcanzada: {x2} · Jefes adicionales: {x3}', { x1: fmtTime(r.endlessSec ?? 0), x2: esc(r.endlessPhase ?? ''), x3: r.endlessBosses ?? 0 })}</span><span>${tr('Recompensas del infinito: {x1} monedas y {x2} fichas{x3}', { x1: r.endlessCoins ?? 0, x2: r.endlessTokens ?? 0, x3: records.includes('infinito') ? tr(' · ¡Récord personal!') : '' })}</span><span id="resrank"></span></div>` : ''}
      ${mvp ? `<div class="res-mvp res-in" style="--d:900ms"><span>${tr('Mejor jugador: <b>{mvpName}</b> (más técnicas lanzadas)', { mvpName: esc(mvp.name) })}</span>${techs.length ? `<span>${tr('Técnicas más usadas: {x1}', { x1: techs.map((t) => `${esc(tTech(t.name))} ×${t.n}`).join(' · ') })}</span>` : ''}</div>` : ''}
      ${records.length ? `<div class="res-recs res-in" style="--d:1000ms">${records.map((x) => `<span>★ ${recName[x] ?? x}</span>`).join('')}</div>` : ''}
      <div class="reward-cols"><table class="rewards">${rewards.map((x, i) => `<tr class="rrow" style="--d:${1000 + i * 110}ms"><td>${esc(x.label)}</td><td>+${x.coins}</td></tr>`).join('')}
        <tr class="rrow total" style="--d:${1000 + rewards.length * 110}ms"><td><b>${tr('Monedas')}</b></td><td><b id="tcoins">+0</b></td></tr></table>
      <table class="rewards tok">${tokens.map((x, i) => `<tr class="rrow" style="--d:${1000 + i * 110}ms"><td>${esc(x.label)}</td><td>+${x.coins}</td></tr>`).join('')}
        <tr class="rrow total" style="--d:${1000 + tokens.length * 110}ms"><td><b>${tr('Fichas de Fichaje')}</b></td><td><b id="ttokens">+0</b></td></tr>
        ${evTokens ? `<tr class="rrow total ev-tok" style="--d:${1100 + tokens.length * 110}ms"><td><b>${tr('Fichas de evento')}</b></td><td><b>+${evTokens}</b></td></tr>` : ''}</table>
      ${trainTotal ? `<table class="rewards trn">${training.map((x, i) => `<tr class="rrow" style="--d:${1000 + i * 110}ms"><td>${esc(x.label)}</td><td>+${x.coins}</td></tr>`).join('')}
        <tr class="rrow total" style="--d:${1000 + training.length * 110}ms"><td><b>${tr('Fichas de entrenamiento')}</b></td><td><b>+${trainTotal}</b></td></tr></table>` : ''}
      ${eg.length ? `<table class="rewards egr">${eg.map((x, i) => `<tr class="rrow" style="--d:${1100 + i * 110}ms"><td>${esc(x.label)}</td><td>+${x.coins}</td></tr>`).join('')}
        <tr class="rrow total" style="--d:${1100 + eg.length * 110}ms"><td><b>${tr('{egIcon} Fichas EG', { egIcon: this.egIcon(14) })}</b></td><td><b>+${eg.reduce((a, x) => a + x.coins, 0)}</b></td></tr></table>` : ''}</div>
      <div class="result-wallet"><span class="tokens">${this.save.tokens - tokenTotal}</span><span class="coins">${this.save.coins - total}</span></div>
      <p class="note">${tr('Colección: {owned} de {rosterLength} futbolistas · Una tirada cuesta {PULL_COST} fichas', { owned, rosterLength: this.m.roster.length, PULL_COST })}</p>
      ${pending ? `<p class="newtag">${tr('¡Tienes {pending} {x1} por cobrar!', { pending, x1: pending === 1 ? 'misión' : 'misiones' })}</p>` : ''}
      <p style="text-align:center"><button class="btn big" id="again">${tr('Jugar otra vez')}</button> <button class="btn blue" id="menu">${tr('Menú')}</button></p></div></div>`);
    if (r.victory) { sfx('legend'); if (this.save.settings.particles !== 'desactivado') confetti(); } else sfx('reveal');
    if (inf && onlineConfigured() && signedIn() && this.save.onlineName) {
      window.setTimeout(() => { void myPosition({ map: r.mapId, rank: r.rank ?? 'C', order: 'score' }).then((m) => { const el = document.getElementById('resrank'); if (el && m) el.textContent = tr('Posición en el ranking de esta arena: #{pos}', { pos: m.pos }); }).catch(() => undefined); }, 1500);
    }
    const wc = document.querySelector<HTMLElement>('.result-wallet .coins'), wt = document.querySelector<HTMLElement>('.result-wallet .tokens');
    const c = document.getElementById('tcoins')!, t = document.getElementById('ttokens')!;
    const delay = 1000 + Math.max(rewards.length, tokens.length) * 110 + 300;
    const timer = window.setTimeout(() => {
      countUp(c, 0, total, 800, '+');
      countUp(t, 0, tokenTotal, 800, '+');
      if (wc) countUp(wc, this.save.coins - total, this.save.coins, 900);
      if (wt) countUp(wt, this.save.tokens - tokenTotal, this.save.tokens, 900);
      flyTo(c, '.coins', 14);
      flyTo(t, '.tokens', 8);
      sfx('buy');
      document.getElementById('resskip')?.remove();
    }, delay);
    // skipping only changes what is shown: the rewards were applied and saved before this screen appeared
    document.getElementById('resskip')!.addEventListener('click', (e) => {
      window.clearTimeout(timer);
      (e.currentTarget as HTMLElement).remove();
      document.getElementById('resroot')?.classList.add('res-now');
      c.textContent = `+${total}`; t.textContent = `+${tokenTotal}`;
      if (wc) wc.textContent = String(this.save.coins);
      if (wt) wt.textContent = String(this.save.tokens);
    });
    document.getElementById('again')!.addEventListener('click', () => this.captainSelect());
    document.getElementById('menu')!.addEventListener('click', () => this.mainMenu());
  }
}
