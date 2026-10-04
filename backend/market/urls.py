from django.urls import include, path
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register("products", views.ProductViewSet, basename="product")
router.register("orders", views.OrderViewSet, basename="order")

urlpatterns = [
    path("", include(router.urls)),
    path("lgas/", views.lgas),
    path("categories/", views.categories),
    path("payment-info/", views.payment_info),
    path("auth/register/", views.register),
    path("auth/login/", views.login),
    path("notifications/", views.NotificationList.as_view()),
    path("notifications/read/", views.read_all),
    path("me/", views.me),
    path("auth/password-reset/", views.password_reset),
    path("auth/password-reset/confirm/", views.password_reset_confirm),
    path("home/", views.home),
    path("wishlist/", views.WishlistList.as_view()),
]
