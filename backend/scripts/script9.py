from django.utils import timezone
from datetime import timedelta
from decimal import Decimal
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

# ⬇️ Your production schedule generation logic below this
from production.models import ProductionSchedule, ProductionLine
from product.models import Product
from main.models import User

fake = Faker()


def create_production_schedules():
    "Create production schedules with realistic data"
    print("Creating production schedules...")

    # Get existing data
    production_lines = list(ProductionLine.objects.filter(operational_status="ACTIVE"))
    products = list(Product.objects.all())
    users = list(User.objects.filter(role__in=["ADMIN", "MANAGER", "SUPERVISOR"]))

    if not production_lines:
        print("❌ No active production lines found. Create production lines first.")
        return

    if not products:
        print("❌ No products found. Create products first.")
        return

    if not users:
        print("❌ No suitable users found. Create users first.")
        return

    created_count = 0

    # Generate schedules for the next 30 days
    start_date = timezone.now()

    for day_offset in range(30):  # 30 days of schedules
        current_date = start_date + timedelta(days=day_offset)

        # Skip weekends for production (optional business logic)
        if current_date.weekday() >= 5:  # Saturday = 5, Sunday = 6
            continue

        # Create 2-5 schedules per day
        daily_schedules = random.randint(2, 5)

        for _ in range(daily_schedules):
            # Select random production line and product
            production_line = random.choice(production_lines)
            product = random.choice(products)
            created_by = random.choice(users)

            # Generate realistic schedule times
            start_hour = random.randint(6, 14)  # Start between 6 AM and 2 PM
            start_minute = random.choice([0, 15, 30, 45])  # 15-minute intervals

            schedule_start = current_date.replace(
                hour=start_hour, minute=start_minute, second=0, microsecond=0
            )

            # Random quantity based on production capacity
            max_quantity = min(production_line.production_capacity, Decimal("1000"))
            quantity = Decimal(str(random.randint(10, int(max_quantity))))

            # Determine status based on date
            if current_date.date() < timezone.now().date():
                # Past schedules - mostly completed
                status = random.choices(
                    [
                        ProductionSchedule.ScheduleStatus.COMPLETED,
                        ProductionSchedule.ScheduleStatus.CANCELLED,
                    ],
                    weights=[85, 15],  # 85% completed, 15% cancelled
                )[0]
            elif current_date.date() == timezone.now().date():
                # Today's schedules - mix of statuses
                status = random.choices(
                    [
                        ProductionSchedule.ScheduleStatus.IN_PROGRESS,
                        ProductionSchedule.ScheduleStatus.COMPLETED,
                        ProductionSchedule.ScheduleStatus.SCHEDULED,
                    ],
                    weights=[40, 30, 30],
                )[0]
            else:
                # Future schedules - all scheduled
                status = ProductionSchedule.ScheduleStatus.SCHEDULED

            # Set end time for completed schedules
            end_time = None
            if status == ProductionSchedule.ScheduleStatus.COMPLETED:
                duration_hours = random.randint(2, 8)  # 2-8 hours
                end_time = schedule_start + timedelta(hours=duration_hours)

            try:
                # Check if a similar schedule already exists (avoid duplicates)
                existing = ProductionSchedule.objects.filter(
                    production_line=production_line,
                    product=product,
                    start_time__date=schedule_start.date(),
                ).first()

                if existing:
                    continue  # Skip if similar schedule exists

                schedule = ProductionSchedule.objects.create(
                    production_line=production_line,
                    product=product,
                    quantity=quantity,
                    start_time=schedule_start,
                    end_time=end_time,
                    status=status,
                    created_by=created_by,
                )

                created_count += 1
                print(
                    f"✅ Created schedule: {product.name} on {production_line.name} - {quantity} units ({status})"
                )

            except Exception as e:
                print(f"❌ Error creating schedule: {e}")

    print(f"\n🎉 Successfully created {created_count} production schedules!")


def display_schedule_summary():
    "Display summary of created schedules"
    print("\n📊 Production Schedule Summary:")
    print("=" * 60)

    total_schedules = ProductionSchedule.objects.count()

    if total_schedules == 0:
        print("No schedules found.")
        return

    # Status breakdown
    print("\n📈 Schedule Status Breakdown:")
    for status_choice in ProductionSchedule.ScheduleStatus.choices:
        status_code = status_choice[0]
        status_name = status_choice[1]
        count = ProductionSchedule.objects.filter(status=status_code).count()
        percentage = (count / total_schedules) * 100 if total_schedules > 0 else 0
        print(f"  {status_name}: {count} ({percentage:.1f}%)")

    # Production line breakdown
    print("\n🏭 Schedules by Production Line:")
    from django.db.models import Count

    line_stats = (
        ProductionSchedule.objects.values("production_line__name")
        .annotate(count=Count("id"))
        .order_by("-count")[:5]
    )  # Top 5 busiest lines

    for stat in line_stats:
        print(f"  {stat['production_line__name']}: {stat['count']} schedules")

    # Recent schedules
    print("\n📅 Recent Schedules (Last 5):")
    recent_schedules = ProductionSchedule.objects.select_related(
        "production_line", "product", "created_by"
    ).order_by("-start_time")[:5]

    for schedule in recent_schedules:
        print(
            f"  {schedule.start_time.strftime('%Y-%m-%d %H:%M')} - "
            f"{schedule.product.name} on {schedule.production_line.name} "
            f"({schedule.status})"
        )


def create_sample_production_lines():
    "Create sample production lines if none exist"
    from core.models import Workshop

    if ProductionLine.objects.exists():
        print("Production lines already exist.")
        return

    workshops = Workshop.objects.all()
    if not workshops.exists():
        print("❌ No workshops found. Create workshops first.")
        return

    sample_lines = [
        {
            "name": "Assembly Line A",
            "description": "Main assembly line for pumps",
            "capacity": 100,
        },
        {
            "name": "Assembly Line B",
            "description": "Secondary assembly line",
            "capacity": 80,
        },
        {
            "name": "Welding Line 1",
            "description": "Primary welding operations",
            "capacity": 50,
        },
        {
            "name": "Machining Line",
            "description": "CNC machining operations",
            "capacity": 60,
        },
        {
            "name": "Quality Control Line",
            "description": "Final inspection and testing",
            "capacity": 120,
        },
    ]

    created_count = 0
    for line_data in sample_lines:
        workshop = random.choice(workshops)
        try:
            ProductionLine.objects.create(
                name=line_data["name"],
                description=line_data["description"],
                production_capacity=line_data["capacity"],
                workshop=workshop,
            )
            created_count += 1
            print(f"✅ Created production line: {line_data['name']}")
        except Exception as e:
            print(f"❌ Error creating production line {line_data['name']}: {e}")

    print(f"Created {created_count} production lines.")


if __name__ == "__main__":
    print("🏭 Factory Management System - Production Schedule Generator")
    print("=" * 65)

    try:
        # Check and create production lines if needed
        if not ProductionLine.objects.exists():
            print("No production lines found. Creating sample production lines...")
            create_sample_production_lines()
            print()

        # Create production schedules
        create_production_schedules()

        # Display summary
        display_schedule_summary()

        print("\n✅ Script completed successfully!")

    except Exception as e:
        print(f"\n❌ Script failed with error: {e}")
        import traceback

        traceback.print_exc()
