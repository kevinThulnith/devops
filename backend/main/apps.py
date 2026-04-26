from django.apps import AppConfig


class MainConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "main"

    def ready(self):
        # Monkey patch the GoogleProvider to add the missing method
        from allauth.socialaccount.providers.google.provider import GoogleProvider

        def get_scope_from_request(self, request):
            return self.get_default_scope()

        # Add the missing method to the base GoogleProvider class
        if not hasattr(GoogleProvider, "get_scope_from_request"):
            GoogleProvider.get_scope_from_request = get_scope_from_request

        import main.signals
