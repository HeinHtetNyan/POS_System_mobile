from __future__ import annotations

import asyncio
from typing import Any

from app.core.logging import get_logger
from app.tasks.celery_app import celery_app

logger = get_logger(__name__)


@celery_app.task(
    name="app.tasks.notification_tasks.send_notification",
    bind=True,
    max_retries=3,
    default_retry_delay=60,
)
def send_notification(self: Any, user_id: str, notification_type: str, payload: dict) -> dict:
    """Generic notification dispatch task (kept for backward compatibility)."""
    logger.info(
        "notification_task",
        user_id=user_id,
        notification_type=notification_type,
        task_id=self.request.id,
    )
    return {"status": "queued", "user_id": user_id, "type": notification_type}


@celery_app.task(
    name="app.tasks.notification_tasks.send_email_task",
    bind=True,
    max_retries=3,
    default_retry_delay=60,
)
def send_email_task(
    self: Any,
    to: str,
    template_name: str,
    context: dict[str, Any],
    user_id: str | None = None,
) -> dict[str, Any]:
    """Deliver an email notification. Resolves recipient address from user_id if to is empty."""
    from app.notifications.tasks import _send_email_async

    logger.info(
        "send_email_task",
        template=template_name,
        user_id=user_id,
        task_id=self.request.id,
    )
    try:
        loop = asyncio.get_event_loop()
        loop.run_until_complete(_send_email_async(to, template_name, context, user_id))
        return {"status": "sent", "template": template_name}
    except Exception as exc:
        logger.error("send_email_task_failed", error=str(exc), template=template_name)
        raise self.retry(exc=exc)
