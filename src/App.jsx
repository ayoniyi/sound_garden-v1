import { useEffect, useRef, useState } from "react";
import { Engine, LOOP } from "./engine.js";
import { BPM, BEAT, LIB, GROUPS } from "./synth.js";

// Honeycomb layout: columns of hexes (flat-top), centred on the group's anchor point.
const colsFor = (n) => (n === 12 ? [3, 3, 3, 3] : n === 10 ? [3, 2, 3, 2] : Array.from({ length: Math.ceil(n / 3) }, (_, i) => Math.min(3, n - i * 3)));
function cells(n) {
  const out = [];
  colsFor(n).forEach((m, c) => { const off = m === 3 ? (c % 2) * 0.5 : 0.5; for (let r = 0; r < m; r++) out.push([c * 1.5, (off + r) * Math.sqrt(3)]); });
  const xs = out.map((p) => p[0]), ys = out.map((p) => p[1]);
  const mx = (Math.min(...xs) + Math.max(...xs)) / 2, my = (Math.min(...ys) + Math.max(...ys)) / 2;
  return out.map(([x, y]) => [x - mx, y - my]);
}
const CELLS = Object.fromEntries(GROUPS.map((g) => [g, cells(LIB.filter((d) => d.group === g).length)]));

// volume meter: bars shade amber -> violet -> mint, same as the loading bar
const NBARS = 16, hex2 = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mixc = (a, b, t) => "#" + a.map((v, i) => Math.round(v + (b[i] - v) * t).toString(16).padStart(2, "0")).join("");
const BAR_COL = Array.from({ length: NBARS }, (_, i) => {
  const t = i / (NBARS - 1), A = hex2("#ffb020"), B = hex2("#9b6bff"), C = hex2("#2de2a6");
  return t < 0.5 ? mixc(A, B, t * 2) : mixc(B, C, (t - 0.5) * 2);
});

const hexPts = (r) => [0, 1, 2, 3, 4, 5].map((i) => { const a = (Math.PI / 3) * i; return `${(r * Math.cos(a)).toFixed(1)},${(r * Math.sin(a)).toFixed(1)}`; }).join(" ");
const HINT = {
  drums: "Plant a rhythm. Tap a drum hex — one beat grows at a time.",
  bass: "Now the low end. Tap a bass hex — one line at a time.",
  sounds: "Last, the sounds. Up to three can play together.",
};
const NEXT = { drums: "bass", bass: "sounds", sounds: "free" };

function useWide() {
  const [w, setW] = useState(window.innerWidth > 760);
  useEffect(() => { const f = () => setW(window.innerWidth > 760); window.addEventListener("resize", f); return () => window.removeEventListener("resize", f); }, []);
  return w;
}

