from .views import ProjectViewSet, ProjectTaskViewSet, TaskListView
from rest_framework.routers import DefaultRouter
from django.urls import path, include

router = DefaultRouter()
router.register(r"project", ProjectViewSet, basename="project")
router.register(r"task", TaskListView, basename="operator-tasks")
router.register(
    r"project/(?P<project_pk>\d+)/task", ProjectTaskViewSet, basename="project-task"
)

urlpatterns = [path("", include(router.urls))]
