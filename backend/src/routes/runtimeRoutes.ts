import { Router } from "express";
import { prisma } from "../prisma.js";

const router = Router();

/**
 * GET /v1/runtime/status
 * Source of truth for Atlas heart state
 */
router.get("/status", async (_req, res) => {
  try {
    // 🔹 engine state
    const state = await prisma.system_state.findUnique({
      where: { key: "atlas_online" }
    });

    // 🔹 HIL detection (CANONICAL)
    // Using approvals table — adjust if you prefer atlas_ip_approvals
    const pendingApprovals = await prisma.approvals.count({
      where: {
        status: "PENDING"
        // optional freshness guard later:
        // created_at: { gt: subDays(new Date(), 7) }
      }
    });

    const needsHuman = pendingApprovals > 0;

    // 🔹 recent activity check
    let recentActivity = false;
    if (state?.last_tick_at) {
      const ageMs =
        Date.now() - new Date(state.last_tick_at).getTime();
      recentActivity = ageMs < 30_000; // 30s window
    }

    return res.json({
      ok: true,
      engineEnabled: state?.engine_enabled ?? false,
      needsHuman,
      lastTickAt: state?.last_tick_at ?? null,
      recentActivity
    });

  } catch (err) {
    console.error("runtime status failed", err);
    return res.status(500).json({
      ok: false,
      error: "RUNTIME_STATUS_FAILED"
    });
  }
});

export default router;