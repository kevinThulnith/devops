from .permissions import BasePermissions, OrderPermission, MaterialConsumptionPermission
from backend.consumers import ConsumerBlock

# TODO: Create consumer classes for inventory models


class MaterialConsumer(ConsumerBlock):
    group_name = "materials"
    permission_class = BasePermissions

    @property
    def model_class(self):
        from .models import Material

        return Material


class SupplierConsumer(ConsumerBlock):
    group_name = "suppliers"
    permission_class = BasePermissions

    @property
    def model_class(self):
        from .models import Supplier

        return Supplier


class OrderConsumer(ConsumerBlock):
    group_name = "orders"
    permission_class = OrderPermission

    @property
    def model_class(self):
        from .models import Order

        return Order


class MaterialConsumptionConsumer(ConsumerBlock):
    group_name = "material_consumptions"
    permission_class = MaterialConsumptionPermission

    @property
    def model_class(self):
        from .models import MaterialConsumption

        return MaterialConsumption
