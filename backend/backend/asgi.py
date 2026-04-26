import os
from django.core.asgi import get_asgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")
django_asgi_app = get_asgi_application()

from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator
from .middleware import JWTAuthMiddleware

# !Web Socket Routings
import core.routing
import main.routing
import labor.routing
import product.routing
import project.routing
import inventory.routing
import production.routing

application = ProtocolTypeRouter(
    {
        "http": django_asgi_app,
        "websocket": AllowedHostsOriginValidator(
            JWTAuthMiddleware(
                URLRouter(
                    core.routing.websocket_urlpatterns
                    + main.routing.websocket_urlpatterns
                    + labor.routing.websocket_urlpatterns
                    + product.routing.websocket_urlpatterns
                    + project.routing.websocket_urlpatterns
                    + inventory.routing.websocket_urlpatterns
                    + production.routing.websocket_urlpatterns
                )
            )
        ),
    }
)
