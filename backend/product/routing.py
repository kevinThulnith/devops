from .consumers import ProductConsumer
from django.urls import re_path

# !Define WebSocket URL patterns for product app

websocket_urlpatterns = [re_path(r"ws/products/$", ProductConsumer.as_asgi())]
