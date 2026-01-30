from django.contrib.gis.db import models
from django.contrib.auth.models import User


# Flavor type choices shared by Item and ItemRequest models
FLAVOR_CHOICES = [
    ('bitter', 'Bitter'),
    ('caramel', 'Caramel'),
    ('chocolatey', 'Chocolatey'),
    ('coffee-like', 'Coffee-like'),
    ('creamy', 'Creamy'),
    ('crisp', 'Crisp'),
    ('dry', 'Dry'),
    ('earthy', 'Earthy'),
    ('floral', 'Floral'),
    ('fruity', 'Fruity'),
    ('full-bodied', 'Full-bodied'),
    ('funky', 'Funky'),
    ('herbal', 'Herbal'),
    ('honeyed', 'Honeyed'),
    ('hoppy', 'Hoppy'),
    ('light-bodied', 'Light-bodied'),
    ('malty', 'Malty'),
    ('nutty', 'Nutty'),
    ('refreshing', 'Refreshing'),
    ('roasty', 'Roasty'),
    ('session', 'Session'),
    ('smoky', 'Smoky'),
    ('smooth', 'Smooth'),
    ('sour', 'Sour'),
    ('spicy', 'Spicy'),
    ('strong', 'Strong'),
    ('sweet', 'Sweet'),
    ('tart', 'Tart'),
    ('toasted', 'Toasted'),
    ('woody', 'Woody'),
    ('other', 'Other'),
]


class Item(models.Model):
    """Items that can be associated with POIs"""
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    brand = models.CharField(max_length=100, blank=True)
    typical_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    thumbnail = models.BinaryField(null=True, blank=True)
    flavor_type = models.CharField(max_length=20, choices=FLAVOR_CHOICES, default='other')
    percentage = models.FloatField(null=True, blank=True)
    volumen = models.CharField(max_length=50, blank=True, help_text='Free text e.g. 33cl, 1 L, 500ml')
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='created_items')
    updated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='updated_items')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'beerfinder_item'
        ordering = ['name']

    def __str__(self):
        return self.name


class POI(models.Model):
    """Point of Interest model with geographic location"""
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    location = models.PointField()  # PostGIS Point field
    thumbnail = models.BinaryField(null=True, blank=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='created_pois')
    last_updated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='last_updated_pois')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    items = models.ManyToManyField(Item, blank=True, related_name='pois', through='POIItem')

    class Meta:
        db_table = 'beerfinder_poi'
        ordering = ['-created_at']

    def __str__(self):
        return self.name

    @property
    def latitude(self):
        return self.location.y if self.location else None

    @property
    def longitude(self):
        return self.location.x if self.location else None


class POIItem(models.Model):
    """Intermediate model for POI-Item many-to-many relationship with additional fields"""
    poi = models.ForeignKey(POI, on_delete=models.CASCADE)
    item = models.ForeignKey(Item, on_delete=models.CASCADE)
    relationship_created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='created_poi_items')
    local_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'beerfinder_poi_item'
        unique_together = ('poi', 'item')


class ItemRequest(models.Model):
    """Requests from users without permission to add new items"""
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    brand = models.CharField(max_length=100, blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    percentage = models.FloatField(null=True, blank=True)
    thumbnail = models.BinaryField(null=True, blank=True)
    flavor_type = models.CharField(max_length=20, choices=FLAVOR_CHOICES, default='other')
    volumen = models.CharField(max_length=50, blank=True, help_text='Free text e.g. 33cl, 1 L, 500ml')
    requested_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    status = models.CharField(
        max_length=20,
        choices=[
            ('pending', 'Pending'),
            ('approved', 'Approved'),
            ('rejected', 'Rejected'),
        ],
        default='pending'
    )
    status_changed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='status_changed_item_requests')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'beerfinder_item_request'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} - {self.status}"
