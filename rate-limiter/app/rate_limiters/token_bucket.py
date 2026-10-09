import time
from .base import RateLimiter

class TokenBucketLimiter(RateLimiter):
    def __init__(self, redis_client, capacity: int, refill_rate: int, refill_period: int):
        """
        Args:
            redis_client: An asynchronous Redis client instance.
            capacity: Maximum number of tokens the bucket can hold.
            refill_rate: Number of tokens added per refill_period.
            refill_period: How often (in seconds) tokens are refilled.
        """
        super().__init__(redis_client, limit=capacity, period=refill_period) # limit here is capacity
        self.refill_rate = refill_rate
        self.capacity = capacity

    async def is_allowed(self, key: str) -> tuple[bool, int, int, int]:
        current_time = self._get_current_timestamp()
        
        # Use a Redis hash to store tokens and last_refill_time for atomicity (or Lua script)
        # For simplicity here, we'll use two keys, but acknowledge potential race conditions
        # if not handled with MULTI/EXEC or Lua in a high-concurrency scenario.
        # However, individual Redis commands used here are atomic.

        token_key = f"token_bucket:{key}:tokens"
        last_refill_key = f"token_bucket:{key}:last_refill"

        # Atomically get both values if possible, or fetch separately
        # Using a pipeline for fetching
        pipe = self.redis.pipeline()
        pipe.get(token_key)
        pipe.get(last_refill_key)
        results = await pipe.execute()

        tokens_str, last_refill_time_str = results
        
        tokens = float(tokens_str) if tokens_str else self.capacity
        last_refill_time = int(last_refill_time_str) if last_refill_time_str else current_time

        # Refill tokens
        time_passed = current_time - last_refill_time
        if time_passed >= self.period: # Check if at least one refill period has passed
            # Calculate how many refill periods passed
            refill_periods_passed = time_passed // self.period
            tokens_to_add = refill_periods_passed * self.refill_rate
            tokens = min(self.capacity, tokens + tokens_to_add)
            last_refill_time = current_time # Or last_refill_time + refill_periods_passed * self.period

        if tokens >= 1:
            tokens -= 1
            allowed = True
            retry_after = 0
        else:
            allowed = False
            # Estimate time until next token is available
            time_to_next_refill = self.period - (current_time - last_refill_time) % self.period
            retry_after = time_to_next_refill if time_to_next_refill > 0 else self.period


        # Update Redis (ideally in a transaction)
        pipe = self.redis.pipeline()
        pipe.set(token_key, tokens)
        pipe.set(last_refill_key, last_refill_time)
        # Set expiry for keys to prevent them from living forever if unused
        # A bit longer than period to be safe
        key_expiry = self.period * (self.capacity // self.refill_rate + 2) if self.refill_rate > 0 else self.period * 2
        pipe.expire(token_key, key_expiry)
        pipe.expire(last_refill_key, key_expiry)
        await pipe.execute()

        return allowed, int(tokens), self.capacity, retry_after