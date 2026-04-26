from .models import ManufacturingProcess, ProductionLine, ProductionSchedule
from rest_framework.viewsets import ModelViewSet
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status

from .permissions import (
    ManufacturingProcessPermission,
    ProductionSchedulePermission,
    ProductionLinePermission,
)

from .serializers import (
    ManufacturingProcessSerializer,
    ProductionScheduleSerializer,
    ProductionLineSerializer,
)


# TODO: Create production model views


class ManufacturingProcessViewSet(ModelViewSet):
    """
    Manufacturing Process API
    - Admins: Full CRUD access
    - Supervisor | Manager | Technician: Read-only access
    """

    serializer_class = ManufacturingProcessSerializer
    permission_classes = [ManufacturingProcessPermission]
    queryset = ManufacturingProcess.objects.all()


class ProductionLineViewSet(ModelViewSet):
    "Production Line API with machine management"

    serializer_class = ProductionLineSerializer
    permission_classes = [ProductionLinePermission]
    queryset = ProductionLine.objects.all()

    def get_queryset(self):
        user = self.request.user
        if user.role == "SUPERVISOR":
            return self.queryset.filter(workshop__department__supervisor=user)
        if user.role == "MANAGER":
            return self.queryset.filter(workshop__manager=user)
        if user.role == "OPERATOR":
            return self.queryset.filter(workshop__department=user.department)
        return self.queryset

    # !Add/remove machines from production line
    @action(detail=True, methods=["post"], url_path="manage-machines")
    def manage_machines(self, request, pk=None):
        production_line = self.get_object()
        action_type = request.data.get("action")  # 'add', 'remove', 'clear'
        machine_ids = request.data.get("machine_ids", [])

        try:
            if action_type == "add":
                from core.models import Machine

                machines = Machine.objects.filter(id__in=machine_ids)

                # !Check if any machines were found
                if not machines.exists():
                    return Response(
                        {"error": "No valid machines found with provided IDs"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                production_line.add_machines(list(machines))
                message = f"Added {len(machines)} machines"

            elif action_type == "remove":
                from core.models import Machine

                machines_to_remove = Machine.objects.filter(id__in=machine_ids)

                if not machines_to_remove.exists():
                    return Response(
                        {"error": "No valid machines found with provided IDs"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                production_line.machines.remove(*machines_to_remove)
                message = f"Removed {len(machines_to_remove)} machines"

            elif action_type == "clear":
                count = production_line.machines.count()
                production_line.machines.clear()
                message = f"Cleared all {count} machines"

            else:
                return Response(
                    {"error": "Invalid action. Use 'add', 'remove', or 'clear'"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            return Response(
                {
                    "message": message,
                    "total_machines": production_line.machines.count(),
                },
                status=status.HTTP_200_OK,
            )

        except Exception as e:
            return Response("Error invalid data", status=status.HTTP_400_BAD_REQUEST)


class ProductionScheduleViewSet(ModelViewSet):
    """
    Production Schedule API
    - Admins: Full CRUD access
    - Supervisor | MANAGER: Create | Read | Update their own schedules
    - Operator: Read-only access in their owm department
    """

    serializer_class = ProductionScheduleSerializer
    permission_classes = [ProductionSchedulePermission]
    queryset = ProductionSchedule.objects.all()

    def get_queryset(self):
        user = self.request.user
        if user.role == "SUPERVISOR":
            return self.queryset.filter(
                production_line__workshop__department__supervisor=user
            )
        if user.role == "MANAGER":
            return self.queryset.filter(production_line__workshop__manager=user)
        if user.role == "OPERATOR":
            return self.queryset.filter(
                production_line__workshop__department=user.department
            )
        return self.queryset
