"""Routes for the invented Pastry Shop demo API (sample input for Kryptonite)."""
from fastapi import APIRouter, HTTPException

from app.models import Pastry, Order

router = APIRouter()

MENU = {
    1: Pastry(id=1, name="Croissant", price_cents=350),
    2: Pastry(id=2, name="Cinnamon roll", price_cents=420),
}


@router.get("/menu")
async def list_menu() -> list[Pastry]:
    return list(MENU.values())


@router.get("/menu/{pastry_id}")
async def get_pastry(pastry_id: int) -> Pastry:
    if pastry_id not in MENU:
        raise HTTPException(status_code=404, detail="Not on the menu")
    return MENU[pastry_id]


@router.post("/orders")
async def place_order(order: Order) -> dict:
    total = sum(MENU[i].price_cents for i in order.pastry_ids if i in MENU)
    return {"customer": order.customer, "total_cents": total}


@router.delete("/orders/{order_id}")
async def cancel_order(order_id: int) -> dict:
    return {"cancelled": order_id}
