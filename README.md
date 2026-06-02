# Cartesia Playground

A minimal playground for experimenting with the [Cartesia](https://cartesia.ai) API
(TTS / STT / voices) using the official Python SDK (`cartesia` v3) and `uv`.

## Setup

1. Install dependencies (creates `.venv` automatically):

   ```bash
   uv sync
   ```

2. Add your API key. Copy the example and paste your key into `.env`:

   ```bash
   cp .env.example .env   # then edit .env
   ```

   `.env` is gitignored. Get a key at <https://play.cartesia.ai/keys>.

3. Verify the connection:

   ```bash
   uv run main.py
   ```

## Examples

| Command | What it does |
| --- | --- |
| `uv run examples/tts_to_file.py "Hello there"` | TTS → `output/tts_to_file.wav` (single request) |
| `uv run examples/tts_streaming.py` | Streaming TTS over WebSocket → `output/tts_streaming.wav` |
| `uv run examples/list_voices.py` | List voices available to your account |
| `uv run examples/stt_transcribe.py output/tts_to_file.wav` | Transcribe an audio file (STT) |

## Layout

```
cartesia_playground/
  client.py        # shared client factory + defaults (model, voice, format)
examples/          # small, runnable scripts — one Cartesia capability each
main.py            # connectivity smoke test
.env.example       # template; copy to .env and add your key
```

## Defaults

Defined in `cartesia_playground/client.py` and overridable per call:

- **TTS model:** `sonic-3`
- **STT model:** `ink-whisper`
- **Output format:** WAV / `pcm_f32le` / 44.1 kHz
- **Voice:** a stock public voice ID (swap for your own from `list_voices.py`)
