from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import POIViewSet, ItemViewSet, ItemRequestViewSet
from .auth_views import LoginView, RegisterView, UserProfileView

router = DefaultRouter()
router.register(r'pois', POIViewSet, basename='poi')
router.register(r'items', ItemViewSet, basename='item')
router.register(r'item-requests', ItemRequestViewSet, basename='item-request')

urlpatterns = [
    path('auth/login/', LoginView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/profile/', UserProfileView.as_view(), name='user_profile'),
    path('', include(router.urls)),
]
