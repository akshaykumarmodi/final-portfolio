import numpy as np
import scipy.signal as signal
import struct
import wave
import subprocess
import os

SAMPLE_RATE = 44100
LOOP_DURATION = 48.0 # 48 seconds seamless loop
TAIL_DURATION = 8.0  # 8 seconds overlap tail for seamless looping
TOTAL_DURATION = LOOP_DURATION + TAIL_DURATION
TOTAL_SAMPLES = int(SAMPLE_RATE * TOTAL_DURATION)
LOOP_SAMPLES = int(SAMPLE_RATE * LOOP_DURATION)
TAIL_SAMPLES = int(SAMPLE_RATE * TAIL_DURATION)

t = np.linspace(0, TOTAL_DURATION, TOTAL_SAMPLES, endpoint=False)

print(f"Synthesizing {TOTAL_DURATION}s composition at {SAMPLE_RATE}Hz...")

# -----------------------------------------------------------------------------
# 1. GENERATE REVERB IMPULSE RESPONSE (Lush, warm cinematic hall, ~4.5s decay)
# -----------------------------------------------------------------------------
def create_hall_reverb_ir(duration=4.5, sr=44100):
    ir_len = int(sr * duration)
    t_ir = np.linspace(0, duration, ir_len)
    
    # Dual channel decorrelated noise with frequency-dependent decay
    decay = np.exp(-t_ir / 1.1)
    decay_hf = np.exp(-t_ir / 0.5)
    
    ir_l = np.random.randn(ir_len) * decay
    ir_r = np.random.randn(ir_len) * decay
    
    # Warm low-pass damping (absorbing high frequencies like a wooden acoustic hall)
    b, a = signal.butter(2, 3200 / (sr / 2), 'low')
    ir_l = signal.lfilter(b, a, ir_l)
    ir_r = signal.lfilter(b, a, ir_r)
    
    # Early discrete reflections
    reflection_times = [0.023, 0.039, 0.057, 0.076, 0.098, 0.124]
    reflection_gains = [0.35,  0.28,  0.22,  0.18,  0.15,  0.12]
    for r_t, r_g in zip(reflection_times, reflection_gains):
        idx = int(r_t * sr)
        if idx < ir_len:
            ir_l[idx] += r_g * 0.8
            ir_r[idx + 45] += r_g * 0.8
            
    # Normalize IR
    ir = np.column_stack([ir_l, ir_r])
    ir /= np.max(np.abs(ir)) * 4.0
    return ir

reverb_ir = create_hall_reverb_ir()

# -----------------------------------------------------------------------------
# 2. FELT PIANO SYNTHESIS (Acoustic physical model)
# -----------------------------------------------------------------------------
piano_track = np.zeros((TOTAL_SAMPLES, 2), dtype=np.float32)

