from __future__ import annotations

import uuid
from typing import Any

from app.core.logging import get_logger

logger = get_logger(__name__)


TEMPLATES: dict[str, dict[str, str]] = {
    "low_stock": {
        "subject": "Low Stock Alert: {product_name}",
        "body": (
            "Dear {recipient_name},\n\n"
            "This is an automated alert to notify you that the following product "
            "is running low on stock:\n\n"
            "  Product: {product_name}\n"
            "  SKU: {sku}\n"
            "  Current Stock: {current_stock}\n"
            "  Reorder Level: {reorder_level}\n\n"
            "Please arrange for restocking at your earliest convenience.\n\n"
            "Regards,\nPOS System"
        ),
    },
    "subscription_expiring": {
        "subject": "Your Subscription Expires in {days} Day(s)",
        "body": (
            "Dear {recipient_name},\n\n"
            "Your subscription for {tenant_name} will expire in {days} day(s) "
            "on {expires_at}.\n\n"
            "To continue using all features without interruption, please renew "
            "your subscription before the expiration date.\n\n"
            "Regards,\nPOS System"
        ),
    },
    "payment_proof_approved": {
        "subject": "Payment Proof Approved — Subscription Renewed",
        "body": (
            "Dear {recipient_name},\n\n"
            "Your payment proof of {amount} {currency} has been reviewed and approved.\n\n"
            "Your subscription for {tenant_name} is now active until {expires_at}.\n\n"
            "Thank you for your payment.\n\n"
            "Regards,\nPOS System"
        ),
    },
    "purchase_order_approved": {
        "subject": "Purchase Order {po_number} Approved",
        "body": (
            "Dear {recipient_name},\n\n"
            "Purchase Order {po_number} from supplier {supplier_name} has been approved.\n\n"
            "  Total Amount: {total_amount} {currency}\n"
            "  Expected Delivery: {expected_date}\n\n"
            "The supplier has been notified and goods are expected as per the schedule.\n\n"
            "Regards,\nPOS System"
        ),
    },
}




class EmailNotificationService:
    """
    Abstraction layer for email notifications.

    No external provider is integrated. Subclass and override _deliver() to plug
    in SendGrid, SES, SMTP, or any other transport without changing call sites.
    """

    def __init__(self) -> None:
        pass

    def _render(self, template_name: str, context: dict[str, Any]) -> tuple[str, str]:
        """Render a template and return (subject, body)."""
        template = TEMPLATES.get(template_name)
        if template is None:
            logger.warning("email_template_not_found", template_name=template_name)
            return f"Notification: {template_name}", str(context)
        subject = template["subject"].format_map(context)
        body = template["body"].format_map(context)
        return subject, body

    async def _deliver(
        self,
        to: str,
        subject: str,
        body: str,
        context: dict[str, Any],
    ) -> None:
        """Override this method in subclasses to connect to a real email transport."""
        logger.info(
            "email_notification_stub",
            to=to,
            subject=subject,
            body_length=len(body),
        )

    async def send_email_notification(
        self,
        to: str,
        template_name: str,
        context: dict[str, Any],
    ) -> None:
        """Render and send immediately (no queue)."""
        subject, body = self._render(template_name, context)
        await self._deliver(to=to, subject=subject, body=body, context=context)
        logger.info(
            "email_notification_sent",
            to=to,
            template=template_name,
        )

    async def queue_email_notification(
        self,
        to: str,
        template_name: str,
        context: dict[str, Any],
        user_id: uuid.UUID | None = None,
    ) -> None:
        """Queue via Celery for async delivery."""
        from app.tasks.notification_tasks import send_email_task

        send_email_task.delay(
            to=to,
            template_name=template_name,
            context=context,
            user_id=str(user_id) if user_id else None,
        )
        logger.info(
            "email_notification_queued",
            to=to,
            template=template_name,
            user_id=str(user_id) if user_id else None,
        )


# Process-level singleton
email_service = EmailNotificationService()
