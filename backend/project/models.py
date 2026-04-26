from django.utils.translation import gettext_lazy as _
from django.core.exceptions import ValidationError
from labor.models import LaborAllocation
from django.db.models import (
    UniqueConstraint,
    ManyToManyField,
    DateTimeField,
    TextChoices,
    ForeignKey,
    CharField,
    TextField,
    DateField,
    SET_NULL,
    CASCADE,
    Model,
    Index,
)

# TODO: Create project models


class Project(Model):
    """
    Project Model

    - Many-to-One with Employee as project manager (a project has one manager) ☑️
    - One-to-Many with Tasks (a project has many tasks) ☑️
    - Many-to-Many with Employees through LaborAllocation (a project can have many employees) ☑️
    """

    class ProjectStatus(TextChoices):
        PLANNING = "PLANNING", _("Planning")
        IN_PROGRESS = "IN_PROGRESS", _("In Progress")
        COMPLETED = "COMPLETED", _("Completed")
        ON_HOLD = "ON_HOLD", _("On Hold")
        CANCELLED = "CANCELLED", _("Cancelled")

    name = CharField(max_length=255, unique=True)
    description = TextField(blank=True, null=True)
    start_date = DateField(auto_now_add=True)
    end_date = DateField(null=True, blank=True)
    actual_end_date = DateField(null=True, blank=True)
    project_status = CharField(
        max_length=20,
        choices=ProjectStatus.choices,
        default=ProjectStatus.PLANNING,
        verbose_name=_("project status"),
    )
    project_manager = ForeignKey(
        "main.User",
        null=True,
        blank=True,
        on_delete=SET_NULL,
        related_name="managed_projects",
        verbose_name=_("project manager"),
    )
    updated_at = DateTimeField(_("updated at"), auto_now=True)

    class Meta:
        ordering = ["start_date"]
        indexes = [Index(fields=["project_manager", "project_status"])]

    def __str__(self):
        return f"{self.name} -> {self.project_manager}"

    def clean(self):
        if self.project_manager and self.project_manager.role != "MANAGER":
            raise ValidationError(
                _("Only users with MANAGER role can be assigned as project managers.")
            )

        if self.end_date and self.start_date and self.end_date < self.start_date:
            raise ValidationError(_("End date cannot be before start date."))

        if (
            self.actual_end_date
            and self.end_date
            and self.actual_end_date < self.end_date
        ):
            raise ValidationError(_("Actual end date cannot be before end date."))

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)


class Task(Model):
    """
    Task Model

    - Many-to-One with Project (a task belongs to one project) ☑️
    - Many-to-One with Employee (a task is assigned to one employee) ☑️
    - Many-to-Many with Tasks (self) as dependencies ☑️
    - Many-to-Many with Employees through LaborAllocation (a task can have many employees) ☑️
    """

    class TaskStatus(TextChoices):
        PENDING = "PENDING", _("Pending")
        IN_PROGRESS = "IN_PROGRESS", _("In Progress")
        COMPLETED = "COMPLETED", _("Completed")
        BLOCKED = "BLOCKED", _("Blocked")
        CANCELLED = "CANCELLED", _("Cancelled")

    name = CharField(max_length=255, unique=True)
    description = TextField(blank=True, null=True)
    project = ForeignKey(
        Project,
        on_delete=CASCADE,
        related_name="tasks",
        verbose_name=_("project"),
    )
    assigned_to = ForeignKey(
        "main.User",
        on_delete=SET_NULL,
        null=True,
        blank=True,
        related_name="tasks",
        verbose_name=_("assigned to"),
    )
    start_date = DateField(auto_now_add=True)
    end_date = DateField(null=True, blank=True)
    actual_end_date = DateField(null=True, blank=True)
    status = CharField(
        max_length=20,
        verbose_name=_("status"),
        choices=TaskStatus.choices,
        default=TaskStatus.PENDING,
    )
    dependencies = ManyToManyField(
        "self",
        blank=True,
        symmetrical=False,
        related_name="dependent_tasks",
        verbose_name=_("dependencies"),
    )
    updated_at = DateTimeField(_("updated at"), auto_now=True)

    class Meta:
        ordering = ["start_date"]
        constraints = [
            UniqueConstraint(
                fields=["name", "project"], name="unique_task_name_per_project"
            ),
        ]
        indexes = [
            Index(fields=["project", "status"]),
            Index(fields=["assigned_to", "status"]),
        ]

    def __str__(self):
        return f"{self.name} -> {self.project.name}"

    def clean(self):
        if self.end_date and self.end_date < self.start_date:
            raise ValidationError(_("End date cannot be before start date."))

        if self.assigned_to and self.assigned_to.role != "OPERATOR":
            raise ValidationError(
                _("Only users with OPERATOR role can be assigned to tasks.")
            )

    def save(self, *args, **kwargs):
        self.clean()

        is_update = self.pk is not None
        old_assigned_to = None

        if is_update:
            try:
                old_instance = Task.objects.get(pk=self.pk)
                old_assigned_to = old_instance.assigned_to
            except Task.DoesNotExist:
                old_assigned_to = None

        super().save(*args, **kwargs)

        # !Handle LaborAllocation creation/updates
        assignment_changed = not is_update or old_assigned_to != self.assigned_to

        if assignment_changed:
            # !Remove old labor allocation if employee changed
            if is_update and old_assigned_to:
                LaborAllocation.objects.filter(
                    employee=old_assigned_to,
                    task=self,
                ).delete()

            # !Create new labor allocation for the assigned employee
            if self.assigned_to:
                # !Calculate estimated hours
                estimated_hours = 8.0
                if self.end_date and self.start_date:
                    days_diff = (self.end_date - self.start_date).days + 1
                    estimated_hours = min(days_diff * 8.0, 40.0)

                # !Create or update labor allocation based on unique constraint (employee, date, project)
                allocation, created = LaborAllocation.objects.update_or_create(
                    employee=self.assigned_to,
                    date=self.start_date,
                    project=self.project,
                    defaults={
                        "hours_allocated": estimated_hours,
                        "task": self,  # Set the most recent task for this allocation
                    },
                )

                # If allocation already exists and we're not creating a new one,
                # we might want to accumulate hours or update task reference
                if not created:
                    # Update the task reference to the current task
                    allocation.task = self
                    allocation.save()
