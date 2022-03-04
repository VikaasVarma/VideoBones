interface MetronomeOptions {
  bpm: number;
  offset?: number;
  beatsPerBar?: number;
  freqMain?: number;
  freqSub?: number;
  gainMain?: number;
  gainSub?: number;
  lengthMain?: number;
  lengthSub?: number;
  length: number;
}

export function generateMetronome({
  bpm,
  offset = 0,
  beatsPerBar = 4,
  freqMain = 440,
  freqSub = 220,
  gainMain = 1,
  gainSub = 0.8,
  lengthMain = 1 / 16,
  lengthSub = 1 / 16,
  length
}: MetronomeOptions) {
  const ac = new AudioContext();
  const buf = ac.createBuffer(1, ac.sampleRate * length, ac.sampleRate);
  const channel = buf.getChannelData(0);

  let amplitude = gainMain;
  let phase = 0;
  const first = offset;

  for (let i = 0; i < lengthMain * ac.sampleRate; i++) {
    channel[i + first] = amplitude * Math.sin(phase);
    phase += 2 * Math.PI * freqMain / ac.sampleRate;
    if (phase > 2 * Math.PI) {
      phase -= 2 * Math.PI;
    }
    amplitude -= gainMain / (lengthMain * ac.sampleRate);
  }

  for (let c = 1; c < beatsPerBar; c++) {
    let amplitude = gainSub;
    let phase = 0;
    const first = Math.round(ac.sampleRate * 1 / (bpm / 60) * c) + offset;

    for (let i = 0; i < lengthSub * ac.sampleRate; i++) {
      channel[i + first] = amplitude * Math.sin(phase);
      phase += 2 * Math.PI * freqSub / ac.sampleRate;
      if (phase > 2 * Math.PI) {
        phase -= 2 * Math.PI;
      }
      amplitude -= gainSub / (lengthSub * ac.sampleRate);
    }
  }

  const source = ac.createBufferSource();
  source.buffer = buf;
  source.loop = true;
  source.loopEnd = 1 / (bpm / 60) * 4;
  source.connect(ac.destination);
  source.start(0);
}
