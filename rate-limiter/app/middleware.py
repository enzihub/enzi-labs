from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.responses import Response
import time

from .redis_client import get_redis_connection
from .rate_limiters import (
    TokenBucketLimiter, LeakingBucketLimiter,
    FixedWindowCounterLimiter, SlidingWindowLogLimiter,
    get_limiter_config
)

class RateLimitingMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, default_rule_name: str = "general_token_bucket"):
        super().__init__(app)
        self.default_rule_name = default_rule_name
        # In a real app, Redis client might be managed by FastAPI's lifespan events
        # For simplicity, we get it per request or share a global one if careful

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        # Determine the rule and key for this request
        # Example: Use a specific rule for a path, or default
        # Example: Key by IP address
        
        rule_name = request.scope.get("rate_limit_rule", self.default_rule_name)
        limiter_key_attr = request.scope.get("rate_limit_key_attr", "host") # "host" or "user_id" etc.

        if limiter_key_attr == "host" and request.client:
            key_value = request.client.host
        elif "user_id" in request.scope.get("auth", {}): # Example if you have auth middleware setting user_id
             key_value = request.scope["auth"]["user_id"]
        else:
            key_value = "anonymous" # Fallback key

        if not key_value: # Should not happen with client.host
             return await call_next(request)


        limiter_identifier = f"{rule_name}:{key_value}"
        rule_config = get_limiter_config(rule_name)

        if not rule_config:
            # No rule found, proceed without limiting or log an error
            print(f"Warning: Rate limit rule '{rule_name}' not found.")
            return await call_next(request)

        redis_client = await get_redis_connection()
        limiter = None
        params = rule_config["params"]

        if rule_config["type"] == "token_bucket":
            limiter = TokenBucketLimiter(redis_client, **params)
        elif rule_config["type"] == "leaking_bucket":
            limiter = LeakingBucketLimiter(redis_client, **params)
        elif rule_config["type"] == "fixed_window":
            limiter = FixedWindowCounterLimiter(redis_client, **params)
        elif rule_config["type"] == "sliding_window_log":
            limiter = SlidingWindowLogLimiter(redis_client, **params)
        
        if not limiter:
            print(f"Error: Could not instantiate limiter for rule '{rule_name}'.")
            return await call_next(request)

        allowed, current_val, limit_val, retry_after = await limiter.is_allowed(limiter_identifier)
        
        response_headers = {
            "X-RateLimit-Limit": str(limit_val),
            "X-RateLimit-Remaining": str(current_val if allowed else 0), # Or specific remaining logic
        }
        if retry_after > 0:
            response_headers["X-RateLimit-Retry-After"] = str(retry_after)


        if not allowed:
            # Add "Retry-After" according to HTTP spec (seconds or HTTP-date)
            # Here, retry_after is already in seconds
            response_headers["Retry-After"] = str(retry_after)
            return JSONResponse(
                status_code=429,
                content={"detail": f"Rate limit exceeded. Try again in {retry_after} seconds."},
                headers=response_headers
            )

        response = await call_next(request)
        # Add headers to successful responses too
        for k, v in response_headers.items():
            response.headers[k] = v
        
        # Note: redis_client is typically managed by the pool, no explicit close needed here.
        return response