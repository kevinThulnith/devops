from core.permissions import PermissionBlock, SAFE_METHODS

# TODO: Create product model permissions


class ProductPermission(PermissionBlock):
    """
    Product permissions:
    - Admins: Full CRUD access
    - Supervisor: change status of products
    - Manager | Operator: Read-only access
    """

    def has_permission(self, request, view):
        if super().has_permission(request, view):
            return True

        user = request.user

        if request.method in SAFE_METHODS:
            return user.role in [
                "SUPERVISOR",
                "MANAGER",
                "OPERATOR",
            ]

        if request.method == "PATCH" and user.role == "SUPERVISOR":
            return request.data.get("status") is not None

        return False

    def has_object_permission(self, request, view, obj):
        return self.has_permission(request, view)
