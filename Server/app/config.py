from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    WORDNIK_API_KEY: str = ""
    WORDNIK_BASE_URL: str = "https://api.wordnik.com/v4/"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
