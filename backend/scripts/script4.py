from info import SAMPLE_MACHINES
from datetime import timedelta
from faker import Faker
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
from core.models import Workshop, Machine


def create_machines():
    workshops = Workshop.objects.all()
    fake = Faker()
    created_count = 0

    for workshop in workshops:
        if workshop.name in SAMPLE_MACHINES:
            print(f"✅ Workshop: {workshop.name}")
            machine_list = SAMPLE_MACHINES[workshop.name]
            machine_list = machine_list[:3]
            for machine_data in machine_list:
                created_count += 1
                print(
                    f"{created_count}) {machine_data["name"]} -> {machine_data["model_number"]}"
                )

                purchase_date = fake.date_between(start_date="-4y", end_date="-3y")
                last_maintenance_date = fake.date_between(
                    start_date=purchase_date, end_date="-30d"
                )
                next_maintenance_date = fake.date_between(
                    start_date=last_maintenance_date + timedelta(days=1),
                    end_date="+6m",
                )

                Machine(
                    name=machine_data["name"],
                    model_number=machine_data["model_number"],
                    workshop=workshop,
                    purchase_date=purchase_date,
                    last_maintenance_date=last_maintenance_date,
                    next_maintenance_date=next_maintenance_date,
                ).save()
                print(f"✅ Created machine")
            print("\n\n")

    print(f"Total machines created: {created_count}")


if __name__ == "__main__":
    create_machines()
