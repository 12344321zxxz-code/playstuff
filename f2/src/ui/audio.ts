// Sound, all made on the spot with WebAudio: a small folk band that writes its own tunes (lute,
// drone, flute, frame drum) and changes mode with the times; the sound of the place you are
// looking at (sea, wind, birds, a town); short stings when history turns; and a noise for each
// of your powers.
type Mood = { war: number; plague: boolean; cold: boolean; golden: boolean; people: number };
const MODES: Record<string, number[]> = { dorian: [0, 2, 3, 5, 7, 9, 10], mixo: [0, 2, 4, 5, 7, 9, 10], aeolian: [0, 2, 3, 5, 7, 8, 10], phryg: [0, 1, 3, 5, 7, 8, 10], lydian: [0, 2, 4, 6, 7, 9, 11], ionian: [0, 2, 4, 5, 7, 9, 11] };
const mtof = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

export function createAudio() {
  let ac: AudioContext | null = null, master: GainNode, music: GainNode, amb: GainNode, sfx: GainNode, verb: ConvolverNode, verbIn: GainNode;
  const vol = { master: 0.8, music: 0.55, world: 0.6, fx: 0.7 }; let muted = false;
  const ks: Record<number, AudioBuffer> = {}; let noiseBuf: AudioBuffer;
  let mood: Mood = { war: 0, plague: false, cold: false, golden: false, people: 0 };
  const view = { sea: 0, forest: 0, town: 0, zoom: 1, high: 0, storm: 0, fire: 0, winter: false };
  let rnd = Math.random;

  function init() {
    if (ac) return; const C = (window as any).AudioContext || (window as any).webkitAudioContext; if (!C) return;
    ac = new C(); const a = ac!;
    master = a.createGain(); master.gain.value = muted ? 0 : vol.master; master.connect(a.destination);
    const comp = a.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 3; comp.connect(master);
    verb = a.createConvolver(); verb.buffer = impulse(a, 2.8); verbIn = a.createGain(); verbIn.gain.value = 0.3; verbIn.connect(verb); verb.connect(comp);
    music = a.createGain(); music.gain.value = vol.music; music.connect(comp); music.connect(verbIn);
    amb = a.createGain(); amb.gain.value = vol.world; amb.connect(comp);
    sfx = a.createGain(); sfx.gain.value = vol.fx; sfx.connect(comp); sfx.connect(verbIn);
    noiseBuf = a.createBuffer(1, a.sampleRate * 2, a.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    startAmbience(); setInterval(schedule, 120);
  }
  function impulse(a: AudioContext, sec: number) { const n = a.sampleRate * sec, b = a.createBuffer(2, n, a.sampleRate); for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 3.2); } return b; }

  /* ---------- instruments ---------- */
  function pluckBuf(midi: number) {
    if (ks[midi]) return ks[midi]; const a = ac!, sr = a.sampleRate, f = mtof(midi), P = Math.round(sr / f), len = Math.floor(sr * 2.2), b = a.createBuffer(1, len, sr), d = b.getChannelData(0);
    let lp = 0; for (let i = 0; i < P; i++) { const n = Math.random() * 2 - 1; lp = lp * 0.55 + n * 0.45; d[i] = lp; }
    const damp = 0.996 - Math.max(0, midi - 60) * 0.0004;
    for (let i = P; i < len; i++) d[i] = damp * 0.5 * (d[i - P] + d[i - P - 1 < 0 ? 0 : i - P - 1]);
    return (ks[midi] = b);
  }
  function lute(midi: number, t: number, vel = 0.5, out: AudioNode = music) { const a = ac!, s = a.createBufferSource(); s.buffer = pluckBuf(midi); const g = a.createGain(); g.gain.value = vel * 0.55; const p = a.createStereoPanner(); p.pan.value = (rnd() - 0.5) * 0.5; s.connect(g); g.connect(p); p.connect(out); s.start(t); s.stop(t + 2.2); }
  function flute(midi: number, t: number, dur: number, vel = 0.4) {
    const a = ac!, f = mtof(midi), o = a.createOscillator(), o2 = a.createOscillator(), g = a.createGain(), lfo = a.createOscillator(), lg = a.createGain();
    o.type = 'sine'; o.frequency.value = f; o2.type = 'triangle'; o2.frequency.value = f; const g2 = a.createGain(); g2.gain.value = 0.25;
    lfo.frequency.value = 5.2; lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(f * 0.006, t + Math.min(0.4, dur * 0.6)); lfo.connect(lg); lg.connect(o.frequency); lg.connect(o2.frequency);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vel * 0.22, t + 0.07); g.gain.setValueAtTime(vel * 0.2, t + Math.max(0.08, dur - 0.08)); g.gain.linearRampToValueAtTime(0, t + dur + 0.05);
    const br = a.createBufferSource(); br.buffer = noiseBuf; const bf = a.createBiquadFilter(); bf.type = 'bandpass'; bf.frequency.value = f * 2; bf.Q.value = 3; const bg = a.createGain(); bg.gain.value = vel * 0.05; br.connect(bf); bf.connect(bg); bg.connect(g);
    o.connect(g); o2.connect(g2); g2.connect(g); g.connect(music); [o, o2, lfo].forEach((x) => { x.start(t); x.stop(t + dur + 0.1); }); br.start(t, rnd()); br.stop(t + dur + 0.1);
  }
  function drum(t: number, acc = 0.6) { const a = ac!, o = a.createOscillator(), g = a.createGain(); o.frequency.setValueAtTime(120, t); o.frequency.exponentialRampToValueAtTime(55, t + 0.25); g.gain.setValueAtTime(acc * 0.5, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.4); o.connect(g); g.connect(music); o.start(t); o.stop(t + 0.45);
    const n = a.createBufferSource(); n.buffer = noiseBuf; const f = a.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 900; const ng = a.createGain(); ng.gain.setValueAtTime(acc * 0.18, t); ng.gain.exponentialRampToValueAtTime(0.001, t + 0.12); n.connect(f); f.connect(ng); ng.connect(music); n.start(t, rnd()); n.stop(t + 0.15); }
  let droneNodes: { o: OscillatorNode[]; g: GainNode } | null = null;
  function drone(root: number, t: number, on: boolean) {
    const a = ac!;
    if (droneNodes) { const d = droneNodes; d.g.gain.cancelScheduledValues(t); d.g.gain.setValueAtTime(d.g.gain.value, t); d.g.gain.linearRampToValueAtTime(0, t + 3); d.o.forEach((o) => o.stop(t + 3.2)); droneNodes = null; }
    if (!on) return; const g = a.createGain(), f = a.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 520; f.Q.value = 0.7; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.045, t + 4);
    const os = [root - 12, root - 5].map((m, k) => { const o = a.createOscillator(); o.type = 'sawtooth'; o.frequency.value = mtof(m); o.detune.value = (k ? 4 : -3); o.connect(f); o.start(t); return o; });
    const lfo = a.createOscillator(), lg = a.createGain(); lfo.frequency.value = 0.07; lg.gain.value = 180; lfo.connect(lg); lg.connect(f.frequency); lfo.start(t); os.push(lfo);
    f.connect(g); g.connect(music); droneNodes = { o: os, g };
  }
  function bell(midi: number, t: number, vel = 0.4, out?: AudioNode) { const a = ac!, f = mtof(midi); for (const [r, amp, dec] of [[1, 1, 2.5], [2.76, 0.5, 1.4], [5.4, 0.25, 0.8], [0.5, 0.3, 3]]) { const o = a.createOscillator(), g = a.createGain(); o.frequency.value = f * r; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vel * amp * 0.25, t + 0.005); g.gain.exponentialRampToValueAtTime(0.0005, t + dec); o.connect(g); g.connect(out || sfx); o.start(t); o.stop(t + dec + 0.1); } }
  function noise(t: number, dur: number, type: BiquadFilterType, f0: number, f1: number, vel: number, q = 1, out?: AudioNode) { const a = ac!, n = a.createBufferSource(); n.buffer = noiseBuf; n.loop = true; const f = a.createBiquadFilter(); f.type = type; f.Q.value = q; f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur); const g = a.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vel, t + Math.min(0.05, dur * 0.2)); g.gain.exponentialRampToValueAtTime(0.0008, t + dur); n.connect(f); f.connect(g); g.connect(out || sfx); n.start(t, rnd()); n.stop(t + dur + 0.05); }
  function tone(t: number, dur: number, f0: number, f1: number, vel: number, type: OscillatorType = 'sine', out?: AudioNode) { const a = ac!, o = a.createOscillator(), g = a.createGain(); o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vel, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0008, t + dur); o.connect(g); g.connect(out || sfx); o.start(t); o.stop(t + dur + 0.05); }

  /* ---------- the composer ---------- */
  const song = { next: 0, notes: [] as [number, () => void][], root: 62, playing: false, rest: 0 };
  function compose(t0: number) {
    const m = mood; let modeName = 'dorian', tempo = 84 + rnd() * 14, meter = rnd() < 0.5 ? 3 : 4, drums = false, flutey = true, sparse = false;
    if (m.war >= 2) { modeName = rnd() < 0.5 ? 'phryg' : 'aeolian'; drums = true; tempo += 10; }
    else if (m.plague) { modeName = 'aeolian'; sparse = true; tempo -= 18; flutey = rnd() < 0.4; }
    else if (m.cold) { modeName = 'aeolian'; tempo -= 12; }
    else if (m.golden) { modeName = rnd() < 0.5 ? 'lydian' : 'mixo'; drums = rnd() < 0.5; }
    else modeName = ['dorian', 'mixo', 'ionian', 'dorian', 'aeolian'][(rnd() * 5) | 0];
    if (m.people < 300) { sparse = true; drums = false; }
    const mode = MODES[modeName], root = [57, 59, 60, 62, 64][(rnd() * 5) | 0], beat = 60 / tempo, bar = beat * meter;
    const deg = (d: number, oct = 0) => { const o = Math.floor(d / 7), k = ((d % 7) + 7) % 7; return root + mode[k] + 12 * (o + oct); };
    // a motif: rhythm and a contour, then the tune is that motif, varied, ending home
    const rhythms = meter === 3 ? [[1, 1, 1], [2, 1], [1.5, 0.5, 1], [0.5, 0.5, 1, 1], [3]] : [[1, 1, 1, 1], [2, 1, 1], [1.5, 0.5, 2], [1, 0.5, 0.5, 2], [0.5, 0.5, 1, 1, 1]];
    const motif: [number, number][] = []; let d = 4 + ((rnd() * 3) | 0); for (let b = 0; b < 2; b++) { const r = rhythms[(rnd() * rhythms.length) | 0]; for (const len of r) { motif.push([d, len]); d += [-2, -1, -1, 0, 1, 1, 2, 3][(rnd() * 8) | 0]; d = Math.max(0, Math.min(11, d)); } }
    const phrase = (shift: number, end: boolean) => { const out = motif.map(([dd, l]) => [dd + shift, l] as [number, number]); if (end) { out[out.length - 1] = [7, out[out.length - 1][1] + 1]; } return out; };
    const tune = [...phrase(0, false), ...phrase(rnd() < 0.5 ? 1 : 2, false), ...phrase(0, false), ...phrase(-1, true)];
    const prog = modeName === 'phryg' ? [0, 1, 0, 4] : modeName === 'aeolian' ? [0, 6, 5, 4] : modeName === 'mixo' ? [0, 6, 3, 0] : [0, 3, 6, 4];
    let t = t0 + 0.2; const bars = 8; const notes: [number, () => void][] = [];
    drone(root, t, !sparse || rnd() < 0.5);
    for (let b = 0; b < bars * (sparse ? 1 : 2); b++) {
      const ch = prog[(b >> 1) % prog.length], tb = t + b * bar;
      const pat = meter === 3 ? [0, 4, 7] : [0, 4, 7, 4];
      pat.forEach((iv, k) => { const tt = tb + k * beat; if (sparse && k % 2) return; notes.push([tt, () => lute(deg(ch + (iv === 4 ? 2 : iv === 7 ? 4 : 0), -1), tt, k === 0 ? 0.6 : 0.38)]); });
      if (drums && (b % 2 === 0 || rnd() < 0.5)) for (let k = 0; k < meter; k++) { const tt = tb + k * beat; if (k === 0 || rnd() < 0.35) notes.push([tt, () => drum(tt, k === 0 ? 0.75 : 0.35)]); }
    }
    // melody: twice through on the second pass if not sparse
    if (flutey) { let tt = t + (sparse ? 0 : bars * bar); for (const [dd, len] of tune) { const st = tt, mid = deg(dd, 1), du = len * beat * 0.95; notes.push([st, () => flute(mid, st, du, 0.42)]); tt += len * beat; } }
    else { let tt = t + 2 * bar; for (const [dd, len] of tune) { const st = tt, mid = deg(dd, 0); notes.push([st, () => lute(mid, st, 0.55)]); tt += len * beat; } }
    notes.sort((a, b) => a[0] - b[0]);
    song.notes = notes; song.next = t + bars * (sparse ? 1 : 2) * bar + 2; song.root = root;
  }
  function schedule() {
    if (!ac || ac.state !== 'running') return; const now = ac.currentTime;
    if (vol.music > 0.001 && !muted) {
      if (!song.notes.length && now >= song.next) { if (song.rest === 0) { song.rest = now + 8 + rnd() * 18; drone(song.root, now, false); } else if (now >= song.rest) { song.rest = 0; compose(now); } }
      while (song.notes.length && song.notes[0][0] < now + 0.6) { const [t, fn] = song.notes.shift()!; if (t >= now - 0.05) fn(); }
    }
    ambience(now);
  }

  /* ---------- the world's own sound ---------- */
  const A: Record<string, { g: GainNode; f?: BiquadFilterNode }> = {};
  function loopNoise(name: string, type: BiquadFilterType, freq: number, q: number) { const a = ac!, n = a.createBufferSource(); n.buffer = noiseBuf; n.loop = true; const f = a.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q; const g = a.createGain(); g.gain.value = 0; n.connect(f); f.connect(g); g.connect(amb); n.start(0, rnd() * 1.5); A[name] = { g, f }; }
  function startAmbience() { loopNoise('wind', 'bandpass', 700, 0.6); loopNoise('sea', 'lowpass', 420, 0.5); loopNoise('town', 'bandpass', 520, 0.8); loopNoise('rain', 'highpass', 2500, 0.4); loopNoise('fire', 'bandpass', 1800, 1.2); }
  let birdT = 0, townT = 0;
  function ambience(now: number) {
    const v = view, z = v.zoom, lerp = (n: string, target: number) => { const x = A[n]; if (x) x.g.gain.setTargetAtTime(target, now, 0.8); };
    const swell = 0.6 + 0.4 * Math.sin(now * 0.55) * Math.sin(now * 0.21);
    lerp('wind', 0.05 + 0.14 * Math.max(0, 1 - z / 8) + v.high * 0.12 + (v.winter ? 0.05 : 0));
    if (A.wind && A.wind.f) A.wind.f.frequency.setTargetAtTime(500 + 400 * Math.sin(now * 0.13), now, 1);
    lerp('sea', v.sea * (0.12 + 0.18 * Math.min(1, z / 6)) * swell);
    lerp('town', v.town * Math.min(1, Math.max(0, (z - 5) / 6)) * 0.08);
    lerp('rain', v.storm * 0.12);
    lerp('fire', v.fire * 0.1);
    if (v.forest > 0.2 && z > 5 && !v.winter && now > birdT) { birdT = now + 0.6 + rnd() * 3 / v.forest; chirp(now); }
    if (v.town > 0.3 && z > 9 && now > townT) { townT = now + 2 + rnd() * 6; if (rnd() < 0.3) bell(84 + ((rnd() * 3) | 0) * 2, now, 0.05, amb); else tone(now, 0.06, 1800 + rnd() * 800, 1500, 0.03, 'square', amb); }
  }
  function chirp(t: number) { const n = 1 + ((rnd() * 4) | 0), base = 2600 + rnd() * 2400; for (let k = 0; k < n; k++) { const tt = t + k * (0.08 + rnd() * 0.05); tone(tt, 0.07, base * (1 + rnd() * 0.3), base * (0.7 + rnd() * 0.5), 0.025 * Math.min(1, view.forest), 'sine', amb); } }

  /* ---------- stings and power sounds ---------- */
  const STING: Record<string, (t: number) => void> = {
    war: (t) => { for (let k = 0; k < 6; k++) drum(t + k * 0.12, 0.3 + k * 0.08); tone(t + 0.7, 1.4, mtof(45), mtof(45) * 0.99, 0.12, 'sawtooth'); },
    city: (t) => { bell(79, t, 0.35); bell(86, t + 0.25, 0.25); },
    found: (t) => { [0, 4, 7, 11, 14].forEach((d, k) => lute(67 + d, t + k * 0.09, 0.5, sfx)); },
    doom: (t) => { tone(t, 2.5, 55, 40, 0.3); noise(t, 2, 'lowpass', 300, 60, 0.2); },
    faith: (t) => { [0, 7, 12, 16].forEach((d) => { const a = ac!, o = a.createOscillator(), g = a.createGain(); o.frequency.value = mtof(55 + d); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.05, t + 0.8); g.gain.linearRampToValueAtTime(0, t + 2.6); o.connect(g); g.connect(sfx); o.start(t); o.stop(t + 2.7); }); },
    beast: (t) => { noise(t, 1.4, 'bandpass', 400, 120, 0.35, 2); tone(t, 1.2, 160, 70, 0.15, 'sawtooth'); },
    hero: (t) => { [0, 4, 7, 12].forEach((d, k) => flute(67 + d, t + k * 0.16, 0.18, 0.5)); },
    gone: (t) => { [0, 3, 7].forEach((d) => lute(50 + d, t, 0.5, sfx)); bell(62, t + 0.4, 0.2); },
  };
  const SFX: Record<string, (t: number) => void> = {
    rumble: (t) => noise(t, 0.9, 'lowpass', 180, 60, 0.45), water: (t) => { for (let k = 0; k < 5; k++) tone(t + k * 0.06, 0.08, 600 + rnd() * 800, 1400 + rnd() * 600, 0.06); },
    rain: (t) => noise(t, 1.2, 'highpass', 3000, 2000, 0.12), wind: (t) => noise(t, 1.2, 'bandpass', 500, 1400, 0.18, 0.8), thunder: (t) => { noise(t, 0.12, 'highpass', 2000, 800, 0.5); noise(t + 0.08, 2.2, 'lowpass', 300, 50, 0.5); },
    chime: (t) => bell(84, t, 0.3), grow: (t) => { [0, 2, 4].forEach((d, k) => lute(72 + d * 2, t + k * 0.07, 0.35, sfx)); }, hooves: (t) => { for (let k = 0; k < 8; k++) noise(t + k * 0.09 + rnd() * 0.02, 0.05, 'bandpass', 700, 500, 0.15, 3); },
    howl: (t) => tone(t, 1.4, 500, 700, 0.08, 'sine'), fire: (t) => { for (let k = 0; k < 12; k++) noise(t + rnd() * 0.8, 0.03, 'highpass', 3000, 2000, 0.2); noise(t, 0.9, 'bandpass', 800, 400, 0.15); },
    boom: (t) => { tone(t, 1.8, 90, 30, 0.6); noise(t, 1.8, 'lowpass', 500, 40, 0.5); }, meteor: (t) => { tone(t, 0.7, 2400, 300, 0.12, 'sine'); noise(t, 0.7, 'bandpass', 3000, 400, 0.15, 2); SFX.boom(t + 0.65); },
    wave: (t) => noise(t, 2, 'lowpass', 200, 2200, 0.4), bell: (t) => { bell(55, t, 0.35); bell(55, t + 1.4, 0.25); }, buzz: (t) => tone(t, 1.2, 180, 200, 0.08, 'sawtooth'),
    roar: (t) => STING.beast(t), deep: (t) => { tone(t, 2.2, 45, 38, 0.4); for (let k = 0; k < 4; k++) tone(t + 0.4 + k * 0.2, 0.1, 300, 600, 0.05); },
    magic: (t) => { [0, 4, 7, 11, 14, 19].forEach((d, k) => bell(79 + d, t + k * 0.05, 0.08)); }, click: (t) => tone(t, 0.04, 1200, 900, 0.05, 'triangle'), open: (t) => { lute(74, t, 0.3, sfx); lute(81, t + 0.05, 0.25, sfx); }, page: (t) => noise(t, 0.25, 'bandpass', 2500, 1200, 0.08, 0.7),
  };
  let lastSting = 0;
  return {
    unlock() { init(); if (ac && ac.state === 'suspended') ac.resume(); },
    setMood(mm: Mood) { mood = mm; },
    setView(v: Partial<typeof view>) { Object.assign(view, v); },
    sfx(name: string) { if (!ac || muted) return; const fn = SFX[name]; if (fn) fn(ac.currentTime + 0.01); },
    sting(name: string) { if (!ac || muted) return; const now = ac.currentTime; if (now - lastSting < 2.5) return; lastSting = now; const fn = STING[name]; if (fn) fn(now + 0.02); },
    volumes(v: Partial<typeof vol>) { Object.assign(vol, v); if (!ac) return; master.gain.value = muted ? 0 : vol.master; music.gain.value = vol.music; amb.gain.value = vol.world; sfx.gain.value = vol.fx; },
    mute(m: boolean) { muted = m; if (ac) master.gain.setTargetAtTime(m ? 0 : vol.master, ac.currentTime, 0.1); },
    get muted() { return muted; }, get vol() { return vol; },
  };
}
