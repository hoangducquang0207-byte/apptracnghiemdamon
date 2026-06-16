// Custom Audio Synthesizer utilizing the Web Audio API for high-end acoustic feedback.
// 100% client-side, zero assets to download, zero latency, offline-capable and highly performant.

let audioCtx: AudioContext | null = null;
let isMutedGlobal = false;

// Safe lazy initialization of AudioContext
function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioCtxClass) {
      audioCtx = new AudioCtxClass();
    }
  }
  // Auto-resume if suspended due to browser autoplay policies
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

// Persist mute settings
if (typeof window !== 'undefined') {
  const savedMute = localStorage.getItem('quickquiz_sound_muted');
  isMutedGlobal = savedMute === 'true';
}

export const sound = {
  isMuted: (): boolean => isMutedGlobal,
  
  toggleMute: (): boolean => {
    isMutedGlobal = !isMutedGlobal;
    if (typeof window !== 'undefined') {
      localStorage.setItem('quickquiz_sound_muted', String(isMutedGlobal));
    }
    return isMutedGlobal;
  },

  setMute: (muted: boolean) => {
    isMutedGlobal = muted;
    if (typeof window !== 'undefined') {
      localStorage.setItem('quickquiz_sound_muted', String(muted));
    }
  },

  // Helper to create oscillators with elegant envelopes
  playTone: (
    frequency: number,
    type: OscillatorType,
    duration: number,
    gainValues: number[],
    timeOffset = 0,
    detune = 0
  ) => {
    if (isMutedGlobal) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime + timeOffset);
    if (detune !== 0) {
      osc.detune.setValueAtTime(detune, ctx.currentTime + timeOffset);
    }

    // Highpass or lowpass to polish raw chiptunes into elegant acoustic notes
    filter.type = type === 'sine' ? 'lowpass' : 'lowpass';
    filter.frequency.setValueAtTime(type === 'sine' ? 2000 : 1200, ctx.currentTime);

    gainNode.gain.setValueAtTime(0, ctx.currentTime + timeOffset);
    
    // Apply gradual envelope points
    const step = duration / Math.max(1, gainValues.length - 1);
    gainValues.forEach((g, idx) => {
      gainNode.gain.linearRampToValueAtTime(g * 0.15, ctx.currentTime + timeOffset + idx * step);
    });

    // Connect nodes
    osc.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Play and dispose
    osc.start(ctx.currentTime + timeOffset);
    osc.stop(ctx.currentTime + timeOffset + duration);
  },

  // Tactile Mechanical Click Feedback for buttons or answers
  playClick: () => {
    // 0.05s extremely short pop/click sound for high responsiveness
    sound.playTone(850, 'sine', 0.04, [0, 0.45, 0.15, 0]);
  },

  // Quick soft focus tab transition sound
  playTab: () => {
    sound.playTone(480, 'sine', 0.08, [0, 0.25, 0.08, 0]);
  },

  // Double high-pitch clear metallic bell for Success Toasts
  playToastSuccess: () => {
    const ctx = getAudioContext();
    if (!ctx) return;
    // E6 followed by G#6
    sound.playTone(1318.51, 'sine', 0.16, [0, 0.5, 0.1, 0], 0);
    sound.playTone(1661.22, 'sine', 0.24, [0, 0.6, 0.2, 0.02, 0], 0.08);
  },

  // Low frequency alert chime for Error Toasts
  playToastError: () => {
    // Elegant warning chord (A#2 and G2)
    sound.playTone(220.00, 'triangle', 0.25, [0, 0.45, 0.15, 0], 0);
    sound.playTone(196.00, 'triangle', 0.35, [0, 0.4, 0.1, 0], 0.06);
  },

  // Neutral information notifications
  playToastInfo: () => {
    sound.playTone(880, 'sine', 0.15, [0, 0.35, 0.1, 0], 0);
    sound.playTone(1174.66, 'sine', 0.2, [0, 0.35, 0.1, 0], 0.08);
  },

  // Quiz started - elegant upward sweep
  playQuizStart: () => {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    
    // Sweep effect
    sound.playTone(440, 'sine', 0.4, [0, 0.4, 0.2, 0], 0);
    sound.playTone(659.25, 'sine', 0.4, [0, 0.5, 0.25, 0], 0.1);
    sound.playTone(880, 'sine', 0.5, [0, 0.6, 0.3, 0.05, 0], 0.2);
  },

  // Ascending cheerful major triad chime for great achievements (Score >= 8)
  playCelebration: () => {
    // Beautiful chord sequence C5 (523Hz) -> E5 (659Hz) -> G5 (784Hz) -> C6 (1046Hz)
    const notes = [523.25, 659.25, 784.99, 1046.5];
    notes.forEach((freq, idx) => {
      sound.playTone(freq, 'sine', 0.45, [0, 0.4, 0.2, 0.05, 0], idx * 0.08);
    });
    // Add a warm sub-pad to make it full and premium
    sound.playTone(261.63, 'sine', 0.6, [0, 0.3, 0.15, 0], 0);
  },

  // Soft supportive minor chime for moderate study completion
  playNormalComplete: () => {
    // Warm, positive arpeggio: F5 (698.46Hz) -> A5 (880Hz) -> C6 (1046.5Hz)
    const notes = [698.46, 880.00, 1046.50];
    notes.forEach((freq, idx) => {
      sound.playTone(freq, 'sine', 0.4, [0, 0.35, 0.15, 0], idx * 0.1);
    });
  },

  // Soft clock tick for time constraint warnings
  playTimerTick: () => {
    sound.playTone(2000, 'sine', 0.02, [0, 0.3, 0], 0);
  }
};
