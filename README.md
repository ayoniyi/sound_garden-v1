# 🌿 Sound Garden

An ambient, interactive procedural music garden and loop builder for the web. Built with **React**, **Vite**, and the **Web Audio API**, Sound Garden allows anyone to compose, layer, and explore synchronized electronic music in real time right in the browser—with zero external downloads required.

[![React](https://img.shields.io/badge/React-18.3-61dafb?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646cff?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Web Audio API](https://img.shields.io/badge/Web%20Audio-API-ffb020)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## 🌟 Highlights

- **Zero-Asset Synthesis**: Out of the box, all 32 musical loops (drums, bass, atmospheric synths) are procedurally synthesized in-browser using Web Audio oscillators, noise generators, and biquad filter envelopes.
- **Micro-Quantized Bar Grid**: Master clock running at **124 BPM** in **A minor**. Every loop start, stop, and switch automatically snaps to the next bar boundary (`nextBar()`), keeping everything phase-locked without rhythmic drift.
- **Organic Crossfades & Filter Sweeps**: New synth and bass voices open over a full bar with an exponential low-pass filter sweep (350 Hz &rarr; 18 kHz) while drums crossfade with click-free transitions.
- **Smart Voice Limits**: Concurrency rules keep mixes balanced:
  - **Drums** (Amber): 1 loop active at a time (automatic replacement).
  - **Bass** (Violet): 1 loop active at a time (automatic replacement).
  - **Sounds / Melodies** (Mint): Up to 3 harmonious loops active simultaneously.
- **Custom Sample Drop-In & Auto-Fit**: Drop `.wav` loops into `public/samples/`. The engine auto-detects sample durations and adjusts playback rates to snap loops between 120–128 BPM into the 124 BPM master grid.
- **URL Mix Sharing**: Your active mix state synchronizes directly to the browser query parameters (`?t=0,14,23`), making creations shareable via a single link.
- **Rich Aesthetic & Audio-Visual Feedback**: Honeycomb SVG layout, pulsing beat pips, a master cycle progress bar, and an LED-style perceptual volume meter.

---

## 🎧 Interactive Flow

Sound Garden guides users through a mindful onboarding experience:

```
[ Welcome Overlay ] ──▶ [ AudioContext Unlock ] ──▶ [ Offline Pre-render (0-100%) ]
                                                              │
                                                              ▼
[ Free Jam / Play Mode ] ◀── [ Pick up to 3 Sounds ] ◀── [ Pick 1 Bass ] ◀── [ Pick 1 Drum ]
         │
         ├── Toggle any hex on/off
         ├── Real-time URL sync (?t=...)
         ├── Dynamic volume fader with mute
         └── Master Stop
```

1. **Enter the Garden**: Activates browser `AudioContext` and triggers offline pre-rendering of algorithmic loops with peak-level normalization.
2. **Plant a Rhythm (Drums)**: Select an amber hex. The engine starts the master clock and locks the beat to 124 BPM.
3. **Add the Low End (Bass)**: Select a violet hex. Automatically introduces an offbeat, acid, reese, or rolling bassline.
4. **Layer Melodies (Sounds)**: Select up to 3 mint hexes. Layers pads, arpeggios, stabs, and chords. Selecting a 4th sound politely fades out the oldest.
5. **Free Exploration**: Tap hexes freely to audition variations, mute, or reset with the Master Stop button.

---

## 🎵 Musical Specifications

| Parameter | Specification | Details |
| :--- | :--- | :--- |
| **Tempo** | **124 BPM** | `BEAT = 60 / 124 ≈ 0.484s` |
| **Meter** | 4/4 Time | `BAR = 4 beats ≈ 1.935s` |
| **Loop Length** | 2 Bars (8 Beats) | `LOOP = 2 * BAR ≈ 3.871s` |
| **Key & Harmony** | A Minor | `Am7` (Am9) &rarr; `Fmaj7` chord changes |
| **Root Notes** | MIDI 33 & 29 | Bar 1: A1 (55 Hz), Bar 2: F1 (43.65 Hz) |
| **Sample Rate** | 44,100 Hz | High-quality offline rendering pipeline |

---

## 🎹 Sound Library (32 Procedural Loops)

All loops are generated algorithmically in [`src/synth.js`](file:///Users/mac/Desktop/code/Build/projects/sound-garden/v3/sound-garden/src/synth.js) via Web Audio DSP:

### 🥁 1. Drums (Amber — 12 Grooves)
| ID | Preset Name | Character & Elements |
|:---|:---|:---|
| `0` | **Four on the floor** | Punchy 909-style pitch-envelope kick + open hats on the offbeat. |
| `1` | **Clap & hat** | Classic four-on-the-floor with multi-layered noise claps on 2 & 4. |
| `2` | **Shuffle** | Shuffled 16th-note hi-hat groove with 25% swing. |
| `3` | **Minimal perc** | Sparse woodblock/triangle tuned percussive hits. |
| `4` | **Full groove** | Driving kick, layered claps, open hats, and rolling 16th closed hats. |
| `5` | **Broken tech** | Syncopated kick accents with rolling tech-house percussion. |
| `6` | **Rolling** | High-energy driving tech pattern with late ghost snares. |
| `7` | **Deep house** | Subtle 12% swing, muted kick, warm shaker, and soft clap. |
| `8` | **Garage skip** | 2-step UK garage kick skips, triangle sub-layer snare, and 30% swing. |
| `9` | **Tom roll** | Low & mid resonant pitched tom fills interwoven into the kick. |
| `10`| **Breaks** | Breakbeat kick placement with syncopated snare accents. |
| `11`| **Afro perc** | Polyrhythmic high toms, shaker, and accented afro-house cadence. |

### 🎸 2. Basslines (Violet — 10 Lines)
| ID | Preset Name | Synthesis Technique |
|:---|:---|:---|
| `12`| **Rolling offbeat** | Filtered saw wave hitting on eighth-note upbeats with 900 Hz cutoff. |
| `13`| **Square pulse** | Deep punchy square wave sub with short 1-step decay. |
| `14`| **Acid runner** | 16th-note 303-style runner with octave and minor-third melodic jumps. |
| `15`| **Bounce** | Syncopated dotted-rhythm sub with 800 Hz lowpass damping. |
| `16`| **Reese** | Dual detuned saw waves (`detune = 14 cents`) creating a deep sustained chorused drone. |
| `17`| **Octave bounce** | Rapid octave jumping bassline for driving energetic house tracks. |
| `18`| **Wobble** | Modulated cutoff frequency using an internal tempo-synced LFO (`2 / BEAT`). |
| `19`| **Gallop** | Triplet-feel sixteenth-note galloping pattern. |
| `20`| **Walking line** | Jazz-influenced melodic bassline walking through root, 3rd, and 5th intervals. |
| `21`| **Electro pulse** | Sharp high-resonance square pulse with octave leaps. |

### 🌌 3. Melodic & Ambient Sounds (Mint — 10 Textures)
| ID | Preset Name | Character & Sound Design |
|:---|:---|:---|
| `22`| **Warm pad** | Lush polyphonic chord bed (`Am7` &rarr; `Fmaj7`) with detuned saw oscillators. |
| `23`| **Pluck arp** | Fast 16th-note triangle pluck arpeggiating up and down chord tones. |
| `24`| **House stabs** | Detuned minor-ninth chord stabs landing on syncopated offbeats. |
| `25`| **Glass lead** | Bell-like lead melody with gentle vibrato and soft square wave attack. |
| `26`| **Riser** | Swept bandpass filtered noise generator building energy across each bar. |
| `27`| **Organ riff** | Classic M1/house-style percussive square organ chord riff. |
| `28`| **Acid squelch** | High-Q (`Q = 14`) resonant resonant filter envelope with melodic pitch contour. |
| `29`| **Dub stab** | Filtered minor chord with exponentially decaying multi-tap delay emulation. |
| `30`| **Bell arp** | Additive sine wave synthesis with non-integer harmonic overtones (chime texture). |
| `31`| **Gated saw** | Rhythmic trance/progressive-style gated saw synth cutting on sixteenth notes. |

---

## 🛠️ Architecture & Audio Engine

Sound Garden uses a dual-engine architecture: an **offline synthesizer** for zero-latency instantiation and a **real-time Web Audio pipeline** for live performance.

```
                    [ OfflineAudioContext ]
                               │
               (Pre-renders 32 procedural loops)
                               │
                               ▼
[ Web Audio Graph ] ──▶ [ AudioBufferSourceNode ] (loop = true, playbackRate = rate)
                               │
                               ▼
                       [ BiquadFilterNode ] (lowpass sweep 350 Hz -> 18 kHz)
                               │
                               ▼
                       [ GainNode (Voice) ] (per-group volume & fades)
                               │
                               ▼
                       [ GainNode (Master) ] (squared fader curve for natural feel)
                               │
                               ▼
                 [ DynamicsCompressorNode ] (anti-clipping glue compression)
                               │
                               ▼
                    [ AudioContext.destination ]
```

### Key Technical Implementations
- **Audio Clock Synchronization**: The app anchors all events to `audioContext.currentTime`. The top progress bar and tempo pips run on `requestAnimationFrame` reading phase offsets directly from the audio clock (`(now - t0) / LOOP`).
- **Phase-Matched Looping**: When loops trigger, they are scheduled with `start(at)` where `at = nextBar()`. Active voices loop seamlessly using native `AudioBufferSourceNode.loop = true`.
- **Perceptual Volume Curve**: Master volume uses a quadratic taper `gain.setTargetAtTime(vol * vol, t, 0.03)` to match human hearing response rather than linear attenuation.

---

## 📁 Custom Samples Integration

You can replace any or all synthesized loops with real `.wav` audio files!

### 1. File Placement & Naming
Place your WAV files in [`public/samples/`](file:///Users/mac/Desktop/code/Build/projects/sound-garden/v3/sound-garden/public/samples):

```
public/samples/
├── drums-1.wav   ... drums-12.wav
├── bass-1.wav    ... bass-10.wav
└── sound-1.wav   ... sound-10.wav
```

### 2. Auto-Fit Engine
You do not need to edit samples to exact lengths. When Sound Garden boots, [`engine.js`](file:///Users/mac/Desktop/code/Build/projects/sound-garden/v3/sound-garden/src/engine.js) measures the loaded buffer:
```javascript
const bars = Math.max(1, Math.round(buffer.duration / BAR));
this.rate[id] = buffer.duration / (bars * BAR);
```
- If you drop in a 120 BPM or 128 BPM loop, the engine automatically calculates the exact playback rate to lock it cleanly to **124 BPM**.
- If a sample file is missing or fails to load, the engine falls back to procedural synthesis silently.

### 3. Recommended Free Sample Sources
- **[Looperman](https://www.looperman.com/)**: Thousands of free 124 BPM house, techno, and melodic loops (verify individual creator licenses).
- **[BVKER's Golden Hour Pack](https://bvker.com/)** (by Diode Eins): Royalty-free house and melodic techno drum, bass, and synth loops.

---

## 🗂️ Project Structure

```
sound-garden/
├── index.html              # HTML shell with Google Fonts preconnect (Unbounded, Inter)
├── package.json            # Scripts and dependencies (React 18, Vite 5)
├── vite.config.js          # Vite configuration with @vitejs/plugin-react
├── README.md               # Project documentation
├── public/
│   └── samples/            # Optional directory for custom WAV samples
└── src/
    ├── main.jsx            # Application mount point
    ├── App.jsx             # Honeycomb layout, UI state machine, rAF render loop
    ├── engine.js           # Web Audio API engine, voice scheduling & mixing
    ├── synth.js            # Algorithmic loop generators, musical chords & scales
    └── styles.css          # Dark glassmorphic aesthetic, animations, SVG styling
```

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18.0 or higher recommended)
- `npm` or `pnpm` or `yarn`

### Installation & Local Development

1. **Clone or navigate into the repository**:
   ```bash
   cd sound-garden
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```
   Open your browser to the local URL displayed (default: `http://localhost:5173`).

4. **Build for production**:
   ```bash
   npm run build
   ```

5. **Preview production build**:
   ```bash
   npm run preview
   ```

---

## 🎨 Controls & Interface Guide

- **Hexagon Tiles**:
  - **Dim Outline**: Loop inactive / idle.
  - **Pulsing Outline**: Loop queued, awaiting the next bar boundary.
  - **Solid Glow & Expanding Hex**: Loop active and playing; inner hex scales with the loop playback phase.
  - **Faded Out**: Tile locked during the guided intro stage.
- **Top Bar**: Indicates global 2-bar loop cycle position.
- **Tempo Widget (Bottom Left)**: Displays master 124 BPM with an active pulse on every quarter note and a 4-pip downbeat tracker.
- **Volume Fader (Bottom Center)**: 16-step LED gradient meter (amber &rarr; violet &rarr; mint). Click the speaker icon to instantly mute/unmute.
- **Master Stop (Bottom Right)**: Fades out all active voices with release envelopes and resets the mix.
- **URL Sharing**: Look at your address bar! Copy the URL with `?t=...` to share your exact sonic composition with others.

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
