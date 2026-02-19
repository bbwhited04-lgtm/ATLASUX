import React from "react";
import { createHashRouter, Navigate } from "react-router-dom";
import Landing from "./pages/Landing";
import { Dashboard } from "./components/Dashboard";
import { JobRunner } from "./components/JobRunner";
import { ChatInterface } from "./components/ChatInterface";
import { SocialMonitoring } from "./components/SocialMonitoring";
import CRM from "./components/CRM";
import AppGate from "./components/AppGate";
import { Analytics } from "./components/Analytics";
import { TaskAutomation } from "./components/TaskAutomation";
import { Settings } from "./components/Settings";
import { BusinessManager } from "./components/business-manager";
import { RootLayout } from "./components/RootLayout";
import { HelpPage } from "./components/HelpPage";
import { AgentsHub } from "./components/AgentsHub";
import { ToolsHub } from "./components/ToolsHub";
import { WorkflowsHub } from "./components/WorkflowsHub";
import { AgentDeploymentHub } from "./components/AgentDeploymentHub";
import { AppsHub } from "./components/AppsHub";
import MobilePage from "./routes/mobile";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import AcceptableUse from "./pages/AcceptableUse";
import Payment from "./pages/Payment";
import Store from "./pages/Store";

export const router = createHashRouter([
  // Landing at "#/"
  { path: "/", Component: Landing },

  // Public pages
  { path: "/privacy", Component: Privacy },
  { path: "/terms", Component: Terms },
  { path: "/acceptable-use", Component: AcceptableUse },
  { path: "/payment", Component: Payment },
  { path: "/store", Component: Store },

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
      { path: "jobs", Component: JobRunner },
      { path: "chat", Component: ChatInterface },
      { path: "agents", Component: AgentsHub },
      { path: "tools", Component: () => React.createElement(Navigate, { to: "/app/agents?view=tools", replace: true }) },
      { path: "workflows", Component: () => React.createElement(Navigate, { to: "/app/agents?view=workflows", replace: true }) },
      { path: "deployment", Component: () => React.createElement(Navigate, { to: "/app/agents?view=deployment", replace: true }) },
      { path: "apps", Component: AppsHub },
      { path: "monitoring", Component: SocialMonitoring },
      { path: "crm", Component: CRM },
      { path: "analytics", Component: Analytics },
      { path: "automation", Component: () => React.createElement(Navigate, { to: "/app/agents?view=automation", replace: true }) },
      { path: "business-manager", Component: BusinessManager },
      { path: "settings", Component: Settings },
      { path: "help", Component: HelpPage },
      ],
  },

  { path: "/mobile", Component: MobilePage },
]);
