// Session access. Today it returns the mocked current user; later this becomes
// a real session lookup (e.g. Supabase auth.getUser + a profiles query) without
// changing the signature or call sites.

import type { User } from "@/lib/types"
import { MOCK_CURRENT_USER } from "@/lib/mock-data"

/** The currently authenticated backoffice user. */
export async function getCurrentUser(): Promise<User> {
  return MOCK_CURRENT_USER
}
