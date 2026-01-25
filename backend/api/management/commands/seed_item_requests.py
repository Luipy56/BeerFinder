from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from api.models import ItemRequest


class Command(BaseCommand):
    help = 'Seed ItemRequest model with sample data'

    def handle(self, *args, **options):
        admin_user = User.objects.filter(username='admin').first()
        user1 = User.objects.filter(username='user1').first()
        user2 = User.objects.filter(username='user2').first()
        
        requests_data = [
            {
                'name': 'Hazy IPA',
                'description': 'Request for a new hazy IPA variety',
                'price': 6.99,
                'flavor_type': 'hoppy',
                'percentage': 6.8,
                'requested_by': user1,
                'status': 'pending',
                'status_changed_by': None,
            },
            {
                'name': 'Sour Beer',
                'description': 'Request for a tart sour beer option',
                'price': 5.99,
                'flavor_type': 'sour',
                'percentage': 4.5,
                'requested_by': user2,
                'status': 'approved',
                'status_changed_by': admin_user,
            },
            {
                'name': 'Barley Wine',
                'description': 'Request for a strong barley wine',
                'price': 8.99,
                'flavor_type': 'strong',
                'percentage': 10.5,
                'requested_by': user1,
                'status': 'rejected',
                'status_changed_by': admin_user,
            },
        ]
        
        created_count = 0
        for request_data in requests_data:
            item_request, created = ItemRequest.objects.get_or_create(
                name=request_data['name'],
                defaults=request_data
            )
            if created:
                created_count += 1
                self.stdout.write(self.style.SUCCESS(f'Created item request: {item_request.name}'))
            else:
                self.stdout.write(self.style.WARNING(f'ItemRequest "{item_request.name}" already exists. Skipping.'))
        
        self.stdout.write(self.style.SUCCESS(f'Successfully created {created_count} item requests'))
