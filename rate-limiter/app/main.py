from fastapi import FastAPI, Request, Depends

from .middleware import RateLimitingMiddleware
from .rate_limiters.config import LIMITER_RULES # To see available rules

app = FastAPI()

# Add the middleware
# You can set a default rule, or override it per endpoint
app.add_middleware(RateLimitingMiddleware, default_rule_name="general_token_bucket")


# --- Helper to set rule per endpoint ---
# This is a bit of a hack for demo purposes to set rule via Depends
# A more robust way might involve custom route classes or inspecting endpoint metadata
def set_rate_limit_rule(rule_name: str):
    async def _set_rule(request: Request):
        request.scope["rate_limit_rule"] = rule_name
    return _set_rule

# --- Endpoints ---

@app.get("/token-bucket")
async def read_root():
    return {"message": "Hello, this endpoint uses the default rate limit (general_token_bucket)."}

@app.get("/leaky-bucket", dependencies=[Depends(set_rate_limit_rule("strict_leaking_bucket"))])
async def leaky_endpoint():
    return {"message": "This endpoint uses the 'strict_leaking_bucket' rule."}

@app.get("/fixed-window", dependencies=[Depends(set_rate_limit_rule("ip_fixed_window"))])
async def fixed_window_endpoint():
    # Keyed by IP by default in middleware if not overridden
    return {"message": "This endpoint uses the 'ip_fixed_window' rule (per IP)."}

@app.get("/sliding-window", dependencies=[Depends(set_rate_limit_rule("user_sliding_log"))])
async def sliding_log_endpoint(request: Request):
    # For this one, let's pretend we have a user_id for the key
    # In a real app, an auth middleware would set this
    request.scope["auth"] = {"user_id": "user123"} # Mocking user_id
    request.scope["rate_limit_key_attr"] = "user_id"
    return {"message": "This endpoint uses the 'user_sliding_log' rule for 'user123'."}

@app.get("/sliding-ip", dependencies=[Depends(set_rate_limit_rule("user_sliding_log"))])
async def sliding_log_ip_endpoint():
    # This will use 'user_sliding_log' rule but key by IP
    return {"message": "This endpoint uses 'user_sliding_log' rule but keyed by IP."}

@app.get("/rules")
async def list_rules():
    return {"available_rules": LIMITER_RULES}

if __name__ == "__main__":
    import uvicorn
    # This is for running directly, e.g., python app/main.py
    # Better to use: uvicorn app.main:app --reload
    uvicorn.run(app, host="0.0.0.0", port=8000)