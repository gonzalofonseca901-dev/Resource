"use client"

import { useState } from "react"
import type { Role, User } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select } from "@/components/ui/select"

interface UsersRolesManagerProps {
  users: User[]
  roles: Role[]
  canManage: boolean
}

export function UsersRolesManager({ users, roles, canManage }: UsersRolesManagerProps) {
  // Track role assignment per user id (mocked; later a PATCH on the users table).
  const [assignments, setAssignments] = useState<Record<string, string>>(() =>
    Object.fromEntries(users.map((u) => [u.id, u.role.id])),
  )

  function assignRole(userId: string, roleId: string) {
    setAssignments((prev) => ({ ...prev, [userId]: roleId }))
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
      <CardContent>
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
                  disabled={!canManage}
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
