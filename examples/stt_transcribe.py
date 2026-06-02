"""Speech-to-text: transcribe an audio file.

Usage:
    uv run examples/stt_transcribe.py path/to/audio.wav

Tip: generate a sample first with `uv run examples/tts_to_file.py`, then
transcribe output/tts_to_file.wav.
"""

from __future__ import annotations

import sys
from pathlib import Path

from cartesia_playground.client import get_client

STT_MODEL = "ink-whisper"


def main(audio_path: Path) -> None:
    if not audio_path.exists():
        raise FileNotFoundError(f"No such audio file: {audio_path}")

    client = get_client()
    with audio_path.open("rb") as f:
        result = client.stt.transcribe(
            file=f,
            model=STT_MODEL,
            language="en",
        )
    print(result.text)


if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit("Usage: uv run examples/stt_transcribe.py <audio-file>")
    main(Path(sys.argv[1]))
