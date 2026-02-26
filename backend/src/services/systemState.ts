/**
 * System state stored in DB (public.system_state).
 *
 * IMPORTANT: This MUST be DB-backed (not in-memory) so that:
 * - UI + API see the same state after restarts
 * - background workers (separate process) can read the same state
 */

import { prisma } from "../db/prisma.js";

export type SystemStateRow = {
  key: string;
  value: any;
  updated_at: Date | null;
};

function parseBoolString(v: string): boolean | null {
  const s = String(v ?? "").trim().toLowerCase();
  if (s === "true" || s === "1" || s === "yes" || s === "y" || s === "on") return true;
  if (s === "false" || s === "0" || s === "no" || s === "n" || s === "off") return false;
  return null;
}

/**
 * Set a system state value.
 *
 * For key='atlas_online':
 * - if value is a boolean-ish string, we store a JSON object with
 *   { online, engine_enabled, last_tick_at? } for backward compatibility.
 */
export async function setSystemState(key: string, value: unknown) {
  let nextValue: any = value as any;

  if (key === "atlas_online") {
    // Preserve/merge existing object if present.
    const existing = await prisma.system_state.findUnique({ where: { key }, select: { value: true } });
    const prev = (existing?.value && typeof existing.value === "object" && !Array.isArray(existing.value))
      ? (existing.value as any)
      : {};

    if (typeof value === "string") {
      const b = parseBoolString(value);
      if (b !== null) {
        nextValue = { ...prev, online: b, engine_enabled: b };
      } else {
        nextValue = value;
      }
    } else if (typeof value === "boolean") {
      nextValue = { ...prev, online: value, engine_enabled: value };
    } else if (value && typeof value === "object" && !Array.isArray(value)) {
      nextValue = { ...prev, ...(value as any) };
    }
  }

  const row = await prisma.system_state.upsert({
    where: { key },
    create: { key, value: nextValue },
    update: { value: nextValue, updated_at: new Date() },
    select: { key: true, value: true, updated_at: true },
  });

  return row as SystemStateRow;
}

export async function getSystemState(key: string) {
  const row = await prisma.system_state.findUnique({
    where: { key },
    select: { key: true, value: true, updated_at: true },
  });
  return (row ?? null) as SystemStateRow | null;
}
