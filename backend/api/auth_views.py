from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from .serializers import UserRegistrationSerializer, UserSerializer


class LoginView(APIView):
    """Login returning always 200 so invalid credentials don't show as failed request in browser console."""
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username', '').strip()
        password = request.data.get('password', '')
        if not username or not password:
            return Response({
                'ok': False,
                'detail': 'Usuario o contraseña incorrectos. Comprueba los datos e inténtalo de nuevo.',
            }, status=status.HTTP_200_OK)
        user = authenticate(request, username=username, password=password)
        if user is not None and user.is_active:
            refresh = RefreshToken.for_user(user)
            return Response({
                'ok': True,
                'access': str(refresh.access_token),
                'refresh': str(refresh),
            }, status=status.HTTP_200_OK)
        return Response({
            'ok': False,
            'detail': 'Usuario o contraseña incorrectos. Comprueba los datos e inténtalo de nuevo.',
        }, status=status.HTTP_200_OK)


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            refresh = RefreshToken.for_user(user)
            return Response({
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': UserSerializer(user).data
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    def patch(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ChangePasswordView(APIView):
    """Optional password change for authenticated user. POST with current_password, new_password, new_password_confirm."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        current = (request.data.get('current_password') or '').strip()
        new = (request.data.get('new_password') or '').strip()
        confirm = (request.data.get('new_password_confirm') or '').strip()

        if not current:
            return Response({'current_password': ['This field is required.']}, status=status.HTTP_400_BAD_REQUEST)
        if not new:
            return Response({'new_password': ['This field is required.']}, status=status.HTTP_400_BAD_REQUEST)
        if new != confirm:
            return Response({'new_password_confirm': ["The two password fields didn't match."]}, status=status.HTTP_400_BAD_REQUEST)

        user = authenticate(request, username=request.user.username, password=current)
        if user is None:
            return Response({'current_password': ['Current password is incorrect.']}, status=status.HTTP_400_BAD_REQUEST)

        try:
            validate_password(new, user)
        except DjangoValidationError as e:
            return Response({'new_password': list(e.messages)}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new)
        user.save()
        return Response({'detail': 'Password updated successfully.'}, status=status.HTTP_200_OK)
