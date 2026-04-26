from .permissions import ProjectPermissions, TaskPermissions
from .serializers import ProjectSerializer, TaskSerializer
from backend.signals import create_model_change_signal
from .models import Project, Task

# TODO: Create signals for project models

task_signal = create_model_change_signal(
    Task, TaskSerializer, "tasks", "send_update", permission_class=TaskPermissions
)

project_signal = create_model_change_signal(
    Project,
    ProjectSerializer,
    "projects",
    "send_update",
    permission_class=ProjectPermissions,
)
