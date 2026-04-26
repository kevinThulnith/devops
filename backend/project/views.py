from .permissions import ProjectPermissions, TaskPermissions
from .serializers import ProjectSerializer, TaskSerializer
from rest_framework.viewsets import ModelViewSet
from django.shortcuts import get_object_or_404
from .models import Project, Task


class ProjectViewSet(ModelViewSet):
    """
    Project API:
    - Admins: Full CRUD.
    - Supervisors: Update project_manager | project_status managed by managers in their department
    - Managers: Update managed projects
    """

    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    permission_classes = [ProjectPermissions]

    def get_queryset(self):
        user = self.request.user

        if user.role == "ADMIN":
            return self.queryset
        if user.role == "MANAGER":
            return self.queryset.filter(project_manager=user)
        if user.role == "SUPERVISOR":
            return self.queryset.filter(project_manager__department=user.department)

        return self.queryset.none()

    def perform_create(self, serializer):
        """
        Handle project creation - ensure admin users can create projects
        """
        serializer.save()


class TaskListView(ModelViewSet):
    """
    Task List API:
    - Operators: List tasks assigned to them
    """

    serializer_class = TaskSerializer
    permission_classes = [TaskPermissions]

    def get_queryset(self):
        user = self.request.user

        if user.role == "ADMIN":
            return Task.objects.all()
        if user.role == "SUPERVISOR":
            return Task.objects.filter(
                project__project_manager__department=user.department
            )
        if user.role == "MANAGER":
            return Task.objects.filter(project__project_manager=user)
        if user.role == "OPERATOR":
            return Task.objects.filter(assigned_to=user)

        return Task.objects.none()


class ProjectTaskViewSet(ModelViewSet):
    """
    Project Task API (Nested):
    - Must include project_id in URL
    - Admins: Full CRUD.
    - Supervisors: Update project_manager | project_status managed by managers in their department
    - Mangers: Update managed projects
    """

    serializer_class = TaskSerializer
    permission_classes = [TaskPermissions]

    def get_queryset(self):
        # !Get tasks for the specific project
        project_id = self.kwargs.get("project_pk")
        user = self.request.user

        # !Get the base queryset for the project
        tasks = Task.objects.filter(project_id=project_id)

        if user.role == "ADMIN":
            return tasks
        if user.role == "SUPERVISOR":
            return tasks.filter(project__project_manager__department=user.department)
        if user.role == "MANAGER":
            return tasks.filter(project__project_manager=user)
        if user.role == "OPERATOR":
            return tasks.filter(assigned_to=user)

        return Task.objects.none()

    def perform_create(self, serializer):
        project_id = self.kwargs.get("project_pk")
        project = get_object_or_404(Project, pk=project_id)
        serializer.save(project=project)
