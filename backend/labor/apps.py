from django.apps import AppConfig


class LaborConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "labor"

    def ready(self):
        import labor.signals
