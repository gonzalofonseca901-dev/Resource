// Billing (negocio → plataforma) + panel de agencia. Ver migración 012/013.

export type SubscriptionStatus = "trialing" | "active" | "past_due" | "suspended" | "canceled"

export interface Plan {
  id: string
  key: string
  name: string
  description: string
  price: number
  currency: string
  billingFrequency: "monthly" | "yearly"
  isActive: boolean
  moduleKeys: string[]
}

export interface Subscription {
  id: string
  businessId: string
  planId: string
  planKey: string
  planName: string
  status: SubscriptionStatus
  mpPreapprovalId: string | null
  currentPeriodStart: string | null
  currentPeriodEnd: string | null
  graceUntil: string | null
  canceledAt: string | null
  manualOverride: boolean
  manualOverrideNote: string | null
}

// Fila para el listado del panel de agencia — mezcla businesses + subscriptions.
export interface AdminBusinessListItem {
  id: string
  name: string
  slug: string
  vertical: string
  createdAt: string
  planName: string | null
  subscriptionStatus: SubscriptionStatus | null
  enabledModuleKeys: string[]
}

export interface AdminBusinessDetail {
  id: string
  name: string
  slug: string
  legalName: string
  taxId: string
  email: string
  phone: string
  vertical: string
  createdAt: string
  subscription: Subscription | null
  enabledModuleKeys: string[]
  users: AdminBusinessUser[]
}

export interface AdminBusinessUser {
  id: string
  fullName: string
  email: string
  roleName: string
  isOwner: boolean
}

export interface ImpersonationSession {
  id: string
  adminId: string
  targetUserId: string
  targetBusinessId: string
  targetBusinessName: string
  startedAt: string
  expiresAt: string
  endedAt: string | null
}
