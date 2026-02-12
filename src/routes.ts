import React from "react";
import { createHashRouter } from "react-router";
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
import MobilePage from "./routes/mobile";

export const router = createHashRouter([
  // Landing at "#/"
  { path: "/", Component: Landing },

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
      { path: "monitoring", Component: SocialMonitoring },
      { path: "crm", Component: CRM },
      { path: "analytics", Component: Analytics },
      { path: "automation", Component: TaskAutomation },
      { path: "business-manager", Component: BusinessManager },
      { path: "settings", Component: Settings },
      { path: "help", Component: HelpPage },
      { path: "/", Component: Landing },
      { path: "/privacy", Component: Privacy },
      { path: "/terms", Component: Terms },
      { path: "/acceptable-use", Component: AcceptableUse },
      { path: "/payment", Component: Payment },
      { path: "/store", Component: Store },

    ],
  },

  { path: "/mobile", Component: MobilePage },
]);
