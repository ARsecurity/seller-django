from urllib.parse import parse_qs
from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from rest_framework.authtoken.models import Token

@database_sync_to_async
def user_from_token(key):
    t = Token.objects.select_related("user").filter(key=key).first()
    return t.user if t else None

class NotificationConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        key = parse_qs(self.scope["query_string"].decode()).get("token", [""])[0]
        user = await user_from_token(key)
        if not user: return await self.close(code=4401)
        self.group = f"user_{user.id}"
        await self.channel_layer.group_add(self.group, self.channel_name)
        await self.accept()
    async def disconnect(self, code):
        if hasattr(self, "group"): await self.channel_layer.group_discard(self.group, self.channel_name)
    async def push(self, event): await self.send_json(event["data"])
