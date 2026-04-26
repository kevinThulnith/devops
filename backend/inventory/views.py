from .models import Material, Supplier, Order, OrderMaterial, MaterialConsumption
from django.shortcuts import get_object_or_404
from core.views import ModelViewSet
from django.db.models import Q

from .permissions import (
    MaterialConsumptionPermission,
    OrderMaterialPermission,
    MaterialPermission,
    BasePermissions,
    OrderPermission,
)

from .serializers import (
    MaterialConsumptionSerializer,
    OrderMaterialSerializer,
    MaterialSerializer,
    SupplierSerializer,
    OrderSerializer,
)

# TODO: create inventory model views


class MaterialViewSet(ModelViewSet):
    """
    Material API
    - Admins: Full CRUD access
    - Purchasing | Supervisors: Read-only access
    """

    serializer_class = MaterialSerializer
    permission_classes = [MaterialPermission]
    queryset = Material.objects.all()


class SupplierViewSet(ModelViewSet):
    """
    Supplier API
    - Admins: Full CRUD access
    - Purchasing | Supervisors: Read-only access
    """

    serializer_class = SupplierSerializer
    permission_classes = [BasePermissions]
    queryset = Supplier.objects.all()


class OrderViewSet(ModelViewSet):
    """
    Order API :
    - Admins: Full CRUD access
    - Supervisors: Only create, update, partial update their own orders
    - Purchasing: Can view, update order status
    """

    serializer_class = OrderSerializer
    permission_classes = [OrderPermission]

    def get_queryset(self):
        user = self.request.user

        if user.role == "ADMIN":
            return (
                Order.objects.all()
                .select_related("supplier", "created_by")
                .prefetch_related("order_materials", "order_materials__material")
            )

        if user.role == "SUPERVISOR":
            return (
                Order.objects.filter(created_by=user)
                .select_related("supplier", "created_by")
                .prefetch_related("order_materials", "order_materials__material")
            )

        if user.role == "PURCHASING":
            return (
                Order.objects.all()
                .select_related("supplier", "created_by")
                .prefetch_related("order_materials", "order_materials__material")
            )

        return Order.objects.none()


class OrderMaterialViewSet(ModelViewSet):
    """
    OrderMaterial API (Nested under Order):
    - Must specify order_id to access materials
    - Admins: Full CRUD access
    - Supervisors: Only Can manage materials for their orders, cannot delete
    - Purchasing: Read-only access
    """

    serializer_class = OrderMaterialSerializer
    permission_classes = [OrderMaterialPermission]

    def get_queryset(self):
        # !Get order materials for the specified order
        order_id = self.kwargs.get("order_pk")
        user = self.request.user

        # !Get the base OrderMaterial queryset for this order
        base_queryset = OrderMaterial.objects.filter(order_id=order_id)

        if user.role in ["ADMIN", "PURCHASING"]:
            return base_queryset
        elif user.role == "SUPERVISOR":
            return base_queryset.filter(order__created_by=user)

        return OrderMaterial.objects.none()

    def perform_create(self, serializer):
        order_id = self.kwargs.get("order_pk")
        order = get_object_or_404(Order, id=order_id)
        serializer.save(order=order)

    def perform_update(self, serializer):
        order_id = self.kwargs.get("order_pk")
        order = get_object_or_404(Order, id=order_id)
        serializer.save(order=order)

    def perform_destroy(self, instance):
        # Prevent deletion if user is SUPERVISOR
        user = self.request.user
        if user.role == "SUPERVISOR":
            raise PermissionError("Supervisors cannot delete order materials.")
        instance.delete()


class MaterialConsumptionViewSet(ModelViewSet):
    """
    Material Consumption API:
    - Admins: Full CRUD
    - Supervisors: Full CRUD for their department's consumption records
    - Managers: Full CRUD for their workshops / projects
    - Operators: Read and Create for their assigned tasks / department
    """

    serializer_class = MaterialConsumptionSerializer
    permission_classes = [MaterialConsumptionPermission]

    def get_queryset(self):
        user = self.request.user
        qs = MaterialConsumption.objects.select_related(
            "material",
            "task",
            "task__project",
            "production_schedule",
            "production_schedule__product",
            "production_schedule__production_line",
            "consumed_by",
        )

        if user.role == "ADMIN":
            return qs

        if user.role == "SUPERVISOR":
            return qs.filter(
                Q(task__project__project_manager__department=user.department)
                | Q(
                    production_schedule__production_line__workshop__department__supervisor=user
                )
            )

        if user.role == "MANAGER":
            return qs.filter(
                Q(task__project__project_manager=user)
                | Q(production_schedule__production_line__workshop__manager=user)
            )

        if user.role == "OPERATOR":
            return qs.filter(
                Q(task__assigned_to=user)
                | Q(
                    production_schedule__production_line__workshop__department=user.department
                )
            )

        return MaterialConsumption.objects.none()

    def perform_create(self, serializer):
        serializer.save(consumed_by=self.request.user)
