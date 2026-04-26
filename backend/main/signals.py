from backend.signals import create_model_change_signal
from .permissions import UserPermissions
from .serializers import UserSerializer
from .models import User

# TODO: Create signals for main models

user_signal = create_model_change_signal(
    User, UserSerializer, "users", "send_update", permission_class=UserPermissions
)
