from core.permissions import PermissionBlock, SAFE_METHODS

# TODO: create project model permissions


class ProjectPermissions(PermissionBlock):
    """
    Project permissions:
    - Admins: Full CRUD.
    - Supervisors: Update project_manager | project_status managed by managers in their department
    - Mangers: Update managed projects
    """

    def has_permission(self, request, view):
        if super().has_permission(request, view):
            return True

        user = request.user

        if request.method in SAFE_METHODS:
            return user.role in ["SUPERVISOR", "MANAGER"]

        if user.role == "SUPERVISOR" and request.method in ["PATCH", "PUT"]:
            return (request.data.get("project_manager") is not None) or (
                request.data.get("project_status") is not None
            )

        if user.role == "MANAGER" and request.method in ["PUT", "PATCH"]:
            return True

        return False

    def has_object_permission(self, request, view, obj):
        if super().has_object_permission(request, view, obj):
            return True

        user = request.user

        if user.role == "SUPERVISOR":
            return obj.project_manager.department == user.department

        if user.role == "MANAGER":
            return obj.project_manager == user

        return False


class TaskPermissions(PermissionBlock):
    """
    Task permissions:
    - Admins: Full CRUD.
    - Supervisors: Update assigned_to | status
    - Mangers: Update tasks
    - Operators: Update status in assigned tasks
    """

    def has_permission(self, request, view):
        if super().has_permission(request, view):
            return True

        user = request.user

        if request.method in SAFE_METHODS:
            return user.role in ["SUPERVISOR", "MANAGER", "OPERATOR"]

        if user.role == "SUPERVISOR" and request.method in ["PATCH", "PUT"]:
            return (request.data.get("assigned_to") is not None) or (
                request.data.get("status") is not None
            )

        if user.role == "MANAGER" and request.method in [
            "PUT",
            "PATCH",
            "POST",
            "DELETE",
        ]:
            return True

        if user.role == "OPERATOR" and request.method == "PATCH":
            return "status" in request.data

        return False

    def has_object_permission(self, request, view, obj):
        if super().has_object_permission(request, view, obj):
            return True

        user = request.user

        if user.role == "SUPERVISOR":
            return obj.project.project_manager.department == user.department

        if user.role == "MANAGER":
            return obj.project.project_manager == user

        if user.role == "OPERATOR":
            return obj.assigned_to == user

        return False
