from flask import Flask, request, jsonify, render_template, session, make_response, send_from_directory
from .config import ActiveConfig
from . import models
from .services.cache_service import cache_service
from .services.session_store import session_store
from .tasks import log_activity_task, process_user_signup_task # Import Celery tasks
import os
import logging
import random

# Create Flask app instance
app = Flask(__name__)
app.config.from_object(ActiveConfig)

# --- Logging and Metrics (Basic) ---
logging.basicConfig(level=getattr(logging, ActiveConfig.LOG_LEVEL.upper(), logging.INFO),
                    format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Simple request counter (in-memory, process-specific metric)
request_count = 0

# --- Before Request: Session Handling (Stateless Web Tier) ---
@app.before_request
def load_logged_in_user():
    global request_count
    request_count += 1
    logger.info(f"Request #{request_count} to {request.path} from {request.remote_addr}")

    session_id = request.cookies.get('notes_session_id')
    if session_id:
        user_session_data = session_store.get_session(session_id)
        if user_session_data and 'user_id' in user_session_data:
            session['user_id'] = user_session_data['user_id'] # Flask session (still cookie based but data from store)
            session['username'] = user_session_data.get('username', 'Guest')
            logger.debug(f"Session loaded for user_id: {session['user_id']}")
        else:
            # Invalid or expired session ID in cookie
            session.clear()
            logger.debug("Invalid or expired session ID from cookie.")
    else:
        session.clear()
        logger.debug("No session ID cookie found.")


# --- After Request: Setting Session Cookie ---
@app.after_request
def set_session_cookie(response):
    if 'session_id_to_set' in session:
        response.set_cookie('notes_session_id', session['session_id_to_set'], httponly=True, samesite='Lax')
        session.pop('session_id_to_set', None) # Clean up
        logger.debug(f"Session cookie set for {session.get('user_id')}")
    elif 'session_id_to_clear' in session:
        response.delete_cookie('notes_session_id')
        session.pop('session_id_to_clear', None)
        logger.debug("Session cookie cleared.")
    return response

# --- Routes ---
@app.route('/')
def index():
    user_id = session.get('user_id')
    username = session.get('username', 'Guest')
    notes = []
    db_strategy_used = "None (Not Logged In)"

    if user_id:
        # --- Cache Check ---
        cache_key = f"notes_user_{user_id}"
        cached_notes = cache_service.get(cache_key)
        if cached_notes is not None:
            notes = cached_notes
            db_strategy_used = "Cache"
            logger.info(f"Notes for user {user_id} served from CACHE.")
        else:
            # --- DB Read Strategy (Demonstrating Master/Slave and Sharding) ---
            # This logic could be more sophisticated (e.g., based on user flags, load)
            if user_id % 2 == 0: # Even user_ids use master/slave
                notes = models.get_notes_slave(user_id)
                db_strategy_used = "Master/Slave (Read from Slave)"
                logger.info(f"Notes for user {user_id} read from SLAVE DB.")
            else: # Odd user_ids use sharding
                notes = models.get_notes_sharded(user_id)
                db_strategy_used = "Sharded DB"
                logger.info(f"Notes for user {user_id} read from SHARDED DB.")
            
            if notes: # Only cache if notes were found
                cache_service.set(cache_key, notes, timeout=60) # Cache for 1 minute
    
    # Get the exposed host port from the environment variable
    exposed_host_port = os.environ.get('EXPOSED_HOST_PORT', 'N/A (Gunicorn internal: ' + request.environ.get('SERVER_PORT', 'N/A') + ')')

    return render_template('index.html',
                           notes=notes,
                           user_id=user_id,
                           username=username,
                           db_strategy_used=db_strategy_used,
                           current_datacenter=ActiveConfig.CURRENT_DATACENTER,
                           server_port=exposed_host_port, # Use the new variable
                           cdn_url_prefix=ActiveConfig.CDN_URL_PREFIX)

@app.route('/add_note', methods=['POST'])
def add_note():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"error": "Not logged in"}), 401

    content = request.form.get('content')
    if not content:
        return jsonify({"error": "Content cannot be empty"}), 400

    # --- DB Write Strategy ---
    note_id = None
    if user_id % 2 == 0: # Even user_ids use master/slave for writes (to master)
        note_id = models.add_note_master(user_id, content)
        logger.info(f"Note added for user {user_id} to MASTER DB.")
    else: # Odd user_ids use sharding for writes
        note_id = models.add_note_sharded(user_id, content)
        logger.info(f"Note added for user {user_id} to SHARDED DB.")

    # --- Cache Invalidation ---
    cache_key = f"notes_user_{user_id}"
    cache_service.delete(cache_key)
    logger.info(f"Cache invalidated for user {user_id} due to new note.")

    # --- Message Queue: Log activity asynchronously ---
    log_activity_task.delay(user_id, "add_note", {"note_id": note_id, "content_length": len(content)})
    logger.info(f"Async task 'log_activity' queued for user {user_id}, note add.")
    
    return jsonify({"message": "Note added successfully", "note_id": note_id})

@app.route('/login', methods=['POST'])
def login():
    # Simple login: just provide a user_id and username
    # In a real app, this would involve password hashing and verification
    user_id_str = request.form.get('user_id')
    username = request.form.get('username', f'User_{user_id_str}')

    if not user_id_str or not user_id_str.isdigit():
        return jsonify({"error": "Invalid User ID format"}), 400
    
    user_id = int(user_id_str)

    # Store session data in our session_store (Redis)
    session_id = session_store.create_session_id()
    session_data = {"user_id": user_id, "username": username, "login_time": "now"} # Add more data as needed
    session_store.save_session(session_id, session_data)
    
    # Set a flag to tell after_request to set the cookie
    session['session_id_to_set'] = session_id
    session['user_id'] = user_id # Also update Flask's session for current request context
    session['username'] = username

    # --- Message Queue: Simulate post-login processing ---
    process_user_signup_task.delay(user_id, f"{username.lower()}@example.com") # Simulate with a fake email
    logger.info(f"Async task 'process_user_signup' queued for user {user_id}.")

    logger.info(f"User {user_id} ({username}) logged in. Session ID: {session_id}")
    return jsonify({"message": f"Logged in as {username} (ID: {user_id})"})

@app.route('/logout', methods=['POST'])
def logout():
    session_id = request.cookies.get('notes_session_id')
    if session_id:
        session_store.delete_session(session_id)
    
    session.clear() # Clear Flask's session
    session['session_id_to_clear'] = True # Flag to delete cookie

    logger.info("User logged out.")
    return jsonify({"message": "Logged out successfully"})

# --- CDN Simulation ---
# Serve static files from a different path to simulate a CDN
@app.route(f'{ActiveConfig.CDN_URL_PREFIX}/<path:filename>')
def cdn_static(filename):
    logger.info(f"[CDN_SERVE] Serving '{filename}' from static folder via CDN path.")
    return send_from_directory(os.path.join(app.root_path, 'static'), filename)

# --- Automation / Health Check (Example) ---
@app.route('/health')
def health_check():
    # Could check DB connection, cache connection, etc.
    # For now, just a simple OK
    logger.debug("Health check requested.")
    return jsonify({"status": "healthy", "datacenter": ActiveConfig.CURRENT_DATACENTER, "requests_on_this_instance": request_count}), 200

# Single-server dev run: `python -m app.main_app` (schema is created on import by models.py)
if __name__ == '__main__':
    app.run(debug=True, port=5000, host='0.0.0.0')
