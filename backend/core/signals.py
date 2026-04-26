from .permissions import DepartmentPermissions, WorkshopPermissions, MachinePermissions
from .serializers import DepartmentSerializer, WorkshopSerializer, MachineSerializer
from backend.signals import create_model_change_signal
from .models import Department, Workshop, Machine

# TODO: Create signals fore core models

department_signal = create_model_change_signal(
    Department,
    DepartmentSerializer,
    "departments",
    "send_update",
    permission_class=DepartmentPermissions,
)

workshop_signal = create_model_change_signal(
    Workshop,
    WorkshopSerializer,
    "workshops",
    "send_update",
    permission_class=WorkshopPermissions,
)

machine_signal = create_model_change_signal(
    Machine,
    MachineSerializer,
    "machines",
    "send_update",
    permission_class=MachinePermissions,
)
