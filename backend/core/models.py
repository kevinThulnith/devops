from .task import complete_assignment, create_assignment
from django.utils.translation import gettext_lazy as _
from django.core.exceptions import ValidationError
from django.db.models.signals import post_save
from django.contrib.auth import get_user_model
from django.db import transaction, connection
from project.models import Project
from django.utils import timezone
from datetime import timedelta
import threading
import logging
import atexit
import time

from django.db.models import (
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

User = get_user_model()
_operator_checker_thread = None
logger = logging.getLogger(__name__)

# TODO: Create core models


class Department(Model):
    """
    Department Model

    - One-to-Many with Employees (a department has many employees) ☑️
    - One-to-Many with Workshop (a department has many workshop areas) ☑️
    - One-to-One with Employee as department head (optional) ☑️
    """

    name = CharField(max_length=255, unique=True)
    description = TextField(blank=True, null=True)
    location = CharField(blank=True, null=True)
    supervisor = ForeignKey(
        User,
        null=True,
        blank=True,
        on_delete=SET_NULL,
        related_name="supervised_departments",
    )
    updated_at = DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]
        indexes = [Index(fields=["name"]), Index(fields=["supervisor"])]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        old_supervisor_id = None

        if self.pk:
            old_supervisor_id = (
                Department.objects.filter(pk=self.pk)
                .values_list("supervisor_id", flat=True)
                .first()
            )

        super().save(*args, **kwargs)

        # !Skip if no change
        if self.supervisor_id == old_supervisor_id:
            return

        # !Update old supervisor
        if old_supervisor_id:

            # TODO: Check if they supervise other departments
            other_departments = Department.objects.filter(
                supervisor_id=old_supervisor_id
            ).exclude(pk=self.pk)

            if not other_departments.exists():
                # !Only change role if they were a SUPERVISOR and are no longer supervising any department
                User.objects.filter(pk=old_supervisor_id, role="SUPERVISOR").update(
                    role="OPERATOR", department=None
                )

        # !Update new supervisor
        if self.supervisor:
            self.supervisor.role = "SUPERVISOR"
            self.supervisor.department = self
            self.supervisor.save(update_fields=["role", "department"])


class Workshop(Model):
    """
    Workshop Model

    - One-to-Many with ProductionLines (a workshop has many production lines) ☑️
    - Many-to-One with Department (a workshop belongs to one department) ☑️
    - One-to-Many with Machines (a workshop has many machines) ☑️
    """

    class OperationalStatus(TextChoices):
        ACTIVE = "ACTIVE", _("Active")
        INACTIVE = "INACTIVE", _("Inactive")
        MAINTENANCE = "MAINTENANCE", _("Under Maintenance")

    name = CharField(max_length=100, unique=True)
    description = TextField()
    department = ForeignKey(Department, on_delete=CASCADE, related_name="workshops")
    manager = ForeignKey(
        User,
        null=True,
        blank=True,
        on_delete=SET_NULL,
        related_name="managed_workshops",
    )
    operational_status = CharField(
        max_length=20,
        default=OperationalStatus.ACTIVE,
        choices=OperationalStatus.choices,
    )
    updated_at = DateTimeField(auto_now=True)

    required_fields = ["name", "department", "description"]

    class Meta:
        ordering = ["name"]
        indexes = [
            Index(fields=["name"]),
            Index(fields=["manager"]),
            Index(fields=["department"]),
            Index(fields=["operational_status"]),
        ]

    def __str__(self):
        return f"{self.name} -> ({self.department})"

    def save(self, *args, **kwargs):
        old_manager_id = None

        if self.pk:
            old_manager_id = (
                Workshop.objects.filter(pk=self.pk)
                .values_list("manager_id", flat=True)
                .first()
            )

        super().save(*args, **kwargs)

        # !If manager hasn't changed, exit early
        if self.manager_id == old_manager_id:
            return

        # !Handle old manager: set to OPERATOR if no other workshops | projects are managed
        if old_manager_id:
            other_workshops = Workshop.objects.filter(
                manager_id=old_manager_id
            ).exclude(pk=self.pk)
            other_projects = Project.objects.filter(manager_id=old_manager_id)
            if not other_workshops.exists() and not other_projects.exists():
                User.objects.filter(pk=old_manager_id).update(
                    role="OPERATOR", department=None
                )

        # !Update new manager’s role and department
        if self.manager:
            self.manager.role = "MANAGER"
            self.manager.department = self.department
            self.manager.save(update_fields=["role", "department"])


