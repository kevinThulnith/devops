from django.db.models import DecimalField, EmailField, FileField
from django.utils.translation import gettext_lazy as _
from django.core.exceptions import ValidationError
from django.core.validators import EmailValidator
from main.models import phone_validator
from django.db import transaction
from django.db.models import Sum
from django.db.models import (
    CheckConstraint,
    DateTimeField,
    TextChoices,
    ForeignKey,
    DateField,
    CharField,
    TextField,
    SET_NULL,
    CASCADE,
    Model,
    Index,
    Q,
)

# TODO: Create inventory models


class Material(Model):
    """
    Material Model

    - One-to-Many with Order items (a material can be in many Orders) ☑️
    """

    name = CharField(max_length=255, unique=True)
    description = TextField(blank=True, null=True)
    unit_of_measurement = CharField(max_length=50, blank=True, null=True)
    quantity = DecimalField(max_digits=10, decimal_places=2, default=0.00)
    reorder_level = DecimalField(max_digits=10, decimal_places=2, default=0.00)
    updated_at = DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]
        indexes = [Index(fields=["quantity"])]
        constraints = [
            CheckConstraint(
                check=Q(quantity__gte=0), name="material_quantity_non_negative"
            ),
            CheckConstraint(
                check=Q(reorder_level__gte=0),
                name="material_reorder_level_non_negative",
            ),
        ]

    def __str__(self):
        return f"{self.name} -> {self.quantity} {self.unit_of_measurement}"

    @property
    def is_low_stock(self):
        return self.quantity <= self.reorder_level

    @property
    def is_out_of_stock(self):
        return self.quantity == 0


class Supplier(Model):
    """
    Supplier Model

    - One-to-Many with orders (a supplier can have many purchases) ☑️
    """

    name = CharField(_("name"), max_length=150)
    address = TextField(_("address"), blank=True)
    email = EmailField(blank=True, unique=True, validators=[EmailValidator])
    phone = CharField(
        max_length=30,
        blank=True,
        unique=True,
        validators=[phone_validator],
    )

    class Meta:
        ordering = ["name"]
        indexes = [Index(fields=["name"])]

    def __str__(self):
        return self.name

    def clean(self):
        if not self.email and not self.phone:
            raise ValidationError("Either email or phone number must be provided")

    def save(self, *args, **kwargs):
        if "update_fields" not in kwargs:
            self.clean()
        super().save(*args, **kwargs)


class Order(Model):
    """
    Order Model

    - One-to-Many with Order Materials (an order can have many materials) ☑️
    - One-to-Many with Suppliers (an order can have one supplier) ☑️
    - One-to-Many with Employee (an order can have one employee) ☑️
    """

    class OrderStatus(TextChoices):
        DRAFT = "DRAFT", _("Draft")
        ORDERED = "ORDERED", _("Ordered")
        CANCELLED = "CANCELLED", _("Cancelled")
        RECEIVED = "RECEIVED", _("Received Complete")

    order_date = DateField(_("order date"), auto_now_add=True)
    supplier = ForeignKey(Supplier, on_delete=CASCADE, related_name="orders")
    created_by = ForeignKey(
        "main.User", on_delete=CASCADE, related_name="created_orders"
    )
    status = CharField(
        max_length=20,
        db_index=True,
        default=OrderStatus.DRAFT,
        choices=OrderStatus.choices,
    )
    updated_at = DateTimeField(_("updated at"), auto_now=True)
    total = DecimalField(max_digits=10, decimal_places=2, default=0.00)
    invoice = FileField(upload_to="invoices/", blank=True, null=True)

    class Meta:
        ordering = ["-order_date"]
        indexes = [Index(fields=["supplier", "status"])]
        constraints = [
            CheckConstraint(check=Q(total__gte=0), name="order_total_non_negative"),
        ]

    def __str__(self):
        return f"Order #{self.id} from {self.supplier.name}"

    def save(self, *args, **kwargs):
        is_receiving = False

        if self.pk:
            old_order = Order.objects.select_related(None).get(pk=self.pk)
            if (
                old_order.status != self.OrderStatus.RECEIVED
                and self.status == self.OrderStatus.RECEIVED
            ):
                is_receiving = True
        else:
            # !cant create an order as RECEIVED
            if self.status == self.OrderStatus.RECEIVED:
                raise ValidationError(_("Cannot create an order directly as RECEIVED."))

        if is_receiving and (not self.invoice):
            raise ValidationError(
                _("Cannot change status to RECEIVED without uploading an invoice.")
            )

        super().save(*args, **kwargs)

        # Update stocks only after a successful save
        if is_receiving:
            self._update_material_stocks()

    @transaction.atomic
    def _update_material_stocks(self):
        for order_material in self.order_materials.all():
            material = order_material.material
            material.quantity += order_material.quantity
            material.save(update_fields=["quantity"])


