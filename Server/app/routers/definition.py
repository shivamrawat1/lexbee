from fastapi import APIRouter, Query
from app.services.definition import extract_definition
from app.schemas.definition import DefinitionResponse
from fastapi import HTTPException
from typing import Optional

router = APIRouter()


@router.get("/definition/{word}", tags=["definition"])
async def get_definition(
    word: str,
    context: Optional[str] = Query(
        default=None,
        description="Surrounding context (20 words before and after) to help disambiguate the word's meaning",
    ),
) -> DefinitionResponse:
    try:
        return extract_definition(word, context)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
