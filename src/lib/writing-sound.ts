/** Quiet, locally synthesized paper friction; no downloaded audio or tracking. */
export function startWritingSound(duration = 4200): () => void {
  if (typeof AudioContext === "undefined") return () => {};
  let context: AudioContext;
  try { context = new AudioContext(); } catch { return () => {}; }
  const started = performance.now();
  let stopped = false;
  let source: AudioBufferSourceNode | undefined;
  const stop = () => {
    if (stopped) return;
    stopped = true;
    clearTimeout(timeout);
    source?.stop();
    void context.close().catch(() => {});
  };
  const timeout = setTimeout(stop, duration);
  // Respect autoplay restrictions: a blocked context stays silent and is cleaned up.
  void context.resume().then(() => {
    const remaining = (duration - (performance.now() - started)) / 1000;
    if (stopped || remaining <= .05) return;
    const buffer = context.createBuffer(1, Math.ceil(context.sampleRate * remaining), context.sampleRate);
    const samples = buffer.getChannelData(0);
    let softened = 0;
    const offset = (performance.now() - started) / 1000;
    for (let i = 0; i < samples.length; i++) {
      const t = i / context.sampleRate;
      const position = t + offset;
      softened = softened * .6 + (Math.random() * 2 - 1) * .4;
      // Short uneven strokes, separated by small pen lifts.
      const stroke = Math.max(0, Math.sin(position * 22 + Math.sin(position * 7) * 1.4));
      const fade = Math.min(1, t / .12, (remaining - t) / .35);
      samples[i] = softened * (.12 + stroke * .88) * fade;
    }
    source = context.createBufferSource();
    source.buffer = buffer;
    const filter = context.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 2100;
    filter.Q.value = .65;
    const gain = context.createGain();
    gain.gain.value = .11;
    source.connect(filter).connect(gain).connect(context.destination);
    source.start();
  }).catch(() => { stop(); });
  return stop;
}
