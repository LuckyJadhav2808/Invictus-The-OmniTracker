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

  // Zero-lag Web Audio API hardware pre-buffering & context unfreezing
  public prewarm() {
    if (typeof window === "undefined") return;
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      if (ctx.state === "suspended") {
        ctx.resume().catch(() => {});
      }
      // Play a near-silent 1ms oscillator buffer to pre-allocate audio hardware pipelines
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.002);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.003);
    } catch {}
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

  // Hevy-style tactile dual-pulse rest timer alarm (880Hz A5 -> 1174Hz D6 alert)
  public playRestDoneDoubleBeep() {
    if (this.muted) return;
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      // First Beep: 880Hz (A5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(880, now);
      gain1.gain.setValueAtTime(0.18, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.1);

      // Second Beep: 1174.66Hz (D6) with higher resonance for distinct clarity
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "triangle";
      osc2.frequency.setValueAtTime(1174.66, now + 0.13);
      gain2.gain.setValueAtTime(0.22, now + 0.13);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.13);
      osc2.stop(now + 0.3);

      this.vibrate([60, 60, 100]);
    } catch {}
  }

  // Alert tone for rest timer expiration (delegates to crisp double-beep)
  public playRestDoneBeep() {
    this.playRestDoneDoubleBeep();
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

// Automatically pre-warm audio hardware on the first user interaction for zero-lag sound execution
if (typeof window !== "undefined") {
  const warmUp = () => {
    soundFX.prewarm();
    window.removeEventListener("pointerdown", warmUp);
    window.removeEventListener("touchstart", warmUp);
    window.removeEventListener("keydown", warmUp);
  };
  window.addEventListener("pointerdown", warmUp, { passive: true, once: true });
  window.addEventListener("touchstart", warmUp, { passive: true, once: true });
  window.addEventListener("keydown", warmUp, { passive: true, once: true });
}

