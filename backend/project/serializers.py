from inventory.serializers import MaterialConsumptionSerializer
from django.utils.translation import gettext_lazy as _
from inventory.models import MaterialConsumption
from .models import Project, Task
from core.models import User

from rest_framework.serializers import (
    PrimaryKeyRelatedField,
    SerializerMethodField,
    ModelSerializer,
    CharField,
)

# TODO: Create project serializers


class TaskSerializer(ModelSerializer):
    dependencies_count = SerializerMethodField()
    consumed_materials = SerializerMethodField()
    project_name = CharField(source="project.name", read_only=True)
    assigned_to_name = CharField(source="assigned_to.name", read_only=True)
    project_manager_name = CharField(
        source="project.project_manager.name", read_only=True
    )

    class Meta:
        model = Task
        fields = "__all__"
        read_only_fields = ["updated_at", "start_date"]

    def get_dependencies_count(self, obj):
        return obj.dependencies.count()

    def get_consumed_materials(self, obj):
        consumptions = MaterialConsumption.objects.filter(task=obj)
        return MaterialConsumptionSerializer(consumptions, many=True).data


class TaskSummarySerializer(ModelSerializer):
    assigned_to_name = CharField(source="assigned_to.name", read_only=True)

    class Meta:
        model = Task
        fields = [
            "id",
            "name",
            "status",
            "assigned_to",
            "assigned_to_name",
            "start_date",
            "end_date",
        ]
        read_only_fields = ["start_date"]


class ProjectSerializer(ModelSerializer):
    tasks_count = SerializerMethodField()
    recent_tasks = SerializerMethodField()
    project_manager_name = CharField(source="project_manager.name", read_only=True)
    project_manager_department = CharField(
        source="project_manager.department", read_only=True
    )
    manager = PrimaryKeyRelatedField(
        queryset=User.objects.filter(role="MANAGER"),
        source="project_manager",
        required=False,
        allow_null=True,
        write_only=True,
    )

    class Meta:
        model = Project
        fields = "__all__"
        read_only_fields = ["updated_at"]

    def get_tasks_count(self, obj):
        return obj.tasks.count()

    def get_recent_tasks(self, obj):
        # !Get the 3 most recent tasks for the list view

        request = self.context.get("request")
        resolver_match = getattr(request, "resolver_match", None)
        if request and resolver_match and resolver_match.url_name == "project-detail":
            # For detail view, show more tasks
            recent_tasks = obj.tasks.all().order_by("-updated_at")[:5]
        else:
            # For list view, show fewer tasks
            recent_tasks = obj.tasks.all().order_by("-updated_at")[:3]
        return TaskSummarySerializer(recent_tasks, many=True).data
