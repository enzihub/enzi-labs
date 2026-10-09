"""Data models for the invented Pastry Shop demo API."""
from pydantic import BaseModel


class Pastry(BaseModel):
    id: int
    name: str
    price_cents: int


class Order(BaseModel):
    customer: str
    pastry_ids: list[int]


def format_price(cents: int) -> str:
    return f"${cents / 100:.2f}"
