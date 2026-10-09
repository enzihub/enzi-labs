import time
from .base import RateLimiter

class LeakingBucketLimiter(RateLimiter):
    def __init__(self, redis_client, capacity: int, leak_rate_per_second: float):
        """
        Args:
            redis_client: An asynchronous Redis client instance.
            capacity: Max requests the bucket (queue) can hold.
            leak_rate_per_second: How many requests are processed (leaked) per second.
        """
        # Period is essentially 1 second for leak_rate_per_second
        super().__init__(redis_client, limit=capacity, period=1)
        self.capacity = capacity
        self.leak_rate_per_second = leak_rate_per_second
        self.leak_interval = 1.0 / leak_rate_per_second if leak_rate_per_second > 0 else float('inf')


    async def is_allowed(self, key: str) -> tuple[bool, int, int, int]:
        current_time = time.time() # Use float for more precision here
        
        # bucket_content: current number of items in bucket
        # last_leak_time: timestamp when the bucket last leaked
        bucket_key = f"leaking_bucket:{key}:content"
        last_leak_key = f"leaking_bucket:{key}:last_leak"

        pipe = self.redis.pipeline()
        pipe.get(bucket_key)
        pipe.get(last_leak_key)
        results = await pipe.execute()

        current_items_str, last_leak_time_str = results
        
        current_items = float(current_items_str) if current_items_str else 0.0
        last_leak_time = float(last_leak_time_str) if last_leak_time_str else current_time

        # Simulate leakage
        time_passed = current_time - last_leak_time
        leaked_items = time_passed * self.leak_rate_per_second
        current_items = max(0, current_items - leaked_items)
        last_leak_time = current_time # Update last leak time

        # Check if bucket has space
        if current_items < self.capacity:
            current_items += 1 # Add current request
            allowed = True
            retry_after = 0
            remaining_capacity = self.capacity - int(current_items)
        else:
            allowed = False
            # Estimate time until one slot frees up
            # Time for one item to leak if bucket is full
            retry_after = int(self.leak_interval) if self.leak_interval != float('inf') else 3600 # Default large if no leak
            remaining_capacity = 0


        pipe = self.redis.pipeline()
        pipe.set(bucket_key, current_items)
        pipe.set(last_leak_key, last_leak_time)
        key_expiry = int(self.capacity / self.leak_rate_per_second * 2) if self.leak_rate_per_second > 0 else 3600 * 24
        pipe.expire(bucket_key, key_expiry)
        pipe.expire(last_leak_key, key_expiry)
        await pipe.execute()

        return allowed, remaining_capacity, self.capacity, retry_after