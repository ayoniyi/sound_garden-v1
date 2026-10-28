// Built-in house loop generator (124 BPM, 2 bars, A minor). Used whenever a real
// sample file isn't found in /public/samples, so the app always works.
export const BPM = 124, BEAT = 60 / BPM, BAR = BEAT * 4, BARS = 2, LOOP = BAR * BARS, SR = 44100;
const S = BEAT / 4, mf = (n) => 440 * 2 ** ((n - 69) / 12);
const CH = [[57, 60, 64, 67], [53, 57, 60, 64]], ROOT = [33, 29]; // Am7 -> Fmaj7
const hit = (p, i) => p && p[i] === "x";

function tone(c, o, { t, d, f, type = "sawtooth", vol = 0.3, a = 0.005, r = 0.05, cut = 0, det = 0, q = 0, lfo = 0 }) {
  if (t >= LOOP - 0.01) return;
  const end = Math.min(t + d + r, LOOP - 0.003), g = c.createGain();
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + a);
  g.gain.setValueAtTime(vol, Math.max(t + a, end - r)); g.gain.linearRampToValueAtTime(0, end);
  g.connect(o);
  let head = g;
  if (cut) {
    const lp = c.createBiquadFilter();
    lp.frequency.setValueAtTime(cut, t); lp.frequency.exponentialRampToValueAtTime(cut * 0.3, end);
    if (q) lp.Q.value = q;
    if (lfo) { const l = c.createOscillator(), lg = c.createGain(); l.frequency.value = lfo; lg.gain.value = cut * 0.45; l.connect(lg); lg.connect(lp.frequency); l.start(t); l.stop(end); }
    lp.connect(g); head = lp;
  }
  for (const dt of det ? [-det, det] : [0]) {
    const s = c.createOscillator(); s.type = type; s.frequency.value = f; s.detune.value = dt;
    s.connect(head); s.start(t); s.stop(end);
  }
}
function nz(c, o, t, d, { hp = 0, bp = 0, q = 1, vol = 0.3 }) {
  if (t >= LOOP - 0.01) return;
  const s = c.createBufferSource(), g = c.createGain(); s.buffer = c.nb; s.loop = true;
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(1e-4, t + d);
  let n = s;
  if (hp) { const f = c.createBiquadFilter(); f.type = "highpass"; f.frequency.value = hp; n.connect(f); n = f; }
  if (bp) { const f = c.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = bp; f.Q.value = q; n.connect(f); n = f; }
  n.connect(g); g.connect(o); s.start(t, Math.random()); s.stop(t + d + 0.02);
}
function kick(c, o, t) {
  const s = c.createOscillator(), g = c.createGain();
  s.frequency.setValueAtTime(160, t); s.frequency.exponentialRampToValueAtTime(42, t + 0.13);
  g.gain.setValueAtTime(1, t); g.gain.exponentialRampToValueAtTime(1e-4, t + 0.38);
  s.connect(g); g.connect(o); s.start(t); s.stop(t + 0.4);
}
function tom(c, o, t, f0, f1, d = 0.22, vol = 0.8) {
  const s = c.createOscillator(), g = c.createGain();
  s.frequency.setValueAtTime(f0, t); s.frequency.exponentialRampToValueAtTime(f1, t + d * 0.6);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(1e-4, t + d);
  s.connect(g); g.connect(o); s.start(t); s.stop(t + d + 0.02);
}

const drums = (k) => (c, o) => {
  for (let b = 0; b < 2; b++) for (let i = 0; i < 16; i++) {
    const t = b * BAR + i * S + (i % 2 ? (k.sw || 0) * S : 0);
    if (hit(k.k, i)) kick(c, o, t);
    if (hit(k.c, i)) for (const d of [0, 0.012, 0.024]) nz(c, o, t + d, d ? 0.12 : 0.16, { bp: 1500, q: 0.8, vol: 0.45 });
    if (hit(k.o, i)) nz(c, o, t, 0.22, { hp: 7500, vol: 0.22 });
    if (hit(k.h, i)) nz(c, o, t, 0.045, { hp: 8000, vol: i % 4 === 2 ? 0.2 : 0.12 });
    if (hit(k.p, i)) tone(c, o, { t, d: 0.04, f: i % 3 ? 420 : 640, type: "triangle", vol: 0.35, r: 0.06 });
    if (hit(k.n, i)) { nz(c, o, t, 0.16, { bp: 1900, q: 0.7, vol: 0.5 }); tone(c, o, { t, d: 0.07, f: 190, type: "triangle", vol: 0.3, a: 0.002, r: 0.05 }); }
    if (hit(k.m, i)) tom(c, o, t, 200, 95);
    if (hit(k.q, i)) tom(c, o, t, 420, 250, 0.14, 0.55);
    if (hit(k.s, i)) nz(c, o, t, 0.07, { hp: 6500, vol: i % 2 ? 0.07 : 0.12 });
  }
};
const bass = (k) => (c, o) => {
  for (let b = 0; b < 2; b++) for (let i = 0; i < 16; i++) if (hit(k.s, i)) {
    const n = ROOT[b] + (k.o ? k.o[i] : 0), t = b * BAR + i * S, d = (k.d || 2) * S;
    tone(c, o, { t, d, f: mf(n), type: k.type || "sawtooth", vol: 0.5, a: 0.008, r: 0.06, cut: k.cut || 0, det: k.det || 0, lfo: k.w || 0 });
    if (k.type !== "sine") tone(c, o, { t, d, f: mf(n), type: "sine", vol: 0.3, a: 0.008, r: 0.06 });
  }
};
const MEL = [[[0, 69, 3], [4, 72, 2], [8, 76, 2], [10, 74, 2], [12, 72, 3]], [[0, 72, 3], [4, 69, 2], [8, 65, 2], [10, 69, 2], [12, 67, 3]]];

