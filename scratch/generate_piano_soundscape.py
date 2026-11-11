import numpy as np
import scipy.signal as signal
import wave
import subprocess
import os

SAMPLE_RATE = 44100
LOOP_DURATION = 64.0  # 64 seconds complete musical journey (16 bars at 60 BPM)
TAIL_DURATION = 8.0   # 8 seconds seamless crossfade overlap tail
TOTAL_DURATION = LOOP_DURATION + TAIL_DURATION
TOTAL_SAMPLES = int(SAMPLE_RATE * TOTAL_DURATION)
LOOP_SAMPLES = int(SAMPLE_RATE * LOOP_DURATION)
TAIL_SAMPLES = int(SAMPLE_RATE * TAIL_DURATION)

t = np.linspace(0, TOTAL_DURATION, TOTAL_SAMPLES, endpoint=False)

print(f"Synthesizing {TOTAL_DURATION}s Peder B. Helland style piano composition at {SAMPLE_RATE}Hz...")

# -----------------------------------------------------------------------------
# 1. ACOUSTIC HALL REVERB IR (Lush, warm, dreamy, 4.2s decay)
# -----------------------------------------------------------------------------
def create_dreamy_reverb_ir(duration=4.2, sr=44100):
    ir_len = int(sr * duration)
    t_ir = np.linspace(0, duration, ir_len)
    
    # Smooth exponential decay with warm frequency damping
    decay = np.exp(-t_ir / 1.15)
    
    ir_l = np.random.randn(ir_len) * decay
    ir_r = np.random.randn(ir_len) * decay
    
    # Warm lowpass absorbing harsh highs
    b, a = signal.butter(2, 3400 / (sr / 2), 'low')
    ir_l = signal.lfilter(b, a, ir_l)
    ir_r = signal.lfilter(b, a, ir_r)
    
    # Discrete early reflections for intimate room feel
    reflections = [(0.024, 0.40), (0.041, 0.32), (0.063, 0.25), (0.089, 0.20), (0.118, 0.16)]
    for r_t, r_g in reflections:
        idx = int(r_t * sr)
        if idx < ir_len:
            ir_l[idx] += r_g
            ir_r[idx + 52] += r_g
            
    ir = np.column_stack([ir_l, ir_r])
    ir /= np.max(np.abs(ir)) * 3.8
    return ir

reverb_ir = create_dreamy_reverb_ir()

# -----------------------------------------------------------------------------
# 2. ACOUSTIC PIANO NOTE SYNTHESIZER
# -----------------------------------------------------------------------------
def midi_to_freq(m):
    return 440.0 * (2.0 ** ((m - 69) / 12.0))

def synthesize_piano_note(freq, duration=6.5, velocity=0.6, pan=0.0):
    n_samples = int(SAMPLE_RATE * duration)
    t_n = np.linspace(0, duration, n_samples, endpoint=False)
    
    B = 0.00012
    note_sig = np.zeros(n_samples, dtype=np.float32)
    
    # 16 partials with realistic acoustic decay
    num_partials = 16
    for k in range(1, num_partials + 1):
        f_k = k * freq * np.sqrt(1 + B * (k ** 2))
        if f_k > 16000:
            break
        # Velocity-dependent brightness (softer notes are warmer and rounder)
        brightness_exp = 1.45 - (velocity * 0.25)
        amp_k = 1.0 / (k ** brightness_exp)
        
        # Frequency-dependent decay time
        decay_time = 5.8 / (1.0 + 0.30 * (k ** 1.25))
        env_k = np.exp(-t_n / decay_time)
        
        phase = np.random.uniform(0, 2 * np.pi)
        note_sig += (amp_k * env_k * np.sin(2 * np.pi * f_k * t_n + phase)).astype(np.float32)
        
    # Attack envelope (6ms smooth quadratic ramp)
    attack_len = int(SAMPLE_RATE * 0.006)
    note_sig[:attack_len] *= (np.linspace(0, 1, attack_len) ** 1.5)
    
    # Soft hammer knock / felt impact (20ms lowpass filtered impulse)
    hammer_len = int(SAMPLE_RATE * 0.020)
    hammer_noise = np.random.randn(hammer_len)
    b_h, a_h = signal.butter(2, 620 / (SAMPLE_RATE / 2), 'low')
    hammer_noise = signal.lfilter(b_h, a_h, hammer_noise)
    hammer_noise *= np.exp(-np.linspace(0, 5, hammer_len))
    note_sig[:hammer_len] += (hammer_noise * 0.16 * velocity).astype(np.float32)
    
    # Soundboard resonance (warm 110Hz body resonance)
    sb_len = int(SAMPLE_RATE * 1.6)
    t_sb = np.linspace(0, 1.6, sb_len)
    sb_decay = np.exp(-t_sb / 0.45)
    note_sig[:sb_len] += (np.sin(2 * np.pi * 112 * t_sb) * 0.04 * sb_decay * velocity).astype(np.float32)
    
    note_sig *= velocity * 0.32
    
    # Stereo panning
    left_gain = np.sqrt(0.5 * (1.0 - pan))
    right_gain = np.sqrt(0.5 * (1.0 + pan))
    
    return np.column_stack([note_sig * left_gain, note_sig * right_gain])

