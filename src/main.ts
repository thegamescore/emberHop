import './style.css';
import { Game, FixedClock } from './game';
import { Renderer } from './art';
import { AudioPlayer } from './audio';

const el=<T extends HTMLElement>(id:string)=>document.getElementById(id) as T;
const game=new Game(),clock=new FixedClock(),audio=new AudioPlayer();
const canvas=el<HTMLCanvasElement>('canvas'),renderer=new Renderer(canvas);
const overlay=el('overlay'),hud=el('hud'),score=el('score');
let previous=performance.now(),visualTime=0;
let endTime=0;
function sync(){
  el('start-screen').hidden=game.phase!=='ready';
  el('end-screen').hidden=game.phase!=='over';
  el('pause-screen').hidden=game.phase!=='paused';
  overlay.hidden=game.phase==='playing';
  hud.hidden=game.phase==='ready'||game.phase==='over';
  el('arena').dataset.phase=game.phase;
  score.textContent=String(game.score);
  el('gift-count').textContent=String(game.collected.length);
  el('gift-toast').hidden=game.phase!=='playing'||game.pickupTime<=0;
}
async function sound(){await audio.unlock();if(game.phase!=='paused')audio.play();}
function start(){game.start();clock.reset();previous=performance.now();sync();void sound();canvas.focus();}
function pause(){if(game.phase!=='playing')return;game.pause();clock.reset();audio.pause();sync();el('resume').focus();}
function resume(){game.resume();clock.reset();previous=performance.now();sync();void sound();canvas.focus();}
function action(){
  if(game.phase==='ready')start();
  else if(game.phase==='playing'){game.boost();audio.effect('boost');}
  else if(game.phase==='paused')resume();
  else if(performance.now()-endTime>250)start();
}
function toggleMute(){audio.setMuted(!audio.muted);el('mute').setAttribute('aria-pressed',String(audio.muted));el('mute').setAttribute('aria-label',audio.muted?'Unmute audio':'Mute audio');el('mute').title=audio.muted?'Unmute audio (M)':'Mute audio (M)';}
async function fullscreen(){
  try{if(document.fullscreenElement)await document.exitFullscreen();else await el('game').requestFullscreen();}catch{/* Embedded hosts can decline fullscreen; normal play remains available. */}
}
el('start').addEventListener('click',start);el('retry').addEventListener('click',start);
el('resume').addEventListener('click',resume);el('pause').addEventListener('click',pause);
el('mute').addEventListener('click',toggleMute);el('fullscreen').addEventListener('click',()=>void fullscreen());
el('fullscreen').hidden=!document.fullscreenEnabled;
document.addEventListener('fullscreenchange',()=>{
  const active=!!document.fullscreenElement;
  el('fullscreen').setAttribute('aria-label',active?'Exit fullscreen':'Enter fullscreen');
  el('fullscreen').title=active?'Exit fullscreen (F)':'Fullscreen (F)';
});
canvas.tabIndex=-1;
el('arena').addEventListener('pointerdown',event=>{
  if((event.target as HTMLElement).closest('button')||!event.isPrimary||event.button!==0)return;
  if(game.phase==='over')return;
  event.preventDefault();action();
});
window.addEventListener('keydown',event=>{
  if(event.code==='Space'){
    // Focused buttons retain normal keyboard activation; never also flap.
    if(document.activeElement instanceof HTMLButtonElement)return;
    event.preventDefault();if(!event.repeat)action();
  }
  if(event.repeat)return;
  if(event.code==='KeyM')toggleMute();
  if(event.code==='KeyF')void fullscreen();
  if(event.code==='KeyP'||event.code==='Escape'){
    if(game.phase==='playing')pause();else if(game.phase==='paused')resume();
  }
});
window.addEventListener('blur',()=>{pause();audio.pause();});
document.addEventListener('visibilitychange',()=>{if(document.hidden){pause();audio.pause();}});
game.onScore=()=>{score.textContent=String(game.score);audio.effect('score');};
game.onCollect=()=>{el('gift-count').textContent=String(game.collected.length);el('gift-name').textContent=game.pickup;audio.effect('score');};
game.onEnd=()=>{
  endTime=performance.now();el('final-score').textContent=String(game.score);
  el('collected-summary').textContent=game.collected.length ? `${game.collected.length} present${game.collected.length===1?'':'s'} found this flight` : 'No presents this flight.';
  el('result-caption').textContent=game.score===0?'A spark is a start.':game.score<5?'Your spark is getting brighter.':game.score<15?'Spreading a little winter magic.':'A very merry high flyer!';
  el('collected-products').textContent=[...new Set(game.collected)].join(' · ');
  el('collected-products').hidden=game.collected.length===0;
  audio.effect('end');sync();
};
function frame(now:number){
  const dt=Math.max(0,(now-previous)/1000);previous=now;
  if(game.phase!=='paused'&&!document.hidden)visualTime+=Math.min(dt,.1);
  const alpha=clock.advance(dt,step=>game.update(step));
  el('gift-toast').hidden=game.phase!=='playing'||game.pickupTime<=0;
  renderer.draw(game,visualTime,alpha);requestAnimationFrame(frame);
}
sync();requestAnimationFrame(frame);
// Opt-in read-only observability for browser acceptance tests. No runtime cheats.
if(new URLSearchParams(location.search).has('test'))Object.defineProperty(window,'__ember',{value:()=>({phase:game.phase,y:game.y,velocity:game.velocity,score:game.score,collected:[...game.collected],gates:game.gates.map(g=>({...g})),muted:audio.muted,audioState:audio.context?.state,musicActive:audio.active}),writable:false});
