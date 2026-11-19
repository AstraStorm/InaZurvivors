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
@keyframes dmOrb{50%{filter:brightness(1.5) drop-shadow(0 0 .4cqw #ffb020)}}
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
.dm-life .lag{background:linear-gradient(#fff,#ffd36a);transition:width .6s ease-in .5s}
.dm-life .cur{background:linear-gradient(#ffffff90,#fff0 45%,#0003),var(--c);transition:width .35s cubic-bezier(.2,.8,.3,1),background-color .3s;box-shadow:inset 0 0 .3cqw #fff8}
.dm-life .cur::after{content:'';position:absolute;inset:0;background:repeating-linear-gradient(115deg,#fff0 0 .7cqw,#ffffff60 .7cqw .9cqw,#fff0 .9cqw 2.2cqw);background-size:200% 100%;animation:dmVolt 1.3s linear infinite;mix-blend-mode:overlay}
.dm-life .cur::before{content:'';position:absolute;right:-.15cqw;top:-25%;bottom:-25%;width:.6cqw;border-radius:50%;background:radial-gradient(#fff,#bff6ff 40%,#fff0 70%);animation:dmSpark .3s steps(2) infinite;z-index:1}
.dm-life .bar>.tick{width:100%;border-radius:0;background:repeating-linear-gradient(90deg,#0000 0 calc(10% - 1px),#0006 calc(10% - 1px) 10%);pointer-events:none}
@keyframes dmVolt{to{background-position:-2.2cqw 0}}
@keyframes dmSpark{50%{opacity:.35;transform:scaleY(.6)}}
.dm-life .hrt{position:absolute;left:-7%;top:50%;width:calc(var(--w)*.27);aspect-ratio:1;transform:translateY(-50%);border-radius:50%;display:grid;place-items:center;background:radial-gradient(circle at 35% 30%,#ff9a9a,#e01b2e 55%,#7a0010);box-shadow:0 0 0 calc(var(--w)*.018) #f3d57a,0 .15cqw .4cqw #000c;color:#fff;font-size:calc(var(--w)*.15);line-height:1;z-index:2;text-shadow:0 1px 1px #0008}
.dm-life b{position:absolute;inset:0 0 0 9%;display:grid;place-items:center;z-index:2;--nh:calc(var(--w)*.135)}
.dm-life b .iz-num{--nh:calc(var(--w)*.15)}
.dm-life em{position:absolute;right:6%;top:50%;transform:translateY(-50%);font-style:normal;font-weight:900;font-size:calc(var(--w)*.1);color:#9fe0ff;text-shadow:0 0 .2cqw #000,0 0 .2cqw #000;z-index:2}
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
.dm-tring{position:absolute;left:50%;top:44%;width:150%;aspect-ratio:1;translate:-50% -50%;border-radius:50%;background:conic-gradient(from 0deg,var(--tc) 0 10%,#0000 0 25%,var(--tc) 0 35%,#0000 0 50%,var(--tc) 0 60%,#0000 0 75%,var(--tc) 0 85%,#0000 0);-webkit-mask:radial-gradient(circle,#0000 62%,#000 63% 68%,#0000 69%);mask:radial-gradient(circle,#0000 62%,#000 63% 68%,#0000 69%);opacity:0;pointer-events:none;z-index:5;transition:opacity .15s,width .2s;--tc:#ff4a4a}
.dm-unit.aim .dm-tring{opacity:.6;animation:dmSpin 4s linear infinite}
.dm-stage.aim-ally .dm-tring{--tc:#4bff7d}
.dm-unit.aim:hover .dm-tring,.dm-unit.lock .dm-tring{opacity:1;width:132%;animation-duration:1.2s;--tc:#ffb020}
.dm-unit.aim:hover,.dm-unit.lock{scale:1.07;z-index:6}
@keyframes dmSpin{to{rotate:360deg}}
.dm-pv{position:absolute;left:50%;top:-2%;transform:translate(-50%,-100%);display:flex;flex-wrap:wrap;justify-content:center;gap:.2cqw;width:150%;pointer-events:none;z-index:6}
.dm-pv:empty{display:none}
.dm-pv>*{padding:.1cqw .45cqw;border-radius:.6cqw;background:#0b1440e8;border:.12cqw solid #fff4;color:#fff;font-weight:900;font-size:.95cqw;white-space:nowrap;display:flex;align-items:center;gap:.2cqw;animation:dmPop .25s cubic-bezier(.2,1.6,.4,1)}
.dm-pv img{width:1.2cqw}
.dm-pv .iz-num{--nh:1.3cqw;-webkit-text-stroke-color:#5a0010}
.dm-pv .dmg{font-size:1.25cqw;color:#ff6a6a;background:#2a0710ee;border-color:#ff6a6a88}
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
.dm-unit.hurt{animation:dmHurt .48s}
.dm-unit.hurt .dm-card::after{content:'';position:absolute;inset:6%;border-radius:6%;background:#f22;mix-blend-mode:screen;opacity:0;animation:dmRed .48s}
@keyframes dmHurt{15%{translate:-.7cqw 0;rotate:-3deg}35%{translate:.6cqw 0;rotate:2deg}55%{translate:-.35cqw 0}75%{translate:.2cqw 0}}
.dm-unit.crit{animation:dmHurt .48s,dmCrit .48s}
@keyframes dmCrit{25%{scale:1.14}}
@keyframes dmRed{20%{opacity:.75}}
.dm-unit.freeze .dm-card{filter:brightness(3) contrast(1.4) grayscale(1)}
.dm-unit.ko{transition:margin .7s ease-in,rotate .7s,scale .7s,opacity .7s;margin-top:4cqw;rotate:-14deg;scale:.65;opacity:0;filter:grayscale(1) brightness(1.6)}
.dm-unit.enter{animation:dmEnter .8s cubic-bezier(.2,1.3,.4,1)}
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
.dm-hand .dm-hc:hover{transform:perspective(40cqw) translateY(-3.4cqw) scale(1.2) rotateX(var(--ty,0deg)) rotateY(var(--tx,0deg));z-index:20!important;filter:drop-shadow(0 0 .45cqw #ffd76acc) drop-shadow(0 1cqw 1.2cqw #000c)}
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
@keyframes dmMerged{30%{transform:translateY(-3cqw) scale(1.32);filter:brightness(1.8) drop-shadow(0 0 1.5cqw #ffd76a)}}
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
.dm-cast{position:absolute;transform:translate(-50%,-50%) rotate(4deg);display:flex;flex-direction:column;align-items:center;animation:dmCast .45s cubic-bezier(.2,1.3,.4,1);z-index:2}
.dm-cast .dm-hc{width:10.5cqw;cursor:default;transform:none;margin:0;filter:drop-shadow(0 0 1.2cqw #ffd76a99) drop-shadow(0 1cqw 1.4cqw #000)}
.dm-cast.s1 .dm-hc{filter:drop-shadow(0 0 1.2cqw #4fb3ff99) drop-shadow(0 1cqw 1.4cqw #000)}
.dm-cast.big .dm-hc{width:12.5cqw;filter:drop-shadow(0 0 2.2cqw #ffb020) drop-shadow(0 1cqw 1.4cqw #000)}
.dm-stage.v .dm-cast .dm-hc{width:14cqw}.dm-stage.v .dm-cast.big .dm-hc{width:16cqw}
.dm-cast .dm-htech{display:none}
.dm-cast .dm-hmult{font-size:1.2cqw}
.dm-cname{position:absolute;top:70%;left:50%;transform:translateX(-58%) skewX(-14deg) rotate(-8deg);min-width:24cqw;padding:.6cqw 2.4cqw .7cqw;background:linear-gradient(90deg,#0000,#c4560bf2 12%,#ffb020f2 50%,#c4560bf2 88%,#0000);border-top:.2cqw solid #fff3c4;border-bottom:.2cqw solid #fff3c4;text-align:center;white-space:nowrap;animation:dmName .5s cubic-bezier(.2,1.3,.4,1) .08s backwards}
.dm-cast.s1 .dm-cname{background:linear-gradient(90deg,#0000,#173a9af2 12%,#3f8cffe8 50%,#173a9af2 88%,#0000);border-color:#cfe7ff}
.dm-cname small{display:block;font-size:1cqw;font-weight:800;color:#fff8e0;letter-spacing:.15em;text-transform:uppercase;transform:skewX(14deg)}
.dm-cname span{display:block;font-size:2.3cqw;font-weight:900;font-style:italic;color:#fff;text-shadow:0 .2cqw 0 #6a2200,0 0 1cqw #fff8;transform:skewX(14deg)}
.dm-cast.s1 .dm-cname span{text-shadow:0 .2cqw 0 #081a55,0 0 1cqw #fff8}
.dm-cast.big .dm-cname span{font-size:2.9cqw}
.dm-cast.go{transition:transform .3s ease-in,opacity .3s;opacity:0;transform:translate(-40%,-50%) rotate(10deg) scale(.9)}
@keyframes dmCast{from{transform:translate(10%,-50%) rotate(18deg) scale(.6);opacity:0}}
@keyframes dmName{from{transform:translateX(30%) skewX(-14deg) rotate(-8deg);opacity:0}}
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
.dm-unit .dm-card{animation:dmIdle 3.2s ease-in-out infinite;animation-delay:calc(var(--i) * -3.2s)}
@keyframes dmIdle{50%{translate:0 -.35cqw}}
.dm-stage.scene .dm-unit:not(.acting) .dm-card{animation-play-state:paused}
.dm-unit.full .dm-card::before{content:'';position:absolute;inset:-9% -14%;border-radius:50%;background:conic-gradient(#ffb02000,#ffd76a,#ffb02000 25%,#fff3b0 50%,#ffb02000 70%,#ffd76a 85%,#ffb02000);filter:blur(.7cqw);opacity:.8;z-index:-1;animation:dmAura 2.2s linear infinite;pointer-events:none}
.dm-unit.s1.full .dm-card::before{background:conic-gradient(#4fb3ff00,#8fd0ff,#4fb3ff00 25%,#e0f4ff 50%,#4fb3ff00 70%,#8fd0ff 85%,#4fb3ff00)}
@keyframes dmAura{to{rotate:360deg}}
.dm-unit.hurt .dm-card{animation:dmWhite .24s}
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
.dm-rhand span{width:2.7cqw;margin:0 -.95cqw;transform-origin:50% 130%;transform:rotate(calc(var(--k) * 7deg)) translateY(calc(var(--k) * var(--k) * .1cqw));filter:drop-shadow(0 .25cqw .3cqw #000c);animation:dmPop .3s cubic-bezier(.2,1.6,.4,1) backwards}
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
.dm-ball{rotate:var(--spin,0deg)}
.dm-tail{position:absolute;right:50%;top:50%;width:7cqw;height:65%;translate:0 -50%;transform-origin:100% 50%;rotate:calc(var(--ang) - var(--spin,0deg));border-radius:50% 0 0 50%;background:linear-gradient(90deg,#0000,var(--c) 70%,#fff);filter:blur(.25cqw);opacity:.9;z-index:-1}
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
`;
export const DUEL_MATCH_CSS = CSS_RAW.replace(/(-?\d*\.?\d+)cqw/g, 'calc(var(--u)*$1)');
