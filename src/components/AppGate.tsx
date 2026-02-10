import { useMemo, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
console.log("GATE CODE:", import.meta.env.VITE_APP_GATE_CODE);

const SESSION_KEY = "atlasux_gate_ok";

function normalize(s: string) {
  return s.trim();
}

export function isGateOpen() {
  return sessionStorage.getItem(SESSION_KEY) === "1";
}

export default function AppGate({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const expected = useMemo(
    () => normalize(import.meta.env.VITE_APP_GATE_CODE ?? ""),
    []
  );

  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  // If no code configured, fail closed (safer)
  if (!expected) {
    return (
      <div className="p-6">
        <Card className="max-w-md border-cyan-500/20">
          <CardHeader>
            <CardTitle>Private Beta</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Access is currently restricted.
          </CardContent>
        </Card>
      </div>
    );
  }

  // Already authorized this session → continue
  if (isGateOpen()) return <>{children}</>;

  const onSubmit = () => {
    if (normalize(code) === expected) {
      sessionStorage.setItem(SESSION_KEY, "1");
      setError(null);
      // stay on same route; now children will render
      return;
    }
    setError("Invalid access code.");
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <Card className="w-full max-w-md border-cyan-500/20">
        <CardHeader>
          <CardTitle>Private Beta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Enter your access code to continue.
          </p>

          <Input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Access code"
            type="password"
            autoComplete="off"
            onKeyDown={(e) => {
              if (e.key === "Enter") onSubmit();
            }}
          />

          {error && <div className="text-sm text-red-500">{error}</div>}

          <div className="flex gap-2">
            <Button className="bg-cyan-500 hover:bg-cyan-400" onClick={onSubmit}>
              Continue
            </Button>
            <Button variant="outline" onClick={() => (window.location.hash = "#/")}>
              Back
            </Button>
          </div>

          <div className="text-xs text-muted-foreground">
            You’ll only need this code once per session.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
