"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import type { Role, User } from "@/lib/types"
import { assignRoleAction, inviteUserAction } from "@/lib/actions/users"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Button } from "@/components/ui/button"

interface UsersRolesManagerProps {
  users: User[]
  roles: Role[]
  canManage: boolean
}

export function UsersRolesManager({ users, roles, canManage }: UsersRolesManagerProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [assignments, setAssignments] = useState<Record<string, string>>(() =>
    Object.fromEntries(users.map((u) => [u.id, u.role.id])),
  )
  const [error, setError] = useState<string | null>(null)
  const [pendingUserId, setPendingUserId] = useState<string | null>(null)

  // Estado del form de invitación — separado del de asignación de arriba
  // para no pisar el optimistic update de assignRole con el isPending de invitar.
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteFullName, setInviteFullName] = useState("")
  const [inviteRoleId, setInviteRoleId] = useState(roles[0]?.id ?? "")
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [inviteSuccess, setInviteSuccess] = useState(false)
  const [isInviting, startInviteTransition] = useTransition()

  function assignRole(userId: string, roleId: string) {
    const previous = assignments[userId]
    setError(null)
    setPendingUserId(userId)
    // Optimista: se ve el cambio al toque, se revierte si falla.
    setAssignments((prev) => ({ ...prev, [userId]: roleId }))
    startTransition(async () => {
      const result = await assignRoleAction(userId, roleId)
      setPendingUserId(null)
      if (!result.ok) {
        setError(result.error)
        setAssignments((prev) => ({ ...prev, [userId]: previous }))
        return
      }
      router.refresh()
    })
  }

  function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setInviteError(null)
    setInviteSuccess(false)

    if (!inviteEmail || !inviteFullName || !inviteRoleId) {
      setInviteError("Completá email, nombre y rol.")
      return
    }

    startInviteTransition(async () => {
      const result = await inviteUserAction({
        email: inviteEmail,
        fullName: inviteFullName,
        roleId: inviteRoleId,
      })
      if (!result.ok) {
        setInviteError(result.error)
        return
      }
      setInviteEmail("")
      setInviteFullName("")
      setInviteSuccess(true)
      router.refresh()
    })
  }

  function initials(name: string) {
    return name
      .split(" ")
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Usuarios y roles</CardTitle>
        <p className="text-xs text-muted-foreground">
          Personas con acceso al backoffice y el rol que determina sus permisos.
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {canManage && (
          <form
            onSubmit={handleInvite}
            className="flex flex-col gap-2 rounded-md border border-dashed border-border p-3"
          >
            <span className="text-xs font-medium text-muted-foreground">Invitar usuario</span>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="flex-1 space-y-1">
                <Label htmlFor="invite-name">Nombre</Label>
                <Input
                  id="invite-name"
                  value={inviteFullName}
                  onChange={(e) => setInviteFullName(e.target.value)}
                  disabled={isInviting}
                />
              </div>
              <div className="flex-1 space-y-1">
                <Label htmlFor="invite-email">Email</Label>
                <Input
                  id="invite-email"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  disabled={isInviting}
                />
              </div>
              <div className="w-40 space-y-1">
                <Label htmlFor="invite-role">Rol</Label>
                <Select
                  id="invite-role"
                  value={inviteRoleId}
                  onChange={(e) => setInviteRoleId(e.target.value)}
                  disabled={isInviting}
                >
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            {inviteError && <p className="text-xs text-destructive">{inviteError}</p>}
            {inviteSuccess && (
              <p className="text-xs text-muted-foreground">
                Invitación enviada. Va a aparecer en la lista cuando acepte.
              </p>
            )}

            <Button type="submit" size="sm" disabled={isInviting} className="w-fit">
              {isInviting ? "Invitando..." : "Invitar"}
            </Button>
          </form>
        )}

        {error && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}
        <ul className="flex flex-col gap-2">
          {users.map((user) => (
            <li
              key={user.id}
              className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2.5"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground"
                  aria-hidden="true"
                >
                  {initials(user.fullName)}
                </span>
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-medium">{user.fullName}</span>
                  <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                </div>
              </div>

              <div className="w-40 shrink-0">
                <Select
                  aria-label={`Rol de ${user.fullName}`}
                  value={assignments[user.id]}
                  disabled={!canManage || (isPending && pendingUserId === user.id)}
                  onChange={(e) => assignRole(user.id, e.target.value)}
                >
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </Select>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
