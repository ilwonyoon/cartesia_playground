"""Streaming text-to-speech over a WebSocket.

Pushes transcript parts incrementally and writes audio chunks as they arrive
— the low-latency path you'd use for real-time playback.

Usage:
    uv run examples/tts_streaming.py
"""

from __future__ import annotations

from pathlib import Path

from cartesia_playground.client import (
    DEFAULT_MODEL_ID,
    DEFAULT_OUTPUT_FORMAT,
    DEFAULT_VOICE_ID,
    get_client,
)

OUTPUT_DIR = Path(__file__).resolve().parent.parent / "output"
PARTS = ["The road ", "goes ever ", "on and ", "on."]


def main() -> None:
    client = get_client()
    OUTPUT_DIR.mkdir(exist_ok=True)
    out_path = OUTPUT_DIR / "tts_streaming.wav"

    with client.tts.websocket_connect() as ws:
        ctx = ws.context()

        # The first send configures the context (model, voice, format).
        ctx.send(
            model_id=DEFAULT_MODEL_ID,
            transcript=PARTS[0],
            voice={"mode": "id", "id": DEFAULT_VOICE_ID},
            output_format=DEFAULT_OUTPUT_FORMAT,
        )
        # Stream the remaining parts, then signal completion.
        for part in PARTS[1:]:
            ctx.push(part)
        ctx.no_more_inputs()

        with out_path.open("wb") as f:
            for response in ctx.receive():
                if response.audio:
                    f.write(response.audio)

    print(f"Wrote {out_path} ({out_path.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
