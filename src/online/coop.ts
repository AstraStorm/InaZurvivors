/**
 * pre-2.0: the co-op link between two players (WebRTC, peer to peer).
 *
 * Signalling goes through the coop_* RPCs instead of a Realtime socket: the guest sends ONE offer and the host ONE answer,
 * each carrying its ICE candidates already gathered (no trickle), so a connection costs a handful of requests.
 * Two data channels: «ev» ordered and reliable (events: techniques, level-ups, the end), «st» unordered without
 * retransmits (state snapshots: a lost one is replaced by the next). The host simulates, the guest draws.
 */
import { tr } from '../i18n/i18n';
import { coopCreate, coopIceServers, coopJoin, coopMark, coopPoll, coopSignal } from './client';

/** public STUN servers (no account): enough for most home networks; the TURN relay (Cloudflare) is added per room */
const ICE: RTCIceServer[] = [{ urls: ['stun:stun.cloudflare.com:3478', 'stun:stun.l.google.com:19302'] }];
const POLL_MS = 1000;
const CONNECT_TIMEOUT_MS = 30000;
const GATHER_MAX_MS = 4000;
const PING_MS = 1000;

export type CoopRole = 'host' | 'guest';
export type CoopMsg = { t: string; [k: string]: unknown };

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** waits for every local ICE candidate (or GATHER_MAX_MS) so the description travels complete */
function gathered(pc: RTCPeerConnection) {
  if (pc.iceGatheringState === 'complete') return Promise.resolve();
  return new Promise<void>((done) => {
    const t = setTimeout(done, GATHER_MAX_MS);
    pc.addEventListener('icegatheringstatechange', () => { if (pc.iceGatheringState === 'complete') { clearTimeout(t); done(); } });
  });
}
const opened = (ch: RTCDataChannel) => ch.readyState === 'open' ? Promise.resolve() : new Promise<void>((done, fail) => {
  ch.addEventListener('open', () => done(), { once: true });
  ch.addEventListener('close', () => fail(new Error('canal cerrado')), { once: true });
});

export class CoopLink {
  readonly pc: RTCPeerConnection;
  private ev: RTCDataChannel | null = null;
  private st: RTCDataChannel | null = null;
  private pingTimer = 0;
  private closed = false;
  /** round trip in ms (median of the last few pings), 0 until measured */
  rtt = 0;
  private rtts: number[] = [];
  onEvent: (m: CoopMsg) => void = () => {};
  onState: (data: ArrayBuffer) => void = () => {};
  onClose: (why: string) => void = () => {};

  private constructor(readonly role: CoopRole, readonly code: string, public partner: string, relay: RTCIceServer[]) {
    this.pc = new RTCPeerConnection({ iceServers: [...ICE, ...relay] });
    this.pc.addEventListener('connectionstatechange', () => {
      if (this.pc.connectionState === 'failed' || this.pc.connectionState === 'closed') this.end(tr('conexión perdida'));
    });
  }

  /** the host's side: a room code to share, then the link once the guest arrives */
  static async host(onCode: (code: string) => void, abort?: AbortSignal): Promise<CoopLink> {
    const code = await coopCreate();
    onCode(code);
    const deadline = Date.now() + 15 * 60_000; // the room lives 15 minutes
    for (;;) {
      if (abort?.aborted) { void coopMark(code, 'cerrada').catch(() => undefined); throw new Error('cancelado'); }
      if (Date.now() > deadline) throw new Error(tr('La sala caducó sin que nadie entrara'));
      const r = await coopPoll(code).catch(() => null);
      if (r?.status === 'cerrada') throw new Error(tr('La sala se cerró'));
      if (r?.offer) {
        const link = new CoopLink('host', code, r.guest_name ?? 'Invitado', await coopIceServers(code));
        const chans = new Promise<void>((done) => {
          let n = 0;
          link.pc.addEventListener('datachannel', (e) => { link.adopt(e.channel); if (++n === 2) done(); });
        });
        await link.pc.setRemoteDescription({ type: 'offer', sdp: r.offer });
        await link.pc.setLocalDescription(await link.pc.createAnswer());
        await gathered(link.pc);
        await coopSignal(code, 'answer', link.pc.localDescription!.sdp);
        await link.ready(chans);
        void coopMark(code, 'conectada').catch(() => undefined);
        return link;
      }
      await wait(POLL_MS);
    }
  }

