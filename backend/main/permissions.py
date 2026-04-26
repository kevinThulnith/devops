from core.permissions import PermissionBlock, SAFE_METHODS

# TODO: Create core model permissions


class UserPermissions(PermissionBlock):
    """
    Custom permissions for User API:
    - Admins: Full CRUD.
    - SUPERVISORS and MANAGERS: Read-only access to for user account is same department.
    """

    def has_permission(self, request, view):
        if super().has_permission(request, view):
            return True

        if request.method in SAFE_METHODS:
            return request.user.role in {"SUPERVISOR", "MANAGER"}

        return False

    def has_object_permission(self, request, view, obj):
        if super().has_object_permission(request, view, obj):
            return True

        if request.user.role in {"SUPERVISOR", "MANAGER"}:
            return obj.department == request.user.department

        return False
