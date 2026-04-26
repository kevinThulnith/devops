from info import project_names, task_templates
from datetime import date, timedelta
from random import choice, randint
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
from project.models import Project, Task
from main.models import User


# TODO: Create 10 projects with 5 tasks each
def create_projects_and_tasks():
    managers = User.objects.filter(role=User.Role.MANAGER)
    operators = User.objects.filter(role=User.Role.OPERATOR)

    # !Create projects
    for i, project_name in enumerate(project_names, 1):
        start_date = date.today() + timedelta(days=randint(0, 30))
        end_date = start_date + timedelta(days=randint(30, 90))

        project = Project.objects.create(
            name=project_name,
            description=f"Description for {project_name} - This project aims to improve manufacturing efficiency and quality.",
            start_date=start_date,
            end_date=end_date,
            project_status=choice(
                [
                    Project.ProjectStatus.PLANNING,
                    Project.ProjectStatus.IN_PROGRESS,
                    Project.ProjectStatus.PLANNING,  # More likely to be in planning
                ]
            ),
            project_manager=choice(managers),
        )

        print(f"✅ Created project: {project.name}")

        # !Create 5 tasks for each project
        for j, task_template in enumerate(task_templates, 1):
            task_start = start_date + timedelta(days=j * 7)  # Stagger tasks by week
            task_end = task_start + timedelta(days=randint(5, 14))

            task = Task.objects.create(
                name=f"{project_name} - {task_template}",
                description=f"{task_template} for {project_name}. This task involves detailed work on the {task_template.lower()} phase.",
                project=project,
                assigned_to=choice(operators),
                start_date=task_start,
                end_date=task_end,
                status=choice(
                    [
                        Task.TaskStatus.PENDING,
                        Task.TaskStatus.IN_PROGRESS,
                        Task.TaskStatus.PENDING,  # More likely to be pending
                    ]
                ),
            )

            print(f"  ✅ Created task: {task.name}")

    print(
        f"\n🎉 Successfully created {Project.objects.count()} projects and {Task.objects.count()} tasks!"
    )

    # Print summary
    print("\n📊 Summary:")
    print(f"Total Projects: {Project.objects.count()}")
    print(f"Total Tasks: {Task.objects.count()}")
    print(f"Total Managers: {User.objects.filter(role=User.Role.MANAGER).count()}")
    print(f"Total Operators: {User.objects.filter(role=User.Role.OPERATOR).count()}")

    # Show project status distribution
    print("\n📈 Project Status Distribution:")
    for status, label in Project.ProjectStatus.choices:
        count = Project.objects.filter(project_status=status).count()
        print(f"  {label}: {count}")

    # Show task status distribution
    print("\n📈 Task Status Distribution:")
    for status, label in Task.TaskStatus.choices:
        count = Task.objects.filter(status=status).count()
        print(f"  {label}: {count}")


if __name__ == "__main__":
    create_projects_and_tasks()
