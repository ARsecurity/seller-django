from decimal import Decimal
from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.db import transaction
from django.db.models import F
from django.utils import timezone
from rest_framework import serializers
from .models import *
from .notify import notify


class LGASerializer(serializers.ModelSerializer):
    class Meta:
        model = LGA
        fields = ["id", "name", "delivery_fee"]


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name", "slug"]


class SourceShopSerializer(serializers.ModelSerializer):
    class Meta:
        model = SourceShop
        fields = ["id", "name", "image_url", "address", "phone", "email", "description"]


class ProductSerializer(serializers.ModelSerializer):
    shop = serializers.CharField(source="source_shop.name", read_only=True, allow_null=True)
    source_shop_info = SourceShopSerializer(source="source_shop", read_only=True)
    current_price = serializers.SerializerMethodField()
    discount_pct = serializers.SerializerMethodField()
    gallery = serializers.SerializerMethodField()
    gallery_urls = serializers.ListField(child=serializers.URLField(max_length=500), write_only=True, required=False, max_length=8)

    class Meta:
        model = Product
        fields = ["id", "name", "description", "price", "sale_price", "deal_ends", "stock", "image_url", "category", "source_shop",
                  "shop", "source_shop_info", "active", "sold", "rating_avg", "rating_count", "current_price",
                  "discount_pct", "gallery", "gallery_urls"]
        read_only_fields = ["sold", "rating_avg", "rating_count"]

    def get_current_price(self, p):
        return float(p.current_price)

    def get_discount_pct(self, p):
        return round((1 - p.current_price / p.price) * 100) if p.current_price < p.price else 0

    def get_gallery(self, p):
        urls = [i.url for i in p.images.all()]
        return urls or ([p.image_url] if p.image_url else [])

    def validate_image_url(self, value):
        if value and not value.startswith("https://"):
            raise serializers.ValidationError("Image URL must start with https://")
        return value

    def validate(self, data):
        price = data.get("price", getattr(self.instance, "price", None))
        sale = data.get("sale_price", getattr(self.instance, "sale_price", None))
        if price is not None and price <= 0:
            raise serializers.ValidationError("price must be greater than zero")
        if sale is not None and sale >= price:
            raise serializers.ValidationError("sale_price must be lower than price")
        if data.get("deal_ends") and data["deal_ends"] <= timezone.now():
            raise serializers.ValidationError("deal_ends must be in the future")
        return data

    def _sync_gallery(self, product, urls):
        ProductImage.objects.filter(product=product).delete()
        ProductImage.objects.bulk_create([ProductImage(product=product, url=url, position=i) for i, url in enumerate(urls)])

    def create(self, validated_data):
        urls = validated_data.pop("gallery_urls", [])
        product = super().create(validated_data)
        self._sync_gallery(product, urls)
        cache.delete("home")
        return product

    def update(self, instance, validated_data):
        urls = validated_data.pop("gallery_urls", None)
        product = super().update(instance, validated_data)
        if urls is not None:
            self._sync_gallery(product, urls)
        cache.delete("home")
        return product


class ReviewSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = Review
        fields = ["user", "rating", "comment", "created"]

    def validate_rating(self, value):
        if not 1 <= value <= 5:
            raise serializers.ValidationError("Rating must be between 1 and 5")
        return value


class RegisterSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=40)
    password = serializers.CharField(min_length=8, write_only=True)
    email = serializers.EmailField(required=False, allow_blank=True)

    def validate_username(self, value):
        if get_user_model().objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError("Username taken")
        return value

    def create(self, validated_data):
        return get_user_model().objects.create_user(validated_data["username"], email=validated_data.get("email", ""), password=validated_data["password"])


