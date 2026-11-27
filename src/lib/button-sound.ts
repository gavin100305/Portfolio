type SoundPhase = "down" | "up";

const strokes: Record<SoundPhase, readonly (readonly [number, number])[]> = {
  down: [[0, .109], [.368, .098], [.717, .103], [1.029, .098]],
  up: [[.109, .089], [.466, .080], [.820, .084], [1.127, .081]],
};

let audio: AudioContext | null = null;
let sample: Promise<AudioBuffer> | null = null;

function loadSample() {
  if (typeof window === "undefined" || typeof AudioContext === "undefined") return null;
  if (!audio || audio.state === "closed") audio = new AudioContext();
  if (!sample) {
    const context = audio;
    sample = fetch("/sounds/key-press.wav")
      .then(response => {
        if (!response.ok) throw new Error("Keyboard sample unavailable");
        return response.arrayBuffer();
      })
      .then(data => context.decodeAudioData(data))
      .catch(error => {
        sample = null;
        throw error;
      });
  }
  return { context: audio, buffer: sample };
}

export function preloadButtonSound() {
  const loaded = loadSample();
  if (loaded) void loaded.buffer.catch(() => {});
}

export function playButtonSound(phase: SoundPhase, index = 0) {
  const loaded = loadSample();
  if (!loaded) return;

  const [offset, duration] = strokes[phase][index % strokes[phase].length];
  const resumed = loaded.context.resume();
  void Promise.all([resumed, loaded.buffer]).then(([, buffer]) => {
    if (loaded.context.state === "closed") return;
    const source = loaded.context.createBufferSource();
    source.buffer = buffer;
    source.connect(loaded.context.destination);
    source.start(0, offset, duration);
    source.onended = () => source.disconnect();
  }).catch(() => {
    // Button interactions still work when browser audio is unavailable.
  });
}

export function unlockDialSound() {
  const loaded = loadSample();
  if (loaded?.context.state === "suspended") void loaded.context.resume().catch(() => {});
}

export function playDialTick(index: number) {
  const loaded = loadSample();
  if (!loaded) return;
  void Promise.all([loaded.context.resume(), loaded.buffer]).then(([, buffer]) => {
    const ctx = loaded.context;
    const source = ctx.createBufferSource();
    const gain = ctx.createGain();
    source.buffer = buffer;
    source.playbackRate.value = 1.7;
    gain.gain.setValueAtTime(.55, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + .035);
    source.connect(gain).connect(ctx.destination);
    source.start(0, strokes.down[index % strokes.down.length][0], .06);
    source.onended = () => { source.disconnect(); gain.disconnect(); };
  }).catch(() => {});
}
