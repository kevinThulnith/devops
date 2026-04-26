from .permissions import LaborAllocationPermission, SkillMatrixPermission
from backend.consumers import ConsumerBlock

# TODO: Create consumer classes for labor models


class SkillMatrixConsumer(ConsumerBlock):
    group_name = "skill_matrices"
    permission_class = SkillMatrixPermission

    @property
    def model_class(self):
        from .models import SkillMatrix

        return SkillMatrix


class LaborAllocationConsumer(ConsumerBlock):
    group_name = "labor_allocations"
    permission_class = LaborAllocationPermission

    @property
    def model_class(self):
        from .models import LaborAllocation

        return LaborAllocation