class OrderMaterial(Model):
    """
    Order Material Model

    - Many-to-One with Orders (an order can have many materials) ☑️
    - Many-to-One with Materials (a material can be in many orders) ☑️
    """

    order = ForeignKey(Order, on_delete=CASCADE, related_name="order_materials")
    material = ForeignKey(Material, on_delete=CASCADE, related_name="order_materials")
    quantity = DecimalField(max_digits=10, decimal_places=2)
    unit_price = DecimalField(max_digits=10, decimal_places=2)
    total_price = DecimalField(max_digits=10, decimal_places=2, default=0.00)

    class Meta:
        ordering = ["order"]
        unique_together = ["order", "material"]
        indexes = [Index(fields=["order"]), Index(fields=["material"])]
        constraints = [
            CheckConstraint(
                check=Q(quantity__gt=0), name="order_material_quantity_positive"
            ),
            CheckConstraint(
                check=Q(unit_price__gte=0),
                name="order_material_unit_price_non_negative",
            ),
            CheckConstraint(
                check=Q(total_price__gte=0),
                name="order_material_total_price_non_negative",
            ),
        ]

    def __str__(self):
        return f"{self.material.name} - {self.unit_price} - {self.quantity} -> {self.total_price}"

    def save(self, *args, **kwargs):
        if self.quantity < 0:
            raise ValidationError(_("Quantity cannot be negative."))

        if self.unit_price < 0:
            raise ValidationError(_("Unit price cannot be negative."))

        self.total_price = self.unit_price * self.quantity
        super().save(*args, **kwargs)
        self.update_order_total()

    def delete(self, *args, **kwargs):
        order = self.order
        super().delete(*args, **kwargs)
        self._calculate_and_save_order_total(order)

    def update_order_total(self):
        self._calculate_and_save_order_total(self.order)

    @transaction.atomic
    def _calculate_and_save_order_total(self, order):
        "Recalculate and save order total. Triggers Order signals."
        total = (
            OrderMaterial.objects.filter(order=order).aggregate(
                total=Sum("total_price")
            )["total"]
            or 0.00
        )

        order.total = total
        order.save(update_fields=["total", "updated_at"])


