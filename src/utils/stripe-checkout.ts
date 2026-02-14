import { projectId, publicAnonKey } from './supabase/info';

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-cb847823`;

interface CheckoutParams {
  priceId: string;
  quantity: number;
  email: string;
  name?: string;
}

/**
 * Create Stripe Checkout Session
 * Redirects user to Stripe to complete payment
 */
export async function createStripeCheckout(params: CheckoutParams): Promise<void> {
  try {
    const currentUrl = window.location.origin;
    const successUrl = `${currentUrl}/subscription?success=true`;
    const cancelUrl = `${currentUrl}/subscription?canceled=true`;

    const response = await fetch(`${API_BASE}/stripe/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`,
      },
      body: JSON.stringify({
        priceId: params.priceId,
        quantity: params.quantity,
        email: params.email,
        name: params.name,
        successUrl,
        cancelUrl,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create checkout session');
    }

    const data = await response.json();
    
    if (data.success && data.url) {
      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } else {
      throw new Error('No checkout URL returned');
    }
  } catch (error) {
    console.error('Stripe checkout error:', error);
    throw error;
  }
}

/**
 * Open Stripe Customer Portal
 * Allows users to manage their subscription, payment methods, and invoices
 */
export async function openStripePortal(): Promise<void> {
  try {
    const returnUrl = window.location.href;

    const response = await fetch(`${API_BASE}/stripe/portal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`,
      },
      body: JSON.stringify({
        returnUrl,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to open customer portal');
    }

    const data = await response.json();
    
    if (data.success && data.url) {
      // Redirect to Stripe Customer Portal
      window.location.href = data.url;
    } else {
      throw new Error('No portal URL returned');
    }
  } catch (error) {
    console.error('Stripe portal error:', error);
    throw error;
  }
}

/**
 * Get Current Subscription
 */
export async function getSubscription(): Promise<any> {
  try {
    const response = await fetch(`${API_BASE}/stripe/subscription`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch subscription');
    }

    const data = await response.json();
    return data.subscription;
  } catch (error) {
    console.error('Get subscription error:', error);
    return null;
  }
}

/**
 * Get Usage Stats
 */
export async function getUsageStats(): Promise<any> {
  try {
    const response = await fetch(`${API_BASE}/stripe/usage`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch usage stats');
    }

    const data = await response.json();
    return data.usage;
  } catch (error) {
    console.error('Get usage stats error:', error);
    return null;
  }
}

/**
 * Get Invoices
 */
export async function getInvoices(limit: number = 10): Promise<any[]> {
  try {
    const response = await fetch(`${API_BASE}/stripe/invoices?limit=${limit}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch invoices');
    }

    const data = await response.json();
    return data.invoices || [];
  } catch (error) {
    console.error('Get invoices error:', error);
    return [];
  }
}

/**
 * Update Subscription (change plan or quantity)
 */
export async function updateSubscription(priceId?: string, quantity?: number): Promise<any> {
  try {
    const response = await fetch(`${API_BASE}/stripe/subscription/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`,
      },
      body: JSON.stringify({
        priceId,
        quantity,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update subscription');
    }

    const data = await response.json();
    return data.subscription;
  } catch (error) {
    console.error('Update subscription error:', error);
    throw error;
  }
}

/**
 * Cancel Subscription
 */
export async function cancelSubscription(immediately: boolean = false): Promise<any> {
  try {
    const response = await fetch(`${API_BASE}/stripe/subscription/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`,
      },
      body: JSON.stringify({
        immediately,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to cancel subscription');
    }

    const data = await response.json();
    return data.subscription;
  } catch (error) {
    console.error('Cancel subscription error:', error);
    throw error;
  }
}
