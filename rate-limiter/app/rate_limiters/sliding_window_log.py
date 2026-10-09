from .base import RateLimiter

class SlidingWindowLogLimiter(RateLimiter):
    def __init__(self, redis_client, limit: int, window_seconds: int):
        super().__init__(redis_client, limit=limit, period=window_seconds)

    async def is_allowed(self, key: str) -> tuple[bool, int, int, int]:
        current_time_ns = self._get_current_timestamp() * 1_000_000_000 # Nanoseconds for unique scores
        # Python time.time_ns() is also an option if available and preferred
        
        redis_key = f"sliding_log:{key}"
        window_start_boundary = (self._get_current_timestamp() - self.period) * 1_000_000_000

        # Use a Redis Sorted Set
        # Atomically perform operations using a transaction (pipeline in redis-py)
        async with self.redis.pipeline(transaction=True) as pipe:
            # 1. Remove outdated timestamps (older than window_start_boundary)
            pipe.zremrangebyscore(redis_key, '-inf', window_start_boundary -1) # -1 to be exclusive of boundary
            # 2. Add current request timestamp
            pipe.zadd(redis_key, {current_time_ns: current_time_ns})
            # 3. Get count of timestamps in the window
            pipe.zcard(redis_key)
            # 4. Set an expiry on the key if it's active
            pipe.expire(redis_key, self.period * 2) # Keep it alive a bit longer than the window

            results = await pipe.execute()
        
        # results[2] is the count from ZCARD
        current_count_in_window = results[2]

        if current_count_in_window <= self.limit:
            allowed = True
            retry_after = 0
        else:
            allowed = False
            # If denied, we might want to remove the timestamp we just added
            # This is a design choice, text says "timestamp remains in the log" for rejected requests
            # To remove: await self.redis.zrem(redis_key, current_time_ns)
            
            # Estimate retry_after: find the oldest timestamp in the current window
            # and calculate when it will fall out of the window.
            oldest_timestamps = await self.redis.zrange(redis_key, 0, 0, withscores=True)
            if oldest_timestamps:
                oldest_ts_ns = oldest_timestamps[0][1] # score is the timestamp
                retry_after = max(0, int(((oldest_ts_ns / 1_000_000_000) + self.period) - self._get_current_timestamp()))
            else: # Should not happen if count > limit, but as a fallback
                retry_after = self.period 
        
        remaining = self.limit - current_count_in_window if current_count_in_window <= self.limit else 0
        return allowed, remaining, self.limit, retry_after