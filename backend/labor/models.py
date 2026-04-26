from django.utils.translation import gettext_lazy as _
from django.core.exceptions import ValidationError
from django.utils.timezone import now
from django.db.models import (
    UniqueConstraint,
    CheckConstraint,
    DateTimeField,
    DecimalField,
    TextChoices,
    ForeignKey,
    CharField,
    TextField,
    DateField,
    CASCADE,
    Model,
    Index,
    Q,
)


# TODO:Create labor models here.


class LaborAllocation(Model):
    """
    Labor Allocation Model

    - Many-to-One with Employee (an allocation is for one employee) ☑️
    - Many-to-One with Project (optional - an allocation can be for a project) ☑️
    - Many-to-One with Task (optional - an allocation can be for a task) ☑️
    - Many-to-One with ProductionLine (optional - an allocation can be for a production line) ☑️
    """

    employee = ForeignKey(
        "main.User",
        on_delete=CASCADE,
        related_name="labor_allocations",
        verbose_name=_("employee"),
    )
    project = ForeignKey(
        "project.Project",
        on_delete=CASCADE,
        related_name="labor_allocations",
        verbose_name=_("project"),
        null=True,
        blank=True,
    )
    task = ForeignKey(
        "project.Task",
        on_delete=CASCADE,
        related_name="labor_allocations",
        verbose_name=_("task"),
        null=True,
        blank=True,
    )
    production_line = ForeignKey(
        "production.ProductionLine",
        on_delete=CASCADE,
        related_name="labor_allocations",
        verbose_name=_("production line"),
        null=True,
        blank=True,
    )
    hours_allocated = DecimalField(max_digits=10, decimal_places=2, default=4.00)
    updated_at = DateTimeField(auto_now=True)
    date = DateField(default=now)

    class Meta:
        constraints = [
            CheckConstraint(
                check=Q(project__isnull=False)
                | Q(task__isnull=False)
                | Q(production_line__isnull=False),
                name="labor_allocation_has_target",
            ),
            UniqueConstraint(
                fields=["employee", "date", "project"],
                condition=Q(project__isnull=False),
                name="unique_allocation_per_employee_date_project",
            ),
            UniqueConstraint(
                fields=["employee", "date", "task"],
                condition=Q(task__isnull=False),
                name="unique_allocation_per_employee_date_task",
            ),
            UniqueConstraint(
                fields=["employee", "date", "production_line"],
                condition=Q(production_line__isnull=False),
                name="unique_allocation_per_employee_date_production_line",
            ),
        ]
        indexes = [
            Index(fields=["employee", "date"]),
            Index(fields=["project", "date"]),
            Index(fields=["task", "date"]),
            Index(fields=["production_line", "date"]),
        ]

    def __str__(self):
        if self.task:
            return f"{self.employee.name} - {self.task.name} ({self.date})"
        elif self.production_line:
            return f"{self.employee.name} - {self.production_line.name} ({self.date})"
        return f"{self.employee.name} - {self.project.name} ({self.date})"

    def clean(self):
        if not any([self.project, self.task, self.production_line]):
            raise ValidationError(
                "At least one of project, task, or production line must be specified."
            )

        if self.employee and self.employee.role != "OPERATOR":
            raise ValidationError(
                _("Only users with OPERATOR role can be assigned to tasks.")
            )

        if self.hours_allocated <= 0:
            raise ValidationError(_("Hours allocated must be greater than zero."))

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)


class SkillMatrix(Model):
    """
    Skill Matrix Model - representing employee skills and competencies.

    - Many-to-One with Employee (a skill entry belongs to one employee) ☑️
    """

    class SkillLevel(TextChoices):
        BEGINNER = "BEGINNER", _("Beginner")
        INTERMEDIATE = "INTERMEDIATE", _("Intermediate")
        ADVANCED = "ADVANCED", _("Advanced")
        EXPERT = "EXPERT", _("Expert")

    class SkillCategory(TextChoices):
        TECHNICAL = "TECHNICAL", _("Technical")
        MECHANICAL = "MECHANICAL", _("Mechanical")
        ELECTRICAL = "ELECTRICAL", _("Electrical")
        SOFTWARE = "SOFTWARE", _("Software")
        MANAGEMENT = "MANAGEMENT", _("Management")
        ADMINISTRATION = "ADMINISTRATION", _("Administration")
        QUALITY_CONTROL = "QUALITY_CONTROL", _("Quality Control")
        SAFETY = "SAFETY", _("Safety")
        LOGISTICS = "LOGISTICS", _("Logistics")
        MAINTENANCE = "MAINTENANCE", _("Maintenance")
        OPERATIONS = "OPERATIONS", _("Operations")
        DESIGN = "DESIGN", _("Design")
        OTHER = "OTHER", _("Other")

    name = CharField(max_length=255)
    description = TextField(blank=True, null=True)
    category = CharField(
        max_length=50, choices=SkillCategory.choices, default=SkillCategory.OTHER
    )
    level = CharField(
        max_length=50, choices=SkillLevel.choices, default=SkillLevel.BEGINNER
    )
    employee = ForeignKey("main.User", on_delete=CASCADE, related_name="skills")

    class Meta:
        unique_together = ("employee", "name")
        verbose_name = _("skill matrix")
        verbose_name_plural = _("skill matrices")

    def clean(self):
        if self.employee and self.employee.role == "ADMIN":
            raise ValidationError(_("Admins cannot have skill matrix entries."))

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.employee.username} - {self.name} -> {self.level}"