const DRUMS = [
  ["Four on the floor", { k: "x...x...x...x...", o: "..x...x...x...x." }],
  ["Clap & hat", { k: "x...x...x...x...", c: "....x.......x...", h: "..x...x...x...x." }],
  ["Shuffle", { k: "x...x...x...x...", c: "....x.......x...", h: "x.xxx.xxx.xxx.xx", sw: 0.25 }],
  ["Minimal perc", { k: "x...x...x...x...", p: "..x..x....x..x..", h: "..x...x...x...x." }],
  ["Full groove", { k: "x...x...x...x...", c: "....x.......x...", o: "..x...x...x...x.", h: "xxxxxxxxxxxxxxxx" }],
  ["Broken tech", { k: "x..x..x...x..x..", p: ".x..x..x.x..x...", h: "x.x.x.x.x.x.x.xx" }],
  ["Rolling", { k: "x...x...x...x...", c: "....x.......x..x", o: "..x...x...x...x.", h: "xxxxxxxxxxxxxxxx" }],
  ["Deep house", { k: "x...x...x...x...", c: "....x.......x...", h: "..x...x...x...x.", s: "xxxxxxxxxxxxxxxx", sw: 0.12 }],
  ["Garage skip", { k: "x.....x...x.....", n: "....x.......x...", h: "x.x.x.x.x.x.x.x.", sw: 0.3 }],
  ["Tom roll", { k: "x...x...x...x...", m: "...x.......x..x.", c: "....x.......x...", h: "..x...x...x...x." }],
  ["Breaks", { k: "x.....x...x.x...", n: "....x.......x..x", h: "x.x.x.x.x.x.x.xx" }],
  ["Afro perc", { k: "x...x...x...x...", q: "..x..x..x...x.x.", s: "x.xxx.xxx.xxx.xx", c: "....x.......x...", sw: 0.2 }],
];
const BASSES = [
  ["Rolling offbeat", { s: "..x...x...x...x.", cut: 900 }],
  ["Square pulse", { s: "x.x.x.x.x.x.x.x.", type: "square", cut: 1100, d: 1 }],
  ["Acid runner", { s: "xxxxxxxxxxxxxxxx", cut: 2200, d: 1, o: [0, 0, 12, 0, 0, 7, 0, 12, 0, 0, 12, 0, 5, 0, 7, 3] }],
  ["Bounce", { s: "x..x..x...x..x..", cut: 800 }],
  ["Reese", { s: "x.......x.......", cut: 500, d: 7, det: 14 }],
  ["Octave bounce", { s: "x.x.x.x.x.x.x.x.", cut: 1500, d: 1, o: [0, 12, 0, 12, 0, 12, 0, 12, 0, 12, 0, 12, 0, 12, 0, 12] }],
  ["Wobble", { s: "x.......x.......", cut: 1200, d: 7, det: 6, w: 2 / BEAT }],
  ["Gallop", { s: "x..xx..xx..xx..x", cut: 1000, d: 1 }],
  ["Walking line", { s: "x..x..x.x..x..x.", cut: 1300, d: 2, o: [0, 0, 0, 3, 0, 0, 5, 0, 7, 0, 0, 5, 0, 0, 3, 0] }],
  ["Electro pulse", { s: "x..x..x..x..x...", type: "square", cut: 2600, d: 1, o: [0, 0, 0, 12, 0, 0, 0, 0, 0, 12, 0, 0, 7, 0, 0, 0] }],
];
const SOUNDS = [
  ["Warm pad", (c, o) => CH.forEach((ch, b) => ch.forEach((n) => tone(c, o, { t: b * BAR, d: BAR - 0.4, f: mf(n + 12), vol: 0.09, a: 0.5, r: 0.35, cut: 1800, det: 9 })))],
  ["Pluck arp", (c, o) => { for (let b = 0; b < 2; b++) for (let i = 0; i < 16; i++) tone(c, o, { t: b * BAR + i * S, d: 0.09, f: mf(CH[b][[0, 1, 2, 3, 2, 1, 3, 2][i % 8]] + 24), type: "triangle", vol: 0.22, a: 0.003, r: 0.07, cut: 3500 }); }],
  ["House stabs", (c, o) => { for (let b = 0; b < 2; b++) for (const i of [2, 6, 10, 14]) CH[b].forEach((n) => tone(c, o, { t: b * BAR + i * S, d: 0.1, f: mf(n + 12), vol: 0.09, cut: 3000, det: 7, r: 0.1 })); }],
  ["Glass lead", (c, o) => MEL.forEach((m, b) => m.forEach(([i, n, d]) => tone(c, o, { t: b * BAR + i * S, d: d * S, f: mf(n), type: "square", vol: 0.13, a: 0.01, r: 0.12, cut: 3200, det: 6 })))],
  ["Riser", (c, o) => { for (let b = 0; b < 2; b++) { const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(), t = b * BAR; s.buffer = c.nb; s.loop = true; f.type = "bandpass"; f.Q.value = 3; f.frequency.setValueAtTime(300, t); f.frequency.exponentialRampToValueAtTime(7000, t + BAR - 0.05); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.35, t + BAR - 0.1); g.gain.linearRampToValueAtTime(0, t + BAR); s.connect(f); f.connect(g); g.connect(o); s.start(t); s.stop(t + BAR); } }],
  ["Organ riff", (c, o) => { for (let b = 0; b < 2; b++) for (const i of [0, 3, 6, 10, 12]) CH[b].slice(1).forEach((n) => tone(c, o, { t: b * BAR + i * S, d: S * 1.5, f: mf(n + 12), type: "square", vol: 0.07, a: 0.004, r: 0.05, cut: 2400 })); }],
  ["Acid squelch", (c, o) => { const L = [0, 12, null, 7, 0, 12, 3, null, 12, 0, 7, null, 10, 12, 0, 7]; for (let b = 0; b < 2; b++) L.forEach((x, i) => x != null && tone(c, o, { t: b * BAR + i * S, d: S * 0.8, f: mf(ROOT[b] + 24 + x), vol: 0.2, a: 0.003, r: 0.03, cut: 2800, q: 14 })); }],
  ["Dub stab", (c, o) => { for (let b = 0; b < 2; b++) [2, 5, 8, 11, 14].forEach((i, j) => CH[b].forEach((n) => tone(c, o, { t: b * BAR + i * S, d: 0.08, f: mf(n + 12), vol: 0.12 * 0.62 ** j, cut: 2500, det: 6, r: 0.1 }))); }],
  ["Bell arp", (c, o) => { for (let b = 0; b < 2; b++) for (let i = 0; i < 16; i += 2) { const f = mf(CH[b][[0, 2, 1, 3][(i / 2) % 4]] + 24), t = b * BAR + i * S; tone(c, o, { t, d: 0.03, f, type: "sine", vol: 0.16, a: 0.002, r: 0.4 }); tone(c, o, { t, d: 0.02, f: f * 2.76, type: "sine", vol: 0.06, a: 0.002, r: 0.2 }); } }],
  ["Gated saw", (c, o) => { for (let b = 0; b < 2; b++) for (let i = 0; i < 16; i += 2) CH[b].forEach((n) => tone(c, o, { t: b * BAR + i * S, d: S * 1.3, f: mf(n + 12), vol: 0.06, a: 0.004, r: 0.05, cut: 4200, det: 20 })); }],
];
export const GROUPS = ["drums", "sounds", "bass"]; // left -> right
const NB = DRUMS.length, NS = NB + BASSES.length;
export const LIB = [
  ...DRUMS.map(([name, k], i) => ({ id: i, idx: i, group: "drums", name, file: `drums-${i + 1}.wav`, gen: drums(k) })),
  ...BASSES.map(([name, k], i) => ({ id: NB + i, idx: i, group: "bass", name, file: `bass-${i + 1}.wav`, gen: bass(k) })),
  ...SOUNDS.map(([name, gen], i) => ({ id: NS + i, idx: i, group: "sounds", name, file: `sound-${i + 1}.wav`, gen })),
];
export async function renderLoop(d) {
  const c = new OfflineAudioContext(1, Math.ceil(LOOP * SR), SR), o = c.createGain();
  o.connect(c.destination);
  c.nb = c.createBuffer(1, SR, SR);
  const nd = c.nb.getChannelData(0); for (let i = 0; i < SR; i++) nd[i] = Math.random() * 2 - 1;
  d.gen(c, o);
  const x = (await c.startRendering()), ch = x.getChannelData(0);
  let p = 0; for (let i = 0; i < ch.length; i++) p = Math.max(p, Math.abs(ch[i]));
  const k = 0.8 / (p || 1); for (let i = 0; i < ch.length; i++) ch[i] *= k;
  return x;
}
