from .consumers import ProjectConsumer, TaskConsumer
from django.urls import re_path

# !WebSocket routing for project app

websocket_urlpatterns = [
    re_path(r"ws/projects/$", ProjectConsumer.as_asgi()),
    re_path(r"ws/tasks/$", TaskConsumer.as_asgi()),
]