class Machine(Model):
    """
    Machine Model

    - Many-to-One with Workshop (a machine belongs to one workshop) ☑️
    - One-to-Many with MachineOperatorAssignment (a machine can have many operator assignments) ☑️
    """

    class Status(TextChoices):
        IDLE = "IDLE", _("Idle")
        BROKEN = "BROKEN", _("Broken Down")
        OPERATIONAL = "OPERATIONAL", _("Operational")
        MAINTENANCE = "MAINTENANCE", _("Under Maintenance")

    name = CharField(max_length=100, unique=True, db_index=True)
    model_number = CharField(max_length=100, unique=True)
    status = CharField(max_length=20, choices=Status.choices, default=Status.IDLE)
    workshop = ForeignKey(Workshop, on_delete=CASCADE, related_name="machines")
    purchase_date = DateField()

    last_maintenance_date = DateField(null=True, blank=True)
    next_maintenance_date = DateField(null=True, blank=True)

    operator = ForeignKey(User, on_delete=SET_NULL, null=True, blank=True)
    operator_assigned_at = DateTimeField(null=True, blank=True)
    operator_auto_remove_at = DateTimeField(null=True, blank=True)

    required_fields = ["name", "workshop", "model_number", "purchase_date"]

    class Meta:
        ordering = ["workshop", "name"]
        indexes = [
            Index(fields=["name"]),
            Index(fields=["status"]),
            Index(fields=["workshop"]),
            Index(fields=["operator"]),
            Index(fields=["operator_auto_remove_at"]),
        ]

    def __str__(self):
        return f"{self.name} ({self.workshop.name})"

    @transaction.atomic
    def assign_operator(self, operator):
        if not operator:
            return self.clear_operator()

        # !Check if operator belongs to the same department as the machine's workshop
        if operator.department != self.workshop.department:
            raise ValidationError(
                f"Cannot assign operator from {operator.department} to machine in {self.workshop.department} department"
            )

        # !Complete any existing assignments using task function
        complete_assignment(self)

        # !Update machine fields atomically (including status)
        Machine.objects.filter(pk=self.pk).update(
            operator=operator,
            status=self.Status.OPERATIONAL,
            operator_assigned_at=timezone.now(),
            operator_auto_remove_at=timezone.now() + timedelta(hours=8),
        )

        # !Refresh instance to reflect database changes
        self.refresh_from_db(
            fields=[
                "status",
                "operator",
                "operator_assigned_at",
                "operator_auto_remove_at",
            ]
        )

        # !Fire post_save signal so WebSocket consumers receive the update
        post_save.send(sender=Machine, instance=self, created=False)

        # !Create new assignment record using task function
        create_assignment(timezone.now() + timedelta(hours=8), self, operator)

        # !Ensure checker thread is running
        start_operator_checker_thread()

        logger.info(
            f"Operator {operator} assigned to machine {self.pk} until {timezone.now() + timedelta(hours=8)}"
        )

    @transaction.atomic
    def clear_operator(self):
        if not self.operator:
            return

        # !Complete active assignments using task function
        complete_assignment(self)

        # !Clear machine fields atomically (including status)
        Machine.objects.filter(pk=self.pk).update(
            operator=None,
            status=self.Status.IDLE,
            operator_assigned_at=None,
            operator_auto_remove_at=None,
        )

        # !Refresh instance
        self.refresh_from_db(
            fields=[
                "status",
                "operator",
                "operator_assigned_at",
                "operator_auto_remove_at",
            ]
        )

        # !Fire post_save signal so WebSocket consumers receive the update
        post_save.send(sender=Machine, instance=self, created=False)

        logger.info(f"Cleared operator from machine {self.pk}")

    def clean(self):
        if self.operator and self.operator.department != self.workshop.department:
            raise ValidationError(
                f"Operator {self.operator} does not belong to the same department as the machine's workshop."
            )

        if self.purchase_date and self.purchase_date > timezone.now().date():
            raise ValidationError("Purchase date cannot be in the future.")

        if (
            self.last_maintenance_date
            and self.next_maintenance_date
            and self.last_maintenance_date >= self.next_maintenance_date
        ):
            raise ValidationError(
                "Next maintenance date must be after last maintenance date."
            )

    def save(self, *args, **kwargs):
        self.clean()

        if "update_fields" in kwargs:
            return super().save(*args, **kwargs)

        is_new = self.pk is None
        old_operator_id = None
        old_status = None

        # !Get old operator ID and status for comparison (only if updating)
        if not is_new:
            old = (
                Machine.objects.filter(pk=self.pk)
                .values_list("operator_id", "status")
                .first()
            )
            if old:
                old_operator_id, old_status = old

        super().save(*args, **kwargs)

        # !If status changed to BROKEN, clear the operator without resetting status
        if (
            self.status == self.Status.BROKEN
            and old_status != self.Status.BROKEN
            and self.operator_id
        ):
            complete_assignment(self)
            Machine.objects.filter(pk=self.pk).update(
                operator=None,
                operator_assigned_at=None,
                operator_auto_remove_at=None,
            )
            self.refresh_from_db(
                fields=["operator", "operator_assigned_at", "operator_auto_remove_at"]
            )
            post_save.send(sender=Machine, instance=self, created=False)
            logger.info(
                f"Cleared operator from machine {self.pk} because status changed to BROKEN"
            )
            return

        # !Handle operator assignment logic
        if is_new and self.operator:
            self.assign_operator(self.operator)

        # TODO: Check if operator changed
        elif old_operator_id != self.operator_id:
            if self.operator:
                self.assign_operator(self.operator)
            else:
                self.clear_operator()

    @classmethod
    def get_expired_assignments(cls):
        "Get machines with expired operator assignments"
        now = timezone.now()
        return cls.objects.filter(
            operator__isnull=False,
            operator_auto_remove_at__lte=now,
        ).select_related("operator", "workshop")

    @classmethod
    def clear_expired_assignments(cls):
        "Clear all expired operator assignments"
        expired_machines = cls.get_expired_assignments()
        count = expired_machines.count()

        if count == 0:
            return 0

        logger.info(f"Found {count} machines with expired operator assignments")

        cleared_count = 0
        for machine in expired_machines:
            try:
                with transaction.atomic():
                    # Use task function to complete assignments
                    complete_assignment(machine)

                    # Clear machine fields atomically
                    Machine.objects.filter(pk=machine.pk).update(
                        operator=None,
                        operator_assigned_at=None,
                        operator_auto_remove_at=None,
                        status=cls.Status.IDLE,
                    )

                    # !Refresh and fire signal so WebSocket consumers receive the update
                    machine.refresh_from_db(
                        fields=[
                            "status",
                            "operator",
                            "operator_assigned_at",
                            "operator_auto_remove_at",
                        ]
                    )
                    post_save.send(sender=cls, instance=machine, created=False)

                    cleared_count += 1
                    logger.info(f"Cleared expired operator from machine {machine.pk}")
            except Exception as e:
                logger.error(
                    f"Error clearing expired operator from machine {machine.pk}: {e}"
                )

        return cleared_count

    @property
    def is_operational(self):
        "Chek if machine is operational"
        return self.status == self.Status.OPERATIONAL

    @property
    def has_operator(self):
        "Chec if machine has an operator assigned"
        return self.operator is not None

    @property
    def is_assignment_expired(self):
        "Check i current operator assignment is expired"
        if not self.operator_auto_remove_at:
            return False
        return timezone.now() >= self.operator_auto_remove_at

    def get_current_assignment(self):
        "Get the crrent active assignment for this machine"
        return self.operator_assignments.filter(
            status="ACTIVE", removed_at__isnull=True
        ).first()

    def get_assignment_history(self):
        "Get assignmet history for this machine"
        return self.operator_assignments.all().order_by("-assigned_at")


