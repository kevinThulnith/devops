from info import SAMPLE_SKILLS, SKILL_CATEGORIES
import django
import sys
import os

# 🔧 Add the project root to the path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# 🔧 Set Django settings module
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")

# ✅ Setup Django
django.setup()

# ⬇️ Your production schedule generation logic below this
from labor.models import SkillMatrix
from main.models import User
from random import choice, sample


def create_skill_matrix():
    "Add 3 random skills to each user except admins"

    # Get all users except admins
    non_admin_users = User.objects.exclude(role=User.Role.ADMIN)

    print(f"Found {non_admin_users.count()} non-admin users to assign skills to...")

    skills_created = 0

    for user in non_admin_users:
        # Clear existing skills for this user (optional - remove if you want to keep existing)
        existing_skills = SkillMatrix.objects.filter(employee=user)
        if existing_skills.exists():
            print(
                f"  Clearing {existing_skills.count()} existing skills for {user.username}"
            )
            existing_skills.delete()

        # Select 3 random skills for this user
        selected_skills = sample(SAMPLE_SKILLS, 3)

        for skill_name in selected_skills:
            # Get the category for this skill
            category = SKILL_CATEGORIES.get(skill_name, "OTHER")

            # Randomly assign skill level based on user role
            if user.role == User.Role.MANAGER:
                # Managers tend to have higher skill levels
                level = choice(
                    [
                        SkillMatrix.SkillLevel.INTERMEDIATE,
                        SkillMatrix.SkillLevel.ADVANCED,
                        SkillMatrix.SkillLevel.EXPERT,
                    ]
                )
            elif user.role == User.Role.SUPERVISOR:
                # Supervisors have varied skill levels
                level = choice(
                    [
                        SkillMatrix.SkillLevel.INTERMEDIATE,
                        SkillMatrix.SkillLevel.ADVANCED,
                        SkillMatrix.SkillLevel.ADVANCED,  # More likely to be advanced
                    ]
                )
            else:
                # Operators and others have mixed levels
                level = choice(
                    [
                        SkillMatrix.SkillLevel.BEGINNER,
                        SkillMatrix.SkillLevel.INTERMEDIATE,
                        SkillMatrix.SkillLevel.INTERMEDIATE,  # More likely to be intermediate
                        SkillMatrix.SkillLevel.ADVANCED,
                    ]
                )

            # Create skill description
            description = f"{skill_name} skill for {user.name}. Level: {level}"

            # Create the skill matrix entry
            skill = SkillMatrix.objects.create(
                name=skill_name,
                description=description,
                category=category,
                level=level,
                employee=user,
            )

            skills_created += 1
            print(f"  ✅ Added skill: {skill_name} ({level}) to {user.username}")

    print(f"\n🎉 Successfully created {skills_created} skill entries!")

    # Print summary statistics
    print("\n📊 Summary by Role:")
    for role_value, role_label in User.Role.choices:
        if role_value == User.Role.ADMIN:
            continue
        user_count = non_admin_users.filter(role=role_value).count()
        skill_count = SkillMatrix.objects.filter(employee__role=role_value).count()
        print(f"  {role_label}: {user_count} users, {skill_count} skills")

    # Print summary by skill level
    print("\n📈 Skills by Level:")
    for level_value, level_label in SkillMatrix.SkillLevel.choices:
        count = SkillMatrix.objects.filter(level=level_value).count()
        print(f"  {level_label}: {count}")

    # Print summary by category
    print("\n🏷️ Skills by Category:")
    for category_value, category_label in SkillMatrix.SkillCategory.choices:
        count = SkillMatrix.objects.filter(category=category_value).count()
        if count > 0:
            print(f"  {category_label}: {count}")

    # Show some example users with their skills
    print("\n👥 Example Users and Their Skills:")
    example_users = non_admin_users[:3]
    for user in example_users:
        user_skills = SkillMatrix.objects.filter(employee=user)
        print(f"  {user.username} ({user.role}):")
        for skill in user_skills:
            print(f"    - {skill.name} ({skill.level})")


if __name__ == "__main__":
    create_skill_matrix()
