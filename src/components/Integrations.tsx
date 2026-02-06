import { useEffect, useState } from "react";
import { getConnection, setConnection } from "../utils/connections";
import {
  Plug,
  Check,
  Plus,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Youtube,
  MessageSquare,
  Users,
  Cloud,
  Palette,
  DollarSign,
  BarChart3,
  Mail,
  Package,
  Globe,
  Code,
  Settings,
  X,
  ChevronRight,
  Shield,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Eye,
  EyeOff,
  Smartphone,
  Server,
  Loader2,
  HelpCircle,
  Key,
  Lock,
  Upload,
  Download,
  ChevronDown,
  ChevronUp,
  Info,
  Brain,
  ShoppingBag,
  ShoppingCart,
  Database,
  Zap,
  Box,
  Briefcase,
} from "lucide-react";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { Input } from "./ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import { HelpSection, IntegrationsHelp } from "./HelpSection";


const API_BASE = (import.meta as any).env?.VITE_API_URL || "http://localhost:8787";

function mapIntegrationToProvider(id: string): "google" | "meta" | null {
  const k = id.toLowerCase();
  // Google family
  if (k.includes("google") || k.includes("gmail") || k.includes("drive") || k.includes("calendar") || k.includes("youtube") || k.includes("ga4") || k.includes("analytics")) return "google";
  // Meta family (Facebook/Instagram)
  if (k.startsWith("facebook") || k.includes("facebook") || k.includes("instagram") || k.includes("meta")) return "meta";
  return null;
}

function beginOAuth(provider: "google" | "meta") {
  const org_id = "local-org";
  const user_id = "local-user";
  const url = `${API_BASE}/v1/oauth/${provider}/start?org_id=${encodeURIComponent(org_id)}&user_id=${encodeURIComponent(user_id)}`;
  // In Tauri this opens the system browser; in web dev it opens a new tab.
  window.open(url, "_blank", "noopener,noreferrer");
}

interface MockAccount {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
}

interface Integration {
  id: string;
  connectedAs?: string;
  name: string;
  category: "social" | "ai-platforms" | "business" | "storage" | "productivity" | "design" | "web";
  icon: any;
  color: string;
  description: string;
  connected: boolean;
  features: string[];
  requiresOAuth?: boolean;
  accounts?: MockAccount[];
}

