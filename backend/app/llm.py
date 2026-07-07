from collections.abc import AsyncGenerator
from ollama import AsyncClient, Client

def list_ollama_models() -> list[dict]:
    try:
        resp = Client(host="http://localhost:11434").list()
        result_list =[]
        for m in resp.models:
            model_info = {
                "id": f"ollama:{m.model}",
                "name": m.model,
                "provider": "ollama",
                "local": True
            }
            result_list.append(model_info)
        return result_list

    except Exception as e:
        return []

async def stream_ollama(model, messages, temperature = 0.7) -> AsyncGenerator[str, None]:
    client = AsyncClient(host = "http://Localhost:11434")
    if model.startswith("ollama:"):
        model_name = model.replace("ollama:", "", 1)
    else:
        model_name = model
    async for part in await client.chat(
        model = model_name,
        messages = messages,
        stream = True,
        options = {"temperature": temperature}
    ):
        if part.message.content:
            yield part.message.content

def build_system_prompt(base = None, skill = None, memories = None) -> str:
    parts = []
    base_prompt = base or ("Your name is Nook and you are a helpful AI assistant running locally." + "Respond in the same language as the user.Be concise and helpful.")
    parts.append(base_prompt)
    if skill:
        parts.append(f"\n\nSkill context:\n{skill}")
    if memories:
        parts.append(f"\nLong-term memories (reference naturally, don't recite):\n-{"\n-".join(memories)}")
    return "".join(parts)

def build_messages(system_prompt, history, user_message) -> list[dict]:
    messages = [{"role": "system", "content": system_prompt},]
    if len(history) > 20:
        for msg in history[-20:]:
            messages.append({"role": msg["role"], "content": msg["content"]})
    else:
        for msg in history:
            messages.append({"role": msg["role"], "content": msg["content"]})
    return messages