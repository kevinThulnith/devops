from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
import json


# ? Dummy view object for permission checks
class DummyView:
    pass


# ? Dummy request object for permission checks
class DummyRequest:
    def __init__(self, user):
        self.user = user
        self.method = "GET"  # WebSocket updates are read-only


class ConsumerBlock(AsyncWebsocketConsumer):
    "Base consumer class for WebSocket consumers with permission checks."

    # !Essential
    group_name = None
    permission_class = None

    async def connect(self):
        if not self.group_name:
            raise ValueError("group name must be set in the subclass")

        # Accept first so we can receive the auth message
        await self.accept()

    async def disconnect(self, close_code):
        if self.group_name:
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data):
        # If already authenticated, ignore further client messages
        if hasattr(self, "user"):
            return

        # First message must be the auth handshake
        try:
            data = json.loads(text_data)
        except json.JSONDecodeError:
            await self.close(code=4001)
            return

        if data.get("type") != "authenticate":
            await self.close(code=4001)
            return

        token = data.get("token")
        if not token:
            await self.close(code=4001)
            return

        from backend.middleware import get_user

        user = await get_user(token)
        if not user.is_authenticated:
            await self.close(code=4001)
            return

        self.user = user
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.send(
            text_data=json.dumps(
                {
                    "type": "connection_established",
                    "message": f"You are now connected to the live {self.group_name} feed.",
                }
            )
        )

    @database_sync_to_async
    def check_object_permission(self, obj):
        """
        Use DRF permission class's has_object_permission method.
        Reuses exact same logic as REST API views.
        """
        if not self.permission_class:
            return True

        permission = self.permission_class()
        request = DummyRequest(self.user)
        view = DummyView()

        return permission.has_object_permission(request, view, obj)

    async def send_update(self, event):
        """
        Send updates to WebSocket with permission filtering.
        Override in subclasses for custom object fetching logic.
        """
        payload = event["payload"]

        # If no permission class or no filtering needed, send to everyone
        if not self.permission_class or not payload.get("requires_filtering"):
            await self.send(text_data=json.dumps(payload))
            return

        # Get instance_id and fetch object
        instance_id = payload.get("instance_id")
        if not instance_id:
            await self.send(text_data=json.dumps(payload))
            return

        # Fetch object and check permissions
        obj = await self.get_object(instance_id)
        if obj and await self.check_object_permission(obj):
            await self.send(text_data=json.dumps(payload))

    @database_sync_to_async
    def get_object(self, object_id):
        """
        Fetch object by ID. Override this method in subclasses
        or set model_class attribute for automatic fetching.
        """
        if not hasattr(self, "model_class") or not self.model_class:
            return None

        try:
            return self.model_class.objects.get(id=object_id)
        except self.model_class.DoesNotExist:
            return None