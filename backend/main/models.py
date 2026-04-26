from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.utils.translation import gettext_lazy as _
from django.core.validators import RegexValidator
from django.db import models

# TODO: Declare field validators

phone_validator = RegexValidator(
    regex=r"^\d{10}$", message=_("Mobile number must be 10 digits")
)

nic_validator = RegexValidator(
    regex=r"^[0-9]{10}$", message=_("NIC must be in valid format")
)


# TODO: Create authentication backend for custom user model


class UserManager(BaseUserManager):
    "Custom user manager"

    def create_user(self, email=None, username=None, password=None, **args):
        "Create and return a user"
        if not email:
            raise ValueError(_("The email must be set"))

        # Auto-generate username from email if not provided (for social auth)
        if not username:
            username = email.split("@")[0]
            # Ensure username is unique
            base_username = username
            counter = 1
            while self.model.objects.filter(username=username).exists():
                username = f"{base_username}{counter}"
                counter += 1

        if ("role" in args) and (args["role"] == User.Role.ADMIN):
            raise ValueError(_("Regular users cannot be created with Admin role"))

        email = self.normalize_email(email)

        if "is_active" not in args:
            args["is_active"] = True
        if "is_staff" not in args:
            args["is_staff"] = False
        if "is_superuser" not in args:
            args["is_superuser"] = False

        user = self.model(
            email=email,
            username=username,
            **args,
        )

        # Only set password if provided (for social auth compatibility)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()

        user.save(using=self._db)
        return user

    def create_superuser(self, email, username, password, **args):
        "Create and return a superuser"
        args.update(
            {
                "is_staff": True,
                "is_active": True,
                "is_superuser": True,
                "role": User.Role.ADMIN,
            }
        )

        if not args["is_staff"]:
            raise ValueError(_("Superuser must have is_staff=True."))
        if not args["is_superuser"]:
            raise ValueError(_("Superuser must have is_superuser=True."))
        if args["role"] != User.Role.ADMIN:
            raise ValueError(_("Superuser must have role of Admin."))

        user = self.model(email=self.normalize_email(email), username=username, **args)
        user.set_password(password)
        user.save(using=self._db)
        return user


class User(AbstractUser):
    """
    Custom user model

    - Many-to-One with Department (an employee belongs to one department) ☑️
    - One-to-Many with Projects (as manager) ☑️
    - One-to-Many with Tasks (assigned to) ☑️
    - One-to-Many with SkillMatrix entries ☑️
    - One-to-Many with LaborAllocations ☑️
    """

    class Role(models.TextChoices):
        ADMIN = "ADMIN", _("Admin")
        MANAGER = "MANAGER", _("Manager")
        SUPERVISOR = "SUPERVISOR", _("Supervisor")
        OPERATOR = "OPERATOR", _("Operator")
        TECHNICIAN = "TECHNICIAN", _("Technician")
        PURCHASING = "PURCHASING", _("Purchasing Staff")

    # Core personal information
    dob = models.DateField(_("birthday"), null=True, blank=True)
    nic = models.CharField(
        _("NIC"),
        max_length=10,
        unique=True,
        validators=[nic_validator],
        null=True,
        blank=True,
    )
    mobile_no = models.CharField(
        _("mobile"),
        max_length=10,
        unique=True,
        validators=[phone_validator],
        null=True,
        blank=True,
    )

    # Role and Department
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.OPERATOR)
    department = models.ForeignKey(
        "core.Department",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="users",
    )

    # Metadata
    updated_at = models.DateTimeField(_("updated at"), auto_now=True)
    created_at = models.DateTimeField(_("created at"), auto_now_add=True)

    # Remove unused fields from AbstractUser
    groups = None
    user_permissions = None

    # Authentication Config
    objects = UserManager()
    USERNAME_FIELD = "username"
    REQUIRED_FIELDS = ["email"]

    class Meta:
        ordering = ["username"]
        verbose_name = _("user")
        verbose_name_plural = _("users")
        indexes = [
            models.Index(fields=["email"]),
            models.Index(fields=["username"]),
        ]

    @property
    def name(self):
        return f"{self.first_name} {self.last_name}".strip()

    def __str__(self):
        return self.first_name + " " + self.last_name
