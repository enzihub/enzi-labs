import hashlib
import bisect
from typing import List, Dict, Any, Tuple, Optional

from fastapi import FastAPI, HTTPException, Body, Path, Query
from pydantic import BaseModel
from fastapi.staticfiles import StaticFiles # For serving static files
from fastapi.responses import HTMLResponse  # For serving index.html at root
from fastapi.middleware.cors import CORSMiddleware # For CORS

# --- Configuration (Keep as is) ---
N_REPLICAS = 3
WRITE_QUORUM = 2
READ_QUORUM = 2
VIRTUAL_NODES_PER_SERVER = 5
if WRITE_QUORUM + READ_QUORUM <= N_REPLICAS:
    print(f"Warning: W ({WRITE_QUORUM}) + R ({READ_QUORUM}) <= N ({N_REPLICAS}). Strong consistency not guaranteed.")

# --- In-Memory Data Structures (Keep as is) ---
hash_ring: List[Tuple[int, str]] = []
server_to_virtual_nodes: Dict[str, List[int]] = {}
PHYSICAL_SERVER_STORAGE: Dict[str, Dict[str, Dict[str, Any]]] = {}
SERVER_STATUS: Dict[str, str] = {}

# --- Consistent Hashing Logic (Keep as is) ---
def get_hash(key: str) -> int:
    return int(hashlib.md5(key.encode('utf-8')).hexdigest(), 16)

def add_server_to_ring(server_id: str):
    if server_id in server_to_virtual_nodes:
        raise HTTPException(status_code=400, detail=f"Server {server_id} already exists.")
    server_to_virtual_nodes[server_id] = []
    PHYSICAL_SERVER_STORAGE[server_id] = {}
    SERVER_STATUS[server_id] = "UP"
    for i in range(VIRTUAL_NODES_PER_SERVER):
        virtual_node_id = f"{server_id}_vnode{i}"
        h = get_hash(virtual_node_id)
        bisect.insort(hash_ring, (h, server_id)) # (hash_value, physical_server_id)
        server_to_virtual_nodes[server_id].append(h)
    print(f"Added server {server_id}. Ring size: {len(hash_ring)}")

def remove_server_from_ring(server_id: str):
    if server_id not in server_to_virtual_nodes:
        raise HTTPException(status_code=404, detail=f"Server {server_id} not found.")
    for h_val in server_to_virtual_nodes[server_id]:
        hash_ring[:] = [item for item in hash_ring if not (item[0] == h_val and item[1] == server_id)]
    del server_to_virtual_nodes[server_id]
    if server_id in PHYSICAL_SERVER_STORAGE: del PHYSICAL_SERVER_STORAGE[server_id]
    if server_id in SERVER_STATUS: del SERVER_STATUS[server_id]
    print(f"Removed server {server_id}. Ring size: {len(hash_ring)}")

def get_preference_list(key: str, count: int) -> List[str]:
    if not hash_ring: return []
    key_hash = get_hash(key)
    idx = bisect.bisect_right(hash_ring, (key_hash, ''))
    preference_nodes = []
    seen_physical_nodes = set()
    for i in range(len(hash_ring)):
        current_idx = (idx + i) % len(hash_ring)
        _h, physical_server_id = hash_ring[current_idx]
        if physical_server_id not in seen_physical_nodes and SERVER_STATUS.get(physical_server_id) == "UP":
            preference_nodes.append(physical_server_id)
            seen_physical_nodes.add(physical_server_id)
            if len(preference_nodes) == count: break
    if len(preference_nodes) < count: # Simplified Sloppy Quorum
        all_up_nodes = [s_id for s_id, status in SERVER_STATUS.items() if status == "UP"]
        for node_id in all_up_nodes:
            if node_id not in seen_physical_nodes:
                preference_nodes.append(node_id)
                seen_physical_nodes.add(node_id)
                if len(preference_nodes) == count: break
    return preference_nodes

