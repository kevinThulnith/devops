from core.permissions import PermissionBlock, SAFE_METHODS

# TODO: Create inventory model permissions


class BasePermissions(PermissionBlock):
    """
    Supplier | Material permissions:
    - Admins: Full CRUD access
    - Purchasing | Supervisors: Read-only access
    """

    def has_permission(self, request, view):
        if super().has_permission(request, view):
            return True

        if request.method in SAFE_METHODS:
            return request.user.role in ["PURCHASING", "SUPERVISOR"]

        return False

    def has_object_permission(self, request, view, obj):
        return self.has_permission(request, view)


class MaterialPermission(BasePermissions):
    """
    Material permissions:
    - Admins: Full CRUD access
    - Purchasing | Supervisors | Oparator | Manager : Read-only access
    """

    def has_permission(self, request, view):
        if super().has_permission(request, view):
            return True

        if (
            request.user.role in ("OPERATOR", "MANAGER")
            and request.method in SAFE_METHODS
        ):
            return True

        return False


class OrderPermission(PermissionBlock):
    """
    Order permissions:
    - Admins: Full CRUD access
    - Supervisors: Only create, update their own orders
    - Purchasing: Can't delete, can update status of any order, can create orders
    """

    PURCHASING_ALLOWED_FIELDS = {"status"}

    def has_permission(self, request, view):
        if super().has_permission(request, view):
            return True

        user = request.user

        if user.role == "SUPERVISOR":
            return request.method != "DELETE"

        if user.role == "PURCHASING":
            if request.method in SAFE_METHODS or request.method == "POST":
                return True

            if (
                request.method in ["PATCH", "PUT"]
                and hasattr(request, "data")
                and request.data
            ):
                request_fields = set(request.data.keys())
                return request_fields.issubset(self.PURCHASING_ALLOWED_FIELDS)

        return False

    def has_object_permission(self, request, view, obj):
        if super().has_object_permission(request, view, obj):
            return True

        user = request.user

        if user.role == "PURCHASING":
            return True

        if user.role == "SUPERVISOR":
            return obj.created_by == user

        return False


class OrderMaterialPermission(PermissionBlock):
    """
    OrderMaterial permissions:
    - Admins: Full CRUD access
    - Supervisors: Only Can manage materials for their orders
    - Purchasing: Read-only for others' orders; create/update for their own orders
    """

    def has_permission(self, request, view):
        if super().has_permission(request, view):
            return True

        user = request.user

        if request.method in SAFE_METHODS:
            return user.role in ["PURCHASING", "SUPERVISOR"]

        if view.action in ["create", "update", "partial_update"]:
            return user.role in ["SUPERVISOR", "PURCHASING"]

        return False

    def has_object_permission(self, request, view, obj):
        if super().has_object_permission(request, view, obj):
            return True

        user = request.user

        if user.role == "PURCHASING":
            if request.method in SAFE_METHODS:
                return True
            # Allow create/update only on their own orders
            return obj.order.created_by == user and request.method != "DELETE"

        if user.role == "SUPERVISOR":
            if obj.order.created_by == user and request.method != "DELETE":
                return True

            if request.method in SAFE_METHODS:
                return True

            if request.method in ["PATCH", "PUT"]:
                allowed_fields = {"quantity", "price"}
                if request.data and all(
                    key in allowed_fields for key in request.data.keys()
                ):
                    return True

            return False

        return False


class MaterialConsumptionPermission(PermissionBlock):
    """
    MaterialConsumption permissions:
    - Admins: Full CRUD
    - Supervisors: Full CRUD for their department's consumption records
    - Managers: Full CRUD for their workshops / projects
    - Operators: Read and Create for their assigned tasks / department
    """

    def has_permission(self, request, view):
        if super().has_permission(request, view):
            return True

        user = request.user

        if request.method in SAFE_METHODS:
            return user.role in ["SUPERVISOR", "MANAGER", "OPERATOR"]

        if user.role in ["SUPERVISOR", "MANAGER"]:
            return request.method in ["POST", "PUT", "PATCH", "DELETE"]

        if user.role == "OPERATOR":
            return request.method == "POST"

        return False

    def has_object_permission(self, request, view, obj):
        if super().has_object_permission(request, view, obj):
            return True

        user = request.user

        if user.role == "SUPERVISOR":
            if obj.task:
                return obj.task.project.project_manager.department == user.department
            if obj.production_schedule:
                return (
                    obj.production_schedule.production_line.workshop.department.supervisor
                    == user
                )
            return False

        if user.role == "MANAGER":
            if obj.task:
                return obj.task.project.project_manager == user
            if obj.production_schedule:
                return obj.production_schedule.production_line.workshop.manager == user
            return False

        if user.role == "OPERATOR":
            if request.method not in SAFE_METHODS:
                return False
            if obj.task:
                return obj.task.assigned_to == user
            if obj.production_schedule:
                return (
                    obj.production_schedule.production_line.workshop.department
                    == user.department
                )
            return False

        return False
