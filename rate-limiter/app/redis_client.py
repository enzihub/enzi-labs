import os
import redis.asyncio as redis
from functools import lru_cache

# Load from .env if you decide to use python-dotenv
# from dotenv import load_dotenv
# load_dotenv()

REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))
REDIS_DB = int(os.getenv("REDIS_DB", 0))

@lru_cache() # Ensure only one connection pool is created
def get_redis_pool():
    return redis.ConnectionPool(host=REDIS_HOST, port=REDIS_PORT, db=REDIS_DB, decode_responses=True)

async def get_redis_connection():
    pool = get_redis_pool()
    return redis.Redis(connection_pool=pool)

# Example usage (not part of the client, just for testing)
# async def test_redis():
#     r = await get_redis_connection()
#     await r.set("mykey", "hello")
#     value = await r.get("mykey")
#     print(value)
#     await r.close() # Not strictly necessary with connection pool

# if __name__ == "__main__":
#     import asyncio
#     asyncio.run(test_redis())