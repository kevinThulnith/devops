from backend.consumers import ConsumerBlock
from .permissions import ProductPermission

# TODO: Create consumer classes for product models

class ProductConsumer(ConsumerBlock):
    group_name = "products"
    permission_class = ProductPermission

    @property
    def model_class(self):
        from .models import Product

        return Product
