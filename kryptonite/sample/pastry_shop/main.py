"""Entry point for the invented Pastry Shop demo API."""
import uvicorn
from fastapi import FastAPI

from app.config import get_settings
from app.routes import router

app = FastAPI(title=get_settings().shop_name)
app.include_router(router)

if __name__ == "__main__":
    settings = get_settings()
    uvicorn.run(app, host="127.0.0.1", port=8000)
