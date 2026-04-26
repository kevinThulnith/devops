from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from dj_rest_auth.registration.serializers import SocialLoginSerializer
from .models import User, _

from rest_framework.serializers import (
    SerializerMethodField,
    ModelSerializer,
    ValidationError,
    ReadOnlyField,
    CharField,
)

# TODO: Create user model serializers


class UserSerializer(ModelSerializer):
    department_name = CharField(source="department.name", read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "name",
            "first_name",
            "last_name",
            "email",
            "username",
            "password",
            "dob",
            "nic",
            "mobile_no",
            "role",
            "is_active",
            "department",
            "department_name",
        ]

        extra_kwargs = {
            "password": {"write_only": True, "min_length": 8, "required": False}
        }

    def create(self, validated_data):
        password = validated_data.pop("password", None)

        if password is None:
            raise ValidationError(
                {"password": [_("This field is required for registration.")]}
            )

        user = User.objects.create_user(password=password, **validated_data)
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)
        user = super().update(instance, validated_data)

        if password:
            user.set_password(password)
            user.save()

        return user


class UserUpdateSerializer(ModelSerializer):
    department_name = CharField(source="department.name", read_only=True)
    managed_workshop_name = SerializerMethodField(read_only=True)
    name = ReadOnlyField()

    class Meta:
        model = User
        fields = [
            "id",
            "name",
            "first_name",
            "last_name",
            "email",
            "username",
            "password",
            "dob",
            "nic",
            "role",
            "mobile_no",
            "department",
            "department_name",
            "managed_workshop_name",
        ]
        extra_kwargs = {
            "password": {"write_only": True, "min_length": 8, "required": False}
        }
        read_only_fields = ["role", "department", "username"]

    def get_managed_workshop_name(self, obj):
        if obj.role == User.Role.MANAGER:
            workshop = obj.managed_workshops.first()
            return workshop.name if workshop else None
        return None

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)
        user = super().update(instance, validated_data)

        if password:
            user.set_password(password)
            user.save()

        return user


class GoogleLoginSerializer(SocialLoginSerializer):
    # !These fields are required to accept the token/code from the frontend
    code = CharField(required=False, allow_blank=True)
    access_token = CharField(required=False, allow_blank=True)
    id_token = CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        # Use the standard dj-rest-auth flow with GoogleOAuth2Adapter
        view = self.context.get("view")
        request = self.context.get("request")

        # Set the adapter for this request
        if not hasattr(view, "adapter_class"):
            view.adapter_class = GoogleOAuth2Adapter

        # Let the parent serializer handle the validation
        return super().validate(attrs)

        return attrs
