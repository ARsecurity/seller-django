from django.contrib import admin
from django.db import transaction
from django.db.models import F
from django.core.cache import cache
from .models import *
from .notify import notify


@admin.register(SourceShop)
class SourceShopAdmin(admin.ModelAdmin):
    list_display = ["name", "phone", "email", "active"]
    search_fields = ["name", "address", "phone", "email"]
    list_filter = ["active"]


class ImgInline(admin.TabularInline):
    model = ProductImage
    extra = 2


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ["name", "source_shop", "price", "sale_price", "stock", "sold", "active"]
    list_filter = ["active", "category", "source_shop"]
    search_fields = ["name", "description", "source_shop__name"]
    list_editable = ["price", "sale_price", "stock", "active"]
    inlines = [ImgInline]
    autocomplete_fields = ["category", "source_shop"]

    def save_model(self, request, obj, form, change):
        obj.vendor = None
        super().save_model(request, obj, form, change)
        cache.delete("home")

    def delete_model(self, request, obj):
        obj.active = False
        obj.save(update_fields=["active"])
        cache.delete("home")


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ["ref", "buyer", "lga", "method", "status", "total", "created"]
    list_filter = ["status", "method", "lga"]
    search_fields = ["ref", "phone", "buyer__username", "buyer__email"]
    readonly_fields = ["ref", "buyer", "status", "subtotal", "delivery_fee", "discount", "total", "created"]
    actions = ["processing", "out_for_delivery", "delivered", "cancelled"]

    def _set(self, request, queryset, status_value, message):
        for order in queryset.select_related("buyer"):
            if order.status == Order.Status.CANCELLED:
                continue
            if status_value == Order.Status.PAID and order.status != Order.Status.AWAITING:
                continue
            if status_value == Order.Status.CANCELLED:
                self._cancel_one(order)
                continue
            order.status = status_value
            order.save(update_fields=["status"])
            notify(order.buyer, "Order update", f"Order {order.ref}: {message}", order=order.ref, status=status_value)

    def _cancel_one(self, order):
        with transaction.atomic():
            locked = Order.objects.select_for_update().get(pk=order.pk)
            if locked.status not in (Order.Status.PENDING, Order.Status.AWAITING):
                return
            for item in locked.items.all():
                Product.objects.filter(pk=item.product_id).update(stock=F("stock") + item.qty, sold=F("sold") - item.qty)
            locked.status = Order.Status.CANCELLED
            locked.save(update_fields=["status"])
            notify(locked.buyer, "Order update", f"Order {locked.ref}: was cancelled", order=locked.ref, status=locked.status)

    @admin.action(description="Mark processing")
    def processing(self, request, queryset):
        self._set(request, queryset, Order.Status.PROCESSING, "being prepared")

    @admin.action(description="Mark out for delivery")
    def out_for_delivery(self, request, queryset):
        self._set(request, queryset, Order.Status.OUT, "is out for delivery")

    @admin.action(description="Mark delivered")
    def delivered(self, request, queryset):
        self._set(request, queryset, Order.Status.DELIVERED, "delivered. Thank you!")

    @admin.action(description="Cancel and restore stock")
    def cancelled(self, request, queryset):
        self._set(request, queryset, Order.Status.CANCELLED, "was cancelled")


@admin.register(PaymentProof)
class ProofAdmin(admin.ModelAdmin):
    list_display = ["order", "bank", "sender_name", "transaction_ref", "confirmed", "created"]
    list_filter = ["bank", "confirmed"]
    search_fields = ["order__ref", "sender_name", "transaction_ref"]
    readonly_fields = ["order", "bank", "sender_name", "transaction_ref", "created"]
    actions = ["confirm"]

    @admin.action(description="Confirm valid payment")
    def confirm(self, request, queryset):
        for proof in queryset.select_related("order__buyer"):
            with transaction.atomic():
                locked = PaymentProof.objects.select_for_update().select_related("order__buyer").get(pk=proof.pk)
                order = Order.objects.select_for_update().get(pk=locked.order_id)
                if locked.confirmed or order.status != Order.Status.AWAITING:
                    continue
                locked.confirmed = True
                locked.save(update_fields=["confirmed"])
                order.status = Order.Status.PAID
                order.save(update_fields=["status"])
                notify(order.buyer, "Payment confirmed", f"Order {order.ref} payment received", order=order.ref, status=order.status)


@admin.register(LGA)
class LGAAdmin(admin.ModelAdmin):
    list_display = ["name", "delivery_fee", "active"]
    list_editable = ["delivery_fee", "active"]
    search_fields = ["name"]


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ["name", "slug"]
    search_fields = ["name", "slug"]



@admin.register(UserAddress)
class UserAddressAdmin(admin.ModelAdmin):
    list_display = ["user", "first_name", "last_name", "phone", "city", "lga", "is_default"]
    list_filter = ["state", "city", "lga", "is_default"]
    search_fields = ["user__username", "first_name", "last_name", "phone", "address"]

admin.site.register(Coupon)
admin.site.register(Review)
admin.site.register(PaymentAccount)
