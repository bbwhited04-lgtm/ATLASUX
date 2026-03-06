import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { API_BASE } from "@/lib/api";
import { supabase, supabaseSignIn, supabaseSignUp, getSupabaseToken } from "@/lib/supabase";
import { useActiveTenant } from "@/lib/activeTenant";

const SESSION_KEY = "atlasux_gate_ok";
const SEAT_KEY    = "atlasux_seat_info";

function normalize(s: string) {
  return (s ?? "").trim();
}

function isGateOpen() {
  try {
    return sessionStorage.getItem(SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

/** Validate code against backend cloud seats DB (revocable). */
async function validateRemote(code: string): Promise<{
  valid: boolean;
  seat?: { id?: string; label: string; role: string };
  error?: string;
}> {
  try {
    const res = await fetch(`${API_BASE}/v1/gate/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    return await res.json();
  } catch {
    // Backend unreachable — can't validate cloud seats
    return { valid: false, error: "backend_unreachable" };
  }
}

/** Provision tenant after Supabase login */
async function provisionTenant(token: string): Promise<{
  ok: boolean;
  tenantId?: string;
  seatType?: string;
  role?: string;
  error?: string;
}> {
  try {
    const res = await fetch(`${API_BASE}/v1/auth/provision`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    return await res.json();
  } catch {
    return { ok: false, error: "backend_unreachable" };
  }
}

type Tab = "code" | "signin";

export default function AppGate({ children }: { children: React.ReactNode }) {
  const { setTenantId } = useActiveTenant();

  // Gate is enabled when the env var is set (value is validated server-side only)
  const gateEnabled = useMemo(() => {
    return normalize(import.meta.env.VITE_APP_GATE_CODE ?? "").length > 0;
  }, []);

  const [authed, setAuthed] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);

  // Access code tab state
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [lockedUntil, setLockedUntil] = useState<number>(0);
  const [fails, setFails] = useState(0);

  // Sign in tab state
  const [tab, setTab] = useState<Tab>("code");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [signUpDone, setSignUpDone] = useState(false);

  const grantAccess = (seatInfo?: { label: string; role: string }) => {
    try {
      sessionStorage.setItem(SESSION_KEY, "1");
      if (seatInfo) sessionStorage.setItem(SEAT_KEY, JSON.stringify(seatInfo));
    } catch {
      // ignore storage failures; authed state still lets user in
    }
    setError(null);
    setAuthError(null);
    setAuthed(true);
  };

  // Auto-check for existing Supabase session on load
  useEffect(() => {
    if (authed || isGateOpen()) {
      setSessionChecked(true);
      return;
    }
    let cancelled = false;

    (async () => {
      const token = getSupabaseToken();
      if (!token) {
        setSessionChecked(true);
        return;
      }
      try {
        const { data } = await supabase.auth.getUser(token);
        if (cancelled) return;
        if (data?.user) {
          const prov = await provisionTenant(token);
          if (cancelled) return;
          if (prov.ok && prov.tenantId) {
            setTenantId(prov.tenantId);
          }
          grantAccess({ label: prov.seatType ?? "free_beta", role: prov.role ?? "owner" });
          return;
        }
      } catch {
        // token invalid or expired, fall through to gate
      }
      if (!cancelled) setSessionChecked(true);
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fail closed if not configured
  if (!gateEnabled) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6">
        <Card className="w-full max-w-md border-cyan-500/20">
          <CardHeader>
            <CardTitle>Private Beta</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Access is currently limited.
          </CardContent>
        </Card>
      </div>
    );
  }

  // Allow through once authorized (session + immediate state)
  if (authed || isGateOpen()) return <>{children}</>;

  // Still checking for existing session — show nothing to avoid flash
  if (!sessionChecked) return null;

  const now = Date.now();
  const isLocked = now < lockedUntil;

  const onSubmitCode = async () => {
    if (isLocked || checking) return;

    const trimmed = normalize(code);

    // All code validation is done server-side
    setChecking(true);
    const result = await validateRemote(trimmed);
    setChecking(false);

    if (result.valid && result.seat) {
      grantAccess(result.seat);
      return;
    }

    // Failure
    const nextFails = fails + 1;
    setFails(nextFails);

    if (result.error === "backend_unreachable") {
      setError("Cannot reach server. Please try again.");
    } else if (result.error === "seat_revoked") {
      setError("This access code has been revoked.");
    } else {
      setError("Invalid access code.");
    }

    if (nextFails >= 5) {
      setLockedUntil(Date.now() + 30_000);
      setFails(0);
    }
  };

  const onSubmitAuth = async () => {
    if (authLoading) return;
    setAuthError(null);
    setAuthLoading(true);

    try {
      if (isSignUp) {
        await supabaseSignUp(email, password);
        setSignUpDone(true);
        setAuthLoading(false);
        return;
      }

      const { session } = await supabaseSignIn(email, password);
      if (!session?.access_token) {
        setAuthError("Login succeeded but no session was returned.");
        setAuthLoading(false);
        return;
      }

      // Provision tenant
      const prov = await provisionTenant(session.access_token);
      if (prov.ok && prov.tenantId) {
        setTenantId(prov.tenantId);
      }
      grantAccess({ label: prov.seatType ?? "free_beta", role: prov.role ?? "owner" });
    } catch (err: any) {
      setAuthError(err?.message ?? "Authentication failed.");
    }
    setAuthLoading(false);
  };

  const tabClass = (t: Tab) =>
    `flex-1 py-2 text-sm font-medium rounded-t-lg transition-colors ${
      tab === t
        ? "text-cyan-400 border-b-2 border-cyan-400"
        : "text-slate-400 hover:text-slate-300"
    }`;

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <Card className="w-full max-w-md border-cyan-500/20">
        <CardHeader>
          <CardTitle>Private Beta</CardTitle>
          {/* Tab bar */}
          <div className="flex mt-2 border-b border-slate-700">
            <button className={tabClass("code")} onClick={() => setTab("code")}>
              Access Code
            </button>
            <button className={tabClass("signin")} onClick={() => setTab("signin")}>
              Sign In
            </button>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {tab === "code" && (
            <>
              <p className="text-sm text-muted-foreground">
                Enter your access code to continue.
              </p>

              <Input
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Access code"
                type="password"
                autoComplete="off"
                disabled={isLocked || checking}
                onKeyDown={(e) => {
                  if (e.key === "Enter") onSubmitCode();
                }}
              />

              {error && <div className="text-sm text-red-500">{error}</div>}

              {isLocked && (
                <div className="text-xs text-muted-foreground">
                  Too many attempts. Try again in{" "}
                  {Math.ceil((lockedUntil - now) / 1000)}s.
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  className="bg-cyan-500 hover:bg-cyan-400"
                  onClick={onSubmitCode}
                  disabled={isLocked || checking}
                >
                  {checking ? "Checking..." : "Continue"}
                </Button>

                <Button
                  variant="outline"
                  onClick={() => {
                    window.location.hash = "#/";
                  }}
                >
                  Back
                </Button>
              </div>

              <div className="text-xs text-muted-foreground">
                Access is stored for this session.
              </div>
            </>
          )}

          {tab === "signin" && (
            <>
              {signUpDone ? (
                <div className="space-y-3">
                  <div className="text-sm text-emerald-400">
                    Check your email for a confirmation link, then come back and sign in.
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSignUpDone(false);
                      setIsSignUp(false);
                    }}
                  >
                    Back to Sign In
                  </Button>
                </div>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">
                    {isSignUp
                      ? "Create an account to get started."
                      : "Sign in with your email and password."}
                  </p>

                  <Input
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (authError) setAuthError(null);
                    }}
                    placeholder="Email"
                    type="email"
                    autoComplete="email"
                    disabled={authLoading}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") onSubmitAuth();
                    }}
                  />

                  <Input
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (authError) setAuthError(null);
                    }}
                    placeholder="Password"
                    type="password"
                    autoComplete={isSignUp ? "new-password" : "current-password"}
                    disabled={authLoading}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") onSubmitAuth();
                    }}
                  />

                  {authError && <div className="text-sm text-red-500">{authError}</div>}

                  <div className="flex gap-2">
                    <Button
                      className="bg-cyan-500 hover:bg-cyan-400"
                      onClick={onSubmitAuth}
                      disabled={authLoading}
                    >
                      {authLoading
                        ? "Please wait..."
                        : isSignUp
                          ? "Sign Up"
                          : "Sign In"}
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => {
                        window.location.hash = "#/";
                      }}
                    >
                      Back
                    </Button>
                  </div>

                  <button
                    className="text-xs text-cyan-400 hover:text-cyan-300 underline"
                    onClick={() => {
                      setIsSignUp(!isSignUp);
                      setAuthError(null);
                    }}
                  >
                    {isSignUp
                      ? "Already have an account? Sign in"
                      : "Don't have an account? Sign up"}
                  </button>
                </>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
