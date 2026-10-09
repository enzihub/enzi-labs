from .base import RateLimiter

class FixedWindowCounterLimiter(RateLimiter):
    def __init__(self, redis_client, limit: int, window_seconds: int):
        super().__init__(redis_client, limit=limit, period=window_seconds)

    async def is_allowed(self, key: str) -> tuple[bool, int, int, int]:
        current_time = self._get_current_timestamp()
        # Key for the current window
        window_start_time = (current_time // self.period) * self.period
        redis_key = f"fixed_window:{key}:{window_start_time}"

        # Atomically increment and get current count
        # Also set expiry if it's a new key
        # LUA script is best for this, or a transaction
        
        # Simple approach with INCR and EXPIRE (less atomic for first hit)
        # A transaction (MULTI/EXEC) is better for setting EXPIRE only on first INCR
        current_count = await self.redis.incr(redis_key)
        
        if current_count == 1: # First hit in this window
            await self.redis.expire(redis_key, self.period)

        if current_count <= self.limit:
            allowed = True
            retry_after = 0
        else:
            allowed = False
            # Calculate time until next window
            retry_after = self.period - (current_time % self.period)
        
        remaining = self.limit - current_count if current_count <= self.limit else 0
        return allowed, remaining, self.limit, retry_after