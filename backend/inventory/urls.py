from rest_framework.routers import DefaultRouter
from django.urls import path, include
from .views import (
    MaterialConsumptionViewSet,
    OrderMaterialViewSet,
    MaterialViewSet,
    SupplierViewSet,
    OrderViewSet,
)

router = DefaultRouter()
router.register(r"material", MaterialViewSet, basename="material")
router.register(r"supplier", SupplierViewSet, basename="supplier")
router.register(r"order", OrderViewSet, basename="order")
router.register(
    r"order/(?P<order_pk>\d+)/material",
    OrderMaterialViewSet,
    basename="order-material",
)
router.register(
    r"material-consumption",
    MaterialConsumptionViewSet,
    basename="material-consumption",
)

urlpatterns = [path("", include(router.urls))]
