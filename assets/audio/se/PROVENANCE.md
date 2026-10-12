# NIHON QUEST exploration sound effects

Six original effects were generated locally on 2026-10-12 using Stable Audio 3 Small SFX (`sm-sfx`), the official Apple Silicon MLX implementation. No paid API, reference audio, or existing franchise recording was used.

- Source: <https://github.com/Stability-AI/stable-audio-3>
- Weights: `stabilityai/stable-audio-3-optimized`, `dit_sm-sfx_f16.npz`, `same-s` decoder
- Seeds: 271840–271845; exact prompts, generation parameters, processing, sizes and SHA-256 hashes: `generation.json`
- Footsteps: grass, sand, stone, shallow water; 140ms decoded audio, shorter than the 160ms walking animation
- Interactions: wooden door (650ms), treasure chest (700ms)
- Processing: strongest transient extraction, mono 44.1kHz, peak normalized to 0.6, 3ms fade-in, short fade-out, MP3 128kbps

## Battle effects

Five further original effects (slash, hit, critical hit, hurt, heal) were generated locally with the same model on 2026-10-12, seeds 271850–271854. Exact prompts, negative prompt, parameters, durations, file sizes and hashes are in `battle-generation.json`. These are mono 44.1kHz MP3 at 128kbps, 200–650ms long, with short attack/release fades and a normalized peak of 0.6. No paid API or reference audio was used.

The project's previously documented annual-revenue-below-USD-1,000,000 assumption applies to these model-generated outputs under the Stability AI Community License. Reconfirm eligibility if that condition changes. Terms: <https://stability.ai/community-license-agreement>