# --- FastAPI App ---
app = FastAPI(title="Simple Distributed Key-Value Store Demo")

# --- CORS Middleware (Allow all for simplicity in demo) ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allows all origins
    allow_credentials=True,
    allow_methods=["*"], # Allows all methods
    allow_headers=["*"], # Allows all headers
)

# --- Pydantic Models (Keep Item, ServerInfo, ServerStatusUpdate as is) ---
class Item(BaseModel): value: Any
class ServerInfo(BaseModel): server_id: str
class ServerStatusUpdate(BaseModel): status: str

# --- NEW Pydantic Models for UI Details ---
class ServerUIDetail(BaseModel):
    server_id: str
    status: str
    data: Dict[str, Dict[str, Any]] # {key: {value: ..., version: ...}}
    virtual_node_hashes: List[int]

class AllServersDetailsResponse(BaseModel):
    servers: List[ServerUIDetail]
    hash_ring_tuples: List[Tuple[int, str]] # List of (hash, server_id) for all virtual nodes

# --- API Endpoints (Keep existing PUT/GET /kv, POST/DELETE /servers, PUT /servers/status as is) ---
@app.post("/servers/", status_code=201, summary="Add a new server to the ring")
def add_server(server_info: ServerInfo):
    add_server_to_ring(server_info.server_id)
    return {"message": f"Server {server_info.server_id} added."}

@app.delete("/servers/{server_id}", status_code=200, summary="Remove a server from the ring")
def remove_server_api(server_id: str = Path(..., description="ID of the server to remove")):
    remove_server_from_ring(server_id) # Renamed to avoid conflict with function name
    return {"message": f"Server {server_id} removed."}

@app.put("/servers/{server_id}/status", status_code=200, summary="Update server status (UP/DOWN)")
def update_server_status(server_status_update: ServerStatusUpdate,
                         server_id: str = Path(..., description="ID of the server")):
    if server_id not in SERVER_STATUS:
        raise HTTPException(status_code=404, detail=f"Server {server_id} not found.")
    if server_status_update.status not in ["UP", "DOWN"]:
        raise HTTPException(status_code=400, detail="Status must be 'UP' or 'DOWN'.")
    SERVER_STATUS[server_id] = server_status_update.status
    return {"message": f"Server {server_id} status set to {server_status_update.status}."}

# Endpoint to inspect data on a single server (useful for debugging, can be kept)
@app.get("/servers/{server_id}/data", summary="Inspect data on a specific server (for debugging)")
def get_server_data(server_id: str = Path(..., description="ID of the server")):
    if server_id not in PHYSICAL_SERVER_STORAGE:
        raise HTTPException(status_code=404, detail=f"Server {server_id} not found or no data.")
    return {
        "server_id": server_id,
        "status": SERVER_STATUS.get(server_id),
        "data": PHYSICAL_SERVER_STORAGE.get(server_id, {})
    }

@app.put("/kv/{key}", summary="Store a key-value pair")
def put_key_value(key: str, item: Item):
    if not hash_ring:
        raise HTTPException(status_code=503, detail="No servers available in the ring.")
    target_servers = get_preference_list(key, N_REPLICAS)
    if len(target_servers) < WRITE_QUORUM:
        raise HTTPException(status_code=503, detail=f"Not enough UP servers ({len(target_servers)}) to meet write quorum ({WRITE_QUORUM}) for key '{key}'.")
    acks = 0
    max_existing_version = 0
    for server_id_check in target_servers: # Check only targeted UP nodes for existing version
        if SERVER_STATUS.get(server_id_check) == "UP" and key in PHYSICAL_SERVER_STORAGE.get(server_id_check, {}):
            max_existing_version = max(max_existing_version, PHYSICAL_SERVER_STORAGE[server_id_check][key].get("version",0))
    new_version = max_existing_version + 1
    written_to_nodes = []
    for server_id in target_servers: # Write only to targeted UP nodes
        if SERVER_STATUS.get(server_id) == "UP":
            PHYSICAL_SERVER_STORAGE[server_id][key] = {"value": item.value, "version": new_version}
            acks += 1
            written_to_nodes.append(server_id)
            if acks >= WRITE_QUORUM: break
    if acks >= WRITE_QUORUM:
        return {"message": f"Key '{key}' stored successfully on nodes {written_to_nodes} with version {new_version}. Write quorum ({WRITE_QUORUM}) met with {acks} ACKs."}
    else:
        raise HTTPException(status_code=500, detail=f"Failed to store key '{key}'. Only {acks} ACKs received, write quorum ({WRITE_QUORUM}) not met.")

