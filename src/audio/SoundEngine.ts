/**
 * Fully synthesised audio — every sound is generated with the Web Audio API at
 * runtime. No sample packs, no licensed audio, nothing to download.
 */

type Waveform = OscillatorType;

interface ToneOptions {
  freq: number;
  endFreq?: number;
  type?: Waveform;
  duration?: number;
  gain?: number;
  attack?: number;
  delay?: number;
  detune?: number;
  filter?: { type: BiquadFilterType; freq: number; q?: number };
  pan?: number;
}

interface NoiseOptions {
  duration?: number;
  gain?: number;
  delay?: number;
  filter?: { type: BiquadFilterType; freq: number; endFreq?: number; q?: number };
}

export class SoundEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private ambientTimer: number | null = null;
  private muted = false;
  private volume = 0.75;

  /** Must be called from a user gesture (browser autoplay policy). */
  unlock(): void {
    this.ensureContext();
    if (this.ctx?.state === 'suspended') void this.ctx.resume();
  }

  private ensureContext(): AudioContext | null {
    if (this.ctx) return this.ctx;
    if (typeof window === 'undefined') return null;
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    try {
      const ctx = new Ctor();
      const master = ctx.createGain();
      master.gain.value = this.muted ? 0 : this.volume;
      master.connect(ctx.destination);
      const music = ctx.createGain();
      music.gain.value = 0.32;
      music.connect(master);
      this.ctx = ctx;
      this.master = master;
      this.musicGain = music;
      return ctx;
    } catch {
      return null;
    }
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (!this.master || !this.ctx) return;
    const now = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setTargetAtTime(muted ? 0 : this.volume, now, 0.05);
  }

  isMuted(): boolean {
    return this.muted;
  }

  private now(): number {
    return this.ctx?.currentTime ?? 0;
  }

  private tone(options: ToneOptions): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.master || this.muted) return;
    const {
      freq,
      endFreq,
      type = 'sine',
      duration = 0.25,
      gain = 0.2,
      attack = 0.008,
      delay = 0,
      detune = 0,
      filter,
      pan = 0,
    } = options;

    const start = this.now() + delay;
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.detune.value = detune;
    osc.frequency.setValueAtTime(freq, start);
    if (endFreq !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), start + duration);
    }

    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, start);
    env.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), start + attack);
    env.gain.exponentialRampToValueAtTime(0.0001, start + duration);

    let node: AudioNode = osc;
    if (filter) {
      const biquad = ctx.createBiquadFilter();
      biquad.type = filter.type;
      biquad.frequency.setValueAtTime(filter.freq, start);
      biquad.Q.value = filter.q ?? 1;
      node.connect(biquad);
      node = biquad;
    }
    node.connect(env);

    if (pan !== 0 && typeof ctx.createStereoPanner === 'function') {
      const panner = ctx.createStereoPanner();
      panner.pan.value = Math.max(-1, Math.min(1, pan));
      env.connect(panner);
      panner.connect(this.master);
    } else {
      env.connect(this.master);
    }

    osc.start(start);
    osc.stop(start + duration + 0.05);
  }

  private getNoiseBuffer(ctx: AudioContext): AudioBuffer {
    if (this.noiseBuffer) return this.noiseBuffer;
    const length = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1;
    this.noiseBuffer = buffer;
    return buffer;
  }

  private noise(options: NoiseOptions = {}): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.master || this.muted) return;
    const { duration = 0.4, gain = 0.12, delay = 0, filter } = options;
    const start = this.now() + delay;

    const src = ctx.createBufferSource();
    src.buffer = this.getNoiseBuffer(ctx);
    src.loop = true;

    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, start);
    env.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), start + 0.02);
    env.gain.exponentialRampToValueAtTime(0.0001, start + duration);

    let node: AudioNode = src;
    if (filter) {
      const biquad = ctx.createBiquadFilter();
      biquad.type = filter.type;
      biquad.frequency.setValueAtTime(filter.freq, start);
      if (filter.endFreq !== undefined) {
        biquad.frequency.exponentialRampToValueAtTime(Math.max(40, filter.endFreq), start + duration);
      }
      biquad.Q.value = filter.q ?? 0.8;
      node.connect(biquad);
      node = biquad;
    }
    node.connect(env);
    env.connect(this.master);

    src.start(start);
    src.stop(start + duration + 0.05);
  }

  /* ------------------------------------------------------------------ */
  /*  Game cues                                                          */
  /* ------------------------------------------------------------------ */

  hover(): void {
    this.tone({ freq: 880, endFreq: 1180, type: 'triangle', duration: 0.09, gain: 0.05 });
  }

  click(): void {
    this.tone({ freq: 520, endFreq: 220, type: 'square', duration: 0.11, gain: 0.09 });
    this.noise({ duration: 0.09, gain: 0.05, filter: { type: 'highpass', freq: 1400 } });
  }

  spinStart(): void {
    this.tone({ freq: 180, endFreq: 720, type: 'sawtooth', duration: 0.42, gain: 0.11, filter: { type: 'lowpass', freq: 2200, q: 4 } });
    this.tone({ freq: 90, endFreq: 240, type: 'sine', duration: 0.5, gain: 0.16 });
    this.noise({ duration: 0.5, gain: 0.08, filter: { type: 'bandpass', freq: 500, endFreq: 3200, q: 1.4 } });
  }

  reelStop(index: number): void {
    const pan = (index - 2) * 0.35;
    this.tone({ freq: 150 + index * 26, endFreq: 70, type: 'triangle', duration: 0.16, gain: 0.17, pan });
    this.noise({ duration: 0.11, gain: 0.07, filter: { type: 'lowpass', freq: 1400 } });
  }

  anticipation(): void {
    this.tone({ freq: 240, endFreq: 620, type: 'sawtooth', duration: 1.1, gain: 0.09, filter: { type: 'bandpass', freq: 900, q: 6 } });
  }

  tick(step: number): void {
    this.tone({ freq: 620 + (step % 12) * 42, type: 'square', duration: 0.05, gain: 0.035 });
  }

  smallWin(): void {
    const notes = [523.25, 659.25, 783.99];
    notes.forEach((freq, i) => this.tone({ freq, type: 'triangle', duration: 0.3, gain: 0.12, delay: i * 0.07 }));
  }

  niceWin(): void {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, i) => this.tone({ freq, type: 'triangle', duration: 0.36, gain: 0.13, delay: i * 0.08 }));
    this.tone({ freq: 130, type: 'sine', duration: 0.6, gain: 0.12 });
  }

  bigWin(intensity: 1 | 2 | 3 = 1): void {
    const root = [261.63, 329.63, 392, 523.25, 659.25, 783.99, 1046.5];
    const rounds = intensity + 1;
    for (let r = 0; r < rounds; r += 1) {
      root.forEach((freq, i) => {
        this.tone({
          freq: freq * (1 + r * 0.5),
          type: r === 0 ? 'sawtooth' : 'triangle',
          duration: 0.5,
          gain: 0.09,
          delay: r * 0.42 + i * 0.05,
          filter: { type: 'lowpass', freq: 5200, q: 1 },
        });
      });
    }
    this.tone({ freq: 65, endFreq: 130, type: 'sine', duration: 1.4, gain: 0.22 });
    this.noise({ duration: 1.6, gain: 0.07, filter: { type: 'highpass', freq: 2400 } });
  }

  /** Rune Orbs thudding onto the board — pitch rises with the count. */
  orbDrop(count: number): void {
    for (let i = 0; i < count; i += 1) {
      this.tone({
        freq: 320 + i * 90,
        endFreq: 880 + i * 120,
        type: 'sine',
        duration: 0.34,
        gain: 0.15,
        delay: i * 0.14,
      });
      this.noise({
        duration: 0.16,
        gain: 0.06,
        delay: i * 0.14,
        filter: { type: 'bandpass', freq: 1800, endFreq: 400, q: 1.4 },
      });
    }
  }

  /** The orbs fuse into one multiplier: a rising sweep into a gold impact. */
  orbCollect(total: number): void {
    const intensity = Math.min(1, Math.log10(Math.max(2, total)) / 2.4);
    this.tone({ freq: 220, endFreq: 1760, type: 'sawtooth', duration: 0.75, gain: 0.1, filter: { type: 'lowpass', freq: 3400, q: 3 } });
    this.noise({ duration: 0.8, gain: 0.08, filter: { type: 'bandpass', freq: 600, endFreq: 5200, q: 1.1 } });
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) =>
      this.tone({ freq, type: 'triangle', duration: 0.7, gain: 0.1 + intensity * 0.06, delay: 0.72 + i * 0.05 }),
    );
    this.tone({ freq: 58, endFreq: 40, type: 'sine', duration: 1.1, gain: 0.24, delay: 0.7 });
  }

  /** Symbols shattering before the board refills. */
  tumble(): void {
    this.noise({ duration: 0.32, gain: 0.11, filter: { type: 'bandpass', freq: 2600, endFreq: 700, q: 0.9 } });
    this.tone({ freq: 420, endFreq: 140, type: 'triangle', duration: 0.24, gain: 0.11 });
  }

  /** Each link of a tumble chain lands a semitone higher than the last. */
  tumbleHit(step: number): void {
    const base = 523.25 * Math.pow(2, Math.min(step, 8) / 12);
    this.tone({ freq: base, type: 'triangle', duration: 0.28, gain: 0.13 });
    this.tone({ freq: base * 1.5, type: 'sine', duration: 0.32, gain: 0.08, delay: 0.05 });
  }

  /** The headline escalating from BIG to MEGA to EPIC mid count-up. */
  tierUp(): void {
    this.tone({ freq: 300, endFreq: 1400, type: 'sawtooth', duration: 0.45, gain: 0.11, filter: { type: 'lowpass', freq: 4200, q: 2 } });
    this.noise({ duration: 0.5, gain: 0.09, filter: { type: 'bandpass', freq: 700, endFreq: 6000, q: 1 } });
    [659.25, 987.77, 1318.5].forEach((freq, i) =>
      this.tone({ freq, type: 'triangle', duration: 0.5, gain: 0.12, delay: 0.4 + i * 0.04 }),
    );
    this.tone({ freq: 70, endFreq: 45, type: 'sine', duration: 0.7, gain: 0.2, delay: 0.38 });
  }

  scatterHit(index: number): void {
    this.tone({ freq: 620 + index * 180, endFreq: 1400 + index * 220, type: 'sine', duration: 0.5, gain: 0.16 });
    this.tone({ freq: 310 + index * 90, type: 'triangle', duration: 0.6, gain: 0.09, delay: 0.02 });
  }

  bonusIntro(): void {
    this.tone({ freq: 110, endFreq: 55, type: 'sine', duration: 2.2, gain: 0.24 });
    this.noise({ duration: 2.4, gain: 0.12, filter: { type: 'lowpass', freq: 220, endFreq: 4200, q: 2 } });
    [392, 523.25, 659.25, 783.99, 1046.5].forEach((freq, i) =>
      this.tone({ freq, type: 'triangle', duration: 1.2, gain: 0.1, delay: 0.55 + i * 0.13 }),
    );
  }

  gateOpen(): void {
    this.tone({ freq: 1400, endFreq: 180, type: 'sine', duration: 1.1, gain: 0.16 });
    this.noise({ duration: 1.3, gain: 0.14, filter: { type: 'bandpass', freq: 3200, endFreq: 320, q: 1.2 } });
  }

  heartbeat(): void {
    this.tone({ freq: 62, endFreq: 40, type: 'sine', duration: 0.22, gain: 0.3 });
    this.tone({ freq: 58, endFreq: 36, type: 'sine', duration: 0.26, gain: 0.22, delay: 0.24 });
  }

  relicReveal(): void {
    this.noise({ duration: 0.35, gain: 0.1, filter: { type: 'highpass', freq: 1800 } });
    this.tone({ freq: 740, endFreq: 1480, type: 'triangle', duration: 0.45, gain: 0.14 });
  }

  guardianChosen(): void {
    [261.63, 392, 523.25, 784].forEach((freq, i) =>
      this.tone({ freq, type: 'sine', duration: 0.9, gain: 0.12, delay: i * 0.09 }),
    );
    this.noise({ duration: 1, gain: 0.08, filter: { type: 'highpass', freq: 1600 } });
  }

  error(): void {
    this.tone({ freq: 160, endFreq: 110, type: 'square', duration: 0.16, gain: 0.09 });
  }

  /* ------------------------------------------------------------------ */
  /*  Ambient bed                                                        */
  /* ------------------------------------------------------------------ */

  startAmbient(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.musicGain || this.ambientTimer !== null) return;
    const chords = [
      [130.81, 196, 246.94],
      [146.83, 220, 277.18],
      [110, 164.81, 246.94],
      [123.47, 185, 233.08],
    ];
    let index = 0;

    const playChord = () => {
      if (!this.ctx || !this.musicGain || this.muted) return;
      const chord = chords[index % chords.length] as number[];
      index += 1;
      const start = this.ctx.currentTime;
      chord.forEach((freq, i) => {
        const osc = this.ctx!.createOscillator();
        osc.type = i === 0 ? 'sine' : 'triangle';
        osc.frequency.value = freq;
        const env = this.ctx!.createGain();
        env.gain.setValueAtTime(0.0001, start);
        env.gain.exponentialRampToValueAtTime(0.05, start + 1.6);
        env.gain.exponentialRampToValueAtTime(0.0001, start + 5.4);
        const lp = this.ctx!.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 900;
        osc.connect(lp);
        lp.connect(env);
        env.connect(this.musicGain!);
        osc.start(start);
        osc.stop(start + 5.6);
      });
    };

    playChord();
    this.ambientTimer = window.setInterval(playChord, 5200);
  }

  stopAmbient(): void {
    if (this.ambientTimer !== null) {
      window.clearInterval(this.ambientTimer);
      this.ambientTimer = null;
    }
  }

  dispose(): void {
    this.stopAmbient();
    void this.ctx?.close();
    this.ctx = null;
    this.master = null;
    this.musicGain = null;
  }
}

export const soundEngine = new SoundEngine();
