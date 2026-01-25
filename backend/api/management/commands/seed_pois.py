from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.contrib.gis.geos import Point
from api.models import POI


class Command(BaseCommand):
    help = 'Seed POI model with sample data'

    def handle(self, *args, **options):
        admin_user = User.objects.filter(username='admin').first()
        user1 = User.objects.filter(username='user1').first()
        user2 = User.objects.filter(username='user2').first()
        user3 = User.objects.filter(username='user3').first()
        
        pois_data = [
            {
                'name': 'Downtown Brewery',
                'description': 'Popular craft brewery in the city center',
                'location': Point(-122.4194, 37.7749),  # San Francisco
                'created_by': admin_user,
                'last_updated_by': admin_user,
            },
            {
                'name': 'Riverside Beer Garden',
                'description': 'Outdoor beer garden with river views',
                'location': Point(-74.0060, 40.7128),  # New York
                'created_by': user1,
                'last_updated_by': user1,
            },
            {
                'name': 'Mountain View Taproom',
                'description': 'Cozy taproom with mountain views',
                'location': Point(-122.0574, 37.3861),  # Mountain View
                'created_by': user2,
                'last_updated_by': user2,
            },
            {
                'name': 'Beachside Pub',
                'description': 'Relaxed pub near the beach',
                'location': Point(-118.2437, 34.0522),  # Los Angeles
                'created_by': user3,
                'last_updated_by': user3,
            },
            {
                'name': 'Historic District Brewery',
                'description': 'Brewery located in the historic district',
                'location': Point(-87.6298, 41.8781),  # Chicago
                'created_by': user1,
                'last_updated_by': user1,
            },
            {
                'name': 'Barcelona Craft House',
                'description': 'Modern craft beer house in the heart of Barcelona',
                'location': Point(2.1734, 41.3851),  # Barcelona
                'created_by': user2,
                'last_updated_by': user2,
            },
            {
                'name': 'London Bridge Tavern',
                'description': 'Traditional British pub near London Bridge',
                'location': Point(-0.0876, 51.5074),  # London
                'created_by': user3,
                'last_updated_by': user3,
            },
            {
                'name': 'Barcelona Beach Bar',
                'description': 'Beachfront bar with great beer selection',
                'location': Point(2.1967, 41.3851),  # Barcelona beach area
                'created_by': admin_user,
                'last_updated_by': admin_user,
            },
            {
                'name': 'London Craft Brewery',
                'description': 'Independent craft brewery in East London',
                'location': Point(-0.0759, 51.5074),  # London
                'created_by': user1,
                'last_updated_by': user1,
            },
        ]
        
        created_count = 0
        for poi_data in pois_data:
            poi, created = POI.objects.get_or_create(
                name=poi_data['name'],
                defaults=poi_data
            )
            if created:
                created_count += 1
                self.stdout.write(self.style.SUCCESS(f'Created POI: {poi.name}'))
            else:
                self.stdout.write(self.style.WARNING(f'POI "{poi.name}" already exists. Skipping.'))
        
        self.stdout.write(self.style.SUCCESS(f'Successfully created {created_count} POIs'))
