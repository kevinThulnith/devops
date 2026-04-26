from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.tokens import AccessToken
from channels.db import database_sync_to_async
from django.http import HttpResponse
from django.conf import settings
import asyncio
import logging
import time

logger = logging.getLogger(__name__)

# Import Rich only if in DEBUG mode
if settings.DEBUG:
    from rich.console import Console
    from rich.text import Text

    console = Console()


# TODO: Show execution for API requests


class CancelledErrorMiddleware:
    """
    Middleware to handle CancelledError exceptions gracefully in ASGI.
    Prevents error logs when client disconnects during request processing.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        try:
            response = self.get_response(request)
            return response
        except asyncio.CancelledError:
            # Client disconnected, return empty response
            logger.debug(f"Request cancelled: {request.method} {request.path}")
            return HttpResponse(status=499)  # 499 Client Closed Request


class RequestTimeLoggingMiddleware:
    "Middleware to log the execution time of each request."

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        start_time = time.time()

        response = self.get_response(request)

        execution_time = time.time() - start_time

        # Format time logic
        if execution_time >= 1:
            time_display = f"{execution_time:.2f}s"
        else:
            time_display = f"{execution_time * 1000:.2f}ms"

        # Skip logging for client cancelled requests (499)
        if response.status_code == 499:
            return response

        # --- LOGGING LOGIC ---
        status_code = response.status_code

        # Build log message
        log_message = (
            f"{request.method} {request.path} - Status: {status_code} - {time_display}"
        )

        # Log at appropriate level
        if 200 <= status_code < 300:
            log_level = logging.INFO
        elif 400 <= status_code < 500:
            log_level = logging.WARNING
        elif status_code >= 500:
            log_level = logging.ERROR
        else:
            log_level = logging.INFO

        logger.log(log_level, log_message)

        # --- DEVELOPMENT STYLING (optional) ---
        if settings.DEBUG:
            # Default settings (Blue INFO)
            badge_text = " INFO "
            badge_style = "bold white on blue"

            # Dynamic styling based on Status Code
            if 200 <= status_code < 300:
                badge_text = " SUCCESS "
                badge_style = "bold black on green"
            elif 400 <= status_code < 500:
                badge_text = " WARNING "
                badge_style = "bold black on yellow"
            elif status_code >= 500:
                badge_text = " ERROR "
                badge_style = "bold white on red"

            # Construct the styled log message for development
            log_text = Text(badge_text, style=badge_style)
            log_text.append(" ")  # Spacer

            # The Request Info
            log_text.append(f"{request.method} ", style="bold cyan")
            log_text.append(f"{request.path} ", style="white")

            # The Status
            status_style = "black" if status_code < 400 else "blue"
            log_text.append(f"- Status: {status_code} ", style=status_style)

            # The Time
            log_text.append(f"- ⌛ {time_display}", style="yellow")

            # Print using Rich Console
            console.print(log_text)

        return response


@database_sync_to_async
def get_user(token_key):
    "Asynchronously get the user from the database given a token."

    from main.models import User
    from django.contrib.auth.models import AnonymousUser

    try:
        # Validate the token
        token = AccessToken(token_key)
        # Get the user ID from the token payload
        user_id = token.get("user_id")
        # Fetch the user from the database
        return User.objects.get(id=user_id)
    except (InvalidToken, TokenError, User.DoesNotExist):
        # If the token is invalid or the user doesn't exist, return an anonymous user
        return AnonymousUser()


class JWTAuthMiddleware:
    "Custom middleware for JWT authentication with WebSockets via first-message handshake."

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "websocket":
            return await self.app(scope, receive, send)

        return await self.app(scope, receive, send)
