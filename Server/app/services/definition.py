from openai import OpenAI
from app.config import settings
from app.schemas.definition import DefinitionResponse
from typing import Optional

client = OpenAI(
    api_key=settings.GROQ_API_KEY,
    base_url="https://api.groq.com/openai/v1",
)


def extract_definition(word: str, context: Optional[str] = None) -> DefinitionResponse:
    # Build the user message based on whether context is provided
    if context:
        user_content = f"""Word: {word}

Context (surrounding text): {context}

Based on the context provided, determine the most appropriate definition, part of speech, and provide an example usage for this word. The context will help disambiguate the meaning when the word has multiple definitions."""
    else:
        user_content = f"Word: {word}"

    response = client.responses.parse(
        model="openai/gpt-oss-20b",
        temperature=0.0,
        input=[
            {
                "role": "system",
                "content": "Return the definition, part of speech, and example usage in a sentence for the given word. If context is provided, use it to determine the most appropriate meaning when the word has multiple definitions.",
            },
            {"role": "user", "content": user_content},
        ],
        text_format=DefinitionResponse,
    )

    return response.output_parsed
