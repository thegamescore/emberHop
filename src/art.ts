import { Game, WORLD } from './game';

const C = { sky:'#19363f', far:'#26494e', tree:'#22444a', green:'#41645a', snow:'#cadbc8', cream:'#fff0d1', stone:'#527268', dark:'#254940', moss:'#92b894', red:'#d76c60', gold:'#ffcb89' };
// Original pixel maps. Each character is a single square of the source sprite.
// Ember spirit: droopy Santa hat, holly, scarf, flame tail. Last rows swap per frame.
const spiritBody = [
  '......rrrr........',
  '.....rrrrrrr......',
  '....rrrrrrrrRR....',
  '....rrrrrrrrrRRww.',
  '...rrrrrrrrrrrRwww',
  '...rrrrrrrrrrrrwwW',
  '..wggrwwwwwwwww.W.',
  '..WWWWWWWWWWWWW...',
  '..foooooooooooof..',
  '.fooyyyyyyyyyyoof.',
  '.foylyyyyyyyyyyof.',
  '.foyylkyyyylkyyof.',
  '.foyykkyyyykkyyof.',
  '.foppyyyyyyyyppof.',
  '.foyyyykyykyyyyof.',
  '.fooyyyykkyyyyoof.',
  '.GggssggssggssggG.',
  '..GGGGGGGGGGGGGG..',
  '.gsgfooyyyyoof....',
  '.gsg.fooyyoof.....',
];
const spiritTail = [
  ['.GGG..foyyof......', '.......foof.......', '........ff........'],
  ['.GGG.foyyof.......', '......foof........', '......ff..........'],
];
const colors: Record<string,string> = {
  r:C.red, R:'#a94a4c', w:C.cream, W:'#d8c9ad', g:'#5f9a6a', G:'#3f6b50', s:C.red,
  f:'#e0683c', o:'#f99b55', y:'#ffd17b', l:'#fff6d8', k:'#30423e', p:'#ff9a7a',
};
export class Renderer {
  ctx: CanvasRenderingContext2D;
  reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  constructor(canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d')!;
    this.ctx.imageSmoothingEnabled = false;
  }
  rect(x:number,y:number,w:number,h:number,color:string) {
    this.ctx.fillStyle=color; this.ctx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));
  }
  tree(x:number,y:number,size:number,color:string,snow=false) {
    const r = this.rect.bind(this);
    r(x-2,y-size*.1,4,size*.15,C.dark);
    for(let i=0;i<4;i++){
      const width=size*(.22+i*.16), top=y-size+i*size*.21;
      r(x-width/2,top,width,size*.28,color);
      if(snow) r(x-width/2,top,width,3,C.snow);
    }
  }
  gift(x:number,y:number,type=0,scale=1) {
    const r=(a:number,b:number,w:number,h:number,c:string)=>this.rect(x+a*scale,y+b*scale,w*scale,h*scale,c);
    const color=[C.red,'#799e85','#d9aa68'][type%3];
    r(0,4,16,13,color);r(-1,3,18,4,color);r(7,3,3,14,C.cream);
    r(3,0,5,3,C.cream);r(10,0,5,3,C.cream);r(0,15,16,2,'#19363f33');
  }
  character(x:number,y:number,scale=2,tilt=0,time=0) {
    const ctx=this.ctx;ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.rotate(tilt);
    const frame=this.reduced?0:Math.floor(time*8)%2;
    [...spiritBody,...spiritTail[frame]].forEach((row,j)=>[...row].forEach((p,i)=>{if(colors[p])this.rect((i-8.5)*scale,(j-12.5)*scale,scale,scale,colors[p]);}));
    ctx.restore();
  }
  gate(x:number,center:number,gap:number,type:number) {
    const top=center-gap/2,bottom=center+gap/2;
    for(const [y,h,upper] of [[0,top,1],[bottom,WORLD.ground-bottom,0]]) {
      this.rect(x,y,54,h,C.stone);this.rect(x,y,6,h,'#638377');this.rect(x+46,y,8,h,'#3c5e53');
      this.ctx.save();this.ctx.beginPath();this.ctx.rect(x,y,54,h);this.ctx.clip();
      for(let j=Math.floor(y/23)*23;j<y+h;j+=23){
        this.rect(x,j,54,2,'#34594d');
        this.rect(x+(Math.floor(j/23)%2?18:35),j+2,2,21,'#34594d');
        this.rect(x+8,j+5,8,2,'#729084');
      }
      this.ctx.restore();
      const lip=upper?top-13:bottom;
      this.rect(x,lip,54,13,'#719282');this.rect(x,lip+10,54,3,C.dark);
      this.rect(x,lip,54,4,C.snow);
      this.rect(x+8,lip+3,5,5,C.snow);this.rect(x+39,lip+3,6,7,C.snow);
      if(upper){this.rect(x+4,top-37,5,13,C.moss);this.rect(x+7,top-30,8,4,C.moss);}
      else {this.gift(x+19,bottom+21,type);this.rect(x+7,bottom+54,3,12,C.moss);}
    }
  }
  draw(game:Game,time:number,alpha:number) {
    const ctx=this.ctx,r=this.rect.bind(this);const playing=game.phase==='playing'||game.phase==='paused'||game.phase==='over';
    const distance=playing?game.distance:time*10;
    r(0,0,360,640,C.sky);
    // Pixel stars, a stepped moon, and two layers of winter firs.
    for(let i=0;i<29;i++){
      const x=(i*97+23)%360,y=(i*61+17)%440;
      r(x,y,i%5===0?2:1,i%5===0?2:1,i%3===0?'#94afa3':'#668b82');
    }
    r(281,57,28,24,'#c6d5ba');r(276,63,38,12,'#c6d5ba');r(289,54,12,30,'#c6d5ba');
    r(277,57,20,14,C.sky);r(282,67,10,10,C.sky);
    for(let i=-1;i<9;i++)this.tree(i*64-(distance*.13%64),535,80+(i+2)%3*35,C.far);
    r(0,532,360,108,C.far);
    for(let i=-1;i<7;i++)this.tree(i*82-(distance*.27%82),582,65+(i+2)%3*29,C.tree,true);
    if(playing)for(const gate of game.gates)this.gate(gate.x,gate.center,gate.gap,gate.gift);
    else {
      // Quiet ruins frame the title, leaving the central flight clear.
      this.gate(-35,315,390,0);this.gate(342,335,400,1);
      this.gift(34,570,0,1.15);this.gift(304,569,1,1.2);this.gift(284,577,2,.8);
    }
    r(0,590,360,50,'#6f9480');r(0,590,360,7,C.snow);r(0,597,360,3,'#9fbea4');
    for(let i=0;i<20;i++){const x=i*25-distance*.8%25;r(x,608+(i%3)*8,9,3,'#527a64');r(x+12,602,3,3,'#bed4b4');}
    if(!this.reduced)for(let i=0;i<28;i++){
      const drift=time*(7+i%4*3);
      r((i*79+Math.sin(time*.4+i)*9+360)%360,(i*43+drift)%586,i%4===0?2:1,2,'#d8e4d1aa');
    }
    if(!playing){
      const y=316+(this.reduced?0:Math.sin(time*2.4)*5);
      // A small glow is built from translucent pixel blocks, not a raster filter.
      r(144,y-26,72,58,'#ffbb7310');r(154,y-18,52,42,'#ffbb7310');
      this.character(180,y,3,0,time);
      r(135,y+12,3,3,C.gold);r(217,y-10,3,3,C.gold);r(223,y+5,2,2,C.gold);
    } else {
      const y=game.phase==='playing'?game.previousY+(game.y-game.previousY)*alpha:game.y;
      const tilt=Math.max(-.18,Math.min(.45,game.velocity/950));
      if(game.phase==='playing'&&!this.reduced)for(let i=1;i<=3;i++)r(WORLD.x-17-i*7,y+6+Math.sin(time*12+i)*3,3,3,'#ffb66c88');
      this.character(WORLD.x,y,2,tilt,time);
    }
    if(!this.reduced)for(const p of game.sparks){ctx.globalAlpha=p.life/.6;r(p.x,p.y,3,3,C.gold);}ctx.globalAlpha=1;
    if(game.flash>0&&!this.reduced)r(0,0,360,640,'#ffdda52a');
  }
}
