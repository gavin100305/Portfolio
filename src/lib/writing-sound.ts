/** Soft paper friction, driven by the SVG's actual stroke animation progress. */
export function startWritingSound(signature: SVGSVGElement | null): () => void {
  if (!signature || typeof AudioContext === "undefined") return () => {};
  let context: AudioContext;
  try { context = new AudioContext(); } catch { return () => {}; }
  let stopped = false;
  let frame = 0;
  let source: AudioBufferSourceNode | undefined;
  const stop = () => {
    if (stopped) return;
    stopped = true;
    cancelAnimationFrame(frame);
    clearTimeout(timeout);
    document.removeEventListener("visibilitychange", onVisibility);
    source?.stop();
    void context.close().catch(() => {});
  };
  const onVisibility = () => { if (document.hidden) stop(); };
  document.addEventListener("visibilitychange", onVisibility);
  const timeout = setTimeout(stop, 6000);

  // Autoplay may be blocked. Never play a queued recording after the writing ends.
  void context.resume().then(() => {
    if (stopped) return;
    const buffer = context.createBuffer(1, context.sampleRate * 2, context.sampleRate);
    const samples = buffer.getChannelData(0);
    let paper = 0;
    for (let i = 0; i < samples.length; i++) {
      paper = paper * .92 + (Math.random() * 2 - 1) * .08;
      samples[i] = paper;
    }
    source = context.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    const body = context.createBiquadFilter();
    body.type = "highpass";
    body.frequency.value = 320;
    const softness = context.createBiquadFilter();
    softness.type = "lowpass";
    softness.frequency.value = 2200;
    softness.Q.value = .5;
    const gain = context.createGain();
    gain.gain.value = 0;
    source.connect(body).connect(softness).connect(gain).connect(context.destination);
    source.start();

    const previous = new Map<Animation, number>();
    let lastTime = performance.now();
    let sawStroke = false;
    let tailStarted = false;
    const followStrokes = (now: number) => {
      if (stopped) return;
      const elapsed = Math.max((now - lastTime) / 1000, .001);
      lastTime = now;
      const animations = Array.from(signature.querySelectorAll(".folio-signature-outline"))
        .flatMap(path => path.getAnimations());
      let speed = 0;
      let unfinished = false;
      for (const animation of animations) {
        sawStroke = true;
        const timing = animation.effect?.getComputedTiming();
        const progress = typeof timing?.progress === "number" ? timing.progress : 0;
        const last = previous.get(animation);
        // The eased progress includes each path's delay, pauses, and completion.
        if (last !== undefined) speed += Math.max(0, progress - last) / elapsed;
        previous.set(animation, progress);
        if (animation.playState !== "finished") unfinished = true;
      }
      // A delayed audio unlock establishes a new baseline rather than catching up.
      const pressure = Math.min(1, Math.sqrt(speed / 3));
      gain.gain.setTargetAtTime(pressure * .075, context.currentTime, .018);
      if (sawStroke && !unfinished) {
        gain.gain.setTargetAtTime(0, context.currentTime, .018);
        if (!tailStarted) { tailStarted = true; setTimeout(stop, 100); }
        return;
      }
      frame = requestAnimationFrame(followStrokes);
    };
    frame = requestAnimationFrame(followStrokes);
  }).catch(stop);
  return stop;
}
