from .permissions import BasePermissions, OrderPermission, MaterialConsumptionPermission
from .models import Material, Supplier, Order, MaterialConsumption
from backend.signals import create_model_change_signal

from .serializers import (
    MaterialConsumptionSerializer,
    MaterialSerializer,
    SupplierSerializer,
    OrderSerializer,
)

# TODO: Create signals for inventory models

material_signal = create_model_change_signal(
    Material,
    MaterialSerializer,
    "materials",
    "send_update",
    permission_class=BasePermissions,
)

supplier_signal = create_model_change_signal(
    Supplier,
    SupplierSerializer,
    "suppliers",
    "send_update",
    permission_class=BasePermissions,
)

order_signal = create_model_change_signal(
    Order,
    OrderSerializer,
    "orders",
    "send_update",
    permission_class=OrderPermission,
)

material_consumption_signal = create_model_change_signal(
    MaterialConsumption,
    MaterialConsumptionSerializer,
    "material_consumptions",
    "send_update",
    permission_class=MaterialConsumptionPermission,
)
