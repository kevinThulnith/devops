from rest_framework.routers import DefaultRouter
from django.urls import path, include
from . import views

router = DefaultRouter()
router.register(r"user", views.UserViewSet, basename="user")
urlpatterns = [
    path("", include(router.urls)),
    # dj-rest-auth urls
    path("auth/", include("dj_rest_auth.urls")),
    path("auth/registration/", include("dj_rest_auth.registration.urls")),
    # Google login
    path("auth/google/", views.GoogleLoginView.as_view(), name="google_login"),
]
