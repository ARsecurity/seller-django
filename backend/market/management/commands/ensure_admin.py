import os
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
class Command(BaseCommand):
    help = "Create/update the admin from ADMIN_USERNAME / ADMIN_PASSWORD / ADMIN_EMAIL env vars."
    def handle(self, *a, **k):
        u, p = os.environ.get("ADMIN_USERNAME"), os.environ.get("ADMIN_PASSWORD")
        if not (u and p): return self.stdout.write("ADMIN_* not set; skipping")
        obj, _ = get_user_model().objects.get_or_create(username=u, defaults={"email": os.environ.get("ADMIN_EMAIL", "")})
        obj.is_staff = obj.is_superuser = True; obj.set_password(p); obj.save()
