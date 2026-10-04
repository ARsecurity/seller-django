import logging
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from .models import Notification

logger = logging.getLogger(__name__)


def notify(user, title, body, **extra):
    notification = Notification.objects.create(user=user, title=title, body=body)
    try:
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f"user_{user.id}",
            {"type": "push", "data": {"id": notification.id, "title": title, "body": body, **extra}},
        )
    except Exception:
        logger.exception("Live notification delivery failed for user %s", user.id)
    return notification