# -----------------------------------------------------------------------------
# 3. MUSICAL SCORE: FLOWING ARPEGGIOS + BEAUTIFUL LYRICAL MELODY
# -----------------------------------------------------------------------------
# MIDI pitch reference:
# C2=36, G2=43, A2=45, C3=48, D3=50, E3=52, F3=53, G3=55, A3=57, B3=59
# C4=60, D4=62, E4=64, F4=65, G4=67, A4=69, B4=71
# C5=72, D5=74, E5=76, F5=77, G5=79, A5=81, B5=83, C6=84

# (time_sec, midi_pitch, velocity, duration)
left_hand_notes = []
right_hand_notes = []

def add_lh_arpeggio(bar_start, root, fifth, octave, tenth):
    # Flowing 4-note rolling arpeggio per bar (root on beat 1, fifth on beat 2, octave on beat 3, tenth on beat 4)
    # with gentle dynamics
    left_hand_notes.append((bar_start + 0.0, root,   0.56, 4.5))
    left_hand_notes.append((bar_start + 1.0, fifth,  0.46, 3.5))
    left_hand_notes.append((bar_start + 2.0, octave, 0.48, 3.0))
    left_hand_notes.append((bar_start + 3.0, tenth,  0.44, 2.8))

# 16 BARS OF BEAUTIFUL HARMONY (Bar length = 4.0 seconds at 60 BPM):
# Bar 1: Cmaj9
add_lh_arpeggio(0.0, 48, 55, 60, 64) # C3, G3, C4, E4
# Bar 2: Am9
add_lh_arpeggio(4.0, 45, 52, 57, 60) # A2, E3, A3, C4
# Bar 3: Fmaj7(add9)
add_lh_arpeggio(8.0, 41, 48, 53, 57) # F2, C3, F3, A3
# Bar 4: Gsus4 -> G
add_lh_arpeggio(12.0, 43, 50, 55, 59) # G2, D3, G3, B3

# Bar 5: Cmaj7/E
add_lh_arpeggio(16.0, 52, 55, 60, 64) # E3, G3, C4, E4
# Bar 6: Fmaj9
add_lh_arpeggio(20.0, 41, 48, 55, 60) # F2, C3, G3, C4
# Bar 7: Dm9
add_lh_arpeggio(24.0, 50, 57, 62, 65) # D3, A3, D4, F4
# Bar 8: Gsus4(add9)
add_lh_arpeggio(28.0, 43, 50, 57, 60) # G2, D3, A3, C4

# Bar 9: Am9
add_lh_arpeggio(32.0, 45, 52, 57, 64) # A2, E3, A3, E4
# Bar 10: Em7
add_lh_arpeggio(36.0, 40, 47, 52, 55) # E2, B2, E3, G3
# Bar 11: Fmaj7
add_lh_arpeggio(40.0, 41, 48, 53, 57) # F2, C3, F3, A3
# Bar 12: C/G -> G
add_lh_arpeggio(44.0, 43, 52, 55, 60) # G2, E3, G3, C4