const initialIntegrations: Integration[] = [
  // Social Media Platforms
  { 
    id: "facebook-pages", 
    name: "Facebook Pages", 
    category: "social", 
    icon: Facebook, 
    color: "blue",
    description: "Manage Facebook business pages",
    connected: false,
    requiresOAuth: true,
    features: ["Post Management", "Analytics", "Messaging", "Ads"],
  },
  { 
    id: "facebook-groups", 
    name: "Facebook Groups", 
    category: "social", 
    icon: Users, 
    color: "indigo",
    description: "Access and manage Facebook groups",
    connected: false,
    requiresOAuth: true,
    features: ["Group Posts", "Member Management", "Engagement Tracking"]
  },
  { 
    id: "instagram", 
    name: "Instagram", 
    category: "social", 
    icon: Instagram, 
    color: "pink",
    description: "Instagram business account integration",
    connected: false,
    requiresOAuth: true,
    features: ["Post Scheduling", "Stories", "Reels", "Insights", "DMs"],
  },
  { 
    id: "twitter", 
    name: "X (Twitter)", 
    category: "social", 
    icon: Twitter, 
    color: "slate",
    description: "Connect and manage X (Twitter) accounts",
    connected: false,
    requiresOAuth: true,
    features: ["Post Scheduling", "Thread Creation", "Analytics", "Monitoring"],
  },
  { 
    id: "linkedin", 
    name: "LinkedIn", 
    category: "social", 
    icon: Linkedin, 
    color: "blue",
    description: "LinkedIn company page and profile integration",
    connected: false,
    requiresOAuth: true,
    features: ["Company Posts", "Networking", "Analytics", "Lead Gen"]
  },
  { 
    id: "youtube", 
    name: "YouTube", 
    category: "social", 
    icon: Youtube, 
    color: "red",
    description: "Connect YouTube channels for video management",
    connected: false,
    requiresOAuth: true,
    features: ["Video Upload", "Analytics", "Comment Management", "Scheduling"]
  },
  { 
    id: "tiktok", 
    name: "TikTok", 
    category: "social", 
    icon: MessageSquare, 
    color: "slate",
    description: "TikTok business account integration",
    connected: false,
    requiresOAuth: true,
    features: ["Video Publishing", "Analytics", "Trends", "Engagement"]
  },
  { 
    id: "pinterest", 
    name: "Pinterest", 
    category: "social", 
    icon: Palette, 
    color: "red",
    description: "Manage Pinterest boards and pins",
    connected: false,
    requiresOAuth: true,
    features: ["Pin Scheduling", "Board Management", "Analytics"]
  },
  { 
    id: "reddit", 
    name: "Reddit", 
    category: "social", 
    icon: Users, 
    color: "orange",
    description: "Post and engage in subreddits",
    connected: false,
    requiresOAuth: true,
    features: ["Post Management", "Comment Replies", "Monitoring"]
  },

  // AI Platforms
  { 
    id: "openai", 
    name: "OpenAI", 
    category: "ai-platforms", 
    icon: Brain, 
    color: "emerald",
    description: "Use GPT models for text/image generation",
    connected: false,
    requiresOAuth: false,
    features: ["Text Generation", "Image Generation", "Embeddings", "Assistants"]
  },
  { 
    id: "anthropic", 
    name: "Anthropic", 
    category: "ai-platforms", 
    icon: Brain, 
    color: "amber",
    description: "Claude models for writing and analysis",
    connected: false,
    requiresOAuth: false,
    features: ["Chat", "Long Context", "Tool Use"]
  },
  { 
    id: "google-ai", 
    name: "Google AI", 
    category: "ai-platforms", 
    icon: Brain, 
    color: "blue",
    description: "Gemini + Google AI Studio APIs",
    connected: false,
    requiresOAuth: true,
    features: ["Text", "Multimodal", "Vision", "Safety Tools"]
  },
  { 
    id: "stability", 
    name: "Stability AI", 
    category: "ai-platforms", 
    icon: Palette, 
    color: "violet",
    description: "Stable Diffusion image generation",
    connected: false,
    requiresOAuth: false,
    features: ["Text-to-Image", "Image-to-Image", "Upscale"]
  },

  // CRM & Business
  { 
    id: "salesforce", 
    name: "Salesforce", 
    category: "business", 
    icon: Briefcase, 
    color: "blue",
    description: "CRM, leads, accounts, and opportunities",
    connected: false,
    requiresOAuth: true,
    features: ["Leads", "Opportunities", "Contacts", "Automations"]
  },
  { 
    id: "hubspot", 
    name: "HubSpot", 
    category: "business", 
    icon: Briefcase, 
    color: "orange",
    description: "Marketing + CRM platform integration",
    connected: false,
    requiresOAuth: true,
    features: ["CRM Sync", "Email", "Pipelines", "Workflows"]
  },
  { 
    id: "stripe", 
    name: "Stripe", 
    category: "business", 
    icon: DollarSign, 
    color: "violet",
    description: "Payments and subscriptions",
    connected: false,
    requiresOAuth: false,
    features: ["Payments", "Subscriptions", "Webhooks", "Invoices"]
  },
  { 
    id: "shopify", 
    name: "Shopify", 
    category: "business", 
    icon: ShoppingCart, 
    color: "green",
    description: "E-commerce store integration",
    connected: false,
    requiresOAuth: true,
    features: ["Orders", "Products", "Customers", "Abandoned Carts"]
  },
  { 
    id: "woocommerce", 
    name: "WooCommerce", 
    category: "business", 
    icon: ShoppingBag, 
    color: "purple",
    description: "WordPress e-commerce integration",
    connected: false,
    requiresOAuth: true,
    features: ["Orders", "Products", "Coupons", "Analytics"]
  },
  { 
    id: "quickbooks", 
    name: "QuickBooks", 
    category: "business", 
    icon: DollarSign, 
    color: "emerald",
    description: "Accounting and invoices integration",
    connected: false,
    requiresOAuth: true,
    features: ["Invoices", "Expenses", "Reporting"]
  },
  { 
    id: "mailchimp", 
    name: "Mailchimp", 
    category: "business", 
    icon: Mail, 
    color: "yellow",
    description: "Email marketing and audience sync",
    connected: false,
    requiresOAuth: true,
    features: ["Campaigns", "Lists", "Automation", "Analytics"]
  },
  { 
    id: "sendgrid", 
    name: "SendGrid", 
    category: "business", 
    icon: Mail, 
    color: "blue",
    description: "Transactional email + marketing email",
    connected: false,
    requiresOAuth: false,
    features: ["SMTP/API", "Templates", "Analytics", "Webhooks"]
  },
  { 
    id: "twilio", 
    name: "Twilio", 
    category: "business", 
    icon: Smartphone, 
    color: "red",
    description: "SMS/voice messaging integration",
    connected: false,
    requiresOAuth: false,
    features: ["SMS", "Voice", "Verify", "Studio"]
  },
  { 
    id: "zendesk", 
    name: "Zendesk", 
    category: "business", 
    icon: HelpCircle, 
    color: "slate",
    description: "Support tickets + customer helpdesk",
    connected: false,
    requiresOAuth: true,
    features: ["Tickets", "Macros", "SLAs", "Analytics"]
  },
  { 
    id: "intercom", 
    name: "Intercom", 
    category: "business", 
    icon: MessageSquare, 
    color: "blue",
    description: "Customer messaging + support",
    connected: false,
    requiresOAuth: true,
    features: ["Inbox", "Bots", "Automation", "Segmentation"]
  },
  { 
    id: "slack", 
    name: "Slack", 
    category: "business", 
    icon: MessageSquare, 
    color: "violet",
    description: "Team messaging and notifications",
    connected: false,
    requiresOAuth: true,
    features: ["Notifications", "Channel Posts", "Workflows"]
  },
  { 
    id: "discord", 
    name: "Discord", 
    category: "business", 
    icon: Users, 
    color: "indigo",
    description: "Community + server integration",
    connected: false,
    requiresOAuth: true,
    features: ["Webhooks", "Bots", "Announcements"]
  },
  { 
    id: "trello", 
    name: "Trello", 
    category: "business", 
    icon: Box, 
    color: "blue",
    description: "Boards, cards, automation",
    connected: false,
    requiresOAuth: true,
    features: ["Boards", "Cards", "Automation"]
  },
  { 
    id: "asana", 
    name: "Asana", 
    category: "business", 
    icon: Briefcase, 
    color: "pink",
    description: "Project management integration",
    connected: false,
    requiresOAuth: true,
    features: ["Tasks", "Projects", "Automation"]
  },
  { 
    id: "clickup", 
    name: "ClickUp", 
    category: "business", 
    icon: Briefcase, 
    color: "violet",
    description: "Tasks, docs, automations",
    connected: false,
    requiresOAuth: true,
    features: ["Tasks", "Docs", "Time Tracking", "Automation"]
  },
  { 
    id: "notion", 
    name: "Notion", 
    category: "business", 
    icon: Box, 
    color: "slate",
    description: "Docs, databases, and wikis",
    connected: false,
    requiresOAuth: true,
    features: ["Databases", "Pages", "Sync", "Automation"]
  },

  // Cloud Storage
  { 
    id: "google-drive", 
    name: "Google Drive", 
    category: "storage", 
    icon: Cloud, 
    color: "blue",
    description: "File storage and collaboration",
    connected: false,
    requiresOAuth: true,
    features: ["Upload", "Download", "Search", "Sharing"]
  },
  { 
    id: "dropbox", 
    name: "Dropbox", 
    category: "storage", 
    icon: Cloud, 
    color: "blue",
    description: "Cloud file storage integration",
    connected: false,
    requiresOAuth: true,
    features: ["Files", "Sharing", "Sync"]
  },
  { 
    id: "onedrive", 
    name: "OneDrive", 
    category: "storage", 
    icon: Cloud, 
    color: "blue",
    description: "Microsoft cloud storage integration",
    connected: false,
    requiresOAuth: true,
    features: ["Files", "Sharing", "Sync"]
  },
  { 
    id: "box", 
    name: "Box", 
    category: "storage", 
    icon: Box, 
    color: "blue",
    description: "Enterprise cloud content management",
    connected: false,
    requiresOAuth: true,
    features: ["Files", "Governance", "Sharing"]
  },
  { 
    id: "s3", 
    name: "Amazon S3", 
    category: "storage", 
    icon: Database, 
    color: "amber",
    description: "Object storage for media and files",
    connected: false,
    requiresOAuth: false,
    features: ["Buckets", "Uploads", "Signed URLs", "Lifecycle Rules"]
  },

  // Productivity
  { 
    id: "google-calendar", 
    name: "Google Calendar", 
    category: "productivity", 
    icon: BarChart3, 
    color: "blue",
    description: "Calendar events + scheduling",
    connected: false,
    requiresOAuth: true,
    features: ["Events", "Scheduling", "Reminders"]
  },
  { 
    id: "gmail", 
    name: "Gmail", 
    category: "productivity", 
    icon: Mail, 
    color: "red",
    description: "Email access and automation",
    connected: false,
    requiresOAuth: true,
    features: ["Read", "Send", "Labels", "Search"]
  },

  // Design
  { 
    id: "canva", 
    name: "Canva", 
    category: "design", 
    icon: Palette, 
    color: "cyan",
    description: "Design templates and brand kits",
    connected: false,
    requiresOAuth: true,
    features: ["Templates", "Brand Kits", "Exports"]
  },
  { 
    id: "figma", 
    name: "Figma", 
    category: "design", 
    icon: Palette, 
    color: "pink",
    description: "Design collaboration and assets",
    connected: false,
    requiresOAuth: true,
    features: ["Files", "Exports", "Comments", "Teams"]
  },

  // Web Platforms
  { 
    id: "wordpress", 
    name: "WordPress", 
    category: "web", 
    icon: Globe, 
    color: "slate",
    description: "Publish posts and manage content",
    connected: false,
    requiresOAuth: true,
    features: ["Posts", "Pages", "Media", "SEO"]
  },
  { 
    id: "webflow", 
    name: "Webflow", 
    category: "web", 
    icon: Code, 
    color: "blue",
    description: "Website builder and CMS integration",
    connected: false,
    requiresOAuth: true,
    features: ["CMS", "Publishing", "Forms", "Assets"]
  },
  { 
    id: "wix", 
    name: "Wix", 
    category: "web", 
    icon: Code, 
    color: "blue",
    description: "Website builder integration",
    connected: false,
    requiresOAuth: true,
    features: ["Publishing", "Forms", "SEO"]
  },
  { 
    id: "squarespace", 
    name: "Squarespace", 
    category: "web", 
    icon: Globe, 
    color: "slate",
    description: "Website publishing and commerce tools",
    connected: false,
    requiresOAuth: true,
    features: ["Publishing", "Commerce", "SEO", "Analytics"]
  },
  { 
    id: "weebly", 
    name: "Weebly", 
    category: "web", 
    icon: Globe, 
    color: "blue",
    description: "Website builder for small businesses",
    connected: false,
    requiresOAuth: true,
    features: ["Publishing", "Commerce", "SEO", "Templates"]
  },
  { 
    id: "godaddy", 
    name: "GoDaddy Websites", 
    category: "web", 
    icon: Globe, 
    color: "green",
    description: "GoDaddy website builder integration",
    connected: false,
    requiresOAuth: true,
    features: ["Publishing", "Domains", "SEO"]
  },
  { 
    id: "render", 
    name: "Render", 
    category: "web", 
    icon: Server, 
    color: "purple",
    description: "Deploy web services and static sites",
    connected: false,
    requiresOAuth: true,
    features: ["Deployments", "Logs", "Env Vars", "Webhooks"]
  },
  { 
    id: "vercel", 
    name: "Vercel", 
    category: "web", 
    icon: Zap, 
    color: "slate",
    description: "Deploy and manage web projects",
    connected: false,
    requiresOAuth: true,
    features: ["Deployments", "Domains", "Env Vars", "Preview URLs"]
  },
  { 
    id: "netlify", 
    name: "Netlify", 
    category: "web", 
    icon: Zap, 
    color: "cyan",
    description: "Deploy static sites and web apps",
    connected: false,
    requiresOAuth: true,
    features: ["Deployments", "Forms", "Functions", "Analytics"]
  },
  { 
    id: "digitalocean", 
    name: "DigitalOcean", 
    category: "web", 
    icon: Server, 
    color: "blue",
    description: "Cloud infrastructure and hosting",
    connected: false,
    requiresOAuth: true,
    features: ["Droplets", "Spaces", "Apps", "Networking"]
  },
  { 
    id: "heroku", 
    name: "Heroku", 
    category: "web", 
    icon: Server, 
    color: "violet",
    description: "App deployment platform",
    connected: false,
    requiresOAuth: true,
    features: ["Deployments", "Add-ons", "Pipelines", "Logs"]
  },
  { 
    id: "aws", 
    name: "AWS", 
    category: "web", 
    icon: Server, 
    color: "amber",
    description: "Amazon Web Services integrations",
    connected: false,
    requiresOAuth: true,
    features: ["Compute", "Storage", "Networking", "Monitoring"]
  },
  { 
    id: "azure", 
    name: "Azure", 
    category: "web", 
    icon: Server, 
    color: "blue",
    description: "Microsoft cloud platform integration",
    connected: false,
    requiresOAuth: true,
    features: ["Compute", "Storage", "Networking", "AI"]
  },
  { 
    id: "gcp", 
    name: "Google Cloud", 
    category: "web", 
    icon: Server, 
    color: "blue",
    description: "Google Cloud Platform integration",
    connected: false,
    requiresOAuth: true,
    features: ["Compute", "Storage", "Networking", "AI"]
  },
  { 
    id: "cloudflare", 
    name: "Cloudflare", 
    category: "web", 
    icon: Shield, 
    color: "orange",
    description: "CDN, DNS, and security tools",
    connected: false,
    requiresOAuth: true,
    features: ["DNS", "CDN", "WAF", "Workers"]
  },
  { 
    id: "github", 
    name: "GitHub", 
    category: "web", 
    icon: Code, 
    color: "slate",
    description: "Code hosting and CI/CD integration",
    connected: false,
    requiresOAuth: true,
    features: ["Repos", "Issues", "Actions", "PRs"]
  },
  { 
    id: "duda", 
    name: "Duda", 
    category: "web", 
    icon: Palette, 
    color: "cyan",
    description: "Website builder for agencies and SaaS",
    connected: false,
    requiresOAuth: true,
    features: ["White Label", "Client Management", "Team Collaboration", "Multi-Site"]
  },
  { 
    id: "strikingly", 
    name: "Strikingly", 
    category: "web", 
    icon: Code, 
    color: "emerald",
    description: "Mobile-optimized website builder",
    connected: false,
    requiresOAuth: true,
    features: ["One-Page Sites", "Mobile Editor", "E-commerce", "Analytics"]
  },
  { 
    id: "carrd", 
    name: "Carrd", 
    category: "web", 
    icon: Code, 
    color: "purple",
    description: "Simple, responsive one-page sites",
    connected: false,
    requiresOAuth: false,
    features: ["One-Page Builder", "Custom Domains", "Forms", "Analytics"]
  },
  { 
    id: "jimdo", 
    name: "Jimdo", 
    category: "web", 
    icon: Globe, 
    color: "blue",
    description: "AI-powered website builder",
    connected: false,
    requiresOAuth: true,
    features: ["AI Website Creator", "Online Store", "SEO Tools", "Analytics"]
  },
];

