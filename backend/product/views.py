from .serializers import ProductSerializer, ProductProcessSerializer
from rest_framework.viewsets import ModelViewSet
from django.shortcuts import get_object_or_404
from .permissions import ProductPermission
from .models import Product

# TODO: Create product model views


class ProductViewSet(ModelViewSet):
    """
    Product API
    - Admins: Full CRUD access
    - Supervisor: Change status of products
    - Manager | Operator: Read-only access
    """

    serializer_class = ProductSerializer
    permission_classes = [ProductPermission]
    queryset = Product.objects.all()


class ProductProcessViewSet(ModelViewSet):
    """
    Product Process API
    - Must be accessed through a product
    """

    serializer_class = ProductProcessSerializer
    permission_classes = [ProductPermission]

    def get_queryset(self):
        product_pk = self.kwargs.get("product_pk")
        product = get_object_or_404(Product, pk=product_pk)
        return (
            product.product_processes.all()
            .select_related("process")
            .order_by("sequence")
        )

    def perform_create(self, serializer):
        product_pk = self.kwargs.get("product_pk")
        product = get_object_or_404(Product, pk=product_pk)
        serializer.save(product=product)
