import { Router } from "express";
import { prisma } from "../prisma.js";

const router = Router();

// helper to safely read jsonb stored in Prisma JsonValue
function asObj(v: unknown): Record<string, any> {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as any) : {};
}

router.get("/status", async (_req, res) => {
  try {
    // system_state row: key='atlas_online', value={"online":false, ...optional}
    const row = await prisma.system_state.findUnique({
      where: { key: "atlas_online" },
      select: { key: true, value: true, updated_at: true },
    });

    const value = asObj(row?.value);

    // Prefer explicit engine_enabled, else fall back to online
    const engineEnabled = Boolean(
      value.engine_enabled ?? value.online ?? false
    );

    // last tick stored inside jsonb (or null if you haven't written it yet)
    const lastTickAtRaw = value.last_tick_at ?? null;

    // approvals table has no `status`, so do a safe count.
    // If you have expires_at, this is a good pending heuristic:
    const now = new Date();
    const pendingApprovals = await prisma.approvals.count({
      where: {
        OR: [{ expires_at: null }, { expires_at: { gt: now } }],
      },
    });

    return res.json({
      ok: true,
      engineEnabled,
      needsHuman: pendingApprovals > 0,
      lastTickAt: lastTickAtRaw,
      updatedAt: row?.updated_at ?? null,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, error: "RUNTIME_STATUS_FAILED" });
  }
});

export default router;