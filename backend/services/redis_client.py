import logging
from typing import Optional
from config import settings

logger = logging.getLogger(__name__)

class RedisService:
    def __init__(self):
        self.redis_client = None
        self._fallback_memory = {}
        try:
            import redis.asyncio as aioredis
            self.redis_client = aioredis.from_url(
                settings.REDIS_URL,
                encoding="utf-8",
                decode_responses=True,
                socket_connect_timeout=2
            )
        except Exception as e:
            logger.warning(f"Redis init warning: {e}. Operating in resilient fallback mode.")

    async def get(self, key: str) -> Optional[str]:
        if self.redis_client is not None:
            try:
                return await self.redis_client.get(key)
            except Exception:
                pass
        return self._fallback_memory.get(key)

    async def set_ex(self, key: str, seconds: int, value: str):
        if self.redis_client is not None:
            try:
                await self.redis_client.setex(key, seconds, value)
                return
            except Exception:
                pass
        self._fallback_memory[key] = value

    async def check_and_set_idempotency(self, event_id: str, ttl_seconds: int = 86400) -> bool:
        """Returns True if event_id is new, False if event_id is duplicate."""
        key = f"idempotency:{event_id}"
        if self.redis_client is not None:
            try:
                # SETNX returns True if key was set (new), False if key existed (duplicate)
                is_new = await self.redis_client.set(key, "1", ex=ttl_seconds, nx=True)
                return bool(is_new)
            except Exception:
                pass

        if key in self._fallback_memory:
            return False
        self._fallback_memory[key] = "1"
        return True

redis_service = RedisService()
