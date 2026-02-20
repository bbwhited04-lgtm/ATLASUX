import { z } from "zod";

const StripeCreateProductSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  url: z.string().url().optional(),
  metadata: z.record(z.string()).optional(),
});

const StripeCreatePriceSchema = z.object({
  product: z.string().min(1),
  unit_amount: z.number().int().nonnegative(),
  currency: z.string().min(3).max(3).default("usd"),
  metadata: z.record(z.string()).optional(),
});

export type StripeCreateProductArgs = z.infer<typeof StripeCreateProductSchema>;
export type StripeCreatePriceArgs = z.infer<typeof StripeCreatePriceSchema>;

function requireStripeKey(): string {
  const key = (process.env.STRIPE_SECRET_KEY ?? "").trim();
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  return key;
}

function stripeHeaders() {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${requireStripeKey()}`,
    "Content-Type": "application/x-www-form-urlencoded",
  };
  const apiVersion = (process.env.STRIPE_API_VERSION ?? "").trim();
  if (apiVersion) headers["Stripe-Version"] = apiVersion;
  return headers;
}

function toFormBody(obj: Record<string, any>): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue;
    if (typeof v === "object" && !Array.isArray(v)) {
      // metadata[foo]=bar
      for (const [mk, mv] of Object.entries(v)) {
        if (mv === undefined || mv === null) continue;
        p.set(`${k}[${mk}]`, String(mv));
      }
      continue;
    }
    p.set(k, String(v));
  }
  return p.toString();
}

async function stripePost<T>(path: string, body: Record<string, any>): Promise<T> {
  const url = `https://api.stripe.com${path}`;
  const r = await fetch(url, {
    method: "POST",
    headers: stripeHeaders(),
    body: toFormBody(body),
  });
  const text = await r.text().catch(() => "");
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }
  if (!r.ok) {
    const msg = data?.error?.message || text || `stripe_http_${r.status}`;
    throw new Error(`Stripe request failed (${r.status}): ${msg}`);
  }
  return data as T;
}

export async function stripeCreateProduct(args: StripeCreateProductArgs): Promise<any> {
  const parsed = StripeCreateProductSchema.parse(args);
  return stripePost<any>("/v1/products", {
    name: parsed.name,
    description: parsed.description,
    url: parsed.url,
    metadata: parsed.metadata,
  });
}

export async function stripeCreatePrice(args: StripeCreatePriceArgs): Promise<any> {
  const parsed = StripeCreatePriceSchema.parse(args);
  return stripePost<any>("/v1/prices", {
    product: parsed.product,
    unit_amount: parsed.unit_amount,
    currency: parsed.currency,
    metadata: parsed.metadata,
  });
}