def synthesize_felt_piano_note(freq, velocity=0.5, pan=0.0):
    note_dur = 9.0 # Piano string vibrates for up to 9 seconds into the hall
    n_samples = int(SAMPLE_RATE * note_dur)
    t_n = np.linspace(0, note_dur, n_samples, endpoint=False)
    
    # Partials with inharmonicity (B = 0.00012)
    B = 0.00012
    note_sig = np.zeros(n_samples, dtype=np.float32)
    
    # Sum of 14 inharmonic partials
    num_partials = 14
    for k in range(1, num_partials + 1):
        f_k = k * freq * np.sqrt(1 + B * (k ** 2))
        if f_k > 16000:
            break
        # Amplitude falls off steeply for felt piano (warm, intimate)
        amp_k = (1.0 / (k ** 1.45))
        # Decay: high partials decay much faster than low partials
        decay_time = 5.2 / (1.0 + 0.35 * (k ** 1.3))
        env_k = np.exp(-t_n / decay_time)
        
        # Subtle phase drift between unisons
        phase = np.random.uniform(0, 2 * np.pi)
        note_sig += (amp_k * env_k * np.sin(2 * np.pi * f_k * t_n + phase)).astype(np.float32)
        
    # Attack envelope (8ms smooth ramp to eliminate click)
    attack_len = int(SAMPLE_RATE * 0.008)
    note_sig[:attack_len] *= np.linspace(0, 1, attack_len) ** 1.8
    
    # Soft felt hammer knock / thud (low-pass filtered impulse, 22ms)
    hammer_len = int(SAMPLE_RATE * 0.022)
    hammer_noise = np.random.randn(hammer_len)
    b_h, a_h = signal.butter(2, 550 / (SAMPLE_RATE / 2), 'low')
    hammer_noise = signal.lfilter(b_h, a_h, hammer_noise)
    hammer_noise *= np.exp(-np.linspace(0, 5, hammer_len))
    note_sig[:hammer_len] += (hammer_noise * 0.18 * velocity).astype(np.float32)
    
    # Soundboard resonance (warm 110Hz body resonance)
    sb_len = int(SAMPLE_RATE * 1.5)
    t_sb = np.linspace(0, 1.5, sb_len)
    sb_decay = np.exp(-t_sb / 0.4)
    note_sig[:sb_len] += (np.sin(2 * np.pi * 115 * t_sb) * 0.04 * sb_decay * velocity).astype(np.float32)
    
    # Scale by velocity
    note_sig *= velocity * 0.28
    
    # Stereo panning
    left_gain = np.sqrt(0.5 * (1.0 - pan))
    right_gain = np.sqrt(0.5 * (1.0 + pan))
    
    stereo_note = np.column_stack([note_sig * left_gain, note_sig * right_gain])
    return stereo_note

# Melodic events: (time_in_seconds, frequency, velocity, pan)
piano_events = [
    # Bar 1-3 (Am9)
    (2.4,  659.25, 0.58,  0.15),  # E5 (delicate opening bell)
    (7.0,  493.88, 0.48,  0.05),  # B4 (reflective)
    (8.6,  523.25, 0.52,  0.08),  # C5 (gentle arrival)
    
    # Bar 4-6 (Fmaj9)
    (14.8, 440.00, 0.56, -0.10),  # A4 (warm, grounding)
    (19.4, 392.00, 0.46, -0.05),  # G4
    (21.2, 329.63, 0.50, -0.18),  # E4 (descending warmth)
    
    # Bar 7-9 (Cmaj7 add9)
    (26.6, 587.33, 0.56,  0.12),  # D5 (luminous ninth)
    (31.4, 493.88, 0.46,  0.04),  # B4
    (33.0, 392.00, 0.48, -0.06),  # G4 (peaceful cadence)
    
    # Bar 10-12 (Em7 / G resolving back to loop)
    (39.0, 329.63, 0.48, -0.15),  # E4
    (41.4, 440.00, 0.54, -0.05),  # A4 (soaring fifth)
    (45.0, 523.25, 0.44,  0.08),  # C5 (closure note that seamlessly blends into start)
    
    # Ghost note in overlap tail so crossfade has identical ringing tail
    (48.0 + 2.4, 659.25, 0.58, 0.15),
]

print("Rendering felt piano notes...")
for start_t, freq, vel, pan in piano_events:
    start_idx = int(start_t * SAMPLE_RATE)
    if start_idx >= TOTAL_SAMPLES:
        continue
    note = synthesize_felt_piano_note(freq, vel, pan)
    end_idx = min(start_idx + len(note), TOTAL_SAMPLES)
    n_add = end_idx - start_idx
    piano_track[start_idx:end_idx] += note[:n_add]

# Apply hall convolution reverb to piano track
print("Applying acoustic hall convolution reverb...")
wet_piano_l = signal.fftconvolve(piano_track[:, 0], reverb_ir[:, 0], mode='full')[:TOTAL_SAMPLES]
wet_piano_r = signal.fftconvolve(piano_track[:, 1], reverb_ir[:, 1], mode='full')[:TOTAL_SAMPLES]

# Blend 55% direct + 45% lush hall reverb
piano_final = np.column_stack([
    piano_track[:, 0] * 0.55 + wet_piano_l * 0.45,
    piano_track[:, 1] * 0.55 + wet_piano_r * 0.45
])

