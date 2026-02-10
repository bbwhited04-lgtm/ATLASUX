import React from "react";
import { createHashRouter } from "react-router";
import Landing from "./pages/Landing";
import { Dashboard } from "./components/Dashboard";
import { JobRunner } from "./components/JobRunner";
import { ChatInterface } from "./components/ChatInterface";
import { SocialMonitoring } from "./components/SocialMonitoring";
import { FileManagement } from "./components/FileManagement";
import Integrations from "./components/Integrations";
import CRM from "./components/CRM";
import AppGate from "./components/AppGate";
import { Analytics } from "./components/Analytics";
import { TaskAutomation } from "./components/TaskAutomation";
import { Settings } from "./components/Settings";
import { PremiumFeatures } from "./components/PremiumFeatures";
import { BusinessAssets } from "./components/BusinessAssets";
import { ProcessingSettings } from "./components/ProcessingSettings";
import { SubscriptionManager } from "./components/SubscriptionManager";
import { RootLayout } from "./components/RootLayout";
import { VideoConferencing } from "./components/premium/VideoConferencing";
import { HelpSection } from "./components/HelpSection";
import MobilePage from "./routes/mobile";
import { HelpPage } from "./components/HelpPage";

export const router = createHashRouter([
  // Landing at "#/"
  { path: "/", Component: Landing },

  // App at "#/app"
  {
    path: "/app",
    Component: () => (
      React.createElement(
        AppGate,
         null, 
         React.createElement(RootLayout, null)
        ),
    ),
    children: [
      { index: true, Component: Dashboard },
      { path: "jobs", Component: JobRunner },
      { path: "chat", Component: ChatInterface },
      { path: "monitoring", Component: SocialMonitoring },
      { path: "files", Component: FileManagement },
      { path: "integrations", Component: Integrations },
      // Optional wizard routes (reserved for provider callbacks / stepper UI)
      { path: "integrations/connect/:provider", Component: Integrations },
      { path: "integrations/callback/:provider", Component: Integrations },
      { path: "crm", Component: CRM },
      { path: "analytics", Component: Analytics },
      { path: "automation", Component: TaskAutomation },
      { path: "settings", Component: Settings },
      { path: "premium", Component: PremiumFeatures },
      { path: "business-assets", Component: BusinessAssets },
      { path: "processing-settings", Component: ProcessingSettings },
      { path: "subscription", Component: SubscriptionManager },
      { path: "video-conferencing", Component: VideoConferencing },
      { path: "help", Component: HelpPage },
    ],
  },

  { path: "/mobile", Component: MobilePage },
]);
