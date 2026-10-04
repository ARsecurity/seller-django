from django.core.cache import cache
from django.db import transaction
from django.db.models import Avg, Count, F
from django.conf import settings
from django.contrib.auth import get_user_model, authenticate
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.utils import timezone
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from rest_framework import viewsets, generics, permissions, status
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes, action, throttle_classes
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from .models import *
from .serializers import *
from .notify import notify


class AuthThrottle(AnonRateThrottle):
    scope = "auth"


class IsAdminOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.method in permissions.SAFE_METHODS or bool(request.user and request.user.is_staff)


class AddressViewSet(viewsets.ModelViewSet):
    serializer_class = UserAddressSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]

    def get_queryset(self):
        return UserAddress.objects.filter(user=self.request.user).select_related("lga")

    def perform_create(self, serializer):
        address = serializer.save()
        if not UserAddress.objects.filter(user=self.request.user, is_default=True).exists():
            UserAddress.objects.filter(pk=address.pk).update(is_default=True)

    def perform_update(self, serializer):
        serializer.save()



class ProductViewSet(viewsets.ModelViewSet):
    serializer_class = ProductSerializer
    permission_classes = [IsAdminOrReadOnly]
    filterset_fields = ["category"]
    search_fields = ["name", "description"]
    ordering_fields = ["price", "created", "sold", "rating_avg"]

    def get_queryset(self):
        qs = Product.objects.select_related("category", "source_shop").prefetch_related("images")
        if self.request.user.is_staff:
            return qs
        qs = qs.filter(active=True)
        if self.request.query_params.get("deals"):
            qs = qs.filter(sale_price__isnull=False, deal_ends__gt=timezone.now())
        return qs

    def perform_create(self, serializer):
        serializer.save(vendor=None)

    def perform_destroy(self, instance):
        instance.active = False
        instance.save(update_fields=["active"])
        cache.delete("home")

    @action(detail=True, methods=["get", "post"], permission_classes=[permissions.IsAuthenticatedOrReadOnly])
    def reviews(self, request, pk=None):
        product = self.get_object()
        if request.method == "POST":
            purchased = OrderItem.objects.filter(order__buyer=request.user, product=product, order__status=Order.Status.DELIVERED).exists()
            if not purchased:
                return Response({"detail": "You can review a product after a delivered order."}, status=400)
            serializer = ReviewSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            Review.objects.update_or_create(product=product, user=request.user, defaults=serializer.validated_data)
            stats = product.reviews.aggregate(avg=Avg("rating"), count=Count("id"))
            product.rating_avg = round(stats["avg"] or 0, 1)
            product.rating_count = stats["count"] or 0
            product.save(update_fields=["rating_avg", "rating_count"])
        return Response(ReviewSerializer(product.reviews.select_related("user")[:50], many=True).data)

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated])
    def wishlist(self, request, pk=None):
        product = self.get_object()
        if not product.active:
            return Response({"detail": "Product is unavailable"}, status=400)
        wishlist, created = Wishlist.objects.get_or_create(user=request.user, product=product)
        if not created:
            wishlist.delete()
        return Response({"wishlisted": created})


class OrderViewSet(viewsets.ModelViewSet):
    serializer_class = OrderSerializer
    pagination_class = None
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ["get", "post", "head", "options"]
    lookup_field = "ref"

    def get_queryset(self):
        return Order.objects.filter(buyer=self.request.user).prefetch_related("items__product")

    @action(detail=True, methods=["post"])
    def cancel(self, request, ref=None):
        with transaction.atomic():
            order = Order.objects.select_for_update().filter(ref=ref, buyer=request.user).first()
            if not order:
                return Response({"detail": "Order not found"}, status=404)
            if order.status not in (Order.Status.PENDING, Order.Status.AWAITING):
                return Response({"detail": "Order can no longer be cancelled"}, status=400)
            for item in order.items.select_related("product").all():
                Product.objects.filter(pk=item.product_id).update(stock=F("stock") + item.qty, sold=F("sold") - item.qty)
            order.status = Order.Status.CANCELLED
            order.save(update_fields=["status"])
            return Response({"status": order.status})

    @action(detail=True, methods=["post"])
    def proof(self, request, ref=None):
        with transaction.atomic():
            order = Order.objects.select_for_update().filter(ref=ref, buyer=request.user).first()
            if not order:
                return Response({"detail": "Order not found"}, status=404)
            if order.method != Order.Method.TRANSFER or order.status != Order.Status.AWAITING:
                return Response({"detail": "This order is not awaiting a transfer proof"}, status=400)
            serializer = ProofSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            if PaymentProof.objects.filter(order=order).exists():
                return Response({"detail": "A payment proof has already been submitted for this order"}, status=400)
            serializer.save(order=order)
        return Response({"detail": "Received. We will confirm your payment shortly."}, status=201)


