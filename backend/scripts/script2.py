from info import SAMPLE_DEPARTMENTS
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
from core.models import Department, User


def create_departments():
    global SAMPLE_DEPARTMENTS
    supervisors = User.objects.filter(role=User.Role.SUPERVISOR)
    SAMPLE_DEPARTMENTS = SAMPLE_DEPARTMENTS[: len(supervisors)]
    fake = Faker()

    for i, department in enumerate(SAMPLE_DEPARTMENTS):
        supervisor = supervisors[i]
        try:
            Department(
                name=department,
                description=fake.sentence(),
                location=fake.city(),
                supervisor=supervisor,
            ).save()
            print(f"✅ Created department: {department}")
        except:
            print(f"⚠️ Department '{department}' already exists")


def set_operator_to_department():
    """
    set 10 operator to 5 departments
    change operator department to the department
    """
    departments = Department.objects.all()
    operators = User.objects.filter(role=User.Role.OPERATOR)

    for i, operator in enumerate(operators):
        department = departments[i % len(departments)]
        operator.department = department
        operator.save()
        print(f"✅ Assigned {operator.username} to {department.name}")


if __name__ == "__main__":
    create_departments()
    set_operator_to_department()
