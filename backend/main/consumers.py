from backend.consumers import ConsumerBlock
from .permissions import UserPermissions

# TODO: Create consumer classes for core models


class UserConsumer(ConsumerBlock):
    group_name = "users"
    permission_class = UserPermissions

    @property
    def model_class(self):
        from .models import User

        return User
