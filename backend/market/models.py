import uuid
from django.conf import settings
from django.db import models
from django.utils import timezone

U = settings.AUTH_USER_MODEL


class LGA(models.Model):
    name = models.CharField(max_length=80, unique=True)
    delivery_fee = models.DecimalField(max_digits=8, decimal_places=2, default=500)
    active = models.BooleanField(default=True)

    def __str__(self):
        return self.name


class Category(models.Model):
    name = models.CharField(max_length=80, unique=True)
    slug = models.SlugField(unique=True)

    def __str__(self):
        return self.name


class Vendor(models.Model):
    """Legacy model kept for database compatibility. The public app has no vendor marketplace."""
    owner = models.OneToOneField(U, on_delete=models.CASCADE, related_name="vendor")
    shop_name = models.CharField(max_length=120)
    lga = models.ForeignKey(LGA, on_delete=models.PROTECT)
    phone = models.CharField(max_length=20)
    approved = models.BooleanField(default=False)

    def __str__(self):
        return self.shop_name


class SourceShop(models.Model):
    """The physical shop from which the admin sources a product."""
    name = models.CharField(max_length=160)
    image_url = models.URLField(max_length=500, blank=True)
    address = models.CharField(max_length=300, blank=True)
    phone = models.CharField(max_length=30, blank=True)
    email = models.EmailField(blank=True)
    description = models.TextField(blank=True)
    active = models.BooleanField(default=True)
    created = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class Product(models.Model):
    # Legacy vendor relation remains nullable so old databases can be upgraded safely.
    vendor = models.ForeignKey(Vendor, null=True, blank=True, on_delete=models.SET_NULL, related_name="products")
    source_shop = models.ForeignKey(SourceShop, null=True, blank=True, on_delete=models.SET_NULL, related_name="products")
    category = models.ForeignKey(Category, on_delete=models.PROTECT, related_name="products")
    name = models.CharField(max_length=200, db_index=True)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=12, decimal_places=2)
    stock = models.PositiveIntegerField(default=0)
    image_url = models.URLField(max_length=500, blank=True)
    sale_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    deal_ends = models.DateTimeField(null=True, blank=True)
    sold = models.PositiveIntegerField(default=0, db_index=True)
    rating_avg = models.FloatField(default=0)
    rating_count = models.PositiveIntegerField(default=0)
    active = models.BooleanField(default=True, db_index=True)
    created = models.DateTimeField(auto_now_add=True)

    @property
    def current_price(self):
        if self.sale_price and (not self.deal_ends or self.deal_ends > timezone.now()):
            return self.sale_price
        return self.price

    class Meta:
        ordering = ["-created"]
        indexes = [models.Index(fields=["active", "category"])]

    def __str__(self):
        return self.name


class Order(models.Model):
    class Method(models.TextChoices):
        TRANSFER = "transfer", "Bank transfer"
        COD = "cod", "Pay on delivery"

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        AWAITING = "awaiting_payment", "Awaiting payment"
        PAID = "paid", "Paid"
        PROCESSING = "processing", "Processing"
        OUT = "out_for_delivery", "Out for delivery"
        DELIVERED = "delivered", "Delivered"
        CANCELLED = "cancelled", "Cancelled"

    ref = models.CharField(max_length=12, unique=True, editable=False)
    buyer = models.ForeignKey(U, on_delete=models.PROTECT, related_name="orders")
    lga = models.ForeignKey(LGA, on_delete=models.PROTECT)
    address = models.CharField(max_length=300)
    phone = models.CharField(max_length=20)
    method = models.CharField(max_length=10, choices=Method.choices)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING, db_index=True)
    subtotal = models.DecimalField(max_digits=12, decimal_places=2)
    delivery_fee = models.DecimalField(max_digits=8, decimal_places=2)
    total = models.DecimalField(max_digits=12, decimal_places=2)
    discount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    coupon = models.CharField(max_length=30, blank=True)
    created = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created"]

    def save(self, *args, **kwargs):
        if not self.ref:
            self.ref = uuid.uuid4().hex[:10].upper()
        super().save(*args, **kwargs)


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    qty = models.PositiveIntegerField()
    price = models.DecimalField(max_digits=12, decimal_places=2)


class PaymentProof(models.Model):
    BANKS = [("opay", "OPay"), ("moniepoint", "Moniepoint"), ("palmpay", "PalmPay"), ("other", "Other bank")]
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="proofs")
    bank = models.CharField(max_length=20, choices=BANKS)
    sender_name = models.CharField(max_length=120)
    transaction_ref = models.CharField(max_length=80)
    confirmed = models.BooleanField(default=False)
    created = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [models.Index(fields=["transaction_ref"])]


class Notification(models.Model):
    user = models.ForeignKey(U, on_delete=models.CASCADE, related_name="notifications")
    title = models.CharField(max_length=120)
    body = models.CharField(max_length=300)
    read = models.BooleanField(default=False)
    created = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created"]


class ProductImage(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="images")
    url = models.URLField(max_length=500)
    position = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ["position", "id"]


class Review(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="reviews")
    user = models.ForeignKey(U, on_delete=models.CASCADE)
    rating = models.PositiveSmallIntegerField()
    comment = models.CharField(max_length=500, blank=True)
    created = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=["product", "user"], name="unique_product_review_user")]
        ordering = ["-created"]


class Wishlist(models.Model):
    user = models.ForeignKey(U, on_delete=models.CASCADE, related_name="wishlist")
    product = models.ForeignKey(Product, on_delete=models.CASCADE)

    class Meta:
        constraints = [models.UniqueConstraint(fields=["user", "product"], name="unique_wishlist_user_product")]


class Coupon(models.Model):
    code = models.CharField(max_length=30, unique=True)
    percent = models.PositiveSmallIntegerField()
    min_total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    active = models.BooleanField(default=True)

    def __str__(self):
        return self.code


class PaymentAccount(models.Model):
    bank = models.CharField(max_length=40, unique=True)
    account_number = models.CharField(max_length=20, blank=True)
    account_name = models.CharField(max_length=120, blank=True)
    active = models.BooleanField(default=False)

    def __str__(self):
        return self.bank
