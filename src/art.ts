import { Game, WORLD } from './game';

const C = { sky:'#8ED8E8', far:'#287A5233', tree:'#287A5270', green:'#287A52', snow:'#FFF9F0', cream:'#FFF9F0', stone:'#287A52', dark:'#287A52', moss:'#FFD166', red:'#E94B4B', gold:'#FFD166', ground:'#A96A46' };
// Christmas robin, facing into the flight path. One character = one source pixel.
// Separate wing and scarf layers keep the silhouette lively at gameplay size.
const robinBody = [
  '.........dddddd.........',
  '.......ddrrrrrrd........',
  '......drrhhhrrrrrd.......',
  '.....drrhhrrrrrrrd.......',
  '....drrrrrrrrrrrdww......',
  '....drrrrrrrrrrdwwwW.....',
  '....drrrrrrrrrd.wwWW.....',
  '...dwwwwwwwwwwwdWW......',
  '...dWWWWWWWWWWWd........',
  '....dbbbbccccccbd.......',
  '...dbbbbccccccccbd......',
  '..dbbbbccccccckkcbd.....',
  '..dbbbbcccccccwkcbda....',
  '.dbbbbbccccccckkcbdaaa...',
  '.dbbbbbccchhccccbdaA....',
  'dbbbbbbrrhhhhrrbd.......',
  'dbbbbbrrrhhhrrrrbd......',
  '.dbbbbrrrrrrrrrrbd......',
  '..dbbbrrrrrrrrrRd.......',
  '...dbbbrrrrrrRRd........',
  '....dbbcWWWWcbd.........',
  '.....ddbbccbdd..........',
  '.......ddddd............',
  '.......aA..aA...........',
];
const robinWings = [
  ['..ddd...', '.dbbbd..', 'dbbbbd..', 'dbbbbd..', '.dbbLd..', '..dLLd..', '...dd...'],
  ['........', '........', '..ddddd.', '.dbbLLLd', 'dbbLLLd.', '.dddd...', '........'],
  ['...dd...', '..dbbd..', '.dbbbd..', 'dbbLLd..', 'dbLLd...', '.ddd....', '........'],
];
const robinColors: Record<string,string> = {
  d:C.ground, b:C.red, L:C.gold, c:C.cream,
  r:C.red, R:C.red, h:C.gold, w:C.snow, W:C.snow, k:C.green,
  a:C.gold, A:C.gold, g:C.green, G:C.green, s:C.gold,
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
    r(x-2,y-size*.12,4,size*.18,C.ground);
    for(let tier=0;tier<3;tier++){
      const top=y-size+tier*size*.23;
      for(let step=0;step<5;step++){
        const width=size*(.07+step*.075+tier*.10);
        r(x-width/2,top+step*size*.065,width,size*.07+1,color);
        if(snow&&step===1)r(x-width/2,top+step*size*.065,width,3,C.snow);
      }
    }
  }

  gift(x:number,y:number,type=0,scale=1) {
    const r=(a:number,b:number,w:number,h:number,c:string)=>this.rect(x+a*scale,y+b*scale,w*scale,h*scale,c);
    const color=[C.red,C.green,C.gold][type%3];
    r(0,4,16,13,color);r(-1,3,18,4,color);r(7,3,3,14,C.cream);
    r(3,0,5,3,C.cream);r(10,0,5,3,C.cream);r(0,15,16,2,'#287A5233');
  }
  character(x:number,y:number,scale=2,tilt=0,time=0) {
    const ctx=this.ctx;ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.rotate(tilt);
    const frame=this.reduced?1:[0,1,2,1][Math.floor(time*10)%4];
    const sprite=(rows:string[],x=0,y=0)=>rows.forEach((row,j)=>[...row].forEach((p,i)=>{
      if(robinColors[p])this.rect((i+x-12)*scale,(j+y-15)*scale,scale,scale,robinColors[p]);
    }));
    // Forked tail and the loose scarf end sit behind the rounded body.
    sprite(['dbd...', 'dbbd..', '.dbbd.', 'ddbbbd', '.dddd.'],0,14);
    const scarfLift=frame===2?-1:0;
    sprite(['GGGGGGG', 'GggsggG', '.GggsgG', '..GGGGG'],0,16+scarfLift);
    sprite(robinBody);
    sprite(['.GGGGGGGGGGGG.', 'GggsgggsgggsgG', '.GGGGGGGGGGGG.'],6,15);
    // A tiny brass bell hangs from the scarf knot.
    sprite(['GgG', '.a.', 'awa', '.A.'],17,16);
    sprite(robinWings[frame],4,12);
    ctx.restore();
  }
  gate(x:number,center:number,gap:number,type:number) {
    const top=center-gap/2,bottom=center+gap/2;
    for(const [y,h,upper] of [[0,top,1],[bottom,WORLD.ground-bottom,0]]) {
      this.rect(x,y,54,h,C.stone);this.rect(x,y,6,h,'#FFF9F025');this.rect(x+46,y,8,h,'#FFD16620');
      this.ctx.save();this.ctx.beginPath();this.ctx.rect(x,y,54,h);this.ctx.clip();
      for(let j=Math.floor(y/23)*23;j<y+h;j+=23){
        this.rect(x,j,54,2,'#FFF9F020');
        this.rect(x+(Math.floor(j/23)%2?18:35),j+2,2,21,'#FFF9F020');
        this.rect(x+8,j+5,8,2,'#FFF9F025');
      }
      this.ctx.restore();
      const lip=upper?top-13:bottom;
      this.rect(x,lip,54,13,'#287A52');this.rect(x,lip+10,54,3,C.dark);
      this.rect(x,lip,54,4,C.snow);
      this.rect(x+8,lip+3,5,5,C.snow);this.rect(x+39,lip+3,6,7,C.snow);
      if(upper){
        this.rect(x+12,top-37,2,12,C.gold);this.rect(x+8,top-28,10,10,C.red);
        this.rect(x+35,top-53,2,12,C.gold);this.rect(x+31,top-44,10,10,C.gold);
      } else {
        this.rect(x+7,bottom+23,40,2,C.gold);
        for(let i=0;i<3;i++){this.rect(x+12+i*13,bottom+25+(i%2)*4,2,4,C.gold);this.rect(x+9+i*13,bottom+29+(i%2)*4,8,8,i%2?C.gold:C.red);}
      }
    }
  }
  draw(game:Game,time:number,alpha:number) {
    const ctx=this.ctx,r=this.rect.bind(this);const playing=game.phase!=='ready';
    const distance=playing?game.distance:time*10;
    r(0,0,360,640,C.sky);
    // Keep distant scenery still so background motion doesn't distract from flight.
    for(let i=0;i<4;i++){
      const x=i*117-15,y=75+i%3*93;
      r(x,y,48,9,'#FFF9F080');r(x+8,y-7,28,7,'#FFF9F080');
    }
    for(let i=-1;i<9;i++)this.tree(i*64,535,80+(i+2)%3*35,C.far);
    r(0,532,360,108,'#FFF9F066');
    for(let i=0;i<7;i++)r(i*70,523+(i%3)*5,78,70,'#FFF9F066');
    for(let i=-1;i<7;i++)this.tree(i*82,582,65+(i+2)%3*29,C.tree,true);
    if(playing)for(const gate of game.gates){
      this.gate(gate.x,gate.center,gate.gap,gate.gift);
      if(gate.product&&!gate.collected){
        const x=gate.x+(gate.presentX??27),y=gate.presentY??gate.center;
        r(x-15,y-15,30,30,'#FFF9F055');this.gift(x-10,y-10,0,1.25);
        r(x-18,y-2,3,3,C.snow);r(x+16,y-9,3,3,C.snow);
      }
    }
    else {
      // Quiet ruins frame the title, leaving the central flight clear.
      this.gate(-35,315,390,0);this.gate(342,335,400,1);
      this.gift(34,570,0,1.15);this.gift(304,569,1,1.2);this.gift(284,577,2,.8);
    }
    r(0,590,360,50,C.ground);r(0,590,360,10,C.snow);
    for(let i=0;i<20;i++){const x=i*25-distance*.8%75;r(x,597,14,5,C.snow);r(x,613+(i%3)*8,5,2,C.gold);}
    if(!this.reduced)for(let i=0;i<34;i++){
      const drift=time*(9+i%4*4),x=(i*79-time*8+Math.sin(time*.4+i)*5+3600)%360,y=(i*43+drift)%586;
      r(x,y,i%4===0?3:2,2,C.snow);
      if(i%9===0){r(x+1,y-2,1,6,C.snow);r(x-1,y,5,1,C.snow);}
    }
    if(!playing){
      const y=316+(this.reduced?0:Math.sin(time*2.4)*5);
      // A small glow is built from translucent pixel blocks, not a raster filter.
      r(155,y+36,50,3,'#287A5225');
      this.character(180,y,3,0,time);
      r(135,y+12,3,3,C.gold);r(217,y-10,3,3,C.gold);r(223,y+5,2,2,C.gold);
    } else {
      const y=game.phase==='playing'?game.previousY+(game.y-game.previousY)*alpha:game.y;
      const tilt=Math.max(-.18,Math.min(.45,game.velocity/950));
      if(game.phase==='playing'&&!this.reduced)for(let i=1;i<=3;i++)r(WORLD.x-17-i*7,y+6+Math.sin(time*12+i)*3,3,3,C.snow);
      this.character(WORLD.x,y,2,tilt,time);
    }
    if(!this.reduced)for(const p of game.sparks){ctx.globalAlpha=p.life/.6;r(p.x,p.y,3,3,C.gold);}ctx.globalAlpha=1;
    if(game.flash>0&&!this.reduced)r(0,0,360,640,'#FFF9F044');
  }
}
