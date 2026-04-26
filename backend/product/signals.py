from backend.signals import create_model_change_signal
from .permissions import ProductPermission
from .serializers import ProductSerializer
from .models import Product


product_signal = create_model_change_signal(
    Product,
    ProductSerializer,
    "products",
    "send_update",
    permission_class=ProductPermission,
)
