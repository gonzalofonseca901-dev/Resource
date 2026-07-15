import { getActivePlans, getMySubscription } from "@/lib/data"
import { BillingPanel } from "@/components/settings/billing-panel"

export default async function FacturacionPage() {
  const [plans, subscription] = await Promise.all([getActivePlans(), getMySubscription()])

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-semibold">Facturación</h1>
        <p className="text-sm text-muted-foreground">
          Suscripción de la plataforma. El cobro a tus clientes finales (señas de reservas) es
          una integración aparte, todavía no disponible.
        </p>
      </div>
      <BillingPanel plans={plans} subscription={subscription} />
    </div>
  )
}