class MachineOperatorAssignment(Model):
    """
    Model Machine Operator Assignments

    - One-to-Many with Machine (a machine can have many operator assignments) ☑️
    - Many-to-One with User (an operator can be assigned to many machines) ☑️
    """

    machine = ForeignKey(
        Machine, on_delete=CASCADE, related_name="operator_assignments"
    )
    operator = ForeignKey(User, on_delete=CASCADE, related_name="machine_assignments")
    assigned_at = DateTimeField(auto_now_add=True)
    auto_remove_at = DateTimeField()
    removed_at = DateTimeField(null=True, blank=True)
    status = CharField(
        max_length=20,
        choices=[
            ("ACTIVE", "Active"),
            ("COMPLETED", "Completed"),
            ("CANCELLED", "Cancelled"),
        ],
        default="ACTIVE",
    )

    class Meta:
        ordering = ["-assigned_at"]
        indexes = [
            Index(fields=["assigned_at"]),
            Index(fields=["auto_remove_at"]),
            Index(fields=["machine", "status"]),
            Index(fields=["operator", "status"]),
        ]

    def __str__(self):
        return f"{self.operator.name} → {self.machine.name} ({self.status})"

    def clean(self):
        if self.removed_at and self.removed_at < self.assigned_at:
            raise ValidationError(
                {"removed_at": "Removal time cannot be earlier than assignment time"}
            )

        if self.operator.department != self.machine.workshop.department:
            raise ValidationError(
                "Operator's department does not match the machine's workshop department."
            )

        if self.operator.role != "OPERATOR":
            raise ValidationError("Assigned user must have the OPERATOR role.")

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)


