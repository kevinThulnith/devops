from .permissions import DepartmentPermissions, WorkshopPermissions, MachinePermissions
from backend.consumers import ConsumerBlock

# TODO: Create consumer classes for core models


class DepartmentConsumer(ConsumerBlock):
    group_name = "departments"
    permission_class = DepartmentPermissions

    @property
    def model_class(self):
        from .models import Department

        return Department


class WorkShopConsumer(ConsumerBlock):
    group_name = "workshops"
    permission_class = WorkshopPermissions

    @property
    def model_class(self):
        from .models import Workshop

        return Workshop


class MachineConsumer(ConsumerBlock):
    group_name = "machines"
    permission_class = MachinePermissions

    @property
    def model_class(self):
        from .models import Machine

        return Machine
