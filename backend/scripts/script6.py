from info import SAMPLE_PRODUCTION_LINES, SAMPLE_PRODUCTION_LINE_CAPACITIES
from faker import Faker
import django
import random
import sys
import os

# 🔧 Add the project root to the path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# 🔧 Set Django settings module
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")

# ✅ Setup Django
django.setup()

# ⬇️ Your supplier generation logic below this
from production.models import ProductionLine
from core.models import Workshop, Machine


def create_production_lines():
    fake = Faker()
    workshops = Workshop.objects.all()
    for i in range(8):
        workshop = workshops[i]
        name = f"{workshop.name} {SAMPLE_PRODUCTION_LINES[i]}"
        try:
            production_line = ProductionLine.objects.create(
                name=name,
                workshop=workshop,
                production_capacity=random.choice(SAMPLE_PRODUCTION_LINE_CAPACITIES),
                description=fake.sentence(),
            )
            print(f"✅ Created production line: {name}")
        except Exception as e:
            print(f"⚠️ Failed to create production line {name}: {e}")


def add_machines():
    pls = ProductionLine.objects.all()
    for pl in pls:
        machines = Machine.objects.filter(workshop=pl.workshop)

        if machines.count() < 2:
            print(f"⚠️ Not enough machines in workshop for {pl.name}")
            continue

        for i in range(2):
            machine = machines[i]
            try:
                pl.machines.add(machine)
                pl.save()
                print(f"✅ Added machine {machine.name} to {pl.name}")

            except Exception as e:
                print(f"⚠️ Failed to add machine {machine.name} to {pl.name}: {e}")


if __name__ == "__main__":
    create_production_lines()
    add_machines()
