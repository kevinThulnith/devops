from allauth.socialaccount.adapter import DefaultSocialAccountAdapter
from allauth.core.exceptions import ImmediateHttpResponse
from django.http import HttpResponse
import json

# TODO: Create custom social account adapter to handle social login logic for labor app.

class CustomSocialAccountAdapter(DefaultSocialAccountAdapter):
    def pre_social_login(self, request, sociallogin):
        "Check if user exists and is active before allowing social login."

        # !Check if this social account already exists
        if sociallogin.is_existing:
            return

        # !Check if we have an existing user with the email
        email = sociallogin.account.extra_data.get("email")
        if not email:
            raise ImmediateHttpResponse(
                HttpResponse(
                    content=json.dumps(
                        {"error": "No email was provided by the social account."}
                    ),
                    status=400,
                    content_type="application/json",
                )
            )

        # !Check if a user exists with this email address
        User = sociallogin.user.__class__
        try:
            user = User.objects.get(email=email)
            # Connect this social account to the existing user
            sociallogin.connect(request, user)
        except User.DoesNotExist:
            # User doesn't exist - provide a helpful message about contacting admins
            raise ImmediateHttpResponse(
                HttpResponse(
                    content=json.dumps(
                        {
                            "error": "Your email is not registered in our system. Please contact the system administrator to request access.",
                            "message": "Contact admin at admin@factorymanagementsystem.com to request access using your Gmail account.",
                        }
                    ),
                    status=403,
                    content_type="application/json",
                )
            )
