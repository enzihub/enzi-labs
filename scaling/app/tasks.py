from celery import Celery
from .config import ActiveConfig
import time
import logging

logger = logging.getLogger(__name__)

# Configure Celery
# The first argument to Celery is the name of the current module.
# The broker argument specifies the URL of the message broker (Redis).
# The backend argument specifies the URL of the result backend (also Redis).
celery_app = Celery('tasks',
                    broker=ActiveConfig.CELERY_BROKER_URL,
                    backend=ActiveConfig.CELERY_RESULT_BACKEND)

celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],  # Ignore other content
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
)

@celery_app.task(name='app.tasks.log_activity')
def log_activity_task(user_id, action, details):
    # Simulate a task that takes some time, like writing to a complex logging system
    # or sending a notification.
    time.sleep(2) # Simulate work
    log_message = f"[ASYNC_LOG_METRIC] User {user_id} performed {action}. Details: {details}. Processed by Celery worker."
    logger.info(log_message)
    # In a real system, this might write to a separate log file, a metrics system, or a NoSQL DB.
    print(log_message) # Also print to worker console for visibility
    return {"status": "logged", "user_id": user_id, "action": action}

@celery_app.task(name='app.tasks.process_user_signup')
def process_user_signup_task(user_id, email):
    time.sleep(5) # Simulate sending welcome email, setting up profile, etc.
    log_message = f"[ASYNC_SIGNUP] Processed signup for user {user_id}, email: {email}. Welcome email 'sent'."
    logger.info(log_message)
    print(log_message)
    return {"status": "signup_processed", "user_id": user_id}