# Bar 13: Fmaj9
add_lh_arpeggio(48.0, 41, 48, 55, 60) # F2, C3, G3, C4
# Bar 14: Em7
add_lh_arpeggio(52.0, 40, 47, 55, 59) # E2, B2, G3, B3
# Bar 15: Dm9
add_lh_arpeggio(56.0, 50, 57, 60, 65) # D3, A3, C4, F4
# Bar 16: Gsus4 -> G7
add_lh_arpeggio(60.0, 43, 50, 55, 59) # G2, D3, G3, B3

# Overlap tail (Bars 17-18) so crossfade has identical ringing arpeggio
add_lh_arpeggio(64.0, 48, 55, 60, 64)
add_lh_arpeggio(68.0, 45, 52, 57, 60)

# RIGHT HAND: LYRICAL, EMOTIONAL, SINGING MELODY
# (time_sec, midi_pitch, velocity, duration)
right_hand_melody = [
    # Phrase 1: Sweet & Tender Introduction
    (0.8,  67, 0.52, 2.2), # G4
    (1.9,  76, 0.62, 3.8), # E5 (soaring singing tone)
    (3.2,  74, 0.50, 1.8), # D5
    (3.8,  72, 0.54, 2.5), # C5
    
    (4.8,  71, 0.48, 2.0), # B4
    (5.8,  69, 0.52, 2.2), # A4
    (6.8,  67, 0.50, 1.8), # G4
    (7.6,  64, 0.46, 2.8), # E4
    
    (9.0,  72, 0.55, 2.2), # C5
    (10.0, 74, 0.52, 1.8), # D5
    (10.8, 76, 0.58, 2.4), # E5
    (11.8, 79, 0.62, 3.4), # G5 (delicate high emotional peak)
    
    (12.8, 77, 0.50, 1.8), # F5
    (13.8, 76, 0.54, 2.0), # E5
    (14.8, 74, 0.56, 3.8), # D5 (peaceful pause)
    
    # Phrase 2: Emotional Expansion
    (16.8, 79, 0.60, 3.0), # G5
    (18.2, 76, 0.54, 2.2), # E5
    (19.4, 67, 0.48, 2.5), # G4
    
    (20.8, 69, 0.54, 2.0), # A4
    (21.8, 72, 0.56, 2.0), # C5
    (22.8, 76, 0.58, 2.2), # E5
    (23.6, 74, 0.52, 2.8), # D5
    
    (25.0, 77, 0.56, 2.2), # F5
    (26.0, 76, 0.52, 1.8), # E5
    (26.8, 74, 0.54, 2.0), # D5
    (27.6, 72, 0.50, 2.8), # C5
    
    (28.8, 71, 0.52, 2.2), # B4
    (29.8, 72, 0.54, 2.0), # C5
    (30.8, 74, 0.58, 3.5), # D5 (holding into contemplation)
    
    # Phrase 3: Deep Contemplation & Warmth
    (33.0, 76, 0.60, 2.8), # E5
    (34.4, 79, 0.64, 3.2), # G5
    (35.6, 76, 0.52, 2.4), # E5
    
    (37.0, 74, 0.54, 2.6), # D5
    (38.2, 71, 0.50, 2.2), # B4
    (39.2, 67, 0.48, 3.0), # G4
    
    (41.0, 69, 0.55, 2.0), # A4
    (42.0, 72, 0.56, 2.2), # C5
    (43.0, 74, 0.58, 2.0), # D5
    (43.8, 72, 0.52, 3.0), # C5
    
    (45.0, 76, 0.58, 2.6), # E5
    (46.2, 74, 0.54, 2.2), # D5
    (47.2, 72, 0.56, 3.2), # C5
    
    # Phrase 4: Peaceful Resolution
    (49.0, 72, 0.54, 2.0), # C5
    (50.0, 74, 0.56, 2.2), # D5
    (51.0, 76, 0.58, 2.4), # E5
    (52.0, 74, 0.52, 2.8), # D5
    
    (53.0, 71, 0.52, 2.6), # B4
    (54.2, 67, 0.48, 2.4), # G4
    (55.2, 69, 0.50, 3.0), # A4
    
    (57.0, 65, 0.48, 2.0), # F4
    (58.0, 69, 0.52, 2.2), # A4
    (59.0, 72, 0.56, 2.0), # C5
    (59.8, 74, 0.54, 2.6), # D5
    
    (61.0, 76, 0.56, 2.2), # E5
    (62.2, 74, 0.52, 2.0), # D5
    (63.2, 71, 0.50, 3.0), # B4 (gently prepares the Cmaj9 resolution at loop start)
    
    # Ghost note in overlap tail for crossfade continuity
    (64.8, 67, 0.52, 2.2),
    (65.9, 76, 0.62, 3.8),
]

