"""Generate the calm music bed for the Attendance ad.

Pure additive synthesis: a slow four-chord pad (D major family) with a soft sub,
gentle detuning, a simple feedback delay for space, and long fades.

    python3 tools/make_music.py            # writes /tmp/music-bed.wav
    ffmpeg -i /tmp/music-bed.wav -codec:a libmp3lame -b:a 192k public/audio/music-bed.mp3
"""

from __future__ import annotations

import math
import struct
import wave

import numpy as np

SR = 44100
DURATION = 73.0
FADE_IN = 2.5
FADE_OUT = 4.0

# D major, voiced low and open: Dmaj9, Bmin7, Gmaj9, Asus4
CHORDS = [
    [146.83, 220.00, 293.66, 369.99, 440.00],  # D  A  D  F# A
    [123.47, 185.00, 246.94, 293.66, 369.99],  # B  F# B  D  F#
    [98.00, 146.83, 196.00, 246.94, 293.66],  # G  D  G  B  D
    [110.00, 164.81, 220.00, 293.66, 440.00],  # A  E  A  D  A
]

CHORD_LEN = 9.0
CROSSFADE = 3.2


def adsr(n: int, sr: int, attack: float, release: float) -> np.ndarray:
    env = np.ones(n)
    a = min(int(attack * sr), n // 3)
    r = min(int(release * sr), n // 3)
    if a > 0:
        env[:a] = np.linspace(0.0, 1.0, a) ** 1.6
    if r > 0:
        env[-r:] = np.linspace(1.0, 0.0, r) ** 1.4
    return env


def voice(freq: float, n: int, detune: float = 0.0) -> np.ndarray:
    t = np.arange(n) / SR
    base = 2 * math.pi * freq * (1 + detune) * t
    # soft, hollow tone: fundamental plus a quiet fifth and a whisper of the octave
    sig = (
        0.72 * np.sin(base)
        + 0.16 * np.sin(base * 1.5)
        + 0.09 * np.sin(base * 2.0)
        + 0.05 * np.sin(base * 3.0)
    )
    # slow tremolo so the pad breathes
    sig *= 1.0 + 0.06 * np.sin(2 * math.pi * 0.07 * t + freq)
    return sig


def main() -> None:
    total = int(DURATION * SR)
    mix = np.zeros(total)

    for index in range(math.ceil(DURATION / CHORD_LEN)):
        start = index * CHORD_LEN
        chord = CHORDS[index % len(CHORDS)]
        n = int((CHORD_LEN + CROSSFADE) * SR)
        if int(start * SR) + n > total:
            n = total - int(start * SR)
        if n <= 0:
            break

        block = np.zeros(n)
        for i, freq in enumerate(chord):
            amp = 1.0 / (1.0 + 0.35 * i)
            block += amp * voice(freq, n, detune=0.0012 if i % 2 else -0.0012)
            block += 0.35 * amp * voice(freq * 2, n, detune=0.0008 if i % 2 else -0.0006)

        # sub an octave under the root, very quiet
        block += 0.42 * voice(chord[0] / 2, n)

        block *= adsr(n, SR, attack=2.2, release=CROSSFADE + 0.6)
        block /= max(1e-9, np.max(np.abs(block)))
        mix[int(start * SR) : int(start * SR) + n] += block

    # simple feedback delay for depth
    delay = int(0.28 * SR)
    echoes = mix.copy()
    for k in range(1, 4):
        shifted = np.zeros_like(mix)
        shifted[k * delay :] = mix[: total - k * delay] * (0.28**k)
        echoes += shifted
    mix = echoes

    # gentle low-pass (one-pole) to soften the harmonics
    alpha = 0.22
    filtered = np.zeros_like(mix)
    prev = 0.0
    for i in range(len(mix)):
        prev = prev + alpha * (mix[i] - prev)
        filtered[i] = prev
    mix = filtered

    # global fades
    fade_in_n = int(FADE_IN * SR)
    fade_out_n = int(FADE_OUT * SR)
    mix[:fade_in_n] *= np.linspace(0, 1, fade_in_n) ** 1.5
    mix[-fade_out_n:] *= np.linspace(1, 0, fade_out_n) ** 1.3

    mix /= max(1e-9, np.max(np.abs(mix)))
    mix *= 0.82

    stereo = np.stack([mix, np.roll(mix, int(0.004 * SR))], axis=1)
    pcm = (stereo * 32767).astype("<i2")

    with wave.open("/tmp/music-bed.wav", "wb") as handle:
        handle.setnchannels(2)
        handle.setsampwidth(2)
        handle.setframerate(SR)
        handle.writeframes(pcm.tobytes())

    print("wrote /tmp/music-bed.wav", pcm.shape)


if __name__ == "__main__":
    main()
