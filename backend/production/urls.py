from rest_framework.routers import DefaultRouter
from django.urls import path, include
from .views import (
    ManufacturingProcessViewSet,
    ProductionScheduleViewSet,
    ProductionLineViewSet,
)

router = DefaultRouter()
router.register(r"production-line", ProductionLineViewSet, basename="production-line")
router.register(
    r"production-schedule", ProductionScheduleViewSet, basename="production-schedule"
)
router.register(
    r"manufacturing-process",
    ManufacturingProcessViewSet,
    basename="manufacturing-process",
)

urlpatterns = [path("", include(router.urls))]
