from django.contrib import admin
from django.db import connection
from django.http import JsonResponse
from django.urls import path, include


def health(request):
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()
        return JsonResponse({"ok": True, "database": "ok"})
    except Exception:
        return JsonResponse({"ok": False, "database": "error"}, status=503)


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/health/", health),
    path("api/", include("market.urls")),
]
