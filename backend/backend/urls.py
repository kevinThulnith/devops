from django.conf.urls.static import static
from django.urls import path, include
from django.http import JsonResponse
from django.contrib import admin
from django.conf import settings
from main.views import MeView

from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenBlacklistView,
    TokenRefreshView,
)

urlpatterns = [
    path("admin/", admin.site.urls),
    path("accounts/", include("allauth.urls")),
    path("api-auth/", include("rest_framework.urls")),
    path("api/token/", TokenObtainPairView.as_view(), name="get_token"),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="refresh_token"),
    path("api/token/blacklist/", TokenBlacklistView.as_view(), name="blacklist_token"),
    path(
        "api/health/",
        lambda request: JsonResponse({"status": "healthy"}),
        name="health_check",
    ),
    # !User URLs
    path("api/user/me/", MeView.as_view(), name="user_me"),
    path("api/", include("main.urls")),
    # !App URLs
    path("api/", include("core.urls")),
    path("api/", include("labor.urls")),
    path("api/", include("product.urls")),
    path("api/", include("project.urls")),
    path("api/", include("inventory.urls")),
    path("api/", include("production.urls")),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
