# Scaling lab: a notes app that scales out

A small Flask notes app wired up the way a growing web service usually is. You log in with a number, write notes, and watch which parts of the stack serve each request.

![The notes app behind the load balancer](../docs/assets/scaling.png)

## What it shows

| Idea | Where it lives |
| --- | --- |
| Three stateless web nodes behind a round-robin balancer | `simple_load_balancer.py`, `docker-compose.yml` |
| Sessions kept in Redis, so any node can serve you | `app/services/session_store.py` |
| Read-through cache with invalidation on write | `app/services/cache_service.py` |
| Primary/replica read-write split (even user ids) | `app/models.py` |
| Sharding by `user_id` into `notes_shard_N` tables (odd user ids) | `app/models.py` |
| A fake CDN path for static files | `/static_cdn/...` route in `app/main_app.py` |
| Background jobs through Celery + Redis | `app/tasks.py` |

The replica and the shards are simulated inside one Postgres database. The point is to see the routing logic, not to run a real cluster.

## Run it

```bash
cp .env.example .env      # optional, every value has a local default
docker compose up --build
```

Open http://localhost:8000. Refresh a few times and the "Web Server Port" changes between 5001, 5002 and 5003 while you stay logged in. Log in as user `7` for the sharded path or `8` for the primary/replica path. Background jobs print to `docker compose logs -f worker`.

Stop with `docker compose down -v`.

## Config

| Variable | Default | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | empty (uses the bundled Postgres) | Point at your own Postgres instead |
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | `notes` | Credentials for the bundled local container |
| `SECRET_KEY` | random per start | Flask secret |
| `LB_PORT` | `8000` | Host port for the load balancer |
