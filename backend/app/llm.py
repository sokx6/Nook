from collections.abc import AsyncGenerator
from ollama import AsyncClient, Client
from app.schemas import ModelInfo

def list_ollama_models() -> list[ModelInfo]:
    try:
        resp = Client(host="http://localhost:11434").list()
        result_list =[]
        for m in resp.models:
            model_info = ModelInfo(
                id=f"ollama:{m.model}",
                name=m.model,
                provider="ollama",
                local=True
            )
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
    base_prompt = base or ("Your name is Nook and you are a helpful AI assistant running locally"+"Respond in the same language as the user.Be concise and helpful.")
    base_prompt += r"""Your name is Nook and you are a helpful AI assistant running locally.
                       Respond in the same language as the user.Be concise and helpful.
                           
                       【Mandatory Output Formatting Rules】
                        1. Mathematical Formulas
                           - Inline math formulas must be wrapped with single dollar signs. Example: $E=mc^2$, embedded within body paragraphs.
                           - Standalone block formulas must be wrapped with double dollar signs on a separate line. Example:
                             $$
                             \int_{-\infty}^{+\infty} e^{-x^2} dx = \sqrt{\pi}
                             $$
                           - Describing formulas in natural language is strictly prohibited. Do not use \( \), \[ \] or any other formula markers.
                              
                        2. Code and Commands
                           - All code, terminal commands and configuration content must be enclosed in triple-backtick fenced code blocks,
                             with the corresponding language specified at the start (e.g. python, bash, json, yaml).
                           - Using indentation or plain text as a substitute for fenced code blocks is prohibited.
                              
                        3. Document Structure
                           - Headings must strictly follow Markdown # level syntax (# for level 1, ## for level 2, ### for level 3).
                           - Levels must be nested consecutively; skipping heading levels is prohibited.
                           - Unordered lists must uniformly use the hyphen - marker. Ordered lists must use the "number." format.
                           - Nested lists must be indented by 4 spaces.
                           - Tables must use standard Markdown syntax. Separate headers from content with ---, and keep column count consistent per row.
                              
                        4. Text Formatting
                           - Use **content** for bold text and *content* for italic text.
                           - Do not use underscores or HTML tags for text emphasis.
                           - When Markdown syntax symbols such as $, #, *, `, _ appear in body text, they must be escaped with a backslash \.
                           - Leave one half-width space between Chinese text and English words / numbers.
                           - Separate different paragraphs with one blank line. Consecutive multiple blank lines are prohibited.
                              
                        5. Citations and Resources
                           - Quoted external content and reminder notes must start with > and form a separate paragraph.
                           - Web links must use the [link text](link URL) format. Images must use the ![image description](image path) format.
                           - Bare raw URLs in output are prohibited.
                              
                        Please generate content in strict compliance with all the formatting rules above.
                        """
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
    messages.append({"role": "user", "content": user_message})
    return messages

async def test(model_name: str) -> dict:
    models = list_ollama_models()
    print("Available Ollama Models:")
    for model in models:
        print(f"ID: {model['id']}, Name: {model['name']}, Provider: {model['provider']}, Local: {model['local']}")
    model = models[0]["id"] if models else "ollama:qwen2.5:1.5b"
    stream = stream_ollama(model, [{"role": "user", "content": "你现在是一个猫娘，请用猫娘的口吻回答我的问题。"}])
    async for part in stream:
        print(part, end="", flush=True)
        
if __name__ == "__main__":
    import asyncio
    asyncio.run(test("ollama:qwen2.5:1.5b"))


    
