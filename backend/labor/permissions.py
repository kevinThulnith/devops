from core.permissions import PermissionBlock, SAFE_METHODS

# TODO: Create labor model permissions.


class LaborAllocationPermission(PermissionBlock):
    """
    Labor Allocation Permission
    - Admins: Full CRUD Access
    - Managers: labor allocations related to their projects
    - Operators: Read-only access to their own labor allocations
    - Supervisors: Read-only access to all labor allocations managed by managers in own department
    """

    def has_permission(self, request, view):
        if super().has_permission(request, view):
            return True

        user = request.user

        if user.role in ["MANAGER", "SUPERVISOR"]:
            return view.action != "destroy"

        if request.method in SAFE_METHODS:
            return user.role not in ["ADMIN", "SUPERVISOR"]

        return False

    def has_object_permission(self, request, view, obj):
        if super().has_object_permission(request, view, obj):
            return True

        user = request.user

        if user.role == "MANAGER":
            return obj.project and obj.project.project_manager == user

        if user.role == "OPERATOR":
            return obj.employee == user

        if user.role == "SUPERVISOR":
            return (
                obj.project is not None
                and obj.project.project_manager is not None
                and obj.project.project_manager.department == user.department
            )

        return False


class SkillMatrixPermission(PermissionBlock):
    """
    Skill Matrix Permission
    - Admins: Full CRUD Access
    - Supervisors: Full CRUD Access to skill matrices of employees in their department
    - Other users: Read-only access to their own skill matrix
    """

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False

        user = request.user

        if user.role in ["ADMIN", "SUPERVISOR"]:
            return True

        if request.method in SAFE_METHODS:
            return user.role in ["MANAGER", "OPERATOR", "PURCHASING"]

        return False

    def has_object_permission(self, request, view, obj):
        user = request.user

        if user.role == "ADMIN":
            return True

        if user.role == "SUPERVISOR":
            return obj.employee.department == user.department

        if user.role in ["MANAGER", "OPERATOR", "PURCHASING"]:
            return obj.employee == user

        return False
