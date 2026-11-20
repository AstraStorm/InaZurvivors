/**
 * Modo Duelo: the look of the match screen. Sizes written in cqw are the stage's unit (`--u`: 1cqw on the wide table,
 * more on the tall one) once converted below; --u and --hw are written in capitals so the conversion leaves them alone.
 */
import { artUrl } from './duelArt';

const CSS_RAW = `
.dm{position:fixed;inset:0;z-index:9000;background:radial-gradient(circle at 50% 40%,#0b1a4a,#02040f);display:grid;place-items:center;overflow:clip;font-family:'Segoe UI',system-ui,sans-serif;user-select:none;-webkit-user-select:none;touch-action:none}
.dm.flash::after{content:'';position:absolute;inset:0;background:radial-gradient(circle,#fff9 0,#fff0 70%);animation:dmFlash .45s ease-out;pointer-events:none;z-index:20}
@keyframes dmFlash{from{opacity:1}to{opacity:0}}
.dm-stage{--u:1CQW;--hw:9.3CQW;position:relative;width:min(100vw,calc(100vh*1586/992));aspect-ratio:1586/992;container-type:size;overflow:clip;box-shadow:0 0 4vw #000}
.dm-stage.v{--u:1.8CQW;--hw:16CQW;width:min(100vw,calc(100vh*9/16));aspect-ratio:9/16}
.dm-stage img{display:block;max-width:none}
.dm-cam{position:absolute;inset:0;transition:transform .45s cubic-bezier(.3,0,.2,1),transform-origin .45s}
.dm-table{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.dm-x{position:absolute;top:12px;right:12px;width:44px;height:44px;border-radius:50%;border:2px solid #ffd76a;background:#0b1440cc;color:#ffd76a;font-size:22px;cursor:pointer;z-index:30}
.dm-stage .dm-tray,.dm-stage .dm-play,.dm-stage .dm-bubble,.dm-stage .dm-q{transition:translate .35s ease,opacity .35s}
.dm-stage.scene .dm-tray{translate:0 75%;opacity:.2}
.dm-stage.scene .dm-play,.dm-stage.scene .dm-bubble{opacity:0}
/* numbers */
.iz-num{--nh:1.4cqw;display:inline-block;font-family:'Arial Black','Segoe UI Black','Segoe UI',sans-serif;font-weight:900;font-style:italic;font-size:var(--nh);line-height:1;letter-spacing:-.01em;color:#fff;-webkit-text-stroke:calc(var(--nh)*.18) #140600;paint-order:stroke fill;text-shadow:0 calc(var(--nh)*.09) 0 #000a;font-variant-numeric:tabular-nums;white-space:nowrap}
.iz-num.green{color:#c8ffd2;-webkit-text-stroke-color:#06461a}
/* the sides of the screen */
.dm-bg{position:absolute;inset:-4%;width:108%;height:108%;object-fit:cover;filter:blur(18px) brightness(.4) saturate(1.2);pointer-events:none}
.dm-side{position:absolute;top:50%;translate:0 -50%;max-height:96vh;overflow:auto;scrollbar-width:none;padding:12px;box-sizing:border-box;border-radius:14px;background:linear-gradient(#0c1a52e6,#060c2ae6);border:2px solid #ffd76a66;box-shadow:0 8px 30px #000a;color:#dfe7ff;font-size:12px;z-index:2}
.dm-side[hidden]{display:none}
.dm-side.l{left:12px}.dm-side.r{right:12px}
.dm-side h3{margin:4px 0 8px;font-size:13px;letter-spacing:.14em;text-transform:uppercase;color:#ffd76a;text-shadow:0 1px 2px #000}
.dm-side h3+.coachline{display:block;margin:-6px 0 6px;color:#9fb4e8}
.dm-side .ic{width:18px;display:inline-block;vertical-align:middle}
.dm-wheel{position:relative;width:min(170px,calc(100% - 50px));aspect-ratio:1;margin:26px auto 30px;border-radius:50%;background:radial-gradient(circle,#ffd76a22 0,#0000 35%),radial-gradient(circle,#0000 58%,#ffd76a33 59%,#0000 61%)}
.dm-wheel>span{position:absolute;display:flex;flex-direction:column;align-items:center;gap:2px;translate:-50% -50%;font-weight:800;z-index:1}
.dm-wheel>span i{display:grid;place-items:center;width:40px;height:40px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#ffffff33,#0b1440 70%);box-shadow:0 0 0 2px var(--ec),0 0 14px var(--ec);font-style:normal}
.dm-wheel>span i>*{width:28px!important;height:28px!important}
.dm-wheel>span small{position:absolute;top:100%;margin-top:1px;font-size:10.5px;white-space:nowrap;color:#fff;text-shadow:0 1px 2px #000}
.dm-wheel .el-Montana{--ec:#d39a3a}.dm-wheel .el-Fuego{--ec:#ff5a2a}.dm-wheel .el-Bosque{--ec:#4fd35a}.dm-wheel .el-Aire{--ec:#4fb8ff}
.dm-wheel .w0{left:50%;top:11%}.dm-wheel .w1{left:89%;top:50%}.dm-wheel .w2{left:50%;top:89%}.dm-wheel .w3{left:11%;top:50%}
.dm-wheel svg{position:absolute;inset:0;overflow:visible}
.dm-wheel svg path{fill:none;stroke:#ffd76a;stroke-width:3;stroke-linecap:round;filter:drop-shadow(0 0 3px #ffb020)}
.dm-wheel svg marker path{fill:#ffd76a;stroke:none;filter:none}
.dm-wheel>b{position:absolute;left:50%;top:50%;translate:-50% -50%;color:#ffd76a;font-size:18px;font-weight:900;text-shadow:0 0 8px #ffb020}
.dm-neutral{display:flex;gap:8px;align-items:center;margin:-4px 0 12px;padding:6px 8px;border-radius:8px;background:#ffffff0d;color:#c8d4f5}
.dm-neutral>*:first-child{flex:none}
.dm-sidenote{margin:4px 0 12px;text-align:center;color:#b8c6ee}
.dm-pf{display:flex;gap:8px;align-items:center;padding:6px;margin-bottom:6px;border-radius:10px;background:#ffffff0d;border:1px solid #ffffff14}
.dm-pf.bench{opacity:.75}.dm-pf.out{opacity:.35;filter:grayscale(1)}
.dm-pf .mugw{width:40px;height:40px;border-radius:8px;overflow:hidden;flex:none;background:radial-gradient(#4a74d0,#14205a)}
.dm-pf .mugw .mug{image-rendering:pixelated}
.dm-pf>div{flex:1;min-width:0}
.dm-pf b{display:flex;align-items:center;gap:4px;color:#fff;font-size:13px;white-space:nowrap}
.dm-pf b small{margin-left:auto;color:#9fb4e8;font-size:10px;font-weight:700}
.dm-pf .hp{display:block;height:6px;margin:3px 0;border-radius:9px;background:#000a;overflow:hidden}
.dm-pf .hp i{display:block;height:100%;border-radius:9px}
.dm-pf .nums{display:block;font-size:10.5px;color:#c8d4f5;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dm-pf .gauge{display:flex;gap:3px;align-items:center;margin-top:3px}
.dm-pf .gauge i{width:8px;height:8px;border-radius:50%;background:#ffffff22;border:1px solid #ffd76a55}
.dm-pf .gauge i.on{background:radial-gradient(#fff3b0,#ffb020);box-shadow:0 0 4px #ffb020}
.dm-pf .gauge .ic{width:16px;margin-left:4px}.dm-pf .gauge em{font-style:normal;font-size:10px;color:#fff}
.dm-legend p{display:flex;gap:8px;align-items:flex-start;margin:0 0 7px;line-height:1.3}
.dm-legend .ic{width:26px;flex:none}
.dm-legend b{display:block;color:#fff;font-size:12px}
/* the footballers */
.dm-unit{position:absolute;width:var(--w);transform:translate(-50%,-56%);transition:filter .2s,opacity .2s;z-index:2}
.dm-unit.boss::before{content:'';position:absolute;left:50%;top:46%;width:150%;aspect-ratio:1;translate:-50% -50%;border-radius:50%;background:radial-gradient(circle,#ff3a5a66,#b44aff33 45%,#0000 70%);pointer-events:none;z-index:-1;animation:dmBoss 2.4s ease-in-out infinite}
.dm-unit.boss .dm-card{filter:drop-shadow(0 0 .8cqw #ff3a5a)}
@keyframes dmBoss{50%{transform:scale(1.15);opacity:.65}}
.dm-unit.s1{transform:translate(-50%,-74%)}
.dm-unit.bench{filter:brightness(.7) saturate(.8);z-index:1;cursor:pointer}
.dm-card{position:relative;width:100%;aspect-ratio:299/480;filter:drop-shadow(0 .5cqw .6cqw #000b)}
.dm-port{position:absolute;left:22.5%;top:16%;width:55%;height:41%;overflow:hidden;display:grid;place-items:center;background:radial-gradient(circle at 50% 35%,#4a74d0,#14205a 70%)}
.dm-port .mug{display:block;image-rendering:pixelated}
.dm-frame{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}
.dm-el{position:absolute;left:20%;top:13%;width:12.4%;aspect-ratio:1;display:grid;place-items:center;filter:drop-shadow(0 0 .15cqw #000)}
.dm-el>*{width:100%!important;height:100%!important;display:block}
.dm-g{position:absolute;top:79.8%;width:9.6%;aspect-ratio:1}
.dm-g img{width:100%;height:100%}
.dm-unit.full .dm-g.on{animation:dmOrb 1s ease-in-out infinite}
@keyframes dmOrb{50%{scale:1.18;opacity:.8}}
.dm-nm{position:absolute;left:23%;width:54%;top:62.6%;height:7%;display:flex;align-items:center;justify-content:center;font-family:'Arial Black','Segoe UI Black','Segoe UI',sans-serif;font-weight:900;text-transform:uppercase;letter-spacing:.02em;white-space:nowrap;overflow:visible;line-height:1;font-size:min(calc(var(--w)*.105),calc(var(--w)*.6/var(--n)));color:#3d1c04;text-shadow:0 1px 0 #fff,0 0 calc(var(--w)*.03) #fff8;z-index:2}
.dm-hpn,.dm-atk{position:absolute;top:72.6%;height:5.4%;display:grid;place-items:center;line-height:1}
.dm-hpn .iz-num,.dm-atk .iz-num{--nh:min(calc(var(--w)*.1),calc(var(--w)*.26/var(--d)));font-style:normal;-webkit-text-stroke:calc(var(--nh)*.14) #fff;text-shadow:none}
.dm-hpn .iz-num{color:#b30c26}.dm-atk .iz-num{color:#5a2600}
.dm-hpn{left:30%;width:18%;color:#b0102a}.dm-atk{left:62.5%;width:16.5%;color:#6a3200}
.dm-sts{position:absolute;left:50%;bottom:100%;transform:translateX(-50%);display:flex;gap:2px;margin-bottom:-8%}
.dm-st{position:relative;width:calc(var(--w)*.26);animation:dmPop .35s cubic-bezier(.2,1.6,.4,1)}
.dm-st img{width:100%}
.dm-st b{position:absolute;right:-2px;bottom:-2px;font-size:calc(var(--w)*.1);color:#fff;text-shadow:0 0 3px #000,0 0 3px #000}
@keyframes dmPop{from{scale:0}}
/* life */
.dm-life{position:relative;width:104%;margin:-6% 0 0 -2%;height:calc(var(--w)*.21);padding:calc(var(--w)*.018);box-sizing:border-box;border-radius:99px;background:linear-gradient(#fff3d0,#e8b54a 40%,#8a5a14 60%,#f3d57a);box-shadow:0 .25cqw .6cqw #000c,0 0 .5cqw #ffcf5a55;z-index:1}
.dm-life>.bar{position:absolute;inset:calc(var(--w)*.018) calc(var(--w)*.018) calc(var(--w)*.018) calc(var(--w)*.13);border-radius:99px;overflow:hidden;background:linear-gradient(#05081f,#1c2858)}
.dm-life .bar>span{position:absolute;left:0;top:0;bottom:0;width:var(--p);border-radius:99px}
.dm-life .lag{background:linear-gradient(#ffd0c0,#ff4a2a 55%,#a3140a);transition:width .7s ease-in .55s}
.dm-life .cur{background:linear-gradient(#ffffff90,#fff0 45%,#0003),var(--c);transition:width .35s cubic-bezier(.2,.8,.3,1),background-color .3s;box-shadow:inset 0 0 .3cqw #fff8}
.dm-life .cur::after{content:'';position:absolute;inset:0;background:repeating-linear-gradient(115deg,#fff0 0 .7cqw,#ffffff60 .7cqw .9cqw,#fff0 .9cqw 2.2cqw);opacity:.55}
.dm-life .cur::before{content:'';position:absolute;right:-.15cqw;top:-25%;bottom:-25%;width:.6cqw;border-radius:50%;background:radial-gradient(#fff,#bff6ff 40%,#fff0 70%);animation:dmSpark .3s steps(2) infinite;z-index:1}
.dm-life .bar>.tick{width:100%;border-radius:0;background:repeating-linear-gradient(90deg,#0000 0 calc(10% - 1px),#0006 calc(10% - 1px) 10%);pointer-events:none}
/* (the stripes stay still: sliding the background repainted the eight bars every frame, a load on streams) */
@keyframes dmSpark{50%{opacity:.35;transform:scaleY(.6)}}
.dm-life .hrt{position:absolute;left:-7%;top:50%;width:calc(var(--w)*.27);aspect-ratio:1;transform:translateY(-50%);border-radius:50%;display:grid;place-items:center;background:radial-gradient(circle at 35% 30%,#ff9a9a,#e01b2e 55%,#7a0010);box-shadow:0 0 0 calc(var(--w)*.018) #f3d57a,0 .15cqw .4cqw #000c;color:#fff;font-size:calc(var(--w)*.15);line-height:1;z-index:2;text-shadow:0 1px 1px #0008}
.dm-life b{position:absolute;inset:0 0 0 9%;display:grid;place-items:center;z-index:2;--nh:calc(var(--w)*.135)}
.dm-life b .iz-num{--nh:calc(var(--w)*.15)}
.dm-life em{position:absolute;right:-4%;top:-55%;padding:0 .35cqw;border-radius:99px;font-style:normal;font-weight:900;font-size:calc(var(--w)*.1);color:#e8f8ff;background:linear-gradient(#3fa8ff,#155ac4);box-shadow:0 0 .5cqw #4fb3ff,0 .1cqw .2cqw #000a;z-index:3;white-space:nowrap}
.dm-life.low{animation:dmLow .9s ease-in-out infinite}
.dm-life.hit{animation:dmLifeHit .5s}
.dm-life.hit .hrt{animation:dmBeat .5s}
.dm-life.up{animation:dmLifeUp .5s}
@keyframes dmLow{50%{box-shadow:0 .25cqw .6cqw #000c,0 0 1.2cqw #ff3030}}
@keyframes dmLifeHit{20%{translate:-.3cqw 0;filter:brightness(1.8) saturate(2)}40%{translate:.3cqw 0}60%{translate:-.15cqw 0}}
@keyframes dmLifeUp{40%{filter:brightness(1.5) drop-shadow(0 0 .8cqw #6aff8a)}}
@keyframes dmBeat{30%{scale:1.35}}
/* aiming */
.dm-stage.aiming .dm-unit.dim{opacity:.45;filter:grayscale(.6) brightness(.7)}
.dm-unit.aim{cursor:crosshair}
.dm-unit.aim .dm-card{animation:dmAimGlow 1.1s ease-in-out infinite}
@keyframes dmAimGlow{50%{filter:drop-shadow(0 0 .9cqw #ff3b3b) drop-shadow(0 .5cqw .6cqw #000b)}}
.dm-stage.aim-ally .dm-unit.aim .dm-card{animation-name:dmAimGlowA}
@keyframes dmAimGlowA{50%{filter:drop-shadow(0 0 .9cqw #4bff7d) drop-shadow(0 .5cqw .6cqw #000b)}}
.dm-tring{--tc:#ff4a4a;position:absolute;inset:0 15.5% -1%;border-radius:9%;pointer-events:none;opacity:0;z-index:4;border:.22cqw dashed var(--tc);box-shadow:0 0 .8cqw var(--tc),inset 0 0 .8cqw color-mix(in srgb,var(--tc) 60%,transparent);transition:opacity .15s,inset .15s}
.dm-unit.aim .dm-tring{opacity:.75;animation:dmTPulse 1.1s ease-in-out infinite}
.dm-stage.aim-ally .dm-tring{--tc:#4bff7d}
.dm-unit.aim:hover .dm-tring,.dm-unit.lock .dm-tring{opacity:1;inset:1% 17% 0;border-style:solid;border-width:.3cqw;--tc:#ffb020;animation:dmTLock .5s ease-in-out infinite}
@keyframes dmTPulse{50%{opacity:.35}}
@keyframes dmTLock{50%{box-shadow:0 0 1.4cqw var(--tc),inset 0 0 1.2cqw var(--tc)}}
.dm-unit.aim:hover,.dm-unit.lock{scale:1.07;z-index:6}
@keyframes dmSpin{to{rotate:360deg}}
.dm-pv{position:absolute;left:50%;top:-2%;transform:translate(-50%,-100%);display:flex;flex-wrap:wrap;justify-content:center;gap:.2cqw;width:150%;pointer-events:none;z-index:6}
.dm-pv:empty{display:none}
.dm-pv>*{padding:.15cqw .6cqw;border-radius:.7cqw;background:#0b1440f0;border:.14cqw solid #fff6;color:#fff;font-weight:900;font-size:1.3cqw;box-shadow:0 .3cqw .6cqw #000a;white-space:nowrap;display:flex;align-items:center;gap:.2cqw;animation:dmPop .25s cubic-bezier(.2,1.6,.4,1)}
.dm-pv img{width:1.6cqw}
.dm-pv .iz-num{--nh:2.1cqw;-webkit-text-stroke-color:#5a0010}
.dm-pv .dmg{font-size:1.8cqw;color:#ff6a6a;background:#2a0710ee;border-color:#ff6a6a88}
.dm-pv .heal{font-size:1.2cqw;color:#7dff9a}.dm-pv .shield{color:#9fe0ff}
.dm-pv .good{color:#ffc23a}.dm-pv .bad{color:#9ab}
.dm-pv .ko{background:#c4102a;border-color:#fff;letter-spacing:.08em}
.dm-pv .redir{color:#ffd2d2}
.dm-unit.lock .dm-pv>*{scale:1.12}
.dm-unit.swap{cursor:pointer}.dm-unit.swap .dm-card{filter:drop-shadow(0 0 .7cqw #ffd76a)}
.dm-unit.picked .dm-card{filter:drop-shadow(0 0 .9cqw #ffd76a) brightness(1.15)}
.dm-unit.hint .dm-card{animation:dmHint 1s ease-in-out infinite}
@keyframes dmHint{50%{filter:drop-shadow(0 0 1.3cqw #fff) drop-shadow(0 0 .6cqw #ffd76a)}}
/* in the scenes */
.dm-unit.acting{z-index:6}
.dm-unit.acting .dm-card{filter:drop-shadow(0 0 1.2cqw #ffd76a) brightness(1.2)}
.dm-unit.s1.acting .dm-card{filter:drop-shadow(0 0 1.2cqw #4fb3ff) brightness(1.2)}
.dm-unit.dash .dm-card{filter:drop-shadow(-1.2cqw .4cqw .3cqw #fff6) drop-shadow(-2.4cqw .8cqw .4cqw #fff3) brightness(1.25)}
.dm-unit.dm-hurt{animation:dmHurt .48s}
.dm-unit.dm-hurt .dm-card::after{content:'';position:absolute;inset:6%;border-radius:6%;background:#f22;mix-blend-mode:screen;opacity:0;animation:dmRed .48s}
@keyframes dmHurt{15%{translate:-.7cqw 0;rotate:-3deg}35%{translate:.6cqw 0;rotate:2deg}55%{translate:-.35cqw 0}75%{translate:.2cqw 0}}
.dm-unit.crit{animation:dmHurt .48s,dmCrit .48s}
@keyframes dmCrit{25%{scale:1.14}}
@keyframes dmRed{20%{opacity:.75}}
.dm-unit.freeze .dm-card{filter:brightness(3) contrast(1.4) grayscale(1)}
.dm-unit.ko{transition:margin .7s ease-in,rotate .7s,scale .7s,opacity .7s;margin-top:4cqw;rotate:-14deg;scale:.65;opacity:0;filter:grayscale(1) brightness(1.6)}
.dm-unit.dm-enter{animation:dmEnter .8s cubic-bezier(.2,1.3,.4,1)}
@keyframes dmEnter{from{margin-top:-8cqw;scale:.5;opacity:0}}
.dm-unit.ultiup .dm-card{animation:dmUlti 1.3s}
@keyframes dmUlti{25%,70%{filter:drop-shadow(0 0 1.6cqw #ffb020) brightness(1.35)}}
.dm-unit.healed .dm-card{animation:dmHealed .9s}
@keyframes dmHealed{35%{filter:brightness(1.55) drop-shadow(0 0 1.3cqw #6aff8a)}}
.dm-unit.shielded .dm-card{animation:dmShielded .8s}
@keyframes dmShielded{35%{filter:brightness(1.45) drop-shadow(0 0 1.3cqw #8fd0ff)}}
.dm-unit.dodge{animation:dmDodge .6s ease-out}
@keyframes dmDodge{35%{translate:2.5cqw -.5cqw;opacity:.5}}
.dm-unit.got-quemadura .dm-card{animation:dmBurnT .9s}
@keyframes dmBurnT{40%{filter:sepia(1) saturate(4) hue-rotate(-20deg) brightness(1.2)}}
.dm-unit.got-congelado .dm-card{animation:dmIceT .9s}
@keyframes dmIceT{40%{filter:hue-rotate(160deg) saturate(.5) brightness(1.5)}}
.dm-unit.got-electrizado .dm-card{animation:dmZapT .9s steps(6)}
@keyframes dmZapT{30%,70%{filter:brightness(2) drop-shadow(0 0 .8cqw #7fe8ff)}50%{filter:none}}
/* coaches and the turn */
.dm-coach{position:absolute;transform:translate(-50%,-50%);width:5.6cqw;text-align:center;z-index:1}
.dm-coach.s1{width:4.4cqw}
.dm-coach img{width:100%;aspect-ratio:1;object-fit:cover;border-radius:50%;border:.25cqw solid #ffd76a;box-shadow:0 0 1cqw #000a;image-rendering:pixelated;background:#101a44}
.dm-coach span{display:inline-block;margin-top:.3cqw;padding:.1cqw .6cqw;border-radius:1cqw;background:#0b1440d9;color:#ffe9a8;font-size:.85cqw;font-weight:700;white-space:nowrap}
.dm-center{position:absolute;width:4.2cqw;aspect-ratio:379/406;transform:translate(-50%,-50%);display:grid;place-items:center;z-index:1;pointer-events:none}
.dm-center .dm-ring{position:absolute;inset:0;width:100%;height:100%}
.dm-center b{font-size:1.9cqw;color:#fff;text-shadow:0 0 1cqw #ffb020,0 2px 2px #000;line-height:1}
.dm-center small{position:absolute;top:100%;white-space:nowrap;font-size:.95cqw;font-weight:800;color:#ffe9a8;text-shadow:0 1px 2px #000}
.dm-center.foe b{text-shadow:0 0 1cqw #4fb3ff,0 2px 2px #000}
.dm-rq{position:absolute;transform:translate(-50%,-50%);display:flex;z-index:3}
.dm-rq>span{width:2.1cqw;margin:0 -.35cqw;transform:rotate(calc((var(--k) - 3) * 4deg))}
.dm-rq>span img{width:100%}
.dm-rq.boxes>div{display:flex;gap:.4cqw;padding:.5cqw .4cqw .4cqw;border-radius:1cqw;background:#081238cc;border:.15cqw solid #4fb3ff88}
/* your boxes */
.dm-q{position:absolute;transform:translate(-50%,-50%);text-align:center;z-index:5}
.dm-q>small{display:block;font-size:.85cqw;font-weight:900;color:#ffe9a8;letter-spacing:.12em;text-transform:uppercase;text-shadow:0 1px 2px #000;margin-bottom:.5cqw}
.dm-q>div{display:flex;gap:.5cqw}
.dm-box{position:relative;width:4.3cqw;aspect-ratio:263/360;border-radius:.6cqw;cursor:pointer}
.dm-box.empty{border:.18cqw dashed #ffd76a88;background:radial-gradient(#ffd76a1c,#0000 70%);cursor:default;display:grid;place-items:center;animation:dmEmpty 1.6s ease-in-out infinite;box-sizing:border-box}
@keyframes dmEmpty{50%{border-color:#ffd76add}}
.dm-box>b{position:absolute;left:50%;top:-.4cqw;transform:translate(-50%,-50%);width:1.5cqw;height:1.5cqw;border-radius:50%;display:grid;place-items:center;background:linear-gradient(#ffd76a,#c07a10);color:#3a1600;font-size:.9cqw;font-weight:900;z-index:3;box-shadow:0 1px 3px #000}
.dm-box.empty>b{position:static;transform:none;background:#ffd76a33;color:#ffe9a8}
.dm-box .dm-hc{width:100%!important;margin:0;transform:none;cursor:pointer}
.dm-box .dm-htech{font-size:calc(.48cqw * var(--k))}
.dm-box .dm-hmult{display:none}
.dm-q .dm-box:hover .dm-hc{filter:brightness(1.15) drop-shadow(0 0 .5cqw #ff6a6a)}
.dm-box .dm-tgt{position:absolute;right:-.6cqw;bottom:-.4cqw;width:2.4cqw;height:2.4cqw;border-radius:50%;overflow:hidden;border:.15cqw solid #ff6a6a;background:#14205a;z-index:3}
.dm-box .dm-tgt .mug{image-rendering:pixelated}
.dm-box .dm-mvic{position:absolute;inset:0;display:grid;place-items:center;font-style:normal;font-size:2cqw;color:#fff;text-shadow:0 0 .5cqw #000;z-index:3}
.dm-box.now{animation:dmNow .6s ease-in-out infinite;z-index:4}
@keyframes dmNow{50%{scale:1.15;filter:drop-shadow(0 0 .8cqw #ffd76a)}}
.dm-box.done{opacity:.35;filter:grayscale(1)}
.dm-rq .dm-box{width:3.4cqw;cursor:default;animation:dmPop .3s cubic-bezier(.2,1.6,.4,1)}
.dm-rq .dm-box .dm-htech{font-size:calc(.36cqw * var(--k))}
.dm-rq .dm-box>b{background:linear-gradient(#8fd0ff,#1d5bd0);color:#fff;width:1.2cqw;height:1.2cqw;font-size:.7cqw}
.dm-rq .dm-box.now{animation:dmNow .6s ease-in-out infinite}
/* the hand */
.dm-tray{position:absolute;left:28%;right:22%;top:70%;bottom:8.5%;display:flex;align-items:flex-end;justify-content:center;z-index:4}
.dm-stage.v .dm-tray{left:2%;right:2%;top:79%}
.dm-hand{display:flex;align-items:flex-end}
.dm-hc{position:relative;width:var(--hw);aspect-ratio:263/360;margin:0;cursor:grab;transform-origin:50% 120%;transform:translateY(var(--y,0)) rotate(var(--r,0deg));transition:transform .22s cubic-bezier(.2,1.3,.4,1),translate .2s ease,filter .2s;filter:drop-shadow(0 .5cqw .6cqw #000c);touch-action:none}
.dm-hand .dm-hc+.dm-hc{margin-left:var(--gap,0)}
.dm-hand .dm-hc:hover+.dm-hc{translate:1.8cqw 0}
.dm-hand .dm-hc:has(+.dm-hc:hover){translate:-1.8cqw 0}
.dm-hc.ready{filter:drop-shadow(0 0 .35cqw #7dffb0) drop-shadow(0 .5cqw .6cqw #000c)}
.dm-hand .dm-hc:hover{transform:perspective(40cqw) translateY(-3.4cqw) scale(1.2) rotateX(var(--ty,0deg)) rotateY(var(--tx,0deg));transition:transform .22s cubic-bezier(.2,1.3,.4,1),translate .2s ease,filter .2s;z-index:20!important;filter:drop-shadow(0 0 .45cqw #ffd76acc) drop-shadow(0 1cqw 1.2cqw #000c)}
.dm-hand .dm-hc.picked,.dm-hand .dm-hc.aimfrom{transform:translateY(-3.6cqw) scale(1.18);z-index:21!important;filter:drop-shadow(0 0 1cqw #ffd76a) drop-shadow(0 .8cqw 1cqw #000)}
.dm-hand .dm-hc.drag{transition:transform .15s,filter .2s;transform:scale(1.22) rotate(0deg);z-index:30!important;cursor:grabbing;filter:drop-shadow(0 0 1cqw #ffd76a) drop-shadow(0 1.4cqw 1.4cqw #000)}
.dm-stage.drop-play .dm-hand .dm-hc.drag{transform:scale(1.35);filter:drop-shadow(0 0 1.6cqw #ffb020) drop-shadow(0 1.4cqw 1.4cqw #000)}
.dm-stage.drop-play .dm-cam::after{content:'';position:absolute;inset:8% 6% 30%;border-radius:3cqw;border:.3cqw dashed #ffd76aaa;background:#ffd76a14;animation:dmEmpty 1s infinite}
.dm-hc.willfuse::after{content:attr(data-preview);position:absolute;left:50%;bottom:104%;inset-inline:auto;top:auto;transform:translateX(-50%);padding:.25cqw .7cqw;border-radius:.7cqw;background:linear-gradient(#ffcf4a,#e07a10);color:#3a1600;font-weight:900;font-size:1cqw;white-space:nowrap;box-shadow:0 0 1cqw #ffb020;mix-blend-mode:normal;animation:dmPop .25s cubic-bezier(.2,1.6,.4,1);z-index:6}
.dm-hand .dm-hc.fusing{filter:drop-shadow(0 0 1.2cqw #ffd76a) brightness(1.3);animation:dmFusing .5s ease-in-out infinite}
@keyframes dmFusing{50%{filter:drop-shadow(0 0 1.8cqw #fff) brightness(1.5)}}
.dm-hc.off{cursor:default;filter:brightness(.72) drop-shadow(0 .5cqw .6cqw #000c)}
.dm-hand .dm-hc.off:hover{transform:translateY(var(--y,0)) rotate(var(--r,0deg))}
.dm-hand .dm-hc.hint{animation:dmCardHint 1s ease-in-out infinite;z-index:19!important}
.dm-hand .dm-hc.hint::before{content:'👇';position:absolute;left:50%;bottom:100%;transform:translateX(-50%);font-size:2.3cqw;filter:drop-shadow(0 0 .3cqw #000);animation:dmPoint 1s ease-in-out infinite;z-index:5}
.dm-hand .dm-hc.hint:has(.dm-fkey)::before{bottom:calc(100% + 1.5cqw)}
.dm-hand .dm-hc.dropmark::before{content:'⇦';position:absolute;right:100%;top:30%;font-size:2.6cqw;color:#ffd76a;text-shadow:0 0 .8cqw #ffb020,0 0 .2cqw #000;animation:dmPointX .8s ease-in-out infinite;z-index:5}
@keyframes dmCardHint{50%{transform:translateY(-1.6cqw) rotate(0deg) scale(1.06);filter:drop-shadow(0 0 1cqw #fff) drop-shadow(0 0 .5cqw #ffd76a)}}
@keyframes dmPoint{50%{margin-bottom:.8cqw}}
@keyframes dmPointX{50%{margin-right:.8cqw}}
.dm-hc.dealt{animation:dmDeal .5s cubic-bezier(.2,1.3,.4,1) backwards;animation-delay:var(--d)}
@keyframes dmDeal{from{transform:translate(30cqw,-14cqw) rotate(30deg) scale(.35);opacity:0}}
.dm-hc.merged{animation:dmMerged .9s}
@keyframes dmMerged{30%{filter:brightness(1.8) drop-shadow(0 0 1.5cqw #ffd76a)}}
.dm-hc.ulti:not(.willfuse)::after,.dm-hc.combo:not(.willfuse)::after{content:'';position:absolute;inset:6% 8%;border-radius:.6cqw;background:linear-gradient(115deg,#fff0 35%,#fffa 50%,#fff0 65%) -150% 0/250% 100% no-repeat;mix-blend-mode:overlay;animation:dmShine 2.4s ease-in-out infinite;pointer-events:none;z-index:3}
@keyframes dmShine{60%,100%{background-position:150% 0}}
.dm-hface{position:absolute;left:21%;top:16%;width:58%;height:47%;display:flex;justify-content:center;align-items:center;overflow:hidden;background:radial-gradient(circle at 50% 38%,#4a74d0,#101a44 75%)}
.dm-hface .mug{display:block;image-rendering:pixelated;flex:none}
.dm-hc.combo .dm-hface .mug+.mug{margin-left:-14%}
.dm-hframe{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}
.dm-hicon{position:absolute;left:12%;top:9%;width:26%;z-index:2;filter:drop-shadow(0 .1cqw .25cqw #000)}
.dm-htech{position:absolute;left:13%;right:13%;top:61%;min-height:18%;padding:.2cqw .15cqw;box-sizing:border-box;display:grid;place-items:center;text-align:center;line-height:1.05;--k:min(1,calc(9.5 / var(--lw,1)));font-size:calc(1.12cqw * var(--k));font-weight:900;color:#fff;text-shadow:0 .1cqw 0 #000,0 0 .3cqw #000;background:linear-gradient(#0000,#08103ad0 22%,#08103af0 78%,#0000);border-top:.1cqw solid #ffd76a99;border-bottom:.1cqw solid #ffd76a99;z-index:2;overflow-wrap:normal;word-break:normal;hyphens:none}
.dm-stage.v .dm-hand .dm-htech{font-size:calc(1.45cqw * var(--k))}
.dm-hmult{position:absolute;right:17%;top:15%;padding:0 .3cqw;border-radius:.4cqw;background:#000c;color:#ffe08a;font-size:.9cqw;font-weight:900;z-index:2}
.dm-hseal{position:absolute;left:50%;top:38%;width:55%;transform:translate(-50%,-50%);z-index:3}
.dm-hc.sealed .dm-hface{filter:grayscale(1) brightness(.6)}
.dm-ghost{position:absolute;pointer-events:none;z-index:8}
.dm-links{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:6;transition:opacity .2s}
.dm-stage.dragging .dm-links,.dm-stage.scene .dm-links{opacity:0}
.dm-links path{fill:none;stroke:#ffe9a8;stroke-width:.32cqw;stroke-linecap:round;stroke-dasharray:.2cqw .7cqw;animation:dmDash .6s linear infinite}
.dm-links path.glow{stroke:#ffb020;stroke-width:1cqw;stroke-dasharray:none;opacity:.45;filter:blur(.25cqw);animation:dmLinkGlow 1.2s ease-in-out infinite}
.dm-links circle{fill:#fff3b0;filter:drop-shadow(0 0 .4cqw #ffb020)}
.dm-links text{fill:#fff3b0;font-size:1.6cqw;text-anchor:middle;filter:drop-shadow(0 0 .4cqw #ffb020);animation:dmLinkGlow 1.2s ease-in-out infinite}
@keyframes dmLinkGlow{50%{opacity:1}}
.dm-hand .dm-hc.fusepair{filter:drop-shadow(0 0 .8cqw #ffd76a) drop-shadow(0 .5cqw .6cqw #000c)}
.dm-fkey{position:absolute;left:50%;top:-1.3cqw;translate:-50% 0;padding:.12cqw .5cqw;border-radius:.6cqw;background:linear-gradient(#ffcf4a,#e07a10);color:#3a1600;font-weight:900;font-size:.8cqw;white-space:nowrap;box-shadow:0 0 .8cqw #ffb020;z-index:6;animation:dmLinkGlow 1.2s ease-in-out infinite;pointer-events:none}
.dm-ghost .dm-hc{width:100%!important;transform:none;margin:0}
.dm-float.rank{color:#ffd76a;font-size:2.4cqw;font-style:normal;letter-spacing:.05em}
.dm-fuse{position:absolute;left:50%;top:40%;width:170%;aspect-ratio:96/98;transform:translate(-50%,-50%);background:url(${artUrl('anim-fusion')}) 0 0/1300% 100% no-repeat;animation:dmFuse 1.1s steps(13,jump-none) forwards;pointer-events:none;z-index:6}
@keyframes dmFuse{to{background-position:100% 0}}
.dm-stage:has(.dm-aim.on) .dm-bar{opacity:0;pointer-events:none}
.dm-bar{position:absolute;left:50%;bottom:100%;transform:translateX(-50%);display:flex;gap:.3cqw;align-items:center;margin-bottom:.5cqw;z-index:7}
.dm-bar button{font:900 1cqw 'Segoe UI',sans-serif;padding:.35cqw .7cqw;border-radius:.6cqw;border:.15cqw solid #ffd76a;background:linear-gradient(#2b4fb8,#13245e);color:#fff;cursor:pointer;white-space:nowrap}
.dm-bar button[data-use]{background:linear-gradient(#ffb63a,#e0700c);color:#3a1600}
.dm-bar button:disabled{opacity:.35;cursor:default}
.dm-bar button.hint{animation:dmBtn 1s ease-in-out infinite}
.dm-pick{padding:.3cqw .7cqw;border-radius:.6cqw;background:#2a0710ee;border:.15cqw solid #ff6a6a;color:#ffd2d2;font-weight:900;font-size:.95cqw;white-space:nowrap;animation:dmEmpty 1s infinite}
.dm-stage.aim-ally .dm-pick{background:#072a12ee;border-color:#4bff7d;color:#d2ffd8}
@keyframes dmBtn{50%{box-shadow:0 0 0 .3cqw #fff,0 0 1.2cqw #ffd76a;transform:scale(1.08)}}
/* «¡Jugar!» */
.dm-play{position:absolute;width:11cqw;transform:translate(-50%,-50%);border:0;background:none;padding:0;cursor:pointer;z-index:5;transition:transform .15s,filter .2s,opacity .35s}
.dm-play img{width:100%}
.dm-play span{position:absolute;inset:0;display:grid;place-items:center;font-weight:900;font-size:1.3cqw;color:#3a1600;text-shadow:0 1px 0 #fff8;letter-spacing:.03em}
.dm-play:hover:not(:disabled){transform:translate(-50%,-50%) scale(1.06)}
.dm-play:disabled{filter:grayscale(.85) brightness(.6);cursor:default}
.dm-play.glow:not(:disabled),.dm-play.hint:not(:disabled){animation:dmBtnEnd 1s ease-in-out infinite}
@keyframes dmBtnEnd{50%{filter:brightness(1.3) drop-shadow(0 0 1.2cqw #ffd76a);transform:translate(-50%,-50%) scale(1.08)}}
/* Hillman and the info panel */
.dm-bubble{position:absolute;width:22cqw;padding:.9cqw 1.1cqw;border-radius:1.2cqw;background:#fffaf0;color:#2b1b0c;font-size:1.05cqw;line-height:1.3;box-shadow:0 .4cqw 1.4cqw #000a;border:.2cqw solid #ffd76a;z-index:8;animation:dmBubble .35s cubic-bezier(.2,1.4,.4,1)}
.dm-bubble::before{content:'';position:absolute;left:3.5cqw;top:-1cqw;border:.6cqw solid transparent;border-bottom:.6cqw solid #ffd76a;border-top:0}
.dm-bubble b{display:block;color:#b5560a;font-size:.85cqw;margin-bottom:.2cqw}
.dm-bubble.nope{animation:dmNope .5s}
@keyframes dmBubble{from{transform:scale(.6);opacity:0}}
@keyframes dmNope{20%,60%{translate:-.5cqw 0}40%,80%{translate:.5cqw 0}}
.dm-info{position:absolute;width:19cqw;padding:.8cqw 1cqw;border-radius:1cqw;background:linear-gradient(#13245ef2,#081238f2);border:.15cqw solid #ffd76a99;box-shadow:0 .6cqw 1.6cqw #000c;color:#e8eeff;font-size:.95cqw;line-height:1.3;z-index:9;pointer-events:none;animation:dmInfo .18s ease-out}
.dm-stage.v .dm-info{transform:translate(-50%,-50%);width:26cqw}
.dm-info[hidden]{display:none}
@keyframes dmInfo{from{opacity:0;translate:0 .6cqw}}
.dm-ih{display:flex;gap:.6cqw;align-items:center;margin-bottom:.4cqw}
.dm-ih>img,.dm-ih>svg{width:2.6cqw!important;height:2.6cqw!important;flex:none}
.dm-ih b{display:block;font-size:1.2cqw;color:#fff;line-height:1.1}
.dm-ih small{display:block;color:#ffd76a;font-size:.8cqw;font-weight:700}
.dm-info p{margin:.25cqw 0;padding-left:.7cqw;border-left:.18cqw solid #ffd76a88}
.dm-info p.base{border-color:#ff6a6a;color:#fff;font-weight:700}
.dm-info p.off{opacity:.45}
.dm-info p em{font-style:normal;color:#ffd76a}
.dm-info .ic{width:1.1cqw;display:inline-block;vertical-align:middle}
.dm-stats{display:grid;grid-template-columns:1fr 1fr;gap:.2cqw .6cqw;margin:.3cqw 0;font-weight:700}
/* effects */
.dm-fx{position:absolute;inset:0;pointer-events:none;z-index:12}
.dm-float{position:absolute;transform:translate(-50%,-50%);font-weight:900;font-style:italic;font-size:2.2cqw;color:#fff;text-shadow:-.12cqw -.12cqw 0 #000,.12cqw -.12cqw 0 #000,-.12cqw .12cqw 0 #000,.12cqw .12cqw 0 #000,0 0 .6cqw #000;white-space:nowrap;animation:dmFloat 1.5s cubic-bezier(.2,.9,.3,1) backwards;display:flex;flex-direction:column;align-items:center;line-height:1}
.dm-float small{font-size:.55em;color:#ffe14a}
.dm-float img{width:2.2cqw}
.dm-float.dmg{color:#ff5a5a}
.dm-float .iz-num{--nh:2.6cqw;-webkit-text-stroke-color:#9a0010;filter:drop-shadow(0 0 .3cqw #000)}
.dm-float.crit .iz-num{--nh:3.6cqw;color:#ffe14a;-webkit-text-stroke-color:#7a1200}
.dm-float.heal .iz-num{--nh:2.3cqw}
.dm-float.crit{font-size:3.2cqw;color:#ffd23a;animation-name:dmFloatCrit}
.dm-float.heal{color:#6aff8a}
.dm-float.shield{color:#8fd0ff;flex-direction:row;gap:.2cqw}
.dm-float.note{font-size:1.25cqw;margin-top:2.6cqw}
.dm-float.good{color:#ffb020}
.dm-float.bad{color:#9ab}
.dm-float.ice{color:#9ef}
.dm-float.status{font-size:1.15cqw;margin-top:-3.2cqw;font-style:normal}
@keyframes dmFloat{0%{opacity:0;transform:translate(-50%,-10%) scale(.4)}12%{opacity:1;transform:translate(-50%,-70%) scale(1.25)}28%{transform:translate(-50%,-75%) scale(1)}100%{opacity:0;transform:translate(-50%,-190%)}}
@keyframes dmFloatCrit{0%{opacity:0;transform:translate(-50%,-10%) scale(.3) rotate(-12deg)}12%{opacity:1;transform:translate(-50%,-75%) scale(1.5) rotate(4deg)}30%{transform:translate(-50%,-80%) scale(1.1) rotate(0)}100%{opacity:0;transform:translate(-50%,-200%)}}
.dm-pt{position:absolute;width:calc(.55cqw*var(--s));height:calc(.55cqw*var(--s));border-radius:50%;background:var(--c);box-shadow:0 0 .6cqw var(--c),0 0 .2cqw #fff;translate:-50% -50%;animation:dmPt .75s cubic-bezier(.1,.8,.3,1) forwards}
.dm-pt.spark{width:calc(1.1cqw*var(--s));height:calc(.22cqw*var(--s));border-radius:.2cqw;background:linear-gradient(90deg,#fff,var(--c))}
.dm-pt.heal{width:auto;height:auto;background:none;box-shadow:none;color:var(--c);font-style:normal;font-weight:900;font-size:calc(1.4cqw*var(--s));text-shadow:0 0 .5cqw var(--c);animation:dmRise 1.1s ease-out forwards}
.dm-pt.burn{animation:dmRise .9s ease-out forwards;border-radius:50% 50% 50% 0}
.dm-pt.ice{border-radius:.1cqw;background:linear-gradient(#fff,var(--c))}
.dm-pt.zap{width:calc(1.4cqw*var(--s));height:.18cqw;border-radius:0}
.dm-pt.shield{border-radius:.15cqw;background:transparent;border:.15cqw solid var(--c)}
.dm-pt.ko{width:calc(.8cqw*var(--s));height:calc(.8cqw*var(--s));border-radius:.1cqw;background:#ddd}
.dm-pt.power{animation:dmPower .7s ease-out forwards}
@keyframes dmPt{0%{transform:translate(0,0) scale(1);opacity:1}100%{transform:translate(var(--dx),var(--dy)) scale(.2);opacity:0}}
@keyframes dmRise{0%{transform:translate(0,0);opacity:0}15%{opacity:1}100%{transform:translate(var(--dx),var(--dy));opacity:0}}
@keyframes dmPower{0%{transform:translate(var(--dx),var(--dy)) scale(.4);opacity:0}40%{opacity:1}100%{transform:translate(0,0) scale(1.4);opacity:0}}
.dm-impact{position:absolute;width:10cqw;aspect-ratio:1;transform:translate(-50%,-50%);pointer-events:none;background:radial-gradient(circle,#fff 0,#fff6 16%,color-mix(in srgb,var(--c) 70%,transparent) 36%,#0000 62%);border-radius:50%;animation:dmBoom .65s ease-out forwards}
.dm-impact svg{position:absolute;inset:6%;fill:#fffbe0;stroke:var(--c);stroke-width:3;filter:drop-shadow(0 0 .8cqw var(--c)) drop-shadow(0 0 .3cqw #fff);animation:dmBolt .6s steps(3) forwards}
.dm-impact .slash{position:absolute;left:-10%;right:-10%;top:48%;height:.5cqw;background:linear-gradient(90deg,#0000,#fff,var(--c),#0000);rotate:-28deg;box-shadow:0 0 1cqw var(--c);animation:dmSlash .35s ease-out forwards;transform-origin:0 50%}
.dm-impact.crit{width:15cqw}
@keyframes dmBoom{0%{transform:translate(-50%,-50%) scale(.2);opacity:1}55%{opacity:1}100%{transform:translate(-50%,-50%) scale(1.6);opacity:0}}
@keyframes dmBolt{0%{opacity:1;transform:rotate(-8deg)}50%{opacity:.5;transform:rotate(6deg) scale(1.1)}100%{opacity:0}}
@keyframes dmSlash{from{scale:0 1;opacity:1}60%{scale:1 1;opacity:1}to{scale:1 .2;opacity:0}}
.dm-ball{position:absolute;width:2.4cqw;aspect-ratio:1;translate:-50% -50%;border-radius:50%;background:radial-gradient(circle at 35% 30%,#fff,#e8eefc 45%,#8a96b8);box-shadow:0 0 1.2cqw var(--c),0 0 .4cqw #fff,inset -.3cqw -.3cqw .5cqw #0004;z-index:3}
.dm-ball::before{content:'';position:absolute;inset:28%;background:#1a1f33;clip-path:polygon(50% 0,100% 38%,82% 100%,18% 100%,0 38%)}
.dm-ball.big{width:3.6cqw;box-shadow:0 0 2cqw var(--c),0 0 .8cqw #fff}
.dm-elfx{position:absolute;width:12cqw;aspect-ratio:1;translate:-50% -50%;pointer-events:none}
.dm-elfx span{position:absolute;inset:0;border-radius:50%;opacity:0}
.dm-elfx.el-Fuego span{background:radial-gradient(circle,#fff6 0,#ffb02099 30%,#ff3a0066 50%,#0000 66%);animation:dmFireUp .8s ease-out forwards}
.dm-elfx.el-Fuego span:nth-child(2){animation-delay:.08s;inset:10% 25% 30%}
.dm-elfx.el-Fuego span:nth-child(3){animation-delay:.16s;inset:25% 35% 40%}
@keyframes dmFireUp{0%{opacity:1;scale:.3}60%{opacity:.9}100%{opacity:0;scale:1.3;translate:0 -4cqw}}
.dm-elfx.el-Aire span{border:.4cqw solid #bff4ff;box-shadow:0 0 1cqw #5ad8ff;border-left-color:transparent;border-bottom-color:transparent;animation:dmWind .7s ease-out forwards}
.dm-elfx.el-Aire span:nth-child(2){animation-delay:.07s;inset:15%}
.dm-elfx.el-Aire span:nth-child(3){animation-delay:.14s;inset:30%}
@keyframes dmWind{0%{opacity:1;rotate:0deg;scale:.4}100%{opacity:0;rotate:540deg;scale:1.5}}
.dm-elfx.el-Bosque span{background:radial-gradient(circle,#d8ffb066 0,#5acf3a55 40%,#0000 66%);animation:dmBoom2 .7s ease-out forwards}
.dm-elfx.el-Montana span{inset:40% -10% 40%;border-radius:0;background:linear-gradient(90deg,#0000,#3a2208 20%,#ffcf8a 50%,#3a2208 80%,#0000);clip-path:polygon(0 50%,20% 20%,35% 70%,50% 10%,65% 80%,80% 25%,100% 50%,80% 60%,65% 95%,50% 40%,35% 90%,20% 45%);animation:dmCrack .8s ease-out forwards}
.dm-elfx.el-Montana span:nth-child(2){rotate:60deg}.dm-elfx.el-Montana span:nth-child(3){rotate:-55deg}
@keyframes dmCrack{0%{opacity:1;scale:.2 1}40%{opacity:1;scale:1 1}100%{opacity:0}}
@keyframes dmBoom2{0%{opacity:1;scale:.3}100%{opacity:0;scale:1.4}}
.dm-pt.leaf{width:calc(1cqw*var(--s));height:calc(.5cqw*var(--s));border-radius:100% 0;background:linear-gradient(135deg,#c8ff8a,var(--c));box-shadow:none;animation:dmLeaf 1s ease-out forwards}
@keyframes dmLeaf{0%{transform:translate(0,0) rotate(0);opacity:1}100%{transform:translate(var(--dx),var(--dy)) rotate(540deg);opacity:0}}
.dm-pt.rock{width:calc(.9cqw*var(--s));height:calc(.75cqw*var(--s));border-radius:.15cqw;background:linear-gradient(135deg,#e0b47a,#6a4218);box-shadow:0 .1cqw .2cqw #0008;clip-path:polygon(20% 0,90% 15%,100% 70%,55% 100%,0 75%);animation:dmRock .8s cubic-bezier(.3,0,.7,1) forwards}
@keyframes dmRock{0%{transform:translate(0,0) rotate(0);opacity:1}70%{opacity:1}100%{transform:translate(var(--dx),calc(var(--dy) + 4cqw)) rotate(260deg);opacity:0}}
.dm-pt.star{width:auto;height:auto;background:none;box-shadow:none;color:var(--c);font-size:calc(1.3cqw*var(--s));text-shadow:0 0 .5cqw var(--c);font-style:normal}
.dm-wave{position:absolute;width:6cqw;aspect-ratio:1;transform:translate(-50%,-50%);border-radius:50%;border:.6cqw solid #fff6c0;box-shadow:0 0 2cqw var(--c),inset 0 0 2cqw var(--c);animation:dmWave .7s ease-out forwards;pointer-events:none}
@keyframes dmWave{to{width:80cqw;opacity:0;border-width:.1cqw}}
.dm-speed{position:absolute;inset:-20%;z-index:10;pointer-events:none;opacity:0;background:repeating-conic-gradient(from 0deg at 50% 45%,#fff0 0 2.6deg,#ffffff1c 2.6deg 3.4deg);transition:opacity .3s;-webkit-mask:radial-gradient(circle at 50% 45%,#0000 18%,#000 60%);mask:radial-gradient(circle at 50% 45%,#0000 18%,#000 60%)}
.dm-stage.ultimate .dm-speed{opacity:1;animation:dmSpeed .9s linear infinite}
.dm-stage.ultimate .dm-cam{filter:brightness(.75) saturate(1.2)}
@keyframes dmSpeed{to{rotate:8deg}}
.dm-cast{position:absolute;transform:translate(-50%,-50%);display:flex;flex-direction:column;align-items:center;width:20cqw;animation:dmCastL .45s cubic-bezier(.2,1.3,.4,1);z-index:2}
.dm-cast.s1{animation-name:dmCastR}
.dm-cast .dm-hc{width:11cqw;cursor:default;transform:rotate(-4deg);margin:0;filter:drop-shadow(0 0 1.2cqw #ffd76a99) drop-shadow(0 1cqw 1.4cqw #000)}
.dm-cast.s1 .dm-hc{transform:rotate(4deg);filter:drop-shadow(0 0 1.2cqw #4fb3ff99) drop-shadow(0 1cqw 1.4cqw #000)}
.dm-cast.big .dm-hc{width:12.5cqw;filter:drop-shadow(0 0 2.2cqw #ffb020) drop-shadow(0 1cqw 1.4cqw #000)}
.dm-stage.v .dm-cast .dm-hc{width:13cqw}.dm-stage.v .dm-cast.big .dm-hc{width:14.5cqw}
/* the card that is played shows its technique like in the hand: hidden, the frame's window for the name stayed empty and
   showed the table through it (author: «sale vacío y se ve mal») */
.dm-cast .dm-htech{font-size:calc(1.28cqw * var(--k))}
.dm-cast.out .dm-htech{font-size:calc(1.75cqw * var(--k))}
/* its entrance: it turns over as it arrives, a gleam crosses it, then the name band slides in under it */
.dm-cast .dm-hc{animation:dmCastFlip .55s cubic-bezier(.2,1.25,.4,1) backwards}
.dm-cast .dm-hshine{opacity:1;animation:dmShineRun .8s ease-out .3s 1 backwards}
.dm-cast .dm-cname{animation:dmCname .42s cubic-bezier(.2,1.3,.4,1) .16s backwards}
.dm-cast.s1 .dm-cname{animation-name:dmCnameR}
@keyframes dmCastFlip{from{transform:perspective(40cqw) rotateY(110deg) scale(.75);filter:brightness(2.4) drop-shadow(0 0 2cqw #fff)}}
@keyframes dmCname{from{translate:-35% 0;opacity:0}}
@keyframes dmCnameR{from{translate:35% 0;opacity:0}}
.dm-cast .dm-hmult{font-size:1.5cqw}
.dm-cname{position:relative;margin-top:-2.2cqw;width:21cqw;padding:.5cqw 1cqw .6cqw;box-sizing:border-box;transform:skewX(-12deg) rotate(-3deg);background:linear-gradient(90deg,#0000,#c4560bf2 10%,#ffb020f2 50%,#c4560bf2 90%,#0000);border-top:.2cqw solid #fff3c4;border-bottom:.2cqw solid #fff3c4;text-align:center;white-space:normal;animation:dmName .5s cubic-bezier(.2,1.3,.4,1) .08s backwards}
.dm-cast.s1 .dm-cname{transform:skewX(12deg) rotate(3deg);background:linear-gradient(90deg,#0000,#173a9af2 10%,#3f8cffe8 50%,#173a9af2 90%,#0000);border-color:#cfe7ff}
.dm-cname small{display:block;font-size:.9cqw;font-weight:800;color:#fff8e0;letter-spacing:.12em;text-transform:uppercase;transform:skewX(12deg);overflow:hidden;text-overflow:ellipsis}
.dm-cast.s1 .dm-cname small,.dm-cast.s1 .dm-cname span{transform:skewX(-12deg)}
.dm-cname span{display:block;font-size:1.75cqw;line-height:1.1;font-weight:900;font-style:italic;color:#fff;text-shadow:0 .2cqw 0 #6a2200,0 0 1cqw #fff8;transform:skewX(12deg);white-space:normal;overflow-wrap:anywhere}
.dm-cast.s1 .dm-cname span{text-shadow:0 .2cqw 0 #081a55,0 0 1cqw #fff8}
.dm-cast.big .dm-cname span{font-size:2cqw}
.dm-ceff{margin-top:.6cqw;width:19cqw;padding:.55cqw .8cqw;box-sizing:border-box;border-radius:.8cqw;background:linear-gradient(#13245ef2,#081238f2);border:.15cqw solid #ffd76aaa;box-shadow:0 .5cqw 1.2cqw #000c;animation:dmEff .45s cubic-bezier(.2,1.3,.4,1) .18s backwards}
.dm-cast.s1 .dm-ceff{border-color:#8fd0ffaa}
.dm-ceff p{margin:0;font-size:1.2cqw;line-height:1.25;color:#e8eeff;font-weight:700;white-space:normal}
.dm-ceff p+p{margin-top:.3cqw;color:#ffe9a8}
.dm-cast.s1 .dm-ceff p+p{color:#cfeaff}
.dm-stage.v .dm-ceff{display:none}
.dm-cast.go{transition:transform .3s ease-in,opacity .3s;opacity:0;transform:translate(-80%,-50%) scale(.9)}
.dm-cast.s1.go{transform:translate(-20%,-50%) scale(.9)}
.dm-cast.out{position:fixed;z-index:30}
.dm-cast.out .dm-hc{width:min(15cqw,78%)}.dm-cast.out.big .dm-hc{width:min(16.5cqw,86%)}
.dm-cast.out .dm-cname,.dm-cast.out .dm-ceff{width:100%}
.dm-side{transition:opacity .25s}
.dm-side.casting{opacity:.18}
@keyframes dmCastL{from{transform:translate(-160%,-50%) rotate(-14deg) scale(.7);opacity:0}}
@keyframes dmCastR{from{transform:translate(60%,-50%) rotate(14deg) scale(.7);opacity:0}}
@keyframes dmEff{from{transform:translateY(-1.2cqw) scaleY(.6);opacity:0}}
@keyframes dmName{from{transform:translateY(1cqw) scale(.7);opacity:0}}
.dm-banner{position:absolute;left:0;right:0;top:38%;display:grid;place-items:center;pointer-events:none;z-index:14;opacity:0}
.dm-banner.on{animation:dmBanner 1.1s ease-out forwards}
.dm-banner span{padding:.6cqw 4cqw;font-size:3cqw;font-weight:900;font-style:italic;color:#fff;letter-spacing:.1em;text-transform:uppercase;background:linear-gradient(90deg,#0000,#0b1440ee 20%,#0b1440ee 80%,#0000);text-shadow:0 0 1cqw #ffb020,0 .2cqw 0 #000;white-space:nowrap}
.dm-banner.s1 span{text-shadow:0 0 1cqw #4fb3ff,0 .2cqw 0 #000}
.dm-banner.combo span{font-size:3.4cqw;color:#ffe9a8}
.dm-banner.note span{font-size:1.6cqw}
@keyframes dmBanner{0%{opacity:0;transform:scaleY(.2) translateX(-20%)}12%{opacity:1;transform:none}80%{opacity:1}100%{opacity:0;transform:translateX(15%)}}
.dm-result{position:absolute;inset:0;display:grid;place-items:center;background:#000a;z-index:25;animation:dmBubble .4s}
.dm-result>div{text-align:center;padding:2cqw 4cqw;border-radius:2cqw;background:radial-gradient(circle at 50% 0,#2b4fb8,#0b1440);border:.3cqw solid #ffd76a;box-shadow:0 0 4cqw #ffb02088}
.dm-result h2{margin:0 0 1cqw;font-size:5cqw;color:#ffe9a8;text-shadow:0 0 2cqw #ffb020,0 .3cqw 0 #000}
.dm-result.lost h2{color:#cfe0ff;text-shadow:0 0 2cqw #4fb3ff,0 .3cqw 0 #000}
.dm-result p{margin:0 0 1.4cqw;color:#fff;font-size:1.4cqw;display:flex;flex-direction:column;gap:.4cqw}
.dm-prize{margin:0 0 1.2cqw!important;min-height:1em}
.dm-prize .coins{display:block;font:900 italic 3cqw/1 'Arial Black',sans-serif;color:#ffe14a;-webkit-text-stroke:.25cqw #6a2a00;paint-order:stroke fill;text-shadow:0 0 1.2cqw #ffb020}
.dm-prize.paid .coins{animation:dmPop .5s cubic-bezier(.2,1.6,.4,1)}
.dm-prize small{display:block;font-size:1.1cqw;color:#cfe0ff}
.dm-result button{font:900 1.6cqw 'Segoe UI',sans-serif;padding:.7cqw 3cqw;border-radius:1cqw;border:.2cqw solid #fff8;background:linear-gradient(#ffb63a,#e0700c);color:#3a1600;cursor:pointer}
/* the aiming arrow */
.dm-aim{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:11;opacity:0;transition:opacity .12s;--ac:#ff3b3b;--ah:#ff8a5a}
.dm-aim.on{opacity:1}
.dm-aim.ally{--ac:#2fe56a;--ah:#b8ffcf}
.dm-aim.locked{--ac:#ffb020;--ah:#fff2a8}
.dm-aim-trail{fill:none;stroke:var(--ac);stroke-width:2.2cqw;stroke-linecap:round;opacity:.25;filter:blur(.6cqw)}
.dm-aim-body{fill:url(#dmAimBody);stroke:#fff;stroke-opacity:.85;stroke-width:2px;stroke-linejoin:round;filter:drop-shadow(0 0 .4cqw var(--ac)) drop-shadow(0 .15cqw .2cqw #0009)}
.dm-aim-dots path{fill:#fff;stroke:none}
.dm-aim-head{fill:var(--ac);stroke:#fff;stroke-width:2.5px;stroke-linejoin:round;filter:drop-shadow(0 0 .6cqw var(--ac)) drop-shadow(0 .2cqw .2cqw #000a);transition:fill .15s}
.dm-aim.locked .dm-aim-head{animation:dmHead .5s ease-in-out infinite}
@keyframes dmHead{50%{filter:drop-shadow(0 0 1.2cqw var(--ac)) drop-shadow(0 0 .3cqw #fff)}}
.dm-aim-ring{display:none}
.dm-aim.locked .dm-aim-ring{opacity:1}
.dm-aim-ring circle{display:none;fill:none;stroke:var(--ac);stroke-width:.09;stroke-dasharray:.55 .25;filter:drop-shadow(0 0 .1px var(--ac))}
.dm-aim-ring path{stroke:#fff;stroke-width:.12;stroke-linecap:round}
/* ---- juice: the table is alive */
.dm-unit .dm-card{animation:dmIdle 3.2s ease-in-out infinite;animation-delay:calc(var(--i) * -3.2s + var(--ph,0ms))}
@keyframes dmIdle{50%{translate:0 -.35cqw}}
.dm-stage.scene .dm-unit:not(.acting) .dm-card{animation-play-state:paused}
.dm-auracv{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:1}
.dm-unit.full .dm-card{filter:drop-shadow(0 0 .3cqw #fff3b0) drop-shadow(0 0 1cqw #ffc93a) drop-shadow(0 .5cqw .6cqw #000b)}
.dm-unit.s1.full .dm-card{filter:drop-shadow(0 0 .3cqw #e0f4ff) drop-shadow(0 0 1cqw #4fb3ff) drop-shadow(0 .5cqw .6cqw #000b)}
.dm-unit.dm-hurt .dm-card{animation:dmWhite .24s}
@keyframes dmWhite{0%,45%{filter:brightness(2.6) saturate(.25) drop-shadow(0 .5cqw .6cqw #000b)}}
/* K.O.: white, a stamp, and he falls */
.dm-unit.koing .dm-card{animation:none;filter:brightness(2.4) saturate(0) contrast(1.3);scale:1.08;transition:filter .08s,scale .08s}
.dm-unit.ko{transition:margin .8s cubic-bezier(.5,0,.8,.4),rotate .8s,scale .8s,opacity .8s .1s}
.dm.slowmo .dm-stage{filter:contrast(1.15) saturate(1.3)}
.dm-float.kostamp{font-size:4.8cqw;font-style:italic;color:#ff3b3b;letter-spacing:.04em;-webkit-text-stroke:.28cqw #3a0000;paint-order:stroke fill;text-shadow:0 .35cqw 0 #000,0 0 1.6cqw #ff2a2a;margin-top:-1cqw;animation:dmKoStamp 1.4s cubic-bezier(.2,1.4,.4,1) backwards;z-index:3}
@keyframes dmKoStamp{0%{opacity:0;transform:translate(-50%,-50%) scale(3.2) rotate(-24deg)}16%{opacity:1;transform:translate(-50%,-50%) scale(.88) rotate(-9deg)}26%{transform:translate(-50%,-50%) scale(1.06) rotate(-9deg)}80%{opacity:1;transform:translate(-50%,-50%) scale(1) rotate(-9deg)}100%{opacity:0;transform:translate(-50%,-70%) scale(1) rotate(-9deg)}}
/* the rival's hand: backs in a fan and how many */
.dm-rq:not(.boxes){align-items:center;gap:.6cqw}
.dm-rhand{display:flex;padding:0 .8cqw}
.dm-rhand span{width:4.2cqw;margin:0 -1.45cqw;transform-origin:50% 140%;transform:rotate(calc(var(--k) * 8deg)) translateY(calc(var(--k) * var(--k) * .12cqw));filter:drop-shadow(0 .3cqw .35cqw #000d) drop-shadow(0 0 .25cqw #4fb3ff88);animation:dmPop .3s cubic-bezier(.2,1.6,.4,1) backwards;transition:transform .2s}
.dm-rhand span img{width:100%;display:block}
.dm-rq>em{font-style:normal;font:900 1.1cqw 'Arial Black','Segoe UI',sans-serif;color:#fff;min-width:1.7cqw;height:1.7cqw;display:grid;place-items:center;border-radius:50%;background:linear-gradient(#8fd0ff,#1d5bd0);border:.15cqw solid #fff;box-shadow:0 .2cqw .3cqw #000a}
/* the turn changes: a ribbon sweeps across */
.dm-banner.turn span{font-size:4.2cqw;padding:.7cqw 9cqw .8cqw;background:linear-gradient(90deg,#0000,#c4560bee 15%,#ffb020f2 50%,#c4560bee 85%,#0000);border-top:.25cqw solid #fff3c4;border-bottom:.25cqw solid #fff3c4;transform:skewX(-12deg);text-shadow:0 .25cqw 0 #6a2200,0 0 1.2cqw #fff8}
.dm-banner.turn.s1 span{background:linear-gradient(90deg,#0000,#173a9aee 15%,#3f8cfff2 50%,#173a9aee 85%,#0000);border-color:#cfe7ff;text-shadow:0 .25cqw 0 #081a55,0 0 1.2cqw #fff8}
.dm-banner.turn.on{animation:dmTurnBn 1.25s cubic-bezier(.2,.9,.3,1) forwards}
@keyframes dmTurnBn{0%{opacity:0;transform:translateX(-70%)}14%{opacity:1;transform:translateX(3%)}22%{transform:none}78%{opacity:1;transform:translateX(-2%)}100%{opacity:0;transform:translateX(70%)}}
/* the end: confetti for a win, the table goes grey for a loss */
.dm-conf{position:absolute;top:-3%;width:calc(1cqw * var(--s));height:calc(.5cqw * var(--s));background:var(--c);border-radius:.1cqw;z-index:26;pointer-events:none;animation:dmConf var(--t) cubic-bezier(.3,.5,.6,1) backwards}
@keyframes dmConf{to{transform:translate(var(--x),66cqw) rotate(var(--r));opacity:.85}}
.dm-stage.lost .dm-cam{filter:grayscale(.85) brightness(.65);transition:filter 1.4s}
.dm-result>div{animation:dmResPop .7s cubic-bezier(.2,1.5,.4,1) backwards}
@keyframes dmResPop{from{transform:scale(.4) rotate(-6deg);opacity:0}}
.dm-result.won h2{animation:dmWinH 1.8s ease-in-out infinite}
@keyframes dmWinH{50%{text-shadow:0 0 3.4cqw #ffb020,0 0 1cqw #fff,0 .3cqw 0 #000;scale:1.05}}
/* an ulti or a combined technique cuts in across the table */
.dm-cutin{position:absolute;inset:0;z-index:15;pointer-events:none;display:grid;align-items:center;overflow:hidden}
.dm-cut-band{position:relative;height:22cqw;display:flex;align-items:center;justify-content:center;gap:3cqw;transform:skewY(-6deg);background:linear-gradient(90deg,#0000,#c4560be8 10%,#ffb020f0 50%,#c4560be8 90%,#0000);border-top:.35cqw solid #fff3c4;border-bottom:.35cqw solid #fff3c4;box-shadow:0 0 4cqw #ffb02088;animation:dmCut 1.3s cubic-bezier(.2,.9,.3,1) forwards}
.dm-cutin.s1 .dm-cut-band{background:linear-gradient(90deg,#0000,#173a9ae8 10%,#3f8cfff0 50%,#173a9ae8 90%,#0000);border-color:#cfe7ff;box-shadow:0 0 4cqw #4fb3ff88}
.dm-cut-band::before{content:'';position:absolute;inset:0;background:repeating-linear-gradient(90deg,#fff0 0 3cqw,#ffffff22 3cqw 3.4cqw);animation:dmCutLines .4s linear infinite}
.dm-cut-faces{display:flex;gap:1cqw;transform:skewY(6deg);animation:dmCutFaces 1.3s cubic-bezier(.2,.9,.3,1) forwards}
.dm-cut-faces>*{flex:none;filter:drop-shadow(0 .4cqw .6cqw #000c)}
.dm-cut-band b{position:relative;transform:skewY(6deg) skewX(-12deg);font-size:4.4cqw;font-weight:900;font-style:italic;color:#fff;white-space:nowrap;text-shadow:0 .3cqw 0 #6a2200,0 0 1.6cqw #fff9;animation:dmCutName 1.3s cubic-bezier(.2,.9,.3,1) forwards}
.dm-cutin.s1 .dm-cut-band b{text-shadow:0 .3cqw 0 #081a55,0 0 1.6cqw #fff9}
@keyframes dmCut{0%{opacity:0;transform:skewY(-6deg) scaleY(0)}12%{opacity:1;transform:skewY(-6deg) scaleY(1.1)}20%{transform:skewY(-6deg)}82%{opacity:1;transform:skewY(-6deg)}100%{opacity:0;transform:skewY(-6deg) scaleY(0)}}
@keyframes dmCutFaces{0%{translate:60cqw 0}22%{translate:-2cqw 0}80%{translate:2cqw 0}100%{translate:-60cqw 0}}
@keyframes dmCutName{0%{translate:-60cqw 0;opacity:0}26%{translate:1cqw 0;opacity:1}80%{translate:-1cqw 0;opacity:1}100%{translate:60cqw 0;opacity:0}}
@keyframes dmCutLines{to{background-position:3.4cqw 0}}
/* ---- juice 2 */
.dm-hshine{position:absolute;inset:3% 4%;border-radius:7%;pointer-events:none;z-index:3;opacity:0;background:linear-gradient(105deg,#fff0 32%,#ffffff2a 46%,#ffffff55 50%,#ffffff2a 54%,#fff0 68%);background-size:300% 100%;background-position:calc(100% - var(--mx,50%)) 0;transition:opacity .2s}
.dm-hand .dm-hc:hover .dm-hshine{opacity:1}
.dm-hc.ulti .dm-hshine,.dm-hc.combo .dm-hshine{opacity:.55;animation:dmShineRun 2.4s linear infinite}
@keyframes dmShineRun{from{background-position:200% 0}to{background-position:-100% 0}}
.dm-hand .dm-hc.drag{transition:transform .15s,filter .2s,rotate .08s linear}
.dm-g.gain{animation:dmOrbGain .7s cubic-bezier(.2,1.8,.4,1) backwards;animation-delay:var(--gd,0ms)}
@keyframes dmOrbGain{0%{scale:0;filter:brightness(4) drop-shadow(0 0 1cqw #fff)}50%{scale:1.7;filter:brightness(2) drop-shadow(0 0 .8cqw #ffd76a)}}
/* the ball's patch spins; the ball itself only flies, so its tail stays pointed back along the shot */
.dm-ball::before{animation:dmBallSpin .16s linear infinite}
@keyframes dmBallSpin{to{rotate:360deg}}
.dm-tail{position:absolute;right:50%;top:50%;width:7cqw;height:65%;translate:0 -50%;transform-origin:100% 50%;rotate:var(--ang);border-radius:50% 0 0 50%;background:linear-gradient(90deg,#0000,var(--c) 70%,#fff);filter:blur(.25cqw);opacity:.9;z-index:-1}
.dm-ball.big .dm-tail{width:11cqw;height:80%}
.dm-vig{position:absolute;inset:0;z-index:13;pointer-events:none;background:radial-gradient(ellipse at 50% 50%,#0000 45%,var(--c) 130%);animation:dmVig .6s ease-out forwards;mix-blend-mode:screen}
@keyframes dmVig{0%{opacity:0}15%{opacity:1}100%{opacity:0}}
.dm-cflash{position:absolute;width:.9cqw;aspect-ratio:1;translate:-50% -50%;border-radius:50%;background:radial-gradient(circle,#fff 0,#fff 25%,#bfe4ff88 45%,#0000 70%);pointer-events:none;z-index:1;opacity:0;animation:dmCFlash .5s ease-out forwards}
.dm-cflash::after{content:'';position:absolute;left:50%;top:50%;width:300%;height:12%;translate:-50% -50%;background:linear-gradient(90deg,#0000,#fff,#0000)}
@keyframes dmCFlash{0%{opacity:0;scale:.3}12%{opacity:1;scale:1.3}100%{opacity:0;scale:.8}}
.dm-unit.cheer{animation:dmCheer .9s cubic-bezier(.3,0,.5,1) infinite;animation-delay:calc(var(--i) * -.9s)}
@keyframes dmCheer{0%,100%{translate:0 0}40%{translate:0 -2.2cqw;rotate:-3deg}60%{translate:0 -2cqw;rotate:3deg}}
.dm-prize .coins.done{animation:dmCoinDone .6s cubic-bezier(.2,1.6,.4,1)}
@keyframes dmCoinDone{40%{scale:1.25;filter:brightness(1.6) drop-shadow(0 0 1.5cqw #ffd23a)}}
/* ---- the Garra fills: a pillar of light and rings; the ulti card makes an entrance */
.dm-ultifx{position:absolute;width:0;height:0;pointer-events:none;z-index:4}
.dm-ultifx .pillar{position:absolute;left:-4cqw;width:8cqw;bottom:-6cqw;height:40cqw;background:linear-gradient(#ffd23a00,#ffd23a66 40%,#fff6c8cc 80%,#fff);filter:blur(.6cqw);border-radius:50% 50% 0 0;transform-origin:50% 100%;animation:dmPillar 1.3s cubic-bezier(.2,.9,.3,1) forwards;mix-blend-mode:screen}
.dm-ultifx.s1 .pillar{background:linear-gradient(#8fd0ff00,#8fd0ff66 40%,#e0f4ffcc 80%,#fff)}
.dm-ultifx .ring{position:absolute;left:-7cqw;top:-7cqw;width:14cqw;height:14cqw;border-radius:50%;border:.5cqw solid #ffd23a;box-shadow:0 0 1.5cqw #ffb020,inset 0 0 1.5cqw #ffb020;animation:dmURing .8s ease-out forwards}
.dm-ultifx.s1 .ring{border-color:#8fd0ff;box-shadow:0 0 1.5cqw #4fb3ff,inset 0 0 1.5cqw #4fb3ff}
.dm-ultifx .ring.r2{animation-delay:.18s;opacity:0}
@keyframes dmPillar{0%{transform:scaleY(0) scaleX(.4);opacity:0}20%{transform:scaleY(1.05) scaleX(1);opacity:1}70%{opacity:.9}100%{transform:scaleY(1) scaleX(.2);opacity:0}}
@keyframes dmURing{0%{transform:scale(.2);opacity:1}100%{transform:scale(1.6);opacity:0}}
.dm-float.ultiready{font-size:2cqw;font-style:italic;color:#ffe14a;-webkit-text-stroke:.16cqw #6a2a00;paint-order:stroke fill;text-shadow:0 0 1cqw #ffb020,0 .2cqw 0 #000;margin-top:-4cqw;letter-spacing:.04em;animation:dmUReady 1.6s cubic-bezier(.2,1.4,.4,1) backwards}
.dm-float.ultiready.s1{color:#cfeaff;-webkit-text-stroke-color:#081a55;text-shadow:0 0 1cqw #4fb3ff,0 .2cqw 0 #000}
@keyframes dmUReady{0%{opacity:0;transform:translate(-50%,-50%) scale(.3)}15%{opacity:1;transform:translate(-50%,-50%) scale(1.3)}25%{transform:translate(-50%,-50%) scale(1)}80%{opacity:1;transform:translate(-50%,-80%)}100%{opacity:0;transform:translate(-50%,-110%)}}
.dm-unit.full .dm-g.on img{filter:drop-shadow(0 0 .4cqw #ffd23a)}
.dm-hc.ultiin{animation:dmUltiIn 1.2s cubic-bezier(.2,1.4,.4,1)}
@keyframes dmUltiIn{0%{transform:translateY(-8cqw) rotateY(180deg) scale(.6);filter:brightness(3) drop-shadow(0 0 2cqw #ffd23a)}45%{transform:translateY(-4cqw) rotateY(0deg) scale(1.35);filter:brightness(1.8) drop-shadow(0 0 2.4cqw #ffd23a)}100%{filter:drop-shadow(0 0 .6cqw #ffd23a) drop-shadow(0 .5cqw .6cqw #000c)}}
/* ---- juice 4: the VS opening */
.dm-vs{position:absolute;inset:0;z-index:30;display:flex;align-items:center;justify-content:center;gap:2cqw;background:radial-gradient(ellipse at 50% 50%,#0b1a4acc,#02040ff2);pointer-events:none;animation:dmVsBg .4s ease-out;overflow:hidden}
.dm-stage.v .dm-vs{flex-direction:column;gap:3cqw}
.dm-vs.out{animation:dmVsOut .42s ease-in forwards}
@keyframes dmVsBg{from{opacity:0}}
@keyframes dmVsOut{to{opacity:0;transform:scale(1.15)}}
.dm-vs-side{display:flex;flex-direction:column;align-items:center;gap:.6cqw;padding:1.4cqw 3cqw;transform:skewX(-10deg);border-top:.3cqw solid #fff3c4;border-bottom:.3cqw solid #fff3c4;background:linear-gradient(90deg,#0000,#c4560bdd 15%,#ffb020ee 50%,#c4560bdd 85%,#0000)}
.dm-vs-side.s1{background:linear-gradient(90deg,#0000,#173a9add 15%,#3f8cffee 50%,#173a9add 85%,#0000);border-color:#cfe7ff}
.dm-vs-side.s0{animation:dmVsL .55s cubic-bezier(.2,1.2,.4,1) backwards}
.dm-vs-side.s1{animation:dmVsR .55s cubic-bezier(.2,1.2,.4,1) backwards}
@keyframes dmVsL{from{transform:skewX(-10deg) translateX(-80cqw)}}
@keyframes dmVsR{from{transform:skewX(-10deg) translateX(80cqw)}}
.dm-vs-side .faces{display:flex;gap:.8cqw;transform:skewX(10deg)}
.dm-vs-side .faces>span{filter:drop-shadow(0 .4cqw .5cqw #000c);animation:dmPop .4s cubic-bezier(.2,1.6,.4,1) backwards;animation-delay:calc(.3s + var(--k) * .08s)}
.dm-vs-side b{transform:skewX(10deg);font-size:2.4cqw;font-weight:900;font-style:italic;color:#fff;letter-spacing:.08em;text-transform:uppercase;text-shadow:0 .25cqw 0 #000a,0 0 1cqw #fff8}
.dm-vs-side small{transform:skewX(10deg);font-size:1.1cqw;font-weight:800;color:#fff8e0;min-height:1.2em}
.dm-vs-x{position:relative;z-index:2}
.dm-vs-x span{display:block;font:900 italic 9cqw/1 'Arial Black','Segoe UI Black',sans-serif;color:#ffe14a;-webkit-text-stroke:.45cqw #6a1a00;paint-order:stroke fill;text-shadow:0 .5cqw 0 #000,0 0 3cqw #ff8a2a;animation:dmVsX .5s cubic-bezier(.2,1.6,.4,1) .45s backwards}
@keyframes dmVsX{from{transform:scale(4) rotate(-20deg);opacity:0}}
.dm-stage.intro .dm-unit{animation:dmDrop .6s cubic-bezier(.2,1.4,.4,1) backwards;animation-delay:calc(var(--i) * .35s + var(--ia,0ms))}
@keyframes dmDrop{from{margin-top:-14cqw;opacity:0;scale:1.3}}
/* life bar chips */
.dm-chip{position:absolute;width:.8cqw;height:.55cqw;background:var(--c);border:.08cqw solid #000a;border-radius:.1cqw;z-index:6;pointer-events:none;animation:dmChip .85s cubic-bezier(.2,.6,.5,1) forwards}
@keyframes dmChip{0%{transform:translate(-50%,-50%)}100%{transform:translate(calc(-50% + var(--dx)),calc(-50% + var(--dy) + 4cqw)) rotate(var(--r));opacity:0}}
/* a status slams onto the card */
.dm-stslam{position:absolute;width:6cqw;translate:-50% -50%;pointer-events:none;z-index:6;animation:dmStSlam .85s cubic-bezier(.2,1.4,.4,1) forwards}
.dm-stslam img{width:100%;display:block;filter:drop-shadow(0 0 1cqw #fff) drop-shadow(0 .4cqw .4cqw #000a)}
@keyframes dmStSlam{0%{transform:scale(2.6);opacity:0}25%{transform:scale(.9);opacity:1}40%{transform:scale(1.08)}75%{opacity:1}100%{transform:scale(.4) translateY(-6cqw);opacity:0}}
/* a block: a hex shield flashes; a dodge leaves an afterimage */
.dm-shieldfx{position:absolute;width:12cqw;height:16cqw;translate:-50% -50%;pointer-events:none;z-index:6;clip-path:polygon(50% 0,93% 25%,93% 75%,50% 100%,7% 75%,7% 25%);background:radial-gradient(circle,#bfe8ff44 25%,#4fb3ffcc 62%,#ffffff 66%,#8fd0ff 70%,#4fb3ff00 74%);animation:dmShieldFx .75s cubic-bezier(.2,1.4,.4,1) forwards}
.dm-shieldfx::before{content:'';position:absolute;inset:18%;clip-path:inherit;background:radial-gradient(circle,#0000 55%,#ffffffcc 62%,#8fd0ff 66%,#0000 70%)}
@keyframes dmShieldFx{0%{transform:scale(.4);opacity:0}25%{transform:scale(1.05);opacity:1}60%{opacity:.9}100%{transform:scale(1.15);opacity:0}}
.dm-unit .dm-card.dm-after{position:absolute!important;inset:0;opacity:.6;pointer-events:none;animation:dmAfter .55s ease-out forwards;filter:brightness(1.6) saturate(.4) drop-shadow(0 0 .6cqw #fff)!important}
@keyframes dmAfter{to{transform:translateX(-4cqw);opacity:0}}
.dm-banner.hits span{font-size:2.4cqw;color:#ffe14a;padding:.4cqw 3cqw}
/* ---- juice 5: buffs, debuffs, stances, cards */
.dm-float.mod{font-size:1.35cqw;font-style:normal;margin-top:-1.5cqw}
.dm-float.mod.up{color:#7dffa0}
.dm-float.mod.down{color:#d8a0ff}
.dm-float.mod.stance{color:#bfe8ff}
.dm-pt.arrow{font:900 calc(1.2cqw * var(--s)) 'Arial Black',sans-serif;color:var(--c);text-shadow:0 0 .5cqw var(--c);background:none;width:auto;height:auto}
.dm-unit.buffed .dm-card{animation:dmBuffed .8s}
@keyframes dmBuffed{35%{filter:brightness(1.4) drop-shadow(0 0 1.2cqw #6aff8a)}}
.dm-unit.debuffed .dm-card{animation:dmDebuffed .8s}
@keyframes dmDebuffed{35%{filter:brightness(.8) saturate(1.6) hue-rotate(40deg) drop-shadow(0 0 1.2cqw #c46aff)}}
.dm-wave.self{animation-duration:.7s}
.dm-stancefx{position:absolute;width:15cqw;height:20cqw;translate:-50% -50%;pointer-events:none;border-radius:50%;border:.35cqw dashed #bfe8ff;box-shadow:0 0 1.2cqw #4fb3ff,inset 0 0 1.2cqw #4fb3ff;animation:dmStance 1s cubic-bezier(.2,1.2,.4,1) forwards}
.dm-stancefx.s0{border-color:#ffe9a8;box-shadow:0 0 1.2cqw #ffb020,inset 0 0 1.2cqw #ffb020}
@keyframes dmStance{0%{transform:scale(.4) rotate(0);opacity:0}30%{transform:scale(1) rotate(60deg);opacity:1}100%{transform:scale(1.1) rotate(160deg);opacity:0}}
.dm-float.cardsfx{font-size:1.8cqw;z-index:20}
.dm-float.cardsfx.up{color:#ffe14a}
.dm-float.cardsfx.down{color:#d8a0ff}
.dm-hand.cards-up .dm-hc{animation:dmCardsUp .7s ease-out}
@keyframes dmCardsUp{40%{filter:brightness(1.6) drop-shadow(0 0 1cqw #ffd76a)}}
.dm-rq.cards-down{animation:dmCardsDown .7s ease-out}
.dm-hand.cards-down .dm-hc{animation:dmCardsDown .7s ease-out}
@keyframes dmCardsDown{20%,60%{translate:-.4cqw 0;filter:brightness(.7) drop-shadow(0 0 1cqw #c46aff)}40%,80%{translate:.4cqw 0}}
/* ---- juice 6 */
.dm-slashx{position:absolute;width:13cqw;height:13cqw;translate:-50% -50%;pointer-events:none;z-index:7}
.dm-slashx i{position:absolute;left:-10%;right:-10%;top:50%;height:.5cqw;border-radius:50%;background:linear-gradient(90deg,#fff0,#fff 40%,#ffe14a 60%,#fff0);box-shadow:0 0 1cqw #ffb020;transform-origin:50% 50%;animation:dmSlashX .55s cubic-bezier(.2,.9,.3,1) forwards}
.dm-slashx i:first-child{rotate:-35deg}
.dm-slashx i:last-child{rotate:35deg;animation-delay:.07s}
@keyframes dmSlashX{0%{transform:scaleX(0);opacity:1}35%{transform:scaleX(1);opacity:1}100%{transform:scaleX(1.1);opacity:0}}
.dm.finale .dm-stage{filter:saturate(1.4) contrast(1.15)}
.dm.finale .dm-cam{transition:transform .7s cubic-bezier(.2,.9,.3,1)}
.dm.finale .dm-speed{opacity:1;animation:dmSpeed .9s linear infinite}
.dm-unit.danger .dm-card{animation:dmDanger .45s ease-in-out 3}
@keyframes dmDanger{50%{filter:drop-shadow(0 0 1.2cqw #ff2a2a) brightness(1.2) saturate(1.4)}}
.dm-stage.dangerv::after{content:'';position:absolute;inset:0;pointer-events:none;z-index:13;background:radial-gradient(ellipse at 50% 50%,#0000 50%,#ff1a1a66 120%);animation:dmDangerV .65s ease-in-out 2}
@keyframes dmDangerV{0%,100%{opacity:0}30%{opacity:1}}
.dm-center.flip{animation:dmFlip .7s cubic-bezier(.3,1.3,.5,1)}
@keyframes dmFlip{0%{transform:translate(-50%,-50%) rotateY(0) scale(1)}50%{transform:translate(-50%,-50%) rotateY(180deg) scale(1.35)}100%{transform:translate(-50%,-50%) rotateY(360deg) scale(1)}}
/* searchlights sweep over the stands */
.dm-spot{position:absolute;top:-30%;width:22%;height:90%;pointer-events:none;z-index:1;transform-origin:50% 0;background:linear-gradient(#fff0,#fff2 30%,#fff0 90%);clip-path:polygon(45% 0,55% 0,100% 100%,0 100%);filter:blur(.6cqw);opacity:.35;will-change:rotate,opacity;animation:dmSpot 9s ease-in-out infinite}
.dm-spot.a{left:12%;animation-delay:-2s}
.dm-spot.b{right:12%;animation-direction:reverse;animation-delay:-6s}
@keyframes dmSpot{0%,100%{rotate:-28deg;opacity:.35}50%{rotate:28deg;opacity:.7}}
body.lowfx .dm-spot{display:none}
/* ---- the players' plates (profile icon in its frame, name on its banner; the CPU shows its coach) */
.dm-plate{position:absolute;transform:translate(-50%,-50%);display:flex;align-items:center;gap:.7cqw;padding:.45cqw 1.1cqw .45cqw .45cqw;border-radius:3cqw;background:linear-gradient(90deg,#0b1647ee,#13245ee6);border:.15cqw solid #ffd76a99;box-shadow:0 .4cqw 1cqw #000a;z-index:4;max-width:24cqw;pointer-events:none}
.dm-plate.s1{flex-direction:row-reverse;padding:.45cqw .45cqw .45cqw 1.1cqw;border-color:#8fd0ff99;background:linear-gradient(270deg,#0b1647ee,#13245ee6)}
.dm-plate .dmp-ic{flex:none;display:grid;place-items:center}
.dm-plate .dmp-ic.cpu{width:4.4cqw;height:4.4cqw;border-radius:50%;overflow:hidden;background:radial-gradient(circle at 50% 35%,#4a74d0,#14205a 70%);border:.2cqw solid #8fd0ff;font-size:2cqw}
.dm-plate .dmp-ic.cpu img{width:100%;height:100%;object-fit:cover}
.dm-plate .dmp-tx{display:flex;flex-direction:column;min-width:0;line-height:1.1}
.dm-plate.s1 .dmp-tx{align-items:flex-end}
.dm-plate .dmp-name{position:relative;display:block;font:900 1.5cqw 'Segoe UI',sans-serif;color:#fff;white-space:nowrap;text-shadow:0 .12cqw 0 #000}
.dm-plate small{font-size:.95cqw;font-weight:800;color:#ffe9a8;letter-spacing:.06em;text-transform:uppercase}
.dm-plate.s1 small{color:#cfeaff}
.dm-stage.scene .dm-plate{opacity:.35;transition:opacity .3s}
.dm-plate.s0{padding-left:1.1cqw}
.dm-plate .dmp-ic{margin:-.8cqw 0}
.dm-plate .dmp-tx.rb{position:relative;padding:.5cqw 2.6cqw .5cqw 1.1cqw;min-width:16cqw;border-radius:.5cqw;overflow:hidden}
.dm-plate .dmp-tx.rb>.pn-ribbon{position:absolute;inset:0;display:block;width:100%;height:100%;z-index:0;--notch:1.4cqw}
.dm-plate .dmp-tx.rb>.pn-ribbon .pnr-in{position:absolute;inset:0}
.dm-plate .dmp-tx.rb>b,.dm-plate .dmp-tx.rb>small{position:relative;z-index:1;text-shadow:0 .15cqw 0 #000,0 0 .5cqw #000}
.dm-stage.v .dm-plate{max-width:44cqw}
/* the VS: each side's plate drops in over its starters */
.dm-vs .dm-plate.vs{position:relative;left:auto;top:auto;transform:skewX(10deg) scale(1.3);margin:.6cqw 0 1.4cqw;max-width:none;opacity:1;animation:dmVsPlate .6s cubic-bezier(.2,1.5,.4,1) .35s backwards}
@keyframes dmVsPlate{from{transform:skewX(10deg) translateY(-6cqw) scale(.4);opacity:0}}
.dm-vs-side small{margin-top:.3cqw}
/* ---- what a footballer suffers shows on his card, for as long as it lasts */
.dm-stfx{position:absolute;inset:0;z-index:3;pointer-events:none}
.dm-stfx i{position:absolute;display:none}
/* frozen: the card is cased in ice, frost creeping in from the edges and a cold shine running over it */
.dm-unit.st-congelado .dm-card{filter:saturate(.45) brightness(1.08) hue-rotate(-12deg) drop-shadow(0 0 .7cqw #8fd8ff) drop-shadow(0 .5cqw .6cqw #000b)}
.dm-unit.st-congelado .dm-stfx{inset:3% 4%;border-radius:7%;border:.25cqw solid #e6fbffcc;background:radial-gradient(ellipse at 50% 50%,#0000 45%,#bfeaff66 80%,#e6fbffaa),linear-gradient(135deg,#ffffff55,#8fd8ff22 35%,#0000 50%,#bfeaff33 75%,#ffffff44);box-shadow:inset 0 0 1.2cqw #bff4ff,0 0 .8cqw #8fd8ff}
.dm-unit.st-congelado .dm-stfx::after{content:'';position:absolute;inset:0;border-radius:inherit;background:linear-gradient(115deg,#0000 35%,#ffffffaa 48%,#0000 60%);background-size:250% 100%;animation:dmIceShine 2.6s ease-in-out infinite;animation-delay:var(--ph,0ms)}
@keyframes dmIceShine{0%,60%{background-position:150% 0}100%{background-position:-50% 0}}
/* burning: flames lick up from the bottom and the card glows hot */
.dm-unit.st-quemadura .dm-card{filter:sepia(.25) saturate(1.3) drop-shadow(0 0 .7cqw #ff7a1a) drop-shadow(0 .5cqw .6cqw #000b)}
/* electrified: bolts crackle over the card */
.dm-unit.st-electrizado .dm-card{filter:saturate(1.2) drop-shadow(0 0 .6cqw #7fe8ff) drop-shadow(0 .5cqw .6cqw #000b)}
/* stunned: stars circle over his head and he sways */
.dm-unit.st-aturdido .dm-card{filter:saturate(.7) brightness(.9) drop-shadow(0 .5cqw .6cqw #000b)}
.dm-unit.st-aturdido .dm-stfx{inset:-16% 0 auto;height:18%}
.dm-unit.st-aturdido .dm-stfx i{display:block;left:50%;top:50%;width:2.6cqw;height:2.6cqw;margin:-1.3cqw;background:#ffe14a;clip-path:polygon(50% 0,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%);filter:drop-shadow(0 0 .4cqw #ffb020);animation:dmDizzy 1.4s linear infinite}
.dm-unit.st-aturdido .dm-stfx i:nth-child(2){animation-delay:-.47s;background:#fff3b0}.dm-unit.st-aturdido .dm-stfx i:nth-child(3){animation-delay:-.93s}
@keyframes dmDizzy{0%{transform:translate(-3.6cqw,0) scale(.75);opacity:.8}25%{transform:translate(0,.9cqw) scale(1.15);opacity:1}50%{transform:translate(3.6cqw,0) scale(.75);opacity:.8}75%{transform:translate(0,-.9cqw) scale(.55);opacity:.45}100%{transform:translate(-3.6cqw,0) scale(.75);opacity:.8}}
/* taunting: a red ring pulses around him */
.dm-unit.st-provocar .dm-stfx{inset:-5% -7%;border-radius:12%;border:.3cqw solid #ff4a4a;box-shadow:0 0 1cqw #ff2a2a,inset 0 0 1cqw #ff2a2a88;animation:dmTaunt 1.1s ease-in-out infinite;animation-delay:var(--ph,0ms)}
@keyframes dmTaunt{50%{transform:scale(1.05);opacity:.55}}
/* a dodge: speed lines where he stood */
.dm-dodgefx{position:absolute;width:12cqw;height:14cqw;translate:-50% -50%;pointer-events:none;z-index:6}
.dm-dodgefx i{position:absolute;left:0;height:.25cqw;width:70%;border-radius:.2cqw;background:linear-gradient(90deg,#fff0,#fff,#fff0);animation:dmDodgeLine .5s ease-out forwards}
.dm-dodgefx i:nth-child(1){top:20%}.dm-dodgefx i:nth-child(2){top:42%;width:90%;animation-delay:.04s}.dm-dodgefx i:nth-child(3){top:62%;animation-delay:.08s}.dm-dodgefx i:nth-child(4){top:82%;width:55%;animation-delay:.12s}
@keyframes dmDodgeLine{0%{transform:translateX(30%) scaleX(.2);opacity:0}30%{opacity:1}100%{transform:translateX(-50%) scaleX(1);opacity:0}}
/* the ice breaking: cracks run over the card, then it bursts into shards */
.dm-shatter{position:absolute;translate:-50% -50%;pointer-events:none;z-index:8}
.dm-shatter svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible;animation:dmCrack .2s ease-out forwards}
.dm-shatter svg path{fill:none;stroke:#fff;stroke-width:2.2;stroke-linecap:round;filter:drop-shadow(0 0 3px #8fd8ff)}
@keyframes dmCrack{from{opacity:0;transform:scale(.6)}}
.dm-shatter b{position:absolute;left:50%;top:50%;background:linear-gradient(135deg,#ffffff,#cdf2ff 40%,#6fc6ff 75%,#e8fbff);box-shadow:inset 0 0 .4cqw #fff;opacity:.95}
.dm-icering{position:absolute;width:14cqw;height:18cqw;translate:-50% -50%;pointer-events:none;z-index:7;border-radius:12%;border:.35cqw solid #e6fbff;box-shadow:0 0 1.4cqw #8fd8ff,inset 0 0 1.4cqw #8fd8ff;animation:dmIceRing .6s cubic-bezier(.2,.9,.3,1) forwards}
@keyframes dmIceRing{0%{transform:scale(1.6);opacity:0}40%{opacity:1}100%{transform:scale(.95);opacity:0}}
.dm-stcv{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:6}
/* ---- fusion: shockwave, beam, stars popping one by one, the card glowing in its rank's colour */
.dm-fusering{position:absolute;width:0;height:0;pointer-events:none;z-index:22}
.dm-fusering i{position:absolute;left:-5cqw;top:-5cqw;width:10cqw;height:10cqw;border-radius:50%;border:.45cqw solid var(--c);box-shadow:0 0 1.4cqw var(--c),inset 0 0 1.2cqw var(--c);animation:dmFuseRing .7s cubic-bezier(.2,.8,.3,1) forwards}
.dm-fusering i+i{animation-delay:.12s;opacity:0;border-width:.25cqw}
.dm-fusering b{position:absolute;left:-2.2cqw;bottom:-1cqw;width:4.4cqw;height:22cqw;border-radius:50% 50% 0 0;background:linear-gradient(#fff0,var(--c) 50%,#fff);filter:blur(.4cqw);transform-origin:50% 100%;mix-blend-mode:screen;animation:dmFuseBeam .8s cubic-bezier(.2,.9,.3,1) forwards}
@keyframes dmFuseRing{0%{transform:scale(.2);opacity:1}55%{opacity:.85}100%{transform:scale(2.2);opacity:0}}
@keyframes dmFuseBeam{0%{transform:scaleY(0) scaleX(.3);opacity:0}25%{transform:scaleY(1) scaleX(1);opacity:.95}100%{transform:scaleY(1.1) scaleX(.15);opacity:0}}
.dm-float.rank{display:flex;flex-direction:row;gap:.2cqw;animation:dmRankUp 1.6s ease-out forwards}
.dm-float.rank span{display:inline-block;animation:dmStarPop .45s cubic-bezier(.2,1.8,.4,1) backwards;animation-delay:calc(.09s + var(--k) * .12s)}
.dm-float.rank.r2{color:#cfeaff;text-shadow:0 0 .8cqw #4fb3ff,0 .15cqw 0 #000}
.dm-float.rank.r3{color:#ffe14a;font-size:3cqw;text-shadow:0 0 1cqw #ffb020,0 .15cqw 0 #000}
.dm-float.rank.r4{color:#f0d0ff;font-size:2.2cqw;font-style:italic;text-shadow:0 0 1cqw #c46aff,0 .15cqw 0 #000}
@keyframes dmStarPop{from{transform:scale(0) rotate(-90deg);opacity:0}}
@keyframes dmRankUp{0%{transform:translate(-50%,-50%)}70%{transform:translate(-50%,-90%);opacity:1}100%{transform:translate(-50%,-130%);opacity:0}}
.dm-hc.merged.r2{animation-name:dmMergedB}
.dm-hc.merged.r3{animation-name:dmMergedG}
.dm-hc.merged.r4{animation-name:dmMergedV}
@keyframes dmMergedB{30%{filter:brightness(1.8) drop-shadow(0 0 1.5cqw #4fb3ff)}}
@keyframes dmMergedG{30%{filter:brightness(2) drop-shadow(0 0 2cqw #ffb020) drop-shadow(0 0 .6cqw #fff)}}
@keyframes dmMergedV{30%{filter:brightness(1.9) drop-shadow(0 0 2cqw #c46aff) drop-shadow(0 0 .6cqw #fff)}}
.dm-hand .dm-hc:hover::before{content:'';position:absolute;left:-4%;right:-4%;top:0;bottom:-34%;z-index:-1}
/* life bars, better (author: «mejora las barras de vida y cómo se muestran»): the lost part stays a moment as a red trail,
   a shield shows as a blue stretch after the life, the maximum next to the number, gloss on top, and low life glows red */
.dm-life .bar>.shd{left:var(--p);width:var(--s,0%);border-radius:0 99px 99px 0;background:repeating-linear-gradient(115deg,#7fd6ff 0 .35cqw,#2f8fff .35cqw .7cqw);box-shadow:inset 0 0 .3cqw #fff;opacity:0;transition:left .35s,width .35s,opacity .3s}
.dm-life.shielded .bar>.shd{opacity:.95}
.dm-life .bar>.gloss{position:absolute;left:0;right:0;top:0;height:45%;background:linear-gradient(#ffffff70,#fff0);pointer-events:none;border-radius:99px 99px 0 0}
.dm-life b small{margin-left:.15em;font-size:calc(var(--w)*.075);font-weight:900;font-style:normal;color:#fff;opacity:.85;text-shadow:0 0 .2cqw #000,0 0 .2cqw #000;align-self:end;padding-bottom:.15em}
.dm-life b{display:flex!important;align-items:center;justify-content:center}
.dm-life.low{box-shadow:0 .25cqw .6cqw #000c,0 0 1.2cqw #ff2a2acc}
.dm-life.low .bar{background:linear-gradient(#2a0510,#4a0a1a)}
.dm-life.hit .bar{animation:dmBarHit .35s}
@keyframes dmBarHit{30%{filter:brightness(2.2) saturate(1.5)}}
/* fusion, much bigger: rays turning behind the card, the screen lit in its colour, a bigger ring and «¡Fusión!» */
.dm-fuserays{position:absolute;width:0;height:0;pointer-events:none;z-index:21}
.dm-fuserays::before{content:'';position:absolute;left:-14cqw;top:-14cqw;width:28cqw;height:28cqw;border-radius:50%;background:repeating-conic-gradient(from 0deg,color-mix(in srgb,var(--c) 75%,#fff) 0 7deg,#0000 7deg 22deg);-webkit-mask:radial-gradient(circle,#000 8%,#0000 68%);mask:radial-gradient(circle,#000 8%,#0000 68%);mix-blend-mode:screen;animation:dmFuseRays 1.1s ease-out forwards}
.dm-fuserays.r3::before,.dm-fuserays.r4::before{left:-19cqw;top:-19cqw;width:38cqw;height:38cqw}
@keyframes dmFuseRays{from{transform:scale(.2) rotate(0);opacity:0}25%{opacity:1}to{transform:scale(1.15) rotate(70deg);opacity:0}}
.dm-fuseflash{position:absolute;inset:0;pointer-events:none;z-index:20;background:radial-gradient(circle at 50% 85%,color-mix(in srgb,var(--c) 45%,transparent),transparent 70%);mix-blend-mode:screen;animation:dmFuseFlash .7s ease-out forwards}
@keyframes dmFuseFlash{from{opacity:1}to{opacity:0}}
.dm-fusering i{left:-9cqw;top:-9cqw;width:18cqw;height:18cqw;border-width:.6cqw}
.dm-float.rank{font-size:3.4cqw;align-items:center}
.dm-float.rank em{margin-right:.6cqw;font-size:2.6cqw;font-style:italic;letter-spacing:.02em;animation:dmStarPop .45s cubic-bezier(.2,1.8,.4,1) backwards}
.dm-float.rank.r3{font-size:4.2cqw}
/* the turn's clock online: a ring that empties, red in the last 10 seconds */
.dm-clock{position:absolute;left:50%;top:1.2cqw;transform:translateX(-50%);z-index:40;display:flex;flex-direction:column;align-items:center;justify-content:center;width:6.4cqw;height:6.4cqw;border-radius:50%;background:radial-gradient(#0b1640 58%,#0000 60%),conic-gradient(#ffd23a calc(var(--k,1) * 360deg),#ffffff22 0);box-shadow:0 .4cqw 1cqw #000a;pointer-events:none}
.dm-clock b{font:900 2.2cqw/1 'Arial Black',sans-serif;color:#fff}
.dm-clock small{font-size:.65cqw;font-weight:900;color:#ffe9a8;text-transform:uppercase;letter-spacing:.08em}
.dm-clock.rival{background:radial-gradient(#0b1640 58%,#0000 60%),conic-gradient(#4fb3ff calc(var(--k,1) * 360deg),#ffffff22 0)}
.dm-clock.low{background:radial-gradient(#3a0610 58%,#0000 60%),conic-gradient(#ff3a3a calc(var(--k,1) * 360deg),#ffffff22 0);animation:dmClockLow .5s ease-in-out infinite}
@keyframes dmClockLow{50%{transform:translateX(-50%) scale(1.1)}}
/* the aiming arrow, better (author: «mejora las flechas»): a wider glowing trail, the body pulsing while it has a
   target, and a reticle (a dashed ring turning and the four ticks) on the footballer it will hit */
.dm-aim-trail{stroke-width:3cqw;opacity:.32}
.dm-aim.locked .dm-aim-trail{opacity:.5;animation:dmTrail .6s ease-in-out infinite}
@keyframes dmTrail{50%{opacity:.25}}
.dm-aim.locked .dm-aim-body{filter:drop-shadow(0 0 .8cqw var(--ac)) drop-shadow(0 0 .2cqw #fff) drop-shadow(0 .15cqw .2cqw #0009)}
.dm-aim.locked .dm-aim-ring{display:inline}
.dm-aim.locked .dm-aim-ring circle{display:inline;stroke-width:.1;stroke-dasharray:.42 .2;filter:drop-shadow(0 0 .08px var(--ac))}
.dm-aim.locked .dm-aim-ring path{stroke:var(--ah);stroke-width:.16;animation:dmRet .7s ease-in-out infinite;transform-origin:0 0}
@keyframes dmRet{50%{transform:scale(1.18)}}
/* ---- while you plan: what your lined-up actions take off each footballer (striped), and KO if he already falls */
.dm-life.planned .bar>.cur{width:var(--q)}
.dm-life .bar>.pl{left:var(--q);width:calc(var(--p) - var(--q));border-radius:0;opacity:0;background:repeating-linear-gradient(115deg,#ff5a5a 0 .35cqw,#ffd0d0 .35cqw .6cqw)}
.dm-life.planned .bar>.pl{opacity:1;animation:dmPlanBlink .8s ease-in-out infinite alternate}
@keyframes dmPlanBlink{to{opacity:.45}}
.dm-pd{position:absolute;right:-6%;top:-70%;padding:0 .4cqw;border-radius:99px;font-style:normal;font-weight:900;font-size:calc(var(--w)*.11);color:#fff;background:linear-gradient(#ff6a6a,#b3101f);box-shadow:0 .15cqw .4cqw #000b;z-index:3;animation:dmPop .25s cubic-bezier(.2,1.6,.4,1)}
.dm-unit.doomed .dm-card{filter:grayscale(.75) brightness(.65) drop-shadow(0 .5cqw .6cqw #000b)}
.dm-doom{position:absolute;left:50%;top:38%;translate:-50% -50%;rotate:-12deg;z-index:7;pointer-events:none;padding:.1cqw .9cqw;border:.3cqw solid #fff;border-radius:.8cqw;background:#c4102ae8;color:#fff;font-weight:900;font-size:calc(var(--w)*.2);letter-spacing:.08em;box-shadow:0 0 1cqw #ff2a3a;animation:dmPop .3s cubic-bezier(.2,1.6,.4,1)}
.dm-pv .left{color:#ffe9a8}
.dm-unit.s1 .dm-pv{top:auto;bottom:-3%;transform:translate(-50%,100%)}
.dm-spd{position:absolute;top:12px;right:64px;width:44px;height:44px;border-radius:50%;border:2px solid #ffd76a;background:#0b1440cc;color:#ffd76a;font:900 15px/1 inherit;cursor:pointer;z-index:30;transition:background .2s,color .2s,scale .15s}
.dm-spd:hover{scale:1.08}.dm-spd.on{background:linear-gradient(#ffcf4a,#e07a10);color:#3a1600;box-shadow:0 0 12px #ffb020}
.dm-unit.incoming::after{content:'';position:absolute;inset:-4% 6%;border-radius:1cqw;border:.25cqw dashed #ffd76acc;pointer-events:none;animation:dmEmpty 1.2s ease-in-out infinite}
.dm-unit.leaving{pointer-events:none;transition:opacity .4s ease-in,scale .4s ease-in,rotate .4s ease-in;opacity:0;scale:.7;rotate:-10deg;filter:grayscale(1) brightness(1.6)}
.dm-info p.pas{margin-top:.4cqw;padding:.3cqw .5cqw;border-radius:.5cqw;background:#5a2a9a55;border:.1cqw solid #c49aff88;color:#f0e6ff}
.dm-info p.pas b{margin-right:.4cqw;padding:0 .35cqw;border-radius:.35cqw;background:#c49aff;color:#2a0a4a;font-size:.85em;text-transform:uppercase;letter-spacing:.05em}
`;
export const DUEL_MATCH_CSS = CSS_RAW.replace(/(-?\d*\.?\d+)cqw/g, 'calc(var(--u)*$1)');
