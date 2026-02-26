import React, { lazy, Suspense } from "react";
import { createHashRouter, Navigate, useParams } from "react-router-dom";
import Landing from "./pages/Landing";
import { Dashboard } from "./components/Dashboard";
import AppGate from "./components/AppGate";
import { RootLayout } from "./components/RootLayout";
import MobilePage from "./routes/mobile";

// Lazy-loaded app pages — only fetched when the user navigates to them
const JobRunner = lazy(() => import("./components/JobRunner").then(m => ({ default: m.JobRunner })));
const ChatInterface = lazy(() => import("./components/ChatInterface").then(m => ({ default: m.ChatInterface })));
const SocialMonitoring = lazy(() => import("./components/SocialMonitoring").then(m => ({ default: m.SocialMonitoring })));
const CRM = lazy(() => import("./components/CRM"));
const Settings = lazy(() => import("./components/Settings").then(m => ({ default: m.Settings })));
const BusinessManager = lazy(() => import("./components/business-manager").then(m => ({ default: m.BusinessManager })));
const HelpPage = lazy(() => import("./components/HelpPage").then(m => ({ default: m.HelpPage })));
const AgentsHub = lazy(() => import("./components/AgentsHub").then(m => ({ default: m.AgentsHub })));
const KnowledgeBaseHub = lazy(() => import("./components/KnowledgeBaseHub").then(m => ({ default: m.KnowledgeBaseHub })));
const MessagingHub = lazy(() => import("./components/MessagingHub").then(m => ({ default: m.MessagingHub })));
const AgentWatcher = lazy(() => import("./components/AgentWatcher").then(m => ({ default: m.AgentWatcher })));

// Lazy-loaded public pages
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const AcceptableUse = lazy(() => import("./pages/AcceptableUse"));
const Payment = lazy(() => import("./pages/Payment"));
const Store = lazy(() => import("./pages/Store"));
const Product = lazy(() => import("./pages/Product"));
const BlogHome = lazy(() => import("./pages/blog/BlogHome"));
const BlogPost = lazy(() => import("./pages/blog/BlogPost"));
const BlogCategory = lazy(() => import("./pages/blog/BlogCategory"));
const About = lazy(() => import("./pages/About"));

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
  // Landing at "#/"
  { path: "/", Component: Landing },

  // Public pages (lazy-loaded)
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