piano_track = np.zeros((TOTAL_SAMPLES, 2), dtype=np.float32)

print("Synthesizing left-hand arpeggios...")
for start_t, midi_p, vel, dur in left_hand_notes:
    start_idx = int(start_t * SAMPLE_RATE)
    if start_idx >= TOTAL_SAMPLES:
        continue
    freq = midi_to_freq(midi_p)
    # Bass / lower notes panned gently left
    pan = np.clip(-0.35 + (midi_p - 48) * 0.02, -0.4, 0.0)
    note = synthesize_piano_note(freq, duration=dur, velocity=vel, pan=pan)
    end_idx = min(start_idx + len(note), TOTAL_SAMPLES)
    n_add = end_idx - start_idx
    piano_track[start_idx:end_idx] += note[:n_add]

print("Synthesizing singing melody line...")
for start_t, midi_p, vel, dur in right_hand_melody:
    start_idx = int(start_t * SAMPLE_RATE)
    if start_idx >= TOTAL_SAMPLES:
        continue
    freq = midi_to_freq(midi_p)
    # Melody notes gently centered to right
    pan = np.clip(0.0 + (midi_p - 60) * 0.015, -0.05, 0.3)
    note = synthesize_piano_note(freq, duration=dur, velocity=vel, pan=pan)
    end_idx = min(start_idx + len(note), TOTAL_SAMPLES)
    n_add = end_idx - start_idx
    piano_track[start_idx:end_idx] += note[:n_add]

# Apply acoustic hall convolution reverb
print("Applying acoustic hall convolution reverb...")
wet_piano_l = signal.fftconvolve(piano_track[:, 0], reverb_ir[:, 0], mode='full')[:TOTAL_SAMPLES]
wet_piano_r = signal.fftconvolve(piano_track[:, 1], reverb_ir[:, 1], mode='full')[:TOTAL_SAMPLES]

# 58% direct piano + 42% lush dreamy reverb
piano_final = np.column_stack([
    piano_track[:, 0] * 0.58 + wet_piano_l * 0.42,
    piano_track[:, 1] * 0.58 + wet_piano_r * 0.42
])

# -----------------------------------------------------------------------------
# 4. SUBTLE WARM ATMOSPHERIC SYNTH PADS (Very gentle depth beneath the piano)
# -----------------------------------------------------------------------------
print("Adding subtle atmospheric background depth...")
pad_track = np.zeros((TOTAL_SAMPLES, 2), dtype=np.float32)

# Harmonic chord beds: (pitches, start_bar, end_bar)
pad_chords = [
    ([midi_to_freq(48), midi_to_freq(55), midi_to_freq(64)],  0.0, 16.0),  # Cmaj9
    ([midi_to_freq(45), midi_to_freq(52), midi_to_freq(60)], 16.0, 32.0),  # Am9
    ([midi_to_freq(41), midi_to_freq(48), midi_to_freq(57)], 32.0, 48.0),  # Fmaj7
    ([midi_to_freq(43), midi_to_freq(50), midi_to_freq(59)], 48.0, 64.0),  # G
    ([midi_to_freq(48), midi_to_freq(55), midi_to_freq(64)], 63.0, 72.0),  # C overlap
]

