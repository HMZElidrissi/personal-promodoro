let tickCtx: AudioContext | null = null;

/**
 * Plays a gentle completion chime using the Web Audio API.
 * No external audio file required.
 */
export function playCompletionSound(): void {
  if (typeof window === 'undefined') return;
  try {
    const ctx = new AudioContext();

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    const startTime = ctx.currentTime;

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'sine';
      osc.frequency.value = freq;

      const noteStart = startTime + i * 0.18;
      const noteEnd = noteStart + 0.4;

      gain.gain.setValueAtTime(0, noteStart);
      gain.gain.linearRampToValueAtTime(0.25, noteStart + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, noteEnd);

      osc.start(noteStart);
      osc.stop(noteEnd);
    });
  } catch {
    // AudioContext not supported or autoplay blocked — fail silently
  }
}

/**
 * Plays a short tick sound for each second (optional, disable if noisy).
 */
export function playTickSound(): void {
  if (typeof window === 'undefined') return;
  try {
    if (!tickCtx) {
      tickCtx = new AudioContext();
    }
    const ctx = tickCtx;
    const duration = 0.04;
    const sampleRate = ctx.sampleRate;
    const buffer = ctx.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);

    // White noise burst
    for (let i = 0; i < data.length; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    // High-pass to make it a subtle "tick" instead of a thump
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 2000;

    const gain = ctx.createGain();
    const now = ctx.currentTime;

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.12, now + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noise.start(now);
    noise.stop(now + duration);
  } catch {
    // fail silently
  }
}
