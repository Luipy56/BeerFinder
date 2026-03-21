"""Tests for Nominatim geocode proxy."""
import io
import json
from unittest.mock import MagicMock, patch

from django.test import TestCase
from rest_framework.test import APIClient


class GeocodeAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_short_query_returns_empty(self):
        response = self.client.get('/api/v1/geocode/', {'q': 'ab'})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['results'], [])

    @patch('api.geocode_views.urllib.request.urlopen')
    def test_proxies_nominatim_json(self, mock_urlopen):
        body = json.dumps(
            [{'lat': '40.4168', 'lon': '-3.7038', 'display_name': 'Madrid, Spain'}]
        ).encode('utf-8')
        cm = MagicMock()
        cm.__enter__.return_value = io.BytesIO(body)
        cm.__exit__.return_value = False
        mock_urlopen.return_value = cm

        response = self.client.get('/api/v1/geocode/', {'q': 'Madrid Spain'})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data['results']), 1)
        self.assertAlmostEqual(response.data['results'][0]['lat'], 40.4168, places=4)
        self.assertAlmostEqual(response.data['results'][0]['lon'], -3.7038, places=4)
        self.assertIn('Madrid', response.data['results'][0]['display_name'])
