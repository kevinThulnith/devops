from rest_framework.serializers import ModelSerializer, CharField
from .models import LaborAllocation, SkillMatrix

# TODO: create serializers for labor models


class LaborAllocationSerializer(ModelSerializer):
    employee_name = CharField(source="employee.name", read_only=True)
    project_name = CharField(source="project.name", read_only=True)
    task_name = CharField(source="task.name", read_only=True)
    production_line_name = CharField(source="production_line.name", read_only=True)

    class Meta:
        model = LaborAllocation
        fields = "__all__"
        read_only_fields = ["updated_at"]


class SkillMatrixSerializer(ModelSerializer):
    employee_name = CharField(source="employee.name", read_only=True)

    class Meta:
        model = SkillMatrix
        fields = "__all__"
        read_only_fields = ["updated_at"]
