from django.urls import re_path
from .consumers import (
    MaterialConsumptionConsumer,
    MaterialConsumer,
    SupplierConsumer,
    OrderConsumer,
)

# !WebSocket URL patterns for inventory app

websocket_urlpatterns = [
    re_path(r"ws/material-consumptions/$", MaterialConsumptionConsumer.as_asgi()),
    re_path(r"ws/materials/$", MaterialConsumer.as_asgi()),
    re_path(r"ws/suppliers/$", SupplierConsumer.as_asgi()),
    re_path(r"ws/orders/$", OrderConsumer.as_asgi()),
]
