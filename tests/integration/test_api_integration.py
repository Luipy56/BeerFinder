"""
Integration tests for API endpoints
"""
from django.test import TestCase
from django.contrib.auth.models import User
from django.contrib.gis.geos import Point
from rest_framework.test import APIClient
from rest_framework import status
from api.models import POI, Item


class APIIntegrationTestCase(TestCase):
    def setUp(self):
        """Set up test data"""
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
        self.client.force_authenticate(user=self.user)
        
    def test_poi_with_items_workflow(self):
        """Test creating a POI and associating items with it"""
        # Create items
        item1 = Item.objects.create(name='Beer', price=5.00)
        item2 = Item.objects.create(name='Food', price=10.00)
        
        # Create POI
        poi_data = {
            'name': 'Test Bar',
            'description': 'A test bar',
            'latitude': 51.505,
            'longitude': -0.09,
            'price': 15.00
        }
        response = self.client.post('/api/v1/pois/', poi_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        poi_id = response.data['id']
        
        # Add items to POI
        response = self.client.post(
            f'/api/v1/pois/{poi_id}/add_item/',
            {'item_id': item1.id},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        response = self.client.post(
            f'/api/v1/pois/{poi_id}/add_item/',
            {'item_id': item2.id},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify items are associated
        response = self.client.get(f'/api/v1/pois/{poi_id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['items']), 2)
