from .permissions import LaborAllocationPermission, SkillMatrixPermission
from .serializers import SkillMatrixSerializer, LaborAllocationSerializer
from backend.signals import create_model_change_signal
from .models import SkillMatrix, LaborAllocation

# TODO: Create signals for labor models

skill_matrix_signal = create_model_change_signal(
    SkillMatrix,
    SkillMatrixSerializer,
    "skill_matrices",
    "send_update",
    permission_class=SkillMatrixPermission,
)

labor_allocation_signal = create_model_change_signal(
    LaborAllocation,
    LaborAllocationSerializer,
    "labor_allocations",
    "send_update",
    permission_class=LaborAllocationPermission,
)
