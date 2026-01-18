from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.gis.geos import Point
from .models import POI, Item, ItemRequest
from .serializers import (
    POISerializer, POIListSerializer, ItemSerializer, ItemRequestSerializer
)


class POIViewSet(viewsets.ModelViewSet):
    """
    ViewSet for viewing and editing POI instances.
    """
    queryset = POI.objects.all()
    serializer_class = POISerializer

    def get_serializer_class(self):
        if self.action == 'list':
            return POIListSerializer
        return POISerializer

    def perform_create(self, serializer):
        # Convert latitude/longitude to Point if provided
        data = self.request.data
        location = None
        
        # Check for latitude/longitude (from frontend - direct in request.data)
        if 'latitude' in data and 'longitude' in data:
            try:
                location = Point(float(data['longitude']), float(data['latitude']))
            except (ValueError, TypeError):
                pass
        # Check for latitude_write/longitude_write (from serializer validated_data)
        elif 'latitude_write' in serializer.validated_data and 'longitude_write' in serializer.validated_data:
            try:
                location = Point(
                    float(serializer.validated_data['longitude_write']),
                    float(serializer.validated_data['latitude_write'])
                )
            except (ValueError, TypeError):
                pass
        
        if location:
            serializer.save(location=location, created_by=self.request.user if self.request.user.is_authenticated else None)
        else:
            # If no location provided and serializer has it, use that
            serializer.save(created_by=self.request.user if self.request.user.is_authenticated else None)

    def perform_update(self, serializer):
        # Handle location update
        data = self.request.data
        if 'latitude' in data and 'longitude' in data:
            point = Point(float(data['longitude']), float(data['latitude']))
            serializer.save(location=point)
        else:
            serializer.save()

    @action(detail=True, methods=['post'])
    def add_item(self, request, pk=None):
        """Add an item to a POI"""
        poi = self.get_object()
        item_id = request.data.get('item_id')
        if item_id:
            try:
                item = Item.objects.get(pk=item_id)
                poi.items.add(item)
                return Response({'status': 'item added'})
            except Item.DoesNotExist:
                return Response({'error': 'Item not found'}, status=status.HTTP_404_NOT_FOUND)
        return Response({'error': 'item_id required'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def remove_item(self, request, pk=None):
        """Remove an item from a POI"""
        poi = self.get_object()
        item_id = request.data.get('item_id')
        if item_id:
            try:
                item = Item.objects.get(pk=item_id)
                poi.items.remove(item)
                return Response({'status': 'item removed'})
            except Item.DoesNotExist:
                return Response({'error': 'Item not found'}, status=status.HTTP_404_NOT_FOUND)
        return Response({'error': 'item_id required'}, status=status.HTTP_400_BAD_REQUEST)


class ItemViewSet(viewsets.ModelViewSet):
    """
    ViewSet for viewing and editing Item instances.
    """
    queryset = Item.objects.all()
    serializer_class = ItemSerializer


class ItemRequestViewSet(viewsets.ModelViewSet):
    """
    ViewSet for viewing and creating ItemRequest instances.
    """
    queryset = ItemRequest.objects.all()
    serializer_class = ItemRequestSerializer

    def perform_create(self, serializer):
        serializer.save(requested_by=self.request.user if self.request.user.is_authenticated else None)