@app.get("/kv/{key}", summary="Retrieve a value by key")
def get_key_value(key: str):
    if not hash_ring:
        raise HTTPException(status_code=503, detail="No servers available in the ring.")
    target_servers = get_preference_list(key, N_REPLICAS)
    if len(target_servers) < READ_QUORUM:
         raise HTTPException(status_code=503, detail=f"Not enough UP servers ({len(target_servers)}) to meet read quorum ({READ_QUORUM}) for key '{key}'.")
    responses = []
    nodes_contacted = []
    for server_id in target_servers: # Read only from targeted UP nodes
        if SERVER_STATUS.get(server_id) == "UP":
            nodes_contacted.append(server_id)
            if key in PHYSICAL_SERVER_STORAGE.get(server_id, {}):
                data_item = PHYSICAL_SERVER_STORAGE[server_id][key]
                responses.append({"value": data_item["value"], "version": data_item["version"], "server_id": server_id})
    if len(responses) < READ_QUORUM:
        raise HTTPException(status_code=404, detail=f"Key '{key}' not found on enough replicas to satisfy read quorum ({READ_QUORUM}). Found on {len(responses)} of {nodes_contacted} UP nodes.")
    if not responses:
         raise HTTPException(status_code=404, detail=f"Key '{key}' not found on any contacted UP nodes.")
    latest_response = max(responses, key=lambda x: x["version"])
    return {"key": key, "value": latest_response["value"], "version": latest_response["version"], "read_from_server": latest_response["server_id"], "message": f"Read quorum ({READ_QUORUM}) met. {len(responses)} responses received from {nodes_contacted}."}


# --- NEW Endpoint for UI ---
@app.get("/ui/details", response_model=AllServersDetailsResponse, summary="Get all server details for UI")
def get_ui_details():
    server_details_list = []
    for server_id, vnode_hashes in server_to_virtual_nodes.items():
        server_details_list.append(
            ServerUIDetail(
                server_id=server_id,
                status=SERVER_STATUS.get(server_id, "UNKNOWN"),
                data=PHYSICAL_SERVER_STORAGE.get(server_id, {}),
                virtual_node_hashes=sorted(vnode_hashes) # Sorted for consistent display
            )
        )
    # Sort physical servers by ID for consistent UI listing
    server_details_list.sort(key=lambda s: s.server_id)
    
    # The hash_ring is already sorted by hash value
    return AllServersDetailsResponse(
        servers=server_details_list,
        hash_ring_tuples=list(hash_ring) # Send a copy
    )

# --- Serve Static Files for UI ---
# Create a 'static' folder in the same directory as main.py
# Put your index.html, script.js, style.css in 'static/'
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/", response_class=HTMLResponse, include_in_schema=False)
async def read_root_ui():
    try:
        with open("static/index.html") as f:
            return HTMLResponse(content=f.read(), status_code=200)
    except FileNotFoundError:
        return HTMLResponse(content="<h1>UI not found. Place index.html in static folder.</h1>", status_code=404)


if __name__ == "__main__":
    import uvicorn
    # add_server_to_ring("serverA") # Example pre-population
    # add_server_to_ring("serverB")
    # add_server_to_ring("serverC")
    uvicorn.run(app, host="0.0.0.0", port=8000)