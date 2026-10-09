"""Settings for the invented Pastry Shop demo API (sample input for Kryptonite)."""
import os
from dataclasses import dataclass


@dataclass
class Settings:
    shop_name: str = os.getenv("SHOP_NAME", "Pastry Shop")
    database_url: str = os.getenv("DATABASE_URL", "")
    oven_api_key: str = os.getenv("OVEN_API_KEY", "")


def get_settings() -> Settings:
    return Settings()
