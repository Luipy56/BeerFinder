from rest_framework import serializers
from rest_framework_gis.serializers import GeoFeatureModelSerializer
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from .models import POI, Item, ItemRequest
import base64


class ItemSerializer(serializers.ModelSerializer):
    thumbnail = serializers.SerializerMethodField()
    
    class Meta:
        model = Item
        fields = ['id', 'name', 'description', 'typical_price', 'thumbnail', 'created_by', 'updated_by', 'created_at', 'updated_at']
        read_only_fields = ['created_by', 'updated_by', 'created_at', 'updated_at']
    
    def get_thumbnail(self, obj):
        """Convert binary thumbnail to base64 string for JSON serialization"""
        if obj.thumbnail:
            try:
                return base64.b64encode(obj.thumbnail).decode('utf-8')
            except Exception:
                return None
        return None
    
    def to_internal_value(self, data):
        """Convert base64 string back to binary for storage"""
        if 'thumbnail' in data and data['thumbnail']:
            try:
                # If it's a base64 string, decode it
                if isinstance(data['thumbnail'], str):
                    data['thumbnail'] = base64.b64decode(data['thumbnail'])
            except Exception:
                pass
        return super().to_internal_value(data)


class POISerializer(GeoFeatureModelSerializer):
    """Serializer for POI with geographic data"""
    items = ItemSerializer(many=True, read_only=True)
    latitude = serializers.ReadOnlyField()
    longitude = serializers.ReadOnlyField()
    # Allow latitude/longitude to be written (will be converted to location in view)
    latitude_write = serializers.FloatField(write_only=True, required=False)
    longitude_write = serializers.FloatField(write_only=True, required=False)

    class Meta:
        model = POI
        geo_field = 'location'
        fields = [
            'id', 'name', 'description', 'location', 'latitude', 'longitude',
            'latitude_write', 'longitude_write',
            'created_by', 'last_updated_by', 'created_at', 'updated_at', 'items'
        ]
        read_only_fields = ['created_by', 'created_at', 'updated_at']
        extra_kwargs = {
            'location': {'required': False}  # Make location optional
        }
    
    def validate(self, data):
        # If latitude/longitude are provided, location is not required
        has_lat_lng = ('latitude_write' in data and 'longitude_write' in data) or \
                      ('latitude' in self.initial_data and 'longitude' in self.initial_data)
        
        if has_lat_lng:
            # Location will be set in perform_create from latitude/longitude
            return data
        
        # Otherwise, location is required (GeoJSON format)
        if 'location' not in data:
            raise serializers.ValidationError({
                'location': 'Either location (GeoJSON) or latitude/longitude must be provided'
            })
        return data


class POIListSerializer(serializers.ModelSerializer):
    """Simplified serializer for POI list (without geographic details)"""
    items = ItemSerializer(many=True, read_only=True)
    latitude = serializers.ReadOnlyField()
    longitude = serializers.ReadOnlyField()

    class Meta:
        model = POI
        fields = [
            'id', 'name', 'description', 'latitude', 'longitude',
            'created_by', 'last_updated_by', 'created_at', 'updated_at', 'items'
        ]
        read_only_fields = ['created_by', 'created_at', 'updated_at']


class ItemRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = ItemRequest
        fields = [
            'id', 'name', 'description', 'price', 'requested_by',
            'status', 'status_changed_by', 'created_at', 'updated_at'
        ]
        read_only_fields = ['requested_by', 'status', 'status_changed_by', 'created_at', 'updated_at']


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'password_confirm')
        extra_kwargs = {
            'email': {'required': False},
        }

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        user = User.objects.create_user(password=password, **validated_data)
        return user


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email')
        read_only_fields = ('id', 'username')
