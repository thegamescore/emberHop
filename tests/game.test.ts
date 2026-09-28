import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Game, FixedClock, STEP, difficulty, WORLD } from '../src/game';

test('a pair scores once, only after clearing the whole character',()=>{
  const g=new Game(()=>.5);g.start();let calls=0;g.onScore=()=>calls++;
  g.gates=[{x:WORLD.x-WORLD.radius-54+1,center:295,gap:184,scored:false,gift:0}];
  g.update(STEP);assert.equal(g.score,0);g.update(STEP);assert.equal(g.score,1);
  for(let i=0;i<10;i++)g.update(STEP);assert.equal(calls,1);
});
test('forgiving body collision ignores Santa hat and detects body edges',()=>{
  const g=new Game();g.start();g.velocity=0;g.y=210;
  g.gates=[{x:80,center:295,gap:190,scored:false,gift:0}];
  g.update(STEP);assert.equal(g.phase,'playing');
  g.y=205;g.update(STEP);assert.equal(g.phase,'over');
});
test('ground ends once; ceiling gently clamps',()=>{
  const g=new Game();let deaths=0;g.onEnd=()=>deaths++;g.start();g.y=1;g.update(STEP);
  assert.equal(g.phase,'playing');assert.equal(g.y,20);assert.equal(g.velocity,0);
  g.y=WORLD.ground-8;g.update(STEP);g.update(STEP);assert.equal(g.phase,'over');assert.equal(deaths,1);
});
test('restart resets score, motion, particles, time and obstacles',()=>{
  const g=new Game();g.start();g.score=17;g.y=580;g.elapsed=34;g.distance=800;g.end();g.start();
  assert.equal(g.phase,'playing');assert.equal(g.score,0);assert.equal(g.y,295);assert.equal(g.velocity,-285);
  assert.equal(g.gates.length,1);assert.equal(g.gates[0].x,385);assert.equal(g.elapsed,0);assert.equal(g.distance,0);assert.equal(g.sparks.length,0);
});
test('pause freezes the run and boost does not alter paused motion',()=>{
  const g=new Game();g.start();g.update(STEP);g.pause();const snapshot=JSON.stringify(g);
  g.update(1);g.boost();assert.equal(JSON.stringify(g),snapshot);g.resume();g.update(STEP);assert.equal(g.phase,'playing');
});
test('difficulty is monotonic and capped',()=>{
  assert.equal(difficulty(0).gap,184);assert.equal(difficulty(30).gap,146);
  assert.deepEqual(difficulty(300),difficulty(30));
  for(let i=1;i<=30;i++){assert.ok(difficulty(i).speed>=difficulty(i-1).speed);assert.ok(difficulty(i).gap<=difficulty(i-1).gap);}
});
function pilot(g:Game){
  const gate=g.gates.find(gate=>gate.x+54>=WORLD.x-WORLD.radius);
  const target=gate?.center??295;
  if(g.y>target+16&&g.velocity>0)g.boost();
}
test('fixed-step physics agrees at 30, 60, 120 and 144 Hz',()=>{
  const results=[30,60,120,144].map(hz=>{
    const g=new Game(()=>.5),clock=new FixedClock();g.start();
    for(let i=0;i<hz*20;i++)clock.advance(1/hz,dt=>{pilot(g);g.update(dt);});
    return {score:g.score,y:g.y,elapsed:g.elapsed,phase:g.phase};
  });
  for(const result of results){assert.deepEqual(result,results[0]);assert.equal(result.phase,'playing');assert.ok(result.score>=8);}
});
test('long runs survive varied reachable gaps through maximum difficulty',()=>{
  for(const seed of [1,42,867]){
    let state=seed;const random=()=>{state=(state*1664525+1013904223)>>>0;return state/4294967296;};
    const g=new Game(random);g.start();
    for(let i=0;i<120*100;i++){
      pilot(g);g.update(STEP);
      assert.equal(g.phase,'playing',`seed ${seed}, score ${g.score}`);
      for(let j=1;j<g.gates.length;j++)assert.ok(Math.abs(g.gates[j].center-g.gates[j-1].center)<=72);
      for(const gate of g.gates){assert.ok(gate.center-gate.gap/2>50);assert.ok(gate.center+gate.gap/2<WORLD.ground-40);}
    }
    assert.ok(g.score>30);
  }
});
test('a stalled frame never advances more than 100ms',()=>{
  const clock=new FixedClock();let elapsed=0;clock.advance(30,dt=>elapsed+=dt);assert.ok(elapsed<=.1000001);
});
