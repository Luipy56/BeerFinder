from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import POIViewSet, ItemViewSet, ItemRequestViewSet

router = DefaultRouter()
router.register(r'pois', POIViewSet, basename='poi')
router.register(r'items', ItemViewSet, basename='item')
router.register(r'item-requests', ItemRequestViewSet, basename='item-request')

urlpatterns = [
    path('', include(router.urls)),
]
