import { engineTick } from "../core/engine/engine.js";
import { getSystemState, setSystemState } from "../services/systemState.js";

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function asObj(v: unknown): Record<string, any> {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as any) : {};
}

function isAtlasOnline(value: unknown): boolean {
  const o = asObj(value);
  // Prefer engine_enabled, else online.
  return Boolean(o.engine_enabled ?? o.online ?? false);
}

async function setLastTickAt(iso: string) {
  const row = await getSystemState("atlas_online");
  const prev = asObj(row?.value);
  await setSystemState("atlas_online", { ...prev, last_tick_at: iso });
}

/**
 * Background worker #1: Engine loop
 *
 * - Checks atlas_online from DB-backed system_state
 * - Calls engineTick() to drain the Intent queue
 * - Writes last_tick_at into system_state.value (json)
 *
 * Env:
 *  ENGINE_LOOP_IDLE_MS (default 750)
 *  ENGINE_LOOP_OFFLINE_MS (default 2500)
 *  ENGINE_LOOP_MAX_TICKS_PER_CYCLE (default 25)
 */
async function main() {
  const idleMs = Math.max(50, Number(process.env.ENGINE_LOOP_IDLE_MS ?? 750));
  const offlineMs = Math.max(250, Number(process.env.ENGINE_LOOP_OFFLINE_MS ?? 2500));
  const maxTicksPerCycle = Math.max(1, Math.min(200, Number(process.env.ENGINE_LOOP_MAX_TICKS_PER_CYCLE ?? 25)));

  let stopping = false;
  const stop = () => {
    stopping = true;
  };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);

  // Ensure the atlas_online key exists (no-op if already present).
  try {
    const existing = await getSystemState("atlas_online");
    if (!existing) await setSystemState("atlas_online", { online: false, engine_enabled: false });
  } catch {
    // ignore
  }

  // eslint-disable-next-line no-constant-condition
  while (true) {
    if (stopping) {
      process.stdout.write("[engineLoop] stopping\n");
      process.exit(0);
    }

    let online = false;
    try {
      const row = await getSystemState("atlas_online");
      online = isAtlasOnline(row?.value);
    } catch (e: any) {
      process.stderr.write(`[engineLoop] state read failed: ${e?.message ?? e}\n`);
      await sleep(offlineMs);
      continue;
    }

    if (!online) {
      await sleep(offlineMs);
      continue;
    }

    // Drain a batch of intents quickly, then pause.
    let didWork = false;
    for (let i = 0; i < maxTicksPerCycle; i++) {
      const out = await engineTick();
      if (!out?.ran) break;
      didWork = true;
      await setLastTickAt(new Date().toISOString());
    }

    await sleep(didWork ? 0 : idleMs);
  }
}

main().catch((e) => {
  process.stderr.write(`[engineLoop] fatal: ${e?.message ?? e}\n`);
  process.exit(1);
});
