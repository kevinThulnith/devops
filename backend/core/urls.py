from rest_framework.routers import DefaultRouter
from django.urls import path, include
from .views import (
    MachineOperatorAssignmentViewSet,
    DepartmentViewSet,
    WorkshopViewSet,
    MachineViewSet,
)

router = DefaultRouter()
router.register(r"department", DepartmentViewSet, basename="department")
router.register(r"workshop", WorkshopViewSet, basename="workshop")
router.register(r"machine", MachineViewSet, basename="machine")
router.register(
    r"machine-operator-assignments",
    MachineOperatorAssignmentViewSet,
    basename="machineOperatorAssignment",
)

urlpatterns = [path("", include(router.urls))]
