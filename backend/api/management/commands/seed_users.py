from django.core.management.base import BaseCommand
from django.contrib.auth.models import User


class Command(BaseCommand):
    help = 'Seed User model with admin user and normal users'

    def handle(self, *args, **options):
        # Create admin user with superuser permissions
        admin_username = 'admin'
        admin_password = 'admin'
        
        if User.objects.filter(username=admin_username).exists():
            admin_user = User.objects.get(username=admin_username)
            admin_user.is_superuser = True
            admin_user.is_staff = True
            admin_user.set_password(admin_password)
            admin_user.save()
            self.stdout.write(self.style.WARNING(f'User "{admin_username}" already exists. Updated to superuser.'))
        else:
            admin_user = User.objects.create_superuser(username=admin_username, password=admin_password)
            self.stdout.write(self.style.SUCCESS(f'Successfully created admin user "{admin_username}"'))
        
        # Create normal users
        normal_users = [
            {'username': 'user1', 'password': 'user1pass'},
            {'username': 'user2', 'password': 'user2pass'},
            {'username': 'user3', 'password': 'user3pass'},
        ]
        
        created_count = 0
        for user_data in normal_users:
            if User.objects.filter(username=user_data['username']).exists():
                self.stdout.write(self.style.WARNING(f'User "{user_data["username"]}" already exists. Skipping.'))
            else:
                User.objects.create_user(username=user_data['username'], password=user_data['password'])
                created_count += 1
                self.stdout.write(self.style.SUCCESS(f'Successfully created user "{user_data["username"]}"'))
        
        self.stdout.write(self.style.SUCCESS(f'Successfully created {created_count} normal users'))
