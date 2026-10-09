#!/bin/bash
# Ensure this script is executable: chmod +x run_web_servers.sh

cd "$(dirname "$0")" # Navigate to script's directory

PORTS=(5001 5002 5003) # Match ports in config.py for consistency if needed

echo "Starting multiple Gunicorn web server instances..."
echo "Access them individually on localhost:PORT or via simple_load_balancer.py on port 8000."

for PORT in "${PORTS[@]}"; do
  echo "Starting server on port $PORT..."
  # Use gunicorn to run the Flask app. `app.main_app:app` points to the Flask 'app' instance in main_app.py
  # Ensure Gunicorn is installed: pip install gunicorn
  # The APP_MODULE environment variable helps Celery find the app if tasks need app context.
  # We set DATACENTER_ID to simulate different instances potentially being in different DCs (or AZs)
  DATACENTER_ID="dc${PORT: -1}" APP_ENV=development gunicorn --workers 1 --bind 0.0.0.0:$PORT app.main_app:app --log-level info --access-logfile - --error-logfile - &
done

echo "All server instances launched. Press Ctrl+C to stop this script (will not stop servers)."
echo "To stop servers, use: pkill gunicorn"
wait