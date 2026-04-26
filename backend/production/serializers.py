from .models import ProductionLine, ProductionSchedule, ManufacturingProcess
from inventory.serializers import MaterialConsumptionSerializer
from inventory.models import MaterialConsumption
from core.serializers import MachineSerializer
from rest_framework.serializers import (
    SerializerMethodField,
    ModelSerializer,
    ValidationError,
    IntegerField,
    CharField,
    ListField,
)

# TODO: Crate production model serializers


class ManufacturingProcessSerializer(ModelSerializer):
    formatted_standard_time = SerializerMethodField()

    class Meta:
        model = ManufacturingProcess
        fields = "__all__"
        read_only_fields = ["created_at", "updated_at"]

    def get_formatted_standard_time(self, obj):
        if obj.standard_time:
            total_seconds = int(obj.standard_time.total_seconds())
            hours, remainder = divmod(total_seconds, 3600)
            minutes = remainder // 60
            return f"{hours}h {minutes}m"
        return None

    def validate_description(self, value):
        if not value or not value.strip():
            raise ValidationError("Description cannot be empty.")
        return value.strip()


class ProductionLineSerializer(ModelSerializer):
    workshop_name = CharField(source="workshop.name", read_only=True)
    machines = MachineSerializer(many=True, read_only=True)
    machine_ids = ListField(
        child=IntegerField(),
        write_only=True,
        required=False,
        help_text="List of machine IDs to assign to this production line",
    )

    class Meta:
        model = ProductionLine
        fields = "__all__"
        read_only_fields = ["created_at", "updated_at"]

    def create(self, validated_data):
        machine_ids = validated_data.pop("machine_ids", [])
        instance = super().create(validated_data)

        if machine_ids:
            try:
                from core.models import Machine

                machines = Machine.objects.filter(id__in=machine_ids)

                # Validate that machines belong to the same workshop
                invalid_machines = machines.exclude(workshop=instance.workshop)
                if invalid_machines.exists():
                    machine_names = list(
                        invalid_machines.values_list("name", flat=True)
                    )
                    raise ValidationError(
                        f"Machines {machine_names} don't belong to workshop {instance.workshop.name}"
                    )

                instance.machines.set(machines)
            except Exception as e:
                raise ValidationError("Invalid machine IDs provided.")

        return instance

    def update(self, instance, validated_data):
        machine_ids = validated_data.pop("machine_ids", None)
        instance = super().update(instance, validated_data)

        if machine_ids is not None:
            try:
                from core.models import Machine

                machines = Machine.objects.filter(id__in=machine_ids)

                # Validate that machines belong to the same workshop
                if machines.exists():
                    invalid_machines = machines.exclude(workshop=instance.workshop)
                    if invalid_machines.exists():
                        machine_names = list(
                            invalid_machines.values_list("name", flat=True)
                        )
                        raise ValidationError(
                            f"Machines {machine_names} don't belong to workshop {instance.workshop.name}"
                        )

                instance.machines.set(machines)
            except Exception as e:
                raise ValidationError("Invalid machine IDs provided.")

        return instance


class ProductionScheduleSerializer(ModelSerializer):
    product_name = CharField(source="product.name", read_only=True)
    production_line_name = CharField(source="production_line.name", read_only=True)
    workshop_name = CharField(source="production_line.workshop.name", read_only=True)
    comsumed_materials = SerializerMethodField()

    class Meta:
        model = ProductionSchedule
        fields = "__all__"
        read_only_fields = ["created_at", "updated_at"]

    def get_comsumed_materials(self, obj):
        consumptions = MaterialConsumption.objects.filter(production_schedule=obj)
        return MaterialConsumptionSerializer(consumptions, many=True).data
