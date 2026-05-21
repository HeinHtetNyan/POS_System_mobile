from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Query

from app.api.deps import (
    CurrentUser,
    DbSession,
    EffectiveTenantId,
    RequestId,
    require_manager_or_above,
    require_super_admin,
    require_tenant_admin,
)
from app.models.user import User
from app.subscriptions.schemas import (
    ActivateSubscriptionRequest,
    ChangePlanRequest,
    PaginatedPaymentProofs,
    PaginatedPlans,
    PaginatedSubscriptionHistory,
    PaymentProofCreateRequest,
    PaymentProofResponse,
    PlanCreateRequest,
    PlanResponse,
    PlanUpdateRequest,
    ReviewProofRequest,
    SubscriptionResponse,
    SubscriptionHistoryResponse,
)
from app.subscriptions.services import PaymentProofService, PlanService, SubscriptionService
from app.schemas.common import PaginatedResponse

router = APIRouter()



@router.post("/plans", response_model=PlanResponse, status_code=201)
async def create_plan(
    db: DbSession,
    current_user: Annotated[User, Depends(require_super_admin)],
    request_id: RequestId,
    data: PlanCreateRequest,
) -> PlanResponse:
    svc = PlanService(db)
    plan = await svc.create_plan(data=data, actor_id=current_user.id, request_id=request_id)
    return PlanResponse.model_validate(plan)


