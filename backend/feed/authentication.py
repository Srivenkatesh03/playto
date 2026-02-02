from rest_framework.authentication import SessionAuthentication


class CsrfExemptSessionAuthentication(SessionAuthentication):
    """
    Session authentication that doesn't enforce CSRF for read-only operations.
    This allows unauthenticated users to view content without issues.
    """
    def enforce_csrf(self, request):
        # Don't enforce CSRF for safe methods
        if request.method in ('GET', 'HEAD', 'OPTIONS'):
            return
        # Enforce CSRF for other methods
        return super().enforce_csrf(request)