# -----------------------------------------------------------------------------
# 3. CINEMATIC ATMOSPHERIC SYNTH PADS (Deep, warm, slow harmonic motion)
# -----------------------------------------------------------------------------
print("Synthesizing cinematic synth pads...")
pad_track = np.zeros((TOTAL_SAMPLES, 2), dtype=np.float32)

# Chords: list of (frequencies, start_time, duration)
# 4 chords over 48 seconds (12 seconds each, with 3s crossfade overlap)
chords = [
    # Am9 (0 - 12s)
    ([55.0, 110.0, 164.81, 220.0, 261.63, 392.0, 493.88], 0.0, 14.0),
    # Fmaj9 (12 - 24s)
    ([43.65, 87.31, 130.81, 174.61, 220.0, 329.63, 392.0], 11.0, 14.0),
    # Cmaj7 (24 - 36s)
    ([65.41, 130.81, 196.0, 246.94, 329.63, 392.0, 587.33], 23.0, 14.0),
    # Em7/G (36 - 48s)
    ([49.0, 98.0, 146.83, 196.0, 246.94, 329.63, 392.0], 35.0, 14.0),
    # Loop continuation chord (47s - 56s) -> Am9
    ([55.0, 110.0, 164.81, 220.0, 261.63, 392.0, 493.88], 46.0, 11.0),
]

for freqs, start_sec, dur_sec in chords:
    c_start = int(start_sec * SAMPLE_RATE)
    c_len = int(dur_sec * SAMPLE_RATE)
    c_end = min(c_start + c_len, TOTAL_SAMPLES)
    actual_len = c_end - c_start
    t_c = np.linspace(0, dur_sec, c_len)[:actual_len]
    
    # Smooth crossfade envelope (equal power curve)
    fade_len = int(SAMPLE_RATE * 3.2)
    env = np.ones(actual_len, dtype=np.float32)
    if actual_len > fade_len * 2:
        env[:fade_len] = np.sin(np.linspace(0, np.pi/2, fade_len)) ** 2
        env[-fade_len:] = np.cos(np.linspace(0, np.pi/2, fade_len)) ** 2
        
    chord_sig_l = np.zeros(actual_len, dtype=np.float32)
    chord_sig_r = np.zeros(actual_len, dtype=np.float32)
    
    for f in freqs:
        # Slight detuning for rich chorusing analog pad warmth
        detune = np.random.uniform(-0.003, 0.003)
        f1 = f * (1.0 + detune)
        f2 = f * (1.0 - detune)
        # Low bass vs high register balancing
        vol = 0.045 if f < 120 else 0.022
        
        # Soft triangle + sine wave harmonics
        wave1 = (0.7 * np.sin(2 * np.pi * f1 * t_c) + 0.3 * np.sin(4 * np.pi * f1 * t_c)).astype(np.float32)
        wave2 = (0.7 * np.sin(2 * np.pi * f2 * t_c) + 0.3 * np.sin(4 * np.pi * f2 * t_c)).astype(np.float32)
        
        chord_sig_l += wave1 * vol
        chord_sig_r += wave2 * vol
        
    pad_track[c_start:c_end, 0] += chord_sig_l * env
    pad_track[c_start:c_end, 1] += chord_sig_r * env

# Low-pass filter pad at 340Hz with soft gentle slope
b_p, a_p = signal.butter(2, 340 / (SAMPLE_RATE / 2), 'low')
pad_track[:, 0] = signal.lfilter(b_p, a_p, pad_track[:, 0])
pad_track[:, 1] = signal.lfilter(b_p, a_p, pad_track[:, 1])

# -----------------------------------------------------------------------------
# 4. SUBTLE FLOWING RIVER / DISTANT STREAM AMBIENCE
# -----------------------------------------------------------------------------
print("Synthesizing subtle distant stream ambience...")
water_track = np.zeros((TOTAL_SAMPLES, 2), dtype=np.float32)

# Generate stereo pink noise
def make_pink(n):
    white = np.random.randn(n)
    b_pink = [0.049922035, -0.095993537, 0.050612699, -0.004408786]
    a_pink = [1.0, -2.494956002, 2.017265875, -0.522189400]
    return signal.lfilter(b_pink, a_pink, white)

