# NIHON QUEST exploration sound effects

Six original effects were generated locally on 2026-10-12 using Stable Audio 3 Small SFX (`sm-sfx`), the official Apple Silicon MLX implementation. No paid API, reference audio, or existing franchise recording was used.

- Source: <https://github.com/Stability-AI/stable-audio-3>
- Weights: `stabilityai/stable-audio-3-optimized`, `dit_sm-sfx_f16.npz`, `same-s` decoder
- Seeds: 271840–271845; exact prompts, generation parameters, processing, sizes and SHA-256 hashes: `generation.json`
- Footsteps: grass, sand, stone, shallow water; 140ms decoded audio, shorter than the 160ms walking animation
- Interactions: wooden door (650ms), treasure chest (700ms)
- Processing: strongest transient extraction, mono 44.1kHz, peak normalized to 0.6, 3ms fade-in, short fade-out, MP3 128kbps

The project's previously documented annual-revenue-below-USD-1,000,000 assumption applies to these model-generated outputs under the Stability AI Community License. Reconfirm eligibility if that condition changes. Terms: <https://stability.ai/community-license-agreement>
