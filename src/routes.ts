import React, { lazy, Suspense } from "react";
import { createHashRouter, Navigate, useParams } from "react-router-dom";
import Landing from "./pages/Landing";
import PublicLayout from "./components/public/PublicLayout";
import { Dashboard } from "./components/Dashboard";
import AppGate from "./components/AppGate";
import { RootLayout } from "./components/RootLayout";
import MobilePage from "./routes/mobile";

/**
 * Lazy import with auto-reload on chunk load failure.
 * After a Vercel deploy, old chunk hashes are gone — this catches the
 * import error and does a single hard reload so the browser fetches
 * the new index.html with updated chunk references.
 */
function lazyRetry(factory: () => Promise<any>) {
  return lazy(() =>
    factory().catch((err) => {
      console.error("[lazyRetry] chunk import failed:", err);
      const key = "chunk_reload";
      const last = sessionStorage.getItem(key);
      // Only reload once per session to prevent infinite loops
      if (!last || Date.now() - Number(last) > 10_000) {
        sessionStorage.setItem(key, String(Date.now()));
        window.location.reload();
      }
      // Return a minimal component so React doesn't crash while reloading
      return { default: () => React.createElement("div", {
        className: "flex items-center justify-center h-full min-h-[200px] text-slate-500 text-sm",
      }, "Load failed: " + (err?.message || "unknown error") + " — try hard refresh") };
    })
  );
}

// Lazy-loaded app pages — only fetched when the user navigates to them
const JobRunner = lazyRetry(() => import("./components/JobRunner").then(m => ({ default: m.JobRunner })));
const ChatInterface = lazyRetry(() => import("./components/ChatInterface").then(m => ({ default: m.ChatInterface })));
const SocialMonitoring = lazyRetry(() => import("./components/SocialMonitoring").then(m => ({ default: m.SocialMonitoring })));
const CRM = lazyRetry(() => import("./components/CRM"));
const Settings = lazyRetry(() => import("./components/Settings").then(m => ({ default: m.Settings })));
const BusinessManager = lazyRetry(() => import("./components/business-manager").then(m => ({ default: m.BusinessManager })));
const HelpPage = lazyRetry(() => import("./components/HelpPage").then(m => ({ default: m.HelpPage })));
const AgentsHub = lazyRetry(() => import("./components/AgentsHub").then(m => ({ default: m.AgentsHub })));
const KnowledgeBaseHub = lazyRetry(() => import("./components/KnowledgeBaseHub").then(m => ({ default: m.KnowledgeBaseHub })));
const MessagingHub = lazyRetry(() => import("./components/MessagingHub").then(m => ({ default: m.MessagingHub })));
const AgentWatcher = lazyRetry(() => import("./components/AgentWatcher").then(m => ({ default: m.AgentWatcher })));

// Lazy-loaded public pages
const Privacy = lazyRetry(() => import("./pages/Privacy"));
const Terms = lazyRetry(() => import("./pages/Terms"));
const AcceptableUse = lazyRetry(() => import("./pages/AcceptableUse"));
const Payment = lazyRetry(() => import("./pages/Payment"));
const Store = lazyRetry(() => import("./pages/Store"));
const Product = lazyRetry(() => import("./pages/Product"));
const BlogHome = lazyRetry(() => import("./pages/blog/BlogHome"));
const BlogPost = lazyRetry(() => import("./pages/blog/BlogPost"));
const BlogCategory = lazyRetry(() => import("./pages/blog/BlogCategory"));
const About = lazyRetry(() => import("./pages/About"));

/** Minimal loading spinner shown while lazy chunks load */
function LazyFallback() {
  return React.createElement("div", {
    className: "flex items-center justify-center h-full min-h-[200px] text-slate-500 text-sm",
  }, "Loading…");
}

/** Wrap a lazy component in Suspense */
function S(props: { children: React.ReactNode }) {
  return React.createElement(Suspense, { fallback: React.createElement(LazyFallback) }, props.children);
}

