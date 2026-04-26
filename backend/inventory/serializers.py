from .models import Supplier, Material, Order, OrderMaterial, MaterialConsumption, _
from rest_framework.serializers import (
    StringRelatedField,
    ValidationError,
    ModelSerializer,
    ReadOnlyField,
    IntegerField,
    CharField,
)


# TODO: Create inventory serializers


class MaterialSerializer(ModelSerializer):
    class Meta:
        model = Material
        fields = "__all__"
        extra_kwargs = {"updated_at": {"read_only": True}}

    def to_representation(self, instance):
        "Convert Decimal fields to strings for msgpack serialization"
        data = super().to_representation(instance)
        if "quantity" in data and data["quantity"] is not None:
            data["quantity"] = str(data["quantity"])
        if "reorder_level" in data and data["reorder_level"] is not None:
            data["reorder_level"] = str(data["reorder_level"])
        return data


class SupplierSerializer(ModelSerializer):
    order_count = IntegerField(source="orders.count", read_only=True)

    class Meta:
        model = Supplier
        fields = "__all__"


class OrderMaterialSerializer(ModelSerializer):
    material_name = ReadOnlyField(source="material.name")

    class Meta:
        model = OrderMaterial
        fields = "__all__"
        read_only_fields = ["order", "total_price"]

    def create(self, validated_data):
        return super().create(validated_data)

    def to_representation(self, instance):
        "Convert Decimal fields to strings for msgpack serialization"
        data = super().to_representation(instance)
        if "quantity" in data and data["quantity"] is not None:
            data["quantity"] = str(data["quantity"])
        if "unit_price" in data and data["unit_price"] is not None:
            data["unit_price"] = str(data["unit_price"])
        if "total_price" in data and data["total_price"] is not None:
            data["total_price"] = str(data["total_price"])
        return data


class OrderSerializer(ModelSerializer):
    order_materials = OrderMaterialSerializer(many=True, read_only=True)
    supplier_name = StringRelatedField(source="supplier", read_only=True)
    created_by_name = StringRelatedField(source="created_by.name", read_only=True)

    class Meta:
        model = Order
        fields = "__all__"
        read_only_fields = ["order_date", "updated_at", "total", "created_by"]

    def create(self, validated_data):
        validated_data["created_by"] = self.context["request"].user
        return super().create(validated_data)

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if "total" in data and data["total"] is not None:
            data["total"] = str(data["total"])
        return data


class MaterialConsumptionSerializer(ModelSerializer):
    material_name = CharField(source="material.name", read_only=True)
    material_unit = CharField(source="material.unit_of_measurement", read_only=True)
    consumed_by_name = CharField(source="consumed_by.name", read_only=True)

    # Task-related read-only fields
    task_name = CharField(source="task.name", read_only=True)
    project_name = CharField(source="task.project.name", read_only=True)

    # Production-related read-only fields
    product_name = ReadOnlyField(source="production_schedule.product.name")
    production_line_name = ReadOnlyField(
        source="production_schedule.production_line.name"
    )

    class Meta:
        model = MaterialConsumption
        fields = "__all__"
        read_only_fields = ["consumed_at", "updated_at", "consumption_type"]

    def validate(self, attrs):
        task = attrs.get("task")
        production_schedule = attrs.get("production_schedule")

        if task and production_schedule:
            raise ValidationError(
                {
                    "non_field_errors": [
                        "Cannot link to both a task and a production schedule."
                    ]
                }
            )

        if not task and not production_schedule:
            raise ValidationError(
                {
                    "non_field_errors": [
                        "Must link to either a task or a production schedule."
                    ]
                }
            )

        return attrs
