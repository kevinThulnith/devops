from core.permissions import PermissionBlock, SAFE_METHODS


# TODO: Create production model permissions


class ManufacturingProcessPermission(PermissionBlock):
    """
    ManufacturingProcess permissions:
    - Admins: Full CRUD access
    - Supervisor | Manager | Technician: Read-only access
    """

    def has_permission(self, request, view):
        if super().has_permission(request, view):
            return True

        user = request.user

        if request.method in SAFE_METHODS:
            return user.role in ["SUPERVISOR", "TECHNICIAN", "MANAGER"]

        return False

    def has_object_permission(self, request, view, obj):
        return self.has_permission(request, view)


class ProductionLinePermission(PermissionBlock):
    """
    ProductionLine permissions:
    - Admins: Full CRUD access
    - Supervisor: Only Create | Read | Update their department
    - Manager: Update operational_status in their workshop
    - Technician: Update operational_status
    - Opators: Read-only access in their department
    """

    def has_permission(self, request, view):
        if super().has_permission(request, view):
            return True

        user = request.user

        if request.method in SAFE_METHODS:
            return user.role in ["SUPERVISOR", "TECHNICIAN", "MANAGER", "OPERATOR"]

        if user.role == "SUPERVISOR" and request.method in ["POST", "PUT", "PATCH"]:
            return True

        if user.role in ["TECHNICIAN", "MANAGER"] and request.method == "PATCH":
            return request.data.get("operational_status") is not None

        return False

    def has_object_permission(self, request, view, obj):
        if request.user.role == "SUPERVISOR":
            return obj.workshop.department.supervisor == request.user
        if request.user.role == "MANAGER":
            return obj.workshop.manager == request.user
        if request.user.role == "OPERATOR":
            return obj.workshop.department == request.user.department

        return self.has_permission(request, view)


class ProductionSchedulePermission(PermissionBlock):
    """
    ProductionSchedule permissions:
    - Admins: Full CRUD access
    - Supervisor | MANAGER: Create | Read | Update their own schedules
    - Operator: Read-only access in their owm department
    """

    def has_permission(self, request, view):
        if super().has_permission(request, view):
            return True

        user = request.user

        if request.method in SAFE_METHODS:
            return user.role in ["SUPERVISOR", "MANAGER", "OPERATOR"]

        if user.role in ["SUPERVISOR", "MANAGER"] and request.method in [
            "POST",
            "PUT",
            "PATCH",
        ]:
            return True

        return False

    def has_object_permission(self, request, view, obj):
        if request.user.role == "SUPERVISOR":
            return obj.production_line.workshop.department.supervisor == request.user
        if request.user.role == "MANAGER":
            return obj.production_line.workshop.manager == request.user
        if request.user.role == "OPERATOR":
            return obj.production_line.workshop.department == request.user.department

        return self.has_permission(request, view)