@router.get("/plans", response_model=PaginatedPlans)
async def list_plans(
    db: DbSession,
    current_user: CurrentUser,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    include_inactive: bool = Query(default=False),
) -> PaginatedPlans:
    svc = PlanService(db)
    items, total = await svc.list_plans(
        page=page, page_size=page_size, include_inactive=include_inactive
    )
    return PaginatedResponse.create(
        items=[PlanResponse.model_validate(p) for p in items],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/plans/{plan_id}", response_model=PlanResponse)
async def get_plan(
    plan_id: uuid.UUID,
    db: DbSession,
    current_user: CurrentUser,
) -> PlanResponse:
    svc = PlanService(db)
    plan = await svc.get_plan(plan_id)
    return PlanResponse.model_validate(plan)


@router.patch("/plans/{plan_id}", response_model=PlanResponse)
async def update_plan(
    plan_id: uuid.UUID,
    db: DbSession,
    current_user: Annotated[User, Depends(require_super_admin)],
    request_id: RequestId,
    data: PlanUpdateRequest,
) -> PlanResponse:
    svc = PlanService(db)
    plan = await svc.update_plan(
        plan_id=plan_id, data=data, actor_id=current_user.id, request_id=request_id
    )
    return PlanResponse.model_validate(plan)



@router.get("/me", response_model=SubscriptionResponse)
async def get_my_subscription(
    db: DbSession,
    current_user: Annotated[User, Depends(require_manager_or_above)],
    tenant_id: EffectiveTenantId,
) -> SubscriptionResponse:
    svc = SubscriptionService(db)
    sub = await svc.get_subscription(tenant_id)
    return SubscriptionResponse.model_validate(sub)


@router.post("/activate", response_model=SubscriptionResponse)
async def activate_subscription(
    db: DbSession,
    current_user: Annotated[User, Depends(require_super_admin)],
    tenant_id: EffectiveTenantId,
    request_id: RequestId,
    data: ActivateSubscriptionRequest,
) -> SubscriptionResponse:
    svc = SubscriptionService(db)
    sub = await svc.activate_subscription(
        tenant_id=tenant_id, data=data, actor_id=current_user.id, request_id=request_id
    )
    return SubscriptionResponse.model_validate(sub)


@router.post("/renew", response_model=SubscriptionResponse)
async def renew_subscription(
    db: DbSession,
    current_user: Annotated[User, Depends(require_tenant_admin)],
    tenant_id: EffectiveTenantId,
    request_id: RequestId,
) -> SubscriptionResponse:
    svc = SubscriptionService(db)
    sub = await svc.renew_subscription(
        tenant_id=tenant_id, actor_id=current_user.id, request_id=request_id
    )
    return SubscriptionResponse.model_validate(sub)


@router.post("/upgrade", response_model=SubscriptionResponse)
async def upgrade_subscription(
    db: DbSession,
    current_user: Annotated[User, Depends(require_tenant_admin)],
    tenant_id: EffectiveTenantId,
    request_id: RequestId,
    data: ChangePlanRequest,
) -> SubscriptionResponse:
    svc = SubscriptionService(db)
    sub = await svc.upgrade_subscription(
        tenant_id=tenant_id, data=data, actor_id=current_user.id, request_id=request_id
    )
    return SubscriptionResponse.model_validate(sub)


@router.post("/downgrade", response_model=SubscriptionResponse)
async def downgrade_subscription(
    db: DbSession,
    current_user: Annotated[User, Depends(require_tenant_admin)],
    tenant_id: EffectiveTenantId,
    request_id: RequestId,
    data: ChangePlanRequest,
) -> SubscriptionResponse:
    svc = SubscriptionService(db)
    sub = await svc.downgrade_subscription(
        tenant_id=tenant_id, data=data, actor_id=current_user.id, request_id=request_id
    )
    return SubscriptionResponse.model_validate(sub)


@router.post("/cancel", response_model=SubscriptionResponse)
async def cancel_subscription(
    db: DbSession,
    current_user: Annotated[User, Depends(require_tenant_admin)],
    tenant_id: EffectiveTenantId,
    request_id: RequestId,
) -> SubscriptionResponse:
    svc = SubscriptionService(db)
    sub = await svc.cancel_subscription(
        tenant_id=tenant_id, actor_id=current_user.id, request_id=request_id
    )
    return SubscriptionResponse.model_validate(sub)


@router.post("/suspend", response_model=SubscriptionResponse)
async def suspend_subscription(
    db: DbSession,
    current_user: Annotated[User, Depends(require_super_admin)],
    tenant_id: EffectiveTenantId,
    request_id: RequestId,
) -> SubscriptionResponse:
    svc = SubscriptionService(db)
    sub = await svc.suspend_subscription(
        tenant_id=tenant_id, actor_id=current_user.id, request_id=request_id
    )
    return SubscriptionResponse.model_validate(sub)


@router.post("/expire", response_model=SubscriptionResponse)
async def expire_subscription(
    db: DbSession,
    current_user: Annotated[User, Depends(require_super_admin)],
    tenant_id: EffectiveTenantId,
    request_id: RequestId,
) -> SubscriptionResponse:
    svc = SubscriptionService(db)
    sub = await svc.expire_subscription(
        tenant_id=tenant_id, actor_id=current_user.id, request_id=request_id
    )
    return SubscriptionResponse.model_validate(sub)



@router.get("/history", response_model=PaginatedSubscriptionHistory)
async def list_subscription_history(
    db: DbSession,
    current_user: Annotated[User, Depends(require_manager_or_above)],
    tenant_id: EffectiveTenantId,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
) -> PaginatedSubscriptionHistory:
    svc = SubscriptionService(db)
    items, total = await svc.get_history(tenant_id=tenant_id, page=page, page_size=page_size)
    return PaginatedResponse.create(
        items=[SubscriptionHistoryResponse.model_validate(h) for h in items],
        total=total,
        page=page,
        page_size=page_size,
    )



@router.post("/payment-proofs", response_model=PaymentProofResponse, status_code=201)
async def submit_payment_proof(
    db: DbSession,
    current_user: Annotated[User, Depends(require_tenant_admin)],
    tenant_id: EffectiveTenantId,
    request_id: RequestId,
    data: PaymentProofCreateRequest,
) -> PaymentProofResponse:
    svc = PaymentProofService(db)
    proof = await svc.submit_proof(
        tenant_id=tenant_id, data=data, actor_id=current_user.id, request_id=request_id
    )
    return PaymentProofResponse.model_validate(proof)


@router.get("/payment-proofs", response_model=PaginatedPaymentProofs)
async def list_payment_proofs(
    db: DbSession,
    current_user: Annotated[User, Depends(require_manager_or_above)],
    tenant_id: EffectiveTenantId,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
) -> PaginatedPaymentProofs:
    svc = PaymentProofService(db)
    items, total = await svc.list_proofs(tenant_id=tenant_id, page=page, page_size=page_size)
    return PaginatedResponse.create(
        items=[PaymentProofResponse.model_validate(p) for p in items],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.post("/payment-proofs/{proof_id}/approve", response_model=PaymentProofResponse)
async def approve_payment_proof(
    proof_id: uuid.UUID,
    db: DbSession,
    current_user: Annotated[User, Depends(require_super_admin)],
    request_id: RequestId,
    data: ReviewProofRequest,
) -> PaymentProofResponse:
    svc = PaymentProofService(db)
    proof = await svc.approve_proof(
        proof_id=proof_id,
        actor_id=current_user.id,
        review_notes=data.review_notes,
        request_id=request_id,
    )
    return PaymentProofResponse.model_validate(proof)


@router.post("/payment-proofs/{proof_id}/reject", response_model=PaymentProofResponse)
async def reject_payment_proof(
    proof_id: uuid.UUID,
    db: DbSession,
    current_user: Annotated[User, Depends(require_super_admin)],
    request_id: RequestId,
    data: ReviewProofRequest,
) -> PaymentProofResponse:
    svc = PaymentProofService(db)
    proof = await svc.reject_proof(
        proof_id=proof_id,
        actor_id=current_user.id,
        review_notes=data.review_notes,
        request_id=request_id,
    )
    return PaymentProofResponse.model_validate(proof)
