#!/bin/bash
# Ensure this script is executable: chmod +x worker/run_worker.sh

# Navigate to the parent directory of 'app' so imports work correctly
cd "$(dirname "$0")/.." 

echo "Starting Celery worker..."
# The -A flag specifies the Celery application instance.
# 'app.tasks' refers to the tasks.py file within the app package.
# 'celery_app' is the name of the Celery application instance defined in tasks.py.
# -l info sets the log level.
# Adjust concurrency with -c if needed
celery -A app.tasks.celery_app worker -l info --pool=solo # Use solo pool for SQLite compatibility if tasks interact with DB