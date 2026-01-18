"""
Backend API tests for POI endpoints
"""
from django.test import TestCase
from django.contrib.auth.models import User
from django.contrib.gis.geos import Point
from rest_framework.test import APIClient
from rest_framework import status
from api.models import POI, Item


class POIAPITestCase(TestCase):
    def setUp(self):
        """Set up test data"""
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
        
    def test_create_poi(self):
        """Test creating a new POI"""
        self.client.force_authenticate(user=self.user)
        data = {
            'name': 'Test POI',
            'description': 'A test point of interest',
            'latitude': 51.505,
            'longitude': -0.09,
            'price': 10.50
        }
        response = self.client.post('/api/v1/pois/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(POI.objects.count(), 1)
        self.assertEqual(POI.objects.get().name, 'Test POI')
        
    def test_list_pois(self):
        """Test listing all POIs"""
        POI.objects.create(
            name='POI 1',
            location=Point(-0.09, 51.505),
            created_by=self.user
        )
        POI.objects.create(
            name='POI 2',
            location=Point(-0.10, 51.506),
            created_by=self.user
        )
        response = self.client.get('/api/v1/pois/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)
        
    def test_get_poi_detail(self):
        """Test retrieving a specific POI"""
        poi = POI.objects.create(
            name='Test POI',
            location=Point(-0.09, 51.505),
            created_by=self.user
        )
        response = self.client.get(f'/api/v1/pois/{poi.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Test POI')
        
    def test_update_poi(self):
        """Test updating a POI"""
        poi = POI.objects.create(
            name='Original Name',
            location=Point(-0.09, 51.505),
            created_by=self.user
        )
        self.client.force_authenticate(user=self.user)
        data = {'name': 'Updated Name'}
        response = self.client.patch(f'/api/v1/pois/{poi.id}/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        poi.refresh_from_db()
        self.assertEqual(poi.name, 'Updated Name')
        
    def test_delete_poi(self):
        """Test deleting a POI"""
        poi = POI.objects.create(
            name='Test POI',
            location=Point(-0.09, 51.505),
            created_by=self.user
        )
        self.client.force_authenticate(user=self.user)
        response = self.client.delete(f'/api/v1/pois/{poi.id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(POI.objects.count(), 0)
