from rest_framework import serializers
from rest_framework_gis.serializers import GeoFeatureModelSerializer
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from .models import POI, Item, ItemRequest, POIItem
import base64


class ItemSerializer(serializers.ModelSerializer):
    thumbnail = serializers.SerializerMethodField()
    thumbnail_write = serializers.CharField(write_only=True, required=False, allow_blank=True, allow_null=True)
    
    class Meta:
        model = Item
        fields = ['id', 'name', 'description', 'typical_price', 'thumbnail', 'thumbnail_write', 'flavor_type', 'percentage', 'created_by', 'updated_by', 'created_at', 'updated_at']
        read_only_fields = ['created_by', 'updated_by', 'created_at', 'updated_at']
    
    def get_thumbnail(self, obj):
        """Convert binary thumbnail to base64 string for JSON serialization"""
        if obj.thumbnail:
            try:
                return base64.b64encode(obj.thumbnail).decode('utf-8')
            except Exception:
                return None
        return None
    
    def create(self, validated_data):
        """Create Item and handle thumbnail conversion"""
        # Extract thumbnail_write from validated_data
        thumbnail_data = validated_data.pop('thumbnail_write', None)
        
        # Convert base64 to binary if provided
        if thumbnail_data:
            try:
                # Decode base64 string to binary
                validated_data['thumbnail'] = base64.b64decode(thumbnail_data)
            except Exception as e:
                # If decoding fails, set to None
                validated_data['thumbnail'] = None
        else:
            # If no thumbnail_write provided, ensure thumbnail is not set
            validated_data.pop('thumbnail', None)
        
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        """Update Item and handle thumbnail conversion"""
        # Extract thumbnail_write from validated_data
        thumbnail_data = validated_data.pop('thumbnail_write', None)
        
        # Convert base64 to binary if provided
        if thumbnail_data:
            try:
                # Decode base64 string to binary
                validated_data['thumbnail'] = base64.b64decode(thumbnail_data)
            except Exception as e:
                # If decoding fails, set to None
                validated_data['thumbnail'] = None
        
        return super().update(instance, validated_data)


class POISerializer(GeoFeatureModelSerializer):
    """Serializer for POI with geographic data"""
    items = ItemSerializer(many=True, read_only=True)
    latitude = serializers.ReadOnlyField()
    longitude = serializers.ReadOnlyField()
    thumbnail = serializers.SerializerMethodField()
    thumbnail_write = serializers.CharField(write_only=True, required=False, allow_blank=True, allow_null=True)
    # Allow latitude/longitude to be written (will be converted to location in view)
    latitude_write = serializers.FloatField(write_only=True, required=False)
    longitude_write = serializers.FloatField(write_only=True, required=False)

    class Meta:
        model = POI
        geo_field = 'location'
        fields = [
            'id', 'name', 'description', 'location', 'latitude', 'longitude',
            'latitude_write', 'longitude_write', 'thumbnail', 'thumbnail_write',
            'created_by', 'last_updated_by', 'created_at', 'updated_at', 'items'
        ]
        read_only_fields = ['created_by', 'created_at', 'updated_at']
        extra_kwargs = {
            'location': {'required': False}  # Make location optional
        }
    
    def get_thumbnail(self, obj):
        """Convert binary thumbnail to base64 string for JSON serialization"""
        if obj.thumbnail:
            try:
                return base64.b64encode(obj.thumbnail).decode('utf-8')
            except Exception:
                return None
        return None
    
    def create(self, validated_data):
        """Create POI and handle thumbnail conversion"""
        # Extract thumbnail_write from validated_data
        thumbnail_data = validated_data.pop('thumbnail_write', None)
        
        # Convert base64 to binary if provided
        if thumbnail_data:
            try:
                # Decode base64 string to binary
                validated_data['thumbnail'] = base64.b64decode(thumbnail_data)
            except Exception as e:
                # If decoding fails, set to None
                validated_data['thumbnail'] = None
        else:
            # If no thumbnail_write provided, ensure thumbnail is not set
            validated_data.pop('thumbnail', None)
        
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        """Update POI and handle thumbnail conversion"""
        # Extract thumbnail_write from validated_data
        thumbnail_data = validated_data.pop('thumbnail_write', None)
        
        # Convert base64 to binary if provided
        if thumbnail_data:
            try:
                # Decode base64 string to binary
                validated_data['thumbnail'] = base64.b64decode(thumbnail_data)
            except Exception as e:
                # If decoding fails, set to None
                validated_data['thumbnail'] = None
        
        return super().update(instance, validated_data)
    
    def validate(self, data):
        # For updates (partial), location is not required if not being changed
        if self.instance is not None:
            # This is an update - location is optional
            return data
        
        # For creates, location or latitude/longitude is required
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
    thumbnail = serializers.SerializerMethodField()

    class Meta:
        model = POI
        fields = [
            'id', 'name', 'description', 'latitude', 'longitude', 'thumbnail',
            'created_by', 'last_updated_by', 'created_at', 'updated_at', 'items'
        ]
        read_only_fields = ['created_by', 'created_at', 'updated_at']
    
    def get_thumbnail(self, obj):
        """Convert binary thumbnail to base64 string for JSON serialization"""
        if obj.thumbnail:
            try:
                return base64.b64encode(obj.thumbnail).decode('utf-8')
            except Exception:
                return None
        return None


