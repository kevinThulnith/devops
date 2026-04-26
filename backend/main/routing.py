from django.urls import re_path
from . import consumers

# !WebSocket URL patterns for main app

websocket_urlpatterns = [re_path(r"ws/users/$", consumers.UserConsumer.as_asgi())]
