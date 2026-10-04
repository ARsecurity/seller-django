from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("market", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="UserAddress",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("first_name", models.CharField(max_length=60)),
                ("last_name", models.CharField(max_length=60)),
                ("phone", models.CharField(max_length=20)),
                ("address", models.CharField(max_length=300)),
                ("state", models.CharField(default="Zamfara", max_length=80)),
                ("city", models.CharField(max_length=80)),
                ("is_default", models.BooleanField(default=False)),
                ("created", models.DateTimeField(auto_now_add=True)),
                ("lga", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, to="market.lga")),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="addresses", to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ["-is_default", "-created"]},
        ),
        migrations.AddIndex(
            model_name="useraddress",
            index=models.Index(fields=["user", "is_default"], name="market_usera_user_id_9a5c8e_idx"),
        ),
    ]
