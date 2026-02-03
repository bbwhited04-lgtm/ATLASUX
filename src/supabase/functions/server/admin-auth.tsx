/**
 * Admin Authentication System
 * Handles email verification codes for admin access
 */

// Admin credentials
const ADMIN_EMAIL = 'bbwhited@icloud.com';

// In-memory storage for verification codes (valid for 10 minutes)
const verificationCodes = new Map<string, { code: string; expiresAt: number }>();

/**
 * Generate random 6-digit verification code
 */
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Send verification code via email
 * NOTE: In production, replace this with actual email service (Resend, SendGrid, etc.)
 */
async function sendVerificationEmail(email: string, code: string): Promise<boolean> {
  try {
    console.log(`[Admin Auth] Verification code for ${email}: ${code}`);
    
    // TODO: Replace with actual email service
    // Example with Resend:
    // const response = await fetch('https://api.resend.com/emails', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     from: 'Atlas UX <noreply@atlasux.com>',
    //     to: email,
    //     subject: 'Your Admin Verification Code',
    //     html: `
    //       <h2>Atlas UX Admin Login</h2>
    //       <p>Your verification code is:</p>
    //       <h1 style="font-size: 32px; letter-spacing: 8px; color: #06b6d4;">${code}</h1>
    //       <p>This code expires in 10 minutes.</p>
    //       <p>If you didn't request this code, please ignore this email.</p>
    //     `,
    //   }),
    // });
    
    // For development: Just log the code
    console.log(`
    ╔═══════════════════════════════════════╗
    ║  ADMIN VERIFICATION CODE              ║
    ║                                       ║
    ║  Email: ${email.padEnd(28)} ║
    ║  Code:  ${code}                       ║
    ║                                       ║
    ║  Expires in 10 minutes                ║
    ╚═══════════════════════════════════════╝
    `);
    
    return true;
  } catch (error) {
    console.error('[Admin Auth] Failed to send email:', error);
    return false;
  }
}

/**
 * Request verification code
 */
export async function requestAdminVerificationCode(email: string): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    // Validate email
    if (!email || !email.includes('@')) {
      return {
        success: false,
        message: 'Invalid email address'
      };
    }

    // Check if email is admin email
    if (email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      return {
        success: false,
        message: 'Unauthorized: Not an admin email'
      };
    }

    // Generate code
    const code = generateVerificationCode();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Store code
    verificationCodes.set(email.toLowerCase(), { code, expiresAt });

    // Send email
    const emailSent = await sendVerificationEmail(email, code);

    if (!emailSent) {
      return {
        success: false,
        message: 'Failed to send verification email'
      };
    }

    // Clean up expired codes
    cleanupExpiredCodes();

    return {
      success: true,
      message: `Verification code sent to ${email}`
    };
  } catch (error) {
    console.error('[Admin Auth] Request code error:', error);
    return {
      success: false,
      message: 'Failed to send verification code'
    };
  }
}

/**
 * Verify code and grant admin access
 */
export async function verifyAdminCode(email: string, code: string): Promise<{
  success: boolean;
  token?: string;
  expiresAt?: number;
  message: string;
}> {
  try {
    // Validate inputs
    if (!email || !code) {
      return {
        success: false,
        message: 'Email and code are required'
      };
    }

    // Check if email is admin
    if (email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      return {
        success: false,
        message: 'Unauthorized'
      };
    }

    // Get stored code
    const storedData = verificationCodes.get(email.toLowerCase());

    if (!storedData) {
      return {
        success: false,
        message: 'No verification code found. Please request a new code.'
      };
    }

    // Check if expired
    if (Date.now() > storedData.expiresAt) {
      verificationCodes.delete(email.toLowerCase());
      return {
        success: false,
        message: 'Verification code expired. Please request a new code.'
      };
    }

    // Verify code
    if (storedData.code !== code.trim()) {
      return {
        success: false,
        message: 'Invalid verification code'
      };
    }

    // Code is valid - generate admin token
    const token = generateAdminToken(email);
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    // Remove used code
    verificationCodes.delete(email.toLowerCase());

    console.log(`[Admin Auth] ✅ Admin access granted to ${email}`);

    return {
      success: true,
      token,
      expiresAt,
      message: 'Admin access granted'
    };
  } catch (error) {
    console.error('[Admin Auth] Verify code error:', error);
    return {
      success: false,
      message: 'Verification failed'
    };
  }
}

/**
 * Generate admin JWT token
 */
function generateAdminToken(email: string): string {
  // In production, use proper JWT signing
  // For now, create a simple token
  const payload = {
    email,
    role: 'admin',
    plan: 'enterprise',
    seats: 999999, // Maximum seats
    issuedAt: Date.now(),
    expiresAt: Date.now() + 24 * 60 * 60 * 1000
  };

  // Base64 encode (in production, use proper JWT library)
  return btoa(JSON.stringify(payload));
}

/**
 * Verify admin token
 */
export function verifyAdminToken(token: string): {
  valid: boolean;
  email?: string;
  role?: string;
  plan?: string;
} {
  try {
    const payload = JSON.parse(atob(token));

    // Check expiration
    if (Date.now() > payload.expiresAt) {
      return { valid: false };
    }

    // Check if admin email
    if (payload.email !== ADMIN_EMAIL) {
      return { valid: false };
    }

    return {
      valid: true,
      email: payload.email,
      role: payload.role,
      plan: payload.plan
    };
  } catch (error) {
    return { valid: false };
  }
}

/**
 * Clean up expired verification codes
 */
function cleanupExpiredCodes(): void {
  const now = Date.now();
  for (const [email, data] of verificationCodes.entries()) {
    if (now > data.expiresAt) {
      verificationCodes.delete(email);
    }
  }
}

/**
 * Get admin info from token
 */
export function getAdminInfo(token: string): {
  email: string;
  role: string;
  plan: string;
  seats: number;
} | null {
  const verification = verifyAdminToken(token);
  
  if (!verification.valid) {
    return null;
  }

  try {
    const payload = JSON.parse(atob(token));
    return {
      email: payload.email,
      role: payload.role,
      plan: payload.plan,
      seats: payload.seats
    };
  } catch (error) {
    return null;
  }
}
