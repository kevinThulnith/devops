from .models import MachineOperatorAssignment, Department, Workshop, Machine
from rest_framework.viewsets import ModelViewSet

from .permissions import (
    MachineOperatorAssignmentPermissions,
    DepartmentPermissions,
    WorkshopPermissions,
    MachinePermissions,
)

from .serializers import (
    MachineOperatorAssignmentSerializer,
    DepartmentSerializer,
    WorkshopSerializer,
    MachineSerializer,
)


# TODO: Create core model views


class DepartmentViewSet(ModelViewSet):
    """
    Departments API
    - Admins: Full CRUD.
    - Other users: Read-only access to their assigned department.
    """

    serializer_class = DepartmentSerializer
    permission_classes = [DepartmentPermissions]

    def get_queryset(self):
        user = self.request.user

        if user.role == "ADMIN":
            return Department.objects.all().select_related("supervisor")

        if user.department_id:
            return Department.objects.filter(id=user.department_id).select_related(
                "supervisor"
            )

        return Department.objects.none()


class WorkshopViewSet(ModelViewSet):
    """
    Workshops API
    - Admins: Full CRUD access
    - Supervisors: Can view workshops in their department and update managers, operational_status
    - Managers: Update 'operational_status' in their workshops.
    - Operators: Read-only access to workshops in their own department.
    - TECHNICIAN: Read-only access to all workshops.
    """

    serializer_class = WorkshopSerializer
    permission_classes = [WorkshopPermissions]

    def get_queryset(self):
        user = self.request.user

        if user.role in ["ADMIN", "TECHNICIAN"]:
            return Workshop.objects.all().select_related("department", "manager")

        if user.role in ["SUPERVISOR", "OPERATOR"]:
            return Workshop.objects.filter(department=user.department).select_related(
                "department", "manager"
            )

        if user.role == "MANAGER":
            return Workshop.objects.filter(manager=user).select_related("department")

        return Workshop.objects.none()


class MachineViewSet(ModelViewSet):
    """
    Machines API:
    - Admins: Full CRUD access
    - Supervisors: Can view machines in their departments and update 'operator', 'status'
    - Managers: Can view machines in their workshops and update 'operator', 'status'
    - Technicians: View all machines; PATCH 'status', 'last_maintenance_date', 'next_maintenance_date'
    - OPERATOR: Read-only access for machines in their department
    """

    serializer_class = MachineSerializer
    permission_classes = [MachinePermissions]

    def get_queryset(self):
        user = self.request.user

        if user.role in ["ADMIN", "TECHNICIAN"]:
            return Machine.objects.all()

        if user.role in ["SUPERVISOR", "OPERATOR"]:
            return Machine.objects.filter(
                workshop__department=user.department
            ).select_related("workshop__department", "operator")

        if user.role == "MANAGER":
            return Machine.objects.filter(workshop__manager=user).select_related(
                "workshop__department", "operator"
            )

        return Machine.objects.none()


class MachineOperatorAssignmentViewSet(ModelViewSet):
    """
    API endpoints for machine operator assignments
    - Admins: Full CRUD
    - Supervisors: Full CRUD for machines in their departments
    - Managers: Full CRUD for machines in their workshops
    - Operators: Read-only access to their own assignments
    """

    serializer_class = MachineOperatorAssignmentSerializer
    permission_classes = [MachineOperatorAssignmentPermissions]

    def get_queryset(self):
        user = self.request.user

        if user.role == "ADMIN":
            return MachineOperatorAssignment.objects.all()

        if user.role == "SUPERVISOR":
            return MachineOperatorAssignment.objects.filter(
                machine__workshop__department=user.department
            ).select_related("machine", "operator")

        if user.role == "MANAGER":
            return MachineOperatorAssignment.objects.filter(
                machine__workshop__manager=user
            ).select_related("machine", "operator")

        if user.role == "OPERATOR":
            return MachineOperatorAssignment.objects.filter(
                operator=user
            ).select_related("machine", "operator")

        return MachineOperatorAssignment.objects.none()