pink_l = make_pink(TOTAL_SAMPLES)
pink_r = make_pink(TOTAL_SAMPLES)

# 4A. Deep water flow (lowpass 260Hz)
b_w_low, a_w_low = signal.butter(2, 260 / (SAMPLE_RATE / 2), 'low')
water_deep_l = signal.lfilter(b_w_low, a_w_low, pink_l) * 0.28
water_deep_r = signal.lfilter(b_w_low, a_w_low, pink_r) * 0.28

# 4B. Pebble ripple (~680Hz bandpass with 0.22Hz slow wave modulation)
b_w_mid1, a_w_mid1 = signal.butter(2, [580 / (SAMPLE_RATE / 2), 780 / (SAMPLE_RATE / 2)], 'bandpass')
mod1 = 1.0 + 0.25 * np.sin(2 * np.pi * 0.22 * t)
water_mid1_l = signal.lfilter(b_w_mid1, a_w_mid1, pink_l) * 0.22 * mod1
water_mid1_r = signal.lfilter(b_w_mid1, a_w_mid1, pink_r) * 0.22 * mod1

# 4C. Gentle trickle burble (~1250Hz bandpass with 0.35Hz modulation)
b_w_mid2, a_w_mid2 = signal.butter(2, [1100 / (SAMPLE_RATE / 2), 1400 / (SAMPLE_RATE / 2)], 'bandpass')
mod2 = 1.0 + 0.30 * np.sin(2 * np.pi * 0.35 * t + 1.2)
water_mid2_l = signal.lfilter(b_w_mid2, a_w_mid2, pink_l) * 0.16 * mod2
water_mid2_r = signal.lfilter(b_w_mid2, a_w_mid2, pink_r) * 0.16 * mod2

# 4D. Subtle froth shimmer (~2400Hz bandpass)
b_w_high, a_w_high = signal.butter(2, [2100 / (SAMPLE_RATE / 2), 2700 / (SAMPLE_RATE / 2)], 'bandpass')
water_high_l = signal.lfilter(b_w_high, a_w_high, pink_l) * 0.08
water_high_r = signal.lfilter(b_w_high, a_w_high, pink_r) * 0.08

water_track[:, 0] = (water_deep_l + water_mid1_l + water_mid2_l + water_high_l) * 0.065
water_track[:, 1] = (water_deep_r + water_mid1_r + water_mid2_r + water_high_r) * 0.065

# -----------------------------------------------------------------------------
# 5. SOFT AIRY TEXTURES & LIGHT-RAY PARTICLES
# -----------------------------------------------------------------------------
print("Synthesizing airy textures and light ray atmosphere...")
air_track = np.zeros((TOTAL_SAMPLES, 2), dtype=np.float32)

# Air shimmer: bandpass 3600Hz - 6500Hz with ultra-slow breathing
b_air, a_air = signal.butter(2, [3600 / (SAMPLE_RATE / 2), 6500 / (SAMPLE_RATE / 2)], 'bandpass')
air_noise_l = signal.lfilter(b_air, a_air, pink_l)
air_noise_r = signal.lfilter(b_air, a_air, pink_r)
air_breath = 0.012 + 0.007 * np.sin(2 * np.pi * 0.04 * t)
air_track[:, 0] = air_noise_l * air_breath
air_track[:, 1] = air_noise_r * air_breath

# Soft celestial chime harmonics (very quiet, delicate light ray glimmers)
chime_times = [4.5, 16.5, 28.5, 40.5]
for ct in chime_times:
    c_idx = int(ct * SAMPLE_RATE)
    c_dur = 4.0
    c_samples = int(c_dur * SAMPLE_RATE)
    if c_idx + c_samples < TOTAL_SAMPLES:
        t_ch = np.linspace(0, c_dur, c_samples)
        ch_env = np.exp(-t_ch / 0.8) * np.sin(np.linspace(0, np.pi/2, int(SAMPLE_RATE*0.02)))[0]
        # Chime frequencies (E6: 1318.5Hz, B6: 1975.5Hz)
        ch_sig = (np.sin(2 * np.pi * 1318.5 * t_ch) * 0.005 + np.sin(2 * np.pi * 1975.5 * t_ch) * 0.003) * np.exp(-t_ch / 0.9)
        air_track[c_idx:c_idx+c_samples, 0] += ch_sig * 0.6
        air_track[c_idx:c_idx+c_samples, 1] += ch_sig * 0.4

