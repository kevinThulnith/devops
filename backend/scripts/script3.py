from info import SAMPLE_WORKSHOPS, WORKSHOP_DESCRIPTIONS
import django
import sys
import os

# 🔧 Add the project root to the path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# 🔧 Set Django settings module
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")

# ✅ Setup Django
django.setup()

# ⬇️ Your user generation logic below this
from core.models import Workshop, Department, User


def create_workshops():
    departments = Department.objects.all()
    i = 0
    for department in departments:
        if department.name in SAMPLE_WORKSHOPS:
            workshop_list = SAMPLE_WORKSHOPS[department.name]
            workshop_list = workshop_list[:3]
            for workshop in workshop_list:
                description = WORKSHOP_DESCRIPTIONS[workshop]
                print(
                    f" Creating workshop {workshop} for department {department.name}..."
                )
                Workshop(
                    name=workshop,
                    description=description,
                    department=department,
                ).save()
                print(
                    f"✅ Created workshop: {workshop} for department {department.name}"
                )


def add_managers():
    workshops = Workshop.objects.all()
    managers = User.objects.filter(role=User.Role.MANAGER)

    # make sure we have enough managers
    if managers.count() < workshops.count():
        print("Not enough managers for all workshops!")
        return

    for i, workshop in enumerate(workshops):
        manager = managers[i]
        print(f"Setting {manager.username} as manager for {workshop.name}")

        # Set the manager for the workshop
        workshop.manager = manager
        workshop.save()

        # Verify the changes
        workshop.refresh_from_db()
        manager.refresh_from_db()

        print(f"✅ Workshop: {workshop.name}")
        print(f"✅ Manager: {manager.username}")
        print(f"✅ Manager role: {manager.role}")
        print(f"✅ Manager department: {manager.department}")
        print("\n")


if __name__ == "__main__":
    create_workshops()
    add_managers()
