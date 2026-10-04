# Generated for the Seller marketplace project. Do not edit after deployment without a new migration.
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import django.db.models.constraints


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="Category",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=80, unique=True)),
                ("slug", models.SlugField(unique=True)),
            ],
        ),
        migrations.CreateModel(
            name="LGA",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=80, unique=True)),
                ("delivery_fee", models.DecimalField(decimal_places=2, default=500, max_digits=8)),
                ("active", models.BooleanField(default=True)),
            ],
        ),
        migrations.CreateModel(
            name="PaymentAccount",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("bank", models.CharField(max_length=40, unique=True)),
                ("account_number", models.CharField(blank=True, max_length=20)),
                ("account_name", models.CharField(blank=True, max_length=120)),
                ("active", models.BooleanField(default=False)),
            ],
        ),
        migrations.CreateModel(
            name="SourceShop",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=160)),
                ("image_url", models.URLField(blank=True, max_length=500)),
                ("address", models.CharField(blank=True, max_length=300)),
                ("phone", models.CharField(blank=True, max_length=30)),
                ("email", models.EmailField(blank=True, max_length=254)),
                ("description", models.TextField(blank=True)),
                ("active", models.BooleanField(default=True)),
                ("created", models.DateTimeField(auto_now_add=True)),
            ],
            options={"ordering": ["name"]},
        ),
        migrations.CreateModel(
            name="Vendor",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("shop_name", models.CharField(max_length=120)),
                ("phone", models.CharField(max_length=20)),
                ("approved", models.BooleanField(default=False)),
                ("lga", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, to="market.lga")),
                ("owner", models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="vendor", to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name="Coupon",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("code", models.CharField(max_length=30, unique=True)),
                ("percent", models.PositiveSmallIntegerField()),
                ("min_total", models.DecimalField(decimal_places=2, default=0, max_digits=12)),
                ("active", models.BooleanField(default=True)),
            ],
        ),
        migrations.CreateModel(
            name="Product",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(db_index=True, max_length=200)),
                ("description", models.TextField(blank=True)),
                ("price", models.DecimalField(decimal_places=2, max_digits=12)),
                ("stock", models.PositiveIntegerField(default=0)),
                ("image_url", models.URLField(blank=True, max_length=500)),
                ("sale_price", models.DecimalField(blank=True, decimal_places=2, max_digits=12, null=True)),
                ("deal_ends", models.DateTimeField(blank=True, null=True)),
                ("sold", models.PositiveIntegerField(db_index=True, default=0)),
                ("rating_avg", models.FloatField(default=0)),
                ("rating_count", models.PositiveIntegerField(default=0)),
                ("active", models.BooleanField(db_index=True, default=True)),
                ("created", models.DateTimeField(auto_now_add=True)),
                ("category", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="products", to="market.category")),
                ("source_shop", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="products", to="market.sourceshop")),
                ("vendor", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="products", to="market.vendor")),
            ],
            options={"ordering": ["-created"], "indexes": [models.Index(fields=["active", "category"], name="market_prod_active_2c2d6e_idx")]},
        ),
        migrations.CreateModel(
            name="Order",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("ref", models.CharField(editable=False, max_length=12, unique=True)),
                ("address", models.CharField(max_length=300)),
                ("phone", models.CharField(max_length=20)),
                ("method", models.CharField(choices=[("transfer", "Bank transfer"), ("cod", "Pay on delivery")], max_length=10)),
                ("status", models.CharField(choices=[("pending", "Pending"), ("awaiting_payment", "Awaiting payment"), ("paid", "Paid"), ("processing", "Processing"), ("out_for_delivery", "Out for delivery"), ("delivered", "Delivered"), ("cancelled", "Cancelled")], db_index=True, default="pending", max_length=20)),
                ("subtotal", models.DecimalField(decimal_places=2, max_digits=12)),
                ("delivery_fee", models.DecimalField(decimal_places=2, max_digits=8)),
                ("total", models.DecimalField(decimal_places=2, max_digits=12)),
                ("discount", models.DecimalField(decimal_places=2, default=0, max_digits=12)),
                ("coupon", models.CharField(blank=True, max_length=30)),
                ("created", models.DateTimeField(auto_now_add=True)),
                ("buyer", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="orders", to=settings.AUTH_USER_MODEL)),
                ("lga", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, to="market.lga")),
            ],
            options={"ordering": ["-created"]},
        ),
        migrations.CreateModel(
            name="Notification",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("title", models.CharField(max_length=120)),
                ("body", models.CharField(max_length=300)),
                ("read", models.BooleanField(default=False)),
                ("created", models.DateTimeField(auto_now_add=True)),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="notifications", to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ["-created"]},
        ),
        migrations.CreateModel(
            name="OrderItem",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("qty", models.PositiveIntegerField()),
                ("price", models.DecimalField(decimal_places=2, max_digits=12)),
                ("order", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="items", to="market.order")),
                ("product", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, to="market.product")),
            ],
        ),
        migrations.CreateModel(
            name="PaymentProof",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("bank", models.CharField(choices=[("opay", "OPay"), ("moniepoint", "Moniepoint"), ("palmpay", "PalmPay"), ("other", "Other bank")], max_length=20)),
                ("sender_name", models.CharField(max_length=120)),
                ("transaction_ref", models.CharField(max_length=80)),
                ("confirmed", models.BooleanField(default=False)),
                ("created", models.DateTimeField(auto_now_add=True)),
                ("order", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="proofs", to="market.order")),
            ],
            options={"indexes": [models.Index(fields=["transaction_ref"], name="market_paym_transac_3dfc91_idx")]},
        ),
        migrations.CreateModel(
            name="ProductImage",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("url", models.URLField(max_length=500)),
                ("position", models.PositiveSmallIntegerField(default=0)),
                ("product", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="images", to="market.product")),
            ],
            options={"ordering": ["position", "id"]},
        ),
        migrations.CreateModel(
            name="Review",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("rating", models.PositiveSmallIntegerField()),
                ("comment", models.CharField(blank=True, max_length=500)),
                ("created", models.DateTimeField(auto_now_add=True)),
                ("product", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="reviews", to="market.product")),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ["-created"]},
        ),
        migrations.CreateModel(
            name="Wishlist",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("product", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to="market.product")),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="wishlist", to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.AddConstraint(
            model_name="review",
            constraint=models.UniqueConstraint(fields=("product", "user"), name="unique_product_review_user"),
        ),
        migrations.AddConstraint(
            model_name="wishlist",
            constraint=models.UniqueConstraint(fields=("user", "product"), name="unique_wishlist_user_product"),
        ),
    ]
