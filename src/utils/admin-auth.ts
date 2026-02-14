import { projectId, publicAnonKey } from './supabase/info';

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-cb847823`;

// Admin email address
export const ADMIN_EMAIL = 'bbwhited@icloud.com';

/**
 * Request admin verification code via email
 */
export async function requestAdminCode(email: string): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(`${API_BASE}/admin/request-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`,
      },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to send verification code');
    }

    return {
      success: true,
      message: data.message || 'Verification code sent to your email'
    };
  } catch (error) {
    console.error('Request admin code error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to send code'
    };
  }
}

/**
 * Verify admin code
 */
export async function verifyAdminCode(email: string, code: string): Promise<{ success: boolean; token?: string; message: string }> {
  try {
    const response = await fetch(`${API_BASE}/admin/verify-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`,
      },
      body: JSON.stringify({ email, code }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Invalid verification code');
    }

    // Store admin token
    if (data.token) {
      localStorage.setItem('atlas-admin-token', data.token);
      localStorage.setItem('atlas-admin-email', email);
      localStorage.setItem('atlas-admin-expires', data.expiresAt || (Date.now() + 24 * 60 * 60 * 1000).toString());
    }

    return {
      success: true,
      token: data.token,
      message: 'Admin access granted'
    };
  } catch (error) {
    console.error('Verify admin code error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Verification failed'
    };
  }
}

/**
 * Check if user has valid admin session
 */
export function isAdminAuthenticated(): boolean {
  const token = localStorage.getItem('atlas-admin-token');
  const email = localStorage.getItem('atlas-admin-email');
  const expiresAt = localStorage.getItem('atlas-admin-expires');

  if (!token || !email || !expiresAt) {
    return false;
  }

  // Check if token is expired
  if (Date.now() > parseInt(expiresAt)) {
    logoutAdmin();
    return false;
  }

  // Verify email matches
  if (email !== ADMIN_EMAIL) {
    logoutAdmin();
    return false;
  }

  return true;
}

/**
 * Get admin token
 */
export function getAdminToken(): string | null {
  if (!isAdminAuthenticated()) {
    return null;
  }
  return localStorage.getItem('atlas-admin-token');
}

/**
 * Get admin email
 */
export function getAdminEmail(): string | null {
  if (!isAdminAuthenticated()) {
    return null;
  }
  return localStorage.getItem('atlas-admin-email');
}

/**
 * Logout admin
 */
export function logoutAdmin(): void {
  localStorage.removeItem('atlas-admin-token');
  localStorage.removeItem('atlas-admin-email');
  localStorage.removeItem('atlas-admin-expires');
}

/**
 * Get admin session info
 */
export function getAdminSession(): { 
  isAuthenticated: boolean; 
  email: string | null; 
  expiresAt: number | null;
  timeRemaining: number | null;
} {
  const isAuth = isAdminAuthenticated();
  const email = isAuth ? getAdminEmail() : null;
  const expiresAt = isAuth ? parseInt(localStorage.getItem('atlas-admin-expires') || '0') : null;
  const timeRemaining = expiresAt ? expiresAt - Date.now() : null;

  return {
    isAuthenticated: isAuth,
    email,
    expiresAt,
    timeRemaining
  };
}
