/**
 * Stripe Integration for Atlas UX
 * Handles subscriptions, payments, and webhook events
 */

import Stripe from "npm:stripe";
import { createClient } from "jsr:";

// Initialize Stripe with API key from environment
const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2024-12-18.acacia',
  httpClient: Stripe.createFetchHttpClient(),
});

// Supabase client for database operations
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
);

// Price IDs from Stripe (set these in environment variables)
const PRICE_IDS = {
  starter_monthly: Deno.env.get('STRIPE_PRICE_STARTER_MONTHLY') || 'price_1SwlTXKC49F2A9Oznk7DoYV8',
  starter_annual: Deno.env.get('STRIPE_PRICE_STARTER_ANNUAL') || '',
  professional_monthly: Deno.env.get('STRIPE_PRICE_PROFESSIONAL_MONTHLY') || 'price_1SwlUBKC49F2A9OzLo1QbkAl',
  professional_annual: Deno.env.get('STRIPE_PRICE_PROFESSIONAL_ANNUAL') || '',
  business_monthly: Deno.env.get('STRIPE_PRICE_BUSINESS_MONTHLY') || 'price_1SwljWKC49F2A9OzD2R2kTGf',
  business_annual: Deno.env.get('STRIPE_PRICE_BUSINESS_ANNUAL') || '',
  enterprise_monthly: Deno.env.get('STRIPE_PRICE_ENTERPRISE_MONTHLY') || 'price_1SwlkqKC49F2A9Oz505XsHQO',
  enterprise_annual: Deno.env.get('STRIPE_PRICE_ENTERPRISE_ANNUAL') || '',
};

// Minimum seat requirements for each plan
const MIN_SEATS = {
  starter: 1,
  professional: 5,
  business: 10,
  enterprise: 50,
};

// Webhook secret for signature verification
const WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET') || '';

/**
 * Get or Create Stripe Customer
 */
export async function getOrCreateStripeCustomer(
  userId: string,
  email: string,
  name?: string
): Promise<string> {
  try {
    // Check if user already has a Stripe customer ID
    const { data: userData } = await supabase
      .from('kv_store_cb847823')
      .select('value')
      .eq('key', `user:${userId}:stripe_customer_id`)
      .single();

    if (userData?.value) {
      return userData.value;
    }

    // Create new Stripe customer
    const customer = await stripe.customers.create({
      email,
      name: name || email.split('@')[0],
      metadata: {
        user_id: userId,
        atlas_ux_user: 'true',
      },
    });

    // Store customer ID in database
    await supabase.from('kv_store_cb847823').insert({
      key: `user:${userId}:stripe_customer_id`,
      value: customer.id,
    });

    return customer.id;
  } catch (error) {
    console.error('Error creating Stripe customer:', error);
    throw error;
  }
}

/**
 * Create Checkout Session
 */
export async function createCheckoutSession(
  userId: string,
  email: string,
  priceId: string,
  quantity: number = 1,
  successUrl: string,
  cancelUrl: string
): Promise<Stripe.Checkout.Session> {
  try {
    const customerId = await getOrCreateStripeCustomer(userId, email);

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      metadata: {
        user_id: userId,
      },
      subscription_data: {
        metadata: {
          user_id: userId,
        },
      },
    });

    return session;
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
}

/**
 * Create Portal Session (for managing subscriptions)
 */
export async function createPortalSession(
  userId: string,
  returnUrl: string
): Promise<Stripe.BillingPortal.Session> {
  try {
    // Get customer ID from database
    const { data: userData } = await supabase
      .from('kv_store_cb847823')
      .select('value')
      .eq('key', `user:${userId}:stripe_customer_id`)
      .single();

    if (!userData?.value) {
      throw new Error('Customer not found');
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: userData.value,
      return_url: returnUrl,
    });

    return session;
  } catch (error) {
    console.error('Error creating portal session:', error);
    throw error;
  }
}

/**
 * Get Subscription Details
 */
export async function getSubscription(userId: string): Promise<any> {
  try {
    // Get subscription ID from database
    const { data: subData } = await supabase
      .from('kv_store_cb847823')
      .select('value')
      .eq('key', `user:${userId}:subscription`)
      .single();

    if (!subData?.value) {
      return null;
    }

    const subscription = JSON.parse(subData.value);
    
    // Fetch latest from Stripe
    if (subscription.stripe_subscription_id) {
      const stripeSubscription = await stripe.subscriptions.retrieve(
        subscription.stripe_subscription_id
      );

      return {
        ...subscription,
        status: stripeSubscription.status,
        current_period_end: new Date(stripeSubscription.current_period_end * 1000),
        current_period_start: new Date(stripeSubscription.current_period_start * 1000),
        cancel_at_period_end: stripeSubscription.cancel_at_period_end,
      };
    }

    return subscription;
  } catch (error) {
    console.error('Error getting subscription:', error);
    return null;
  }
}

/**
 * Update Subscription (change plan or quantity)
 */
