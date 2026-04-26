from info import SAMPLE_Manufacturing_Process
import django
import sys
import os

# 🔧 Add the project root to the path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# 🔧 Set Django settings module
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")

# ✅ Setup Django
django.setup()

# ⬇️ Your supplier generation logic below this
from production.models import ManufacturingProcess


# add manufacturing processes to the database
def create_manufacturing_processes():
    print("Creating manufacturing processes...")
    created_count = 0

    for mp_data in SAMPLE_Manufacturing_Process:
        # Check if the manufacturing process already exists
        existing_mp = ManufacturingProcess.objects.filter(name=mp_data["name"]).first()

        if existing_mp:
            print(
                f"Manufacturing process '{mp_data['name']}' already exists. Skipping..."
            )
            continue

        # Create new manufacturing process
        mp = ManufacturingProcess(
            name=mp_data["name"],
            description=mp_data["description"],
            standard_time=mp_data["standard_time"],
            quality_parameters=mp_data["quality_parameters"],
        )

        try:
            mp.save()
            created_count += 1
            print(f"✅ Created manufacturing process: {mp.name}")
        except Exception as e:
            print(f"❌ Error creating manufacturing process '{mp_data['name']}': {e}")

    print(f"\n🎉 Successfully created {created_count} manufacturing processes!")


if __name__ == "__main__":
    create_manufacturing_processes()