class UserAddressSerializer(serializers.ModelSerializer):
    lga_name = serializers.CharField(source="lga.name", read_only=True)

    class Meta:
        model = UserAddress
        fields = ["id", "first_name", "last_name", "phone", "address", "state", "city", "lga", "lga_name", "is_default", "created"]
        read_only_fields = ["id", "lga_name", "created"]

    def validate_lga(self, value):
        if not value.active:
            raise serializers.ValidationError("We do not deliver to this area yet.")
        return value

    def validate_phone(self, value):
        compact = value.replace(" ", "").replace("-", "")
        if not compact.startswith("+") and not compact.isdigit():
            raise serializers.ValidationError("Enter a valid phone number.")
        if len(compact.replace("+", "")) < 10:
            raise serializers.ValidationError("Enter a valid phone number.")
        return value.strip()

    def create(self, validated_data):
        validated_data["user"] = self.context["request"].user
        return super().create(validated_data)

    def update(self, instance, validated_data):
        validated_data.pop("user", None)
        return super().update(instance, validated_data)


class OrderItemIn(serializers.Serializer):
    product = serializers.PrimaryKeyRelatedField(queryset=Product.objects.filter(active=True))
    qty = serializers.IntegerField(min_value=1, max_value=50)


class OrderItemOut(serializers.ModelSerializer):
    product_id = serializers.IntegerField(source="product.id", read_only=True)
    name = serializers.CharField(source="product.name", read_only=True)
    image_url = serializers.CharField(source="product.image_url", read_only=True)

    class Meta:
        model = OrderItem
        fields = ["product_id", "name", "image_url", "qty", "price"]


class OrderSerializer(serializers.ModelSerializer):
    items_in = OrderItemIn(many=True, write_only=True)
    items = OrderItemOut(many=True, read_only=True)
    lga_name = serializers.CharField(source="lga.name", read_only=True)

    class Meta:
        model = Order
        fields = ["ref", "lga", "lga_name", "address", "phone", "method", "status", "subtotal", "delivery_fee", "discount", "coupon", "total", "items", "items_in", "created"]
        read_only_fields = ["ref", "status", "subtotal", "delivery_fee", "discount", "total", "created"]

    def validate_lga(self, value):
        if not value.active:
            raise serializers.ValidationError("We do not deliver to this area yet.")
        return value

    @transaction.atomic
    def create(self, validated_data):
        items = validated_data.pop("items_in")
        user = self.context["request"].user
        # Merge duplicate cart lines before locking inventory.
        quantities = {}
        for item in items:
            quantities[item["product"].pk] = quantities.get(item["product"].pk, 0) + item["qty"]

        subtotal = Decimal("0")
        rows = []
        for product_id, qty in quantities.items():
            product = Product.objects.select_for_update().get(pk=product_id, active=True)
            if product.stock < qty:
                raise serializers.ValidationError(f"{product.name}: only {product.stock} left")
            price = product.current_price
            product.stock -= qty
            product.sold += qty
            product.save(update_fields=["stock", "sold"])
            subtotal += price * qty
            rows.append((product, qty, price))

        code = (validated_data.pop("coupon", "") or "").strip().upper()
        discount = Decimal("0")
        if code:
            coupon = Coupon.objects.filter(code=code, active=True, min_total__lte=subtotal).first()
            if not coupon or not 0 < coupon.percent <= 100:
                raise serializers.ValidationError("Invalid or inapplicable coupon")
            discount = (subtotal * coupon.percent / 100).quantize(Decimal("0.01"))

        fee = validated_data["lga"].delivery_fee
        total = max(subtotal + fee - discount, Decimal("0"))
        status_value = Order.Status.AWAITING if validated_data["method"] == "transfer" else Order.Status.PENDING
        order = Order.objects.create(buyer=user, subtotal=subtotal, delivery_fee=fee, discount=discount,
                                     coupon=code, total=total, status=status_value, **validated_data)
        OrderItem.objects.bulk_create([OrderItem(order=order, product=product, qty=qty, price=price) for product, qty, price in rows])
        notify(user, "Order placed", f"Order {order.ref} - total ₦{order.total}", order=order.ref, status=order.status)
        return order


class ProofSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentProof
        fields = ["bank", "sender_name", "transaction_ref"]

    def validate_transaction_ref(self, value):
        value = value.strip()
        if len(value) < 4:
            raise serializers.ValidationError("Enter a valid transaction reference")
        if PaymentProof.objects.filter(transaction_ref__iexact=value, confirmed=True).exists():
            raise serializers.ValidationError("This transaction reference has already been confirmed")
        return value


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ["id", "title", "body", "read", "created"]
