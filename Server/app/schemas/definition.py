from pydantic import BaseModel


class DefinitionResponse(BaseModel):
    word: str
    partOfSpeech: str
    definition: str
    example: str
