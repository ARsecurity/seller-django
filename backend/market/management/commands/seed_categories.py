from django.core.management.base import BaseCommand
from django.utils.text import slugify
from market.models import Category, Coupon, PaymentAccount
NAMES = ["Fashion", "Phones & Gadgets", "Electronics", "Home & Kitchen", "Beauty & Care", "Groceries",
         "Baby & Kids", "Sports & Outdoors", "Building & Tools", "Farm & Agro"]
class Command(BaseCommand):
    def handle(self, *a, **k):
        for n in NAMES: Category.objects.get_or_create(slug=slugify(n), defaults={"name": n})
        for b in ("OPay", "Moniepoint", "PalmPay"): PaymentAccount.objects.get_or_create(bank=b)
        Coupon.objects.get_or_create(code="WELCOME10", defaults={"percent": 10})
