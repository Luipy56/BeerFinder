from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from django.contrib.gis.geos import Point
from .models import POI, Item, ItemRequest, POIItem
from .serializers import (
    POISerializer, POIListSerializer, ItemSerializer, ItemRequestSerializer, POIItemSerializer
)


class POIViewSet(viewsets.ModelViewSet):
    """
    ViewSet for viewing and editing POI instances.
    """
    queryset = POI.objects.all()
    serializer_class = POISerializer

    def get_permissions(self):
        """
        Instantiates and returns the list of permissions that this view requires.
        list, retrieve, poi_items: public (view map and POI details).
        """
        if self.action in ['list', 'retrieve', 'poi_items', 'list_all']:
            if self.action == 'list_all':
                permission_classes = [IsAdminUser]
            else:
                permission_classes = [AllowAny]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]

    def get_serializer_class(self):
        if self.action in ['list', 'list_all']:
            return POIListSerializer
        return POISerializer
    
    @action(detail=False, methods=['get'], permission_classes=[IsAdminUser])
    def list_all(self, request):
        """Admin-only endpoint to list all POIs"""
        pois = self.get_queryset()
        serializer = self.get_serializer(pois, many=True)
        return Response(serializer.data)

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
        
        user = self.request.user if self.request.user.is_authenticated else None
        if location:
            serializer.save(location=location, created_by=user, last_updated_by=user)
        else:
            # If no location provided and serializer has it, use that
            serializer.save(created_by=user, last_updated_by=user)

    def get_object(self):
        """Override to check permissions for update/delete"""
        obj = super().get_object()
        if self.action in ['update', 'partial_update', 'destroy']:
            user = self.request.user
            # Only admins or the POI creator can edit/delete
            if not user.is_staff and obj.created_by != user:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("You do not have permission to edit this POI.")
        return obj
    
    def perform_update(self, serializer):
        # Handle location update
        user = self.request.user if self.request.user.is_authenticated else None
        data = self.request.data
        if 'latitude' in data and 'longitude' in data:
            point = Point(float(data['longitude']), float(data['latitude']))
            serializer.save(location=point, last_updated_by=user)
        else:
            serializer.save(last_updated_by=user)

    @action(detail=True, methods=['get'])
    def available_items(self, request, pk=None):
        """Get items available to assign to this POI (excluding already assigned ones)"""
        poi = self.get_object()
        # Use POIItem directly to get assigned item IDs (more explicit and reliable)
        assigned_item_ids = POIItem.objects.filter(poi=poi).values_list('item_id', flat=True)
        available_items = Item.objects.exclude(id__in=assigned_item_ids)
        serializer = ItemSerializer(available_items, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def poi_items(self, request, pk=None):
        """Get all items assigned to this POI with full relationship details"""
        poi = self.get_object()
        poi_items = POIItem.objects.filter(poi=poi).select_related('item', 'relationship_created_by')
        serializer = POIItemSerializer(poi_items, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def assign_item(self, request, pk=None):
        """Assign an item to a POI with optional local_price"""
        poi = self.get_object()
        item_id = request.data.get('item_id')
        local_price = request.data.get('local_price', None)
        
        if not item_id:
            return Response({'error': 'item_id required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            item = Item.objects.get(pk=item_id)
            # Check if already assigned
            if POIItem.objects.filter(poi=poi, item=item).exists():
                return Response({'error': 'Item already assigned to this POI'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Create POIItem relationship
            poi_item = POIItem.objects.create(
                poi=poi,
                item=item,
                relationship_created_by=request.user if request.user.is_authenticated else None,
                local_price=local_price
            )
            serializer = POIItemSerializer(poi_item)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Item.DoesNotExist:
            return Response({'error': 'Item not found'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['post'])
    def remove_item(self, request, pk=None):
        """Remove an item from a POI"""
        poi = self.get_object()
        item_id = request.data.get('item_id')
        if item_id:
            try:
                item = Item.objects.get(pk=item_id)
                POIItem.objects.filter(poi=poi, item=item).delete()
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

    def get_permissions(self):
        """
        Instantiates and returns the list of permissions that this view requires.
        """
        if self.action in ['list', 'retrieve', 'list_all']:
            if self.action == 'list_all':
                permission_classes = [IsAdminUser]
            else:
                permission_classes = [AllowAny]
        else:
            permission_classes = [IsAdminUser]
        return [permission() for permission in permission_classes]
    
    @action(detail=False, methods=['get'], permission_classes=[IsAdminUser])
    def list_all(self, request):
        """Admin-only endpoint to list all items"""
        items = self.get_queryset()
        serializer = self.get_serializer(items, many=True)
        return Response(serializer.data)
    
    def perform_create(self, serializer):
        user = self.request.user if self.request.user.is_authenticated else None
        serializer.save(created_by=user, updated_by=user)
    
    def perform_update(self, serializer):
        user = self.request.user if self.request.user.is_authenticated else None
        serializer.save(updated_by=user)


class ItemRequestViewSet(viewsets.ModelViewSet):
    """
    ViewSet for viewing and creating ItemRequest instances.
    """
    queryset = ItemRequest.objects.all()
    serializer_class = ItemRequestSerializer

    def get_permissions(self):
        """
        Instantiates and returns the list of permissions that this view requires.
        """
        if self.action == 'update' or self.action == 'partial_update':
            permission_classes = [IsAdminUser]
        elif self.action == 'list_all':
            permission_classes = [IsAdminUser]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]

    def get_queryset(self):
        """
        Filter queryset: users always see their own requests (even if admin).
        Admins can see all requests via the list_all action.
        """
        queryset = super().get_queryset()
        if self.request.user.is_authenticated:
            # For admin actions (approve, reject), don't filter - admins need access to all requests
            if self.action in ['approve', 'reject'] and self.request.user.is_staff:
                return queryset
            # Always filter by user for the list action, even if admin
            # Admins can use list_all to see all requests
            queryset = queryset.filter(requested_by=self.request.user)
        else:
            queryset = queryset.none()
        return queryset
    
    def get_object(self):
        """
        Override to allow admins to access any item request for approve/reject actions.
        """
        # For admin actions, allow admins to access any item request
        if self.action in ['approve', 'reject'] and self.request.user.is_staff:
            # Use the base queryset without filtering by user
            queryset = ItemRequest.objects.all()
            lookup_url_kwarg = self.lookup_url_kwarg or self.lookup_field
            filter_kwargs = {self.lookup_field: self.kwargs[lookup_url_kwarg]}
            obj = queryset.get(**filter_kwargs)
            self.check_object_permissions(self.request, obj)
            return obj
        # For other actions, use the default behavior (filtered by user)
        return super().get_object()
    
    @action(detail=False, methods=['get'], permission_classes=[IsAdminUser])
    def list_all(self, request):
        """Admin-only endpoint to list all item requests"""
        requests = ItemRequest.objects.all()
        serializer = self.get_serializer(requests, many=True)
        return Response(serializer.data)

    def perform_create(self, serializer):
        serializer.save(requested_by=self.request.user, status_changed_by=self.request.user)
    
    def perform_update(self, serializer):
        # Update status_changed_by when status is changed
        if 'status' in serializer.validated_data:
            serializer.save(status_changed_by=self.request.user)
        else:
            serializer.save()
    
    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def approve(self, request, pk=None):
        """Admin-only action to approve an item request and create an Item"""
        item_request = self.get_object()
        
        # Always create a new Item from the approved ItemRequest, even if name is duplicated
        # Multiple items can have the same name (they are different records)
        new_item = Item.objects.create(
            name=item_request.name,
            description=item_request.description,
            brand=item_request.brand,
            typical_price=item_request.price,
            percentage=item_request.percentage,
            thumbnail=item_request.thumbnail,
            flavor_type=item_request.flavor_type,
            volumen=item_request.volumen or '',
            created_by=item_request.requested_by,
            updated_by=request.user
        )
        
        # Update the request status
        item_request.status = 'approved'
        item_request.status_changed_by = request.user
        item_request.save()
        
        serializer = self.get_serializer(item_request)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def reject(self, request, pk=None):
        """Admin-only action to reject an item request"""
        item_request = self.get_object()
        item_request.status = 'rejected'
        item_request.status_changed_by = request.user
        item_request.save()
        serializer = self.get_serializer(item_request)
        return Response(serializer.data)