class MaterialConsumption(Model):
    """
    Unified Material Consumption Model

    Tracks material consumption from either a project Task or a ProductionSchedule.
    Exactly one of `task` or `production_schedule` must be set.

    - Many-to-One with Material (a material can be consumed many times) ☑️
    - Many-to-One with Task (optional – a task can consume many materials) ☑️
    - Many-to-One with ProductionSchedule (optional – a schedule can consume many materials) ☑️
    - Many-to-One with User (records who logged the consumption) ☑️
    """

    class ConsumptionType(TextChoices):
        TASK = "TASK", _("Task")
        PRODUCTION = "PRODUCTION", _("Production Schedule")

    material = ForeignKey(
        Material,
        on_delete=CASCADE,
        related_name="consumptions",
        verbose_name=_("material"),
    )
    task = ForeignKey(
        "project.Task",
        on_delete=CASCADE,
        null=True,
        blank=True,
        related_name="material_consumptions",
        verbose_name=_("task"),
    )
    production_schedule = ForeignKey(
        "production.ProductionSchedule",
        on_delete=CASCADE,
        null=True,
        blank=True,
        related_name="material_consumptions",
        verbose_name=_("production schedule"),
    )
    consumption_type = CharField(
        _("consumption type"),
        max_length=20,
        choices=ConsumptionType.choices,
    )
    quantity = DecimalField(
        _("quantity consumed"),
        max_digits=10,
        decimal_places=2,
    )
    consumed_at = DateTimeField(
        _("consumed at"),
        auto_now_add=True,
    )
    consumed_by = ForeignKey(
        "main.User",
        on_delete=SET_NULL,
        null=True,
        blank=True,
        related_name="material_consumptions",
        verbose_name=_("consumed by"),
    )
    notes = TextField(
        _("notes"),
        blank=True,
        null=True,
    )
    updated_at = DateTimeField(_("updated at"), auto_now=True)

    class Meta:
        ordering = ["-consumed_at"]
        indexes = [
            Index(fields=["material", "consumption_type"]),
            Index(fields=["task", "material"]),
            Index(fields=["production_schedule", "material"]),
            Index(fields=["consumed_at"]),
            Index(fields=["consumed_by"]),
        ]
        constraints = [
            CheckConstraint(
                check=Q(quantity__gt=0),
                name="consumption_quantity_positive",
            ),
        ]
        verbose_name = _("Material Consumption")
        verbose_name_plural = _("Material Consumptions")

    def __str__(self):
        source = (
            self.task.name
            if self.task
            else (
                self.production_schedule.product.name
                if self.production_schedule and self.production_schedule.product
                else "N/A"
            )
        )
        return f"{source} - {self.material.name}: {self.quantity} {self.material.unit_of_measurement}"

    def clean(self):
        # Ensure exactly one source is set
        has_task = self.task_id is not None
        has_schedule = self.production_schedule_id is not None

        if has_task and has_schedule:
            raise ValidationError(
                _(
                    "A consumption record cannot be linked to both a task and a production schedule."
                )
            )

        if not has_task and not has_schedule:
            raise ValidationError(
                _(
                    "A consumption record must be linked to either a task or a production schedule."
                )
            )

        # Auto-set consumption_type based on the source
        if has_task:
            self.consumption_type = self.ConsumptionType.TASK
        else:
            self.consumption_type = self.ConsumptionType.PRODUCTION

        if self.quantity is not None and self.quantity <= 0:
            raise ValidationError(_("Quantity must be greater than zero."))

        # Check sufficient stock (only for new records or quantity increases)
        if self.pk is None:
            if self.material.quantity < self.quantity:
                raise ValidationError(
                    _(
                        f"Insufficient stock for {self.material.name}. "
                        f"Available: {self.material.quantity} {self.material.unit_of_measurement}"
                    )
                )

    @transaction.atomic
    def save(self, *args, **kwargs):
        is_new = self.pk is None
        old_quantity = None

        if not is_new:
            try:
                old_instance = MaterialConsumption.objects.get(pk=self.pk)
                old_quantity = old_instance.quantity
            except MaterialConsumption.DoesNotExist:
                pass

        self.clean()
        super().save(*args, **kwargs)

        # Update material inventory
        if is_new:
            self.material.quantity -= self.quantity
            self.material.save(update_fields=["quantity"])
        elif old_quantity is not None and old_quantity != self.quantity:
            quantity_diff = self.quantity - old_quantity
            self.material.quantity -= quantity_diff
            self.material.save(update_fields=["quantity"])

    @transaction.atomic
    def delete(self, *args, **kwargs):
        # Return material to inventory when consumption is deleted
        self.material.quantity += self.quantity
        self.material.save(update_fields=["quantity"])
        super().delete(*args, **kwargs)
