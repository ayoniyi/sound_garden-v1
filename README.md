# sound garden

React + Vite. `npm install && npm run dev`

Flow: turn sound on → loading → pick 1 drum hex (amber) → 1 bass hex (violet) → up to 3 sound hexes (mint) → free play.
The bottom bar has a tempo indicator (BPM + beat pips, pulsing on the audio clock), a volume meter and stop.
Every loop starts on the next bar line (124 BPM grid); bass and sounds also fade in while a low-pass filter opens, drums
swap with a short crossfade. The URL (`?t=0,9,15`) stores your mix and restores it on load.

## Sounds
Out of the box every loop is synthesized in-browser (`src/synth.js`), so it works with zero downloads.
To use real samples, drop files into `public/samples/` named `drums-1..12`, `bass-1..10`, `sound-1..10` (`.wav`).
Each file is auto-fitted to a whole number of bars at 124 BPM, so any 120-128 BPM loop will lock in.

Free sources: Looperman (looperman.com, free 124 BPM house/electronic drum, bass and synth loops; check each loop's licence)
and BVKER's "Golden Hour" free pack by Diode Eins (bvker.com: drum, bass and melodic loops, royalty-free).
