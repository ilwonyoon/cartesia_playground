"""Line voice agent server — Claude + Cartesia TTS/STT.

Usage:
    uv run main_agent.py

Endpoints:
    POST  http://localhost:8000/chats   → { websocket_url, chat_id }
    GET   http://localhost:8000/status
    WS    ws://localhost:8000/ws
"""

import os
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware

from line.llm_agent import LlmAgent, LlmConfig, end_call
from line.voice_agent_app import VoiceAgentApp
from line.events import AgentUpdateCall, CallStarted

load_dotenv()

CARTESIA_VOICE_ID = "e07c00bc-4134-4eae-9ea4-1a55fb45746b"  # Skylar

DEFAULT_SYSTEM_PROMPT = (
    "You are a friendly voice assistant built with Cartesia. "
    "Keep responses short — 1-2 sentences. Speak naturally, no lists or bullet points."
)
DEFAULT_INTRODUCTION = "Hey! I'm your Cartesia voice assistant. What would you like to talk about?"

async def get_agent(env, call_request):
    agent_cfg = call_request.agent
    system_prompt = agent_cfg.system_prompt or DEFAULT_SYSTEM_PROMPT
    introduction = agent_cfg.introduction or DEFAULT_INTRODUCTION

    agent = LlmAgent(
        model="anthropic/claude-sonnet-4-5",
        api_key=os.getenv("ANTHROPIC_API_KEY"),
        tools=[end_call],
        config=LlmConfig(
            system_prompt=system_prompt,
            introduction=introduction,
        ),
    )

    async def handler(turn_env, event):
        if isinstance(event, CallStarted):
            yield AgentUpdateCall(voice_id=CARTESIA_VOICE_ID)
        async for output in agent.process(turn_env, event):
            yield output

    return handler


app = VoiceAgentApp(get_agent=get_agent)

# Allow requests from the Vite dev server
app.fastapi_app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5174", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000)
