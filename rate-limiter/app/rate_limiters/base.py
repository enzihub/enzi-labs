from abc import ABC, abstractmethod
import time

class RateLimiter(ABC):
    def __init__(self, redis_client, limit: int, period: int):
        """
        Args:
            redis_client: An asynchronous Redis client instance.
            limit: Max requests allowed.
            period: Time window in seconds.
        """
        self.redis = redis_client
        self.limit = limit
        self.period = period # Also known as window_size or refill_period

    @abstractmethod
    async def is_allowed(self, key: str) -> tuple[bool, int, int, int]:
        """
        Checks if a request identified by 'key' is allowed.

        Args:
            key: A unique identifier for the entity being rate-limited (e.g., user_id, ip_address).

        Returns:
            A tuple: (allowed: bool, current_count: int, limit: int, retry_after_seconds: int)
            current_count can be tokens remaining for token bucket, or requests made for window counters.
            retry_after_seconds is 0 if allowed, or seconds to wait if denied.
        """
        pass

    def _get_current_timestamp(self) -> int:
        return int(time.time())