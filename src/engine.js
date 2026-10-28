import { BAR, BEAT, LOOP, LIB, renderLoop } from "./synth.js";
export { LOOP };
const GAIN = { drums: 0.9, bass: 0.85, sounds: 0.6 };

export class Engine {
  constructor() {
    const ctx = (this.ctx = new (window.AudioContext || window.webkitAudioContext)());
    const out = (this.out = ctx.createGain()), comp = ctx.createDynamicsCompressor();
    out.gain.value = 0.85; out.connect(comp); comp.connect(ctx.destination);
    this.buf = {}; this.rate = {}; this.voices = new Map(); this.t0 = 0;
  }
  setVolume(v) {
    const g = this.out.gain, t = this.ctx.currentTime;
    g.cancelScheduledValues(t); g.setTargetAtTime(v * v, t, 0.03); // squared for a more natural fader feel
  }
  async load(cb) {
    let n = 0;
    for (const d of LIB) {
      const b = (await this.fetchSample(d)) || (await renderLoop(d));
      // auto-fit: snap any loaded sample to a whole number of bars at the master tempo
      const bars = Math.max(1, Math.round(b.duration / BAR));
      this.buf[d.id] = b; this.rate[d.id] = b.duration / (bars * BAR);
      cb(++n / LIB.length);
    }
  }
  async fetchSample(d) {
    try {
      const r = await fetch(`${import.meta.env.BASE_URL}samples/${d.file}`);
      if (!r.ok || !/audio|octet|wav|mpeg/.test(r.headers.get("content-type") || "")) return null;
      return await this.ctx.decodeAudioData(await r.arrayBuffer());
    } catch { return null; }
  }
  nextBar() {
    const now = this.ctx.currentTime + 0.06;
    return this.t0 + Math.ceil((now - this.t0) / BAR) * BAR;
  }
  // Starts/stops a loop on the next bar line so everything stays locked to the grid.
  toggle(d, forceAt) {
    const { ctx } = this, now = ctx.currentTime;
    if (this.voices.has(d.id)) { this.stop(d.id, this.nextBar()); return { on: false }; }
    const at = forceAt ?? (this.voices.size ? this.nextBar() : (this.t0 = now + 0.06));
    const same = [...this.voices.values()].filter((v) => v.group === d.group).sort((a, b) => a.at - b.at);
    if (d.group === "sounds") { if (same.length >= 3) this.stop(same[0].id, at); }
    else same.forEach((v) => this.stop(v.id, at));
    this.start(d, at);
    return { on: true, at };
  }
  start(d, at) {
    const { ctx } = this, s = ctx.createBufferSource(), g = ctx.createGain(), f = ctx.createBiquadFilter(), gv = GAIN[d.group];
    s.buffer = this.buf[d.id]; s.loop = true; s.playbackRate.value = this.rate[d.id];
    f.type = "lowpass"; g.gain.setValueAtTime(0, at);
    if (d.group === "drums") { f.frequency.value = 20000; g.gain.linearRampToValueAtTime(gv, at + 0.04); }
    else { // fade in over a beat while a filter opens across the bar
      g.gain.linearRampToValueAtTime(gv, at + BEAT);
      f.frequency.setValueAtTime(350, at); f.frequency.exponentialRampToValueAtTime(18000, at + BAR);
    }
    s.connect(f); f.connect(g); g.connect(this.out); s.start(at);
    this.voices.set(d.id, { id: d.id, s, g, at, group: d.group, gv });
  }
  stop(id, at) {
    const v = this.voices.get(id); if (!v) return;
    this.voices.delete(id);
    if (this.ctx.currentTime < v.at) { try { v.s.stop(); } catch {} return; }
    const dur = v.group === "sounds" ? 0.5 : v.group === "bass" ? 0.3 : 0.08;
    v.g.gain.cancelScheduledValues(at); v.g.gain.setValueAtTime(v.gv, at);
    v.g.gain.linearRampToValueAtTime(0, at + dur); v.s.stop(at + dur + 0.02);
  }
  stopAll() {
    const t = this.ctx.currentTime;
    for (const v of this.voices.values()) {
      if (t < v.at) { try { v.s.stop(); } catch {} continue; }
      v.g.gain.cancelScheduledValues(t); v.g.gain.setValueAtTime(v.g.gain.value, t);
      v.g.gain.linearRampToValueAtTime(0, t + 0.35); v.s.stop(t + 0.4);
    }
    this.voices.clear();
  }
}
