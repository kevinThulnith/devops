from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import LaborAllocationViewset, SkillMatrixViewset

router = DefaultRouter()
router.register(r"allocation", LaborAllocationViewset, basename="labor-allocation")
router.register(r"skill-matrix", SkillMatrixViewset, basename="skill-matrix")

urlpatterns = [path("", include(router.urls))]
