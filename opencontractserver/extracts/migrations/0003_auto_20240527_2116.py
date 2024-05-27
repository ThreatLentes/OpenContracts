# Generated by Django 3.2.9 on 2024-05-27 21:16

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import opencontractserver.shared.defaults
import opencontractserver.shared.fields


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('auth', '0012_alter_user_first_name_max_length'),
        ('documents', '0005_document_embedding'),
        ('extracts', '0002_auto_20240527_0445'),
    ]

    operations = [
        migrations.CreateModel(
            name='Datacell',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('backend_lock', models.BooleanField(default=False)),
                ('is_public', models.BooleanField(default=False)),
                ('created', models.DateTimeField(auto_now_add=True)),
                ('modified', models.DateTimeField(auto_now=True)),
                ('data', opencontractserver.shared.fields.NullableJSONField(blank=True, default=opencontractserver.shared.defaults.jsonfield_default_value, null=True)),
                ('data_definition', models.TextField()),
                ('started', models.DateTimeField(blank=True, null=True)),
                ('completed', models.DateTimeField(blank=True, null=True)),
                ('failed', models.DateTimeField(blank=True, null=True)),
                ('stacktrace', models.TextField(blank=True, null=True)),
                ('column', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='extracted_datacels', to='extracts.column')),
                ('creator', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
                ('document', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='extracted_datacels', to='documents.document')),
            ],
            options={
                'permissions': (('permission_datacell', 'permission datacell'), ('create_datacell', 'create datacell'), ('read_datacell', 'read datacell'), ('update_datacell', 'update datacell'), ('remove_datacell', 'delete datacell')),
            },
        ),
        migrations.RemoveField(
            model_name='extract',
            name='stacktrace',
        ),
        migrations.RenameModel(
            old_name='RowGroupObjectPermission',
            new_name='DatacellGroupObjectPermission',
        ),
        migrations.RenameModel(
            old_name='RowUserObjectPermission',
            new_name='DatacellUserObjectPermission',
        ),
        migrations.DeleteModel(
            name='Row',
        ),
        migrations.AddField(
            model_name='datacell',
            name='extract',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='extracted_datacels', to='extracts.extract'),
        ),
        migrations.AddField(
            model_name='datacell',
            name='user_lock',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='locked_datacell_objects', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AlterField(
            model_name='datacellgroupobjectpermission',
            name='content_object',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='extracts.datacell'),
        ),
        migrations.AlterField(
            model_name='datacelluserobjectpermission',
            name='content_object',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='extracts.datacell'),
        ),
    ]
