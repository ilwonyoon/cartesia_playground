"""Smoke test: confirm the API key works and list a couple of voices.

    uv run main.py
"""

from __future__ import annotations

from cartesia_playground.client import get_client


def main() -> None:
    client = get_client()
    status = client.get_status()
    print(f"Connected to Cartesia API (version {status.version}).")

    print("\nSample voices:")
    for voice in client.voices.list(limit=3):
        print(f"  {voice.id}  {voice.name}")

    print(
        "\nTry the examples:\n"
        "  uv run examples/tts_to_file.py \"Hello there\"\n"
        "  uv run examples/tts_streaming.py\n"
        "  uv run examples/list_voices.py\n"
        "  uv run examples/stt_transcribe.py output/tts_to_file.wav"
    )


if __name__ == "__main__":
    main()