class NotificationList(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)[:50]


def _cached(key, builder, timeout):
    try:
        return cache.get_or_set(key, builder, timeout)
    except Exception:
        return builder()


@api_view(["GET"])
def lgas(request):
    data = _cached("lgas", lambda: LGASerializer(LGA.objects.filter(active=True).order_by("name"), many=True).data, 600)
    return Response(data)


@api_view(["GET"])
def categories(request):
    return Response(CategorySerializer(Category.objects.all(), many=True).data)


@api_view(["GET"])
def payment_info(request):
    accounts = PaymentAccount.objects.filter(active=True).exclude(account_number="")
    return Response({"accounts": [{"bank": a.bank, "number": a.account_number, "name": a.account_name} for a in accounts]})


@api_view(["POST"])
@permission_classes([permissions.AllowAny])
@throttle_classes([AuthThrottle])
def register(request):
    serializer = RegisterSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = serializer.save()
    return Response({"token": Token.objects.create(user=user).key}, status=201)


@api_view(["POST"])
@permission_classes([permissions.AllowAny])
@throttle_classes([AuthThrottle])
def login(request):
    user = authenticate(username=request.data.get("username"), password=request.data.get("password"))
    if not user:
        return Response({"detail": "Invalid credentials"}, status=400)
    return Response({"token": Token.objects.get_or_create(user=user)[0].key})


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def me(request):
    return Response({"username": request.user.username, "admin": bool(request.user.is_staff)})


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def read_all(request):
    Notification.objects.filter(user=request.user, read=False).update(read=True)
    return Response({"ok": True})


class WishlistList(generics.ListAPIView):
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        return Product.objects.filter(wishlist__user=self.request.user, active=True).select_related("category", "source_shop").prefetch_related("images")


@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def home(request):
    def build():
        now = timezone.now()
        qs = Product.objects.filter(active=True, stock__gt=0).select_related("category", "source_shop").prefetch_related("images")
        deals = qs.filter(sale_price__isnull=False, deal_ends__gt=now).order_by("deal_ends")[:12]
        trending = qs.order_by("-sold")[:12]
        return {"deals": ProductSerializer(deals, many=True).data, "trending": ProductSerializer(trending, many=True).data}
    return Response(_cached("home", build, 60))


@api_view(["POST"])
@permission_classes([permissions.AllowAny])
@throttle_classes([AuthThrottle])
def password_reset(request):
    identifier = (request.data.get("identifier") or "").strip()
    user_model = get_user_model()
    user = (user_model.objects.filter(email__iexact=identifier).first() or user_model.objects.filter(username=identifier).first()) if identifier else None
    if user and user.email:
        link = f"{settings.FRONTEND_URL}/reset?uid={urlsafe_base64_encode(force_bytes(user.pk))}&token={default_token_generator.make_token(user)}"
        send_mail("Reset your Seller password", f"Open this link to set a new password:\n{link}", settings.DEFAULT_FROM_EMAIL, [user.email], fail_silently=True)
    return Response({"detail": "If the account has an email, a reset link has been sent."})


@api_view(["POST"])
@permission_classes([permissions.AllowAny])
@throttle_classes([AuthThrottle])
def password_reset_confirm(request):
    try:
        user = get_user_model().objects.get(pk=force_str(urlsafe_base64_decode(request.data.get("uid", ""))))
    except Exception:
        return Response({"detail": "Invalid or expired link"}, status=400)
    password = request.data.get("password", "")
    if len(password) < 8 or not default_token_generator.check_token(user, request.data.get("token", "")):
        return Response({"detail": "Invalid or expired link"}, status=400)
    user.set_password(password)
    user.save()
    Token.objects.filter(user=user).delete()
    return Response({"detail": "Password updated. You can log in now."})
