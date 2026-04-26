from django.db.models import JSONField, ManyToManyField, PositiveIntegerField
from django.utils.translation import gettext_lazy as _
from django.core.exceptions import ValidationError
from django.db.models import (
    DateTimeField,
    TextChoices,
    ForeignKey,
    CharField,
    CASCADE,
    Model,
    Index,
)

# TODO: Create product tables


class Product(Model):
    """
    Product Model

    - Many-to-Many with ManufacturingProcesses through ProductProcess
    - One-to-Many with ProductionSchedules (a product has many schedules)
    - One-to-Many with QualityControl checks (a product has many QC checks)
    """

    class ProductStatus(TextChoices):
        ACTIVE = "ACTIVE", _("Active")
        INACTIVE = "INACTIVE", _("Inactive")
        DISCONTINUED = "DISCONTINUED", _("Discontinued")

    name = CharField(max_length=100, unique=True)
    code = CharField(max_length=100, unique=True)
    unit_of_measurement = CharField(max_length=50, blank=True, null=True)
    specifications = JSONField(default=dict)
    status = CharField(
        max_length=20,
        choices=ProductStatus.choices,
        default=ProductStatus.ACTIVE,
        verbose_name=_("status"),
    )
    updated_at = DateTimeField(auto_now=True)
    manufacturing_processes = ManyToManyField(
        "production.ManufacturingProcess",
        through="ProductProcess",
        related_name="products",
        blank=True,
        verbose_name=_("manufacturing processes"),
    )

    class Meta:
        ordering = ["name"]
        indexes = [
            Index(fields=["name"]),
            Index(fields=["code"]),
            Index(fields=["status"]),
        ]

    def __str__(self):
        return f"{self.name} ({self.code})"

    def clean(self):
        if self.code and not self.code.isalnum():
            raise ValidationError(_("Code must be alphanumeric."))

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)


class ProductProcess(Model):
    """
    Join table for Product-ManufacturingProcess many-to-many relationship
    with additional sequence field
    """

    product = ForeignKey(
        Product,
        on_delete=CASCADE,
        related_name="product_processes",
        verbose_name=_("product"),
    )
    process = ForeignKey(
        "production.ManufacturingProcess",
        on_delete=CASCADE,
        related_name="product_processes",
        verbose_name=_("process"),
    )
    sequence = PositiveIntegerField(_("sequence"), default=1)

    class Meta:
        ordering = ["sequence"]
        unique_together = ("product", "process", "sequence")
        indexes = [Index(fields=["product", "process"])]

    def __str__(self):
        return f"{self.product.name} -> {self.process.name} (Seq: {self.sequence})"

    def clean(self):
        if self.sequence <= 0:
            raise ValidationError(_("Sequence must be a positive integer."))

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)
