# NIHON QUEST music provenance

## Scene soundtrack

Eight additional tracks were generated locally on 2026-10-12 with Stable Audio 3 Small Music, using seeds 271829–271836. Exact prompts, seeds, durations, measured peaks, file sizes, post-processing, and SHA-256 hashes are recorded in `generation.json`. No reference audio was used. The six new loop tracks have trailing silence removed and a cyclic 0.25-second crossfade across their loop boundary. Victory and defeat are one-shot jingles. All new files are 44.1 kHz stereo MP3 at 192 kbps, normalized toward -18 LUFS with a -2 dBTP ceiling.

## Original battle theme

- File: `assets/audio/bgm/battle-theme.mp3`
- Generated: 2026-10-12
- Generator: Stability AI Stable Audio 3 Small Music (`sm-music`), official MLX implementation
- Source: <https://github.com/Stability-AI/stable-audio-3>
- Model source: `stabilityai/stable-audio-3-optimized`
- Seed: `271828`
- Runtime: local Apple Silicon inference; no paid API or third-party audio input
- Post-processing: two-pass loudness normalization to -18 LUFS / -1.5 dBTP target, MP3 192 kbps
- SHA-256: `2395203a21ab3fa0c60e72ca76345883d31c6b27a7a8318d49f4599b4b4a72f8`

Prompt:

> Original upbeat handheld-era creature-battling RPG combat theme for a family-friendly educational adventure, 150 BPM, short dramatic intro, driving syncopated bass, crisp retro-inspired percussion, bright heroic lead melody, playful tension, energetic instrumental, clear loop-friendly ending, polished game soundtrack

Negative prompt:

> vocals, singing, speech, existing franchise melody, sound logo, slow ambient, harsh noise, clipping

The model was used under the Stability AI Community License. Under the project's documented assumption that the user or organization has annual revenue below USD 1,000,000, the generated output may be used and redistributed in this project. Reconfirm eligibility if that condition changes. License terms: <https://stability.ai/community-license-agreement>
