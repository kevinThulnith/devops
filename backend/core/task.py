from django.utils import timezone


def complete_assignment(machine):
    from .models import MachineOperatorAssignment

    now = timezone.now()
    MachineOperatorAssignment.objects.filter(machine=machine, status="ACTIVE").update(
        status="COMPLETED", removed_at=now
    )


def create_assignment(auto_remove_at, machine, operator):
    from .models import MachineOperatorAssignment

    MachineOperatorAssignment.objects.create(
        operator=operator,
        machine=machine,
        auto_remove_at=auto_remove_at,
        status="ACTIVE",
    )
