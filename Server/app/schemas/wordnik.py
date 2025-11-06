from typing import List, Optional
from pydantic import BaseModel, HttpUrl


class ExampleUse(BaseModel):
    text: Optional[str] = None
    position: Optional[int] = None


class Citation(BaseModel):
    source: Optional[str] = None
    cite: Optional[str] = None


class Label(BaseModel):
    text: Optional[str] = None
    type: Optional[str] = None


class WordnikDefinitionResponse(BaseModel):
    id: Optional[str] = None
    partOfSpeech: Optional[str] = None
    attributionText: Optional[str] = None
    sourceDictionary: Optional[str] = None
    text: Optional[str] = None
    sequence: Optional[str] = None
    score: Optional[float] = None
    word: Optional[str] = None
    attributionUrl: Optional[HttpUrl] = None
    wordnikUrl: Optional[HttpUrl] = None
    citations: Optional[List[Citation]] = None
    exampleUses: Optional[List[ExampleUse]] = None
    labels: Optional[List[Label]] = None
    notes: Optional[List[str]] = None
    relatedWords: Optional[List[str]] = None
    textProns: Optional[List[str]] = None
