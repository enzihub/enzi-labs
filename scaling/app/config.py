import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or os.urandom(24).hex()

    # --- Database Configuration (PostgreSQL) ---
    # Set DATABASE_URL in .env (see .env.example). docker-compose.yml starts a
    # local Postgres and points DATABASE_URL at it, so no cloud database is needed.
    DATABASE_URL = os.environ.get('DATABASE_URL', '')
    if not DATABASE_URL and os.environ.get('POSTGRES_HOST'):
        # Build the URL from parts (this is what docker-compose.yml does)
        DATABASE_URL = "postgresql://{}:{}@{}:{}/{}".format(
            os.environ.get('POSTGRES_USER', ''), os.environ.get('POSTGRES_PASSWORD', ''),
            os.environ['POSTGRES_HOST'], os.environ.get('POSTGRES_PORT', '5432'),
            os.environ.get('POSTGRES_DB', ''))

    if not DATABASE_URL:
        print("!!! WARNING: DATABASE_URL is not set. Database operations will fail. !!!")
        # Fallback to a dummy value to prevent an immediate crash
        DATABASE_URL = "postgresql://dummyhost/dummydb"


    # For "master" writes - points to your main Postgres endpoint
    DATABASE_URL_MASTER = DATABASE_URL
    # For "slave" reads - same database here (a real setup would point at a read replica)
    DATABASE_URL_SLAVE_1 = DATABASE_URL

    # For sharding, we'll use the same DB connection but different table names
    # The base URL is the same URL.
    SHARDED_DATABASE_URL = DATABASE_URL # All shards connect to the same Postgres instance
    NUM_DB_SHARDS = 2 # Number of simulated shards (will be different tables)
    SHARD_TABLE_PREFIX = "notes_shard_" # e.g., notes_shard_0, notes_shard_1

    # --- Cache Configuration ---
    CACHE_TYPE = 'RedisCache'
    CACHE_REDIS_URL = os.environ.get('REDIS_URL') or 'redis://localhost:6379/0'

    # --- CDN Configuration ---
    CDN_URL_PREFIX = '/static_cdn'

    # --- Session Store (for stateless web tier) ---
    SESSION_REDIS_URL = os.environ.get('REDIS_URL') or 'redis://localhost:6379/1'

    # --- Message Queue (Celery) ---
    CELERY_BROKER_URL = os.environ.get('REDIS_URL') or 'redis://localhost:6379/2'
    CELERY_RESULT_BACKEND = os.environ.get('REDIS_URL') or 'redis://localhost:6379/2'

    # --- Multi-DC simulation ---
    # App instances simulate being in different logical data centers
    CURRENT_DATACENTER = os.environ.get('DATACENTER_ID') or 'dc1'

    # --- Logging ---
    LOG_LEVEL = 'INFO'

    WEB_SERVER_PORTS = [5001, 5002, 5003]

class DevelopmentConfig(Config):
    DEBUG = True

class ProductionConfig(Config):
    DEBUG = False
    LOG_LEVEL = 'WARNING'
    # Potentially override DATABASE_URL for prod if different
    # DATABASE_URL = os.environ.get('PROD_DATABASE_URL', Config.DATABASE_URL)


APP_ENV = os.environ.get('APP_ENV', 'development').lower()
if APP_ENV == 'production':
    ActiveConfig = ProductionConfig()
else:
    ActiveConfig = DevelopmentConfig()

print(f"--- Loaded {APP_ENV} configuration ---")
print(f"--- Current Datacenter Sim: {ActiveConfig.CURRENT_DATACENTER} ---")
if "dummyhost" in ActiveConfig.DATABASE_URL:
    print("--- WARNING: DATABASE_URL is not set. ---")