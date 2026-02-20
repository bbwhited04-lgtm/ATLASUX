import { stripeCreatePrice, stripeCreateProduct } from "../integrations/stripe.client.js";

export type StripeCatalogCreateArgs = {
  name: string;
  description?: string | null;
  priceUSD: number;
  currency?: string | null; // default usd
  metadata?: Record<string, string> | null;
};

export async function createStripeProductAndPrice(args: StripeCatalogCreateArgs): Promise<{
  productId: string;
  priceId: string;
  product: any;
  price: any;
}> {
  const priceUSD = Number(args.priceUSD);
  if (!Number.isFinite(priceUSD) || priceUSD < 0) throw new Error("priceUSD must be a non-negative number");

  const unit_amount = Math.round(priceUSD * 100);
  const currency = (args.currency ?? "usd").toLowerCase();
  const metadata = args.metadata ?? undefined;

  const product = await stripeCreateProduct({
    name: args.name,
    description: args.description ?? undefined,
    metadata,
  });

  const price = await stripeCreatePrice({
    product: product.id,
    unit_amount,
    currency,
    metadata,
  });

  return {
    productId: product.id,
    priceId: price.id,
    product,
    price,
  };
}
