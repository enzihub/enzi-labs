from flask import Flask
from .config import ActiveConfig
from .tasks import celery_app # Import celery_app instance

# This function will be used by Celery worker to initialize Flask app context if needed
# For this simple example, tasks don't directly use app context, but it's good practice.
def create_app(config_class=ActiveConfig):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Initialize extensions or blueprints here if you had them
    # e.g., db.init_app(app), mail.init_app(app)

    # Import and register blueprints (routes)
    # We'll define routes directly in main_app.py for simplicity in this example
    # but normally they'd be in a blueprints structure.

    # Make celery_app available via app context if needed by tasks
    app.celery_app = celery_app
    celery_app.conf.update(app.config) # Update Celery config with Flask app config

    return app

# If you run `flask run`, it might look for `app` or `create_app()`
# For Gunicorn, we'll point it to `app.main_app:app` or similar.
# This `__init__.py` mostly sets up structure. The main app logic is in main_app.py.