import { PRODUCTS, type Product } from './products';
export const WORLD = { width: 360, height: 640, ground: 590, x: 92, radius: 9 };
export const STEP = 1 / 120;
export type Phase = 'ready' | 'playing' | 'paused' | 'over';
export interface Gate { x: number; center: number; gap: number; scored: boolean; gift: number; product?: Product; presentX?: number; presentY?: number; collected?: boolean }
export interface Spark { x: number; y: number; vx: number; vy: number; life: number }
// Two ramps. Score 0-30: gentle warmup. Score 30-80: expert tier. Time alive adds pressure too.
export function difficulty(score: number, elapsed = 0) {
  const level = Math.max(score, 0) + Math.max(elapsed, 0) / 8;
  const warm = Math.min(level / 30, 1), expert = Math.min(Math.max(level - 30, 0) / 50, 1);
  return { speed: 105 + 38 * warm + 32 * expert, gap: 184 - 38 * warm - 20 * expert, spacing: 210 - 16 * expert };
}
export class Game {
  phase: Phase = 'ready';
  y = 295;
  previousY = 295;
  velocity = 0;
  score = 0;
  distance = 0;
  elapsed = 0;
  gates: Gate[] = [];
  sparks: Spark[] = [];
  flash = 0;
  collected: Product[] = [];
  pickup: Product | null = null;
  pickupTime = 0;
  private gatesCreated = 0;
  private nextPresent = 3;
  onScore = () => {};
  onEnd = () => {};
  onCollect = () => {};
  constructor(private random: () => number = Math.random) {}
  start() {
    this.phase = 'playing'; this.y = 295; this.previousY = this.y;
    this.velocity = -285; this.score = 0; this.distance = 0;
    this.elapsed = 0; this.sparks = []; this.flash = 0;
    this.collected = []; this.pickup = null; this.pickupTime = 0;
    this.gatesCreated = 1; this.nextPresent = 3;
    this.gates = [{ x: 385, center: 295, gap: 184, scored: false, gift: 0 }];
  }
  boost() { if (this.phase === 'playing') this.velocity = -285; }
  pause() { if (this.phase === 'playing') this.phase = 'paused'; }
  resume() { if (this.phase === 'paused') { this.phase = 'playing'; this.previousY = this.y; } }
  burst(x: number, y: number, count: number) {
    for (let i = 0; i < count; i++) {
      const angle = i / count * Math.PI * 2;
      this.sparks.push({ x, y, vx: Math.cos(angle) * 45, vy: Math.sin(angle) * 45, life: .6 });
    }
  }
  end() {
    if (this.phase !== 'playing') return;
    this.phase = 'over'; this.flash = .15; this.burst(WORLD.x, this.y, 14); this.onEnd();
  }
  update(dt: number) {
    if (this.phase === 'paused' || this.phase === 'ready') return;
    this.flash = Math.max(0, this.flash - dt);
    this.pickupTime = Math.max(0, this.pickupTime - dt);
    this.sparks = this.sparks.filter(p => { p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; return p.life > 0; });
    if (this.phase !== 'playing') return;
    this.previousY = this.y;
    this.elapsed += dt;
    this.velocity = Math.min(this.velocity + 850 * dt, 420);
    this.y += this.velocity * dt;
    if (this.y < 20) { this.y = 20; this.velocity = Math.max(0, this.velocity); }
    const level = difficulty(this.score, this.elapsed);
    const advance = level.speed * dt;
    this.distance += advance;
    for (const gate of this.gates) gate.x -= advance;
    const last = this.gates[this.gates.length - 1];
    if (last && last.x < WORLD.width + 30) {
      const center = Math.max(155, Math.min(440, last.center + (this.random() * 2 - 1) * 72));
      this.gatesCreated++;
      const product = this.gatesCreated === this.nextPresent ? PRODUCTS[Math.min(PRODUCTS.length - 1, Math.floor(this.random() * PRODUCTS.length))] : undefined;
      if(product)this.nextPresent += 3 + Math.floor(this.random() * 3);
      // Present floats in open lane before gate, off flight line. Must dive or hop, then recover.
      // Present lane runs wider so detour fits.
      const spacing = level.spacing + (product ? 110 : 0), lane = spacing - 54, presentX = product ? -lane / 2 : undefined;
      // Reach = fall possible before next gate edge plus half safe band, minus hop overshoot. Fair at top speed.
      const t = (lane / 2 - 2 * WORLD.radius) / level.speed, reach = 425 * t * t + level.gap / 2 - WORLD.radius - 55;
      // High present arrives while rising; gravity alone must pull back down, so less reach up.
      const low = Math.max(50, Math.max(last.center, center) - reach + 30), high = Math.min(WORLD.ground - 50, Math.min(last.center, center) + reach);
      const mid = (last.center + center) / 2, off = 55 + this.random() * 30;
      let dir = this.random() < .5 ? -1 : 1;
      const place = (d: number) => Math.max(low, Math.min(high, mid + d * off));
      // Squeezed side gives weak detour. Flip to roomier side.
      if (Math.abs(place(dir) - mid) < 45 && Math.abs(place(-dir) - mid) > Math.abs(place(dir) - mid)) dir = -dir;
      const presentY = product ? place(dir) : undefined;
      this.gates.push({ x: last.x + spacing, center, gap: level.gap, scored: false, gift: Math.floor(this.random() * 3), product, presentX, presentY });
    }
    this.gates = this.gates.filter(g => g.x > -65);
    if (this.y + WORLD.radius >= WORLD.ground) { this.end(); return; }
    for (const gate of this.gates) {
      const overlapsX = WORLD.x + WORLD.radius > gate.x && WORLD.x - WORLD.radius < gate.x + 54;
      if (overlapsX && (this.y - WORLD.radius < gate.center - gate.gap / 2 || this.y + WORLD.radius > gate.center + gate.gap / 2)) {
        this.end(); return;
      }
      const px = gate.x + (gate.presentX ?? 27), py = gate.presentY ?? gate.center;
      if(gate.product && !gate.collected && Math.abs(WORLD.x - px) < WORLD.radius + 8 && Math.abs(this.y - py) < WORLD.radius + 5){
        gate.collected = true; this.collected.push(gate.product); this.pickup = gate.product; this.pickupTime = 2.4;
        this.burst(px, py, 8); this.onCollect();
      }
      if (!gate.scored && gate.x + 54 < WORLD.x - WORLD.radius) {
        gate.scored = true; this.score++; this.burst(WORLD.x + 12, this.y, 6); this.onScore();

      }
    }
  }
}
export class FixedClock {
  accumulator = 0;
  advance(seconds: number, update: (dt: number) => void) {
    this.accumulator += Math.min(Math.max(seconds, 0), .1);
    while (this.accumulator + 1e-10 >= STEP) { update(STEP); this.accumulator -= STEP; }
    return Math.max(0, this.accumulator / STEP);
  }
  reset() { this.accumulator = 0; }
}
