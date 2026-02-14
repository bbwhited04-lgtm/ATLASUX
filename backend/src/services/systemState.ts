/**
 * Lightweight in-memory system state.
 *
 * We previously backed this with a Prisma `SystemState` model, but the
 * current schema does not include it. To keep builds green (and keep local
 * development moving), we store state in-process.
 *
 * If you want this persisted across restarts, add a Prisma model and swap
 * this implementation back to DB.
 */

type SystemStateRow = {
  key: string;
  value: string;
  updatedAt: Date;
};

const state = new Map<string, SystemStateRow>();

export async function setSystemState(key: string, value: string) {
  const row: SystemStateRow = { key, value, updatedAt: new Date() };
  state.set(key, row);
  return row;
}

export async function getSystemState(key: string) {
  return state.get(key) ?? null;
}
