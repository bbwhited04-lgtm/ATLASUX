import * as React from "react";
import Integrations from "./Integrations";

// Thin wrapper so routing/nav stays clean.
export function AppsHub() {
  return (
    <div className="p-6">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold text-white">Apps</h1>
        <p className="text-sm text-slate-400">Connect external applications for agent-capable operations.</p>
      </div>
      <Integrations />
    </div>
  );
}
