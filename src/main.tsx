
import React, { Component, ReactNode } from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { router } from "./routes";
import "./index.css";
import { ActiveTenantProvider } from "./lib/activeTenant";
import FloatingAtlas from "./components/FloatingAtlas";
import "./styles/globals.css";

/** Global error boundary — prevents blank screen when a component crashes */
class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state: { error: Error | null } = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{ position: "fixed", inset: 0, background: "#020617", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontFamily: "system-ui, sans-serif" }}>
          <div style={{ textAlign: "center", maxWidth: 420, padding: "0 24px" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>&#9888;</div>
            <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>Something went wrong</h1>
            <p style={{ color: "#94a3b8", fontSize: 14, marginBottom: 24, wordBreak: "break-word" }}>{this.state.error.message}</p>
            <button
              onClick={() => { this.setState({ error: null }); window.location.reload(); }}
              style={{ padding: "10px 24px", background: "#0891b2", border: "none", borderRadius: 8, color: "white", fontSize: 14, fontWeight: 500, cursor: "pointer" }}
            >
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

document.documentElement.classList.add("dark");

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <HelmetProvider>
      <ErrorBoundary>
        <ActiveTenantProvider>
          <RouterProvider router={router} />
          <FloatingAtlas />
        </ActiveTenantProvider>
      </ErrorBoundary>
    </HelmetProvider>
  </React.StrictMode>
);
