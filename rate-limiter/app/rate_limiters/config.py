from typing import Dict, Any

# Rule format:
# "rule_name": {
#     "type": "token_bucket" | "leaking_bucket" | "fixed_window" | "sliding_window_log",
#     "params": { ... algorithm specific params ... }
# }

LIMITER_RULES: Dict[str, Dict[str, Any]] = {
    "general_token_bucket": {
        "type": "token_bucket",
        "params": {"capacity": 10, "refill_rate": 2, "refill_period": 1} # 2 tokens/sec, max 10
    },
    "strict_leaking_bucket": {
        "type": "leaking_bucket",
        "params": {"capacity": 5, "leak_rate_per_second": 0.5} # Max 5, 0.5 req/sec (1 every 2s)
    },
    "ip_fixed_window": {
        "type": "fixed_window",
        "params": {"limit": 100, "window_seconds": 3600} # 100 reqs/hour per IP
    },
    "user_sliding_log": {
        "type": "sliding_window_log",
        "params": {"limit": 5, "window_seconds": 60} # 5 reqs/min per user
    }
}

def get_limiter_config(rule_name: str) -> Dict[str, Any] | None:
    return LIMITER_RULES.get(rule_name)