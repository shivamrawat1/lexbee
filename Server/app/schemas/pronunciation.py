from pydantic import BaseModel


class PronunciationResponse(BaseModel):
    fileUrl: str
