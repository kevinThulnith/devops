from backend.consumers import ConsumerBlock
from .permissions import (
    ManufacturingProcessPermission,
    ProductionSchedulePermission,
    ProductionLinePermission,
)


# TODO: Create consumer classes for production models


class ProductionLineConsumer(ConsumerBlock):
    group_name = "production_lines"
    permission_class = ProductionLinePermission

    @property
    def model_class(self):
        from .models import ProductionLine

        return ProductionLine


class ManufacturingProcessConsumer(ConsumerBlock):
    group_name = "manufacturing_processes"
    permission_class = ManufacturingProcessPermission

    @property
    def model_class(self):
        from .models import ManufacturingProcess

        return ManufacturingProcess


class ProductionScheduleConsumer(ConsumerBlock):
    group_name = "production_schedules"
    permission_class = ProductionSchedulePermission

    @property
    def model_class(self):
        from .models import ProductionSchedule

        return ProductionSchedule
