import json
from datetime import datetime as dt
from typing import Optional
from uuid import UUID

# Maximum UNIX timestamp that fits into a signed 32 bit integer
MAX_UNIX_TIMESTAMP = 2 ** 31 - 1

def clamp_timestamp(value: Optional[int]) -> Optional[int]:
    """Clamp timestamp value to MAX_UNIX_TIMESTAMP."""
    if value is None:
        return None
    return min(int(value), MAX_UNIX_TIMESTAMP)


def calculate_usage_percent(used_traffic: int, data_limit: int) -> float:
    return (used_traffic * 100) / data_limit


def calculate_expiration_days(expire: int) -> int:
    return (dt.fromtimestamp(expire) - dt.utcnow()).days


def yml_uuid_representer(dumper, data):
    return dumper.represent_scalar('tag:yaml.org,2002:str', str(data))


class UUIDEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, UUID):
            # if the obj is uuid, we simply return the value of uuid
            return str(obj)
        return super().default(self, obj)
