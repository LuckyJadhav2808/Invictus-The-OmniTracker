"use client";

// Web Audio API tactile sound synthesizer & haptic helper (Zero external asset dependencies)
class SoundManager {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;

  constructor() {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("invictus_sound_muted");
        this.muted = stored === "true";
      } catch {
        this.muted = false;
      }
    }
  }

  private getContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const AudioContextClass =
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public setMuted(muted: boolean) {
    this.muted = muted;
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("invictus_sound_muted", String(muted));
      } catch {}
    }
  }

  public toggleMute(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }

  // Crisp tactile check pop (frequency sweep down 850Hz -> 320Hz in 35ms)
  public playPop() {
    if (this.muted) return;
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(850, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(320, ctx.currentTime + 0.035);
      gain.gain.setValueAtTime(0.14, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.035);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    } catch {}
  }

  // Crisp tactile button click
  public playClick() {
    this.playPop();
  }

  // Subtle metallic or glass tap for numeric keypads (1200Hz soft pulse)
  public playKeypadBeep() {
    if (this.muted) return;
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(1200, ctx.currentTime);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.02);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.025);
    } catch {}
  }

  // Uplifting 2-tone harmony chord (C5 + G5) for achievements or streak completion
  public playCompleteChime() {
    if (this.muted) return;
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      [523.25, 783.99].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.06);
        gain.gain.setValueAtTime(0.12, ctx.currentTime + i * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.06 + 0.22);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.06);
        osc.stop(ctx.currentTime + i * 0.06 + 0.23);
      });
    } catch {}
  }

  // Water bubble splash sound
  public playSplash() {
    if (this.muted) return;
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(420, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1100, ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.07);
    } catch {}
  }

  // Alert tone for rest timer expiration (880Hz crisp alert pulses)
  public playRestDoneBeep() {
    if (this.muted) return;
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      [0, 0.12, 0.24].forEach((delay) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "square";
        osc.frequency.setValueAtTime(880, ctx.currentTime + delay);
        gain.gain.setValueAtTime(0.08, ctx.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.06);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + 0.07);
      });
    } catch {}
  }

  // Satisfying cash register / coin bell for transaction saves (C6 -> E6 metallic ding)
  public playCashRegister() {
    if (this.muted) return;
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      [1046.5, 1318.5].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        const startTime = ctx.currentTime + idx * 0.07;
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(0.12, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.28);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + 0.3);
      });
    } catch {}
  }

  // Playful car horn beep-beep (dual-tone 440Hz + 554Hz)
  public playCarHorn() {
    if (this.muted) return;
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      [0, 0.12].forEach((offset) => {
        [440, 554.37].forEach((freq) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sawtooth";
          const startTime = ctx.currentTime + offset;
          osc.frequency.setValueAtTime(freq, startTime);
          gain.gain.setValueAtTime(0.06, startTime);
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.09);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(startTime);
          osc.stop(startTime + 0.1);
        });
      });
    } catch {}
  }

  // Adorable 8-bit retro robot chirp/synthesizer for Vix companion
  public playBotChirp(variant: "happy" | "salute" | "curious" = "happy") {
    if (this.muted) return;
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      let notes: { f: number; t: number; d: number }[] = [];
      if (variant === "salute") {
        notes = [
          { f: 587.33, t: 0, d: 0.05 },
          { f: 880, t: 0.06, d: 0.09 },
        ];
      } else if (variant === "curious") {
        notes = [
          { f: 440, t: 0, d: 0.04 },
          { f: 659.25, t: 0.05, d: 0.08 },
        ];
      } else {
        // Happy tri-tone chirp
        notes = [
          { f: 523.25, t: 0, d: 0.04 },
          { f: 783.99, t: 0.045, d: 0.04 },
          { f: 1046.5, t: 0.09, d: 0.08 },
        ];
      }

      notes.forEach(({ f, t, d }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        const startTime = now + t;
        osc.frequency.setValueAtTime(f, startTime);
        gain.gain.setValueAtTime(0.08, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + d);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + d + 0.01);
      });
      this.vibrate(12);
    } catch {}
  }

  // Haptic feedback helper
  public vibrate(pattern: number | number[] = 15) {
    if (typeof window !== "undefined" && "navigator" in window && navigator.vibrate) {
      try {
        navigator.vibrate(pattern);
      } catch {}
    }
  }
}

export const soundFX = new SoundManager();