for freqs, start_s, end_s in pad_chords:
    c_start = int(start_s * SAMPLE_RATE)
    c_end = min(int(end_s * SAMPLE_RATE), TOTAL_SAMPLES)
    c_len = c_end - c_start
    if c_len <= 0:
        continue
    t_c = np.linspace(0, (end_s - start_s), c_len)
    
    # Soft sinusoidal crossfade envelope
    fade_len = int(SAMPLE_RATE * 3.5)
    env = np.ones(c_len, dtype=np.float32)
    if c_len > fade_len * 2:
        env[:fade_len] = np.sin(np.linspace(0, np.pi/2, fade_len)) ** 2
        env[-fade_len:] = np.cos(np.linspace(0, np.pi/2, fade_len)) ** 2
        
    for f in freqs:
        f_detune1 = f * 1.002
        f_detune2 = f * 0.998
        # Very quiet background level (-22 dB below piano)
        vol = 0.016
        pad_sig_l = (np.sin(2 * np.pi * f_detune1 * t_c) * vol).astype(np.float32)
        pad_sig_r = (np.sin(2 * np.pi * f_detune2 * t_c) * vol).astype(np.float32)
        pad_track[c_start:c_end, 0] += pad_sig_l * env
        pad_track[c_start:c_end, 1] += pad_sig_r * env

# Soft low-pass filter on pad at 300Hz
b_pad, a_pad = signal.butter(2, 300 / (SAMPLE_RATE / 2), 'low')
pad_track[:, 0] = signal.lfilter(b_pad, a_pad, pad_track[:, 0])
pad_track[:, 1] = signal.lfilter(b_pad, a_pad, pad_track[:, 1])

# -----------------------------------------------------------------------------
# 5. MASTER MIX (Piano is clear & upfront; atmospheric bed is subtle & warm)
# -----------------------------------------------------------------------------
print("Blending master mix...")
master_mix = np.zeros((TOTAL_SAMPLES, 2), dtype=np.float32)
master_mix[:, 0] = piano_final[:, 0] * 1.0 + pad_track[:, 0] * 0.45
master_mix[:, 1] = piano_final[:, 1] * 1.0 + pad_track[:, 1] * 0.45

# -----------------------------------------------------------------------------
# 6. SEAMLESS 64-SECOND LOOP EQUAL-POWER CROSSFADE
# -----------------------------------------------------------------------------
print("Applying seamless loop crossfade...")
final_loop = np.zeros((LOOP_SAMPLES, 2), dtype=np.float32)
final_loop[:] = master_mix[:LOOP_SAMPLES]

# Blend the 8s tail into the beginning with equal-power curves
w_cross = np.linspace(0, 1, TAIL_SAMPLES)
w_out = np.cos(w_cross * np.pi / 2) ** 2
w_in  = np.sin(w_cross * np.pi / 2) ** 2

tail_data = master_mix[LOOP_SAMPLES:TOTAL_SAMPLES]
final_loop[:TAIL_SAMPLES, 0] = final_loop[:TAIL_SAMPLES, 0] * w_in + tail_data[:, 0] * w_out
final_loop[:TAIL_SAMPLES, 1] = final_loop[:TAIL_SAMPLES, 1] * w_in + tail_data[:, 1] * w_out

# Peak normalize to -12 dBFS Peak, -24 dBFS RMS (warm, clear, soothing, non-distracting)
peak = np.max(np.abs(final_loop))
target_peak = 0.25  # -12.0 dBFS Peak
final_loop = final_loop * (target_peak / peak)

rms = np.sqrt(np.mean(final_loop ** 2))
print(f"Mix stats: Peak = {np.max(np.abs(final_loop)):.4f} ({20*np.log10(np.max(np.abs(final_loop))):.1f} dBFS), RMS = {rms:.4f} ({20*np.log10(rms):.1f} dBFS)")

# -----------------------------------------------------------------------------
# 7. EXPORT MASTER AUDIO FILES (WAV, MP3, WEBM)
# -----------------------------------------------------------------------------
wav_path = "/tmp/soothing-piano.wav"
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

print("Soothing relaxation piano production complete!")
os.system(f"ls -lh {mp3_path} {webm_path}")

