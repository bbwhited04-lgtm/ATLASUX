import { createHashRouter } from "react-router";
import { Dashboard } from "./components/Dashboard";
import { JobRunner } from "./components/JobRunner";
import { ChatInterface } from "./components/ChatInterface";
import { SocialMonitoring } from "./components/SocialMonitoring";
import { FileManagement } from "./components/FileManagement";
import { Integrations } from "./components/Integrations";
import { CRM } from "./components/CRM";
import { Analytics } from "./components/Analytics";
import { TaskAutomation } from "./components/TaskAutomation";
import { Settings } from "./components/Settings";
import { PremiumFeatures } from "./components/PremiumFeatures";
import { BusinessAssets } from "./components/BusinessAssets";
import { ProcessingSettings } from "./components/ProcessingSettings";
import { SubscriptionManager } from "./components/SubscriptionManager";
import { RootLayout } from "./components/RootLayout";
import MobilePage from "./routes/mobile";

export const router = createHashRouter([
  {
    path: "/",
    Component: RootLayout,
    children: [
      { index: true, Component: Dashboard },
      { path: "jobs", Component: JobRunner },
      { path: "chat", Component: ChatInterface },
      { path: "monitoring", Component: SocialMonitoring },
      { path: "files", Component: FileManagement },
      { path: "integrations", Component: Integrations },
      { path: "crm", Component: CRM },
      { path: "analytics", Component: Analytics },
      { path: "automation", Component: TaskAutomation },
      { path: "settings", Component: Settings },
      { path: "premium", Component: PremiumFeatures },
      { path: "business-assets", Component: BusinessAssets },
      { path: "processing-settings", Component: ProcessingSettings },
      { path: "subscription", Component: SubscriptionManager },
    ],
  },
  {
    path: "/mobile",
    Component: MobilePage,
  },
]);