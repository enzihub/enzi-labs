import redis
from ..config import ActiveConfig
import json
import time
from datetime import datetime, date # Import datetime and date

# Simple in-memory cache for demonstration if Redis is not available
_simple_cache_store = {}

# Custom JSON encoder to handle datetime objects
def json_datetime_serializer(obj):
    """JSON serializer for objects not serializable by default json code"""
    if isinstance(obj, (datetime, date)):
        return obj.isoformat()
    raise TypeError (f"Type {type(obj)} not serializable")


class CacheService:
    def __init__(self):
        self.cache_type = ActiveConfig.CACHE_TYPE
        if self.cache_type == 'RedisCache':
            try:
                # Ensure decode_responses=False for binary storage if not handling complex types manually
                # However, since we are using json.dumps, decode_responses=True for strings is fine.
                self.redis_client = redis.StrictRedis.from_url(ActiveConfig.CACHE_REDIS_URL, decode_responses=True)
                self.redis_client.ping()
                print("Successfully connected to Redis for Cache.")
            except redis.exceptions.ConnectionError as e:
                print(f"Redis connection error for Cache: {e}. Falling back to SimpleCache.")
                self.cache_type = 'SimpleCache'
        else:
            print("Using SimpleCache (in-memory dictionary).")

    def get(self, key):
        print(f"[CACHE_GET] Key: {key}")
        if self.cache_type == 'RedisCache':
            value = self.redis_client.get(key)
            # If you stored datetimes as ISO strings, they will be retrieved as strings.
            # No special deserialization is strictly needed here unless you want to
            # convert them back to datetime objects immediately after fetching from cache.
            # For now, we assume the consumer (e.g., template) can handle ISO date strings.
            return json.loads(value) if value else None
        else: # SimpleCache
            entry = _simple_cache_store.get(key)
            if entry and entry['expiry'] > time.time():
                return entry['value']
            elif entry: # expired
                del _simple_cache_store[key]
            return None

    def set(self, key, value, timeout=300): # 5 minutes default timeout
        print(f"[CACHE_SET] Key: {key}, Timeout: {timeout}s")
        if self.cache_type == 'RedisCache':
            # Use the custom serializer for json.dumps
            serialized_value = json.dumps(value, default=json_datetime_serializer)
            self.redis_client.set(key, serialized_value, ex=timeout)
        else: # SimpleCache
            # If using simple cache, you might want to apply the same serialization
            # for consistency, or handle datetime objects directly if SimpleCache stores Python objects.
            # For simplicity with SimpleCache storing Python objects directly:
            _simple_cache_store[key] = {'value': value, 'expiry': time.time() + timeout}


    def delete(self, key):
        print(f"[CACHE_DELETE] Key: {key}")
        if self.cache_type == 'RedisCache':
            self.redis_client.delete(key)
        else: # SimpleCache
            if key in _simple_cache_store:
                del _simple_cache_store[key]

cache_service = CacheService()