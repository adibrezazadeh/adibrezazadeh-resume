"use client";

// Every sound in the office is synthesized here: no audio files to download.

const PREF_KEY = "adib-sound";

type Engine = {
  ctx: AudioContext;
  master: GainNode;
  room: GainNode;
  noise: AudioBuffer;
};

let engine: Engine | null = null;
let enabled = true;
const listeners = new Set<(on: boolean) => void>();

function readPref() {
  try {
    return localStorage.getItem(PREF_KEY) !== "off";
  } catch {
    return true;
  }
}

function build(): Engine | null {
  if (typeof window === "undefined" || typeof AudioContext === "undefined") return null;
  const ctx = new AudioContext();
  const master = ctx.createGain();
  master.gain.value = enabled ? 1 : 0;
  master.connect(ctx.destination);

  const length = ctx.sampleRate * 2;
  const noise = ctx.createBuffer(1, length, ctx.sampleRate);
  const white = noise.getChannelData(0);
  for (let i = 0; i < length; i += 1) white[i] = Math.random() * 2 - 1;

  // Room tone: brown noise under a low-pass, looped.
  const brown = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = brown.getChannelData(0);
  let last = 0;
  for (let i = 0; i < length; i += 1) {
    last = (last + 0.018 * (Math.random() * 2 - 1)) / 1.018;
    data[i] = last * 2.4;
  }
  const source = ctx.createBufferSource();
  source.buffer = brown;
  source.loop = true;
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 220;
  const room = ctx.createGain();
  room.gain.value = 0;
  source.connect(filter);
  filter.connect(room);
  room.connect(master);
  source.start();

  // No room tone humming from a background tab.
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) void ctx.suspend();
    else void ctx.resume();
  });

  return { ctx, master, room, noise };
}

function burst(e: Engine, { freq, q, gain, decay, delay = 0 }: { freq: number; q: number; gain: number; decay: number; delay?: number }) {
  const t = e.ctx.currentTime + delay;
  const src = e.ctx.createBufferSource();
  src.buffer = e.noise;
  const band = e.ctx.createBiquadFilter();
  band.type = "bandpass";
  band.frequency.value = freq;
  band.Q.value = q;
  const amp = e.ctx.createGain();
  amp.gain.setValueAtTime(gain, t);
  amp.gain.exponentialRampToValueAtTime(0.0001, t + decay);
  src.connect(band);
  band.connect(amp);
  amp.connect(e.master);
  src.start(t, Math.random() * 1.5, decay + 0.02);
}

function tone(e: Engine, { freq, to, type = "sine", gain, attack = 0.005, decay, delay = 0 }: {
  freq: number;
  to?: number;
  type?: OscillatorType;
  gain: number;
  attack?: number;
  decay: number;
  delay?: number;
}) {
  const t = e.ctx.currentTime + delay;
  const osc = e.ctx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (to) osc.frequency.exponentialRampToValueAtTime(to, t + decay);
  const amp = e.ctx.createGain();
  amp.gain.setValueAtTime(0.0001, t);
  amp.gain.exponentialRampToValueAtTime(gain, t + attack);
  amp.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  osc.connect(amp);
  amp.connect(e.master);
  osc.start(t);
  osc.stop(t + attack + decay + 0.05);
}

function live(): Engine | null {
  if (!engine || !enabled || engine.ctx.state !== "running") return null;
  return engine;
}

export const sound = {
  /** Must run inside a user gesture. Safe to call more than once. */
  unlock() {
    if (!engine) {
      enabled = readPref();
      engine = build();
      listeners.forEach((fn) => fn(enabled));
    }
    if (engine && engine.ctx.state === "suspended") void engine.ctx.resume();
  },
  get enabled() {
    return enabled;
  },
  setEnabled(on: boolean) {
    enabled = on;
    try {
      localStorage.setItem(PREF_KEY, on ? "on" : "off");
    } catch {
      // Private mode: the preference just won't stick.
    }
    if (engine) engine.master.gain.setTargetAtTime(on ? 1 : 0, engine.ctx.currentTime, 0.06);
    listeners.forEach((fn) => fn(on));
  },
  subscribe(fn: (on: boolean) => void) {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  },
  room(level: number) {
    if (!engine) return;
    engine.room.gain.setTargetAtTime(level * 0.03, engine.ctx.currentTime, 0.8);
  },
  key() {
    const e = live();
    if (!e) return;
    const pitch = 0.85 + Math.random() * 0.3;
    burst(e, { freq: 2600 * pitch, q: 1.4, gain: 0.07, decay: 0.035 });
    burst(e, { freq: 700 * pitch, q: 0.9, gain: 0.05, decay: 0.05, delay: 0.004 });
  },
  mouse(down: boolean) {
    const e = live();
    if (!e) return;
    burst(e, { freq: down ? 3800 : 4600, q: 3, gain: down ? 0.06 : 0.035, decay: 0.018 });
  },
  lampSwitch() {
    const e = live();
    if (!e) return;
    burst(e, { freq: 1800, q: 2, gain: 0.12, decay: 0.03 });
    tone(e, { freq: 110, gain: 0.04, decay: 0.08 });
  },
  post() {
    const e = live();
    if (!e) return;
    tone(e, { freq: 1046, type: "square", gain: 0.018, attack: 0.002, decay: 0.16 });
  },
  powerOn() {
    const e = live();
    if (!e) return;
    tone(e, { freq: 60, to: 90, gain: 0.05, attack: 0.05, decay: 0.6 });
    tone(e, { freq: 523.25, gain: 0.03, attack: 0.02, decay: 0.9, delay: 0.25 });
    tone(e, { freq: 783.99, gain: 0.025, attack: 0.02, decay: 1.1, delay: 0.38 });
    tone(e, { freq: 1046.5, gain: 0.015, attack: 0.02, decay: 1.2, delay: 0.5 });
  },
  whoosh(duration = 1.1) {
    const e = live();
    if (!e) return;
    const t = e.ctx.currentTime;
    const src = e.ctx.createBufferSource();
    src.buffer = e.noise;
    const band = e.ctx.createBiquadFilter();
    band.type = "bandpass";
    band.Q.value = 0.8;
    band.frequency.setValueAtTime(260, t);
    band.frequency.exponentialRampToValueAtTime(900, t + duration * 0.45);
    band.frequency.exponentialRampToValueAtTime(240, t + duration);
    const amp = e.ctx.createGain();
    amp.gain.setValueAtTime(0.0001, t);
    amp.gain.exponentialRampToValueAtTime(0.035, t + duration * 0.4);
    amp.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    src.connect(band);
    band.connect(amp);
    amp.connect(e.master);
    src.start(t, Math.random(), duration + 0.05);
  },
  pop() {
    const e = live();
    if (!e) return;
    tone(e, { freq: 660, to: 990, gain: 0.02, attack: 0.004, decay: 0.09 });
  },
};
