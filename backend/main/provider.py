from allauth.socialaccount.providers.google.provider import (
    GoogleProvider as BaseGoogleProvider,
)

# TODO: Create custom Google provider to implement the missing get_scope_from_request method required by dj-rest-auth.


class GoogleProvider(BaseGoogleProvider):

    def get_scope_from_request(self, request):
        """
        Return the requested scope from the authorization parameters.
        This method is required by dj-rest-auth but not implemented in the base class.
        """
        # Use the default scope from the provider
        return self.get_default_scope()

    def get_default_scope(self):
        """
        Return the default scope for Google OAuth.
        """
        return ["email", "profile"]

    def get_scope(self, request):
        """
        Return the scope for the given request.
        """
        return self.get_scope_from_request(request)
