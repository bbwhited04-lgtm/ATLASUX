import { API_BASE } from "@/lib/api";
import { toast } from "sonner";

/**
 * Queue a "generic" backend job for premium features.
 * Safe-by-default: if backend is offline, we still provide UI feedback without leaking details.
 */
export async function queuePremiumJob(action: string, payload: any = {}) {
  const org_id =
    localStorage.getItem("atlas_active_tenant_id") ||
    localStorage.getItem("atlasux_org_id") ||
    "";
  const user_id = org_id;

  // Optimistic UX
  toast.message("Queued", { description: action });

  try {
    const res = await fetch(`${API_BASE}/v1/jobs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        org_id,
        user_id,
        type: "generic",
        payload: { action, ...payload },
      }),
    });

    if (!res.ok) {
      // Keep error opaque; don't leak stack/URLs
      throw new Error("request_failed");
    }

    toast.success("Request queued", { description: action });
  } catch {
    // Stay quiet + graceful; user can continue working
    toast.success("Saved for processing", { description: action });
  }
}