export const router = createHashRouter([
  // Public pages wrapped in PublicLayout (shared footer)
  {
    Component: PublicLayout,
    children: [
      { path: "/", Component: Landing },
      { path: "/about", Component: () => React.createElement(S, null, React.createElement(About)) },
      { path: "/privacy", Component: () => React.createElement(S, null, React.createElement(Privacy)) },
      { path: "/terms", Component: () => React.createElement(S, null, React.createElement(Terms)) },
      { path: "/acceptable-use", Component: () => React.createElement(S, null, React.createElement(AcceptableUse)) },
      { path: "/payment", Component: () => React.createElement(S, null, React.createElement(Payment)) },
      { path: "/store", Component: () => React.createElement(S, null, React.createElement(Store)) },
      { path: "/product", Component: () => React.createElement(S, null, React.createElement(Product)) },
      { path: "/blog", Component: () => React.createElement(S, null, React.createElement(BlogHome)) },
      { path: "/blog/category/:category", Component: () => React.createElement(S, null, React.createElement(BlogCategory)) },
      { path: "/blog/:slug", Component: () => React.createElement(S, null, React.createElement(BlogPost)) },
    ],
  },

  // App at "#/app"
  {
    path: "/app",
    Component: () =>
      React.createElement(
        AppGate,
        null,
        React.createElement(RootLayout, null)
      ),
    children: [
      { index: true, Component: Dashboard },
      { path: "jobs", Component: () => React.createElement(S, null, React.createElement(JobRunner)) },
      { path: "chat", Component: () => React.createElement(S, null, React.createElement(ChatInterface)) },
      { path: "agents", Component: () => React.createElement(S, null, React.createElement(AgentsHub)) },
      { path: "tools", Component: () => React.createElement(Navigate, { to: "/app/agents?view=tools", replace: true }) },
      { path: "workflows", Component: () => React.createElement(Navigate, { to: "/app/agents?view=workflows", replace: true }) },
      { path: "deployment", Component: () => React.createElement(Navigate, { to: "/app/agents?view=deployment", replace: true }) },
      { path: "apps", Component: () => React.createElement(Navigate, { to: "/app/settings", replace: true }) },
      { path: "monitoring", Component: () => React.createElement(S, null, React.createElement(SocialMonitoring)) },
      { path: "crm", Component: () => React.createElement(S, null, React.createElement(CRM)) },
      { path: "analytics", Component: () => React.createElement(Navigate, { to: "/app/business-manager?tab=intelligence", replace: true }) },
      { path: "automation", Component: () => React.createElement(Navigate, { to: "/app/agents?view=automation", replace: true }) },
      { path: "business-manager", Component: () => React.createElement(S, null, React.createElement(BusinessManager)) },
      { path: "kb", Component: () => React.createElement(S, null, React.createElement(KnowledgeBaseHub)) },
      { path: "blog", Component: () => React.createElement(Navigate, { to: "/app/business-manager?tab=blog", replace: true }) },
      { path: "blog/:slug", Component: () => {
        const { slug } = useParams();
        return React.createElement(Navigate, { to: `/blog/${slug ?? ""}`, replace: true });
      }},
      { path: "settings", Component: () => React.createElement(S, null, React.createElement(Settings)) },
      { path: "help", Component: () => React.createElement(S, null, React.createElement(HelpPage)) },
      { path: "decisions", Component: () => React.createElement(Navigate, { to: "/app/business-manager?tab=decisions", replace: true }) },
      { path: "messaging", Component: () => React.createElement(S, null, React.createElement(MessagingHub)) },
      { path: "tickets", Component: () => React.createElement(Navigate, { to: "/app/business-manager?tab=tickets", replace: true }) },
      { path: "budgets", Component: () => React.createElement(Navigate, { to: "/app/business-manager?tab=budgets", replace: true }) },
      { path: "watcher", Component: () => React.createElement(S, null, React.createElement(AgentWatcher)) },
      ],
  },

  { path: "/mobile", Component: MobilePage },
]);
