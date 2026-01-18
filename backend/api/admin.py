from django.contrib import admin
from django.contrib.gis import admin as gis_admin
from .models import POI, Item, ItemRequest


@admin.register(POI)
class POIAdmin(gis_admin.GISModelAdmin):
    list_display = ['name', 'created_by', 'created_at']
    list_filter = ['created_at', 'created_by']
    search_fields = ['name', 'description']
    default_lat = 51.505
    default_lon = -0.09
    default_zoom = 13


@admin.register(Item)
class ItemAdmin(admin.ModelAdmin):
    list_display = ['name', 'price', 'created_at']
    list_filter = ['created_at']
    search_fields = ['name', 'description']


@admin.register(ItemRequest)
class ItemRequestAdmin(admin.ModelAdmin):
    list_display = ['name', 'requested_by', 'status', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['name', 'description']
