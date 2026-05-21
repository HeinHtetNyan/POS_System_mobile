from __future__ import annotations

from fastapi import APIRouter, Depends

from app.api.v1.routes import auth, branches, tenants, users, resellers, audit
from app.api.v1.routes import products, categories, brands, inventory, suppliers
from app.customers.routes import router as customer_router
from app.cashiers.routes import router as cashier_router
from app.sales.routes import router as sales_router
from app.payments.routes import router as payment_router
from app.receipts.routes import router as receipt_router
from app.devices.routes import router as device_router
from app.sync.routes import router as sync_router
from app.analytics.routes import router as analytics_router
from app.procurement.routes import router as procurement_router
from app.subscriptions.routes import router as subscriptions_router
from app.subscriptions.admin_routes import router as subscriptions_admin_router
from app.subscriptions.gates import require_feature
from app.notifications.routes import router as notifications_router

api_router = APIRouter()

# Phase 1
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(tenants.router, prefix="/tenants", tags=["Tenants"])
api_router.include_router(branches.router, prefix="/tenants/{tenant_id}/branches", tags=["Branches"])
api_router.include_router(resellers.router, prefix="/resellers", tags=["Resellers"])
api_router.include_router(audit.router, prefix="/audit", tags=["Audit Logs"])

# Phase 2
api_router.include_router(products.router, prefix="/products", tags=["Products"])
api_router.include_router(categories.router, prefix="/categories", tags=["Categories"])
api_router.include_router(brands.router, prefix="/brands", tags=["Brands"])
api_router.include_router(inventory.router, prefix="/inventory", tags=["Inventory"])
api_router.include_router(suppliers.router, prefix="/suppliers", tags=["Suppliers"])

# Phase 5 — Customers
api_router.include_router(customer_router, prefix="/customers", tags=["Customers"])

# Phase 3 — Sales Engine
api_router.include_router(cashier_router, prefix="/cashier-sessions", tags=["Cashier Sessions"])
api_router.include_router(sales_router, prefix="/sales", tags=["Sales"])
api_router.include_router(payment_router, prefix="/payments", tags=["Payments & Refunds"])
api_router.include_router(receipt_router, prefix="/receipts", tags=["Receipts"])

# Phase 4 — Offline Sync
api_router.include_router(device_router, prefix="/devices", tags=["Devices"])
api_router.include_router(sync_router, prefix="/sync", tags=["Sync"])

# Phase 6 — Analytics & Reports (Phase 9: feature-gated)
api_router.include_router(
    analytics_router,
    prefix="/analytics",
    tags=["Analytics"],
    dependencies=[Depends(require_feature("analytics"))],
)

# Phase 7 — Procurement & Supplier Payables (Phase 9: feature-gated)
api_router.include_router(
    procurement_router,
    prefix="/procurement",
    tags=["Procurement"],
    dependencies=[Depends(require_feature("procurement"))],
)

# Phase 8 — Subscriptions & Billing
api_router.include_router(subscriptions_router, prefix="/subscriptions", tags=["Subscriptions"])

# Phase 9 — Subscription Admin & Enforcement
api_router.include_router(
    subscriptions_admin_router,
    prefix="/subscriptions/admin",
    tags=["Subscription Admin"],
)

# Phase 10 — Notifications
api_router.include_router(notifications_router, prefix="/notifications", tags=["Notifications"])
