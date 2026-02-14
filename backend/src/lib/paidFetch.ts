import { writeLedgerEvent } from "./ledger.js";

export async function paidFetch(input: RequestInfo, init: RequestInit & {
  provider: string;          // "Twilio", "SendGrid", "Stripe", etc
  eventType?: string;        // default "API_SPEND"
  relatedId?: string;
  estAmount?: number;        // optional, if you know cost
  metadata?: Record<string, any>;
}): Promise<Response> {
  const start = Date.now();
  let status: "SUCCESS" | "FAILED" = "SUCCESS";
  let httpStatus: number | null = null;

  try {
    const res = await fetch(input, init);
    httpStatus = res.status;
    if (!res.ok) status = "FAILED";
    return res;
  } catch (e) {
    status = "FAILED";
    throw e;
  } finally {
    const latencyMs = Date.now() - start;

    await writeLedgerEvent({
      eventType: (init.eventType as any) ?? "API_SPEND",
      provider: init.provider,
      status,
      amount: init.estAmount, // optional
      relatedJobId: init.relatedId,
      metadata: {
        ...init.metadata,
        url: typeof input === "string" ? input : "Request",
        method: init.method ?? "GET",
        latencyMs,
        httpStatus,
      },
    });
  }
}
