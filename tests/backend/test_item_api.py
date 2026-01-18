"""
Backend API tests for Item endpoints
"""
from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from api.models import Item


class ItemAPITestCase(TestCase):
    def setUp(self):
        """Set up test data"""
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
        
    def test_create_item(self):
        """Test creating a new item"""
        self.client.force_authenticate(user=self.user)
        data = {
            'name': 'Test Item',
            'description': 'A test item',
            'price': 5.99
        }
        response = self.client.post('/api/v1/items/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Item.objects.count(), 1)
        self.assertEqual(Item.objects.get().name, 'Test Item')
        
    def test_list_items(self):
        """Test listing all items"""
        Item.objects.create(name='Item 1', price=10.00)
        Item.objects.create(name='Item 2', price=20.00)
        response = self.client.get('/api/v1/items/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)
