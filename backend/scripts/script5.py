from info import MATERIALS
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

# ⬇️ Your supplier generation logic below this
from inventory.models import Supplier, Material


def create_suppliers():
    fake = Faker()
    for i in range(12):
        print(f"\nCreating supplier {i+1}/{12}...")
        name = fake.company()  # Use company names for suppliers
        address = fake.address()
        email = fake.email()
        phone = fake.numerify("##########")  # Generate a 10-digit phone number

        print(
            f"Name: {name} \n Address: {address} \n Email: {email} \n Phone: {phone} \n\n"
        )

        if not Supplier.objects.filter(email=email).exists():
            supplier = Supplier.objects.create(  # Changed create_user to create
                name=name,
                address=address,
                email=email,
                phone=phone,
                # validators=[phone_validator],  # Uncomment if you have phone_validator
            )
            print(f"✅ Created supplier: {name}")
        else:
            print(f"⚠️ Supplier with email {email} already exists")


def create_material():
    for material_data in MATERIALS:
        material, created = Material.objects.get_or_create(
            name=material_data["name"],
            defaults={
                "description": material_data["description"],
                "unit_of_measurement": material_data["unit_of_measurement"],
                "quantity": material_data["quantity"],
                "reorder_level": material_data["reorder_level"],
            },
        )
        if created:
            print(f"\n ✅ Added new material: {material.name}")
        else:
            print(f"\n ⚠️ Material already exists: {material.name}")


if __name__ == "__main__":
    create_suppliers()
    create_material()
