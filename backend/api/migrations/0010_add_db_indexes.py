# Generated for updateC: add indexes for common query patterns

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0009_add_volumen_to_item_request'),
    ]

    operations = [
        migrations.AddIndex(
            model_name='item',
            index=models.Index(fields=['name'], name='beerfinder_i_name_idx'),
        ),
        migrations.AddIndex(
            model_name='item',
            index=models.Index(fields=['created_at'], name='beerfinder_i_created_idx'),
        ),
        migrations.AddIndex(
            model_name='poi',
            index=models.Index(fields=['-created_at'], name='beerfinder_p_created_idx'),
        ),
        migrations.AddIndex(
            model_name='itemrequest',
            index=models.Index(fields=['status'], name='beerfinder_ir_status_idx'),
        ),
        migrations.AddIndex(
            model_name='itemrequest',
            index=models.Index(fields=['-created_at'], name='beerfinder_ir_created_idx'),
        ),
    ]
