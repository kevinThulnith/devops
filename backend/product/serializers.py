from rest_framework.serializers import CharField, ModelSerializer, SerializerMethodField
from .models import Product, ProductProcess

# TODO: Create product model serializers


class ProductSerializer(ModelSerializer):
    processes = SerializerMethodField()

    class Meta:
        model = Product
        fields = "__all__"
        read_only_fields = ["updated_at"]

    def get_processes(self, obj):
        return list(
            obj.product_processes.select_related("process")
            .order_by("sequence")
            .values("sequence", "process__name")
        )


class ProductProcessSerializer(ModelSerializer):
    process_name = CharField(
        source="process.name", read_only=True, label="Process Name"
    )

    class Meta:
        model = ProductProcess
        fields = "__all__"
        read_only_fields = ["product"]

    def create(self, validated_data):
        return super().create(validated_data)