export function Integrations() {
  // ✅ FIX: correct useState initialization (no "return" inside an array literal)
  const [integrations, setIntegrations] = useState<Integration[]>(() => {
    return initialIntegrations.map((i) => {
      const c: any = getConnection(i.id);
      if (c?.status === "connected") {
        return { ...i, connected: true, connectedAs: c.accountLabel || "Connected" };
      }
      return i;
    });
  });

  const [activeTab, setActiveTab] = useState("all");
  type ConnectionStep = "oauth" | "configure" | "confirm" | "verify" | "success";

type ConnectionFlowState = {
  open: boolean;
  step: ConnectionStep;
  integration: Integration | null;
  selectedAccounts: string[];
  credentials: {
    apiKey?: string;
    apiSecret?: string;
    username?: string;
    password?: string;
  };
  identityEmail: string;
  authSource?: "oauth" | "edge" | "keychain";
  showPassword: boolean;
  verifying: boolean;
};

const [connectionFlow, setConnectionFlow] = useState<ConnectionFlowState>({
  open: false,
  step: "configure",
  integration: null,
  selectedAccounts: [],
  credentials: {},
  identityEmail: "",
  authSource: undefined,
  showPassword: false,
  verifying: false,
});
const startConnection = (integration: Integration) => {
  // OAuth integrations use the universal OAuth flow (browser -> callback -> mark connected)
  if (integration.requiresOAuth) {
    setConnectionFlow({
      open: true,
      step: "oauth",
      integration,
      selectedAccounts: [],
      credentials: {},
      identityEmail: "",
      authSource: "oauth",
      showPassword: false,
      verifying: false
    });
    handleOAuthConnect(integration.id);
    return;
  }

  setConnectionFlow({
    open: true,
    step: "configure" as any,
    integration,
    selectedAccounts: [],
    credentials: {},
    identityEmail: "",
    authSource: undefined,
    showPassword: false,
    verifying: false
  });
};
  
  const closeConnection = () => {
  setConnectionFlow({
    open: false,
    step: "configure" as any,
    integration: null,
    selectedAccounts: [],
    credentials: {},
    identityEmail: "",
    authSource: undefined,
    showPassword: false,
    verifying: false
  });
};


  // If another screen (e.g., CRM Import) requested opening a specific integration,
  // auto-open the connection dialog once when we land here.
  useEffect(() => {
  try {
    const sp = new URLSearchParams(window.location.search);
    const connected = sp.get("connected");
    if (connected === "google" || connected === "meta") {
      setConnection(connected, {
        providerKey: connected,
        status: "connected",
        accountLabel: connected === "google" ? "Google connected" : "Meta connected",
        connectedAt: new Date().toISOString()
      });
      // Remove the query param from the URL so refreshes don’t re-trigger.
      sp.delete("connected");
      const next = sp.toString();
      window.history.replaceState({}, "", window.location.pathname + (next ? `?${next}` : ""));
    }
  } catch {
    // ignore
  }
}, []);

useEffect(() => {
    let pending: string | null = null;
    try {
      pending = localStorage.getItem("atlasux.pendingIntegrationConnect.v1");
    } catch {
      pending = null;
    }
    if (!pending) return;

    const target = integrations.find((i) => i.id === pending);
    if (target) {
      try {
        localStorage.removeItem("atlasux.pendingIntegrationConnect.v1");
      } catch {
        // ignore
      }
      startConnection(target);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
const goToConfirm = (authSource: "oauth" | "edge" | "keychain") => {
  setConnectionFlow(prev => ({
    ...prev,
    step: "confirm",
    authSource,
    // If you can prefill from somewhere later, do it here.
    // For now we let user type/select.
    identityEmail: prev.identityEmail || ""
  }));
};

const beginVerificationAndConnect = () => {
  setConnectionFlow(prev => ({ ...prev, step: "verify", verifying: true }));

  setTimeout(() => {
    setConnectionFlow(prev => ({ ...prev, step: "success", verifying: false }));

    setTimeout(() => {
      const integration = connectionFlow.integration;
      const email = (connectionFlow.identityEmail || "").trim();

      if (integration) {
        // Update UI state
        setIntegrations(integrations.map(int =>
          int.id === integration.id
            ? { ...int, connected: true, connectedAs: email || "Connected" }
            : int
        ));

        // Persist "Connected as"
        setConnection({
          providerKey: integration.id,
          status: "connected",
          accountLabel: email || "Connected",
          connectedAt: new Date().toISOString()
        });
      }

      closeConnection();
    }, 1200);
  }, 1200);
};

  const toggleAccountSelection = (accountId: string) => {
    setConnectionFlow(prev => {
      const selected = prev.selectedAccounts.includes(accountId)
        ? prev.selectedAccounts.filter(id => id !== accountId)
        : [...prev.selectedAccounts, accountId];
      
      return { ...prev, selectedAccounts: selected };
    });
  };

  const selectAllAccounts = () => {
    const allAccounts = connectionFlow.integration?.accounts?.map(a => a.id) || [];
    setConnectionFlow(prev => ({ ...prev, selectedAccounts: allAccounts }));
  };

  const disconnectIntegration = (integrationId: string) => {
    setIntegrations(integrations.map(int => 
      int.id === integrationId 
        ? { ...int, connected: false } 
        : int
    ));
  };

  const getIntegrationsByCategory = (category: string) => {
    if (category === "all") return integrations;
    return integrations.filter(int => int.category === category);
  };

  const getConnectedCount = (category: string) => {
    const items = category === "all" 
      ? integrations 
      : integrations.filter(int => int.category === category);
    return items.filter(int => int.connected).length;
  };

  const getTotalCount = (category: string) => {
    return category === "all" 
      ? integrations.length 
      : integrations.filter(int => int.category === category).length;
  };

  const categoryLabels = {
    all: "All Integrations",
    social: "Social Media",
    "ai-platforms": "AI Platforms",
    business: "CRM & Business",
    storage: "Cloud Storage",
    productivity: "Productivity",
    design: "Design Tools",
    web: "Web Platforms"
  };

  // Mock accounts for demo purposes when integration doesn't have them
  const getMockAccounts = (integration: Integration) => {
    if (integration.mockAccounts) return integration.mockAccounts;

    return [
      { 
        id: "1", 
        name: `Primary ${integration.name} Account`, 
        email: "primary@company.com",
        avatar: integration.name.substring(0, 2).toUpperCase()
      },
      { 
        id: "2", 
        name: `Secondary ${integration.name} Account`, 
        email: "secondary@company.com",
        avatar: integration.name.substring(0, 2).toUpperCase()
      }
    ];
  };

  // Integration categories
  const categories = [
    { id: "all", name: "All Integrations", count: integrations.length },
    { id: "social", name: "Social Media", count: 9 },
    { id: "ai-platforms", name: "AI Platforms", count: 4 },
    { id: "business", name: "CRM & Business", count: 17 },
    { id: "storage", name: "Cloud Storage", count: 5 },
    { id: "productivity", name: "Productivity", count: 2 },
    { id: "design", name: "Design Tools", count: 2 },
    { id: "web", name: "Web Platforms", count: 18 }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent flex items-center gap-2">
            <Plug className="w-6 h-6 text-cyan-400" />
            Integrations
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Connect Atlas UX to your favorite platforms and services
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="border-cyan-500/20">
            <Settings className="w-4 h-4 mr-2" />
            Manage API Keys
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-slate-900/50 border-cyan-500/20 backdrop-blur-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-green-400">
                {integrations.filter(i => i.connected).length}
              </div>
              <div className="text-sm text-slate-400">Connected</div>
            </div>
          </div>
        </Card>

        <Card className="bg-slate-900/50 border-cyan-500/20 backdrop-blur-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
              <Plug className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-cyan-400">
                {integrations.length}
              </div>
              <div className="text-sm text-slate-400">Available</div>
            </div>
          </div>
        </Card>

        <Card className="bg-slate-900/50 border-cyan-500/20 backdrop-blur-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-400">
                {integrations.filter(i => i.requiresOAuth).length}
              </div>
              <div className="text-sm text-slate-400">OAuth</div>
            </div>
          </div>
        </Card>

        <Card className="bg-slate-900/50 border-cyan-500/20 backdrop-blur-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <Key className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-400">
                {integrations.filter(i => !i.requiresOAuth).length}
              </div>
              <div className="text-sm text-slate-400">API Key</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Category Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-900/50 border border-cyan-500/20">
          {categories.map(category => (
            <TabsTrigger 
              key={category.id} 
              value={category.id}
              className="data-[state=active]:bg-cyan-500/20"
            >
              <span className="mr-2">{category.name}</span>
              <Badge variant="outline" className="border-cyan-500/20 text-slate-300">
                {category.id === "all" ? integrations.length : getTotalCount(category.id)}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>

        {categories.map(category => (
          <TabsContent key={category.id} value={category.id} className="mt-4">
            <div className="grid grid-cols-3 gap-4">
              {getIntegrationsByCategory(category.id).map(integration => (
                <Card key={integration.id} className="bg-slate-900/50 border-cyan-500/20 backdrop-blur-xl p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-lg bg-${integration.color}-500/20 flex items-center justify-center`}>
                        <integration.icon className={`w-5 h-5 text-${integration.color}-400`} />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-100 flex items-center gap-2">
                          {integration.name}
                          {integration.connected && (
                            <Badge className="bg-green-500/20 text-green-300 border border-green-500/20">
                              Connected
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-slate-400">{integration.description}</div>
                        {integration.connectedAs && integration.connected && (
                          <div className="text-xs text-slate-500 mt-1">
                            Connected as{" "}
                            <span className="text-slate-300">{integration.connectedAs}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {integration.connected ? (
                        <Button
                          variant="outline"
                          className="border-red-500/20 text-red-300"
                          onClick={() => disconnectIntegration(integration.id)}
                        >
                          <X className="w-4 h-4 mr-2" />
                          Disconnect
                        </Button>
                      ) : (
                        <Button
                          className="bg-cyan-600 hover:bg-cyan-500"
                          onClick={() => startConnection(integration)}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Connect
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {integration.features.map(feature => (
                      <Badge key={feature} variant="outline" className="border-cyan-500/10 text-slate-300">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Connection Flow Dialog */}
      <Dialog open={connectionFlow.open} onOpenChange={(open) => !open && closeConnection()}>
        <DialogContent className="max-w-2xl bg-slate-950 border border-cyan-500/20">
          <DialogHeader>
            <DialogTitle className="text-slate-100 flex items-center gap-2">
              <Plug className="w-5 h-5 text-cyan-400" />
              Connect {connectionFlow.integration?.name}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Choose how you'd like to connect and verify ownership
            </DialogDescription>
          </DialogHeader>

          {/* Configure */}
          {connectionFlow.step === "oauth" && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">OAuth Sign-In</p>
                    <p className="text-xs text-white/60">
                      Complete sign-in in your browser. When it finishes, you’ll be redirected back to Atlas UX and this integration will show as connected.
                    </p>
                  </div>
                  <button
                    className="rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold hover:bg-white/15"
                    onClick={() => handleOAuthConnect(connectionFlow.integration!.id)}
                  >
                    Open OAuth
                  </button>
                </div>
                <div className="mt-3 rounded-xl bg-black/20 p-3 text-xs text-white/60">
                  If nothing happens, make sure the AtlasUX backend is running on <span className="font-mono">http://localhost:8787</span> and OAuth env vars are configured.
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  className="rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/15"
                  onClick={() => setConnectionFlow(prev => ({ ...prev, open: false }))}
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {connectionFlow.step === "configure" && (
            <div className="space-y-4">
              <Card className="bg-slate-900/40 border-cyan-500/20 p-4">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  Connection Options
                  <Badge variant="outline" className="border-cyan-500/40 text-cyan-400 text-xs">
                    Secure
                  </Badge>
                </h4>
                <p className="text-sm text-slate-300 mb-4">
                  Choose your preferred method to connect. OAuth is recommended for most services.
                </p>
                
                <div className="grid grid-cols-3 gap-3">
                  <Button
                    className="bg-cyan-600 hover:bg-cyan-500"
                    onClick={() => handleOAuthConnect(connectionFlow.integration!.id)}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    OAuth Sign-In
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="border-cyan-500/20"
                    disabled={true} onClick={() => {}} title="Coming soon"
                  >
                    <Lock className="w-4 h-4 mr-2" />
                    Edge Passwords
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="border-cyan-500/20"
                    disabled={true} onClick={() => {}} title="Coming soon"
                  >
                    <Key className="w-4 h-4 mr-2" />
                    iPhone Keychain
                  </Button>
                </div>
              </Card>

              <Card className="bg-slate-900/40 border-cyan-500/20 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    Select Accounts to Connect
                    <Badge variant="outline" className="border-purple-500/40 text-purple-400 text-xs">
                      Import
                    </Badge>
                  </h4>
                  <Button size="sm" variant="outline" className="text-xs border-cyan-500/20" onClick={selectAllAccounts}>
                    Select All
                  </Button>
                </div>
                
                <ScrollArea className="h-48">
                  <div className="space-y-2">
                    {connectionFlow.integration && getMockAccounts(connectionFlow.integration).map(account => (
                      <div
                        key={account.id}
                        className={`p-3 rounded-lg border cursor-pointer transition ${
                          connectionFlow.selectedAccounts.includes(account.id)
                            ? "border-cyan-500/40 bg-cyan-500/10"
                            : "border-slate-700/40 bg-slate-800/20 hover:border-slate-600/40"
                        }`}
                        onClick={() => toggleAccountSelection(account.id)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-semibold">
                            {account.avatar || "AC"}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-slate-100">{account.name}</div>
                            <div className="text-xs text-slate-400">{account.email}</div>
                          </div>
                          {connectionFlow.selectedAccounts.includes(account.id) && (
                            <Check className="w-5 h-5 text-cyan-400" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </Card>

              <div className="flex justify-end gap-2">
                <Button variant="outline" className="border-slate-700" onClick={closeConnection}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Confirm */}
          {connectionFlow.step === "confirm" && (
            <div className="space-y-4">
              <Card className="bg-slate-900/40 border-cyan-500/20 p-4">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  Verify Account Ownership
                  <Badge variant="outline" className="border-yellow-500/40 text-yellow-400 text-xs">
                    Required
                  </Badge>
                </h4>
                <p className="text-sm text-slate-300 mb-4">
                  Enter the email/username associated with the account you are connecting.
                </p>

                <div className="space-y-2">
                  <label className="text-xs text-slate-400">Account Email / Username</label>
                  <Input
                    className="bg-slate-950 border-slate-700 text-slate-100"
                    value={connectionFlow.identityEmail}
                    onChange={(e) =>
                      setConnectionFlow((prev) => ({ ...prev, identityEmail: e.target.value }))
                    }
                    placeholder="you@domain.com"
                  />
                </div>
              </Card>

              <div className="flex justify-end gap-2">
                <Button variant="outline" className="border-slate-700" onClick={() => setConnectionFlow(prev => ({ ...prev, step: "configure" as any }))}>
                  Back
                </Button>
                <Button className="bg-cyan-600 hover:bg-cyan-500" onClick={beginVerificationAndConnect}>
                  Continue
                </Button>
              </div>
            </div>
          )}

          {/* Verify */}
          {connectionFlow.step === "verify" && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-xl border border-cyan-500/20 bg-slate-900/40 p-4">
                <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
                <div>
                  <div className="text-slate-100 font-semibold">Verifying ownership…</div>
                  <div className="text-slate-400 text-sm">This will only take a moment.</div>
                </div>
              </div>
            </div>
          )}

          {/* Success */}
          {connectionFlow.step === "success" && (
            <div className="space-y-4">
              <div className="rounded-xl border border-green-500/20 bg-green-500/10 p-6 flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-green-400" />
                <div>
                  <div className="text-slate-100 font-semibold">Connected!</div>
                  <div className="text-slate-400 text-sm">
                    {connectionFlow.integration?.name} is now linked to Atlas.
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Help Section */}
      <HelpSection
        title="Integrations Help & FAQ"
        description="Learn how to connect platforms, import passwords, verify ownership, and manage your integrations securely"
        faqs={IntegrationsHelp}
        quickTips={[
          "Import credentials from Edge or iPhone Keychain for faster setup",
          "All passwords are AES-256 encrypted - Neptune cannot access them",
          "Select multiple accounts during setup to import everything at once",
          "Verify ownership through secure login to activate integrations"
        ]}
        videoUrl="/tutorials/integrations"
      />
    </div>
  );
}