"""Shared helpers for constructing a Cartesia client and common defaults.

Loads CARTESIA_API_KEY from the environment (and a local .env if present),
failing loudly with an actionable message when it is missing.
"""

from __future__ import annotations

import os
from functools import lru_cache

from cartesia import AsyncCartesia, Cartesia
from dotenv import load_dotenv

# Defaults shared across the example scripts. Override per-call as needed.
DEFAULT_MODEL_ID = "sonic-3"
# A stock public voice from the Cartesia library, handy for quick tests.
DEFAULT_VOICE_ID = "e07c00bc-4134-4eae-9ea4-1a55fb45746b"
DEFAULT_OUTPUT_FORMAT = {
    "container": "wav",
    "encoding": "pcm_f32le",
    "sample_rate": 44100,
}


def _require_api_key() -> str:
    load_dotenv()  # no-op if .env is absent; env vars still take precedence
    api_key = os.getenv("CARTESIA_API_KEY")
    if not api_key:
        raise RuntimeError(
            "CARTESIA_API_KEY is not set. Add it to .env (see .env.example) "
            "or export it: export CARTESIA_API_KEY=sk_..."
        )
    return api_key


@lru_cache(maxsize=1)
def get_client() -> Cartesia:
    """Return a cached synchronous Cartesia client."""
    return Cartesia(api_key=_require_api_key())


def get_async_client() -> AsyncCartesia:
    """Return a new asynchronous Cartesia client (close it when done)."""
    return AsyncCartesia(api_key=_require_api_key())