class ItemRequestSerializer(serializers.ModelSerializer):
    thumbnail = serializers.SerializerMethodField()
    thumbnail_write = serializers.CharField(write_only=True, required=False, allow_blank=True, allow_null=True)
    requested_by_username = serializers.SerializerMethodField()
    
    class Meta:
        model = ItemRequest
        fields = [
            'id', 'name', 'description', 'price', 'percentage', 'thumbnail', 'thumbnail_write', 'flavor_type', 'requested_by',
            'requested_by_username', 'status', 'status_changed_by', 'created_at', 'updated_at'
        ]
        read_only_fields = ['requested_by', 'requested_by_username', 'status', 'status_changed_by', 'created_at', 'updated_at']
        extra_kwargs = {
            'thumbnail': {'write_only': False}  # Allow thumbnail to be written via create/update methods
        }
    
    def get_requested_by_username(self, obj):
        """Return the username of the user who requested the item"""
        if obj.requested_by:
            return obj.requested_by.username
        return None
    
    def get_thumbnail(self, obj):
        """Convert binary thumbnail to base64 string for JSON serialization"""
        if obj.thumbnail:
            try:
                return base64.b64encode(obj.thumbnail).decode('utf-8')
            except Exception:
                return None
        return None
    
    def create(self, validated_data):
        """Create ItemRequest and handle thumbnail conversion"""
        # Extract thumbnail_write from validated_data
        thumbnail_data = validated_data.pop('thumbnail_write', None)
        
        # Convert base64 to binary if provided
        if thumbnail_data:
            try:
                # Decode base64 string to binary
                validated_data['thumbnail'] = base64.b64decode(thumbnail_data)
            except Exception as e:
                # If decoding fails, set to None
                validated_data['thumbnail'] = None
        else:
            # If no thumbnail_write provided, ensure thumbnail is not set
            validated_data.pop('thumbnail', None)
        
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        """Update ItemRequest and handle thumbnail conversion"""
        # Extract thumbnail_write from validated_data
        thumbnail_data = validated_data.pop('thumbnail_write', None)
        
        # Convert base64 to binary if provided
        if thumbnail_data:
            try:
                validated_data['thumbnail'] = base64.b64decode(thumbnail_data)
            except Exception as e:
                validated_data['thumbnail'] = None
        
        return super().update(instance, validated_data)


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
        if value and value.strip():  # Only validate if email is provided and not empty
            if User.objects.filter(email=value).exists():
                raise serializers.ValidationError("A user with this email already exists.")
        return value

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        user = User.objects.create_user(password=password, **validated_data)
        return user


class UserSerializer(serializers.ModelSerializer):
    is_admin = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'is_admin')
        read_only_fields = ('id', 'username', 'is_admin')
    
    def get_is_admin(self, obj):
        return obj.is_staff or obj.is_superuser


class POIItemSerializer(serializers.ModelSerializer):
    """Serializer for POI-Item relationship with full details"""
    item = ItemSerializer(read_only=True)
    relationship_created_by_username = serializers.CharField(source='relationship_created_by.username', read_only=True)
    local_price = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, allow_null=True)
    
    class Meta:
        model = POIItem
        fields = ['id', 'item', 'local_price', 'relationship_created_by_username', 'created_at']
        read_only_fields = ['id', 'created_at']