export async function updateSubscription(
  userId: string,
  newPriceId?: string,
  newQuantity?: number
): Promise<Stripe.Subscription> {
  try {
    const subscription = await getSubscription(userId);
    if (!subscription?.stripe_subscription_id) {
      throw new Error('Subscription not found');
    }

    const stripeSubscription = await stripe.subscriptions.retrieve(
      subscription.stripe_subscription_id
    );

    const updates: Stripe.SubscriptionUpdateParams = {
      items: [
        {
          id: stripeSubscription.items.data[0].id,
          price: newPriceId || stripeSubscription.items.data[0].price.id,
          quantity: newQuantity || stripeSubscription.items.data[0].quantity,
        },
      ],
      proration_behavior: 'always_invoice',
    };

    const updatedSubscription = await stripe.subscriptions.update(
      subscription.stripe_subscription_id,
      updates
    );

    // Update database
    await updateSubscriptionInDatabase(userId, updatedSubscription);

    return updatedSubscription;
  } catch (error) {
    console.error('Error updating subscription:', error);
    throw error;
  }
}

/**
 * Cancel Subscription
 */
export async function cancelSubscription(
  userId: string,
  immediately: boolean = false
): Promise<Stripe.Subscription> {
  try {
    const subscription = await getSubscription(userId);
    if (!subscription?.stripe_subscription_id) {
      throw new Error('Subscription not found');
    }

    const updatedSubscription = immediately
      ? await stripe.subscriptions.cancel(subscription.stripe_subscription_id)
      : await stripe.subscriptions.update(subscription.stripe_subscription_id, {
          cancel_at_period_end: true,
        });

    // Update database
    await updateSubscriptionInDatabase(userId, updatedSubscription);

    return updatedSubscription;
  } catch (error) {
    console.error('Error canceling subscription:', error);
    throw error;
  }
}

/**
 * Get Invoices
 */
export async function getInvoices(
  userId: string,
  limit: number = 10
): Promise<Stripe.Invoice[]> {
  try {
    // Get customer ID
    const { data: userData } = await supabase
      .from('kv_store_cb847823')
      .select('value')
      .eq('key', `user:${userId}:stripe_customer_id`)
      .single();

    if (!userData?.value) {
      return [];
    }

    const invoices = await stripe.invoices.list({
      customer: userData.value,
      limit,
    });

    return invoices.data;
  } catch (error) {
    console.error('Error getting invoices:', error);
    return [];
  }
}

/**
 * Get Usage Stats
 */
export async function getUsageStats(userId: string): Promise<any> {
  try {
    // Get all usage data from KV store
    const { data: usageData } = await supabase
      .from('kv_store_cb847823')
      .select('key, value')
      .like('key', `user:${userId}:usage:%`);

    const stats = {
      jobs: { used: 0, limit: -1 },
      integrations: { used: 0, limit: 65 },
      storage: { used: 0, limit: 100 },
      apiCalls: { used: 0, limit: 100000 },
    };

    if (usageData) {
      for (const item of usageData) {
        const key = item.key.split(':').pop();
        if (key && stats[key as keyof typeof stats]) {
          const data = JSON.parse(item.value);
          stats[key as keyof typeof stats] = data;
        }
      }
    }

    return stats;
  } catch (error) {
    console.error('Error getting usage stats:', error);
    return {
      jobs: { used: 0, limit: -1 },
      integrations: { used: 0, limit: 65 },
      storage: { used: 0, limit: 100 },
      apiCalls: { used: 0, limit: 100000 },
    };
  }
}

/**
 * Update Subscription in Database
 */
async function updateSubscriptionInDatabase(
  userId: string,
  stripeSubscription: Stripe.Subscription
): Promise<void> {
  try {
    const item = stripeSubscription.items.data[0];
    const priceMetadata = item.price.metadata || {};

    const subscriptionData = {
      stripe_subscription_id: stripeSubscription.id,
      stripe_customer_id: stripeSubscription.customer as string,
      plan: priceMetadata.tier || 'professional',
      status: stripeSubscription.status,
      seats: item.quantity || 1,
      price_per_seat: (item.price.unit_amount || 0) / 100,
      billing_cycle: item.price.recurring?.interval || 'month',
      current_period_start: new Date(stripeSubscription.current_period_start * 1000),
      current_period_end: new Date(stripeSubscription.current_period_end * 1000),
      cancel_at_period_end: stripeSubscription.cancel_at_period_end,
    };

    await supabase.from('kv_store_cb847823').upsert({
      key: `user:${userId}:subscription`,
      value: JSON.stringify(subscriptionData),
    });
  } catch (error) {
    console.error('Error updating subscription in database:', error);
    throw error;
  }
}

/**
 * Handle Stripe Webhooks
 */
export async function handleWebhook(
  request: Request
): Promise<Response> {
  try {
    const signature = request.headers.get('stripe-signature');
    if (!signature) {
      return new Response('No signature', { status: 400 });
    }

    const body = await request.text();
    const event = stripe.webhooks.constructEvent(body, signature, WEBHOOK_SECRET);

    console.log(`Webhook received: ${event.type}`);

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.paid':
        await handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: 'Webhook handler failed' }),
      { status: 400 }
    );
  }
}