# -----------------------------------------------------------------------------
# 6. MASTER MIX & HARMONIC BLENDING
# -----------------------------------------------------------------------------
print("Blending layers into master mix...")
master_mix = np.zeros((TOTAL_SAMPLES, 2), dtype=np.float32)
master_mix[:, 0] = piano_final[:, 0] * 0.95 + pad_track[:, 0] * 0.80 + water_track[:, 0] + air_track[:, 0]
master_mix[:, 1] = piano_final[:, 1] * 0.95 + pad_track[:, 1] * 0.80 + water_track[:, 1] + air_track[:, 1]

# -----------------------------------------------------------------------------
# 7. SEAMLESS LOOP CROSSFADE (Fold 8-second tail into the loop start)
# -----------------------------------------------------------------------------
print("Applying seamless loop crossfade...")
final_loop = np.zeros((LOOP_SAMPLES, 2), dtype=np.float32)

# Copy the 48s loop body
final_loop[:] = master_mix[:LOOP_SAMPLES]

# Crossfade the 8-second tail (from LOOP_SAMPLES to TOTAL_SAMPLES) into the first 8 seconds
w_cross = np.linspace(0, 1, TAIL_SAMPLES)
w_fade_out = np.cos(w_cross * np.pi / 2) ** 2
w_fade_in  = np.sin(w_cross * np.pi / 2) ** 2

tail_data = master_mix[LOOP_SAMPLES:TOTAL_SAMPLES]
# Blend head with tail for a mathematically seamless, imperceptible loop
final_loop[:TAIL_SAMPLES, 0] = final_loop[:TAIL_SAMPLES, 0] * w_fade_in + tail_data[:, 0] * w_fade_out
final_loop[:TAIL_SAMPLES, 1] = final_loop[:TAIL_SAMPLES, 1] * w_fade_in + tail_data[:, 1] * w_fade_out

# Peak normalize to -14 dBFS Peak, -26 dBFS RMS (perfect cinema portfolio level)
peak = np.max(np.abs(final_loop))
target_peak = 0.22 # -13.1 dBFS Peak
final_loop = final_loop * (target_peak / peak)

rms = np.sqrt(np.mean(final_loop ** 2))
print(f"Mix stats: Peak = {np.max(np.abs(final_loop)):.4f} ({20*np.log10(np.max(np.abs(final_loop))):.1f} dBFS), RMS = {rms:.4f} ({20*np.log10(rms):.1f} dBFS)")

# -----------------------------------------------------------------------------
# 8. EXPORT MASTER AUDIO FILES (WAV, MP3, WEBM)
# -----------------------------------------------------------------------------
wav_path = "/tmp/cinematic-ambient.wav"
mp3_path = "public/audio/cinematic-ambient.mp3"
webm_path = "public/audio/cinematic-ambient.webm"

print(f"Writing {wav_path}...")
int_data = np.int16(final_loop * 32767)
with wave.open(wav_path, 'wb') as wf:
    wf.setnchannels(2)
    wf.setsampwidth(2)
    wf.setframerate(SAMPLE_RATE)
    wf.writeframes(int_data.tobytes())

print(f"Encoding to {mp3_path} via ffmpeg...")
subprocess.run([
    "/opt/homebrew/bin/ffmpeg", "-y", "-i", wav_path,
    "-codec:a", "libmp3lame", "-b:a", "192k",
    mp3_path
], check=True)

print(f"Encoding to {webm_path} via ffmpeg...")
subprocess.run([
    "/opt/homebrew/bin/ffmpeg", "-y", "-i", wav_path,
    "-codec:a", "libopus", "-b:a", "128k",
    webm_path
], check=True)

print("Audio production complete!")
print("File sizes:")
os.system(f"ls -lh {mp3_path} {webm_path}")

