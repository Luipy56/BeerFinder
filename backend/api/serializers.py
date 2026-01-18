from rest_framework import serializers
from rest_framework_gis.serializers import GeoFeatureModelSerializer
from .models import POI, Item, ItemRequest


class ItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = Item
        fields = ['id', 'name', 'description', 'price', 'created_at', 'updated_at']


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
            'price', 'created_by', 'created_at', 'updated_at', 'items'
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
            'price', 'created_by', 'created_at', 'updated_at', 'items'
        ]
        read_only_fields = ['created_by', 'created_at', 'updated_at']


class ItemRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = ItemRequest
        fields = [
            'id', 'name', 'description', 'price', 'requested_by',
            'status', 'created_at', 'updated_at'
        ]
        read_only_fields = ['requested_by', 'status', 'created_at', 'updated_at']
