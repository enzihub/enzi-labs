import psycopg2
from psycopg2.extras import RealDictCursor # To get results as dictionaries
from .config import ActiveConfig
import logging
import os

logging.basicConfig(level=getattr(logging, ActiveConfig.LOG_LEVEL.upper(), logging.INFO))
logger = logging.getLogger(__name__)

# --- Helper to get DB connection (PostgreSQL) ---
def get_db_connection(db_url):
    if "dummyhost" in db_url:
        logger.error("Attempting to connect to a DUMMY database URL. Check the DATABASE_URL env var.")
        raise ConnectionError("Dummy database URL configured. Cannot connect.")
    try:
        conn = psycopg2.connect(db_url)
        logger.debug(f"Successfully connected to PostgreSQL: {db_url.split('@')[-1].split('/')[0]}")
        return conn
    except psycopg2.OperationalError as e:
        logger.error(f"Failed to connect to PostgreSQL: {db_url.split('@')[-1].split('/')[0]} - {e}")
        raise

# --- Schema Initialization (PostgreSQL) ---
def init_db_schema(conn, table_name="notes"):
    try:
        with conn.cursor() as cur:
            # Main notes table (also used for master/slave demo)
            cur.execute(f'''
                CREATE TABLE IF NOT EXISTS {table_name} (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL,
                    content TEXT NOT NULL,
                    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            # Index for faster lookups by user_id
            cur.execute(f"CREATE INDEX IF NOT EXISTS idx_{table_name}_user_id ON {table_name}(user_id);")

            # Session table (less critical for this demo if Redis is primary)
            # but can be kept for completeness or as an alternative
            cur.execute('''
                CREATE TABLE IF NOT EXISTS user_sessions (
                    session_key TEXT PRIMARY KEY,
                    user_id INTEGER,
                    data JSONB,
                    expires_at TIMESTAMPTZ
                )
            ''')
        conn.commit()
        logger.info(f"Schema initialized/verified for table '{table_name}' in PostgreSQL.")
    except Exception as e:
        conn.rollback()
        logger.error(f"Error initializing schema for table '{table_name}': {e}")
        raise

# --- Initialize schema on application startup (if DATABASE_URL is set) ---
# This will run when the models.py module is first imported.
# Be cautious with schema changes in a running production system.
# For a demo, this is convenient.
if ActiveConfig.DATABASE_URL and "dummyhost" not in ActiveConfig.DATABASE_URL:
    try:
        # Initialize the main 'notes' table (used for master/slave)
        conn_master = get_db_connection(ActiveConfig.DATABASE_URL_MASTER)
        init_db_schema(conn_master, table_name="notes") # Default table name
        conn_master.close()

        # Initialize tables for sharding simulation
        conn_shard_init = get_db_connection(ActiveConfig.SHARDED_DATABASE_URL)
        for i in range(ActiveConfig.NUM_DB_SHARDS):
            shard_table_name = f"{ActiveConfig.SHARD_TABLE_PREFIX}{i}"
            init_db_schema(conn_shard_init, table_name=shard_table_name)
        conn_shard_init.close()
        logger.info("All required PostgreSQL tables initialized/verified.")
    except Exception as e:
        logger.error(f"CRITICAL: Failed to initialize DB schemas on startup: {e}")
        # Depending on the app, you might want to exit or have a degraded mode
else:
    logger.warning("Skipping DB schema initialization as DATABASE_URL is not set.")


# --- Database Operations ---

# Master DB (Writes to the main 'notes' table)
def add_note_master(user_id, content):
    logger.info(f"[DB_WRITE_MASTER] user_id: {user_id}, content: '{content[:20]}...' to table 'notes'")
    conn = get_db_connection(ActiveConfig.DATABASE_URL_MASTER)
    try:
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO notes (user_id, content) VALUES (%s, %s) RETURNING id",
                (user_id, content)
            )
            note_id = cur.fetchone()[0]
            conn.commit()
            logger.info(f"Note {note_id} added to Postgres (table 'notes').")
            return note_id
    except Exception as e:
        conn.rollback()
        logger.error(f"Error in add_note_master: {e}")
        raise
    finally:
        if conn:
            conn.close()

# "Slave" DB (Reads from the main 'notes' table)
def get_notes_slave(user_id):
    logger.info(f"[DB_READ_SLAVE] user_id: {user_id} from table 'notes'")
    conn = get_db_connection(ActiveConfig.DATABASE_URL_SLAVE_1) # Points to same URL
    try:
        # Use RealDictCursor to get results as dictionaries
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                "SELECT id, user_id, content, created_at FROM notes WHERE user_id = %s ORDER BY created_at DESC",
                (user_id,)
            )
            notes = cur.fetchall()
            return notes # Already a list of dicts
    except Exception as e:
        logger.error(f"Error in get_notes_slave: {e}")
        # Fallback to master is less meaningful here as it's the same endpoint
        raise
    finally:
        if conn:
            conn.close()

# Sharded DB (Simulated using different tables in the same Postgres)
def get_shard_table_name(user_id):
    shard_num = user_id % ActiveConfig.NUM_DB_SHARDS
    return f"{ActiveConfig.SHARD_TABLE_PREFIX}{shard_num}"

def add_note_sharded(user_id, content):
    table_name = get_shard_table_name(user_id)
    logger.info(f"[DB_WRITE_SHARDED] user_id: {user_id} to table '{table_name}', content: '{content[:20]}...'")
    conn = get_db_connection(ActiveConfig.SHARDED_DATABASE_URL) # same connection
    try:
        with conn.cursor() as cur:
            # Note: SQL injection is a risk with f-strings for table names.
            # For a demo this is okay, but in prod use whitelisting or safer methods
            # if table names were dynamic beyond this fixed prefix.
            sql = f"INSERT INTO {table_name} (user_id, content) VALUES (%s, %s) RETURNING id"
            cur.execute(sql, (user_id, content))
            note_id = cur.fetchone()[0]
            conn.commit()
            logger.info(f"Note {note_id} added to Postgres (table '{table_name}').")
            return note_id
    except Exception as e:
        conn.rollback()
        logger.error(f"Error in add_note_sharded for table '{table_name}': {e}")
        raise
    finally:
        if conn:
            conn.close()

def get_notes_sharded(user_id):
    table_name = get_shard_table_name(user_id)
    logger.info(f"[DB_READ_SHARDED] user_id: {user_id} from table '{table_name}'")
    conn = get_db_connection(ActiveConfig.SHARDED_DATABASE_URL)
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            sql = f"SELECT id, user_id, content, created_at FROM {table_name} WHERE user_id = %s ORDER BY created_at DESC"
            cur.execute(sql, (user_id,))
            notes = cur.fetchall()
            return notes
    except Exception as e:
        logger.error(f"Error in get_notes_sharded for table '{table_name}': {e}")
        raise
    finally:
        if conn:
            conn.close()