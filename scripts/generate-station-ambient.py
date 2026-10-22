"""Render Quiet Orbit, an original 96-second seamless station composition.
Requires NumPy and macOS afconvert; no recordings or third-party music samples.
"""
from pathlib import Path
import tempfile
import subprocess
import wave
import numpy as np

rate, duration = 32000, 96
length = rate * duration
mix = np.zeros((length, 2), dtype=np.float64)
rng = np.random.default_rng(4217)

def add(signal, start, pan=0):
    indices = (np.arange(len(signal)) + round(start * rate)) % length
    for channel, gain in enumerate([np.sqrt((1-pan)/2), np.sqrt((1+pan)/2)]):
        np.add.at(mix[:, channel], indices, signal * gain)

def hz(note): return 440 * 2 ** ((note-69)/12)

# Open major ninths and suspended voicings, with twelve seconds to breathe.
chords = [[50,57,61,64,66],[47,54,57,61,66],[43,54,57,62,66],[45,52,57,59,64],
          [50,57,61,64,69],[47,54,57,61,64],[43,50,54,57,62],[45,52,57,59,64]]
for bar, chord in enumerate(chords):
    t = np.arange(rate*18)/rate
    envelope = np.sin(np.minimum(t/4, 1)*np.pi/2)**2 * np.sin(np.minimum((18-t)/6, 1)*np.pi/2)**2
    for voice,note in enumerate(chord):
        f=hz(note); phase=rng.uniform(0, 2*np.pi)
        tone=sum(np.sin(2*np.pi*f*2**(cents/1200)*t+phase+j*.7) for j,cents in enumerate([-3,0,3]))/3
        tone += .10*np.sin(2*np.pi*f*2*t+phase)
        breath=.88+.12*np.sin(2*np.pi*t/(13+voice)+bar)
        add(tone*envelope*breath*.055,bar*12,pan=(voice-2)*.28)
    # Low, quiet foundation, kept above sub-bass rumble.
    add(np.sin(2*np.pi*hz(chord[0]-12)*t)*envelope*.024,bar*12)

# A sparse pentatonic motif, softly struck rather than a ticking arpeggio.
melody=[(2,78),(8,73),(17,76),(26,78),(33,81),(44,76),(50,78),(58,73),(68,74),(77,76),(86,73),(92,69)]
for index,(start,note) in enumerate(melody):
    t=np.arange(rate*9)/rate; f=hz(note)
    attack=1-np.exp(-t/.065)
    bell=(np.sin(2*np.pi*f*t)*np.exp(-t/2.3)+.16*np.sin(2*np.pi*f*2.003*t)*np.exp(-t/.9)+.045*np.sin(2*np.pi*f*3.01*t)*np.exp(-t/.45))*attack
    add(bell*.055,start,pan=np.sin(index*1.7)*.45)

# Diffuse stereo reflections wrap around the loop, preserving the tail at its seam.
dry=mix.copy()
for i,delay in enumerate([.173,.293,.431,.617,.887,1.231,1.771,2.417,3.193]):
    shifted=np.roll(dry,round(delay*rate),axis=0)
    if i%2: shifted=shifted[:,::-1]
    mix+=shifted*(.18*np.exp(-delay/1.7))
# Gentle mastering; no limiting or sudden gain changes at the loop boundary.
mix=np.tanh(mix*1.1)
mix*=.68/max(np.max(np.abs(mix)),.001)
output=Path(__file__).resolve().parents[1]/'public/audio/quiet-orbit.m4a'
with tempfile.TemporaryDirectory() as folder:
    wav=Path(folder)/'quiet-orbit.wav'
    with wave.open(str(wav),'wb') as file:
        file.setnchannels(2);file.setsampwidth(2);file.setframerate(rate)
        file.writeframes((mix*32767).astype('<i2').tobytes())
    subprocess.run(['afconvert','-f','m4af','-d','aac','-b','128000',str(wav),str(output)],check=True)
print(f'{output.name}: {duration}s, {output.stat().st_size:,} bytes')
