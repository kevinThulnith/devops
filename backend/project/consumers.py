from .permissions import ProjectPermissions, TaskPermissions
from backend.consumers import ConsumerBlock

# TODO: Create consumer classes for project models


class ProjectConsumer(ConsumerBlock):
    group_name = "projects"
    permission_class = ProjectPermissions

    @property
    def model_class(self):
        from .models import Project

        return Project


class TaskConsumer(ConsumerBlock):
    group_name = "tasks"
    permission_class = TaskPermissions

    @property
    def model_class(self):
        from .models import Task

        return Task
