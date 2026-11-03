/** HTML/CSS front-end: onboarding, main menu, captain/map select, collection, gacha (IE3 capsule machine), upgrades,
 *  options, profile, HUD, level-up, pause and results. */
import type Phaser from 'phaser';
import type { Manifest, Rarity, RosterEntry, Technique } from '../data/manifest';
import { ICON, RARITY_LABEL, RARITY_ORDER } from '../data/manifest';
import { deathCause } from '../systems/deathCause';
import { serverNow, syncServerTime, timeSource, trustedClock } from '../online/serverTime';
import { PASS, claimPass, passStatus } from '../systems/weeklyPass';
import { applyReward, hasRedeemed, normalizeCode, redeemLocal, type CodeReward } from '../systems/promo';
import { BANNERS, BANNER_ORDER, bannerPool, bannerPrice, eraOf, featured, perPlayerOdds, rarityOdds, teamChoices, type BannerId } from '../systems/banners';
import { exportSave, importSave, remapIds, remapTechSlots, storeSave, type SaveData, type ParticleLevel, type Rank } from '../systems/save';
import { eligibleTeams, pull, recordHistory, COPIES_PER_STAR, DUPLICATE_REFUND_BY, PULL_COST, MAX_STARS, starBonus, onboardingPull, type PullResult } from '../systems/gacha';
import { applyRun, isMapUnlocked, type RunResult } from '../systems/economy';
import { DROPS } from '../systems/items';
import { STAT_INFO } from '../systems/playerStats';
import { statChanges, TYPE_LABEL, MAX_TECH_LEVEL } from '../systems/techniques';
import { evolutionLabel, evolvesAt } from '../systems/evolution';
import { modDef } from '../systems/runmods';
import { FORMATIONS, FORMATION_ORDER, type FormationId } from '../systems/formations';
import { CATEGORY_BONUS, MILESTONES, PERKS, PERK_CATEGORIES, buyPerk, categoryLevels, perkCost, perkLevel, perkEffects, perkValue, refundPerks, spentOn, type PerkCategory } from '../systems/perks';
import { MISSIONS, addCounter, claimAllMissions, claimMission, recordCollection, isClaimable, isClaimed, missionProgress, pendingClaims, recordRun, rollPeriods, setPeriodClock, type MissionKind } from '../systems/missions';
import { MAX_TECH_BOOST, boostCost, buyTechBoost, buyTechUnlock, isBought, isLocked, unlockCost } from '../systems/shop';
import { GEAR_SLOTS, applyGear, buildGear, buyGear, equipGear, type GearItem } from '../systems/gear';
import { SAGAS, sagaOf, setTeamLabels, setTeamSagas, teamLabel, teamNames } from '../data/sagas';
import { canClaim, claimAllTeamRewards, claimTeamReward, grantFavorite, hasCrest, hasKit, teamCaptain, teamMembers, teamProgress, type TeamRewardKind } from '../systems/teamRewards';
import { buyOffer, isBought as isOfferBought, msToNextDay, msToNextWeek, PRICE, rollDaily, type Offer } from '../systems/dailyShop';
import { rankDef, RANKS, RANK_ORDER } from '../systems/difficulty';
import { squadCombos, COMBOS } from '../systems/combos';
import { CLUB_CHEMISTRY, kitBonus } from '../systems/kitBonus';
import { squadPotential } from '../systems/synergy';
import { championsTable, recordTriumph } from '../systems/hallOfFame';
import { BUILD, CURRENT_PUBLIC, PUBLIC_VERSION, TIKTOK_PATH, TIKTOK_URL, VERSION_LABEL } from '../data/release';
import { allNews, LATEST_NEWS_ID, NEWS_KIND_LABEL, type NewsItem } from '../data/news';
/** Fix 1.32: news text: escaped, **bold** allowed */
const newsText = (t: string) => esc(t).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
/** «Hoy», «Ayer», «Hace 3 días» or «2 nov» */
function newsRelDate(d: string) {
  const days = Math.round((new Date().setHours(12, 0, 0, 0) - new Date(`${d}T12:00:00`).getTime()) / 86400000);
  return days <= 0 ? 'Hoy' : days === 1 ? 'Ayer' : days < 7 ? `Hace ${days} días` : new Date(`${d}T12:00:00`).toLocaleDateString('es', { day: 'numeric', month: 'short' });
}
import { buildMeta, CATEGORIES, SEVERITIES, SHOT_MAX_BYTES, SHOT_MAX_SIDE, SHOT_TYPES, STATUS_LABEL, TECH_FIELDS, validateBug, validateShot } from '../systems/bugReport';
import { elementIcon } from './elements';
import { playerStats, resetTraining, trainingOf, trainingUsed, trainRoom, trainStat, trimTraining, TRAIN_MAX, type StatKey } from '../systems/training';
import { ASC_BONUS, ASC_COSTS, HERO_AURA, HERO_STARS_MAX, migrateHeroes131, type AscStep, ascend, ascMultipliers, effectiveRarity, isHero, nextStep, rarityUp, sparesOf } from '../systems/ascension';
import { USERNAME_MAX, validateUsername } from '../systems/username';
import { ALTAR_COLOR, ALTAR_ICON, ALTAR_INFO, ALTAR_MODE, ALTAR_REWARD } from '../systems/altars';
import { adaptedPassive, passiveText, talentChanges, talentText } from '../systems/talents';
import { redeemCode } from '../online/client';
import { accountId, adminBugReports, adminUpdateBug, amIAdmin, consumeAuthRedirect, deleteAccount, deleteMyBugReports, deleteShot, myBugReports, notifyBug, shotUrl, submitBugReport, uploadShot, getCloudSave, leaderboard, myPosition, myProfile, onlineConfigured, putCloudSave, reserveUsername, resetMyProgress, signedEmail, signedIn, signInWithGoogle, signOut, submitScore, usernameAvailable, type BoardQuery, type BoardRow, type BugFilter, type BugRow, type CloudSave } from '../online/client';
import { backup, linkPlan, progressOf, summarize, type SaveSummary } from '../online/cloudSync';
import { epochOf, freshProgress, resetSummary } from '../systems/resetProgress';
import { scoreOf, localBoard, recordBest } from '../systems/leaderboard';
import { coachRequirement, emblemUnlocked, iconAllowed, DEFAULT_EMBLEM } from '../systems/profileUnlocks';
import { INTRO } from './cinematics';
import { SIGNATURE } from '../data/signatures';
import { bindStick, initGamepad } from './gamepad';
import { confetti, countUp, flyTo } from './rewardFx';
import { MASTERY_BONUS, MASTERY_USES, masteryLevel, masteryProgress, recordMastery } from '../systems/mastery';
import { MAX_TEAM, startingTech, type Card } from '../systems/cards';
import { setSquad, SQUAD_SIZE, fillSquad, makeCaptain, placeInSquad, removeFromSquad, squadOf } from '../systems/squad';
import type { ArenaInit, ArenaScene, HudState, MarkerState, Poi } from '../game/ArenaScene';
import { charCanvas, initPreviews, mountPreviews, setPreviewKit } from './sprites';
import { sfx, setVolume } from '../game/sfx';
import { currentTrack, initMusic, setMusicContext, setMusicSource, setMusicVolume, musicUnlocked } from '../game/music';

type Frames = Record<string, { frame: { x: number; y: number; w: number; h: number }; sheet?: number }>;

const esc = (s: unknown) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
const fmtTime = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const RARITY_COLOR: Record<Rarity, string> = { comun: '#9fb0c8', raro: '#4fb3ff', epico: '#b36bff', legendario: '#ffb020', mitico: '#ff4f8b', leyenda: '#fff6c8' };
const ELEMENT_COLOR: Record<string, string> = { Fuego: '#ff6a2a', Aire: '#6ad8ff', Bosque: '#5ee05a', 'Montaña': '#d9a440' };
const POS_LABEL: Record<string, string> = { GK: 'POR', DF: 'DEF', MF: 'MED', FW: 'DEL' };
const FORMATION_ICON = (f: FormationId, size = 46) => {
  const F = FORMATIONS[f];
  const dots = F.slots.map(([x, y]) => `<circle cx="${23 + x * 0.27}" cy="${24 - y * 0.27}" r="3.4" fill="#7fd3ff" stroke="#0a1d48"/>`).join('');
  return `<svg width="${size}" height="${size}" viewBox="0 0 46 46"><rect x="2" y="2" width="42" height="42" rx="6" fill="#0d3a1e" stroke="#5ab45a"/>
    <line x1="2" y1="23" x2="44" y2="23" stroke="#5ab45a" stroke-width="1"/><polygon points="23,5 19,10 27,10" fill="#ffe24a"/>${dots}
    <circle cx="23" cy="24" r="4.2" fill="#f07a12" stroke="#fff" stroke-width="1"/></svg>`;
};

/** marks the public news as read; changes with each public version */
const NEWS_KEY = `noticias-${LATEST_NEWS_ID}`; // Fix 1.32: the menu marks Noticias until the newest item has been seen
/**
 * The interface was laid out for screens about 460 px on their short side; a phone is smaller (≈330 px tall in landscape),
 * so on touch screens it shrinks to fit, never under 60%. The player's own scale setting multiplies this.
 */
const STAT_SHORT: Record<string, string> = { kick: 'TIR', body: 'FÍS', guard: 'DEF', control: 'CON', speed: 'VEL', guts: 'AGA', stamina: 'AGU' };
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
export function statRadar(stats: Record<string, number>, names: Record<string, string>, color: string) {
  const keys = Object.keys(stats), n = keys.length, R = 62, cx = 100, cy = 84;
  const at = (i: number, r: number) => { const a = -Math.PI / 2 + (i / n) * Math.PI * 2; return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]; };
  const poly = (r: (i: number) => number) => keys.map((_, i) => at(i, r(i)).map((v) => v.toFixed(1)).join(',')).join(' ');
  const grid = [0.25, 0.5, 0.75, 1].map((k) => `<polygon points="${poly(() => R * k)}" class="rg"/>`).join('');
  const axes = keys.map((_, i) => { const [x, y] = at(i, R); return `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" class="rg"/>`; }).join('');
  const labels = keys.map((k, i) => {
    const [x, y] = at(i, R + 10), side = x > cx + 4 ? 'start' : x < cx - 4 ? 'end' : 'middle';
    return `<text x="${x.toFixed(1)}" y="${(y + (y > cy ? 9 : y < cy - R ? -2 : 3)).toFixed(1)}" text-anchor="${side}">${esc(names[k] ?? k)} <tspan>${stats[k]}</tspan></text>`;
  }).join('');
  return `<svg viewBox="-30 0 260 180" role="img" aria-label="Estadísticas">${grid}${axes}<polygon points="${poly((i) => R * Math.min(100, stats[keys[i]]) / 100)}" class="rv" style="--rc:${color}"/>${labels}</svg>`;
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
  throw new Error('La imagen es demasiado pesada incluso reducida. Prueba con otra.');
}

