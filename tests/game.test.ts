import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Game, FixedClock, STEP, difficulty, WORLD } from '../src/game';
import { PRODUCTS } from '../src/products';

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
test('difficulty keeps rising with score and time, then caps',()=>{
  assert.equal(difficulty(0).gap,184);assert.equal(difficulty(30).gap,146);assert.equal(difficulty(80).gap,126);
  assert.ok(difficulty(40).speed>difficulty(30).speed);
  assert.ok(difficulty(10,120).speed>difficulty(10).speed);
  assert.deepEqual(difficulty(300),difficulty(80));assert.deepEqual(difficulty(0,9999),difficulty(80));
  for(let i=1;i<=80;i++){assert.ok(difficulty(i).speed>=difficulty(i-1).speed);assert.ok(difficulty(i).gap<=difficulty(i-1).gap);}
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
    for(let i=0;i<120*300;i++){
      pilot(g);g.update(STEP);
      assert.ok(g.phase==='playing',`seed ${seed}, score ${g.score}`);
      for(let j=1;j<g.gates.length;j++)assert.ok(Math.abs(g.gates[j].center-g.gates[j-1].center)<=72);
      for(const gate of g.gates){assert.ok(gate.center-gate.gap/2>50);assert.ok(gate.center+gate.gap/2<WORLD.ground-40);}
    }
    assert.ok(g.score>80);
  }
});
test('a stalled frame never advances more than 100ms',()=>{
  const clock=new FixedClock();let elapsed=0;clock.advance(30,dt=>elapsed+=dt);assert.ok(elapsed<=.1000001);
});
test('twenty distinct products and occasional presents off the flight line between gates',()=>{
  assert.equal(PRODUCTS.length,20);assert.equal(new Set(PRODUCTS).size,20);
  const g=new Game(()=>.1);g.start();let presents=0;const seen=new Set<object>();
  for(let i=0;i<120*35;i++){
    pilot(g);g.update(STEP);
    for(const gate of g.gates)if(gate.product&&!seen.has(gate)){
      seen.add(gate);presents++;assert.ok(PRODUCTS.includes(gate.product));
      const prev=g.gates[g.gates.indexOf(gate)-1];
      assert.ok(gate.presentX!+15<0);assert.ok(gate.x+gate.presentX!-15>prev.x+54);
      assert.ok(Math.abs(gate.presentY!-(prev.center+gate.center)/2)>=40);
      assert.ok(gate.presentY!>50);assert.ok(gate.presentY!<WORLD.ground-40);
    }
  }
  assert.ok(presents>=3);assert.ok(presents<g.score/2);
});
test('a present needs an intentional edge approach, collects once, adds no score',()=>{
  const g=new Game();g.start();g.velocity=0;
  const gate={x:170,center:295,gap:184,scored:false,gift:0,product:PRODUCTS[0],presentX:-78,presentY:228,collected:false};
  g.gates=[gate];g.y=295;g.update(STEP);assert.equal(g.collected.length,0);
  g.y=228;g.velocity=0;g.update(STEP);assert.equal(g.collected[0],'LEGO set');assert.equal(g.score,0);
  g.update(STEP);assert.equal(g.collected.length,1);assert.equal(g.pickup,'LEGO set');
  g.start();assert.equal(g.collected.length,0);assert.equal(g.pickup,null);
});
function hunter(g:Game){
  const ahead=g.gates.filter(gate=>gate.x+54>=WORLD.x-WORLD.radius);
  const present=ahead.find(gate=>gate.product&&!gate.collected&&gate.x+gate.presentX!>=WORLD.x-6);
  const chasing=present&&present.x+present.presentX!<ahead[0].x;
  const target=chasing?present.presentY!:ahead[0]?.center??295;
  return g.y>target+(chasing?10:8)&&g.velocity>0;
}
// Try hop vs wait, roll out 1s with reflex pilot, keep choice that survives and grabs more.
function planner(g:Game){
  const reflex=hunter(g);if(g.velocity<=0)return reflex;
  const outcome=(hop:boolean)=>{
    const s=new Game(()=>.5);s.start();
    Object.assign(s,{y:g.y,previousY:g.y,velocity:g.velocity,score:g.score,elapsed:g.elapsed,gates:g.gates.map(gate=>({...gate}))});
    const before=s.collected.length;if(hop)s.boost();
    for(let i=0;i<120;i++){s.update(STEP);if(s.phase!=='playing')return -1;if(hunter(s))s.boost();}
    return s.collected.length-before;
  };
  const hop=outcome(true),wait=outcome(false);
  return hop===wait?reflex:hop>wait;
}
test('presents take a dive or hop but stay reachable through maximum difficulty',()=>{
  for(const seed of [1,42,867]){
    let state=seed;const random=()=>{state=(state*1664525+1013904223)>>>0;return state/4294967296;};
    const g=new Game(random);g.start();let offered=0;const seen=new Set<object>();
    for(let i=0;i<120*300;i++){
      if(planner(g))g.boost();g.update(STEP);
      assert.equal(g.phase,'playing',`seed ${seed}, score ${g.score}`);
      for(const gate of g.gates)if(gate.product&&gate.x+gate.presentX!<WORLD.x-30&&!seen.has(gate)){seen.add(gate);offered++;}
    }
    assert.ok(g.score>80);assert.ok(g.collected.length>=offered*.6,`seed ${seed}: ${g.collected.length}/${offered}`);
  }
});
test('passing score milestones never interrupts a continuous flight',()=>{
  const g=new Game();g.start();g.score=4;g.velocity=0;
  g.gates=[{x:27,center:295,gap:184,scored:false,gift:0}];
  g.update(STEP);assert.equal(g.phase,'playing');assert.equal(g.score,5);
  const elapsed=g.elapsed;g.update(STEP);assert.ok(g.elapsed>elapsed);
});
