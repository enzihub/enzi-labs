import redis
import json
import uuid
from ..config import ActiveConfig

class SessionStore:
    def __init__(self):
        try:
            self.redis_client = redis.StrictRedis.from_url(ActiveConfig.SESSION_REDIS_URL, decode_responses=True)
            self.redis_client.ping()
            print("Successfully connected to Redis for Session Store.")
        except redis.exceptions.ConnectionError as e:
            print(f"Redis connection error for Session Store: {e}. Sessions will not persist effectively.")
            self.redis_client = None # Or fallback to a less effective mechanism

    def create_session_id(self):
        return str(uuid.uuid4())

    def get_session(self, session_id):
        if not self.redis_client: return {}
        print(f"[SESSION_GET] ID: {session_id}")
        session_data_json = self.redis_client.get(f"session:{session_id}")
        return json.loads(session_data_json) if session_data_json else {}

    def save_session(self, session_id, data, timeout=3600): # 1 hour
        if not self.redis_client: return
        print(f"[SESSION_SAVE] ID: {session_id}")
        self.redis_client.set(f"session:{session_id}", json.dumps(data), ex=timeout)

    def delete_session(self, session_id):
        if not self.redis_client: return
        print(f"[SESSION_DELETE] ID: {session_id}")
        self.redis_client.delete(f"session:{session_id}")

session_store = SessionStore()