from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from api.models import Item


class Command(BaseCommand):
    help = 'Seed Item model with sample data'

    def handle(self, *args, **options):
        admin_user = User.objects.filter(username='admin').first()
        user1 = User.objects.filter(username='user1').first()
        user2 = User.objects.filter(username='user2').first()
        user3 = User.objects.filter(username='user3').first()
        
        items_data = [
            {
                'name': 'Craft Beer IPA',
                'description': 'A hoppy India Pale Ale with citrus notes',
                'typical_price': 5.99,
                'created_by': admin_user,
                'updated_by': admin_user,
            },
            {
                'name': 'Lager Beer',
                'description': 'Crisp and refreshing traditional lager',
                'typical_price': 4.99,
                'created_by': user1,
                'updated_by': user1,
            },
            {
                'name': 'Stout Beer',
                'description': 'Dark and rich with coffee and chocolate flavors',
                'typical_price': 6.49,
                'created_by': user2,
                'updated_by': user2,
            },
            {
                'name': 'Wheat Beer',
                'description': 'Light and fruity with hints of banana and clove',
                'typical_price': 5.49,
                'created_by': user1,
                'updated_by': user1,
            },
            {
                'name': 'Pilsner',
                'description': 'Golden and crisp European-style pilsner',
                'typical_price': 4.79,
                'created_by': admin_user,
                'updated_by': admin_user,
            },
            {
                'name': 'Hazy IPA',
                'description': 'Juicy and hazy India Pale Ale with tropical fruit notes',
                'typical_price': 6.99,
                'created_by': user2,
                'updated_by': user2,
            },
            {
                'name': 'Porter',
                'description': 'Rich and smooth dark beer with chocolate and caramel flavors',
                'typical_price': 5.99,
                'created_by': user3,
                'updated_by': user3,
            },
            {
                'name': 'Belgian Wit',
                'description': 'Refreshing wheat beer with coriander and orange peel',
                'typical_price': 5.49,
                'created_by': user1,
                'updated_by': user1,
            },
        ]
        
        created_count = 0
        for item_data in items_data:
            item, created = Item.objects.get_or_create(
                name=item_data['name'],
                defaults=item_data
            )
            if created:
                created_count += 1
                self.stdout.write(self.style.SUCCESS(f'Created item: {item.name}'))
            else:
                self.stdout.write(self.style.WARNING(f'Item "{item.name}" already exists. Skipping.'))
        
        self.stdout.write(self.style.SUCCESS(f'Successfully created {created_count} items'))