export class App {
  private root = document.getElementById('ui')!;
  private byId: Map<number, RosterEntry>;
  /** width of each mugshot sheet: the last sheet of the atlas is smaller than the others */
  private mugW: number[] = [];
  private iconW: number;
  private collectionFilter = { q: '', rarity: '', team: '', pos: '', element: '', saga: '', owned: false };
  private collectionView: 'equipos' | 'todos' | 'fichatron' = 'equipos';
  private collectionLimit = 36;
  /** Fix 1.22: first footballer of a comparison, waiting for the second */
  private compareWith: number | null = null;
  private gear: GearItem[];
  private pulling = false;
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
    this.byId = new Map(m.roster.map((p) => [p.id, p]));
    for (const f of Object.values(mugFrames)) { const s = f.sheet ?? 0; this.mugW[s] = Math.max(this.mugW[s] ?? 0, f.frame.x + f.frame.w); }
    this.iconW = Math.max(...Object.values(iconFrames).map((f) => f.frame.x + f.frame.w));
    this.captainId = save.captainId;
    this.gear = buildGear(m.items.items);
    setPeriodClock(serverNow, trustedClock); // Fix 1.23: missions change day on the server's clock, never the device's
    rollPeriods(save);
    if (remapIds(save, m.idAliases)) storeSave(save); // characters now on another ROM record keep their progress
    if (remapTechSlots(save, m.techRemaps) >= 0) storeSave(save); // repertoires that changed order keep their purchases
    if (migrateHeroes131(save, m.roster)) storeSave(save); // Fix 1.31: Míticos ascended the old way become HÉROE
    if (this.trimAllTraining(save, m.roster)) storeSave(save); // Fix 1.31: points stuck above 99 come back
    if (m.profile && !iconAllowed(save, m.roster, m.profile.emblems, m.profile.coaches)) save.profile.icon = { kind: 'emblem', id: DEFAULT_EMBLEM };
    initPreviews(m);
    setTeamSagas(m.teamSagas);
    // Fix 1.32: cards tilt towards the pointer and a glare follows it (CSS reads --rx --ry --gx --gy); mouse only
    let tiltRaf = 0;
    document.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse' || tiltRaf) return;
      tiltRaf = requestAnimationFrame(() => {
        tiltRaf = 0;
        const card = (e.target as Element | null)?.closest?.('.pcard:not(.locked)') as HTMLElement | null;
        if (!card) return;
        const r = card.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        card.style.setProperty('--ry', `${((x - 0.5) * 14).toFixed(1)}deg`);
        card.style.setProperty('--rx', `${((0.5 - y) * 12).toFixed(1)}deg`);
        card.style.setProperty('--gx', `${Math.round(x * 100)}%`);
        card.style.setProperty('--gy', `${Math.round(y * 100)}%`);
      });
    }, { passive: true });
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
    void syncServerTime().then(() => rollPeriods(this.save)); // daily shop, pass and missions rotate on the server's clock
    let after: (() => void) | null = null;
    if (onlineConfigured()) {
      const ret = await consumeAuthRedirect();
      if (ret?.error) window.setTimeout(() => this.toast(`No se pudo entrar con Google: ${ret.error}`, 5000), 600);
      // Fix 1.32: the game never waits long for the server: after 6 s it opens and the account resolves in the background
      if (signedIn()) {
        const acct = this.resolveAccount();
        after = await Promise.race([acct, new Promise<null>((ok) => window.setTimeout(() => ok(null), 6000))]);
        if (!after) void acct.then((fn) => fn?.()).catch(() => undefined);
      }
      if (ret?.signedIn && !after) window.setTimeout(() => this.toast(this.save.onlineName ? `¡Hola de nuevo, ${this.save.onlineName}!` : '¡Conectado con Google!', 3500), 600);
    }
    const returning = this.save.onboardingDone;
    // the public landing (index.html) sits over the game until «Jugar»: the intro waits for it instead of playing unseen
    await new Promise<void>((ok) => {
      const gone = () => !document.getElementById('landing') || getComputedStyle(document.getElementById('landing')!).display === 'none';
      if (gone()) { ok(); return; }
      const id = window.setInterval(() => { if (gone()) { window.clearInterval(id); ok(); } }, 100);
    });
    void this.intro(this.save.introSeen).then(() => {
      if (!returning) { this.afterIntro(); after?.(); return; }
      this.titleScreen(() => { this.mainMenu(); after?.(); });
    });
  }

  private afterIntro() {
    if (!this.save.onboardingDone) this.createProfile(onlineConfigured() && !signedIn() ? 0 : 1);
    else this.mainMenu();
  }

  /** Returning player: their club is already here, one click (or key) carries on. A guest can still link Google. */
  private titleScreen(next: () => void) {
    const name = this.save.onlineName ?? this.save.profile.name;
    const guest = onlineConfigured() && !signedIn();
    this.show(`<div class="cine title-screen"><div class="cine-shot in"><div class="logo cine-logo"><h1>INA<span class="bolt">Z</span>URVIVORS</h1>
      <div class="sub">ROGUELITE DE FÚTBOL · FANGAME</div></div>
      <p class="cine-text">¡Hola de nuevo, ${esc(name)}!</p>
      <p class="wiz-next"><button class="btn big" id="tscont">Continuar ▶</button></p>
      ${guest ? '<p class="wiz-next"><button class="btn google-btn" id="tsgoogle"><span class="g-logo">G</span> Entrar con Google</button></p><p class="note">Ahora juegas como invitado: tu progreso está en este navegador.</p>' : ''}
      </div></div>`, 'title');
    let gone = false;
    const go = () => { if (gone) return; gone = true; window.removeEventListener('keydown', key); next(); };
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
      if (cloud && epochOf(cloud.data) > epochOf(this.save)) { this.adoptCloud(cloud, this.save.onboardingDone, 'Tu progreso se reinició: empiezas de nuevo con tu cuenta (la copia anterior de este navegador queda como respaldo).'); return null; }
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
  private comboUnlock(c: { name: string; ids: number[] }) {
    document.querySelector('.combo-unlock')?.remove();
    const box = document.createElement('div');
    box.className = 'combo-unlock';
    box.innerHTML = `<div class="cu-mugs">${c.ids.map((id, i) => `<span style="--i:${i}">${this.mug(id, 96)}</span>`).join('')}</div>
      <small>¡NUEVA TÉCNICA COMBINADA!</small><b>${esc(c.name)}</b>`;
    document.body.appendChild(box);
    sfx('legend');
    setTimeout(() => box.classList.add('out'), 1700);
    setTimeout(() => box.remove(), 2200);
  }

  /** Fix 1.12: promotional codes. Online the server decides (once per account); guests redeem on this device. */
  codesModal() {
    document.querySelector('.codes-modal')?.remove();
    const box = document.createElement('div');
    box.className = 'tut-modal codes-modal';
    const online = onlineConfigured() && signedIn();
    box.innerHTML = `<div class="panel codes-panel"><h2>✉ Canjear código</h2>
      <p class="note">${online ? 'Cada código se canjea una sola vez por cuenta, en cualquier dispositivo.' : 'Como invitado el código se canjea en este navegador. Al entrar con Google tu cuenta quedará marcada y no podrás canjearlo otra vez.'}</p>
      <div class="codes-row"><input id="code-in" maxlength="32" autocomplete="off" spellcheck="false" placeholder="CÓDIGO"><button class="btn" id="code-go">Canjear</button></div>
      <p id="code-msg" class="code-msg" aria-live="polite"></p>
      <div class="tut-nav"><span class="spacer"></span><button class="btn small blue" id="code-close">Cerrar</button></div></div>`;
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
          if (status === 'ok' && reward) applyReward(this.save, code, reward);
          if (status === 'used' && !hasRedeemed(this.save, code)) (this.save.redeemedCodes ??= []).push(code);
        } else ({ status, reward } = redeemLocal(this.save, code, this.m.roster));
      } catch { status = 'error'; }
      go.disabled = false;
      if (status === 'invalid') { sfx('error'); return say('Ese código no existe.'); }
      if (status === 'used') { sfx('error'); return say('Ya has canjeado este código.'); }
      if (status !== 'ok' || !reward) { sfx('error'); return say('Error de conexión. Inténtalo de nuevo.'); }
      this.persist();
      say(`¡Código válido! Recibes ${reward.tokens} fichas, ${reward.coins} monedas${reward.player !== null ? ' y un futbolista Legendario' : ''}.`, true);
      sfx('legend');
      const p = reward.player !== null ? this.byId.get(reward.player) : undefined;
      if (p) {
        box.remove();
        const o = this.save.owned[String(p.id)];
        await this.capsuleShow([{ player: p, isNew: o?.copies === 1, stars: o?.stars ?? 0, refund: 0 }], code === 'ASTRA17' ? '¡Regalo de bienvenida ASTRA17!' : `Código ${code}`);
        this.toast(`+${reward.tokens} fichas · +${reward.coins} monedas`, 3500);
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
    box.innerHTML = `<div class="panel" style="max-width:520px"><h2>¡Bienvenido a InaZurvivors online!</h2>
      <p class="note">Es la primera vez que entras con esta cuenta de Google. Reserva tu nombre en todo el mundo: aparecerá en el ranking y es <b>permanente</b>. Después tu progreso de este navegador se guardará en la nube.</p>
      <div class="filters"><input id="wo-name" maxlength="${USERNAME_MAX}" autocomplete="off" spellcheck="false" value="${esc(this.save.profile.name)}"><span id="wo-check" class="pcheck"></span></div>
      <div class="tut-nav"><button class="btn small blue" id="wo-later">Ahora no</button><span class="spacer"></span><button class="btn" id="wo-ok">Reservar nombre y guardar en la nube</button></div></div>`;
    document.body.appendChild(box);
    const input = box.querySelector('#wo-name') as HTMLInputElement, out = box.querySelector('#wo-check') as HTMLElement, ok = box.querySelector('#wo-ok') as HTMLButtonElement;
    this.liveNameCheck(input, out, ok);
    box.querySelector('#wo-later')!.addEventListener('click', () => { box.remove(); this.toast('Puedes reservar tu nombre cuando quieras en Perfil.', 3500); });
    ok.addEventListener('click', () => {
      const v = validateUsername(input.value);
      if (!v.ok) { this.toast(v.reason); return; }
      ok.disabled = true;
      reserveUsername(v.name, String(this.save.profile.icon.id), this.save.crest)
        .then(async (n) => { this.save.onlineName = n; this.claimName(); storeSave(this.save); box.remove(); await this.linkCloud(); this.toast(`Nombre «${n}» reservado. Tu progreso ya está en la nube.`, 4000); this.mainMenu(); })
        .catch((e: Error) => { ok.disabled = false; this.toast(/taken/.test(e.message) ? 'Ese nombre ya está ocupado: prueba otro' : e.message, 3500); });
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
      }).catch(() => { if (mine === seq) { out.className = 'pcheck'; out.textContent = 'No se pudo comprobar ahora'; if (button) button.disabled = false; } }), 450);
    };
    input.addEventListener('input', check);
    check();
  }

  // ------------------------------------------------------------- helpers
  private persist() { storeSave(this.save); void this.pushCloud(); }
  private owned(id: number) { return this.save.owned[String(id)]; }
  private unlockedRoster() { return this.m.roster.filter((p) => this.owned(p.id)); }
  private applyAudio() {
    setVolume(this.save.settings.muted ? 0 : this.save.settings.volume);
    setMusicVolume(this.save.settings.musicVolume, this.save.settings.muted);
  }
  private applyMotion() {
    document.body.classList.toggle('reduced-motion', this.save.settings.reducedMotion);
    document.documentElement.style.setProperty('--ui-scale', String(Math.round(this.save.settings.uiScale * autoUiScale() * 100) / 100));
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
  private profileIcon(size = 56) {
    const ic = this.save.profile.icon;
    if (ic.kind === 'player' && this.byId.has(ic.id)) return `<span class="avatar" style="width:${size}px;height:${size}px">${this.mug(ic.id, size as 64)}</span>`;
    const list = ic.kind === 'coach' ? this.m.profile?.coaches : this.m.profile?.emblems;
    const e = list?.find((x) => (ic.kind === 'coach' ? x.index : x.teamId) === ic.id) ?? this.m.profile?.emblems?.[0];
    return `<span class="avatar" style="width:${size}px;height:${size}px">${e ? `<img src="${e.texture}" alt="">` : ''}</span>`;
  }
  /** Fix 1.3: the stats the game really uses (rarity band, ascension, HÉROE, training: training.ts); null without data. */
  private statsOf(p: RosterEntry): Record<string, number> | null {
    return p.stats ? playerStats(this.save, p, effectiveRarity(this.save, p), isHero(this.save, p.id)) : null;
  }
  private rar(p: RosterEntry) {
    const r = effectiveRarity(this.save, p);
    // Fix 1.31: a HÉROE is shown as HÉROE (with its hero stars), not as the rarity it came from
    if (isHero(this.save, p.id)) { const hs = this.owned(p.id)?.heroStars ?? 0; return `<span class="rar heroe">HÉROE${hs ? ` ${'★'.repeat(hs)}` : ''}</span>`; }
    return `<span class="rar ${r}">${RARITY_LABEL[r].toUpperCase()}</span>`;
  }
  /** Type icon (generic manual of its category) framed in the element colour, plus element and category chips. */
  private techBadge(t: Technique, scale = 3) {
    const e = t.element ?? '';
    return `<span class="lv-techicon" style="--ec:${ELEMENT_COLOR[e] ?? '#8a9bbd'}">${this.icon(ICON.manual[t.type], scale)}<span class="lv-elic">${elementIcon(t.element, 10 + scale * 4)}</span></span>`;
  }
  private techChips(t: Technique) {
    const e = t.element ?? 'Sin elemento';
    return `<div class="tchips"><span class="tcat">${TYPE_LABEL[t.type]}</span><span class="elem" style="--ec:${ELEMENT_COLOR[e] ?? '#ccc'}">${elementIcon(t.element, 12)}${esc(e)}</span></div>`;
  }
  private elem(p: RosterEntry) {
    const e = String(p.element);
    return `<span class="elem" style="--ec:${ELEMENT_COLOR[e] ?? '#ccc'}">${elementIcon(e, 12)}${esc(e)}</span>`;
  }
  private show(html: string, cls = '') {
    // refreshing the same screen must not replay entrances, lose the scroll or restart CSS animations
    const key = /<h2>(.*?)<\/h2>/.exec(html)?.[1] ?? cls;
    const same = key === this.screenKey;
    const top = same ? this.root.querySelector('.screen, .menu-root')?.scrollTop ?? 0 : 0;
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
  /** Two-step purchase button: the first click arms it, the second confirms. */
  private armed(el: HTMLElement, fn: () => void) {
    if (el.dataset.armed) { fn(); return; }
    el.dataset.armed = '1';
    const label = el.textContent;
    el.textContent = '¿Confirmar?';
    el.classList.add('arm');
    window.setTimeout(() => {
      if (!el.isConnected) return;
      delete el.dataset.armed;
      el.textContent = label;
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
  private titlebar(title: string, back?: string) {
    return `<div class="titlebar">${back ? `<button class="btn small blue" data-back>◀ ${esc(back)}</button>` : ''}
      <h2>${esc(title)}</h2><span class="spacer"></span><span class="tokens" title="Fichas de Fichaje">${this.save.tokens}</span><span class="coins">${this.save.coins}</span></div>`;
  }
  private techHtml(t: Technique) {
    return `<div class="tech">${this.icon(ICON.manual[t.type], 2)}<div><div class="tn">${esc(t.name)}</div>
      <div class="td">${t.type === 'talento' ? `Talento pasivo · ${esc(talentText(t.id, 1) || 'sin efecto')}` : `${TYPE_LABEL[t.type]} · ${esc(t.element ?? '—')} · poder ${t.power}`}</div><div class="td">${esc(t.description)}</div></div></div>`;
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
    const starSvg = (cls: string) => `<svg class="${cls}" viewBox="0 0 24 24"><path d="M12 1.8l3.1 6.6 7.2.8-5.4 4.9 1.5 7.1L12 17.6l-6.4 3.6 1.5-7.1L1.7 9.2l7.2-.8z"/></svg>`;
    const heroStars = hero ? `<span class="hero-stars" title="${o?.heroStars ?? 0} de ${HERO_STARS_MAX} estrellas de héroe">${Array.from({ length: HERO_STARS_MAX }, (_, i) => starSvg(`hst${i < (o?.heroStars ?? 0) ? ' on' : ''}`)).join('')}</span>` : '';
    const stars = !locked && o ? `<div class="stars" title="${o.stars} de ${MAX_STARS} estrellas">${Array.from({ length: MAX_STARS }, (_, i) => starSvg(`st${i < o.stars ? ' on' : ''}`)).join('')}${heroStars}</div>` : '<div class="stars"></div>';
    const spare = !locked && o ? sparesOf(this.save, p.id) : 0, step = !locked && o ? nextStep(this.save, p) : null;
    const canAsc = !!step && spare >= step.cost;
    const dup = canAsc ? `<span class="card-dup can-asc" title="¡Puedes ascender! (${spare} duplicados)">▲ ${spare}</span>`
      : spare ? `<span class="card-dup" title="Duplicados sin usar${step ? ` (${step.step === 'heroe' ? 'HÉROE' : step.step === 'estrella' ? 'estrella de héroe' : 'ascenso'}: ${step.cost})` : ''}">+${spare}${step ? ` <i>${spare}/${step.cost}</i>` : ''}</span>` : '<span></span>';
    const top = `${opts.badge ? `<span class="badge">${esc(opts.badge)}</span>` : ''}${opts.captain ? '<span class="captain-badge">C</span>' : ''}`;
    const st = !locked && p.stats ? this.statsOf(p) : null;
    const e = String(p.element ?? '');
    const crest = this.emblemOf(p.teams[0]);
    const statKeys = ['kick', 'control', 'guard', 'body', 'speed', 'guts'] as const;
    const bars = st ? `<div class="cc-stats">${statKeys.map((k) => `<span><small>${STAT_SHORT[k]}</small><i style="--v:${st[k]}%"></i><b>${st[k]}</b></span>`).join('')}</div>` : '<div class="cc-stats empty"></div>';
    const tier = hero ? 'heroe' : er;
    return `<div class="pcard cc t-${tier} r-${er}${locked ? ' locked' : ''}${opts.sel ? ' sel' : ''}${opts.big ? ' big' : ''}${hero ? ' hero' : ''}" data-id="${p.id}" style="--rc:${RARITY_COLOR[er]};--ec:${ELEMENT_COLOR[e] ?? '#8a9bbd'}">
      ${top ? `<div class="pc-top">${top}</div>` : ''}
      <div class="cc-frame"><i class="cc-bevel"></i><i class="cc-crown"></i><i class="cc-orn tl"></i><i class="cc-orn tr"></i><i class="cc-orn bl"></i><i class="cc-orn br"></i>
        <div class="cc-face">
          <div class="cc-art${locked ? ' dark' : ''}">${crest ? `<img class="cc-crest" src="${crest}" alt="">` : ''}<i class="cc-rays"></i>
            ${this.mug(p.id, opts.big ? 152 : 112)}${locked ? '<span class="qmark">?</span><span class="lock-tag">Bloqueado</span>' : opts.big || opts.anim !== undefined ? `<span class="minisprite">${charCanvas(p.id, 2, opts.anim ?? 4)}</span>` : ''}
            <div class="cc-gem" title="${esc(e)}">${locked ? '' : elementIcon(e, 16)}</div>
            ${st ? `<div class="cc-ovr" title="Media de estadísticas"><b>${statMean(st)}</b><small>${POS_LABEL[p.position] ?? p.position}</small></div>` : `<div class="cc-ovr pos"><small>${POS_LABEL[p.position] ?? p.position}</small></div>`}
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
      this.show('<div class="cine"><div class="cine-shot" id="shot"></div><button class="btn small blue cine-skip" id="skip">Saltar ▶▶</button></div>', 'intro');
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
        if (shot.kind === 'text') box.innerHTML = `<p class="cine-text">${esc(shot.text)}</p>`;
        else if (shot.kind === 'cast') box.innerHTML = `<div class="cine-cast">${cast.map((p) => `<span style="--rc:${RARITY_COLOR[p.rarity]}">${this.mug(p.id, 128)}</span>`).join('')}</div><p class="cine-text">${esc(shot.text)}</p>`;
        else if (shot.kind === 'video') box.innerHTML = `<video src="${shot.src}" autoplay muted></video>`;
        else { // own animated title: lightning strikes, the logo slams in, the four elements orbit, balls fly past
          const bolts = Array.from({ length: 5 }, (_, k) => `<svg class="ib-bolt" style="--x:${10 + k * 20}%;--d:${k * 0.12}s" viewBox="0 0 60 100"><polygon points="38,0 6,56 26,56 16,100 56,38 34,38"/></svg>`).join('');
          const orbs = ['Fuego', 'Aire', 'Bosque', 'Montaña'].map((e, k) => `<span class="ib-orb" style="--k:${k}">${elementIcon(e, 40)}</span>`).join('');
          const balls = Array.from({ length: 6 }, (_, k) => `<i class="ib-ball" style="--y:${15 + k * 13}%;--d:${0.4 + k * 0.18}s">⚽</i>`).join('');
          box.innerHTML = `<div class="intro-burst">${bolts}${balls}<div class="ib-orbit">${orbs}</div><div class="logo cine-logo ib-logo"><h1>INA<span class="bolt">Z</span>URVIVORS</h1><div class="sub">ROGUELITE DE FÚTBOL · FANGAME</div></div></div>`;
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
    const steps = ['Nombre', 'Avatar', 'Equipo favorito', 'Confirmar'];
    const dots = step === 0 ? '' : steps.map((t, i) => `<span class="${i + 1 === step ? 'on' : i + 1 < step ? 'done' : ''}">${i + 1}. ${t}</span>`).join('');
    let body = '';
    const nameOk = validateUsername(draft.name).ok;
    const fixedName = this.save.onlineName; // a Google account that already reserved its name keeps it
    if (fixedName) draft.name = fixedName;
    if (step === 0) {
      body = `<h3>¡Bienvenido, entrenador!</h3>
        <p>Entra con Google para reservar tu nombre en todo el mundo, aparecer en el ranking mundial y guardar tu progreso en la nube. Si ya jugaste en otro dispositivo, recuperas tu club.</p>
        <p class="wiz-next"><button class="btn big google-btn" id="google"><span class="g-logo">G</span> Continuar con Google</button></p>
        <p class="wiz-next"><button class="btn blue" id="guest">Jugar como invitado</button></p>
        <p class="note">Como invitado tu progreso se guarda solo en este navegador; puedes entrar con Google más tarde desde Perfil sin perderlo.
          <a href="privacidad.html" target="_blank" rel="noopener">Privacidad y condiciones</a></p>`;
    } else if (step === 1 && fixedName) {
      body = `<h3>¡Hola de nuevo! Tu nombre global ya está reservado</h3>
        <div class="name-field"><b class="fixed-name">${esc(fixedName)}</b></div>
        <p class="note">Es permanente y es el que aparece en el ranking.</p>
        <p class="wiz-next"><button class="btn big" id="next">Siguiente ▶</button></p>`;
    } else if (step === 1) {
      body = `<h3>¡Bienvenido, entrenador! ¿Cómo se llama el capitán de este club?</h3>
        <div class="name-field"><input id="pname" maxlength="${USERNAME_MAX}" autocomplete="off" spellcheck="false" value="${esc(draft.name)}" placeholder="Tu nombre de usuario"><span id="pcheck" class="pcheck"></span></div>
        <p class="note">3-20 caracteres: letras sin tildes, números y _. <b>El nombre es permanente</b>: no se podrá cambiar después.
          ${!onlineConfigured() ? 'Ranking online sin conectar: el nombre es solo de este navegador.' : signedIn() ? 'Se reserva en todo el mundo para tu cuenta de Google al crear el perfil.' : 'Como invitado es solo de este navegador; al entrar con Google se reserva en todo el mundo si está libre.'}</p>
        <p class="wiz-next"><button class="btn big" id="next" ${nameOk ? '' : 'disabled'}>Siguiente ▶</button></p>`;
    } else if (step === 2) {
      body = `<h3>Elige el escudo de tu avatar</h3>
        <div class="crest-pick">${emblems.map((e) => `<button class="crest-btn${e.teamId === draft.emblem ? ' on' : ''}" data-e="${e.teamId}" title="${esc(e.name)}"><img src="${e.texture}" alt=""><small>${esc(e.name)}</small></button>`).join('')}</div>
        <p class="wiz-next"><button class="btn blue" id="prev">◀ Atrás</button> <button class="btn big" id="next">Siguiente ▶</button></p>`;
    } else if (step === 3) {
      body = `<h3>¿Cuál es tu equipo favorito?</h3><p class="note">Empiezas con su escudo y, si está disponible, su equipación ya puesta. Uno de tus 5 primeros fichajes será de este equipo, con rareza Épica o superior.</p>
        <div class="team-picks">${SAGAS.map((sg) => { const list = teams.filter((t) => sagaOf(t) === sg); return list.length ? `<h4>${sg}</h4><div class="team-grid">${list.map((t) => `<button class="team-card${t === draft.team ? ' on' : ''}" data-t="${esc(t)}">${this.emblemOf(t) ? `<img src="${this.emblemOf(t)}" alt="">` : '<span class="noemblem">⚽</span>'}<span>${esc(teamLabel(t))}</span><small class="fav-tag ${fullKit(t) ? 'full' : ''}">${fullKit(t) ? 'Escudo y equipación' : 'Solo escudo'}</small></button>`).join('')}</div>` : ''; }).join('')}</div>
        <p class="wiz-next"><button class="btn blue" id="prev">◀ Atrás</button> <button class="btn big" id="next" ${draft.team ? '' : 'disabled'}>Siguiente ▶</button></p>`;
    } else {
      const em = this.m.profile?.emblems.find((e) => e.teamId === draft.emblem);
      body = `<h3>Confirma tu club</h3>
        <div class="club-card">${em ? `<img src="${em.texture}" alt="">` : ''}<div><b>${esc(draft.name)}</b><small>Entrenador · nombre permanente</small>
          <span>Equipo favorito: ${this.emblemOf(draft.team) ? `<img class="mini-crest" src="${this.emblemOf(draft.team)}" alt="">` : ''}${esc(teamLabel(draft.team))}</span></div></div>
        <p>${this.m.kits?.[draft.team] ? `Empiezas con la equipación y el escudo de ${esc(teamLabel(draft.team))}.` : `Empiezas con el escudo de ${esc(teamLabel(draft.team))}; este equipo aún no tiene equipación de combate disponible.`} La máquina te dará <b>5 futbolistas distintos</b>, y al menos uno será de ${esc(teamLabel(draft.team))} con rareza Épica o superior. Este regalo solo ocurre una vez.</p>
        <p class="wiz-next"><button class="btn blue" id="prev">◀ Atrás</button> <button class="btn big" id="go">Crear perfil y abrir mis 5 cápsulas ▶</button></p>`;
    }
    this.show(`<div class="screen center"><div class="logo"><h1>INA<span class="bolt">Z</span>URVIVORS</h1><div class="sub">ROGUELITE DE FÚTBOL · FANGAME</div></div>
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
          }).catch(() => { if (mine === seq) { out.className = 'pcheck'; out.textContent = 'No se pudo comprobar ahora'; next.disabled = false; } });
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
          this.toast(/taken/.test(m) ? 'Alguien acaba de reservar ese nombre: elige otro' : m, 4000);
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
      await this.capsuleShow(got.map((p) => ({ player: p, isNew: true, stars: 0, refund: 0 })), 'Tus primeros fichajes');
      this.onboardingSummary(got);
    });
  }

  private onboardingSummary(got: RosterEntry[]) {
    this.show(`<div class="screen">${this.titlebar('¡Tu equipo inicial!')}
      <div class="panel" style="margin-bottom:12px"><p>Estos ${got.length} futbolistas ya forman parte de tu colección. En cada partida empiezas con tu capitán
      y fichas compañeros al subir de nivel (máximo ${MAX_TEAM}). Consigue más en la máquina de fichajes.</p></div>
      <div class="grid">${got.map((p, i) => this.pcard(p, { captain: i === 0, anim: 12, big: true })).join('')}</div>
      <p style="text-align:center;margin-top:16px"><button class="btn big" id="menu">Ir al menú ▶</button></p></div>`);
    document.getElementById('menu')!.addEventListener('click', () => this.mainMenu());
  }

  // ------------------------------------------------------------- main menu
  private stopScenes() {
    if (this.game.scene.isActive('Menu') || this.game.scene.isPaused('Menu')) this.game.scene.stop('Menu');
    if (this.game.scene.isActive('Arena') || this.game.scene.isPaused('Arena')) this.game.scene.stop('Arena');
  }

  mainMenu() {
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
    const tile = (go: string, icon: string, label: string, sub: string, cls = '', badge = 0) => `<button class="mbtn ${cls}" data-go="${go}"><span class="mi">${icon}</span><span><b>${label}</b><small>${sub}</small></span>${badge ? `<span class="notif">${badge}</span>` : ''}</button>`;
    const squad = squadOf(this.save, this.byId);
    const unseenLog = this.save.devlogSeen !== NEWS_KEY;
    this.show(`<div class="menu-root"><div class="menu-lights"><i></i><i></i><i></i><b></b><b></b><b></b></div>
      <div class="menu-top"><div class="profile-chip" data-go="profile">${this.profileIcon(52)}${this.save.crest && this.emblemOf(this.save.crest) ? `<img class="chip-crest" src="${this.emblemOf(this.save.crest)}" alt="">` : ''}<div><b>${esc(this.save.profile.name)}</b>
        <span class="note">${owned.length}/${this.m.roster.length} futbolistas · ${this.save.stats.wins} victorias</span></div></div>
        <span class="spacer"></span>${this.tiktokLink()}<button class="btn small blue menu-bug" id="menubug">Reportar un bug</button><button class="btn small blue" id="mute" aria-pressed="${!this.save.settings.muted}">${this.save.settings.muted ? 'SONIDO NO' : 'SONIDO SÍ'}</button>
        <span class="tokens" title="Fichas de Fichaje">${this.save.tokens}</span><span class="coins" title="Monedas">${this.save.coins}</span></div>
      <div class="menu-stage">
        <section class="menu-left">
          <div class="logo menu-logo brand"><svg class="logo-bolt" viewBox="0 0 60 100"><polygon points="38,0 6,56 26,56 16,100 56,38 34,38"/></svg>
            <h1 aria-label="InaZurvivors"><span class="b1">Ina</span><span class="bz">Z</span><span class="b2">urvivors</span></h1><div class="sub">ROGUELITE DE FÚTBOL · FANGAME <span class="ver-badge">${esc(VERSION_LABEL)}</span></div></div>
          <div class="play-row"><button class="mbtn play" data-go="play"><span class="mi">▶</span><span><b>JUGAR</b><small>${squad[0] ? `Capitán: ${esc(squad[0].name)} · Rango ${this.save.difficulty}` : 'Prepara tu equipo'}</small></span></button>
            <button class="mbtn team" data-go="squad"><span class="mi">♜</span><span><b>MI EQUIPO</b><small>${squad.length}/${SQUAD_SIZE} candidatos</small></span></button></div>
          <nav class="menu-tiles">
            ${tile('collection', '◆', 'COLECCIÓN', claims ? '¡Recompensas para recoger!' : `${owned.length} de ${this.m.roster.length}`, '', claims)}
            ${tile('gacha', '◎', 'FICHAJES', `${this.save.tokens} fichas`, 'gacha')}
            ${tile('missions', '✔', 'MISIONES', 'Recompensas', '', pending)}
            ${tile('daily', '☼', 'TIENDA', 'Fichajes del día')}
            ${tile('codes', '✉', 'CÓDIGOS', 'Canjea regalos')}
            ${tile('pass', '✦', 'PASE SEMANAL', passStatus(this.save, serverNow()).available ? '¡Recompensa lista!' : 'Vuelve mañana', '', passStatus(this.save, serverNow()).available ? 1 : 0)}
            ${tile('perks', '▲', 'MEJORAS', 'Potencia permanente')}
            ${tile('shop', '★', 'TÉCNICAS', 'Manuales y refuerzos')}
            ${tile('kits', '♦', 'EQUIPACIONES', 'Uniforme y escudo')}
            ${tile('gear', '▣', 'EQUIPAMIENTO', 'Botas y accesorios')}
            ${tile('ranking', '♛', 'RANKING', onlineConfigured() ? 'Global' : 'Tus marcas')}
            ${tile('hall', '🏆', 'SALÓN DE LA FAMA', `${(this.save.hall ?? []).length} victorias`)}
            ${tile('devlog', '📰', 'NOTICIAS', unseenLog ? '¡Hay novedades!' : `v${PUBLIC_VERSION}`, '', unseenLog ? 1 : 0)}
            ${tile('options', '⚙', 'AJUSTES', 'Sonido, cámara y copia')}
          </nav>
        </section>
        ${feat ? `<section class="hero r-${feat.rarity}" data-go="squad" style="--rc:${RARITY_COLOR[feat.rarity]}"><div class="hero-glow"></div>
          <div class="hero-art">${this.mug(feat.id, 256)}<span class="hero-sprite">${charCanvas(feat.id, 3, 12)}</span></div>
          <div class="hero-plate"><small>${this.captainId === feat.id ? 'TU CAPITÁN' : 'TU ESTRELLA'}</small><b>${esc(feat.name)}</b><div>${this.rar(feat)} ${this.elem(feat)}</div>
            ${feat.stats ? `<div class="hero-stats"><span class="ovr">${statMean(this.statsOf(feat)!)}</span>${statRadar(this.statsOf(feat)!, STAT_SHORT, RARITY_COLOR[effectiveRarity(this.save, feat)])}</div><button class="btn small blue" data-sheet="${feat.id}">Ver ficha y estadísticas</button>` : ''}</div></section>` : ''}
        <aside class="menu-right">
          <button class="panel side update-card" data-go="devlog"><small>NOTICIAS · ${esc(VERSION_LABEL)}</small><b>${esc(allNews()[0]?.title ?? CURRENT_PUBLIC.title)}</b>
            <span>${esc(allNews()[0]?.summary ?? CURRENT_PUBLIC.tagline)}</span>${unseenLog ? '<em>NUEVO</em>' : ''}</button>
          <div class="panel side"><h3>Desafíos</h3>${challenges.map((d) => `<div class="chal"><span>${esc(d.label)}</span><i style="--p:${Math.round(missionProgress(this.save, d) / d.goal * 100)}%"></i></div>`).join('') || '<div class="note">¡Todo completado por hoy!</div>'}</div>
          <div class="panel side"><h3>Arenas</h3>${this.m.maps.map((mp) => `<div class="arena-row ${this.save.clearedMaps.includes(mp.id) ? 'ok' : ''}">${this.save.clearedMaps.includes(mp.id) ? '✔' : '·'} ${esc(mp.name)} <span class="rank-done">${(this.save.clearedRanks[mp.id] ?? []).map((r) => `<span class="ok">${r}</span>`).join('')}</span></div>`).join('')}
            <div class="note">Mejor tiempo ${fmtTime(this.save.stats.bestTimeSec)} · ${this.save.stats.kills} eliminaciones</div></div>
          <button class="btn small blue" data-go="tutorial">¿Cómo se juega?</button>
        </aside>
      </div>
      <section class="menu-wide">
        <div class="panel wide-rank"><div class="wide-head"><h3>♛ Ranking mundial</h3><button class="btn small" data-go="ranking">Ver todo</button></div>
          <div id="menurank">${onlineConfigured() ? '<div class="note">Cargando…</div>' : '<div class="note">Disponible cuando se active el servicio online.</div>'}</div></div>
        <div class="panel wide-pass" id="widepass">${this.passWidget()}</div>
      </section>
      <footer class="menu-foot legal-foot"><span>Fangame gratuito, sin ánimo de lucro y no oficial, creado por AstraStorm17. Inazuma Eleven y todos sus derechos pertenecen a LEVEL-5 y sus respectivos titulares. Este proyecto no está afiliado, patrocinado ni aprobado por LEVEL-5. · <button id="credits" class="legal-link">Aviso legal</button> · ${esc(VERSION_LABEL)}</span></footer>
      ${musicUnlocked() ? '' : '<div class="audio-hint">Haz clic en cualquier parte para activar la música</div>'}</div>`, 'menu-mode');
    this.on('[data-sheet]', 'click', (e, el) => { e.stopPropagation(); this.collection(Number(el.dataset.sheet)); });
    // Fix 1.31: notice when the Colección has something new to collect (once per new reward, not on every visit)
    if (claims > Math.max(0, this.claimsAnnounced)) window.setTimeout(() => this.toast(`¡Tienes ${claims === 1 ? 'una recompensa' : `${claims} recompensas`} para recoger en la Colección!`, 4000), 400);
    this.claimsAnnounced = claims;
    this.on('[data-go]', 'click', (_e, el) => {
      const go = el.dataset.go;
      if (go === 'play') {
        if (!this.save.squad.length && this.unlockedRoster().length) { fillSquad(this.save, this.m.roster); this.persist(); } // first game: best seven
        if (squadOf(this.save, this.byId).length) this.mapSelect(); else this.captainSelect();
      }
      if (go === 'squad') this.captainSelect();
      if (go === 'collection') this.collection();
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
      if (go === 'hall') this.hallOfFame();
      if (go === 'pass') this.weeklyPass();
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
      b.textContent = this.save.settings.muted ? 'SONIDO NO' : 'SONIDO SÍ';
      b.setAttribute('aria-pressed', String(!this.save.settings.muted));
    });
    document.addEventListener('pointerdown', () => document.querySelector('.audio-hint')?.remove(), { once: true });
    if (onlineConfigured()) void this.fillMenuRank();
    document.getElementById('wpclaim')?.addEventListener('click', (e) => { (e.target as HTMLButtonElement).disabled = true; this.claimPassNow(() => this.mainMenu()); });
    if (this.save.tutorial === 'pendiente' && this.save.onboardingDone) window.setTimeout(() => { if (this.screenKey === 'menu-mode') this.tutorial(); }, 400);
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
    const up = rarityUp(p.rarity), label = next?.step === 'ascenso' ? `${RARITY_LABEL[up].toUpperCase()}${up === p.rarity ? ' +' : ''}` : next?.step === 'estrella' ? `HÉROE ${'★'.repeat(hs + 1)}` : 'HÉROE';
    const pct = (v: number) => `+${Math.round((v - 1) * 100)}%`;
    const starUnlocks = [`Estrella de héroe ${hs + 1} de ${HERO_STARS_MAX}: +${Math.round((ASC_BONUS.estrella.damage - 1) * 100)}% daño, +${Math.round((ASC_BONUS.estrella.hp - 1) * 100)}% vida y +1 a todas sus estadísticas`];
    const unlocks = next?.step === 'estrella' ? starUnlocks : next?.step === 'heroe' || (!next && isHero(this.save, id))
      ? [`Técnica de HÉROE: ${p.heroTech ? p.heroTech.name : 'ninguna documentada para este jugador'}`, `${HERO_AURA.label} (habilidad original de InaZurvivors): ${HERO_AURA.description}`, 'Marco dorado e insignia HÉROE en la colección']
      : [up === p.rarity ? `Ascendido: sigue siendo ${RARITY_LABEL[up]}, con la bonificación de ascensión` : `Rareza ${RARITY_LABEL[up]} (sin cambiar de personaje)`,
        `Acceso a la ascensión HÉROE (${(ASC_COSTS[p.rarity] ?? ASC_COSTS.legendario).heroe} duplicados más)`];
    const box = document.createElement('div');
    box.className = 'tut-modal asc-modal';
    box.innerHTML = `<div class="panel asc-card${isHero(this.save, id) ? ' is-hero' : ''}" style="--rc:${RARITY_COLOR[curR]}">
      <h2>${next ? (next.step === 'estrella' ? 'Estrellas de héroe' : 'Ascensión') : `¡HÉROE ${'★'.repeat(hs)}!`}</h2>
      <div class="asc-row"><div class="asc-art">${this.mug(id, 128)}${charCanvas(id, 3, 12)}</div>
        <div class="asc-info"><b>${esc(p.name)}</b>
          <div class="asc-step">${this.rar(p)}${next ? ` <em>»</em> <span class="rar ${next.step === 'ascenso' ? up : 'heroe'}">${label}</span>` : ''}</div>
          ${next ? `<div class="asc-cost${spares >= next.cost ? ' ok' : ''}">Duplicados: <b>${spares}/${next.cost}</b>${spares >= next.cost ? '' : ` · te faltan ${next.cost - spares}`}</div>` : ''}
          <div class="asc-stats"><span>Daño en partida</span><b>${pct(now.damage)}</b>${next ? `<em>»</em><b class="up">${pct(after.damage)}</b>` : ''}
            <span>Vida aportada</span><b>${pct(now.hp)}</b>${next ? `<em>»</em><b class="up">${pct(after.hp)}</b>` : ''}</div>
          <ul class="gi-list">${unlocks.map((u) => `<li>${esc(u)}</li>`).join('')}</ul>
          <div class="note">Los duplicados se consumen; las estrellas ya ganadas se conservan.</div></div></div>
      <div class="tut-nav"><button class="btn small blue" id="ascclose">Cerrar</button><span class="spacer"></span>
        ${next ? `<button class="btn big" id="ascgo" ${spares >= next.cost ? '' : 'disabled'}>Ascender (${next.cost} duplicados)</button>` : ''}</div></div>`;
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
      if (returned) window.setTimeout(() => this.toast(`Te devolvemos ${returned} ${returned === 1 ? 'punto' : 'puntos'} de entrenamiento: esas estadísticas ya llegan a 99`, 4500), 1600);
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
      const heroLabel = step === 'estrella' ? `HÉROE ${'★'.repeat(this.owned(p.id)?.heroStars ?? 1)}` : 'HÉROE';
      const tier = r === 'leyenda' || hero ? 3 : r === 'mitico' ? 2 : r === 'legendario' ? 1 : 0;
      const ov = document.createElement('div');
      ov.className = `reveal asc-reveal${tier >= 1 ? ' legend' : ''}${tier >= 2 ? ' myth' : ''}${hero ? ' leyenda' : ''}`;
      ov.style.setProperty('--rc', `${RARITY_COLOR[r]}55`);
      ov.innerHTML = `<div class="rays"></div><div class="flash go"></div>
        <div class="reveal-card from-scene"><div class="rarity-big t${tier}" style="color:${hero ? '#ffd21f' : RARITY_COLOR[r]}">${hero ? heroLabel : RARITY_LABEL[r].toUpperCase()}</div>
          ${this.pcard(p, { anim: 12, big: true })}<div class="newtag">${step === 'estrella' ? '¡NUEVA ESTRELLA DE HÉROE!' : hero ? '¡HÉROE!' : '¡ASCENDIDO!'}</div><button class="btn big">Aceptar</button></div>`;
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
      <small>${c.wins} ${c.wins === 1 ? 'victoria' : 'victorias'} · ${c.captain} de capitán · mejor rango ${c.best}</small></div>`; }).join('');
    const rows = hall.slice(0, 60).map((t, i) => `<div class="hof-run" style="--d:${Math.min(i, 15) * 40}ms">
      <span class="rank-btn r-${t.rank} rk-r"><b>${t.rank}</b></span>
      <span class="hof-meta"><b>${esc(mapName(t.map))}</b><small>${new Date(t.at).toLocaleDateString('es')} · ${fmtTime(t.time)} · ${t.kills} eliminaciones · ${t.damage.toLocaleString('es')} daño${t.endless ? ` · ∞ ${fmtTime(t.endless)}` : ''}</small></span>
      <span class="hof-team">${t.team.filter((id) => this.byId.has(id)).map((id, k) => `<span class="hof-p${k === 0 ? ' cap' : ''}" title="${esc(this.byId.get(id)!.name)}">${this.mug(id, 44)}${k === 0 ? '<i>C</i>' : ''}</span>`).join('')}</span></div>`).join('');
    const byMap = this.m.maps.map((mp) => `${esc(mp.name)}: ${hall.filter((t) => t.map === mp.id).length}`).join(' · ');
    this.show(`<div class="screen">${this.titlebar('Salón de la fama', 'Menú')}
      <div class="panel"><b class="hof-total">${hall.length} ${hall.length === 1 ? 'victoria' : 'victorias'}</b><div class="note">${byMap}${this.save.stats.bestEndless ? ` · Récord infinito ${fmtTime(this.save.stats.bestEndless)}` : ''}</div></div>
      ${champs.length ? `<div class="panel"><h3>Leyendas de tu club</h3><div class="hof-champs">${top}</div></div>` : ''}
      <div class="panel"><h3>Victorias</h3><div class="hof-list">${rows || '<div class="note">Aún no has ganado ninguna partida. ¡La primera victoria quedará aquí con tu equipo!</div>'}</div></div></div>`);
    this.on('[data-back]', 'click', () => this.mainMenu());
  }

  // ------------------------------------------------------------- ranking
  private rankQuery: BoardQuery = { map: null, rank: null, order: 'score' };

  /** TOP 15 + my position. Online when the service is configured; otherwise this device's best marks. */
  ranking() {
    setMusicContext('menu');
    const q = this.rankQuery;
    const sel = (id: string, opts: [string, string][], cur: string) => `<select id="${id}">${opts.map(([v, l]) => `<option value="${v}" ${cur === v ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>`;
    const online = onlineConfigured();
    this.show(`<div class="screen">${this.titlebar('Ranking', 'Menú')}
      <div class="panel rank-head"><div><b>${online ? 'TOP 15 GLOBAL' : 'RANKING ONLINE NO DISPONIBLE'}</b>
        <div class="note">${online ? 'Puntos = (segundos × 10 + √daño × 2) × rango (C ×1, B ×1,6, A ×2,4, S ×3,4, X ×4,8): el rango es lo que más cuenta. Cada jugador aparece con su mejor marca.' : 'El servicio online no está activado en esta versión, así que no hay ranking mundial. Debajo solo aparecen TUS marcas de este dispositivo, no las de otros jugadores.'}</div></div>
        <div class="filters">${sel('rmap', [['', 'Todas las arenas'], ...this.m.maps.map((mp) => [mp.id, mp.name] as [string, string])], q.map ?? '')}
          ${sel('rrank', [['', 'Todos los rangos'], ...RANK_ORDER.map((r) => [r, `Rango ${r}`] as [string, string])], q.rank ?? '')}
          ${sel('rorder', [['score', 'Ordenar: puntos'], ['rank', 'Ordenar: rango'], ['time', 'Ordenar: tiempo'], ['damage', 'Ordenar: daño']], q.order)}</div></div>
      <div class="rank-list" id="rlist"><div class="note">Cargando…</div></div><div id="rme"></div></div>`);
    this.on('[data-back]', 'click', () => this.mainMenu());
    const upd = () => {
      this.rankQuery = { map: (document.getElementById('rmap') as HTMLSelectElement).value || null, rank: (document.getElementById('rrank') as HTMLSelectElement).value || null, order: (document.getElementById('rorder') as HTMLSelectElement).value as BoardQuery['order'] };
      void this.fillRanking();
    };
    ['rmap', 'rrank', 'rorder'].forEach((id) => document.getElementById(id)!.addEventListener('change', upd));
    void this.fillRanking();
  }

  private async fillRanking() {
    const q = this.rankQuery;
    const list = document.getElementById('rlist'), me = document.getElementById('rme');
    if (!list || !me) return;
    const mapName = (id: string) => this.m.maps.find((x) => x.id === id)?.name ?? id;
    const row = (pos: number, name: string, captain: number, crest: string, map: string, rank: string, time: number, damage: number, mine = false, score?: number) => {
      const p = this.byId.get(captain), pts = score ?? scoreOf({ rank, time, damage });
      return `<div class="rank-row${pos <= 3 ? ` top${pos}` : ''}${mine ? ' mine' : ''}" style="--d:${Math.min(pos, 15) * 40}ms">
        <span class="rk-pos">${pos <= 3 ? ['🥇', '🥈', '🥉'][pos - 1] : `#${pos}`}</span>
        <span class="rk-av${p ? ` r-${p.rarity}` : ''}">${p ? this.mug(p.id, 48) : ''}</span>
        <span class="rk-name"><b>${esc(name)}</b><small>${esc(mapName(map))}</small></span>
        ${crest && this.emblemOf(crest) ? `<img class="rk-crest" src="${this.emblemOf(crest)}" alt="">` : '<span class="rk-crest"></span>'}
        <span class="rank-btn r-${rank} rk-r"><b>${rank}</b></span>
        <span class="rk-num rk-pts${q.order === 'score' || q.order === 'rank' ? ' on' : ''}"><b>${pts.toLocaleString('es')}</b><small>puntos</small></span>
        <span class="rk-num${q.order === 'time' ? ' on' : ''}"><b>${fmtTime(time)}</b><small>tiempo</small></span><span class="rk-num${q.order === 'damage' ? ' on' : ''}"><b>${damage.toLocaleString('es')}</b><small>daño</small></span></div>`;
    };
    if (!onlineConfigured()) {
      const rows = localBoard(this.save, q.map, q.rank, q.order);
      list.innerHTML = rows.slice(0, 15).map((m) => row(m.pos, this.save.profile.name, m.captainId, this.save.crest, m.map, m.rank, m.time, m.damage, true, m.score)).join('') || '<div class="note">Aún no hay marcas: termina una partida.</div>';
      me.innerHTML = '';
      return;
    }
    try {
      const rows = await leaderboard(q);
      list.innerHTML = rows.map((r) => row(Number(r.pos), r.username, r.captain_id, r.crest, r.map, r.rank, r.time_sec, Number(r.damage), false, r.score == null ? undefined : Number(r.score))).join('') || '<div class="note">Nadie ha jugado este tablero todavía.</div>';
      const mine = signedIn() ? await myPosition(q) : null;
      me.innerHTML = mine ? `<h3>Mi posición</h3>${row(Number(mine.pos), mine.username, mine.captain_id, mine.crest, mine.map, mine.rank, mine.time_sec, Number(mine.damage), true, mine.score == null ? undefined : Number(mine.score))}`
        : `<div class="note">${signedIn() ? 'Aún no tienes marca en este tablero.' : 'Conecta tu cuenta en Perfil para aparecer aquí.'}</div>`;
    } catch (err) {
      // Fix 1.32: a clear message and a retry instead of the server's raw text
      void err;
      list.innerHTML = `<div class="panel rank-down"><b>El ranking no está disponible ahora mismo</b><div class="note">El servidor está saturado o no hay conexión. Tu partida y tus marcas no se pierden.</div><button class="btn small" id="rretry">Reintentar</button></div>`;
      document.getElementById('rretry')?.addEventListener('click', () => { list.innerHTML = '<div class="note">Cargando…</div>'; void this.fillRanking(); });
    }
  }

  /** Main-menu TOP 5 of the global board (time survived, all arenas and ranks) and the player's own position. */
  /**
   * Fix 1.12: the big ranking of the main menu, from the real Supabase board: a podium for the top 3 (captain portrait,
   * crest, rank, time, damage), places 4-15 in a scrolling list and the player's own position pinned below.
   */
  private async fillMenuRank() {
    const box = document.getElementById('menurank');
    if (!box) return;
    try {
      const q: BoardQuery = { map: null, rank: null, order: 'score' }; // Fix 1.31: the menu shows the points ranking
      const [top, mine] = await Promise.all([leaderboard(q), signedIn() ? myPosition(q) : Promise.resolve(null)]);
      const el = document.getElementById('menurank');
      if (!el) return;
      const crest = (c: string) => (c && this.emblemOf(c) ? `<img class="wr-crest" src="${this.emblemOf(c)}" alt="">` : '<span class="wr-crest"></span>');
      const cap = (id: number) => this.byId.get(id);
      const pts = (r: BoardRow) => r.score == null ? scoreOf({ rank: r.rank, time: r.time_sec, damage: Number(r.damage) }) : Number(r.score);
      const podium = top.slice(0, 3).map((r) => {
        const p = cap(r.captain_id), pos = Number(r.pos);
        return `<div class="wr-pod p${pos}"><span class="wr-medal">${['🥇', '🥈', '🥉'][pos - 1]}</span>
          <span class="wr-mug${p ? ` r-${p.rarity}` : ''}">${p ? this.mug(p.id, pos === 1 ? 96 : 80) : ''}</span>
          <b class="wr-name">${esc(r.username)}</b><small class="wr-cap">${p ? esc(p.name) : ''}</small>
          <div class="wr-pts"><b>${pts(r).toLocaleString('es')}</b> <small>puntos</small></div>
          <div class="wr-stats">${crest(r.crest)}<span class="rank-btn r-${r.rank}"><b>${r.rank}</b></span><span><b>${fmtTime(r.time_sec)}</b><small>tiempo</small></span><span><b>${Number(r.damage).toLocaleString('es')}</b><small>daño</small></span></div></div>`;
      }).join('');
      const row = (r: BoardRow, me = false) => {
        const p = cap(r.captain_id);
        return `<div class="wr-row${me ? ' me' : ''}"><span class="wr-pos">#${r.pos}</span><span class="wr-mini">${p ? this.mug(p.id, 40) : ''}</span>
          <span class="wr-who"><b>${esc(r.username)}</b><small>${p ? esc(p.name) : ''}</small></span>${crest(r.crest)}
          <span class="rank-btn r-${r.rank}"><b>${r.rank}</b></span><span class="wr-num"><b>${pts(r).toLocaleString('es')} pts</b><small>${fmtTime(r.time_sec)} · ${Number(r.damage).toLocaleString('es')} daño</small></span></div>`;
      };
      el.innerHTML = top.length
        ? `<div class="wr-podium">${podium}</div><div class="wr-list">${top.slice(3, 15).map((r) => row(r)).join('')}</div>`
          + (mine ? `<div class="wr-mine"><small>Tu posición</small>${row(mine, true)}</div>` : signedIn() ? '<div class="note">Juega una partida para aparecer en el ranking.</div>' : '<div class="note">Entra con Google para aparecer en el ranking.</div>')
        : '<div class="note">Aún nadie en el ranking: ¡sé el primero!</div>';
    } catch { const el = document.getElementById('menurank'); if (el) el.innerHTML = '<div class="note">El ranking no está disponible ahora mismo. <button class="linkbtn" id="mrretry">Reintentar</button></div>'; document.getElementById('mrretry')?.addEventListener('click', () => void this.fillMenuRank()); }
  }

  /** Fix 1.12: the weekly pass in the main menu, the seven days at a glance (days 1, 4 and 7 stand out). */
  private passWidget() {
    const now = serverNow(), st = passStatus(this.save, now), left = msToNextDay(now);
    const days = PASS.map((r, i) => {
      const state = i < st.index ? 'reclamado' : i === st.index ? (st.available ? 'disponible' : 'siguiente') : 'bloqueado';
      const icon = r.kind === 'fichas' ? '◎' : r.kind === 'monedas' ? '◉' : '★';
      return `<div class="wp-day ${state}${[0, 3, 6].includes(i) ? ' big' : ''}"><small>DÍA ${i + 1}</small><b>${icon}</b><span>${esc(r.label)}</span><em>${state === 'reclamado' ? '✔' : state === 'disponible' ? '¡HOY!' : state === 'siguiente' ? 'Mañana' : '🔒'}</em></div>`;
    }).join('');
    return `<div class="wide-head"><h3>✦ Pase semanal</h3><small>${st.available ? '¡Tienes una recompensa lista!' : `Siguiente en ${Math.floor(left / 3600000)} h ${Math.floor(left / 60000) % 60} min`}</small></div>
      <div class="wp-row">${days}</div>
      <div class="wp-foot"><span>Día ${st.index + 1} de 7 · ${esc(PASS[st.index].label)}</span>${st.available ? '<button class="btn" id="wpclaim">Reclamar</button>' : '<button class="btn small" data-go="pass">Ver pase</button>'}</div>`;
  }

  /** Claims today's pass reward (team reward: the favourite team, or the one chosen on the pass screen). */
  private claimPassNow(after: () => void) {
    // Fix 1.23: a new day of the pass needs the server's clock (a different date on the device paid it again)
    if (!trustedClock()) { void syncServerTime(); sfx('error'); this.toast('Necesitas conexión para reclamar el pase (hora del servidor).'); after(); return; }
    const res = claimPass(this.save, this.m.roster, serverNow(), Math.random, bannerPool(this.m.roster, 'equipo', this.passTeam || this.save.favoriteTeam || ''));
    if (!res) { sfx('error'); after(); return; }
    this.persist();
    sfx('legend');
    if (res.player) void this.capsuleShow([{ player: res.player, isNew: this.save.owned[String(res.player.id)]?.copies === 1, stars: this.save.owned[String(res.player.id)]?.stars ?? 0, refund: 0 }], 'Pase semanal').then(after);
    else { this.toast(`¡${res.reward.label}!`); after(); }
  }

  /** Online account box (profile screen). Without a configured service it only says so: nothing pretends to be online. */
  private accountPanel() {
    if (!onlineConfigured()) {
      return `<div class="panel"><h3>Cuenta online</h3><div class="note">El servicio online no está activado en esta versión. Tu progreso se guarda en este navegador (Ajustes » Exportar/Importar para llevarlo a otro). Con el servicio activo podrás entrar con Google, reservar tu nombre en todo el mundo, aparecer en el ranking global y guardar en la nube.</div></div>`;
    }
    if (!signedIn()) {
      return `<div class="panel account"><h3>Cuenta online</h3><div class="note">Estás jugando como invitado: tu progreso se guarda solo en este navegador. Entra con Google para reservar tu nombre en todo el mundo, aparecer en el ranking y guardar en la nube. Tu correo es privado: nunca aparece en el ranking.</div>
        <p><button class="btn google-btn" id="acgoogle"><span class="g-logo">G</span> Continuar con Google</button></p>
        <p class="note"><a href="privacidad.html" target="_blank" rel="noopener">Privacidad y condiciones</a></p></div>`;
    }
    const cs = this.cloudState;
    return `<div class="panel account"><h3>Cuenta online</h3><div class="note">Conectado con Google${signedEmail() ? ` como ${esc(signedEmail())}` : ''} (solo tú lo ves).</div>
      ${this.save.onlineName ? `<p>Nombre global: <b>${esc(this.save.onlineName)}</b> (permanente)</p>` : `<p class="note">Reserva tu nombre global. Si «${esc(this.save.profile.name)}» ya está ocupado, elige otro: tu progreso no se toca.</p>
        <div class="filters"><input id="acname" maxlength="${USERNAME_MAX}" value="${esc(this.save.profile.name)}"><span id="acnamecheck" class="pcheck"></span><button class="btn small" id="acreserve">Reservar nombre</button></div>`}
      <p class="note">Nube: ${cs.status === 'ok' ? `sincronizado (versión ${this.save.cloudVersion ?? 0}${cs.at ? `, ${new Date(cs.at).toLocaleTimeString('es')}` : ''})` : cs.status === 'pendiente' ? 'cambios pendientes de subir…' : cs.status === 'conflicto' ? '<b>conflicto</b>: otro dispositivo guardó una versión más nueva' : cs.status === 'error' ? `error (${esc(cs.msg)})` : 'sin vincular todavía'}</p>
      <p><button class="btn small" id="aclink">Revisar guardado en la nube</button> <button class="btn small blue" id="acout">Cerrar sesión</button> <button class="btn small" id="acdel">Eliminar cuenta y datos</button></p>
      <p class="note"><a href="privacidad.html" target="_blank" rel="noopener">Privacidad y condiciones</a></p></div>`;
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
        .then(async (n) => { this.save.onlineName = n; this.claimName(); storeSave(this.save); await this.linkCloud(); this.toast('Nombre reservado. Tu progreso ya está en la nube.', 3500); refresh(); })
        .catch((e: Error) => this.toast(/taken/.test(e.message) ? 'Ese nombre ya está ocupado: prueba otro' : e.message, 3500));
    });
    document.getElementById('aclink')?.addEventListener('click', () => { void this.linkCloud(true).then(refresh); });
    document.getElementById('acout')?.addEventListener('click', () => {
      void this.pushCloud(true).finally(() => { signOut(); this.cloudLinked = false; this.cloudState = { status: 'nada', at: 0, msg: '' }; this.toast('Sesión cerrada. Sigues jugando como invitado en este navegador.', 3500); refresh(); });
    });
    const del = document.getElementById('acdel');
    del?.addEventListener('click', () => this.armed(del, () => {
      deleteAccount().then(() => { this.save.onlineName = undefined; this.save.cloudVersion = undefined; this.cloudLinked = false; this.persist(); this.toast('Cuenta y datos online eliminados. Tu guardado local sigue aquí.', 4500); refresh(); }).catch(fail);
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
    const word = online ? this.save.onlineName! : 'REINICIAR';
    const r = resetSummary(this.save);
    const box = document.createElement('div');
    box.className = 'tut-modal reset-modal';
    box.innerHTML = `<div class="panel" style="max-width:640px"><h2>Reiniciar progreso</h2>
      <p>Vuelves a empezar como un jugador nuevo: intro, equipo favorito, tus 5 primeros fichajes y tutorial.</p>
      <h4>Se borra</h4><ul class="reset-list">
        <li>Colección: ${r.players} futbolistas, ${r.duplicates} duplicados, ${r.ascended} ascendidos (Mítico/Héroe)</li>
        <li>${r.coins} monedas y ${r.tokens} fichas</li>
        <li>Mejoras permanentes (${r.upgrades} niveles), ${r.gear} objetos de equipo, técnicas compradas y maestría</li>
        <li>Equipaciones y escudos desbloqueados (${r.kits} equipaciones) y recompensas de equipo</li>
        <li>Misiones (${r.missionsClaimed} cobradas) y tienda del día</li>
        <li>Estadísticas (${r.runs} partidas, ${r.wins} victorias), ${r.bests} récords, salón de la fama (${r.hall}) y arenas superadas</li>
        <li>Equipo favorito, Mi Equipo, capitán y onboarding</li>
        ${online ? '<li>Tus marcas del ranking mundial (las de los demás no se tocan)</li>' : ''}
      </ul>
      <h4>Se conserva</h4><ul class="reset-list keep">
        ${online ? `<li>Tu cuenta de Google y tu nombre global <b>${esc(word)}</b> (sigue siendo tuyo)</li>` : '<li>Nada de cuenta online (juegas como invitado): el nombre lo eliges otra vez, con el actual como sugerencia</li>'}
        <li>Ajustes de sonido, gráficos y controles</li>
      </ul>
      <p class="note">Antes de borrar se guarda una copia${online ? ' en el servidor y otra' : ''} en este navegador, por si hubiera que recuperarla. ${online ? 'Los demás dispositivos con tu cuenta también empezarán de cero al conectarse: su copia antigua no puede sobrescribir la nueva.' : ''}</p>
      <div class="filters"><input id="rs-word" autocomplete="off" spellcheck="false" placeholder="Escribe ${esc(word)} para confirmar"></div>
      <div class="tut-nav"><button class="btn small blue" id="rs-no">Cancelar</button><span class="spacer"></span><button class="btn" id="rs-ok" disabled>Reiniciar mi progreso</button></div></div>`;
    document.body.appendChild(box);
    const input = box.querySelector('#rs-word') as HTMLInputElement, ok = box.querySelector('#rs-ok') as HTMLButtonElement;
    input.addEventListener('input', () => { ok.disabled = input.value.trim() !== word; });
    box.querySelector('#rs-no')!.addEventListener('click', () => box.remove());
    ok.addEventListener('click', () => {
      ok.disabled = true;
      this.resetProgress(online).then(() => box.remove()).catch((e: Error) => { ok.disabled = false; this.toast(`No se pudo reiniciar: ${e.message}`, 5000); });
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
    this.toast('Progreso reiniciado. ¡Bienvenido de nuevo, entrenador!', 4000);
    void this.intro().then(() => this.afterIntro());
  }

  /** Swaps the whole save in place (other parts of the game hold this object) and stores it. */
  private replaceSave(next: SaveData) {
    for (const k of Object.keys(this.save)) delete (this.save as unknown as Record<string, unknown>)[k];
    Object.assign(this.save, next);
    this.captainId = this.save.captainId;
    setPreviewKit(this.m.kits?.[this.save.kit] ?? null);
    this.applyAudio();
    storeSave(this.save);
  }

  /** Another device reset the progress: this one drops its stale copy (kept as backup) and starts again too. */
  private reloadAfterReset(cloud: CloudSave) {
    this.adoptCloud(cloud, true, 'Tu progreso se reinició desde otro dispositivo: empiezas de nuevo (la copia anterior queda como respaldo).');
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
    remapIds(this.save, this.m.idAliases);
    remapTechSlots(this.save, this.m.techRemaps);
    migrateHeroes131(this.save, this.m.roster);
    this.trimAllTraining(this.save, this.m.roster);
    this.captainId = this.save.captainId;
    this.cloudLinked = true;
    this.cloudState = { status: 'ok', at: Date.now(), msg: '' };
    this.claimName();
    storeSave(this.save);
    this.toast(note || (hadLocal ? 'Progreso de la nube cargado (tu copia local anterior se guardó como respaldo).' : 'Progreso recuperado de la nube.'), 4500);
  }

  private chooseSave(local: SaveSummary, cloud: SaveSummary, at: string): Promise<'local' | 'nube' | 'cancelar'> {
    return new Promise((resolve) => {
      const row = (t: string, s: SaveSummary, best: boolean) => `<div class="save-pick${best ? ' best' : ''}"><b>${t}</b><span>${esc(s.name)}</span>
        <small>${s.players} futbolistas · ${s.heroes} héroes · ${s.wins} victorias · ${s.runs} partidas · ${s.coins} monedas · ${s.tokens} fichas</small></div>`;
      const box = document.createElement('div');
      box.className = 'tut-modal';
      box.innerHTML = `<div class="panel" style="max-width:620px"><h2>¿Qué progreso quieres usar?</h2>
        <p class="note">Hay un guardado en la nube (${new Date(at).toLocaleString('es')}) distinto del de este navegador. El que no elijas se guarda como respaldo aquí; nada se pierde.</p>
        ${row('Este navegador', local, progressOf(local) >= progressOf(cloud))}${row('Nube', cloud, progressOf(cloud) > progressOf(local))}
        <div class="tut-nav"><button class="btn small blue" data-c="cancelar">Ahora no</button><span class="spacer"></span><button class="btn" data-c="local">Usar este navegador</button><button class="btn" data-c="nube">Usar la nube</button></div></div>`;
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
        else if (/version_conflict/.test(m)) { this.cloudState = { status: 'conflicto', at: Date.now(), msg: m }; this.cloudLinked = false; this.toast('Otro dispositivo guardó un progreso más nuevo. Revisa Perfil » Vincular.', 5000); }
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
    const items = allNews(onlineConfigured());
    // first visit to the board: the old updates count as read, only the news of this version shows as new
    if (!this.save.newsRead) this.save.newsRead = items.filter((n) => n.version && n.version !== PUBLIC_VERSION).map((n) => n.id);
    this.save.devlogSeen = NEWS_KEY;
    const cur = items.find((n) => n.id === (sel ?? this.newsSel)) ?? items[0];
    this.newsSel = cur?.id ?? '';
    if (cur && !this.save.newsRead.includes(cur.id)) this.save.newsRead = [...this.save.newsRead, cur.id].slice(-200);
    this.persist();
    const listTop = this.root.querySelector('.nb-list')?.scrollTop ?? 0;
    const list = items.map((n) => `<button class="nb-item k-${n.kind}${n.id === cur?.id ? ' on' : ''}" data-news="${esc(n.id)}">
        <span class="nb-ic">${esc(n.icon ?? '📰')}</span><span class="nb-txt"><span class="nb-meta"><em class="nb-tag">${NEWS_KIND_LABEL[n.kind]}</em>${n.pinned ? '<i class="nb-pin">📌</i>' : ''}<small>${esc(newsRelDate(n.date))}</small>${this.save.newsRead!.includes(n.id) ? '' : '<i class="nb-dot" title="Sin leer"></i>'}</span>
        <b>${esc(n.title)}</b><small class="nb-sum">${esc(n.summary)}</small></span></button>`).join('');
    this.show(`<div class="screen news-board">${this.titlebar('Noticias', 'Menú')}
      <div class="nb"><aside class="nb-list">${list}</aside><article class="nb-detail" id="nbdetail">${cur ? this.newsDetail(cur) : ''}</article></div></div>`);
    const listEl = this.root.querySelector('.nb-list');
    if (listEl) listEl.scrollTop = listTop; // choosing an item keeps the list where it was
    this.on('[data-back]', 'click', () => this.mainMenu());
    this.on('[data-news]', 'click', (_e, el) => { this.devlog(el.dataset.news); document.getElementById('nbdetail')?.scrollTo(0, 0); if (window.innerWidth < 760) document.getElementById('nbdetail')?.scrollIntoView({ behavior: 'smooth' }); });
    document.getElementById('newsplay')?.addEventListener('click', () => { this.mainMenu(); (this.root.querySelector('[data-go="play"]') as HTMLElement | null)?.click(); });
    document.getElementById('newsbug')?.addEventListener('click', () => this.bugReportModal());
  }

  private newsDetail(n: NewsItem) {
    const body = n.blocks.map((b) => {
      if ('h' in b) return `<h3 class="nb-h">${b.icon ? `<span>${esc(b.icon)}</span>` : ''}${newsText(b.h)}</h3>`;
      if ('p' in b) return `<p>${newsText(b.p)}</p>`;
      if ('list' in b) return `<ul class="nb-ul">${b.list.map((x) => `<li>${newsText(x)}</li>`).join('')}</ul>`;
      if ('callout' in b) return `<div class="nb-box ${b.callout}"><em>${b.callout === 'aviso' ? 'AVISO' : b.callout === 'nuevo' ? 'NUEVO' : 'INFO'}</em><p>${newsText(b.text)}</p></div>`;
      return '<hr class="nb-hr">';
    }).join('');
    const long = new Date(`${n.date}T12:00:00`).toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' });
    return `<header class="nb-hero k-${n.kind}"><span class="nb-ic big">${esc(n.icon ?? '📰')}</span><div>
        <div class="nb-meta"><em class="nb-tag">${NEWS_KIND_LABEL[n.kind]}</em>${n.pinned ? '<i class="nb-pin">📌 Fijada</i>' : ''}<small>${esc(long)}</small>${n.version ? `<small>· v${esc(n.version)}</small>` : ''}</div>
        <h2>${esc(n.title)}</h2><p>${esc(n.summary)}</p></div></header>
      <div class="nb-body">${body}</div>
      <footer class="nb-foot"><button class="btn" id="newsplay">▶ Jugar</button><button class="btn blue" id="newsbug">Reportar un bug</button>${this.tiktokLink('Vídeos del desarrollo')}</footer>`;
  }

  private tiktokLink(label = '') {
    return `<a class="tiktok${label ? ' wide' : ''}" href="${TIKTOK_URL}" target="_blank" rel="noopener noreferrer" title="Síguenos en TikTok" aria-label="Síguenos en TikTok"><svg viewBox="0 0 24 24" aria-hidden="true"><path class="tk-a" d="${TIKTOK_PATH}"/><path class="tk-b" d="${TIKTOK_PATH}"/><path d="${TIKTOK_PATH}"/></svg>${label ? `<span>${esc(label)}</span>` : ''}</a>`;
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
      box.innerHTML = `<div class="panel bug-card"><h2>Reportar un bug</h2>
        <p class="note">${onlineConfigured() ? 'Para enviar un reporte necesitas entrar con Google: así evitamos el spam y puedes seguir el estado de tus reportes.' : 'El envío de reportes no está disponible en esta versión.'}${inRun && onlineConfigured() ? ' Termina la partida y entra desde Perfil.' : ''}</p>
        <div class="tut-nav"><button class="btn small blue" id="bgclose">Cerrar</button><span class="spacer"></span>${onlineConfigured() && !inRun ? '<button class="btn google-btn" id="bggoogle"><span class="g-logo">G</span> Continuar con Google</button>' : ''}</div></div>`;
      box.querySelector('#bgclose')!.addEventListener('click', close);
      box.querySelector('#bggoogle')?.addEventListener('click', () => { void signInWithGoogle(); });
      return;
    }
    const clientId = crypto.randomUUID(); // one form, one report, however many times the button is pressed
    let shot: Blob | null = null, uploadedPath: string | null = null, shotUrlLocal = '';
    box.innerHTML = `<div class="panel bug-card"><h2>Reportar un bug</h2>
      <div class="bug-grid">
        <label>Categoría<select id="bgcat"><option value="">Elige…</option>${CATEGORIES.map(([k, t]) => `<option value="${k}">${t}</option>`).join('')}</select></label>
        <label>Gravedad<select id="bgsev"><option value="">Elige…</option>${SEVERITIES.map(([k, t]) => `<option value="${k}">${t}</option>`).join('')}</select></label>
      </div>
      <label>Título<input id="bgtitle" maxlength="120" autocomplete="off" placeholder="Resume el problema en una frase"></label>
      <label>¿Qué ha ocurrido?<textarea id="bgdesc" maxlength="4000" rows="4" placeholder="Qué esperabas y qué ha pasado"></textarea></label>
      <label>Pasos para reproducirlo (opcional)<textarea id="bgsteps" maxlength="4000" rows="2" placeholder="1. … 2. …"></textarea></label>
      <div class="bug-shot"><button class="btn small blue" id="bgfile">Adjuntar captura</button>${inRun ? '<button class="btn small blue" id="bgsnap">Usar la pantalla de la partida</button>' : ''}
        <input id="bgfileinput" type="file" accept="${SHOT_TYPES.join(',')}" hidden><span id="bgshotinfo" class="note">PNG, JPG o WebP. Se reduce a 2 MB como máximo.</span></div>
      <details class="bug-tech"><summary>Qué información técnica se envía</summary><ul>${TECH_FIELDS.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
        <p class="note">Nunca se envían tu correo, tu sesión ni tu partida guardada. Solo tú y el administrador podéis ver el reporte y su captura. <a href="privacidad.html" target="_blank" rel="noopener">Privacidad</a></p></details>
      <div id="bgerr" class="bug-err" role="alert"></div>
      <div class="tut-nav"><button class="btn small blue" id="bgclose">Cerrar</button><button class="btn small blue" id="bgmine">Mis reportes</button><span class="spacer"></span><button class="btn" id="bgsend">Enviar reporte</button></div></div>`;
    const $ = <T extends HTMLElement>(id: string) => box.querySelector(`#${id}`) as T;
    const err = (t: string) => { $('bgerr').textContent = t; };
    const setShot = async (src: Blob | HTMLImageElement) => {
      try {
        shot = await shrinkShot(src);
        uploadedPath = null;
        if (shotUrlLocal) URL.revokeObjectURL(shotUrlLocal);
        shotUrlLocal = URL.createObjectURL(shot);
        $('bgshotinfo').innerHTML = `<img class="bug-thumb" src="${shotUrlLocal}" alt="Captura adjunta"> ${Math.ceil(shot.size / 1024)} KB`;
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
        box.innerHTML = `<div class="panel bug-card bug-ok"><div class="bug-tick">✔</div><h2>¡Reporte enviado!</h2><p>Gracias por ayudar a mejorar InaZurvivors.</p>
          <p class="bug-code" id="bgcode">${esc(code)}</p><p class="note">Guarda este código. Puedes seguir su estado en «Mis reportes».</p>
          <div class="tut-nav"><button class="btn small blue" id="bgmine">Mis reportes</button><span class="spacer"></span><button class="btn" id="bgclose">Cerrar</button></div></div>`;
        $('bgclose').addEventListener('click', close);
        $('bgmine').addEventListener('click', () => { close(); this.myBugsModal(); });
      } catch (e) {
        const m = (e as Error).message;
        err(/too_fast/.test(m) ? 'Acabas de enviar un reporte: espera un minuto antes del siguiente.' : /daily_limit/.test(m) ? 'Has llegado al límite de 10 reportes al día. ¡Gracias! Vuelve mañana.'
          : /invalid_screenshot/.test(m) ? 'La captura no se ha podido validar. Vuelve a adjuntarla.' : /Failed to fetch|NetworkError/i.test(m) ? 'Sin conexión con el servidor. Tu texto sigue aquí: prueba otra vez.' : `No se pudo enviar: ${m}`);
        btn.disabled = false; btn.textContent = 'Enviar reporte';
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
      list.innerHTML = rows.map((r) => `<div class="bug-row"><code>${esc(r.code)}</code><b>${esc(r.title)}</b><span class="bug-st st-${esc(r.status)}">${esc(STATUS_LABEL[r.status] ?? r.status)}</span><small>${new Date(r.created_at).toLocaleDateString('es')}</small></div>`).join('') || 'Todavía no has enviado ningún reporte.';
      const del = box.querySelector('#mbdel') as HTMLButtonElement;
      if (rows.length) del.hidden = false;
      del.addEventListener('click', () => this.armed(del, async () => {
        const paths = await deleteMyBugReports();
        await Promise.all(paths.filter((x): x is string => !!x).map((x) => deleteShot(x)));
        box.remove();
        this.toast('Tus reportes y sus capturas se han borrado.', 3500);
      }));
    } catch (e) { list.textContent = `No se pudieron cargar: ${(e as Error).message}`; }
  }

  /** Bug panel. The button only appears for admins, but what protects the data is the server, which refuses everyone else. */
  private async adminBugs(filter: BugFilter = { category: null, severity: null, status: null, from: null, to: null, order: 'fecha' }) {
    setMusicContext('menu');
    const opt = (list: readonly (readonly [string, string])[], cur: string | null, all: string) => `<option value="">${all}</option>${list.map(([k, t]) => `<option value="${k}"${k === cur ? ' selected' : ''}>${t.split(' · ')[0]}</option>`).join('')}`;
    this.show(`<div class="screen">${this.titlebar('Panel de bugs', 'Ajustes')}<div class="panel"><div class="filters">
      <select id="adcat">${opt(CATEGORIES, filter.category, 'Todas las categorías')}</select><select id="adsev">${opt(SEVERITIES, filter.severity, 'Toda gravedad')}</select>
      <select id="adst">${opt(Object.entries(STATUS_LABEL), filter.status, 'Todos los estados')}</select>
      <label class="note">Desde <input id="adfrom" type="date" value="${(filter.from ?? '').slice(0, 10)}"></label><label class="note">Hasta <input id="adto" type="date" value="${(filter.to ?? '').slice(0, 10)}"></label>
      <select id="adord"><option value="fecha"${filter.order === 'fecha' ? ' selected' : ''}>Más recientes</option><option value="prioridad"${filter.order === 'prioridad' ? ' selected' : ''}>Prioridad</option></select></div>
      <div id="adlist" class="note">Cargando…</div></div></div>`);
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
      list.innerHTML = rows.length ? rows.map((r, i) => `<button class="bug-row admin" data-i="${i}"><code>${esc(r.code)}</code><b>${esc(r.title)}</b><span class="bug-sev sv-${esc(r.severity)}">${esc(r.severity)}</span><span class="bug-st st-${esc(r.status)}">${esc(STATUS_LABEL[r.status] ?? r.status)}</span><small>${esc(r.category)} · v${esc(r.game_version ?? '')} · ${new Date(r.created_at).toLocaleString('es')}${r.screenshot_path ? ' · 📷' : ''}</small></button>`).join('') : 'No hay reportes con estos filtros.';
      this.on('.bug-row.admin', 'click', (_e, el) => this.adminBugDetail(rows[Number(el.dataset.i)], filter));
    } catch (e) { list.textContent = /forbidden/.test((e as Error).message) ? 'No tienes permiso para ver este panel.' : `No se pudo cargar: ${(e as Error).message}`; }
  }

  private adminBugDetail(r: BugRow, filter: BugFilter) {
    const box = document.createElement('div');
    box.className = 'tut-modal bug-modal';
    const f = (k: string, v: unknown) => v || v === 0 ? `<div><small>${k}</small>${esc(String(v))}</div>` : '';
    box.innerHTML = `<div class="panel bug-card wide"><h2>${esc(r.code)}</h2><h3>${esc(r.title)}</h3>
      <div class="bug-facts">${f('Categoría', r.category)}${f('Gravedad', r.severity)}${f('Versión', r.game_version)}${f('Compilación', r.build)}${f('Jugador', r.username)}${f('Navegador', r.browser)}${f('Sistema', r.os)}${f('Pantalla', r.screen)}${f('Arena', r.map)}${f('Dificultad', r.difficulty)}${f('Tiempo (s)', r.run_time_sec)}${f('Fecha', new Date(r.created_at).toLocaleString('es'))}</div>
      <h4>Qué ha ocurrido</h4><p class="bug-text">${esc(r.description ?? '')}</p>${r.steps ? `<h4>Pasos</h4><p class="bug-text">${esc(r.steps)}</p>` : ''}
      <div id="adshot" class="note">${r.screenshot_path ? 'Cargando captura…' : 'Sin captura.'}</div>
      <h4>Estado</h4><div class="seg" id="adstatus">${Object.entries(STATUS_LABEL).map(([k, t]) => `<button data-v="${k}" class="${k === r.status ? 'on' : ''}">${t}</button>`).join('')}</div>
      <h4>Notas privadas</h4><textarea id="adnotes" rows="3" maxlength="4000">${esc(r.admin_notes ?? '')}</textarea>
      <div class="tut-nav"><button class="btn small blue" id="adclose">Cerrar</button><span class="spacer"></span><button class="btn" id="adsave">Guardar</button></div></div>`;
    document.body.appendChild(box);
    let status = r.status, url = '';
    if (r.screenshot_path) shotUrl(r.screenshot_path).then((u) => { url = u; box.querySelector('#adshot')!.innerHTML = `<a href="${u}" target="_blank" rel="noopener"><img class="bug-full" src="${u}" alt="Captura del reporte"></a>`; }).catch((e: Error) => { box.querySelector('#adshot')!.textContent = e.message; });
    const shut = () => { if (url) URL.revokeObjectURL(url); box.remove(); };
    box.querySelectorAll<HTMLElement>('#adstatus button').forEach((b) => b.addEventListener('click', () => { status = b.dataset.v!; box.querySelectorAll('#adstatus button').forEach((x) => x.classList.toggle('on', x === b)); }));
    box.querySelector('#adclose')!.addEventListener('click', shut);
    box.querySelector('#adsave')!.addEventListener('click', () => {
      adminUpdateBug(r.code, status, (box.querySelector('#adnotes') as HTMLTextAreaElement).value)
        .then(() => { shut(); this.toast('Reporte actualizado'); void this.adminBugs(filter); }).catch((e: Error) => this.toast(e.message, 4000));
    });
  }

  // ------------------------------------------------------------- tutorial
  /** Short visual tour; can be skipped at any step, and replayed from the options. */
  tutorial(step = 0) {
    const cap = squadOf(this.save, this.byId)[0] ?? this.unlockedRoster()[0];
    const mugs = squadOf(this.save, this.byId).slice(0, 5).map((p) => this.mug(p.id, 40)).join('');
    const slides: { title: string; text: string; art: string }[] = [
      { title: 'Sobrevive y gana', text: 'Aguanta las oleadas de rivales hasta que llegue el jefe y derrótalo. Solo tu capitán recibe daño: si su vida llega a cero, pierdes (pero te quedas las monedas).',
        art: cap ? `<div class="tut-hero">${this.mug(cap.id, 96)}${charCanvas(cap.id, 3, 12)}</div>` : '' },
      { title: 'Muévete', text: 'WASD o flechas (o el joystick táctil / mando). Las técnicas se lanzan solas: tú solo te colocas. ¡Pruébalo aquí!',
        art: '<div class="tut-pitch" id="tutpitch"><span class="tut-ball" id="tutball">⚽</span></div><div class="keys"><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd></div>' },
      { title: 'Vida compartida', text: 'Todo el equipo comparte una barra. Si un rival toca a cualquiera, capitán o compañero, baja para todos.',
        art: `<div class="tut-hp"><i></i></div><div class="tut-row">${mugs}</div>` },
      { title: 'Ficha en la partida', text: `Empiezas solo con el capitán. Al subir de nivel aparecen cartas para fichar a tus candidatos de Mi Equipo (máximo ${MAX_TEAM} en el campo).`,
        art: '<div class="tut-row"><span class="tut-card">¡NUEVO FICHAJE!</span><span class="tut-card">MEJORA · TIRO</span><span class="tut-card">OBJETO</span></div>' },
      { title: 'Supertécnicas', text: 'Tiro, regate, defensa y parada atacan solos; los talentos son pasivos. Mejóralas hasta nivel 10 y evolucionan.',
        art: `<div class="tut-row">${(['tiro', 'regate', 'defensa', 'parada', 'talento'] as const).map((t) => `<span class="tut-type">${this.icon(ICON.manual[t], 3)}<small>${TYPE_LABEL[t]}</small></span>`).join('')}</div>` },
      { title: 'Formaciones', text: 'Teclas 1, 2 y 3. Ofensiva: más daño y más riesgo. Equilibrada: neutra. Defensiva: menos daño recibido. Toca una:',
        art: `<div class="tut-row" id="tutform">${FORMATION_ORDER.map((f) => `<button class="tut-f" data-f="${f}">${FORMATION_ICON(f, 56)}<small>[${FORMATIONS[f].key}] ${FORMATIONS[f].label}</small></button>`).join('')}</div><div class="note" id="tutfdesc"></div>` },
      { title: 'Objetos y experiencia', text: 'Chispa verde, balón azul y rayo dorado dan experiencia (de menos a más). La comida cura y los objetos especiales te ayudan un rato.',
        art: `<div class="tut-row"><span class="orb o0"></span><span class="orb o1"></span><span class="orb o2"></span>${this.icon(206, 3)}${this.icon(303, 3)}</div>` },
      { title: 'Fichajes y fichas', text: `Las Fichas de Fichaje se ganan jugando y con misiones. En la máquina, ×1 cuesta ${PULL_COST}. Un futbolista nuevo es tuyo para siempre; un duplicado le da estrellas.`,
        art: this.cap('coin_oro') ? `<img class="tut-img" src="${this.cap('coin_oro')}" alt="">` : '' },
      { title: 'Mejoras permanentes', text: 'Las monedas compran mejoras que duran para siempre: vida, daño, imán, ranuras de técnica y más.',
        art: '<div class="tut-row"><span class="tut-card">▲ MEJORAS</span><span class="tut-card">★ TÉCNICAS</span></div>' },
      { title: 'Prepara tu equipo', text: 'En Mi Equipo eliges 7 candidatos y el capitán. Luego, JUGAR, elige rango (C es el más fácil) y ¡al campo!',
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
      <div class="tut-nav"><button class="btn small blue" id="tutskip">Saltar tutorial</button><span class="spacer"></span>
        ${step ? '<button class="btn small blue" id="tutprev">◀ Atrás</button>' : ''}<button class="btn" id="tutnext">${last ? '¡A jugar!' : 'Siguiente ▶'}</button></div></div>`;
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
      const k = e.key.toLowerCase();
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
      return `<div class="syn-card${x.reach ? ' on' : ''}" style="--ec:${ec}"><span class="syn-ic">${elementIcon(x.element, 26)}</span><div><b>Resonancia ${esc(x.element)}</b>
        <span class="syn-pips">${pips}</span><small>${x.techs} técnica${x.techs === 1 ? '' : 's'} de ${esc(x.element)} en el equipo · ${x.players} futbolista${x.players === 1 ? '' : 's'}</small></div>
        <em>${x.reach ? `hasta +${Math.round(x.reach * 100)}%` : `${x.techs}/3`}</em></div>`;
    }).join('');
    const ch = pot.chemistry, cap = pot.captain;
    // Fix 1.32: combined techniques of the squad, two (or three) footballers linked by a chain; the missing ones greyed out
    const byName = new Map(this.m.roster.map((x) => [x.name, x]));
    const combos = squadCombos(squad).map((c) => {
      const who = c.combo.needs.map((n) => { const x = squad.find((q) => q.name === n.player) ?? byName.get(n.player); const here = squad.some((q) => q.name === n.player);
        return `<span class="cb-who${here ? '' : ' miss'}" title="${esc(n.player)}${here ? '' : ' (no está en el equipo)'}">${x ? this.mug(x.id, 40) : ''}<small>${esc(n.player.split(' ')[0])}</small></span>`; }).join('<i class="cb-link">🔗</i>');
      return `<div class="cb-card${c.ready ? ' ready' : ''}" style="--ec:${ELEMENT_COLOR[c.combo.element] ?? '#ffe27a'}"><div class="cb-team">${who}</div>
        <div class="cb-info"><b>${esc(c.combo.name)}</b><small>${c.ready ? `¡Lista! Se aprende en la partida cuando sus técnicas llegan al nivel ${Math.max(...c.combo.needs.map((n) => n.level))}` : `Falta: ${esc(c.missing.join(', '))}`}</small></div></div>`;
    }).join('');
    return `<div class="panel syn-panel"><h3>Sinergias del equipo</h3>
      <div class="note">Resonancia: 3 técnicas activas del mismo elemento dan <b>+8%</b> de daño a esas técnicas, 5 dan <b>+15%</b>. Las técnicas activas se eligen al subir de nivel en la partida.</div>
      ${combos ? `<h3 class="cb-title">🔗 Técnicas combinadas</h3><div class="cb-grid">${combos}</div><h3 class="cb-title">Elementos y química</h3>` : ''}
      <div class="syn-grid">${el}
        <div class="syn-card${ch.bonus ? ' on' : ''}" style="--ec:#7dff9a"><span class="syn-ic">♜</span><div><b>Química de club</b><span class="syn-pips">${Array.from({ length: ch.goal }, (_, i) => `<i class="${i < ch.count ? 'on' : ''}"></i>`).join('')}</span><small>${esc(ch.hint)} (equipación ${esc(teamLabel(kit))})</small></div><em>${ch.bonus ? `+${Math.round(ch.bonus * 100)}%` : `${ch.count}/${ch.goal}`}</em></div>
        ${cap ? `<div class="syn-card${cap.bonus ? ' on' : ''}" style="--ec:${ELEMENT_COLOR[String(cap.element)] ?? '#ffe27a'}"><span class="syn-ic">★</span><div><b>${esc(cap.label)}</b><small>${esc(cap.hint)}</small></div><em>${cap.bonus ? `+${(cap.bonus * 100).toFixed(1).replace('.', ',')}%` : '—'}</em></div>`
          : '<div class="syn-card"><span class="syn-ic">★</span><div><b>Sinergia elemental</b><small>Compra la mejora «Sinergia elemental»: más daño por cada compañero del elemento del capitán.</small></div><em>—</em></div>'}
      </div></div>`;
  }

  /** "Mi Equipo": seven candidates (captain first), the captain's starting technique and the starting formation. */
  captainSelect(slot = this.squadSlot) {
    if (!this.save.squad.length && this.unlockedRoster().length) { fillSquad(this.save, this.m.roster); this.persist(); }
    const squad = squadOf(this.save, this.byId);
    this.captainId = squad[0]?.id ?? null;
    this.squadSlot = Math.max(0, Math.min(slot, squad.length < SQUAD_SIZE ? squad.length : SQUAD_SIZE - 1));
    const cap = squad[0];
    const cur = (this.save.formation as FormationId) in FORMATIONS ? this.save.formation as FormationId : 'equilibrada';
    setMusicContext('map');
    const comboOf = new Map<string, string>();
    for (const c of squadCombos(squad)) if (c.ready) for (const n of c.combo.needs) if (!comboOf.has(n.player)) comboOf.set(n.player, c.combo.name);
    const slots = Array.from({ length: SQUAD_SIZE }, (_, i) => {
      const p = squad[i];
      const editing = i === this.squadSlot ? ' editing' : '';
      if (!p) return `<button class="sq-slot empty${editing}" data-slot="${i}"><span class="sq-plus">+</span><small>${i === 0 ? 'Capitán' : 'Plaza libre'}</small><em>Arrastra aquí</em></button>`;
      // Fix 1.32 (author's choice): the slot keeps its radar and techniques, in a frame of its rarity, and can be dragged
      const er = effectiveRarity(this.save, p), st = p.stats ? this.statsOf(p)! : null;
      return `<div class="sq-slot ccs t-${isHero(this.save, p.id) ? 'heroe' : er} rs-${isHero(this.save, p.id) ? 'heroe' : er}${editing}${i === 0 ? ' cap' : ''}${isHero(this.save, p.id) ? ' hero' : ''}${this.squadLanded === i ? ' landed' : ''}" data-slot="${i}" data-drag="${p.id}" style="--rc:${RARITY_COLOR[er]};--ec:${ELEMENT_COLOR[String(p.element)] ?? '#8a9bbd'}">
        ${i === 0 ? '<span class="captain-badge">C</span>' : `<button class="sq-act" data-captain="${p.id}" title="Hacer capitán">★</button>`}
        <button class="sq-act x" data-remove="${p.id}" title="Quitar">✕</button>
        <div class="sq-mug">${this.mug(p.id, 64)}</div><b>${esc(p.name)}</b>
        <div class="chips"><span class="pos">${POS_LABEL[p.position] ?? p.position}</span>${this.elem(p)}</div>${this.rar(p)}
        ${comboOf.get(p.name) ? `<span class="sq-combo" title="Técnica combinada: ${esc(comboOf.get(p.name)!)}">🔗 ${esc(comboOf.get(p.name)!)}</span>` : ''}
        ${st ? `<div class="sq-radar"><span class="ovr">${statMean(st)}</span>${statRadar(st, STAT_SHORT, RARITY_COLOR[er])}</div>` : ''}
        <div class="sq-techs">${p.techniques.slice(0, 4).map((t) => `<span title="${esc(t.name)}">${this.icon(ICON.manual[t.type], 1)}${esc(t.name)}</span>`).join('')}</div>
        <i class="cc-sweep"></i><i class="cc-foil"></i><i class="cc-sparks"></i><i class="cc-bevel"></i><i class="cc-crown"></i></div>`;
    }).join('');
    this.show(`<div class="screen">${this.titlebar('Mi Equipo', 'Menú')}
      ${this.squadSynergyPanel(squad)}
      <div class="panel"><div class="note">Elige <b>7 candidatos</b>. Empiezas solo con el <b>capitán</b>; al subir de nivel podrás fichar a los otros seis (máximo ${MAX_TEAM} en el campo).
        Pulsa un futbolista de tu colección para añadirlo o quitarlo, pulsa una plaza para cambiarla, o arrastra para colocar e intercambiar. Se guarda solo.</div>
        <div class="squad-row">${slots}</div></div>
      <div class="panel sq-picker"><div class="sq-pick-head"><h3>Tu colección</h3>
          <span class="note">${this.squadPicked ? `Elige quién va a la <b>plaza ${this.squadSlot + 1}${this.squadSlot === 0 ? ' (capitán)' : ''}</b> · <button class="linkbtn" id="sqcancel">cancelar</button>` : squad.length < SQUAD_SIZE ? 'Pulsa un futbolista para añadirlo o quitarlo · o cógelo y arrástralo a una plaza' : 'Equipo completo: pulsa una plaza para cambiarla, o un futbolista del equipo para quitarlo'}</span>
          <span class="spacer"></span><button class="btn small" id="sqauto" title="Rellena las plazas libres con tus mejores futbolistas">★ Autocompletar</button><button class="btn small blue" id="sqclear" title="Deja solo al capitán">Vaciar</button></div>
        <div class="filters"><input id="sqq" placeholder="Buscar nombre o equipo" value="${esc(this.squadFilter.q)}">
          <select id="sqr"><option value="">Rareza</option>${RARITY_ORDER.map((r) => `<option value="${r}" ${this.squadFilter.rarity === r ? 'selected' : ''}>${RARITY_LABEL[r]}</option>`).join('')}</select>
          <select id="sqp"><option value="">Posición</option>${Object.entries(POS_LABEL).map(([k, v]) => `<option value="${k}" ${this.squadFilter.pos === k ? 'selected' : ''}>${v}</option>`).join('')}</select>
          <select id="sqe"><option value="">Elemento</option>${['Fuego', 'Aire', 'Bosque', 'Montaña'].map((e) => `<option value="${e}" ${this.squadFilter.el === e ? 'selected' : ''}>${e}</option>`).join('')}</select>
          <select id="sqs">${[['media', 'Ordenar: media'], ['rareza', 'Ordenar: rareza'], ['nombre', 'Ordenar: nombre']].map(([v, l]) => `<option value="${v}" ${this.squadFilter.sort === v ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
        <div class="grid" id="sqgrid" style="margin-top:10px"></div></div>
      ${cap ? `<div class="panel detail" style="--rc:${RARITY_COLOR[cap.rarity]}"><div class="art">${this.mug(cap.id, 128)}${charCanvas(cap.id, 3, 12)}</div><div>
        <h3>Capitán: ${esc(cap.name)} ${this.rar(cap)} ${this.elem(cap)}</h3>
        <h3 style="margin-top:8px">Técnica inicial</h3><div class="loadout">${cap.techniques.map((t, i) => {
          const on = (this.save.loadout[String(cap.id)] ?? startingTech(cap)) === i;
          const usable = t.type !== 'talento' && (!isLocked(t) || isBought(this.save, cap.id, i));
          const uses = this.save.mastery[String(t.id)] ?? 0;
          return `<button class="load${on ? ' on' : ''}" data-load="${i}" ${usable ? '' : 'disabled'}>${this.icon(ICON.manual[t.type], 2)}<span><b>${esc(t.name)}</b><small>${TYPE_LABEL[t.type]} · poder ${t.power}${usable ? '' : t.type === 'talento' ? ' · pasiva' : ' · en tienda'}</small><i class="mbar-s"><i style="width:${masteryProgress(uses) * 100}%"></i></i><small>Maestría ${masteryLevel(uses)}/${MASTERY_USES.length}</small></span></button>`;
        }).join('')}</div>
        <h3 style="margin-top:10px">Formación inicial</h3><div class="formation-pick">${FORMATION_ORDER.map((f) => this.formationCard(f, f === cur)).join('')}</div>
        <p style="text-align:right"><button class="btn big" id="next">Elegir arena ▶</button></p></div></div>` : '<div class="panel"><div class="note">Aún no tienes futbolistas: consíguelos en Fichajes.</div></div>'}
</div>`);
    this.squadGrid();
    this.on('[data-back]', 'click', () => this.mainMenu());
    this.on('[data-slot]', 'click', (e, el) => {
      if ((e.target as HTMLElement).closest('.sq-act') || performance.now() - this.dragEndedAt < 300) return;
      const i = Number(el.dataset.slot);
      // Fix 1.32: a slot is «picked» on purpose; clicking it again unpicks it
      this.squadPicked = !(this.squadPicked && this.squadSlot === i);
      this.captainSelect(i);
      if (this.squadPicked) document.querySelector('.sq-picker')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    this.squadDrag(); // Fix 1.32: pick a card up and move it (slots and collection)
    this.squadLanded = -1;
    document.getElementById('sqcancel')?.addEventListener('click', () => { this.squadPicked = false; this.captainSelect(); });
    document.getElementById('sqauto')?.addEventListener('click', () => {
      // the best owned footballers by their real mean (ascension, HÉROE and training included) fill the free slots
      const ids = squadOf(this.save, this.byId).map((p) => p.id);
      const pool = this.unlockedRoster().filter((p) => !ids.includes(p.id)).sort((a, b) => this.meanOf(b) - this.meanOf(a));
      for (const p of pool) { if (ids.length >= SQUAD_SIZE) break; ids.push(p.id); }
      setSquad(this.save, ids); this.persist(); sfx('powerup'); this.squadPicked = false; this.captainSelect();
    });
    document.getElementById('sqclear')?.addEventListener('click', (e) => this.armed(e.currentTarget as HTMLElement, () => {
      const cap = squadOf(this.save, this.byId)[0];
      if (cap) setSquad(this.save, [cap.id]);
      this.persist(); sfx('click'); this.squadPicked = false; this.captainSelect(1);
    }));
    this.on('[data-captain]', 'click', (_e, el) => { makeCaptain(this.save, this.byId, Number(el.dataset.captain)); this.persist(); sfx('powerup'); this.captainSelect(0); });
    this.on('[data-remove]', 'click', (_e, el) => { removeFromSquad(this.save, this.byId, Number(el.dataset.remove)); this.persist(); this.captainSelect(); });
    this.on('.fcard', 'click', (_e, el) => { this.save.formation = el.dataset.f!; this.persist(); this.captainSelect(); });
    this.on('[data-load]', 'click', (_e, el) => { if (this.captainId) { this.save.loadout[String(this.captainId)] = Number(el.dataset.load); this.persist(); this.captainSelect(); } });
    const refilter = () => {
      const v = (id: string) => (document.getElementById(id) as HTMLInputElement | HTMLSelectElement).value;
      this.squadFilter = { q: v('sqq'), rarity: v('sqr'), pos: v('sqp'), el: v('sqe'), sort: v('sqs') || 'media' };
      this.squadLimit = 48;
      this.squadGrid();
    };
    document.getElementById('sqq')!.addEventListener('input', refilter);
    document.getElementById('sqr')!.addEventListener('change', refilter);
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
    type St = { id: number; el: HTMLElement; x0: number; y0: number; pid: number; fromSlot: number; ghost?: HTMLElement; over?: HTMLElement | null; lx: number; tilt: number };
    let st: St | null = null;
    this.root.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'touch' || e.button !== 0) return;
      const t = e.target as HTMLElement;
      const el = t.closest<HTMLElement>('[data-drag]');
      if (!el || t.closest('.sq-act, button, select, input')) return;
      const slot = el.closest<HTMLElement>('[data-slot]');
      st = { id: Number(el.dataset.drag), el, x0: e.clientX, y0: e.clientY, pid: e.pointerId, fromSlot: slot ? Number(slot.dataset.slot) : -1, lx: e.clientX, tilt: 0 };
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
        document.body.classList.add('dragging-card');
        sfx('click');
      }
      e.preventDefault();
      // the card leans towards where it is going, and settles when the pointer slows down
      st.tilt = st.tilt * 0.8 + Math.max(-14, Math.min(14, (e.clientX - st.lx) * 0.9)) * 0.2;
      st.lx = e.clientX;
      st.ghost.style.transform = `translate(${dx}px, ${dy}px) rotate(${st.tilt.toFixed(1)}deg) scale(1.08)`;
      const under = document.elementFromPoint(e.clientX, e.clientY)?.closest<HTMLElement>('[data-slot]') ?? null;
      if (under !== st.over) { st.over?.classList.remove('drop'); under?.classList.add('drop'); st.over = under; if (under) sfx('click'); }
    }, { passive: false });
    const end = (e: PointerEvent) => {
      if (!st || e.pointerId !== st.pid) return;
      const s0 = st; st = null;
      if (!s0.ghost) return; // no movement: it was a click
      this.dragEndedAt = performance.now();
      document.body.classList.remove('dragging-card');
      s0.over?.classList.remove('drop');
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
      if (s0.over) {
        const slot = Number(s0.over.dataset.slot);
        const target = (s0.over.querySelector('.pcard') ?? s0.over).getBoundingClientRect();
        fly(target, () => {
          placeInSquad(this.save, this.byId, slot, s0.id);
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
    const list = this.unlockedRoster().filter((p) => (!f.rarity || p.rarity === f.rarity) && (!f.pos || p.position === f.pos) && (!f.el || String(p.element) === f.el)
      && (!q || p.name.toLowerCase().includes(q) || p.teams.some((t) => teamLabel(t).toLowerCase().includes(q))))
      .sort((a, b) => f.sort === 'nombre' ? a.name.localeCompare(b.name)
        : f.sort === 'rareza' ? RARITY_ORDER.indexOf(effectiveRarity(this.save, b)) - RARITY_ORDER.indexOf(effectiveRarity(this.save, a)) || mean(b) - mean(a)
        : mean(b) - mean(a) || a.name.localeCompare(b.name));
    const sq = squadOf(this.save, this.byId);
    const partners = new Map<string, string>();
    for (const c of squadCombos(sq)) if (!c.ready && c.missing.length === 1) partners.set(c.missing[0], c.combo.name);
    box.innerHTML = list.slice(0, this.squadLimit).map((p) => this.pcard(p, { sel: inSquad.has(p.id), badge: inSquad.has(p.id) ? '✔ EQUIPO' : partners.has(p.name) ? `🔗 ${partners.get(p.name)}` : undefined }).replace('<div class="pcard', `<div data-drag="${p.id}" class="pcard${inSquad.has(p.id) ? ' in-squad' : ''}`)).join('')
      + (list.length > this.squadLimit ? `<button class="btn blue" id="sqmore">Mostrar más (${list.length - this.squadLimit})</button>` : '')
      + (list.length ? '' : '<div class="note">Nadie coincide con el filtro.</div>');
    mountPreviews();
    box.querySelectorAll<HTMLElement>('.pcard[data-id]').forEach((el) => {
      el.addEventListener('click', () => {
        if (performance.now() - this.dragEndedAt < 300) return; // the end of a drag is not a click
        // Fix 1.32: one click adds (first free slot, or the slot picked on purpose) or removes; a full squad asks for a slot
        const id = Number(el.dataset.id), squad = squadOf(this.save, this.byId);
        if (inSquad.has(id) && !this.squadPicked) {
          if (squad.length === 1) { this.toast('Tu equipo necesita al menos al capitán'); sfx('error'); return; }
          removeFromSquad(this.save, this.byId, id); sfx('click');
        } else if (this.squadPicked || squad.length < SQUAD_SIZE) {
          placeInSquad(this.save, this.byId, this.squadPicked ? this.squadSlot : squad.length, id); sfx('powerup');
        } else {
          this.toast('Equipo completo: pulsa la plaza que quieres cambiar o quita a alguien'); sfx('error');
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

  mapSelect() {
    const cards = this.m.maps.map((mp) => {
      const open = isMapUnlocked(mp.unlock, this.save);
      const cleared = this.save.clearedMaps.includes(mp.id);
      const boss = this.m.units.find((u) => u.id === mp.boss)?.name ?? '—';
      return `<div class="panel mapcard"><h3>${esc(mp.name)} ${cleared ? '✔' : ''}</h3>
        <div class="thumb">${mp.minimapTexture ? `<img src="${mp.minimapTexture}" alt="">` : open ? '<div class="note">Estadio provisional</div>' : ''}
          ${open ? '' : `<div class="lock">BLOQUEADA<br>Supera ${esc(this.m.maps.find((x) => `clear:${x.id}` === mp.unlock)?.name ?? '')}</div>`}</div>
        <div class="note">Duración ${fmtTime(mp.durationSec)} · ${mp.enemies.length} rivales · jefe: ${esc(boss)}</div>
        <div class="rank-done">${RANK_ORDER.map((id) => `<span class="${this.save.clearedRanks[mp.id]?.includes(id) ? 'ok' : ''}">${id}</span>`).join('')}</div>
        <div class="prov">${esc(mp.provisional ?? 'Reconstruido sobre el mapa cenital original con texturas originales.')}</div>
        <button class="btn" data-map="${mp.id}" ${open ? '' : 'disabled'}>${open ? '¡Saltar al campo! ▶' : 'Bloqueado'}</button></div>`;
    }).join('');
    const rk = this.save.difficulty;
    const ranks = RANK_ORDER.map((id) => {
      const R = RANKS[id];
      return `<button class="rank-btn r-${id}${id === rk ? ' on' : ''}" data-rank="${id}"><b>${id}</b><span>${esc(R.blurb)}</span><small><em class="rk-word">Recompensas </em>×${R.reward}</small></button>`;
    }).join('');
    this.show(`<div class="screen">${this.titlebar('Elige arena', 'Mi Equipo')}
      <div class="panel"><h3>Dificultad</h3><div class="ranks">${ranks}</div><div class="note rank-blurb">${esc(rankDef(rk).blurb)}</div></div><div class="maps">${cards}</div></div>`);
    this.on('[data-rank]', 'click', (_e, el) => { this.save.difficulty = el.dataset.rank as Rank; this.persist(); this.mapSelect(); });
    this.on('[data-back]', 'click', () => this.captainSelect());
    this.on('[data-map]', 'click', (_e, el) => {
      const squad = squadOf(this.save, this.byId);
      if (squad.length) this.startRun(el.dataset.map!, [squad[0]], squad);
    });
  }

  // ------------------------------------------------------------- collection
  /** Fix 1.31: team rewards (crest, kit, captain) ready to collect in the Colección, counted like its own «!» marks. */
  private collectionClaims() {
    const main = new Set(this.m.mainTeams ?? []);
    const teams = [...new Set(this.m.roster.flatMap((p) => p.teams))].filter((t) => main.has(t));
    return teams.reduce((n, t) => n + (['crest', 'kit', 'captain'] as TeamRewardKind[])
      .filter((k) => (k !== 'kit' || !!this.m.kits?.[t]) && canClaim(this.save, this.m.roster, t, k)).length, 0);
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
      && (!f.saga || p.teams.some((t) => sagaOf(t) === f.saga)) && (!f.owned || this.owned(p.id))
      && (!f.q || `${p.name} ${p.nickname}`.toLowerCase().includes(f.q.toLowerCase())))
      .sort((a, b) => Number(!!this.owned(b.id)) - Number(!!this.owned(a.id)) || RARITY_ORDER.indexOf(b.rarity) - RARITY_ORDER.indexOf(a.rarity));
    const counts = RARITY_ORDER.map((r) => `${RARITY_LABEL[r]} ${this.m.roster.filter((p) => p.rarity === r && this.owned(p.id)).length}/${this.m.roster.filter((p) => p.rarity === r).length}`).join(' · ');
    const select = (id: string, label: string, opts: [string, string][], cur: string) => `<select id="${id}"><option value="">${label}</option>${opts.map(([v, l]) => `<option value="${esc(v)}" ${cur === v ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>`;
    const showTeams = this.collectionView === 'equipos' && !f.team && !f.q;
    const rewardOk = (team: string, k: TeamRewardKind) => k !== 'kit' || !!this.m.kits?.[team];
    const teamClaims = allTeams.reduce((n, t) => n + (['crest', 'kit', 'captain'] as TeamRewardKind[]).filter((k) => rewardOk(t, k) && canClaim(this.save, this.m.roster, t, k)).length, 0);
    const teams = allTeams.filter((t) => !f.saga || sagaOf(t) === f.saga);
    const teamCards = SAGAS.map((sg) => {
      const list = teams.filter((t) => sagaOf(t) === sg);
      return list.length ? `<h3 class="saga">${sg}</h3><div class="team-grid">${list.map((t) => {
        const tp = teamProgress(this.save, this.m.roster, t);
        const claimable = (['crest', 'kit', 'captain'] as TeamRewardKind[]).some((k) => canClaim(this.save, this.m.roster, t, k));
        return `<button class="team-card big" data-team="${esc(t)}">${this.emblemOf(t) ? `<img src="${this.emblemOf(t)}" alt="">` : '<span class="noemblem">⚽</span>'}<span class="tc-body"><b>${esc(teamLabel(t))}</b><i class="tc-bar"><i style="width:${tp.owned / Math.max(1, tp.total) * 100}%"></i></i><small>${tp.owned}/${tp.total} futbolistas</small></span>${claimable ? '<span class="notif">!</span>' : ''}</button>`;
      }).join('')}</div>` : '';
    }).join('');
    const list = filtered.slice(0, this.collectionLimit);
    this.show(`<div class="screen">${this.titlebar('Enciclopedia', 'Menú')}
      ${d && this.compareWith && this.compareWith !== d.id && this.byId.get(this.compareWith) ? this.compareHtml(this.byId.get(this.compareWith)!, d) : ''}
      ${d ? this.playerDetail(d) : ''}
      <div class="mis-top"><div class="seg" id="views"><button data-v="equipos" class="${this.collectionView === 'equipos' ? 'on' : ''}">Por equipos</button><button data-v="fichatron" class="${this.collectionView === 'fichatron' ? 'on' : ''}">Fichatrón</button><button data-v="todos" class="${this.collectionView === 'todos' ? 'on' : ''}">Todos</button></div>
        ${this.collectionView === 'fichatron' ? `<span class="note">Jugadores de Fichatrón / Ojeadores: ${scouts.filter((p) => this.owned(p.id)).length} de ${scouts.length}. No pertenecen a un equipo de la historia, pero juegan igual que los demás.</span>` : ''}
        ${teamClaims ? `<button class="btn pulse" id="teamall">RECLAMAR TODO (${teamClaims})</button>` : ''}</div>
      ${f.team ? `<button class="btn small blue" id="clearteam">◀ Ver equipos</button>${this.teamHeader(f.team)}` : ''}
      <div class="filters"><input id="fq" placeholder="Buscar futbolista por nombre" value="${esc(f.q)}">
        ${select('fsa', 'Saga', SAGAS.map((x) => [x, x]), f.saga)}
        ${select('fr', 'Rareza', RARITY_ORDER.map((r) => [r, RARITY_LABEL[r]]), f.rarity)}
        ${select('fp', 'Posición', ['GK', 'DF', 'MF', 'FW'].map((x) => [x, POS_LABEL[x]]), f.pos)}
        ${select('fe', 'Elemento', elements.map((x) => [x, x]), f.element)}
        <label class="note"><input type="checkbox" id="fo" ${f.owned ? 'checked' : ''}> Solo desbloqueados</label>
        <span class="note">${counts}</span></div>
      ${showTeams ? teamCards : `<div class="grid">${list.map((p) => this.pcard(p, { locked: !this.owned(p.id), sel: p.id === detailId })).join('')}</div>
        ${filtered.length > list.length ? `<p style="text-align:center"><button class="btn blue" id="more">Ver más (${filtered.length - list.length})</button></p>` : ''}`}</div>`);
    this.on('[data-back]', 'click', () => this.mainMenu());
    this.on('.pcard[data-id]', 'click', (_e, el) => { if (this.owned(Number(el.dataset.id))) { this.collection(Number(el.dataset.id)); this.root.querySelector('.screen')?.scrollTo(0, 0); } });
    this.on('[data-ascend]', 'click', (_e, el) => this.ascension(Number(el.dataset.ascend), () => this.collection(Number(el.dataset.ascend))));
    this.on('[data-train]', 'click', (_e, el) => {
      const id = Number(el.dataset.pid);
      const p = this.byId.get(id), key = el.dataset.train as StatKey;
      const room = p?.stats ? trainRoom(this.save, p, effectiveRarity(this.save, p), isHero(this.save, id))[key] : Infinity;
      if (trainStat(this.save, id, key, room)) { this.persist(); sfx('powerup'); this.collection(id); } else sfx('error');
    });
    this.on('[data-trainreset]', 'click', (_e, el) => this.armed(el, () => { const id = Number(el.dataset.trainreset); resetTraining(this.save, id); this.persist(); sfx('click'); this.collection(id); }));
    this.on('[data-compare]', 'click', (_e, el) => { const id = Number(el.dataset.compare); this.compareWith = this.compareWith === id ? null : id; this.collection(id); });
    this.on('[data-uncompare]', 'click', () => { this.compareWith = null; this.collection(detailId); });
    this.on('[data-team]', 'click', (_e, el) => { f.team = el.dataset.team!; this.collectionLimit = 36; this.collection(); });
    this.on('[data-reward]', 'click', (_e, el) => {
      if (claimTeamReward(this.save, this.m.roster, f.team, el.dataset.reward as TeamRewardKind)) { this.persist(); sfx('evolve'); confetti(30); this.toast('¡Recompensa de equipo conseguida!'); }
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
      this.rewardSummary('¡Recompensas de equipo!', [`${n('crest')} escudos`, `${n('kit')} equipaciones`, `${n('captain')} duplicados de capitán`].filter((l) => !l.startsWith('0 ')));
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
      this.collectionLimit = 36;
      this.collection(detailId);
    };
    document.getElementById('fq')!.addEventListener('change', upd);
    ['fsa', 'fr', 'fp', 'fe', 'fo'].forEach((id) => document.getElementById(id)!.addEventListener('change', upd));
  }

  private teamHeader(team: string) {
    const tp = teamProgress(this.save, this.m.roster, team);
    const cap = teamCaptain(teamMembers(this.m.roster, team));
    const rewards: [TeamRewardKind, string, boolean][] = [['crest', 'Escudo del equipo', true], ['kit', 'Equipación', !!this.m.kits?.[team]], ['captain', `Duplicado de ${this.owned(cap.id) ? cap.name : 'su capitán'}`, true]];
    return `<div class="panel team-head">${this.emblemOf(team) ? `<img src="${this.emblemOf(team)}" alt="">` : ''}
      <div class="th-main"><h3>${esc(teamLabel(team))}</h3><div class="note">${sagaOf(team)} · ${tp.owned}/${tp.total} futbolistas</div><i class="tc-bar wide"><i style="width:${tp.owned / Math.max(1, tp.total) * 100}%"></i></i></div>
      <div class="th-rewards">${rewards.map(([k, label, ok]) => {
        const got = tp.claimed[k], can = ok && canClaim(this.save, this.m.roster, team, k);
        return `<div class="th-r${got ? ' got' : ''}"><span>${esc(label)}</span><small>${!ok ? 'Sin recursos' : `${Math.min(tp.owned, tp.goal[k])}/${tp.goal[k]}`}</small><button class="btn small" data-reward="${k}" ${can ? '' : 'disabled'}>${got ? 'Conseguido' : 'Reclamar'}</button></div>`;
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
    const TAG: Record<string, string> = { destacado: '★ DESTACADO', favorito: '♥ TU EQUIPO', semanal: '◆ SEMANAL', diaria: 'DEL DÍA' };
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
        <div class="shop-state">${sold ? '✔ Comprado' : owned ? 'Ya lo tienes: cuenta como duplicado' : 'Nuevo para tu colección'}</div>
        <small class="shop-left">${o.tag === 'semanal' ? `Cambia en ${weekLeft}` : `Cambia en ${dayLeft}`}</small>
        <button class="btn small" data-offer="${o.playerId}" ${sold || this.save.coins < o.price ? 'disabled' : ''}>${sold ? 'Comprado' : `${o.discount ? `<s>${PRICE[p.rarity]}</s> ` : ''}${o.price} ◉`}</button>
      </article>`;
    };
    const top = offers.filter((o) => o.tag && o.tag !== 'diaria'), day = offers.filter((o) => !o.tag || o.tag === 'diaria');
    const rars = ['todas', ...RARITY_ORDER.filter((r) => offers.some((o) => this.byId.get(o.playerId)?.rarity === r))];
    this.show(`<div class="screen shop-screen">${this.titlebar('Tienda', 'Menú')}
      <div class="shop-head"><span>${offers.length} ofertas · ${timeSource() === 'servidor' ? 'hora del servidor' : 'hora de este dispositivo'}</span><span>Diarias: ${dayLeft} · Semanal: ${weekLeft}</span></div>
      <h3 class="shop-sec">Destacados</h3><div class="shop-grid shop-top">${top.map(card).join('')}</div>
      <h3 class="shop-sec">Del día <span class="shop-filters">${rars.map((r) => `<button class="chip${this.shopFilter === r ? ' on' : ''}" data-sf="${r}">${r === 'todas' ? 'Todas' : RARITY_LABEL[r as Rarity]}</button>`).join('')}</span></h3>
      <div class="shop-grid shop-day">${day.filter((o) => this.shopFilter === 'todas' || this.byId.get(o.playerId)?.rarity === this.shopFilter).map(card).join('') || '<p class="note">Nada de esta rareza hoy.</p>'}</div></div>`);
    this.on('[data-back]', 'click', () => this.mainMenu());
    this.on('[data-sf]', 'click', (_e, el) => { this.shopFilter = el.dataset.sf ?? 'todas'; this.dailyShop(); });
    this.on('[data-offer]', 'click', (_e, el) => this.armed(el, () => {
      if (buyOffer(this.save, this.m.roster, Number(el.dataset.offer), serverNow())) { this.persist(); sfx('buy'); this.toast('¡Fichado!'); } else sfx('error');
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
    const days = PASS.map((r, i) => {
      const state = i < st.index ? 'reclamado' : i === st.index ? (st.available ? 'disponible' : 'bloqueado') : 'bloqueado';
      const icon = r.kind === 'fichas' ? '◎' : r.kind === 'monedas' ? '◉' : '★';
      return `<div class="pass-day ${state}"><small>Día ${i + 1}</small><b>${icon}</b><span>${esc(r.label)}</span><em>${state === 'reclamado' ? '✔ Reclamado' : state === 'disponible' ? '¡Disponible!' : i === st.index ? 'Mañana' : 'Bloqueado'}</em></div>`;
    }).join('');
    const next = PASS[st.index];
    const teamPick = next.kind === 'jugador' && next.team ? `<label class="team-sel">Equipo objetivo: <select id="passteam">${teams.map((t) => `<option value="${esc(t.team)}" ${t.team === this.passTeam ? 'selected' : ''}>${esc(teamLabel(t.team))}</option>`).join('')}</select></label>` : '';
    const left = msToNextDay(now);
    this.show(`<div class="screen">${this.titlebar('Pase semanal', 'Menú')}
      <div class="panel"><div class="note">Una recompensa por día (${timeSource() === 'servidor' ? 'hora del servidor' : 'hora de este dispositivo'}). Si te saltas días no pierdes nada: el pase espera en la siguiente recompensa. Tras el día 7 empieza un ciclo nuevo.</div></div>
      <div class="pass-row">${days}</div>
      <div class="panel" style="text-align:center">${st.available ? `<p>Hoy: <b>${esc(next.label)}</b></p>${teamPick}<p><button class="btn big" id="passclaim">Reclamar</button></p>`
        : `<p>Ya has reclamado la recompensa de hoy. La siguiente (<b>${esc(next.label)}</b>) estará lista en ${Math.floor(left / 3600000)} h ${Math.floor(left / 60000) % 60} min.</p>`}</div></div>`);
    this.on('[data-back]', 'click', () => this.mainMenu());
    document.getElementById('passteam')?.addEventListener('change', (e) => { this.passTeam = (e.target as HTMLSelectElement).value; });
    document.getElementById('passclaim')?.addEventListener('click', (e) => {
      (e.target as HTMLButtonElement).disabled = true;
      this.claimPassNow(() => this.weeklyPass());
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
    this.show(`<div class="screen">${this.titlebar('Equipaciones', 'Menú')}
      <div class="panel"><div class="note">Elige el uniforme de tu escuadra: cambia el cuerpo y conserva la cabeza original y todas las animaciones. Se consiguen con las recompensas de equipo de la Enciclopedia.
        <b>Cada equipación da un bonus</b>, y si llevas ${CLUB_CHEMISTRY.min} o más jugadores de ese equipo en el campo, «Química de club»: +${Math.round((CLUB_CHEMISTRY.damage - 1) * 100)}% de daño.</div>
      <div class="kit-grid">${card('', 'Raimon')}${available.map((t) => card(t, teamLabel(t))).join('')}</div></div>
      <div class="panel" style="margin-top:10px"><h3>Escudo de perfil</h3><div class="icon-grid">${crests.filter((t) => this.emblemOf(t)).map((t) => `<button class="iconpick${this.save.crest === t ? ' on' : ''}" data-crest="${esc(t)}" title="${esc(teamLabel(t))}"><img src="${this.emblemOf(t)}" alt=""></button>`).join('') || '<div class="note">Aún no tienes escudos: reúne 3 futbolistas de un equipo.</div>'}</div></div></div>`);
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
    const techs = (p: RosterEntry) => p.techniques.map((t) => `<li>${this.icon(ICON.manual[t.type], 1)} ${esc(t.name)} <small>${TYPE_LABEL[t.type]}${t.type === 'talento' ? '' : ` · ${t.power}`}</small></li>`).join('');
    const shared = [...new Set(a.teams.filter((t) => b.teams.includes(t) && (this.m.mainTeams ?? []).includes(t)))].map(teamLabel);
    const notes = [a.position !== b.position ? `Posiciones distintas (${POS_LABEL[a.position]} / ${POS_LABEL[b.position]}): la comparación es orientativa.` : '',
      a.element === b.element ? `Mismo elemento (${a.element}): suman resonancia de elemento juntos.` : '',
      shared.length ? `Comparten equipo: ${esc(shared.slice(0, 3).join(', '))} (química de club con 3 o más en el campo).` : ''].filter(Boolean);
    return `<div class="panel compare"><h3>Comparación <button class="btn small blue" data-uncompare="1">✕ Cerrar</button></h3>
      <div class="cmp-head">${[a, b].map((p) => `<div>${this.mug(p.id, 64)}<b>${esc(p.name)}</b>${this.rar(p)}<small>${POS_LABEL[p.position]} · ${esc(String(p.element))}</small></div>`).join('<span>VS</span>')}</div>
      <table class="cmp-stats"><tr><th></th><th>${esc(a.nickname || a.name)}</th><th>${esc(b.nickname || b.name)}</th><th>Dif.</th></tr>${rows}</table>
      <div class="cmp-techs"><ul>${techs(a)}</ul><ul>${techs(b)}</ul></div>
      ${notes.map((n) => `<div class="note">${n}</div>`).join('')}</div>`;
  }

  /** Fix 1.3: training of an owned footballer: up to 20 points, one Ficha de entrenamiento each, freely returned. */
  private trainingHtml(d: RosterEntry) {
    if (!this.owned(d.id)) return '';
    const used = trainingUsed(this.save, d.id), tr = trainingOf(this.save, d.id), have = this.save.trainTokens ?? 0;
    const can = have > 0 && used < TRAIN_MAX;
    const room = d.stats ? trainRoom(this.save, d, effectiveRarity(this.save, d), isHero(this.save, d.id)) : null;
    return `<div class="train-box"><div class="train-head"><b>Entrenamiento ${used}/${TRAIN_MAX}</b><span>Fichas de entrenamiento: <b>${have}</b></span>
      ${used ? `<button class="btn small blue" data-trainreset="${d.id}">Devolver puntos</button>` : ''}</div>
      <div class="train-row">${STAT_INFO.map((s) => { const full = (room?.[s.key as StatKey] ?? 1) <= 0; // Fix 1.31: a stat at 99 takes no more points
        return `<button class="btn small${full ? ' maxed' : ''}" data-train="${s.key}" data-pid="${d.id}" ${can && !full ? '' : 'disabled'} title="${full ? 'Al máximo (99)' : ''}">${s.short}${tr[s.key as StatKey] ? ` +${tr[s.key as StatKey]}` : ''} ${full ? 'MÁX' : '＋'}</button>`; }).join('')}</div>
      <div class="note">Cada ficha suma 1 punto a la estadística que elijas (máximo ${TRAIN_MAX} por futbolista). Se ganan con victorias, rangos superados, supervivencia infinita, misiones semanales y logros.</div></div>`;
  }

  private playerDetail(d: RosterEntry) {
    const o = this.owned(d.id);
    const statNames: Record<string, string> = { kick: 'Tiro', body: 'Físico', guard: 'Defensa', control: 'Control', speed: 'Velocidad', guts: 'Agallas', stamina: 'Aguante' };
    const active = startingTech(d);
    const reps = Array.from({ length: Math.max(4, d.techniques.length) }, (_, i) => d.techniques[i]); // GO players can know more than 4
    return `<div class="panel detail r-${d.rarity}${isHero(this.save, d.id) ? ' is-hero' : ''}" style="--rc:${RARITY_COLOR[d.rarity]}"><div class="art">${this.mug(d.id, 128)}${charCanvas(d.id, 3, 12)}</div><div>
      <h3>${esc(d.name)} “${esc(d.nickname)}” ${this.rar(d)} ${this.elem(d)}</h3>
      <div class="note">${POS_LABEL[d.position]} · ${esc(d.teams.filter((t) => (this.m.mainTeams ?? []).includes(t)).slice(0, 5).map(teamLabel).join(', ') || 'Jugador de Fichatrón / Ojeador')}${(() => { const sg = [...new Set(d.teams.map(sagaOf).filter(Boolean))]; return sg.length ? ` · Saga: ${esc(sg.join(', '))}` : ''; })()}</div>
      ${o ? `<p><button class="btn small blue" data-compare="${d.id}">${this.compareWith === d.id ? 'Elige otro futbolista para comparar…' : '⇄ Comparar con otro'}</button></p>` : ''}
      ${o ? `<div class="note">Estrellas ${o.stars}/${MAX_STARS} · Duplicados libres ${sparesOf(this.save, d.id)} (gastados ${o.spent ?? 0}) · Potencia: daño ×${starBonus(o.stars).damage.toFixed(2)}, vida ×${starBonus(o.stars).hp.toFixed(2)}</div>` : ''}
      ${o && (nextStep(this.save, d) || isHero(this.save, d.id)) ? `<p><button class="btn ${nextStep(this.save, d) ? 'big' : 'blue'}" data-ascend="${d.id}">${!nextStep(this.save, d) ? '★ Ver HÉROE' : nextStep(this.save, d)!.step === 'estrella' ? `★ Estrella de héroe (${sparesOf(this.save, d.id)}/${nextStep(this.save, d)!.cost})` : `▲ Ascensión (${sparesOf(this.save, d.id)}/${nextStep(this.save, d)!.cost})`}</button></p>` : ''}
      ${d.heroTech ? `<div class="note">Técnica de HÉROE: <b>${esc(d.heroTech.name)}</b>${isHero(this.save, d.id) ? ' (desbloqueada)' : ''}</div>` : ''}
      ${(() => { const pa = adaptedPassive(d); return (pa ? `<div class="note">Pasiva: <b>${esc(pa.name)}</b> · ${esc(passiveText(pa))} <small>(adaptación de InaZurvivors)</small></div>` : '') + d.techniques.filter((t) => t.type === 'talento').map((t) => `<div class="note">Talento: <b>${esc(t.name)}</b> · ${esc(talentText(t.id, 1))} <small>(efecto adaptado; sube con el nivel de la técnica)</small></div>`).join(''); })()}
      <h3 style="margin-top:8px">Repertorio (2 técnicas activas en combate)</h3>
      ${reps.map((t, i) => (t ? `<div class="rep">${i === active ? '<span class="tag">Inicial</span>' : isLocked(t) && !isBought(this.save, d.id, i) ? '<span class="tag">Tienda</span>' : ''}${this.techHtml(t)}<div class="note">Maestría ${masteryLevel(this.save.mastery[String(t.id)] ?? 0)}/${MASTERY_USES.length} · +${masteryLevel(this.save.mastery[String(t.id)] ?? 0) * MASTERY_BONUS * 100}% daño · ${this.save.mastery[String(t.id)] ?? 0} usos</div></div>`
        : '<div class="rep"><div class="tech"><div class="note">Ficha pendiente: sin datos de origen para esta técnica.</div></div></div>')).join('')}
      ${d.stats ? `<h3 style="margin-top:8px">Estadísticas · media ${statMean(this.statsOf(d)!)}</h3><div class="stat-radar">${statRadar(this.statsOf(d)!, statNames, RARITY_COLOR[effectiveRarity(this.save, d)])}</div>
        ${this.trainingHtml(d)}
        <div class="stat-explain">${STAT_INFO.map((s) => `<div><b>${s.name} ${this.statsOf(d)![s.key] ?? '—'}</b><span>${esc(s.what(this.statsOf(d)![s.key] ?? 60))}</span></div>`).join('')}</div>
        <div class="note">Valores centrados en 60: por encima suman, por debajo restan. Cada técnica usa las estadísticas de su futbolista.</div><div class="bars-mini">${Object.entries(this.statsOf(d)!).map(([k, v]) => `<span>${statNames[k] ?? k}</span><i style="width:${Math.min(100, v)}%"></i>`).join('')}</div>${d.statsSource === 'derivado' ? '<div class="note">Estadísticas estimadas por posición y rareza: las de IE3 aún no se han descifrado.</div>' : ''}` : ''}
      </div></div>`;
  }

  // ------------------------------------------------------------- gacha: IE3 capsule machine (sheet pieces)
  private cap(name: string) { const c = this.m.capsule; return c?.pieces[name] ? `${c.base}${c.pieces[name].file}` : ''; }
  private capColor(r: Rarity) { return this.m.capsule?.rarityColor?.[r] ?? 'rojo'; }

  private gachaBanner: BannerId = 'ff';
  private gachaTeam = '';
  gacha() {
    const banner = BANNERS[this.gachaBanner];
    const teams = teamChoices(this.m.roster, this.m.mainTeams ?? []);
    if (banner.id === 'equipo' && !teams.some((t) => t.team === this.gachaTeam)) this.gachaTeam = (teams.find((t) => t.team === this.save.favoriteTeam) ?? teams[0])?.team ?? '';
    const pool = bannerPool(this.m.roster, banner.id, this.gachaTeam);
    const real = rarityOdds(pool, banner.id);
    const each = perPlayerOdds(pool, banner.id);
    const price = bannerPrice(pool, banner.id); // Fix 1.31: by how many Míticos the machine holds
    const PULL_COST = price.cost, MULTI_COST = price.multiCost;
    const tabs = BANNER_ORDER.map((b) => {
      const pr = b === 'equipo' ? { cost: BANNERS.equipo.cost } : bannerPrice(bannerPool(this.m.roster, b), b);
      return `<button class="banner-tab${b === banner.id ? ' on' : ''}" data-banner="${b}" style="--bc:${BANNERS[b].color}"><b>${esc(BANNERS[b].label)}</b><small>${esc(BANNERS[b].tagline)}</small><em class="bt-price">${pr.cost} fichas</em></button>`;
    }).join('');
    const teamSel = banner.id === 'equipo' ? `<label class="team-sel">Equipo: <select id="gteam">${teams.map((t) => `<option value="${esc(t.team)}" ${t.team === this.gachaTeam ? 'selected' : ''}>${esc(teamLabel(t.team))} (${t.size})</option>`).join('')}</select></label>` : '';
    const feat = featured(pool, 5).map((p) => `<span class="feat r-${p.rarity}" style="--rc:${RARITY_COLOR[p.rarity]}" title="${esc(p.name)}">${this.mug(p.id, 48)}<small>${esc(p.name)}</small></span>`).join('');
    const odds = RARITY_ORDER.map((r) => `<div class="odd"><span class="rar ${r}">${RARITY_LABEL[r].toUpperCase()}</span><i style="--w:${Math.max(1.5, real[r])}%;--c:${RARITY_COLOR[r]}"></i><b>${real[r] ? `${+real[r].toFixed(2)}% · c/u ${+each[r].toFixed(3)}%` : 'vacía'}</b></div>`).join('');
    const empty = RARITY_ORDER.filter((r) => !real[r]).map((r) => RARITY_LABEL[r]);
    const hist = (this.save.gachaHistory ?? []).slice(0, 12).map((h) => {
      const p = this.byId.get(h.id);
      return p ? `<span class="hist r-${p.rarity}" style="--rc:${RARITY_COLOR[p.rarity]}" title="${esc(p.name)}">${this.mug(p.id, 40)}${h.isNew ? '<em>NUEVO</em>' : ''}</span>` : '';
    }).join('');
    const sb = starBonus(1);
    const has = !!this.m.capsule;
    setMusicContext('gacha');
    this.show(`<div class="screen gacha-screen">${this.titlebar('Máquina de fichajes', 'Menú')}
      <div class="banner-tabs">${tabs}</div>
      <div class="banner-head" style="--bc:${banner.color}"><div><b>${esc(banner.label)}</b> · ${pool.length} futbolistas ${teamSel}<div class="note">×10 garantiza al menos un Épico o superior. ${banner.id === 'equipo' ? 'Solo futbolistas del equipo elegido; las rarezas altas tienen un tope por jugador.' : `Cada futbolista sale en una sola máquina: la de la primera saga en la que aparece. Precio según sus Míticos (${price.mythics}): sin estrellas 5 · sin Míticos 10 · de 1 a 5 Míticos 15 · 6 o más 20.`}</div></div><div class="feat-row">${feat}</div></div>
      <div class="ie3-machine">${has ? `<div class="ds-top"><img id="globe" src="${this.cap('globe0')}" alt=""></div>
        <div class="ds-bottom" style="background-image:url(${this.cap('panel_bottom')})">
          <img class="goal" src="${this.cap('goal_slot')}" alt=""><div class="knobwrap"><img class="kbase" src="${this.cap('knob_base')}" alt="">
          <img id="knob" class="knob" src="${this.cap('knob00')}" alt=""></div>
          <div class="coins-row"><button class="coinbtn" data-pull="1" ${this.save.tokens < PULL_COST ? 'disabled' : ''}><img src="${this.cap('coin_rojo')}" alt=""><span>×1<br>${PULL_COST}</span></button>
          <button class="coinbtn" data-pull="10" ${this.save.tokens < MULTI_COST ? 'disabled' : ''}><img src="${this.cap('coin_oro')}" alt=""><span>×10<br>${MULTI_COST}</span></button></div>
        </div>` : `<div class="own-machine"><div class="om-dome">${Array.from({ length: 14 }, (_, i) => `<i style="--x:${(i * 37) % 80 + 6}%;--y:${(i * 53) % 60 + 25}%;--c:${['#ff4f5a', '#4fb3ff', '#ffe24a', '#5cdc6a', '#b36bff', '#ff9a3a'][i % 6]};--d:${(i % 5) * 0.3}s"></i>`).join('')}</div>
          <div class="om-body"><div class="om-knob" id="ownknob"><b></b></div><div class="om-slot"></div></div>
          <div class="coins-row"><button class="btn" data-pull="1" ${this.save.tokens < PULL_COST ? 'disabled' : ''}>×1 · ${PULL_COST} fichas</button>
          <button class="btn" data-pull="10" ${this.save.tokens < MULTI_COST ? 'disabled' : ''}>×10 · ${MULTI_COST} fichas</button></div></div>`}</div>
      <div class="gacha-info">
        <div class="panel gi"><h3>Tus fichas</h3><div class="gi-big"><span class="tokens">${this.save.tokens}</span></div>
          <div class="note">×1 cuesta <b>${PULL_COST}</b> · ×10 cuesta <b>${MULTI_COST}</b> (con un Épico o mejor asegurado). ${this.save.tokens < PULL_COST ? `Te faltan ${PULL_COST - this.save.tokens}.` : `Te llega para ${Math.floor(this.save.tokens / PULL_COST)} tirada(s).`}</div></div>
        <div class="panel gi"><h3>Cómo conseguir fichas</h3><ul class="gi-list"><li>Jugar partidas (más si ganas)</li><li>Misiones diarias, semanales y logros</li><li>Altares y fichas en el campo</li><li>Primera victoria en cada arena y rango</li></ul></div>
        <div class="panel gi"><h3>Nuevo o duplicado</h3><ul class="gi-list"><li><b class="newtag">NUEVO</b>: se desbloquea para siempre y ya puede ir en Mi Equipo.</li>
          <li><b>Duplicado</b>: suma hacia una estrella (hasta ${MAX_STARS}), cada una +${Math.round((sb.damage - 1) * 100)}% daño y +${Math.round((sb.hp - 1) * 100)}% vida. Copias por estrella: Común ${COPIES_PER_STAR.comun}, Raro y Épico ${COPIES_PER_STAR.raro}, el resto 1.</li>
          <li>Los duplicados también pagan la <b>ascensión</b> de cualquier futbolista (Ascendido y HÉROE): Común ${ASC_COSTS.comun.ascenso}+${ASC_COSTS.comun.heroe}, Raro ${ASC_COSTS.raro.ascenso}+${ASC_COSTS.raro.heroe}, Épico ${ASC_COSTS.epico.ascenso}+${ASC_COSTS.epico.heroe}, Legendario ${ASC_COSTS.legendario.ascenso}+${ASC_COSTS.legendario.heroe}; un Mítico pasa directamente a HÉROE con ${ASC_COSTS.mitico.heroe} y una Leyenda con ${ASC_COSTS.leyenda.heroe}. Después, cada HÉROE gana hasta ${HERO_STARS_MAX} estrellas de héroe (Mítico ${ASC_COSTS.mitico.estrella} duplicados cada una).</li>
          <li>Con ${MAX_STARS} estrellas y HÉROE, cada copia da monedas (de ${DUPLICATE_REFUND_BY.comun} a ${DUPLICATE_REFUND_BY.leyenda} según la rareza).</li></ul></div>
        <div class="panel gi"><h3>Probabilidades</h3><div class="odds">${odds}</div>${empty.length ? `<div class="note">${esc(empty.join(', '))}: sin futbolistas por ahora; su probabilidad pasa a la rareza inferior.</div>` : ''}</div>
      </div>
      <div class="panel" style="max-width:980px;margin:10px auto"><h3>Últimas tiradas</h3><div class="hist-row">${hist || '<span class="note">Aún no has tirado.</span>'}</div>
        <div class="note">Fichas = máquina de cápsulas · Monedas = mejoras y tiendas. Gráficos de la máquina: Inazuma Eleven 3 (hoja de The Spriters Resource, ripeada por Avegaille), recurso local.</div></div></div>`);
    this.on('[data-back]', 'click', () => this.mainMenu());
    this.on('[data-banner]', 'click', (_e, el) => { if (this.pulling) return; this.gachaBanner = el.dataset.banner as BannerId; this.gacha(); });
    document.getElementById('gteam')?.addEventListener('change', (e) => { this.gachaTeam = (e.target as HTMLSelectElement).value; this.gacha(); });
    this.on('[data-pull]', 'click', async (_e, el) => {
      if (this.pulling) return; // one transaction at a time: a double click can never charge twice
      this.pulling = true;
      const b = BANNERS[this.gachaBanner];
      const bpool = bannerPool(this.m.roster, b.id, this.gachaTeam);
      const bp = bannerPrice(bpool, b.id);
      const res = pull(bpool, this.save, Number(el.dataset.pull) as 1 | 10, Math.random, { cost: bp.cost, multiCost: bp.multiCost, odds: rarityOdds(bpool, b.id) });
      if (!res) { this.pulling = false; return; }
      recordHistory(this.save, res);
      addCounter(this.save, 'news', res.filter((x) => x.isNew).length);
      this.persist();
      this.root.querySelectorAll<HTMLButtonElement>('[data-pull], [data-back]').forEach((b) => (b.disabled = true));
      try {
        await this.turnKnob();
        await this.capsuleShow(res, res.length > 1 ? 'Fichaje ×10' : 'Fichaje');
      } finally {
        this.pulling = false;
      }
      this.gachaSummary(res);
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
    for (let i = 0; i < results.length && !skip; i++) skip = await this.revealOne(results[i], results.length > 1, `${title} ${results.length > 1 ? `${i + 1}/${results.length}` : ''}`);
    if (skip) await this.skippedSummary(results, title);
  }

  /** Fix 1.31: after «Saltar todo», everything the pull gave at once (best first), closed with a click or Space/Enter/Esc. */
  private skippedSummary(results: PullResult[], title: string): Promise<void> {
    return new Promise((resolve) => {
      const rank = (r: PullResult) => RARITY_ORDER.indexOf(r.player.rarity) * 2 + (r.isNew ? 1 : 0);
      const sorted = [...results].sort((a, b) => rank(b) - rank(a));
      const badge = (r: PullResult) => r.isNew ? 'NUEVO' : r.refund ? `+${r.refund} ◉` : r.toStar ? `${r.toStar[0]}/${r.toStar[1]} ★` : r.forAscension ? '+1 ascenso' : `★${r.stars}`;
      const news = results.filter((r) => r.isNew).length;
      const ov = document.createElement('div');
      ov.className = 'reveal pull-summary';
      ov.innerHTML = `<div class="pull-summary-box"><h3>${esc(title)} · todo lo que has fichado</h3>
        <div class="note">${[news ? `${news} ${news === 1 ? 'fichaje nuevo' : 'fichajes nuevos'}` : '', results.length - news ? `${results.length - news} ${results.length - news === 1 ? 'duplicado' : 'duplicados'}` : ''].filter(Boolean).join(' · ')}</div>
        <div class="grid">${sorted.map((r) => `<div class="ps-item r-${r.player.rarity}${r.isNew ? ' is-new' : ''}">${this.pcard(r.player, { badge: badge(r) })}</div>`).join('')}</div>
        <button class="btn big">Aceptar</button></div>`;
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
        <div class="flash"></div><button class="btn small blue skip">${multi ? 'Saltar todo' : 'Saltar'}</button>${multi ? `<button class="btn small speed${this.revealSpeed > 1 ? ' on' : ''}">×2</button>` : ''}`;
      this.root.appendChild(ov);
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
          ${this.pcard(p, { anim: 12, big: true })}<div class="${r.isNew ? 'newtag' : 'stars'}">${r.isNew ? '¡NUEVO FICHAJE!' : r.refund ? `Al máximo: +${r.refund} monedas` : r.toStar ? `Duplicado · ${r.toStar[0]}/${r.toStar[1]} para la siguiente ★` : r.forAscension ? 'Duplicado · +1 para ascender' : `Duplicado · ${'★'.repeat(r.stars)}`}</div>
          <button class="btn big">${multi ? 'Siguiente ▶' : 'Aceptar'}</button>`;
        ov.appendChild(card);
        if (special) card.classList.add('from-scene');
        mountPreviews();
        card.querySelector('.btn')!.addEventListener('click', () => finish(false));
      };
      void seq();
    });
  }

  private gachaSummary(res: PullResult[]) {
    this.gacha();
    const panel = document.createElement('div');
    panel.className = 'panel';
    panel.style.marginTop = '14px';
    panel.innerHTML = `<h3>Resultado (${res.length})</h3><div class="grid">${res.map((r) => this.pcard(r.player, {
      badge: r.isNew ? 'NUEVO' : r.refund ? `+${r.refund}` : `★${r.stars}` })).join('')}</div>`;
    this.root.querySelector('.screen')!.appendChild(panel);
    mountPreviews();
  }

  // ------------------------------------------------------------- upgrades, options, profile
  perks(cat: PerkCategory = this.perkTab) {
    setMusicContext('menu');
    this.perkTab = cat;
    const levels = categoryLevels(this.save, cat);
    const next = MILESTONES.find((m) => levels < m);
    const cards = PERKS.filter((p) => p.category === cat).map((p) => {
      const lv = perkLevel(this.save, p.id);
      const cost = perkCost(p, lv);
      const max = lv >= p.max;
      const blocked = !!p.requires && !perkLevel(this.save, p.requires);
      return `<div class="perk-card${max ? ' max' : ''}${blocked ? ' blocked' : ''}"><b>${esc(p.label)}</b><div class="note">${esc(p.description)}</div>
        <div class="perk-now"><span>${lv ? perkValue(p, lv) : '—'}</span>${max ? '' : `<em>»</em><span class="nx">${perkValue(p, lv + 1)}</span>`}</div>
        <div class="pips">${Array.from({ length: p.max }, (_, i) => `<i class="${i < lv ? 'on' : ''}"></i>`).join('')}</div>
        <button class="btn small" data-perk="${p.id}" ${max || blocked || this.save.coins < cost ? 'disabled' : ''}>${max ? 'MÁX' : blocked ? 'Requiere la anterior' : `${cost} ◉`}</button></div>`;
    }).join('');
    this.show(`<div class="screen">${this.titlebar('Mejoras permanentes', 'Menú')}
      <div class="seg" id="cats">${PERK_CATEGORIES.map((c) => `<button data-c="${c}" class="${c === cat ? 'on' : ''}">${c} · ${categoryLevels(this.save, c)}</button>`).join('')}</div>
      <div class="panel cat-head"><div><b>Bonificación de ${cat}: ${CATEGORY_BONUS[cat]}</b><div class="note">Se gana a los ${MILESTONES.join(' y ')} niveles comprados en esta categoría (acumulable).</div></div>
        <div class="cat-track"><i style="width:${Math.min(100, levels / MILESTONES[MILESTONES.length - 1] * 100)}%"></i><span>${levels}/${next ?? MILESTONES[MILESTONES.length - 1]}</span></div></div>
      <div class="perk-cards">${cards}</div>
      <p class="note">Invertido: ${spentOn(this.save)} ◉. Pulsa dos veces para confirmar la compra. <button class="btn small blue" id="refund" ${spentOn(this.save) ? '' : 'disabled'}>Reiniciar y recuperar todo</button></p></div>`);
    this.on('[data-back]', 'click', () => this.mainMenu());
    this.on('#cats button', 'click', (_e, el) => this.perks(el.dataset.c as PerkCategory));
    document.getElementById('refund')!.addEventListener('click', (e) => this.armed(e.currentTarget as HTMLElement, () => { refundPerks(this.save); this.persist(); sfx('buy'); this.perks(); }));
    this.on('[data-perk]', 'click', (_e, el) => this.armed(el, () => {
      const ok = buyPerk(this.save, el.dataset.perk!);
      if (ok) { this.persist(); sfx('powerup'); } else sfx('error');
      const id = el.dataset.perk;
      this.perks();
      if (ok) document.querySelector(`[data-perk="${id}"]`)?.closest('.perk-card')?.classList.add('bought');
    }));
  }

  missions(kind: MissionKind = this.missionTab, filter = this.missionFilter) {
    setMusicContext('menu');
    rollPeriods(this.save);
    recordCollection(this.save, this.m.roster, this.m.mainTeams ?? []);
    this.missionTab = kind;
    this.missionFilter = filter;
    const mult = perkEffects(this.save).missionMult;
    const tabs: [MissionKind, string][] = [['diaria', 'Diarias'], ['semanal', 'Semanales'], ['partida', 'De partida'], ['logro', 'Logros']];
    const KIND_ICON: Record<MissionKind, string> = { diaria: '☼', semanal: '▦', partida: '⚽', logro: '★' };
    const state = (d: (typeof MISSIONS)[number]) => (isClaimed(this.save, d) ? 'reclamadas' : isClaimable(this.save, d) ? 'disponibles' : 'pendientes');
    const pend = (k: MissionKind) => MISSIONS.filter((d) => d.kind === k && isClaimable(this.save, d)).length;
    const list = MISSIONS.filter((d) => d.kind === kind && (filter === 'todas' || state(d) === filter));
    const rows = list.map((d, i) => {
      const p = missionProgress(this.save, d);
      const st = state(d);
      return `<div class="mcard ${st}" style="--d:${i * 50}ms"><span class="mc-ic">${KIND_ICON[d.kind]}</span>
        <div class="mc-body"><b>${esc(d.label)}</b><div class="mbar anim"><i style="--w:${p / d.goal * 100}%"></i><span>${p}/${d.goal}</span></div></div>
        <div class="mc-rew"><span class="coins">${Math.round(d.coins * mult)}</span>${d.tokens ? `<span class="tokens">${d.tokens}</span>` : ''}${d.dupe ? '<span class="dupe-rew" title="Duplicado de uno de tus Legendarios o Míticos">+1 DUP</span>' : ''}</div>
        <button class="btn small" data-claim="${d.id}" ${st === 'disponibles' ? '' : 'disabled'}>${st === 'reclamadas' ? '✔ Cobrada' : st === 'disponibles' ? '¡Reclamar!' : 'En curso'}</button></div>`;
    }).join('') || '<div class="note">Nada en esta lista.</div>';
    const total = pendingClaims(this.save);
    const note = kind === 'diaria' ? 'Se reinician a medianoche (hora local).' : kind === 'semanal' ? 'Se reinician el lunes a medianoche (hora local).' : kind === 'partida' ? 'Se cumplen en una sola partida.' : 'Para siempre: se cobran una vez.';
    this.show(`<div class="screen">${this.titlebar('Misiones', 'Menú')}
      <div class="mis-top"><div class="seg" id="tabs">${tabs.map(([k, l]) => `<button data-k="${k}" class="${k === kind ? 'on' : ''}">${l}${pend(k) ? ` <span class="notif in">${pend(k)}</span>` : ''}</button>`).join('')}</div>
        <button class="btn big${total ? ' pulse' : ''}" id="claimall" ${total ? '' : 'disabled'}>RECLAMAR TODO${total ? ` (${total})` : ''}</button></div>
      <div class="seg small" id="mfilter">${[['todas', 'Todas'], ['disponibles', 'Disponibles'], ['pendientes', 'En curso'], ['reclamadas', 'Reclamadas']].map(([k, l]) => `<button data-f="${k}" class="${k === filter ? 'on' : ''}">${l}</button>`).join('')}</div>
      <div class="panel mis-list" style="margin-top:10px">${rows}<div class="note">${note}</div></div></div>`);
    this.on('[data-back]', 'click', () => this.mainMenu());
    this.on('#tabs button', 'click', (_e, el) => this.missions(el.dataset.k as MissionKind));
    this.on('#mfilter button', 'click', (_e, el) => this.missions(kind, el.dataset.f as typeof filter));
    document.getElementById('claimall')?.addEventListener('click', (e) => {
      const at = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const dupeBefore = this.save.missions.lastDupe;
      const got = claimAllMissions(this.save, mult, this.m.roster);
      if (!got.count) return;
      this.persist(); // saved before any animation, so closing the tab can't lose it
      sfx('legend');
      this.missions(kind);
      flyTo({ x: at.left + at.width / 2, y: at.top }, '.coins', 16);
      if (got.tokens) flyTo({ x: at.left + at.width / 2, y: at.top }, '.tokens', 8);
      confetti(40);
      const dupe = this.save.missions.lastDupe !== dupeBefore && this.save.missions.lastDupe ? this.byId.get(this.save.missions.lastDupe) : undefined;
      this.rewardSummary('¡Recompensas cobradas!', [`${got.count} ${got.count === 1 ? 'misión' : 'misiones'}`, `+${got.coins} monedas`, ...(got.tokens ? [`+${got.tokens} fichas`] : []), ...(dupe ? [`Duplicado de ${dupe.name}`] : [])]);
    });
    this.on('[data-claim]', 'click', (_e, el) => {
      const coins = claimMission(this.save, el.dataset.claim!, perkEffects(this.save).missionMult, this.m.roster);
      if (coins) { this.persist(); sfx('buy'); }
      const at = el.getBoundingClientRect();
      this.missions(kind);
      if (coins) {
        flyTo({ x: at.left + at.width / 2, y: at.top }, '.coins', 12);
        flyTo({ x: at.left + at.width / 2, y: at.top }, '.tokens', 5);
      }
    });
  }

  shop(playerId?: number) {
    setMusicContext('menu');
    const owned = this.unlockedRoster();
    const p = this.byId.get(playerId ?? this.captainId ?? owned[0]?.id ?? -1);
    const rows = p?.techniques.map((t, i) => {
      const lv = this.save.shop.techBoosts[String(t.id)] ?? 0;
      const locked = isLocked(t) && !isBought(this.save, p.id, i);
      const bought = isBought(this.save, p.id, i);
      return `<div class="perk"><div>${this.techHtml(t)}<div class="note">${locked ? 'Bloqueada: solo se puede aprender comprándola.' : bought ? 'Desbloqueada: aparece desde el nivel 1 de la partida.' : `Aparece en partida a partir del nivel ${Math.floor(t.unlockLevel / 6)}.`} Manual ${lv}/${MAX_TECH_BOOST} (+${lv * 5}% daño).</div></div>
        <div class="shop-btns">${i === startingTech(p) ? '<span class="tag">Inicial</span>' : `<button class="btn small" data-unlock="${i}" ${bought || this.save.coins < unlockCost(t) ? 'disabled' : ''}>${bought ? 'Desbloqueada' : `Desbloquear ${unlockCost(t)} ◉`}</button>`}
        <button class="btn small blue" data-boost="${i}" ${lv >= MAX_TECH_BOOST || this.save.coins < boostCost(t, lv) ? 'disabled' : ''}>${lv >= MAX_TECH_BOOST ? 'Manual MÁX' : `Manual ${boostCost(t, lv)} ◉`}</button></div></div>`;
    }).join('') ?? '';
    this.show(`<div class="screen">${this.titlebar('Tienda de técnicas', 'Menú')}
      <div class="panel"><div class="note">Cada futbolista solo usa su propio repertorio. La tienda desbloquea técnicas de ese repertorio y vende manuales de daño permanente; subir de nivel una técnica en partida es aparte.</div>
      ${p ? `<h3 style="margin-top:10px">${esc(p.name)}</h3>${rows}` : ''}</div>
      <h3 class="saga">Elige futbolista</h3><div class="mini-list">${owned.map((o) => `<button class="mini-pick${o.id === p?.id ? ' on' : ''}" data-p="${o.id}" title="${esc(o.name)}">${this.mug(o.id, 48)}</button>`).join('')}</div></div>`);
    this.on('[data-back]', 'click', () => this.mainMenu());
    this.on('[data-p]', 'click', (_e, el) => this.shop(Number(el.dataset.p)));
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
    this.show(`<div class="screen">${this.titlebar('Equipamiento', 'Menú')}<div class="panel"><div class="note">Bonificaciones para todo el equipo. No cambian la equipación Raimon que se ve en combate.</div>${cols}</div></div>`);
    this.on('[data-back]', 'click', () => this.mainMenu());
    const keep = (fn: () => void) => { const y = this.root.querySelector('.screen')!.scrollTop; fn(); this.gearScreen(); this.root.querySelector('.screen')!.scrollTop = y; };
    this.on('[data-buy]', 'click', (_e, el) => this.armed(el, () => keep(() => { const it = this.gear.find((x) => x.id === el.dataset.buy); if (it && buyGear(this.save, it)) { this.persist(); sfx('buy'); } })));
    this.on('[data-eq]', 'click', (_e, el) => keep(() => { const it = this.gear.find((x) => x.id === el.dataset.eq); if (it && equipGear(this.save, it)) this.persist(); }));
  }

  /** Credits and legal notice. Only verifiable authorship and real licences; no permission is claimed for anything. */
  credits() {
    setMusicContext('menu');
    const link = (href: string, text: string) => `<a href="${href}" target="_blank" rel="noopener noreferrer">${text}</a>`;
    this.show(`<div class="screen">${this.titlebar('Créditos y aviso legal', 'Menú')}<div class="panel legal">
      <h3>InaZurvivors — Proyecto de fans no oficial</h3>
      <p>InaZurvivors es un fangame independiente y gratuito desarrollado por AstraStorm17, inspirado en la franquicia Inazuma Eleven.</p>
      <p>Inazuma Eleven, sus personajes, nombres, diseños, logotipos, música y materiales originales son propiedad de LEVEL-5 y/o sus respectivos titulares.</p>
      <p>Este proyecto no está afiliado, patrocinado ni aprobado por LEVEL-5.</p>
      <p>El código y los materiales originales desarrollados específicamente para InaZurvivors pertenecen a sus respectivos autores.</p>
      <p>Los recursos gráficos y sonoros de terceros conservan sus derechos originales.</p>
      <p>La inclusión de créditos y este aviso no implica la existencia de una licencia o autorización para distribuir material protegido.</p>
      <h3>Desarrollo</h3>
      <ul><li>Diseño, dirección y desarrollo: AstraStorm17.</li><li>Programación con asistencia de Claude (Anthropic).</li></ul>
      <h3>Recursos de terceros y su procedencia</h3>
      <ul>
        <li>Futbolistas, retratos, cuerpos, escudos, objetos, arenas y música: Inazuma Eleven 2 (LEVEL-5), extraídos de una copia propia del juego.</li>
        <li>Futbolistas, retratos y escudos de las sagas Mundial, GO, Chrono Stones, Galaxy, Ares y Orion: Inazuma Eleven 3 (LEVEL-5) con el parche de fans «Great Road of Heroes 3.1». Autoría del parche: no verificada; base y añadidos del parche no se pueden separar.</li>
        <li>Máquina de cápsulas: gráficos de Inazuma Eleven 3 (LEVEL-5), hoja publicada en ${link('https://www.spriters-resource.com/', 'The Spriters Resource')}, ripeada por Avegaille.</li>
        <li>Nombres en español e inglés de parte de las técnicas: ${link('https://inazuma-eleven.fandom.com/', 'Inazuma Eleven Wiki')} (Fandom), contenido bajo ${link('https://www.fandom.com/licensing', 'CC BY-SA')}.</li>
        <li>Motor: ${link('https://phaser.io/', 'Phaser')} © Richard Davey, Phaser Studio Inc. (${link('https://opensource.org/license/mit', 'licencia MIT')}). Herramienta: ${link('https://vite.dev/', 'Vite')} (MIT).</li>
        <li>Fuente: Press Start 2P © The Press Start 2P Project Authors (${link('https://openfontlicense.org/', 'SIL Open Font License 1.1')}), vía Fontsource.</li>
        <li>Creados para InaZurvivors: efectos de supertécnicas, efectos de sonido, iconos de elemento, orbes, música «Generada» e interfaz.</li>
      </ul>
      <h3>Redes sociales</h3><p>${this.tiktokLink('Síguenos en TikTok')}</p>
      <h3>Enlaces oficiales</h3><p>${link('https://www.level5.co.jp/', 'LEVEL-5')} · ${link('https://www.inazuma.jp/', 'Inazuma Eleven')}</p>
      <h3>Privacidad</h3><p>Sin cuenta, InaZurvivors no recopila datos personales: tu progreso se guarda solo en este navegador. Con cuenta online (Google) se guardan tu correo de Google (privado), tu nombre, tus marcas y tu guardado. <a href="privacidad.html" target="_blank" rel="noopener">Privacidad y condiciones</a></p>
      <p class="note">${esc(VERSION_LABEL)} · compilación interna ${esc(BUILD)}</p></div></div>`);
    this.on('[data-back]', 'click', () => this.mainMenu());
  }

  options() {
    setMusicContext('menu');
    const s = this.save.settings;
    const seg = (id: string, vals: [string, string][], cur: string) => `<div class="seg" data-seg="${id}">${vals.map(([v, l]) => `<button data-v="${v}" class="${cur === v ? 'on' : ''}">${l}</button>`).join('')}</div>`;
    this.show(`<div class="screen">${this.titlebar('Opciones', 'Menú')}<div class="panel">
      <h3>Sonido</h3>
      <div class="opt-row"><span>Música</span><input type="range" id="mvol" min="0" max="1" step="0.05" value="${s.musicVolume}"></div>
      <div class="opt-row"><span>Efectos</span><input type="range" id="vol" min="0" max="1" step="0.05" value="${s.volume}"></div>
      <div class="opt-row"><span>Silenciar todo</span>${seg('muted', [['0', 'No'], ['1', 'Sí']], s.muted ? '1' : '0')}</div>
      <div class="opt-row"><span>Fuente de música</span>${seg('musicSource', [['local', 'Inazuma Eleven (ROM)'], ['original', 'Generada']], s.musicSource)}</div>
      <div class="note">Ahora suena: ${esc(currentTrack() || '—')}. Por defecto suena la música de Inazuma Eleven exportada de tu copia. «Generada» usa temas creados para este proyecto.</div>
      <h3 style="margin-top:12px">Efectos visuales</h3>
      <div class="opt-row"><span>Partículas</span>${seg('particles', [['completo', 'Completas'], ['reducido', 'Reducidas'], ['desactivado', 'Desactivadas']], s.particles)}</div>
      <div class="opt-row"><span>Sacudida de cámara</span><input type="range" id="shake" min="0" max="1" step="0.05" value="${s.shake}"></div>
      <div class="opt-row"><span>Destellos</span>${seg('flashes', [['1', 'Activados'], ['0', 'Desactivados']], s.flashes ? '1' : '0')}</div>
      <div class="opt-row"><span>Reducir movimiento</span>${seg('reducedMotion', [['0', 'No'], ['1', 'Sí']], s.reducedMotion ? '1' : '0')}</div>
      <div class="opt-row"><span>Números de daño</span>${seg('damageNumbers', [['1', 'Visibles'], ['0', 'Ocultos']], s.damageNumbers ? '1' : '0')}</div>
      <div class="opt-row"><span>Calidad gráfica</span>${seg('quality', [['alta', 'Alta'], ['media', 'Media'], ['baja', 'Baja']], s.quality)}</div>
      <h3 style="margin-top:12px">Pantalla y controles</h3>
      <div class="opt-row"><span>Pantalla completa</span><button class="btn small blue" id="fs">${document.fullscreenElement ? 'Salir' : 'Activar'}</button></div>
      <div class="opt-row"><span>Cámara</span>${seg('camera', [['cerca', 'Cerca'], ['normal', 'Normal'], ['lejos', 'Lejos']], s.camera)}</div>
      <div class="opt-row"><span>Escala de interfaz</span>${seg('uiScale', [['0.85', '85%'], ['1', '100%'], ['1.15', '115%'], ['1.3', '130%']], String(s.uiScale))}</div>
      <div class="opt-row"><span>Movimiento</span>${seg('moveKeys', [['ambos', 'WASD y flechas'], ['wasd', 'Solo WASD'], ['flechas', 'Solo flechas']], s.moveKeys)}</div>
      <div class="opt-row"><span>Idioma</span><span class="note">Español (único disponible por ahora)</span></div>
      <div class="opt-row"><span>Tutorial</span><button class="btn small blue" id="tutagain">Ver otra vez</button></div>
      <h3 style="margin-top:12px">Copia de seguridad</h3>
      <div class="opt-row"><span>Tu progreso</span><div><button class="btn small" id="export">Exportar</button> <button class="btn small blue" id="import">Importar</button><input type="file" id="importfile" accept=".json,application/json" hidden></div></div>
      <h3 style="margin-top:12px">Ayuda</h3>
      <div class="opt-row"><span>¿Algo no funciona?</span><div><button class="btn small" id="optbug">Reportar un bug</button> <button class="btn small blue" id="optadmin" hidden>Panel de bugs</button></div></div>
      <h3 style="margin-top:12px">Empezar de cero</h3>
      <div class="opt-row"><span>Reiniciar progreso</span><button class="btn small" id="resetprog">Reiniciar progreso…</button></div>
      <p class="note">Vuelves a empezar como un jugador nuevo${this.save.onlineName ? `, conservando tu cuenta de Google y tu nombre «${esc(this.save.onlineName)}»` : ''}. No es lo mismo que eliminar la cuenta.</p>
      <p class="note">Controles: WASD/flechas mover · 1/2/3 formación · Esc/P pausa.</p>
      <p class="note">Tu progreso se guarda en este navegador.${onlineConfigured() ? ' Si entras con Google, también en la nube y en todos tus dispositivos.' : ' Usa Exportar/Importar para llevarlo contigo.'}</p></div></div>`);
    this.on('[data-back]', 'click', () => this.mainMenu());
    document.getElementById('mvol')!.addEventListener('input', (e) => { s.musicVolume = Number((e.target as HTMLInputElement).value); this.applyAudio(); this.persist(); });
    document.getElementById('vol')!.addEventListener('input', (e) => { s.volume = Number((e.target as HTMLInputElement).value); this.applyAudio(); this.persist(); });
    document.getElementById('shake')!.addEventListener('input', (e) => { s.shake = Number((e.target as HTMLInputElement).value); this.persist(); });
    document.getElementById('tutagain')!.addEventListener('click', () => this.tutorial());
    document.getElementById('resetprog')!.addEventListener('click', () => this.resetProgressModal());
    document.getElementById('optbug')!.addEventListener('click', () => this.bugReportModal());
    document.getElementById('optadmin')!.addEventListener('click', () => { void this.adminBugs(); });
    if (onlineConfigured() && signedIn()) amIAdmin().then((yes) => { const b = document.getElementById('optadmin'); if (b) b.hidden = !yes; }).catch(() => undefined);
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
      this.toast('Copia exportada');
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
        this.persist();
        this.applyAudio();
        this.toast('Copia importada');
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
      if (key === 'muted') s.muted = v === '1';
      if (key === 'reducedMotion') { s.reducedMotion = v === '1'; this.applyMotion(); }
      if (key === 'uiScale') { s.uiScale = Number(v); this.applyMotion(); }
      if (key === 'quality') s.quality = v as 'alta' | 'media' | 'baja';
      if (key === 'moveKeys') s.moveKeys = v as 'ambos' | 'wasd' | 'flechas';
      if (key === 'camera') s.camera = v as 'cerca' | 'normal' | 'lejos';
      if (key === 'musicSource') { s.musicSource = v as 'original' | 'local'; setMusicSource(s.musicSource); }
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
      ? (this.m.profile?.emblems ?? []).map((e) => ({ id: e.teamId!, html: `<img src="${e.texture}" alt="">`, label: e.name, ok: emblemUnlocked(this.save, e), why: 'Reclama el escudo en la Enciclopedia (3 futbolistas del equipo)' }))
        .sort((a, b) => Number(b.ok) - Number(a.ok))
      : tab === 'coach' ? (this.m.profile?.coaches ?? []).map((e, k) => { const r = coachRequirement(this.save, this.m.roster, k); return { id: e.index!, html: `<img src="${e.texture}" alt="">`, label: e.name, ok: r.ok, why: r.label }; })
        : this.unlockedRoster().map((p) => ({ id: p.id, html: this.mug(p.id, 48), label: p.name, ok: true, why: '' }));
    const got = items.filter((x) => x.ok).length;
    const st = this.save.stats;
    const teams = eligibleTeams(this.m.roster);
    this.show(`<div class="screen">${this.titlebar('Perfil', 'Menú')}
      <div class="panel profile-head">${this.profileIcon(96)}<div style="flex:1">
        <div class="opt-row"><span>Nombre</span><b class="perm-name">${esc(this.save.profile.name)}</b><span class="note">permanente</span></div>
        <div class="opt-row"><span>Equipo favorito</span><select id="pteam"><option value="">Sin elegir</option>${teams.map((t) => `<option value="${esc(t)}" ${this.save.favoriteTeam === t ? 'selected' : ''}>${esc(teamLabel(t))}</option>`).join('')}</select></div>
        <div class="result-grid"><div class="stat"><span class="note">Partidas</span><b>${st.runs}</b></div><div class="stat"><span class="note">Victorias</span><b>${st.wins}</b></div>
        <div class="stat"><span class="note">Eliminaciones</span><b>${st.kills}</b></div><div class="stat"><span class="note">Mejor tiempo</span><b>${fmtTime(st.bestTimeSec)}</b></div>
        <div class="stat"><span class="note">Colección</span><b>${this.unlockedRoster().length}/${this.m.roster.length}</b></div><div class="stat"><span class="note">Fichajes</span><b>${st.pulls}</b></div></div></div></div>
      ${this.accountPanel()}
      <div class="panel"><h3>Icono de perfil</h3><div class="seg" id="tabs">
        <button data-t="emblem" class="${tab === 'emblem' ? 'on' : ''}">Escudos de equipo</button>
        <button data-t="player" class="${tab === 'player' ? 'on' : ''}">Jugadores</button>
        <button data-t="coach" class="${tab === 'coach' ? 'on' : ''}">Entrenadores</button></div>
        <div class="note">${got}/${items.length} desbloqueados${tab === 'player' ? ' (solo aparecen los de tu colección)' : ''}.</div>
        <div class="icon-grid">${items.map((it) => `<button class="iconpick${ic.kind === tab && ic.id === it.id ? ' on' : ''}${it.ok ? '' : ' locked'}" data-id="${it.id}" ${it.ok ? '' : 'disabled'} title="${esc(it.label)}${it.ok ? '' : ` · ${esc(it.why)}`}">${it.html}${it.ok ? '' : '<span class="lockic">🔒</span>'}</button>`).join('')}</div></div></div>`);
    this.on('[data-back]', 'click', () => this.mainMenu());
    document.getElementById('pteam')!.addEventListener('change', (e) => { this.save.favoriteTeam = (e.target as HTMLSelectElement).value || null; this.persist(); });
    this.on('#tabs button', 'click', (_e, el) => this.profile(el.dataset.t as 'emblem' | 'player' | 'coach'));
    this.bindAccount(() => this.profile(tab));
    this.on('.iconpick', 'click', (_e, el) => {
      const it = items.find((x) => x.id === Number(el.dataset.id));
      if (!it?.ok) { sfx('error'); this.toast(it?.why ?? 'Bloqueado'); return; }
      this.save.profile.icon = { kind: tab, id: it.id };
      this.persist();
      this.profile(tab);
    });
  }

  // ------------------------------------------------------------- run
  /** `candidates`: the squad of seven; only they can be recruited during the run (and only their sprites load). */
  startRun(mapId: string, team: RosterEntry[], candidates: RosterEntry[] = team) {
    const map = this.m.maps.find((x) => x.id === mapId)!;
    // a HÉROE brings its exclusive technique as a fifth repertoire entry
    // Fix 1.3: the run plays with the real stats (rarity band, ascension, HÉROE, training), not the raw ones
    const heroed = (p: RosterEntry): RosterEntry => ({ ...(isHero(this.save, p.id) && p.heroTech ? { ...p, techniques: [...p.techniques, p.heroTech] } : p), stats: this.statsOf(p) ?? p.stats });
    const stars: Record<string, number> = {};
    for (const [k, v] of Object.entries(this.save.owned)) stars[k] = v.stars;
    this.hudTeamKey = '';
    this.lastBannerAt = -1;
    this.stopScenes();
    this.lastMusicCtx = 'run';
    setMusicContext('run');
    this.show(`<div class="hud" id="hud"><div class="hurt" id="hurt"></div>
      <div class="vitals cap-panel">
        <div class="cap-crest" title="${esc(this.save.crest ? teamLabel(this.save.crest) : 'InaZurvivors')}"><img src="${this.emblemOf(this.save.crest) || 'logo-192.png'}" alt=""><small>${esc(this.save.crest ? teamLabel(this.save.crest) : 'InaZurvivors')}</small></div>
        <div class="vbars">
          <div class="cap-name"><b>${esc(team[0]?.name ?? 'Capitán')}</b><span>CAPITÁN</span><em class="crit-tag" id="crittag">¡CRÍTICO!</em></div>
          <div class="hp-bar" id="hpbar"><i class="ghost"></i><i class="fill"></i><span></span></div>
          <div class="xp-row"><div class="lv-badge" id="lvbadge"><small>NV</small><b>1</b></div><div class="xp-bar" id="xpbar"><i></i><span id="xptext"></span></div></div>
          <div class="hud-stats"><span id="kills"></span><span class="st-coins" id="runcoins"></span><span class="st-tokens" id="runtokens"></span></div>
        </div></div>
      <div class="res-chips" id="reson"></div>
      <div class="top-right"><div class="clock" id="clock"></div>
        <div class="formation-hud" id="fbtns">${FORMATION_ORDER.map((f) => `<button data-f="${f}" title="${esc(FORMATIONS[f].description)}">${FORMATION_ICON(f, 40)}<span><b>${FORMATIONS[f].key}</b> ${FORMATIONS[f].label}</span></button>`).join('')}</div>
        <div class="fdesc" id="fdesc"></div>
        <button class="btn small blue pausebtn" id="pausebtn">II Pausa</button></div>
      <div class="bossbar" id="boss" style="display:none"><div class="bn"></div><div class="bar boss"><i></i></div></div>
      <canvas class="minimap" id="minimap" width="132" height="100" aria-hidden="true"></canvas><div class="edge-marks" id="marks"></div>
      <div class="altar-hud" id="altar"></div><div class="event-card" id="eventcard"></div><div class="event-result" id="eventresult"></div><div class="buffs" id="buffs"></div><div class="combo-hud" id="combohud"></div><div class="team-hud" id="hudteam"></div><div id="bannerbox"></div><div class="joy" id="joy"><b><i></i></b></div></div>`, 'run-mode');
    bindStick(document.getElementById('joy')!);
    document.getElementById('pausebtn')!.addEventListener('click', () => this.pauseFromHud());
    this.root.querySelectorAll<HTMLElement>('#fbtns button').forEach((b) => b.addEventListener('click', () => this.arena()?.selectFormation(b.dataset.f as FormationId)));
    const init: ArenaInit = {
      rank: this.save.difficulty,
      onPickup: (id, label, info) => {
        if (this.save.seenItems.includes(id)) return;
        this.save.seenItems.push(id);
        this.persist();
        this.toast(`Nuevo: ${label}. ${info}`, 4500);
      },
      asc: Object.fromEntries(candidates.map((p) => [String(p.id), { ...ascMultipliers(this.save, p), hero: isHero(this.save, p.id) }])),
      manifest: this.m, map, team: team.map(heroed), unlocked: candidates.filter((p) => this.owned(p.id)).map(heroed), stars, settings: this.save.settings,
      perks: (() => { const e = applyGear(perkEffects(this.save), this.save, this.gear); kitBonus(this.save.kit, this.m.roster).apply(e); return e; })(),
      kitTeam: this.save.kit || 'Raimon', shop: this.save.shop, mastery: this.save.mastery, loadout: this.save.loadout, kit: this.m.kits?.[this.save.kit] ?? null, formation: (this.save.formation as FormationId) in FORMATIONS ? this.save.formation as FormationId : 'equilibrada',
      hooks: {
        hud: (s) => this.renderHud(s),
        markers: (m) => this.renderMarkers(m),
        event: (r) => this.eventCard(r),
        combo: (c) => this.comboUnlock(c),
        levelUp: (cards, rerolls, reroll, level) => this.levelUpModal(cards, rerolls, reroll, level),
        end: (r) => this.results(r),
        pause: () => this.pauseModal(),
        bossDown: () => this.bossDownModal(),
      },
    };
    this.runInfo = { map: map.name, difficulty: this.save.difficulty };
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
      box.innerHTML = `<div class="panel" style="max-width:560px;text-align:center"><div class="result-banner win">¡JEFE DERROTADO!</div>
        <p>La victoria ya es tuya. ¿Terminas aquí o sigues sobreviviendo?</p>
        <div class="choice2"><button class="btn big" id="bd-end">TERMINAR PARTIDA<small>Victoria y recompensas ahora</small></button>
        <button class="btn big blue" id="bd-go">CONTINUAR SOBREVIVIENDO<small>Cinco fases hasta el Infierno. Cada minuto jugado da recompensa y los jefes regresan.</small></button></div>
        <p class="note">Récord actual: ${fmtTime(this.save.stats.bestEndless ?? 0)} en supervivencia infinita. Lo ganado se conserva al caer o al retirarte desde Pausa.</p></div>`;
      this.root.appendChild(box);
      const done = (c: 'end' | 'continue') => { box.remove(); resolve(c); };
      box.querySelector('#bd-end')!.addEventListener('click', () => done('end'));
      box.querySelector('#bd-go')!.addEventListener('click', () => done('continue'));
    });
  }

  private pauseFromHud() {
    if (this.game.scene.isActive('Arena')) {
      this.arena()!.scene.pause();
      this.pauseModal();
    }
  }

  private lastHudHp: number | null = null;
  private renderHud(s: HudState) {
    const ch = document.getElementById('combohud');
    if (ch) {
      const html = s.combos.map((c) => `<div class="combo-chip${c.cd <= 0.02 ? ' ready' : ''}"><b>${esc(c.name)}</b> Nv ${c.level}<i style="width:${Math.round((1 - c.cd) * 100)}%"></i></div>`).join('');
      if (ch.innerHTML !== html) ch.innerHTML = html;
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
    (document.querySelector('#xpbar i') as HTMLElement).style.width = pct(s.xp, s.xpNext);
    document.getElementById('xptext')!.textContent = `${s.xp} / ${s.xpNext} EXP`;
    const badge = document.getElementById('lvbadge')!;
    if (badge.lastElementChild!.textContent !== String(s.level)) {
      badge.lastElementChild!.textContent = String(s.level);
      for (const el of [badge, document.getElementById('xpbar')!]) { el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); }
    }
    const stat = (id: string, text: string) => {
      const el = document.getElementById(id)!;
      if (el.textContent === text) return;
      el.textContent = text;
      el.classList.remove('pop');
      void el.offsetWidth;
      el.classList.add('pop');
    };
    stat('runcoins', s.runCoins ? `◉ +${s.runCoins}` : '');
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
    document.getElementById('clock')!.textContent = s.endless ? `∞ ${fmtTime(s.endless.sec)} · ${s.endless.phase}` : `${fmtTime(s.timeSec)} / ${fmtTime(s.durationSec)}`;
    document.getElementById('kills')!.textContent = `✖ ${s.kills}`;
    this.root.querySelectorAll<HTMLElement>('#fbtns button').forEach((b) => b.classList.toggle('on', b.dataset.f === s.formation));
    const F = FORMATIONS[s.formation];
    const dmg = Math.round((F.damageMult - 1) * 100), taken = Math.round((F.damageTakenMult - 1) * 100);
    document.getElementById('fdesc')!.textContent = dmg || taken ? `Daño ${dmg >= 0 ? '+' : ''}${dmg}% · recibido ${taken >= 0 ? '+' : ''}${taken}%` : 'Sin modificadores';
    const boss = document.getElementById('boss')!;
    boss.style.display = s.boss ? '' : 'none';
    if (s.boss) {
      boss.querySelector('.bn')!.textContent = s.boss.rival ? `RIVAL · ${s.boss.name}` : `${s.boss.title.toUpperCase()} · ${s.boss.name} · FASE ${s.boss.phase + 1}`;
      boss.querySelector('i')!.setAttribute('style', `width:${pct(s.boss.hp, s.boss.maxHp)}`);
    }
    const want = s.boss ? 'boss' : s.timeSec > s.durationSec * 0.5 ? 'run2' : 'run';
    if (want !== this.lastMusicCtx) { this.lastMusicCtx = want; setMusicContext(want); }
    const alt = document.getElementById('altar')!;
    this.renderEvent(s, alt);
    const labels: Record<string, string> = { escudo: 'Escudo', xp: 'Exp ×2', dano: 'Daño +50%', recarga: 'Recarga -40%', velocidad: 'Velocidad +30%' };
    document.getElementById('buffs')!.innerHTML = s.buffs.map((b) => `<span class="buff b-${b.id}"><i style="width:${b.left / b.total * 100}%"></i>${labels[b.id] ?? DROPS.find((d) => d.id === b.id)?.label ?? ''}</span>`).join('');
    document.getElementById('hurt')!.classList.toggle('on', this.save.settings.flashes && s.now - s.hurtAt < 0.12);
    if (s.formationChangedAt > 0 && s.formationChangedAt !== this.lastBannerAt) {
      this.lastBannerAt = s.formationChangedAt;
      document.getElementById('bannerbox')!.innerHTML = `<div class="banner">${FORMATION_ICON(s.formation, 34)} FORMACIÓN ${F.label.toUpperCase()}</div>`;
    }
    const key = s.team.map((t) => t.id).join(',');
    const teamEl = document.getElementById('hudteam')!;
    if (key !== this.hudTeamKey) {
      this.hudTeamKey = key;
      const slots = Array.from({ length: MAX_TEAM }, (_, i) => s.team[i]);
      teamEl.innerHTML = slots.map((t, i) => {
        if (!t) return '<div class="plate empty"><span>Ficha al subir<br>de nivel</span></div>';
        const p = this.byId.get(t.id)!;
        return `<div class="plate${i === 0 ? ' cap' : ''}" data-m="${t.id}" style="--rc:${RARITY_COLOR[p.rarity]};--ec:${ELEMENT_COLOR[String(p.element)] ?? '#ccc'}">
          <div class="pl-head"><span class="pl-mug">${this.mug(t.id, 40)}</span>${i === 0 ? '<span class="pl-c">C</span>' : ''}
          <span class="pl-elem" title="${esc(p.element)}">${elementIcon(String(p.element), 18)}</span>
          <span class="pl-name">${esc(p.name)}<small>${POS_LABEL[p.position]} · ${esc(p.element)}</small></span></div>
          ${t.techs.map((_, k) => `<div class="pl-tech" data-k="${k}"><span class="pl-icon"><i class="cd"></i></span><span class="pl-tn"></span><span class="pl-pips"></span></div>`).join('')}</div>`;
      }).join('');
    }
    s.team.forEach((t) => {
      const el = teamEl.querySelector(`[data-m="${t.id}"]`);
      if (!el) return;
      el.querySelectorAll<HTMLElement>('.pl-tech').forEach((c) => {
        const k = Number(c.dataset.k);
        const tc = t.techs[k];
        const sig = tc ? `${tc.name}|${tc.level}|${tc.evolution}` : '';
        if (c.dataset.sig !== sig) {
          c.dataset.sig = sig;
          c.classList.toggle('free', !tc);
          (c.querySelector('.pl-tn') as HTMLElement).textContent = tc ? `${tc.name}${tc.evolution ? ` ${tc.evolution}` : ''}` : 'Ranura libre';
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
          <p>${esc(i.description)}</p><dl><dt>Objetivo</dt><dd>${esc(a.task)}${a.goal > 1 ? ` (${a.goal})` : ''}</dd><dt>Tiempo</dt><dd>${Math.ceil(a.timeLeft)} s</dd><dt>Premio</dt><dd>${esc(ALTAR_REWARD[a.type])}</dd><dt>Fallas si</dt><dd>${esc(i.fail)}</dd></dl>
          <button class="btn" id="evgo">Aceptar${document.body.classList.contains('touch') ? '' : ' <kbd>E</kbd>'}</button>`;
        card.querySelector('#evgo')!.addEventListener('click', () => this.arena()?.acceptAltar());
      }
    }
    const text = !a ? '' : a.state === 'idle' ? `${ALTAR_ICON[a.type]} ${a.label} · a ${a.dist} m · ${Math.ceil(a.waitLeft)} s` : '';
    if (!a || a.state === 'idle') { if (alt.textContent !== text) alt.textContent = text; }
    else {
      const seconds = ALTAR_MODE[a.type] === 'tiempo' || ALTAR_MODE[a.type] === 'tiempo-dentro';
      const prog = seconds ? `${Math.floor(a.progress)}/${Math.ceil(a.goal)} s` : `${Math.floor(a.progress)}/${a.goal}`;
      const html = `<b>${ALTAR_ICON[a.type]} ${esc(a.label)}</b><span class="ev-t">${Math.ceil(a.timeLeft)} s</span><div class="ev-goal">${esc(a.task)} · ${prog}</div><div class="ev-bar"><i style="width:${Math.min(100, a.progress / a.goal * 100)}%"></i></div><small>Falla si: ${esc(ALTAR_INFO[a.type].fail)}</small>`;
      if (alt.innerHTML !== html) alt.innerHTML = html;
    }
    alt.classList.toggle('on', !!a);
    alt.classList.toggle('active', a?.state === 'active');
  }

  private eventCard(r: { ok: boolean; title: string; detail: string }) {
    const box = document.getElementById('eventresult');
    if (!box) return;
    box.className = `event-result show ${r.ok ? 'ok' : 'bad'}`;
    box.innerHTML = `<b>${r.ok ? '¡DESAFÍO SUPERADO!' : 'Desafío fallido'}</b><span>${esc(r.title)}</span><em>${esc(r.detail)}</em>`;
    window.clearTimeout(this.eventTimer);
    this.eventTimer = window.setTimeout(() => { box.className = 'event-result'; }, 3200);
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
    if (c.kind === 'recruit') {
      const p = this.byId.get(c.playerId)!;
      return `<button class="lvcard recruit" data-i="${i}" style="--rc:${RARITY_COLOR[p.rarity]}"><div class="lv-ribbon">¡NUEVO FICHAJE!</div>
        <div class="lv-type">FICHAJE · ${this.rar(p)}</div><div class="lv-art">${this.mug(p.id, 128)}<span class="minisprite">${charCanvas(p.id, 2, 12)}</span></div>
        <div class="lv-name">${esc(p.name)}</div><div class="lv-sub">${POS_LABEL[p.position]} · ${this.elem(p)}</div>
        <div class="lv-techs">${p.techniques.slice(0, 1).map((t) => `<div>${this.icon(ICON.manual[t.type], 1.5)} ${esc(t.name)} <small>${TYPE_LABEL[t.type]}</small></div>`).join('')}</div></button>`;
    }
    if (c.kind === 'upgrade') {
      const p = this.byId.get(c.playerId)!;
      const t = p.techniques[c.tech];
      const pips = Array.from({ length: MAX_TECH_LEVEL }, (_, k) => `<i class="${k < c.toLevel - 1 ? 'on' : k === c.toLevel - 1 ? 'new' : ''}"></i>`).join('');
      const evo = evolvesAt(t, c.toLevel - 1);
      const now = evolutionLabel(t, c.toLevel - 1);
      return `<button class="lvcard upgrade${evo ? ' evolves' : ''}" data-i="${i}" style="--rc:${RARITY_COLOR[p.rarity]}">${evo ? `<div class="lv-ribbon">¡EVOLUCIÓN ${esc(evo)}!</div>` : ''}
        <div class="lv-type">MEJORA · ${TYPE_LABEL[t.type].toUpperCase()}</div>
        <div class="lv-art">${this.mug(p.id, 96)}${this.techBadge(t)}</div>
        <div class="lv-name">${esc(t.name)}${now ? ` ${esc(now)}` : ''}</div><div class="lv-sub">${esc(p.name)}</div>${this.techChips(t)}
        <div class="lv-level">${esc(evolutionLabel(t, c.toLevel - 1) || 'Base')} <span>»</span> <b>${esc(evolutionLabel(t, c.toLevel) || `Nv ${c.toLevel}`)}</b><span class="pips">${pips}</span></div>
        ${this.statDiff(t, c.toLevel - 1)}</button>`;
    }
    if (c.kind === 'learn') {
      const p = this.byId.get(c.playerId)!;
      const t = p.techniques[c.tech];
      return `<button class="lvcard learn" data-i="${i}" style="--rc:${RARITY_COLOR[p.rarity]}"><div class="lv-ribbon">SEGUNDA TÉCNICA</div>
        <div class="lv-type">APRENDER · ${TYPE_LABEL[t.type].toUpperCase()}</div>
        <div class="lv-art">${this.mug(p.id, 96)}${this.techBadge(t)}</div>
        <div class="lv-name">${esc(t.name)}</div><div class="lv-sub">${esc(p.name)} · poder ${t.power} · Nv 1/${MAX_TECH_LEVEL}</div>${this.techChips(t)}
        <div class="lv-desc">${esc(t.description)}</div></button>`;
    }
    if (c.kind === 'combo') {
      const d = COMBOS.find((x) => x.id === c.id)!;
      const ids = d.needs.map((n) => this.m.roster.find((p) => p.name === n.player)?.id).filter((x): x is number => x !== undefined);
      const t = { id: 0, name: d.name, description: '', type: 'tiro', element: d.element, power: d.power, cost: 0, unlockLevel: 1, growth: null } as unknown as Technique;
      return `<button class="lvcard combo" data-i="${i}" style="--rc:#ffe24a"><div class="lv-ribbon">${c.toLevel === 1 ? '¡TÉCNICA COMBINADA!' : 'MEJORA COMBINADA'}</div>
        <div class="lv-type">COMBINADA · RANURA ESPECIAL</div>
        <div class="lv-art combo-art">${ids.map((id) => this.mug(id, 64)).join('')}${this.techBadge(t, 2)}</div>
        <div class="lv-name">${esc(d.name)}${c.toLevel > 1 ? ` Nv ${c.toLevel}` : ''}</div><div class="lv-sub">${esc(d.needs.map((n) => n.player).join(' + '))}</div>${this.techChips(t)}
        <div class="lv-desc">Se lanza sola mientras estén todos en el campo. No ocupa ninguna ranura de técnica.</div></button>`;
    }
    if (c.kind === 'stat' || c.kind === 'passive') {
      const d = modDef(c.id)!;
      return `<button class="lvcard ${c.kind}" data-i="${i}"><div class="lv-type">${c.kind === 'stat' ? 'ESTADÍSTICA DEL EQUIPO' : 'OBJETO PASIVO'}</div>
        <div class="lv-art">${this.icon(d.icon, 5)}</div><div class="lv-name">${esc(d.label)}</div><div class="lv-sub">${esc(d.description)}</div></button>`;
    }
    return `<button class="lvcard heal" data-i="${i}"><div class="lv-type">RECUPERACIÓN</div><div class="lv-art">${this.icon(ICON.riceBall, 5)}</div>
      <div class="lv-name">Bola de arroz</div><div class="lv-sub">Recupera ${Math.round(c.amount * 100)}% de la vida del capitán</div></button>`;
  }

  private levelUpModal(cards: Card[], rerolls: number, reroll: () => Card[], level: number): Promise<Card> {
    return new Promise((resolve) => {
      let chosen = false;
      const shownAt = performance.now();
      const pick = (el: HTMLElement, cs: Card[]) => {
        if (chosen) return;
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
          <div class="lv-title"><span>${level ? `¡NIVEL ${level}!` : '¡RECOMPENSA!'}</span><small>Elige una mejora para tu equipo</small></div>
          <div class="lv-cards">${cs.map((c, i) => this.cardHtml(c, i)).join('')}</div>
          <div class="lv-bottom"><button class="btn big blue reroll" id="reroll" ${left > 0 ? '' : 'disabled'}>⟳ CAMBIAR CARTAS <span class="rr-count">${left}</span></button></div></div>`);
        mountPreviews();
        const modal = document.getElementById('lvl')!;
        current = cs;
        modal.querySelectorAll<HTMLElement>('.lvcard').forEach((el) => {
          el.insertAdjacentHTML('afterbegin', `<kbd class="lv-key">${Number(el.dataset.i) + 1}</kbd>`);
          el.addEventListener('click', () => pick(el, cs));
        });
        document.getElementById('reroll')?.addEventListener('click', () => {
          const next = reroll();
          if (next.length) render(next, left - 1, false);
        });
      };
      render(cards, rerolls, true);
    });
  }

  private pauseModal() {
    document.getElementById('pause')?.remove();
    const s = this.save.settings;
    this.root.insertAdjacentHTML('beforeend', `<div class="modal" id="pause"><div class="panel" style="max-width:560px;text-align:center">
      <div class="lvl-title">PAUSA</div>
      <p><button class="btn big" id="resume">▶ Continuar</button></p>
      <h3>Formación</h3><div class="formation-pick">${FORMATION_ORDER.map((f) => this.formationCard(f, false)).join('')}</div>
      ${(() => { const b = this.arena()?.buildStats(); return b ? `<h3 style="margin-top:12px">Tu capitán ahora</h3><div class="build-stats">
        <span>Daño recibido <b>${b.damageTakenPct}%</b></span><span>Recarga <b>${b.cooldownPct}%</b></span><span>Área <b>${b.areaPct}%</b></span>
        <span>Suerte <b>+${b.luckPct}%</b></span><span>Recogida <b>${b.pickupPx} px</b> (máx. 130)</span><span>Revivir <b>${b.revives}</b></span></div>
        <p class="note">Solo el capitán recibe daño: tus compañeros son invulnerables.</p>` : ''; })()}
      <h3 style="margin-top:12px">Efectos</h3><div class="seg" id="pp">${(['completo', 'reducido', 'desactivado'] as ParticleLevel[]).map((v) =>
        `<button data-v="${v}" class="${s.particles === v ? 'on' : ''}">Partículas ${v}</button>`).join('')}</div>
      <p><button class="btn small blue" id="toggleshake">Sacudida: ${s.shake > 0 ? 'sí' : 'no'}</button>
        <button class="btn small blue" id="toggleflash">Destellos: ${s.flashes ? 'sí' : 'no'}</button>
        <button class="btn small blue" id="togglemute">Sonido: ${s.muted ? 'no' : 'sí'}</button></p>
      <p><button class="btn small blue" id="pausebug">Reportar un bug</button></p>
      <p><button class="btn blue" id="quit">Abandonar partida</button></p><p class="note">Al abandonar conservas las monedas ganadas.</p></div></div>`);
    const close = () => { document.getElementById('pause')?.remove(); this.game.scene.resume('Arena'); };
    document.getElementById('resume')!.addEventListener('click', close);
    this.on('#pause .fcard', 'click', (_e, el) => { this.arena()?.selectFormation(el.dataset.f as FormationId); close(); });
    this.on('#pp button', 'click', (_e, el) => { s.particles = el.dataset.v as ParticleLevel; this.persist(); this.pauseModal(); });
    document.getElementById('toggleshake')!.addEventListener('click', () => { s.shake = s.shake > 0 ? 0 : 0.35; this.persist(); this.pauseModal(); });
    document.getElementById('toggleflash')!.addEventListener('click', () => { s.flashes = !s.flashes; this.persist(); this.pauseModal(); });
    document.getElementById('togglemute')!.addEventListener('click', () => { s.muted = !s.muted; this.applyAudio(); this.persist(); this.pauseModal(); });
    document.getElementById('pausebug')!.addEventListener('click', () => this.bugReportModal());
    document.getElementById('quit')!.addEventListener('click', () => {
      document.getElementById('pause')?.remove();
      this.game.scene.resume('Arena');
      this.arena()?.forceEnd();
    });
  }

  private results(r: RunResult & { level: number }) {
    document.getElementById('lvl')?.remove();
    document.getElementById('pause')?.remove();
    const effects = perkEffects(this.save);
    const { rewards, total, records, tokens, tokenTotal, training, trainTotal } = applyRun(this.save, r, effects.coinMult, effects.rewardMult, effects.extraTokens);
    const cap = this.byId.get(r.teamIds?.[0] ?? -1);
    r.captainEra = cap ? eraOf(cap) : undefined;
    r.favoriteOnPitch = (r.teamIds ?? []).filter((id) => this.save.favoriteTeam && this.byId.get(id)?.teams.includes(this.save.favoriteTeam)).length;
    recordRun(this.save, r);
    recordMastery(this.save, r.techById ?? {});
    const runId = r.runId ?? `${Date.now()}`;
    const best = recordBest(this.save, runId, { map: r.mapId, rank: r.rank ?? 'C', time: Math.floor(r.timeSec), damage: r.damage ?? 0, captainId: r.captainId ?? 0, at: new Date().toISOString() });
    if (best) records.push('ranking');
    if (r.victory) recordTriumph(this.save, { runId, at: new Date().toISOString(), map: r.mapId, rank: r.rank ?? 'C', team: r.teamIds ?? (r.captainId ? [r.captainId] : []),
      time: Math.floor(r.timeSec), kills: r.kills, damage: r.damage ?? 0, endless: Math.floor(r.endlessSec ?? 0) });
    this.persist();
    if (onlineConfigured() && signedIn() && this.save.onlineName) {
      submitScore(runId, r.mapId, r.rank ?? 'C', r.timeSec, r.damage ?? 0, r.captainId ?? 0)
        .then((res) => this.toast(res === 'duplicate' ? 'Esta partida ya estaba en el ranking' : 'Marca enviada al ranking global'))
        .catch((err: Error) => this.toast(`Ranking: ${err.message}`, 4000));
    }
    this.persist();
    const pending = pendingClaims(this.save);
    const map = this.m.maps.find((x) => x.id === r.mapId)!;
    window.setTimeout(() => this.game.scene.stop('Arena'), 0);
    setMusicContext('menu');
    // what the run was: everything here comes from the result already saved above, the animation only shows it
    const team = (r.teamIds ?? []).map((id) => this.byId.get(id)).filter((x): x is RosterEntry => !!x);
    const uses = r.techById ?? {};
    const usesOf = (x: RosterEntry) => x.techniques.reduce((n, t) => n + (uses[String(t.id)] ?? 0), 0);
    const mvp = [...team].sort((a, b) => usesOf(b) - usesOf(a))[0];
    const techs = Object.entries(uses).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([id, n]) => ({ name: team.flatMap((x) => x.techniques).find((t) => String(t.id) === id)?.name ?? '', n })).filter((t) => t.name);
    const owned = this.unlockedRoster().length;
    const recName: Record<string, string> = { tiempo: 'Mejor tiempo', eliminaciones: 'Más eliminaciones', nivel: 'Mayor nivel', ranking: 'Nueva mejor marca', infinito: 'Récord en infinito' };
    const stat = (label: string, value: string, rec: boolean, i: number) => `<div class="stat res-in${rec ? ' rec' : ''}" style="--d:${250 + i * 110}ms"><span class="note">${label}</span><b>${value}</b>${rec ? '<em>¡RÉCORD!</em>' : ''}</div>`;
    const crest = this.emblemOf(this.save.crest);
    const inf = (r.endlessSec ?? 0) > 0;
    this.show(`<div class="screen res-screen ${r.victory ? 'res-win' : 'res-lose'}" id="resroot"><button class="btn small blue res-skip" id="resskip">Saltar ▶▶</button>
      <div class="res-head">${crest ? `<img class="res-crest" src="${crest}" alt="">` : ''}<div class="result-banner ${r.victory ? 'win' : 'lose'}">${r.victory ? '¡VICTORIA!' : 'FIN DE LA PARTIDA'}</div></div>
      <div class="res-squad">${team.map((x, i) => `<span class="res-in${x === mvp ? ' mvp' : ''}" style="--d:${i * 90}ms">${this.mug(x.id, 56)}${x === mvp ? '<small>MVP</small>' : ''}</span>`).join('')}</div>
      <div class="panel" style="max-width:820px;margin:0 auto"><h3>${esc(map.name)} · ${RANKS[r.rank ?? 'C'].label}${r.victory ? ' · superada' : ''}</h3>
      <div class="result-grid">${stat('Tiempo', fmtTime(r.timeSec), records.includes('tiempo'), 0)}${stat('Eliminaciones', String(r.kills), records.includes('eliminaciones'), 1)}
        ${stat('Daño', (r.damage ?? 0).toLocaleString('es'), false, 2)}${stat('Nivel', String(r.level), records.includes('nivel'), 3)}${stat('Minijefes', String(r.minibosses), false, 4)}</div>
      ${(() => { const c = deathCause(r.death); return c ? `<div class="res-death res-in" style="--d:700ms"><b>${r.victory ? 'Fin de la supervivencia infinita' : 'Causa de la derrota'}</b><span>${esc(c.line)}</span>
        <span>Último golpe: ${r.death!.dmg} de daño a los ${fmtTime(r.death!.at)} · Sobreviviste ${fmtTime(r.timeSec)}</span><span class="note">Consejo: ${esc(c.tip)}</span></div>` : ''; })()}
      ${inf ? `<div class="res-inf res-in" style="--d:800ms"><b>Supervivencia infinita</b><span>Tiempo extra ${fmtTime(r.endlessSec ?? 0)} · Fase alcanzada: ${esc(r.endlessPhase ?? '')} · Jefes adicionales: ${r.endlessBosses ?? 0}</span><span>Recompensas del infinito: ${r.endlessCoins ?? 0} monedas y ${r.endlessTokens ?? 0} fichas${records.includes('infinito') ? ' · ¡Récord personal!' : ''}</span><span id="resrank"></span></div>` : ''}
      ${mvp ? `<div class="res-mvp res-in" style="--d:900ms"><span>Mejor jugador: <b>${esc(mvp.name)}</b> (más técnicas lanzadas)</span>${techs.length ? `<span>Técnicas más usadas: ${techs.map((t) => `${esc(t.name)} ×${t.n}`).join(' · ')}</span>` : ''}</div>` : ''}
      ${records.length ? `<div class="res-recs res-in" style="--d:1000ms">${records.map((x) => `<span>★ ${recName[x] ?? x}</span>`).join('')}</div>` : ''}
      <div class="reward-cols"><table class="rewards">${rewards.map((x, i) => `<tr class="rrow" style="--d:${1000 + i * 110}ms"><td>${esc(x.label)}</td><td>+${x.coins}</td></tr>`).join('')}
        <tr class="rrow total" style="--d:${1000 + rewards.length * 110}ms"><td><b>Monedas</b></td><td><b id="tcoins">+0</b></td></tr></table>
      <table class="rewards tok">${tokens.map((x, i) => `<tr class="rrow" style="--d:${1000 + i * 110}ms"><td>${esc(x.label)}</td><td>+${x.coins}</td></tr>`).join('')}
        <tr class="rrow total" style="--d:${1000 + tokens.length * 110}ms"><td><b>Fichas de Fichaje</b></td><td><b id="ttokens">+0</b></td></tr></table>
      ${trainTotal ? `<table class="rewards trn">${training.map((x, i) => `<tr class="rrow" style="--d:${1000 + i * 110}ms"><td>${esc(x.label)}</td><td>+${x.coins}</td></tr>`).join('')}
        <tr class="rrow total" style="--d:${1000 + training.length * 110}ms"><td><b>Fichas de entrenamiento</b></td><td><b>+${trainTotal}</b></td></tr></table>` : ''}</div>
      <div class="result-wallet"><span class="tokens">${this.save.tokens - tokenTotal}</span><span class="coins">${this.save.coins - total}</span></div>
      <p class="note">Colección: ${owned} de ${this.m.roster.length} futbolistas · Una tirada cuesta ${PULL_COST} fichas</p>
      ${pending ? `<p class="newtag">¡Tienes ${pending} ${pending === 1 ? 'misión' : 'misiones'} por cobrar!</p>` : ''}
      <p style="text-align:center"><button class="btn big" id="again">Jugar otra vez</button> <button class="btn blue" id="menu">Menú</button></p></div></div>`);
    if (r.victory) { sfx('legend'); if (this.save.settings.particles !== 'desactivado') confetti(); } else sfx('reveal');
    if (inf && onlineConfigured() && signedIn() && this.save.onlineName) {
      window.setTimeout(() => { void myPosition({ map: r.mapId, rank: r.rank ?? 'C', order: 'score' }).then((m) => { const el = document.getElementById('resrank'); if (el && m) el.textContent = `Posición en el ranking de esta arena: #${m.pos}`; }).catch(() => undefined); }, 1500);
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