class OperatorCheckerThread(threading.Thread):
    "Background thread to check and clear expired operator assignments"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.daemon = True
        self.running = True
        self.name = "OperatorCheckerThread"

    def run(self):
        logger.info("Starting operator checker thread")
        while self.running:
            try:
                self._check_and_clear_expired()
                time.sleep(60)
            except Exception as e:
                logger.error(f"Error checking expired operators: {e}")
                time.sleep(30)
        logger.info("Operator checker thread finished")

    def _check_and_clear_expired(self):
        "Check and clear expired operator assignments"
        # Close any existing database connections to avoid connection issues
        connection.close()

        try:
            cleared_count = Machine.clear_expired_assignments()
            if cleared_count > 0:
                logger.info(f"Cleared {cleared_count} expired operator assignments")
        except Exception as e:
            logger.error(f"Error clearing expired assignments: {e}")

    def stop(self):
        "Stop the thread gracefully"
        self.running = False
        logger.info("Stopping operator checker thread...")


def cleanup_operator_thread():
    "Cleanup function to ensure thread stops on app shutdown"
    stop_operator_checker_thread()


# Register cleanup function
atexit.register(cleanup_operator_thread)


def start_operator_checker_thread():
    "Start the operator checker thread if it's not already running"
    global _operator_checker_thread

    # Check if thread exists and is still alive
    if _operator_checker_thread is not None and _operator_checker_thread.is_alive():
        logger.debug("Operator checker thread is already running")
        return

    try:
        _operator_checker_thread = OperatorCheckerThread()
        _operator_checker_thread.start()
        logger.info("Started operator checker thread")
    except Exception as e:
        logger.error(f"Failed to start operator checker thread: {e}")
        _operator_checker_thread = None


def stop_operator_checker_thread():
    "Stop the operator checker thread"
    global _operator_checker_thread

    if _operator_checker_thread and _operator_checker_thread.is_alive():
        try:
            _operator_checker_thread.stop()
            _operator_checker_thread.join(timeout=5)

            if _operator_checker_thread.is_alive():
                logger.warning("Operator checker thread did not stop gracefully")
            else:
                logger.info("Stopped operator checker thread")

        except Exception as e:
            logger.error(f"Error stopping operator checker thread: {e}")
        finally:
            _operator_checker_thread = None
    else:
        logger.debug("No operator checker thread to stop")
