from .models import Department, Workshop, Machine, MachineOperatorAssignment
from .models import _
import logging

from rest_framework.serializers import (
    SerializerMethodField,
    StringRelatedField,
    ValidationError,
    ModelSerializer,
    IntegerField,
)

logger = logging.getLogger(__name__)

# TODO: Create core model serializers


class DepartmentSerializer(ModelSerializer):
    workshops = IntegerField(source="workshops.count", read_only=True)
    supervisor_name = StringRelatedField(source="supervisor.name", read_only=True)

    class Meta:
        model = Department
        fields = "__all__"
        read_only_fields = ["updated_at"]
        extra_kwargs = {"updated_at": {"read_only": True}}


class WorkshopSerializer(ModelSerializer):
    machines = IntegerField(source="machines.count", read_only=True)
    manager_name = StringRelatedField(source="manager.name", read_only=True)
    department_name = StringRelatedField(source="department", read_only=True)

    class Meta:
        model = Workshop
        fields = "__all__"
        read_only_fields = ["updated_at"]
        extra_kwargs = {
            "name": {"required": False},
            "department": {"required": False},
            "updated_at": {"read_only": True},
        }

    def create(self, validated_data):
        name = validated_data.pop("name", None)
        department = validated_data.pop("department", None)

        if name is None or department is None:
            raise ValidationError(
                {
                    "name": [_("This field is required.")],
                    "department": [_("This field is required.")],
                }
            )

        workshop = Workshop.objects.create(
            name=name, department=department, **validated_data
        )
        return workshop


class MachineSerializer(ModelSerializer):
    operator_assignments = SerializerMethodField()
    workshop_name = StringRelatedField(source="workshop.name", read_only=True)
    operator_name = StringRelatedField(source="operator.name", read_only=True)
    department_name = StringRelatedField(source="workshop.department", read_only=True)

    class Meta:
        model = Machine
        fields = "__all__"
        read_only_fields = ["operator_assigned_at", "operator_auto_remove_at"]

    def get_operator_assignments(self, obj):
        return MachineOperatorAssignment.objects.filter(machine=obj).count()

    def validate(self, attrs):
        "Validate machine data including operator assignment"
        from django.core.exceptions import ValidationError as DjangoValidationError

        operator = attrs.get("operator")
        workshop = attrs.get("workshop", getattr(self.instance, "workshop", None))

        # Validate operator role and department if operator is being assigned
        if operator:
            if operator.role != "OPERATOR":
                raise ValidationError(
                    {"operator": ["Assigned user must have the OPERATOR role."]}
                )

            if workshop and operator.department != workshop.department:
                raise ValidationError(
                    {
                        "operator": [
                            f"Cannot assign operator from {operator.department} department "
                            f"to machine in {workshop.department} department."
                        ]
                    }
                )

        return attrs


class MachineOperatorAssignmentSerializer(ModelSerializer):
    machine_name = StringRelatedField(source="machine", read_only=True)
    operator_name = StringRelatedField(source="operator.name", read_only=True)

    class Meta:
        model = MachineOperatorAssignment
        fields = "__all__"
        read_only_fields = ["assigned_at", "auto_remove_at", "removed_at"]

    def validate(self, attrs):
        "Validate the assignment before saving"
        from django.core.exceptions import ValidationError as DjangoValidationError

        # Create a temporary instance for validation
        instance = MachineOperatorAssignment(**attrs)

        try:
            instance.clean()
        except DjangoValidationError as e:
            # Convert Django ValidationError to DRF ValidationError
            logger.error("MachineOperatorAssignment validation error: %s", e)
            if hasattr(e, "message_dict"):
                raise ValidationError(e.message_dict)
            else:
                raise ValidationError({"non_field_errors": e.messages})

        return attrs
