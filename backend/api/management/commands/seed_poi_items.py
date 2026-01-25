from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from api.models import POI, Item, POIItem


class Command(BaseCommand):
    help = 'Seed POI-Item many-to-many relationship with sample data'

    def handle(self, *args, **options):
        admin_user = User.objects.filter(username='admin').first()
        
        if not admin_user:
            self.stdout.write(self.style.ERROR('Admin user not found. Please run seed_users first.'))
            return
        
        pois = POI.objects.all()
        items = Item.objects.all()
        
        if not pois.exists():
            self.stdout.write(self.style.ERROR('No POIs found. Please run seed_pois first.'))
            return
        
        if not items.exists():
            self.stdout.write(self.style.ERROR('No items found. Please run seed_items first.'))
            return
        
        created_count = 0
        # Create relationships between POIs and Items
        # Assign 2-3 items to each POI
        for poi in pois:
            # Get a random selection of items for each POI
            items_to_assign = list(items)[:3] if len(items) >= 3 else list(items)
            for item in items_to_assign:
                poi_item, created = POIItem.objects.get_or_create(
                    poi=poi,
                    item=item,
                    defaults={
                        'relationship_created_by': admin_user,
                        'local_price': float(item.typical_price) * 1.1 if item.typical_price else None,  # 10% markup
                    }
                )
                if created:
                    created_count += 1
                    self.stdout.write(self.style.SUCCESS(f'Created POI-Item relationship: {poi.name} - {item.name}'))
                else:
                    self.stdout.write(self.style.WARNING(f'POI-Item relationship "{poi.name} - {item.name}" already exists. Skipping.'))
        
        self.stdout.write(self.style.SUCCESS(f'Successfully created {created_count} POI-Item relationships'))
