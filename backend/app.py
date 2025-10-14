from dotenv import load_dotenv


from livekit import agents
from livekit.agents import AgentSession, Agent, RoomInputOptions


# Plugins (Deepgram for STT/TTS, Google Gemini for LLM)
from livekit.plugins import deepgram, noise_cancellation
from livekit.plugins.google import LLM


# Load environment variables
load_dotenv(".env")




# class Assistant(Agent):
#     def __init__(self) -> None:
#         super().__init__(instructions="You are a helpful voice AI assistant.")

class Assistant(Agent):
    def __init__(self) -> None:
        super().__init__(instructions=(
            "You are a friendly AI sales assistant for books. Engage naturally, recommend books, answer questions politely, and encourage purchases without being pushy. Keep responses concise and helpful."
        ))


async def entrypoint(ctx: agents.JobContext):
    session = AgentSession(
        # Speech-to-Text
        stt=deepgram.STT(model="nova-3", language="multi"),


        # Google Gemini LLM
        llm=LLM(model="gemini-2.0-flash"),


        # Text-to-Speech
        tts=deepgram.TTS(model="aura-asteria-en"),


       
    )


    await session.start(
        room=ctx.room,
        agent=Assistant(),
        room_input_options=RoomInputOptions(
            # Noise cancellation
            noise_cancellation=noise_cancellation.BVC(),
        ),
    )


    # Initial greeting
    await session.generate_reply(
        instructions="Greet the user and offer your assistance."
    )




if __name__ == "__main__":
    agents.cli.run_app(agents.WorkerOptions(entrypoint_fnc=entrypoint))

