from .consumers import DepartmentConsumer, WorkShopConsumer, MachineConsumer
from django.urls import re_path

# !Routings for core app

websocket_urlpatterns = [
    re_path(r"ws/departments/$", DepartmentConsumer.as_asgi()),
    re_path(r"ws/workshops/$", WorkShopConsumer.as_asgi()),
    re_path(r"ws/machines/$", MachineConsumer.as_asgi()),
]
