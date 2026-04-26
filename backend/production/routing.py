from django.urls import re_path
from .consumers import (
    ManufacturingProcessConsumer,
    ProductionScheduleConsumer,
    ProductionLineConsumer,
)

# !Define WebSocket URL patterns for production app

websocket_urlpatterns = [
    re_path(r"ws/production-lines/$", ProductionLineConsumer.as_asgi()),
    re_path(r"ws/production-schedules/$", ProductionScheduleConsumer.as_asgi()),
    re_path(r"ws/manufacturing-processes/$", ManufacturingProcessConsumer.as_asgi()),
]
