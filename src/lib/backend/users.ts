/**
 * In-memory user store for KYRA auth.
 *
 * Intentionally mirrors the same pattern as store.ts — a lightweight
 * singleton that works perfectly for hackathon / demo usage.
 * Swap for a real DB (Prisma, Drizzle, etc.) without touching the auth layer.
 */

import { hashSync, compareSync } from "bcryptjs";

export interface KyraUser {
  id: string;
  name: string;
  email: string;
  /** bcrypt hash */
  passwordHash: string;
  createdAt: string;
}

// Seeded demo account so the app is usable without signing up first.
const users: KyraUser[] = [
  {
    id: "user_demo",
    name: "Naya Okafor",
    email: "naya@example.com",
    passwordHash: hashSync("kyra2026", 10),
    createdAt: new Date().toISOString(),
  },
];

export function findUserByEmail(email: string): KyraUser | undefined {
  return users.find((u) => u.email.toLowerCase() === email.toLowerCase());
}

export function findUserById(id: string): KyraUser | undefined {
  return users.find((u) => u.id === id);
}

export function createUser(
  name: string,
  email: string,
  password: string
): KyraUser {
  const existing = findUserByEmail(email);
  if (existing) throw new Error("An account with that email already exists.");

  const user: KyraUser = {
    id: `user_${Date.now()}`,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    passwordHash: hashSync(password, 10),
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  return user;
}

export function verifyPassword(user: KyraUser, password: string): boolean {
  return compareSync(password, user.passwordHash);
}
