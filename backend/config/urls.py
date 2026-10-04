from django.contrib import admin
from django.http import JsonResponse
from django.urls import path, include
urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/health/", lambda r: JsonResponse({"ok": True})),
    path("api/", include("market.urls")),
]
