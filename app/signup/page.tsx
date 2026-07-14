"use client"

import { useState } from "react"
import { signupAction } from "@/lib/actions/signup"

// Mismo criterio visual "sin estilizar" que app/login/page.tsx a propósito —
// Sprint 8 rediseña login + signup + landing juntos, no separado (ver context
// pack). No usar componentes de components/ui/* acá todavía por consistencia
// con /login, aunque ya existan en el repo.

const VERTICALS = [
  { value: "padel", label: "Canchas de pádel" },
  { value: "studio", label: "Estudio / salón" },
  { value: "clinic", label: "Clínica / consultorio" },
  { value: "other", label: "Otro" },
]

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // saca acentos
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 63)
}

export default function SignupPage() {
  const [businessName, setBusinessName] = useState("")
  const [slug, setSlug] = useState("")
  const [slugEditedByUser, setSlugEditedByUser] = useState(false)
  const [vertical, setVertical] = useState(VERTICALS[0].value)
  const [fullName, setFullName] = useState("")
  const [legalName, setLegalName] = useState("")
  const [taxId, setTaxId] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  function handleBusinessNameChange(value: string) {
    setBusinessName(value)
    // Autogenerar el slug hasta que el usuario lo toque a mano — mismo
    // patrón que cualquier campo "slug desde nombre" (evita pisarle una
    // edición manual si vuelve a cambiar el nombre después).
    if (!slugEditedByUser) setSlug(slugify(value))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const result = await signupAction({
      email,
      password,
      fullName,
      businessName,
      slug,
      vertical,
      legalName,
      taxId,
      phone,
    })

    setLoading(false)

    if (!result.ok) {
      setError(result.error)
      return
    }

    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-sm space-y-3 rounded-lg border p-6 text-center">
          <h1 className="text-xl font-semibold">Revisá tu mail</h1>
          <p className="text-sm text-muted-foreground">
            Te mandamos un link de confirmación a <strong>{email}</strong>. Una vez que lo
            abras, tu negocio queda creado y entrás directo.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md space-y-4 rounded-lg border p-6"
      >
        <div>
          <h1 className="text-xl font-semibold">Creá tu cuenta</h1>
          <p className="text-sm text-muted-foreground">
            Sin instalación, sin esperar a nadie. Empezás a configurar tu negocio ahora.
          </p>
        </div>

        <div className="space-y-1">
          <label htmlFor="businessName" className="text-sm font-medium">
            Nombre del negocio
          </label>
          <input
            id="businessName"
            required
            value={businessName}
            onChange={(e) => handleBusinessNameChange(e.target.value)}
            className="w-full rounded border px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="slug" className="text-sm font-medium">
            Identificador (subdominio)
          </label>
          <div className="flex items-center gap-1 text-sm">
            <input
              id="slug"
              required
              pattern="[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?"
              title="Minúsculas, números y guiones, sin empezar ni terminar en guión."
              value={slug}
              onChange={(e) => {
                setSlugEditedByUser(true)
                setSlug(slugify(e.target.value))
              }}
              className="w-full rounded border px-3 py-2 text-sm"
            />
            <span className="whitespace-nowrap text-muted-foreground">.turecursos.com</span>
          </div>
        </div>

        <div className="space-y-1">
          <label htmlFor="vertical" className="text-sm font-medium">
            Rubro
          </label>
          <select
            id="vertical"
            value={vertical}
            onChange={(e) => setVertical(e.target.value)}
            className="w-full rounded border px-3 py-2 text-sm"
          >
            {VERTICALS.map((v) => (
              <option key={v.value} value={v.value}>
                {v.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label htmlFor="legalName" className="text-sm font-medium">
              Razón social <span className="text-muted-foreground">(opcional)</span>
            </label>
            <input
              id="legalName"
              value={legalName}
              onChange={(e) => setLegalName(e.target.value)}
              className="w-full rounded border px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="taxId" className="text-sm font-medium">
              CUIT <span className="text-muted-foreground">(opcional)</span>
            </label>
            <input
              id="taxId"
              value={taxId}
              onChange={(e) => setTaxId(e.target.value)}
              className="w-full rounded border px-3 py-2 text-sm"
            />
          </div>
        </div>

        <hr className="border-border" />

        <div className="space-y-1">
          <label htmlFor="fullName" className="text-sm font-medium">
            Tu nombre
          </label>
          <input
            id="fullName"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full rounded border px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="phone" className="text-sm font-medium">
            Teléfono <span className="text-muted-foreground">(opcional)</span>
          </label>
          <input
            id="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded border px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded border px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="password" className="text-sm font-medium">
            Contraseña
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded border px-3 py-2 text-sm"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-black px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {loading ? "Creando..." : "Crear cuenta"}
        </button>
      </form>
    </div>
  )
}
