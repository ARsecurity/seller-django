from django.core.management.base import BaseCommand
from market.models import LGA
ZAMFARA = ["Anka","Bakura","Birnin Magaji/Kiyaw","Bukkuyum","Bungudu","Gummi","Gusau",
           "Kaura Namoda","Maradun","Maru","Shinkafi","Talata Mafara","Tsafe","Zurmi"]
class Command(BaseCommand):
    def handle(self, *a, **k):
        for n in ZAMFARA: LGA.objects.get_or_create(name=n)
