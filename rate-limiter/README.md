# Rate limiter lab

Four rate-limiting algorithms as FastAPI middleware, with their state in Redis so several app instances share one limit.

![A burst of requests hitting the token bucket and getting 429s](../docs/assets/rate-limiter-429.png)

## Algorithms

| Endpoint | Algorithm | Rule |
| --- | --- | --- |
| `GET /token-bucket` | Token bucket | 10 tokens, refills 2 per second |
| `GET /leaky-bucket` | Leaking bucket | queue of 5, drains 1 every 2 s |
| `GET /fixed-window` | Fixed window counter | 100 per hour per IP |
| `GET /sliding-window` | Sliding window log | 5 per minute per user |
| `GET /rules` | – | lists every rule |

Rules live in `app/rate_limiters/config.py`. Every response carries `X-RateLimit-Limit` and `X-RateLimit-Remaining`. A blocked request gets `429 Too Many Requests` with `Retry-After`.

## Run it

```bash
docker run -d --name rl-redis -p 6379:6379 redis:7-alpine
python -m venv .venv && . .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --port 8000
./demo.sh                 # fires 19 requests and prints what came back
```

The screenshot above is real output from `demo.sh`: ten requests pass, the bucket runs dry, four get a 429, and after two seconds of refill the next five pass again.

## Config

| Variable | Default |
| --- | --- |
| `REDIS_HOST` | `localhost` |
| `REDIS_PORT` | `6379` |
| `REDIS_DB` | `0` |

The token bucket reads and writes two keys without a Lua script, so a very busy key can race. That is noted in the code and left as an exercise.
