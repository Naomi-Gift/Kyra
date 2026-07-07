/**
 * Route handler session helper.
 * Returns the authenticated userId or null if not signed in.
 */
import { auth } from "@/auth";

export async function getUserId(): Promise<string | null> {
  const session = await auth();
  return (session?.user as { id?: string })?.id ?? null;
}

export const UNAUTHORIZED = (msg = "Not authenticated.") =>
  Response.json({ error: msg }, { status: 401 });
