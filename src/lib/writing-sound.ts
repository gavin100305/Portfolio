/** Fetch before the intro starts; missing audio leaves the intro silent. */
export async function loadWritingRecording(): Promise<ArrayBuffer | null> {
  try {
    const response = await fetch("/audio/intro-inkpen.m4a");
    return response.ok ? await response.arrayBuffer() : null;
  } catch { return null; }
}

/** Real inkpen recording, gated by the SVG's actual stroke animation progress. */
export function startWritingSound(signature: SVGSVGElement | null, recording: ArrayBuffer | null): () => void {
  if (!signature || !recording || typeof AudioContext === "undefined") return () => {};
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
  void Promise.all([context.resume(), context.decodeAudioData(recording.slice(0))]).then(([, buffer]) => {
    if (stopped) return;
    const body = context.createBiquadFilter();
    body.type = "highpass";
    body.frequency.value = 120;
    const softness = context.createBiquadFilter();
    softness.type = "lowpass";
    softness.frequency.value = 6000;
    softness.Q.value = .5;
    const gain = context.createGain();
    gain.gain.value = 0;
    body.connect(softness).connect(gain).connect(context.destination);
    let sourceStartedAt = 0;
    let sourceOffset = 0;
    const silence = () => {
      source?.stop(context.currentTime + .012);
      source = undefined;
    };
    const alignRecording = (offset: number) => {
      const position = sourceOffset + context.currentTime - sourceStartedAt;
      if (source && Math.abs(position - offset) < .04) return;
      silence();
      source = context.createBufferSource();
      source.buffer = buffer;
      source.connect(body);
      sourceOffset = Math.min(offset, buffer.duration - .01);
      sourceStartedAt = context.currentTime;
      source.start(0, Math.max(0, sourceOffset));
    };

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
      let firstStrokeDelay = Infinity;
      let animationTime = 0;
      for (const animation of animations) {
        sawStroke = true;
        const timing = animation.effect?.getComputedTiming();
        const delay = Number(animation.effect?.getTiming().delay ?? 0);
        firstStrokeDelay = Math.min(firstStrokeDelay, delay);
        if (typeof animation.currentTime === "number") animationTime = animation.currentTime;
        const progress = typeof timing?.progress === "number" ? timing.progress : 0;
        const last = previous.get(animation);
        // The eased progress includes each path's delay, pauses, and completion.
        if (last !== undefined) speed += Math.max(0, progress - last) / elapsed;
        previous.set(animation, progress);
        if (animation.playState !== "finished") unfinished = true;
      }
      // Read the same clock as the SVG, including its initial delay. Restart at
      // the matching recording offset after pauses or a delayed audio unlock.
      // Recording time never advances through the invisible pre-writing hold.
      if (speed > .001 && unfinished) {
        alignRecording(Math.max(0, (animationTime - firstStrokeDelay) / 1000));
      } else {
        gain.gain.setTargetAtTime(0, context.currentTime, .006);
        silence();
      }
      // A delayed audio unlock establishes a new baseline rather than catching up.
      const pressure = Math.min(1, Math.sqrt(speed / 3));
      gain.gain.setTargetAtTime(pressure * .18, context.currentTime, .018);
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
