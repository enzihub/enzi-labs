# URL shortener lab

A Next.js app that turns long links into short ones. Each new URL gets the next numeric id, which is encoded in base62 (`0-9a-zA-Z`) to make the short code.

![Shortening a long link](../docs/assets/url-shortener.png)

## What it shows

- `POST /api/shorten` takes `{ "longUrl": "..." }` and returns the short URL. The same long URL always gets the same code back.
- `GET /<code>` looks the code up and redirects, or shows a 404 page.
- `lib/base62.ts` does the id-to-code conversion. `lib/data.ts` is the store.

The store is an array in memory, so links vanish on restart. Swapping it for Postgres or Redis is the natural next step.

## Run it

```bash
npm install
npm run dev               # or: npm run build && npm start
```

Open http://localhost:3000.

```bash
curl -s -X POST localhost:3000/api/shorten \
  -H 'content-type: application/json' \
  -d '{"longUrl":"https://example.com/a/very/long/path"}'
# {"shortUrl":"http://localhost:3000/1","originalUrl":"https://example.com/a/very/long/path"}
```

## Config

| Variable | Default | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_BASE_URL` | empty (uses the request origin) | Base used when building short links |
