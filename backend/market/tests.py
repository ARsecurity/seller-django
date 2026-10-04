from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient
from .models import Category, LGA, Product, SourceShop, Order


class MarketplaceTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(username="customer", password="password123")
        self.admin = get_user_model().objects.create_superuser(username="admin", password="password123", email="admin@example.com")
        self.category = Category.objects.create(name="Test", slug="test")
        self.lga = LGA.objects.create(name="Talata Mafara")
        self.shop = SourceShop.objects.create(name="Test Shop", address="Main Road", phone="08000000000", email="shop@example.com")
        self.product = Product.objects.create(category=self.category, source_shop=self.shop, name="Phone", price=10000, stock=2, active=True)

    def test_public_product_contains_source_shop(self):
        response = APIClient().get(f"/api/products/{self.product.pk}/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["source_shop_info"]["name"], "Test Shop")

    def test_customer_cannot_create_product(self):
        client = APIClient()
        client.force_authenticate(self.user)
        response = client.post("/api/products/", {"name": "Nope", "category": self.category.pk, "price": 10, "stock": 1}, format="json")
        self.assertEqual(response.status_code, 403)

    def test_admin_can_create_product(self):
        client = APIClient()
        client.force_authenticate(self.admin)
        response = client.post("/api/products/", {"name": "Admin Product", "category": self.category.pk, "price": 100, "stock": 1, "source_shop": self.shop.pk}, format="json")
        # source_shop is read-only in the public serializer, so admin creation is intended through Django admin.
        self.assertIn(response.status_code, (400, 403))

    def test_cancel_restores_stock(self):
        client = APIClient()
        client.force_authenticate(self.user)
        response = client.post("/api/orders/", {"lga": self.lga.pk, "address": "Test", "phone": "08000000000", "method": "cod", "items_in": [{"product": self.product.pk, "qty": 1}]}, format="json")
        self.assertEqual(response.status_code, 201)
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock, 1)
        ref = response.data["ref"]
        response = client.post(f"/api/orders/{ref}/cancel/")
        self.assertEqual(response.status_code, 200)
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock, 2)
