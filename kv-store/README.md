# Distributed key-value store lab

An in-memory simulator of a Dynamo-style key-value store. You add and remove nodes, take them down, and see where each key lands and whether reads and writes still reach quorum.

![Four nodes on the hash ring, a quorum read for user:ada](../docs/assets/kv-store.png)

## What it shows

- Consistent hashing with virtual nodes (5 per server) on an MD5 ring
- Replication to `N = 3` nodes from the key's preference list
- Write quorum `W = 2` and read quorum `R = 2`, with the highest version winning on read
- What happens when nodes go DOWN: writes and reads skip to the next healthy nodes, or fail when quorum can't be met

Change `N_REPLICAS`, `WRITE_QUORUM`, `READ_QUORUM` and `VIRTUAL_NODES_PER_SERVER` at the top of `main.py` and restart to try other trade-offs.

## Run it

```bash
python -m venv .venv && . .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --port 8000
```

Open http://localhost:8000 (API docs at `/docs`). Add three or four servers, PUT a few keys, then press "Set DOWN" on a node and try again.

Everything is in memory. There is no rebalancing when nodes join, no hinted handoff on recovery and no vector clocks. Those are the obvious next steps.
