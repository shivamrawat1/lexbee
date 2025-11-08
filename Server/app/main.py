from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import wordnik, definition, frequency, pronunciation

app = FastAPI()

# Add CORS middleware to allow browser extension requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def health_check():
    return {"message": "OK"}


app.include_router(wordnik.router)
app.include_router(definition.router)
app.include_router(frequency.router)
app.include_router(pronunciation.router)
