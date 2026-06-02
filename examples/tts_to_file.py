"""Text-to-speech: generate a full WAV file in one request.

Usage:
    uv run examples/tts_to_file.py "Some text to speak"
"""

from __future__ import annotations

import sys
from pathlib import Path

from cartesia_playground.client import (
    DEFAULT_MODEL_ID,
    DEFAULT_OUTPUT_FORMAT,
    DEFAULT_VOICE_ID,
    get_client,
)

OUTPUT_DIR = Path(__file__).resolve().parent.parent / "output"


def main(transcript: str) -> None:
    client = get_client()

    # tts.bytes returns an iterator of audio chunks; join them into one file.
    audio_chunks = client.tts.bytes(
        model_id=DEFAULT_MODEL_ID,
        transcript=transcript,
        voice={"mode": "id", "id": DEFAULT_VOICE_ID},
        output_format=DEFAULT_OUTPUT_FORMAT,
    )

    OUTPUT_DIR.mkdir(exist_ok=True)
    out_path = OUTPUT_DIR / "tts_to_file.wav"
    with out_path.open("wb") as f:
        for chunk in audio_chunks:
            f.write(chunk)

    print(f"Wrote {out_path} ({out_path.stat().st_size} bytes)")


if __name__ == "__main__":
    text = sys.argv[1] if len(sys.argv) > 1 else "Hello from Cartesia Sonic."
    main(text)
