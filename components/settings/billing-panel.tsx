"use client"

import { useState, useTransition } from "react"
import type { Plan, Subscription, SubscriptionStatus } from "@/lib/types"
import { startSubscriptionCheckoutAction, cancelSubscriptionAction } from "@/lib/actions/billing"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface BillingPanelProps {
  plans: Plan[]
  subscription: Subscription | null
}

const STATUS_TONE: Record<SubscriptionStatus, "success" | "warning" | "danger" | "muted"> = {
  trialing: "muted",
  active: "success",
  past_due: "warning",
  suspended: "danger",
  canceled: "danger",
}

const STATUS_COPY: Record<SubscriptionStatus, string> = {
  trialing: "Suscripción creada, esperando autorización en Mercado Pago.",
  active: "Al día.",
  past_due: "Pago pendiente — regularizalo antes de que se suspendan los módulos no esenciales.",
  suspended: "Suspendido por falta de pago. Los módulos no esenciales están desactivados.",
  canceled: "Cancelado.",
}

export function BillingPanel({ plans, subscription }: BillingPanelProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)

  function handleSubscribe(planId: string) {
    setError(null)
    setSelectedPlanId(planId)
    startTransition(async () => {
      const result = await startSubscriptionCheckoutAction(planId)
      setSelectedPlanId(null)
      if (!result.ok) {
        setError(result.error)
        return
      }
      window.location.href = result.data.initPoint
    })
  }

  function handleCancel() {
    setError(null)
    startTransition(async () => {
      const result = await cancelSubscriptionAction()
      if (!result.ok) setError(result.error)
    })
  }

  return (
    <div className="flex flex-col gap-4">
      {subscription && (
        <Card>
          <CardHeader>
            <CardTitle>Tu suscripción</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            <div className="flex items-center gap-2">
              <Badge tone={STATUS_TONE[subscription.status]}>{subscription.planName}</Badge>
              <span className="text-muted-foreground">{STATUS_COPY[subscription.status]}</span>
            </div>
            {subscription.currentPeriodEnd && (
              <p className="text-xs text-muted-foreground">
                Próximo vencimiento: {new Date(subscription.currentPeriodEnd).toLocaleDateString("es-AR")}
              </p>
            )}
            {subscription.status !== "canceled" && (
              <Button size="sm" variant="outline" onClick={handleCancel} disabled={isPending}>
                Cancelar suscripción
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {plans.map((plan) => (
          <Card key={plan.id}>
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <p className="text-2xl font-semibold">
                {plan.currency} {plan.price.toLocaleString("es-AR")}
                <span className="text-sm font-normal text-muted-foreground">/mes</span>
              </p>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground">{plan.description}</p>
              <Button
                onClick={() => handleSubscribe(plan.id)}
                disabled={isPending || subscription?.planId === plan.id}
              >
                {isPending && selectedPlanId === plan.id
                  ? "Redirigiendo..."
                  : subscription?.planId === plan.id
                    ? "Plan actual"
                    : "Suscribirme"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