/**
 * Handle Subscription Updated Webhook
 */
async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription
): Promise<void> {
  try {
    const userId = subscription.metadata.user_id;
    if (!userId) {
      console.error('No user_id in subscription metadata');
      return;
    }

    await updateSubscriptionInDatabase(userId, subscription);

    console.log(`Subscription updated for user ${userId}`);
  } catch (error) {
    console.error('Error handling subscription update:', error);
  }
}

/**
 * Handle Subscription Deleted Webhook
 */
async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription
): Promise<void> {
  try {
    const userId = subscription.metadata.user_id;
    if (!userId) {
      console.error('No user_id in subscription metadata');
      return;
    }

    // Mark subscription as canceled in database
    await supabase.from('kv_store_cb847823').upsert({
      key: `user:${userId}:subscription`,
      value: JSON.stringify({
        stripe_subscription_id: subscription.id,
        status: 'canceled',
        canceled_at: new Date(),
      }),
    });

    console.log(`Subscription canceled for user ${userId}`);
  } catch (error) {
    console.error('Error handling subscription deletion:', error);
  }
}

/**
 * Handle Invoice Paid Webhook
 */
async function handleInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
  try {
    const customerId = invoice.customer as string;
    
    // Get user ID from customer
    const { data: userData } = await supabase
      .from('kv_store_cb847823')
      .select('key')
      .eq('value', customerId)
      .like('key', 'user:%:stripe_customer_id')
      .single();

    if (!userData) {
      console.error('User not found for customer:', customerId);
      return;
    }

    const userId = userData.key.split(':')[1];

    // Store invoice in database
    await supabase.from('kv_store_cb847823').insert({
      key: `user:${userId}:invoice:${invoice.id}`,
      value: JSON.stringify({
        invoice_id: invoice.id,
        amount: invoice.amount_paid / 100,
        status: invoice.status,
        paid_at: new Date(invoice.status_transitions.paid_at! * 1000),
        pdf_url: invoice.invoice_pdf,
        hosted_url: invoice.hosted_invoice_url,
      }),
    });

    console.log(`Invoice paid for user ${userId}: $${invoice.amount_paid / 100}`);
  } catch (error) {
    console.error('Error handling invoice paid:', error);
  }
}

/**
 * Handle Invoice Payment Failed Webhook
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
  try {
    const customerId = invoice.customer as string;
    
    // Get user ID from customer
    const { data: userData } = await supabase
      .from('kv_store_cb847823')
      .select('key')
      .eq('value', customerId)
      .like('key', 'user:%:stripe_customer_id')
      .single();

    if (!userData) {
      console.error('User not found for customer:', customerId);
      return;
    }

    const userId = userData.key.split(':')[1];

    // TODO: Send email notification to user about payment failure
    // TODO: Update subscription status to 'past_due'

    console.log(`Payment failed for user ${userId}`);
  } catch (error) {
    console.error('Error handling payment failure:', error);
  }
}

/**
 * Get Available Plans
 */
export function getAvailablePlans() {
  return {
    starter: {
      id: 'starter',
      name: 'Starter',
      monthly: {
        price_id: PRICE_IDS.starter_monthly,
        price: 99,
      },
      annual: {
        price_id: PRICE_IDS.starter_annual,
        price: 950,
      },
      seats: 1,
      features: {
        integrations: 10,
        jobs: 500,
        storage: 10,
        support: 'community',
      },
    },
    professional: {
      id: 'professional',
      name: 'Professional',
      monthly: {
        price_id: PRICE_IDS.professional_monthly,
        price: 249,
      },
      annual: {
        price_id: PRICE_IDS.professional_annual,
        price: 2388,
      },
      seats: 5,
      features: {
        integrations: 65,
        jobs: -1, // unlimited
        storage: 100,
        support: 'priority',
      },
      popular: true,
    },
    business: {
      id: 'business',
      name: 'Business',
      monthly: {
        price_id: PRICE_IDS.business_monthly,
        price: 45,
        per_seat: true,
      },
      annual: {
        price_id: PRICE_IDS.business_annual,
        price: 43,
        per_seat: true,
      },
      min_seats: 10,
      max_seats: 49,
      features: {
        integrations: 65,
        jobs: -1,
        storage: 500,
        support: 'dedicated',
        custom_integrations: 3,
      },
    },
    enterprise: {
      id: 'enterprise',
      name: 'Enterprise',
      monthly: {
        price_id: PRICE_IDS.enterprise_monthly,
        price: 40,
        per_seat: true,
      },
      annual: {
        price_id: PRICE_IDS.enterprise_annual,
        price: 38,
        per_seat: true,
      },
      min_seats: 50,
      features: {
        integrations: -1,
        jobs: -1,
        storage: -1,
        support: '24/7',
        custom_integrations: -1,
        sla: 99.9,
        on_premise: true,
      },
    },
  };
}