export default function App() {
  const [stage, setStage] = useState("intro"); // intro | loading | drums | bass | sounds | free
  const [prog, setProg] = useState(0);
  const [sel, setSel] = useState({});
  const [hover, setHover] = useState(null);
  const wide = useWide();
  const [vol, setVol] = useState(0.92), [muted, setMuted] = useState(false);
  const eng = useRef(null), tiles = useRef({}), bar = useRef(null), tempo = useRef(null), pips = useRef([]), lastBeat = useRef(-2);

  const sync = () => {
    const e = eng.current, ids = [...e.voices.keys()];
    setSel(Object.fromEntries(ids.map((id) => [id, 1])));
    history.replaceState(null, "", ids.length ? `?t=${ids.join(",")}` : location.pathname);
  };

  const enter = async () => {
    const e = (eng.current = new Engine());
    await e.ctx.resume(); setStage("loading");
    await e.load(setProg);
    const ids = (new URLSearchParams(location.search).get("t") || "").split(",").map(Number).filter((n) => LIB[n]);
    if (ids.length) { let at; ids.forEach((id) => { at = e.toggle(LIB[id], at).at ?? at; }); sync(); setStage("free"); }
    else setStage("drums");
  };

  const press = (d) => {
    if (!["drums", "bass", "sounds", "free"].includes(stage)) return;
    if (stage !== "free" && d.group !== stage) return;
    const r = eng.current.toggle(d); sync();
    if (r.on && stage === d.group) setTimeout(() => setStage(NEXT[d.group]), 900);
  };
  const stopAll = () => { eng.current?.stopAll(); sync(); };
  const level = muted ? 0 : vol;
  const onVol = (ev) => { const v = +ev.target.value; setVol(v); if (v > 0) setMuted(false); };
  const toggleMute = () => { if (vol === 0) { setVol(0.6); setMuted(false); } else setMuted((m) => !m); };
  useEffect(() => { eng.current?.setVolume(level); }, [level, stage]);

  useEffect(() => {
    let raf;
    const tick = () => {
      const e = eng.current;
      if (e) {
        const now = e.ctx.currentTime;
        if (bar.current) bar.current.style.transform = `scaleX(${e.voices.size ? ((((now - e.t0) % LOOP) + LOOP) % LOOP) / LOOP : 0})`;
        if (tempo.current) { // beat pulse + bar position, read straight off the audio clock
          const bp = (now - e.t0) / BEAT, live = e.voices.size > 0 && bp >= 0;
          const bi = live ? Math.floor(bp) % 4 : -1;
          tempo.current.style.setProperty("--p", live ? Math.exp(-(bp % 1) * 4.5).toFixed(3) : "0");
          if (bi !== lastBeat.current) { lastBeat.current = bi; pips.current.forEach((el, i) => el && (el.dataset.on = i === bi ? "1" : "0")); }
        }
        for (const d of LIB) {
          const el = tiles.current[d.id]; if (!el) continue;
          const v = e.voices.get(d.id), st = !v ? "off" : now < v.at ? "pending" : "on";
          if (el.dataset.state !== st) el.dataset.state = st;
          el.children[1].style.transform = `scale(${st === "on" ? 0.3 + 0.7 * (((now - v.at) % LOOP) / LOOP) : 0})`;
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick); return () => cancelAnimationFrame(raf);
  }, []);

  const R = wide ? 40 : 34, step = R * 1.07;
  const cen = wide ? [[170, 200], [500, 200], [830, 200]] : [[210, 140], [210, 400], [210, 660]];
  const playing = ["drums", "bass", "sounds", "free"].includes(stage);
  const guided = ["drums", "bass", "sounds"].includes(stage);
  const hov = hover != null ? LIB[hover] : null;

  return (
    <div className="app">
      <div className="progress"><i ref={bar} /></div>
      <header>
        <h1>sound garden</h1>
        <p key={stage} className="hint">{HINT[stage] || (stage === "free" && !hov ? "" : "\u00A0")}</p>
      </header>

      <svg className="stage" viewBox={wide ? "0 0 1000 400" : "0 0 420 800"} preserveAspectRatio="xMidYMid meet">
        {LIB.map((d) => {
          const gi = GROUPS.indexOf(d.group), [dx, dy] = CELLS[d.group][d.idx], [cx, cy] = cen[gi];
          const x = cx + dx * step, y = cy + dy * step;
          const locked = guided && d.group !== stage;
          return (
            <g key={d.id} className={`tile ${d.group}${locked ? " locked" : ""}`} data-state="off"
               transform={`translate(${x.toFixed(1)} ${y.toFixed(1)})`} ref={(el) => (tiles.current[d.id] = el)}
               onClick={() => press(d)} onMouseEnter={() => setHover(d.id)} onMouseLeave={() => setHover(null)}>
              <polygon className="base" points={hexPts(R * 0.94)} />
              <polygon className="fill" points={hexPts(R * 0.8)} />
            </g>
          );
        })}
      </svg>

      <div className="label">{hov ? `${hov.name} · ${hov.group}` : "\u00A0"}</div>
      {playing && (
        <div className="dock">
          <div className="tempo" ref={tempo} title={`${BPM} BPM`}>
            <div className="tempo-hex">
              <svg viewBox="-30 -30 60 60"><polygon className="ring" points={hexPts(28)} /><polygon className="pulse" points={hexPts(28)} /></svg>
              <div className="tempo-num"><b>{BPM}</b><span>bpm</span></div>
            </div>
            <svg className="pips" viewBox="0 0 76 16" aria-hidden="true">
              {[0, 1, 2, 3].map((i) => (
                <polygon key={i} ref={(el) => (pips.current[i] = el)} data-on="0" data-down={i === 0 ? "1" : "0"} transform={`translate(${8 + i * 20} 8)`} points={hexPts(7)} />
              ))}
            </svg>
          </div>

          <div className="vol">
            <button className="vol-ico" onClick={toggleMute} aria-label={level === 0 ? "Unmute" : "Mute"}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 9v6h4l5 4V5L8 9H4z" />
                {level === 0 ? <path d="M17 9.5l4.5 5M21.5 9.5l-4.5 5" /> : <><path d="M16.5 8.5a5 5 0 0 1 0 7" />{level > 0.55 && <path d="M19 6a8.5 8.5 0 0 1 0 12" />}</>}
              </svg>
            </button>
            <div className="vol-track">
              <div className="vol-bars">
                {BAR_COL.map((c, i) => (
                  <i key={i} data-on={i < Math.max(level > 0 ? 1 : 0, Math.round(level * NBARS)) ? "1" : "0"} style={{ "--c": c, height: `${8 + i * (18 / (NBARS - 1))}px` }} />
                ))}
              </div>
              <input type="range" min="0" max="1" step="0.01" value={level} onChange={onVol} aria-label="Volume" />
            </div>
            <span className="vol-num">{Math.round(level * 100)}</span>
          </div>

          <button className="stop" onClick={stopAll} aria-label="Stop all"><svg viewBox="-30 -30 60 60"><polygon points={hexPts(28)} /></svg><span>stop</span></button>
        </div>
      )}
      <footer>grown in your browser</footer>

      {(stage === "intro" || stage === "loading") && (
        <div className="overlay">
          <h1 className="big">sound garden</h1>
          {stage === "intro" ? (
            <>
              <svg className="spk" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 9v6h4l5 4V5L8 9H4z" /><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" /></svg>
              <p className="ask">Turn your sound on.</p>
              <p className="sub">Headphones recommended. Loops lock to a shared beat.</p>
              <button className="enter" onClick={enter}>Enter the garden</button>
            </>
          ) : (
            <>
              <p className="ask">Planting samples…</p>
              <div className="load"><i style={{ width: `${Math.round(prog * 100)}%` }} /></div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
