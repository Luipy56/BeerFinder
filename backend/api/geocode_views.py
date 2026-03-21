import hashlib
import json
import logging
import urllib.error
import urllib.parse
import urllib.request

from django.conf import settings
from django.core.cache import cache
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

logger = logging.getLogger(__name__)

NOMINATIM_SEARCH = 'https://nominatim.openstreetmap.org/search'


class GeocodeSearchView(APIView):
    """Proxy Nominatim search with caching. Respect https://operations.osmfoundation.org/policies/nominatim/"""

    permission_classes = [AllowAny]

    def get(self, request):
        q = (request.query_params.get('q') or '').strip()
        if len(q) < 3:
            return Response({'results': []})
        if len(q) > 256:
            return Response({'detail': 'Query too long.'}, status=400)

        cache_key = 'geocode:' + hashlib.sha256(q.encode('utf-8')).hexdigest()[:48]
        cached = cache.get(cache_key)
        if cached is not None:
            return Response(cached)

        params = urllib.parse.urlencode(
            {
                'q': q,
                'format': 'json',
                'limit': '5',
                'addressdetails': '0',
            }
        )
        url = f'{NOMINATIM_SEARCH}?{params}'
        req = urllib.request.Request(
            url,
            headers={'User-Agent': settings.NOMINATIM_USER_AGENT},
        )
        try:
            with urllib.request.urlopen(req, timeout=12) as resp:
                raw = json.load(resp)
        except urllib.error.HTTPError as e:
            logger.warning('Nominatim HTTPError: %s', e)
            return Response({'detail': 'Geocoding service error.'}, status=502)
        except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as e:
            logger.warning('Nominatim error: %s', e)
            return Response({'detail': 'Geocoding unavailable.'}, status=502)

        results = []
        for item in raw:
            try:
                lat = float(item['lat'])
                lon = float(item['lon'])
            except (KeyError, TypeError, ValueError):
                continue
            results.append(
                {
                    'lat': lat,
                    'lon': lon,
                    'display_name': item.get('display_name', ''),
                }
            )

        payload = {'results': results}
        cache.set(cache_key, payload, 3600)
        return Response(payload)
