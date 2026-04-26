from .views import ProductViewSet, ProductProcessViewSet
from rest_framework.routers import DefaultRouter
from django.urls import path, include

router = DefaultRouter()
router.register(r"product", ProductViewSet, basename="product")
router.register(
    r"product/(?P<product_pk>\d+)/process",
    ProductProcessViewSet,
    basename="product-process",
)

urlpatterns = [path("", include(router.urls))]
