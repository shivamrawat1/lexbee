from openai import OpenAI
from app.config import settings
from app.schemas.definition import DefinitionResponse

client = OpenAI(
    api_key=settings.GROQ_API_KEY,
    base_url="https://api.groq.com/openai/v1",
)


def extract_definition(word: str) -> DefinitionResponse:
    response = client.responses.parse(
        model="openai/gpt-oss-20b",
        input=[
            {
                "role": "system",
                "content": "Return the definition, part of speech, and example usage in a sentence for the given word.",
            },
            {"role": "user", "content": f"Word: {word}"},
        ],
        text_format=DefinitionResponse,
    )

    return response.output_parsed
