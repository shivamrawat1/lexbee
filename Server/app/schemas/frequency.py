from pydantic import BaseModel
from typing import Dict


class FrequencyResponse(BaseModel):
    frequencies: Dict[int, int]
