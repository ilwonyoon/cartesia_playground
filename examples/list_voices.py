"""List the first page of voices available to your account.

Usage:
    uv run examples/list_voices.py
"""

from __future__ import annotations

from cartesia_playground.client import get_client


def main() -> None:
    client = get_client()
    page = client.voices.list(limit=10)
    for voice in page:
        print(f"{voice.id}  {voice.name}")


if __name__ == "__main__":
    main()
