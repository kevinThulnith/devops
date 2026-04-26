from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from allauth.socialaccount.providers.oauth2.client import OAuth2Client
from .serializers import UserSerializer, GoogleLoginSerializer
from dj_rest_auth.registration.views import SocialLoginView
from rest_framework.generics import RetrieveUpdateAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import AllowAny
from .permissions import UserPermissions
from dotenv import load_dotenv
from .models import User
import logging
import os

load_dotenv()

logger = logging.getLogger(__name__)  # !Configure logging

# TODO: Create user views.


class UserViewSet(ModelViewSet):
    """
    User API:
    - Admins: Full CRUD.
    - SUPERVISORS and MANAGERS: Read-only access to for user account is same department.
    """

    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [UserPermissions]

    def get_queryset(self):
        """
        Filter queryset based on user role
        """
        if self.request.user.role == "ADMIN":
            return User.objects.all()

        if self.request.user.role in {"SUPERVISOR", "MANAGER"}:
            return User.objects.filter(department=self.request.user.department)

        # For other roles, return empty queryset
        return User.objects.none()


class MeView(RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


class GoogleLoginView(SocialLoginView):
    permission_classes = [AllowAny]
    adapter_class = GoogleOAuth2Adapter
    callback_url = os.getenv("GOOGLE_CALLBACK_URL")
    client_class = OAuth2Client
    serializer_class = GoogleLoginSerializer

    def get_adapter(self):
        return self.adapter_class(self.request)