  /** the guest's side: joins with the code the host shared */
  static async join(rawCode: string, abort?: AbortSignal): Promise<CoopLink> {
    const code = rawCode.trim().toUpperCase();
    const hostName = await coopJoin(code);
    const link = new CoopLink('guest', code, hostName ?? 'Anfitrión', await coopIceServers(code));
    link.adopt(link.pc.createDataChannel('ev', { ordered: true }));
    link.adopt(link.pc.createDataChannel('st', { ordered: false, maxRetransmits: 0 }));
    await link.pc.setLocalDescription(await link.pc.createOffer());
    await gathered(link.pc);
    await coopSignal(code, 'offer', link.pc.localDescription!.sdp);
    const deadline = Date.now() + CONNECT_TIMEOUT_MS;
    for (;;) {
      if (abort?.aborted) { link.close(); throw new Error('cancelado'); }
      if (Date.now() > deadline) { link.close(); throw new Error(tr('El anfitrión no respondió')); }
      const r = await coopPoll(code).catch(() => null);
      if (r?.status === 'cerrada') { link.close(); throw new Error(tr('La sala se cerró')); }
      if (r?.answer) { await link.pc.setRemoteDescription({ type: 'answer', sdp: r.answer }); break; }
      await wait(POLL_MS);
    }
    await link.ready(Promise.all([opened(link.ev!), opened(link.st!)]).then(() => undefined));
    return link;
  }

  private adopt(ch: RTCDataChannel) {
    ch.binaryType = 'arraybuffer';
    if (ch.label === 'ev') {
      this.ev = ch;
      ch.addEventListener('message', (e) => {
        let m: CoopMsg;
        try { m = JSON.parse(String(e.data)); } catch { return; }
        if (m.t === 'ping') { this.send({ t: 'pong', at: m.at }); return; }
        if (m.t === 'pong') { this.rtts.push(performance.now() - Number(m.at)); if (this.rtts.length > 5) this.rtts.shift(); this.rtt = Math.max(1, Math.round([...this.rtts].sort((a, b) => a - b)[this.rtts.length >> 1])); return; }
        if (m.t === 'bye') { this.end(tr('tu compañero salió')); return; }
        this.onEvent(m);
      });
      ch.addEventListener('close', () => this.end(tr('conexión perdida')));
    } else if (ch.label === 'st') {
      this.st = ch;
      ch.addEventListener('message', (e) => { if (e.data instanceof ArrayBuffer) this.onState(e.data); });
    }
  }

  /** both channels open within the connect timeout, then pings start */
  private async ready(chans: Promise<void>) {
    let timer = 0;
    const timeout = new Promise<never>((_, fail) => { timer = window.setTimeout(() => fail(new Error(tr('No se pudo conectar: vuestras redes no se ven (hará falta un servidor de paso)'))), CONNECT_TIMEOUT_MS); });
    try { await Promise.race([chans, timeout]); } catch (e) { this.close(); throw e; } finally { clearTimeout(timer); }
    this.pingTimer = window.setInterval(() => this.send({ t: 'ping', at: performance.now() }), PING_MS);
    this.send({ t: 'ping', at: performance.now() });
  }

  get open() { return !this.closed && this.ev?.readyState === 'open'; }
  /** how the two peers reached each other: 'directa' or 'retransmitida' (through a TURN relay) */
  async route(): Promise<'directa' | 'retransmitida' | '?'> {
    const stats = await this.pc.getStats();
    for (const s of stats.values()) {
      if (s.type === 'candidate-pair' && s.state === 'succeeded' && s.nominated) {
        const local = stats.get(s.localCandidateId);
        return local?.candidateType === 'relay' ? 'retransmitida' : 'directa';
      }
    }
    return '?';
  }

  send(m: CoopMsg) { if (this.ev?.readyState === 'open') this.ev.send(JSON.stringify(m)); }
  /** a state snapshot; dropped if the channel is backed up (the next one replaces it) */
  sendState(data: ArrayBuffer) { if (this.st?.readyState === 'open' && this.st.bufferedAmount < 64 * 1024) this.st.send(data); }

  private end(why: string) {
    if (this.closed) return;
    this.closed = true;
    clearInterval(this.pingTimer);
    try { this.pc.close(); } catch { /* already closed */ }
    void coopMark(this.code, 'cerrada').catch(() => undefined);
    this.onClose(why);
  }
  /** leaves on purpose: the partner is told before the link closes */
  close() { this.send({ t: 'bye' }); setTimeout(() => this.end('saliste'), 50); }
}
