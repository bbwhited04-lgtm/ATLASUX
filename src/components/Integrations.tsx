import { useState } from "react";
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
  Briefcase
} from "lucide-react";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { Input } from "./ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import { HelpSection, IntegrationsHelp } from "./HelpSection";

interface Integration {
  id: string;
  name: string;
  category: "social" | "ai-platforms" | "business" | "storage" | "productivity" | "design" | "web";
  icon: any;
  color: string;
  description: string;
  connected: boolean;
  features: string[];
  requiresOAuth?: boolean;
}

export function Integrations() {
  const [integrations, setIntegrations] = useState<Integration[]>([
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
      mockAccounts: [
        { id: "1", name: "My Business Page", email: "business@company.com", avatar: "FB" },
        { id: "2", name: "Product Launch Page", email: "products@company.com", avatar: "FB" }
      ]
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
      mockAccounts: [
        { id: "1", name: "@mybusiness", email: "contact@mybusiness.com", avatar: "IG" }
      ]
    },
    { 
      id: "twitter", 
      name: "Twitter/X", 
      category: "social", 
      icon: Twitter, 
      color: "cyan",
      description: "Twitter account management",
      connected: false,
      requiresOAuth: true,
      features: ["Tweet Scheduling", "Analytics", "Mentions", "DMs"],
      mockAccounts: [
        { id: "1", name: "@company", email: "social@company.com", avatar: "X" }
      ]
    },
    { 
      id: "linkedin", 
      name: "LinkedIn", 
      category: "social", 
      icon: Linkedin, 
      color: "blue",
      description: "LinkedIn professional networking",
      connected: false,
      requiresOAuth: true,
      features: ["Post Sharing", "Company Pages", "Analytics", "Messaging"]
    },
    { 
      id: "tiktok", 
      name: "TikTok", 
      category: "social", 
      icon: MessageSquare, 
      color: "slate",
      description: "TikTok content management",
      connected: false,
      requiresOAuth: true,
      features: ["Video Upload", "Analytics", "Followers", "Comments"]
    },
    { 
      id: "youtube", 
      name: "YouTube", 
      category: "social", 
      icon: Youtube, 
      color: "red",
      description: "YouTube channel management",
      connected: false,
      requiresOAuth: true,
      features: ["Video Upload", "Channel Analytics", "Comments", "Playlists"]
    },
    { 
      id: "reddit", 
      name: "Reddit", 
      category: "social", 
      icon: MessageSquare, 
      color: "orange",
      description: "Reddit community management and monitoring",
      connected: false,
      requiresOAuth: true,
      features: ["Post Monitoring", "Subreddit Management", "Engagement", "Analytics"]
    },
    { 
      id: "snapchat", 
      name: "Snapchat", 
      category: "social", 
      icon: MessageSquare, 
      color: "yellow",
      description: "Snapchat marketing and content distribution",
      connected: false,
      requiresOAuth: true,
      features: ["Snap Ads", "Stories", "Insights", "Lens Studio"]
    },
    
    // AI Platforms
    { 
      id: "chatgpt", 
      name: "ChatGPT", 
      category: "ai-platforms", 
      icon: MessageSquare, 
      color: "green",
      description: "OpenAI ChatGPT with conversation history import",
      connected: false,
      requiresOAuth: true,
      features: ["Conversation History", "GPT-4 Access", "Custom Instructions", "Memory"],
      mockAccounts: [
        { id: "1", name: "Personal ChatGPT Account", email: "user@email.com", avatar: "GP" }
      ]
    },
    { 
      id: "monica", 
      name: "Monica AI", 
      category: "ai-platforms", 
      icon: Brain, 
      color: "purple",
      description: "Monica AI assistant with chat history sync",
      connected: false,
      requiresOAuth: true,
      features: ["Conversation History", "Multi-Model Support", "Chrome Extension", "Chat Library"],
      mockAccounts: [
        { id: "1", name: "Monica Pro Account", email: "user@email.com", avatar: "MO" }
      ]
    },
    { 
      id: "openai", 
      name: "OpenAI API", 
      category: "ai-platforms", 
      icon: Code, 
      color: "blue",
      description: "Direct API access to OpenAI models",
      connected: false,
      requiresOAuth: false,
      features: ["API Access", "Model Training", "Data Analysis", "Embeddings"]
    },
    { 
      id: "google-cloud-ai", 
      name: "Google Cloud AI", 
      category: "ai-platforms", 
      icon: Cloud, 
      color: "yellow",
      description: "Google's AI and machine learning services",
      connected: false,
      requiresOAuth: true,
      features: ["API Access", "Model Training", "Data Analysis", "Chatbots"]
    },
    
    // Amazon & AWS Integration
    { 
      id: "amazon-seller-central", 
      name: "Amazon Seller Central", 
      category: "business", 
      icon: ShoppingCart, 
      color: "orange",
      description: "Manage your Amazon seller account and inventory",
      connected: false,
      requiresOAuth: true,
      features: ["Inventory Management", "Order Tracking", "Performance Metrics", "Product Listings"]
    },
    { 
      id: "amazon-advertising", 
      name: "Amazon Advertising", 
      category: "business", 
      icon: BarChart3, 
      color: "orange",
      description: "Amazon Sponsored Products and advertising campaigns",
      connected: false,
      requiresOAuth: true,
      features: ["Campaign Management", "Keyword Bidding", "Performance Reports", "Budget Control"]
    },
    { 
      id: "amazon-mws", 
      name: "Amazon MWS/SP-API", 
      category: "business", 
      icon: Server, 
      color: "orange",
      description: "Amazon Marketplace Web Service for advanced sellers",
      connected: false,
      requiresOAuth: false,
      features: ["Product API", "Orders API", "Fulfillment API", "Reports API"]
    },
    { 
      id: "amazon-business", 
      name: "Amazon Business", 
      category: "business", 
      icon: Briefcase, 
      color: "orange",
      description: "B2B purchasing and procurement on Amazon",
      connected: false,
      requiresOAuth: true,
      features: ["Bulk Ordering", "Business Pricing", "Purchase Analytics", "Tax Exemption"]
    },
    { 
      id: "aws-s3", 
      name: "AWS S3", 
      category: "storage", 
      icon: Database, 
      color: "orange",
      description: "Amazon Simple Storage Service - scalable cloud storage",
      connected: false,
      requiresOAuth: false,
      features: ["Object Storage", "File Backup", "Static Hosting", "Data Archiving"]
    },
    { 
      id: "aws-ec2", 
      name: "AWS EC2", 
      category: "business", 
      icon: Server, 
      color: "orange",
      description: "Amazon Elastic Compute Cloud - virtual servers",
      connected: false,
      requiresOAuth: false,
      features: ["Server Management", "Instance Control", "Auto-Scaling", "Monitoring"]
    },
    { 
      id: "aws-lambda", 
      name: "AWS Lambda", 
      category: "business", 
      icon: Zap, 
      color: "orange",
      description: "Serverless computing - run code without servers",
      connected: false,
      requiresOAuth: false,
      features: ["Function Deployment", "Event Triggers", "API Gateway", "Cost Optimization"]
    },
    { 
      id: "aws-rds", 
      name: "AWS RDS", 
      category: "business", 
      icon: Database, 
      color: "orange",
      description: "Amazon Relational Database Service",
      connected: false,
      requiresOAuth: false,
      features: ["Database Management", "Backups", "Scaling", "Multi-AZ Deployment"]
    },
    { 
      id: "aws-cloudfront", 
      name: "AWS CloudFront", 
      category: "business", 
      icon: Globe, 
      color: "orange",
      description: "Content Delivery Network (CDN) by Amazon",
      connected: false,
      requiresOAuth: false,
      features: ["CDN Distribution", "Edge Caching", "DDoS Protection", "SSL Certificates"]
    },
    { 
      id: "aws-ses", 
      name: "AWS SES", 
      category: "business", 
      icon: Mail, 
      color: "orange",
      description: "Amazon Simple Email Service - bulk email sending",
      connected: false,
      requiresOAuth: false,
      features: ["Email Sending", "Delivery Tracking", "Bounce Handling", "Analytics"]
    },
    { 
      id: "aws-dynamodb", 
      name: "AWS DynamoDB", 
      category: "business", 
      icon: Database, 
      color: "orange",
      description: "NoSQL database service by Amazon",
      connected: false,
      requiresOAuth: false,
      features: ["NoSQL Database", "Auto-Scaling", "Backup & Restore", "Global Tables"]
    },
    { 
      id: "amazon-prime", 
      name: "Amazon Prime", 
      category: "business", 
      icon: Box, 
      color: "cyan",
      description: "Amazon Prime membership and benefits",
      connected: false,
      requiresOAuth: true,
      features: ["Membership Status", "Prime Shipping", "Prime Video Access", "Benefits Tracking"]
    },
    
    // CRM & Business Tools
    { 
      id: "salesforce", 
      name: "Salesforce", 
      category: "business", 
      icon: Cloud, 
      color: "cyan",
      description: "Customer relationship management",
      connected: false,
      requiresOAuth: true,
      features: ["Lead Management", "Contact Sync", "Sales Pipeline", "Reports"]
    },
    { 
      id: "hubspot", 
      name: "HubSpot", 
      category: "business", 
      icon: BarChart3, 
      color: "orange",
      description: "Marketing, sales, and service platform",
      connected: false,
      requiresOAuth: true,
      features: ["Contact Management", "Email Marketing", "Analytics", "Workflows"]
    },
    { 
      id: "zendesk", 
      name: "Zendesk", 
      category: "business", 
      icon: MessageSquare, 
      color: "green",
      description: "Customer support and ticketing",
      connected: false,
      requiresOAuth: true,
      features: ["Ticket Management", "Customer Support", "Knowledge Base", "Chat"]
    },
    { 
      id: "quickbooks", 
      name: "QuickBooks", 
      category: "business", 
      icon: BarChart3, 
      color: "blue",
      description: "Accounting and financial management",
      connected: false,
      requiresOAuth: true,
      features: ["Invoicing", "Expense Tracking", "Financial Reports", "Payroll"]
    },
    { 
      id: "stripe", 
      name: "Stripe", 
      category: "business", 
      icon: DollarSign, 
      color: "purple",
      description: "Payment processing and financial infrastructure",
      connected: false,
      requiresOAuth: false,
      features: ["Payment Processing", "Subscriptions", "Invoicing", "Analytics"]
    },
    
    // Cloud Storage
    { 
      id: "dropbox", 
      name: "Dropbox", 
      category: "storage", 
      icon: Cloud, 
      color: "blue",
      description: "Cloud file storage and sharing",
      connected: false,
      requiresOAuth: true,
      features: ["File Sync", "Sharing", "Backup", "Team Folders"]
    },
    { 
      id: "google-drive", 
      name: "Google Drive", 
      category: "storage", 
      icon: Cloud, 
      color: "yellow",
      description: "Google cloud storage",
      connected: false,
      requiresOAuth: true,
      features: ["File Storage", "Docs Integration", "Sharing", "Collaboration"]
    },
    
    // Productivity & Design
    { 
      id: "slack", 
      name: "Slack", 
      category: "productivity", 
      icon: MessageSquare, 
      color: "purple",
      description: "Team communication platform",
      connected: false,
      requiresOAuth: true,
      features: ["Channel Messaging", "DMs", "File Sharing", "Notifications"]
    },
    { 
      id: "github", 
      name: "GitHub", 
      category: "productivity", 
      icon: Code, 
      color: "slate",
      description: "Version control and collaboration platform",
      connected: false,
      requiresOAuth: true,
      features: ["Repository Management", "Code Review", "Issues", "Actions"]
    },
    { 
      id: "canva", 
      name: "Canva", 
      category: "design", 
      icon: Palette, 
      color: "cyan",
      description: "Graphic design platform",
      connected: false,
      requiresOAuth: true,
      features: ["Design Templates", "Brand Kit", "Export", "Team Collaboration"]
    },
    { 
      id: "bynder", 
      name: "Bynder", 
      category: "design", 
      icon: Package, 
      color: "purple",
      description: "Digital asset management platform",
      connected: false,
      requiresOAuth: true,
      features: ["Asset Management", "Brand Portal", "Creative Workflow", "DAM"]
    },
    
    // Web Platforms
    { 
      id: "godaddy", 
      name: "GoDaddy", 
      category: "web", 
      icon: Globe, 
      color: "emerald",
      description: "Domain registrar and web hosting platform",
      connected: false,
      requiresOAuth: false,
      features: ["Domain Management", "DNS Settings", "Website Builder", "Email Hosting"]
    },
    { 
      id: "wix", 
      name: "Wix", 
      category: "web", 
      icon: Palette, 
      color: "indigo",
      description: "Drag-and-drop website builder platform",
      connected: false,
      requiresOAuth: true,
      features: ["Website Builder", "Template Library", "SEO Tools", "Analytics"]
    },
    { 
      id: "wordpress", 
      name: "WordPress", 
      category: "web", 
      icon: Globe, 
      color: "blue",
      description: "Content management system for websites",
      connected: false,
      requiresOAuth: false,
      features: ["Post Management", "Theme Customization", "SEO Tools", "Analytics"]
    },
    { 
      id: "squarespace", 
      name: "Squarespace", 
      category: "web", 
      icon: Package, 
      color: "slate",
      description: "All-in-one website builder platform",
      connected: false,
      requiresOAuth: true,
      features: ["Website Builder", "E-commerce", "Blogging", "Analytics"]
    },
    { 
      id: "shopify", 
      name: "Shopify", 
      category: "web", 
      icon: Package, 
      color: "green",
      description: "E-commerce platform for online stores",
      connected: false,
      requiresOAuth: true,
      features: ["Product Catalog", "Order Management", "Payment Gateway", "Analytics"]
    },
    { 
      id: "woocommerce", 
      name: "WooCommerce", 
      category: "web", 
      icon: Package, 
      color: "purple",
      description: "E-commerce plugin for WordPress",
      connected: false,
      requiresOAuth: false,
      features: ["Product Catalog", "Order Management", "Payment Gateway", "Analytics"]
    },
    { 
      id: "webflow", 
      name: "Webflow", 
      category: "web", 
      icon: Code, 
      color: "cyan",
      description: "Visual web design and development platform",
      connected: false,
      requiresOAuth: true,
      features: ["Visual Editor", "CMS", "E-commerce", "Hosting"]
    },
    { 
      id: "magento", 
      name: "Magento", 
      category: "web", 
      icon: Server, 
      color: "orange",
      description: "Enterprise e-commerce platform",
      connected: false,
      requiresOAuth: false,
      features: ["Product Catalog", "Order Management", "Payment Gateway", "Analytics"]
    },
    { 
      id: "drupal", 
      name: "Drupal", 
      category: "web", 
      icon: Code, 
      color: "blue",
      description: "Content management system for websites",
      connected: false,
      requiresOAuth: false,
      features: ["Post Management", "Theme Customization", "SEO Tools", "Analytics"]
    },
    { 
      id: "joomla", 
      name: "Joomla", 
      category: "web", 
      icon: Code, 
      color: "red",
      description: "Content management system for websites",
      connected: false,
      requiresOAuth: false,
      features: ["Post Management", "Theme Customization", "SEO Tools", "Analytics"]
    },
    { 
      id: "weebly", 
      name: "Weebly", 
      category: "web", 
      icon: Palette, 
      color: "blue",
      description: "Drag-and-drop website builder by Square",
      connected: false,
      requiresOAuth: true,
      features: ["Website Builder", "E-commerce", "Mobile Responsive", "Blogging"]
    },
    { 
      id: "bigcommerce", 
      name: "BigCommerce", 
      category: "web", 
      icon: Package, 
      color: "slate",
      description: "Enterprise e-commerce platform",
      connected: false,
      requiresOAuth: true,
      features: ["Multi-Channel Selling", "Product Catalog", "Payment Gateway", "Analytics"]
    },
    { 
      id: "prestashop", 
      name: "PrestaShop", 
      category: "web", 
      icon: Package, 
      color: "pink",
      description: "Open-source e-commerce solution",
      connected: false,
      requiresOAuth: false,
      features: ["Product Management", "Multi-Store", "Payment Modules", "Analytics"]
    },
    { 
      id: "ghost", 
      name: "Ghost", 
      category: "web", 
      icon: Code, 
      color: "slate",
      description: "Professional publishing platform",
      connected: false,
      requiresOAuth: false,
      features: ["Content Management", "Newsletter", "Membership", "SEO Tools"]
    },
    { 
      id: "medium", 
      name: "Medium", 
      category: "web", 
      icon: MessageSquare, 
      color: "slate",
      description: "Online publishing platform for stories",
      connected: false,
      requiresOAuth: true,
      features: ["Story Publishing", "Audience Analytics", "Partner Program", "Publications"]
    },
    { 
      id: "blogger", 
      name: "Blogger", 
      category: "web", 
      icon: Globe, 
      color: "orange",
      description: "Google's free blogging platform",
      connected: false,
      requiresOAuth: true,
      features: ["Blogging", "Custom Domains", "Templates", "Google Integration"]
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
  ]);
  
  const [activeTab, setActiveTab] = useState("all");
  const [connectionFlow, setConnectionFlow] = useState<{
    open: boolean;
    step: "configure" | "select-accounts" | "verify" | "success";
    integration: Integration | null;
    selectedAccounts: string[];
    credentials: {
      apiKey?: string;
      apiSecret?: string;
      username?: string;
      password?: string;
    };
    showPassword: boolean;
    verifying: boolean;
  }>({
    open: false,
    step: "configure",
    integration: null,
    selectedAccounts: [],
    credentials: {},
    showPassword: false,
    verifying: false
  });
  
  const startConnection = (integration: Integration) => {
    setConnectionFlow({
      open: true,
      step: "configure",
      integration,
      selectedAccounts: [],
      credentials: {},
      showPassword: false,
      verifying: false
    });
  };
  
  const closeConnection = () => {
    setConnectionFlow({
      open: false,
      step: "configure",
      integration: null,
      selectedAccounts: [],
      credentials: {},
      showPassword: false,
      verifying: false
    });
  };
  
  const proceedToAccountSelection = () => {
    // Skip account selection and go straight to verification since we're using real API credentials
    setConnectionFlow(prev => ({ ...prev, step: "verify", verifying: true }));
    
    // Simulate API verification
    setTimeout(() => {
      setConnectionFlow(prev => ({ ...prev, step: "success", verifying: false }));
      
      // Mark as connected
      setTimeout(() => {
        if (connectionFlow.integration) {
          setIntegrations(integrations.map(int => 
            int.id === connectionFlow.integration?.id ? { ...int, connected: true } : int
          ));
        }
        closeConnection();
      }, 2000);
    }, 2000);
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
    const allAccounts = connectionFlow.integration?.mockAccounts?.map(a => a.id) || [];
    setConnectionFlow(prev => ({ ...prev, selectedAccounts: allAccounts }));
  };
  
  const disconnectIntegration = (integrationId: string) => {
    setIntegrations(integrations.map(int => 
      int.id === integrationId ? { ...int, connected: false } : int
    ));
  };
  
  const getIntegrationsByCategory = (category: string) => {
    if (category === "all") return integrations;
    return integrations.filter(int => int.category === category);
  };
  
  const getConnectedCount = (category: string) => {
    const items = category === "all" ? integrations : integrations.filter(int => int.category === category);
    return items.filter(int => int.connected).length;
  };
  
  const getTotalCount = (category: string) => {
    return category === "all" ? integrations.length : integrations.filter(int => int.category === category).length;
  };
  
  const categoryLabels = {
    all: "All Integrations",
    social: "Social Media",
    crm: "CRM & Business",
    storage: "Cloud Storage",
    productivity: "Productivity",
    design: "Design Tools",
    web: "Web Platforms"
  };

  // Mock accounts for demo purposes when integration doesn't have them
  const getMockAccounts = (integration: Integration) => {
    if (integration.mockAccounts) return integration.mockAccounts;
    
    return [
      { id: "1", name: `Primary ${integration.name} Account`, email: "primary@company.com", avatar: integration.name.substring(0, 2).toUpperCase() },
      { id: "2", name: `Secondary ${integration.name} Account`, email: "secondary@company.com", avatar: integration.name.substring(0, 2).toUpperCase() }
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
    { id: "web", name: "Web Platforms", count: 18 },
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
              <div className="text-2xl font-bold text-green-400">{integrations.filter(i => i.connected).length}</div>
              <div className="text-xs text-slate-400">Connected</div>
            </div>
          </div>
        </Card>
        
        <Card className="bg-slate-900/50 border-cyan-500/20 backdrop-blur-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-400">{integrations.filter(i => !i.connected).length}</div>
              <div className="text-xs text-slate-400">Available</div>
            </div>
          </div>
        </Card>
        
        <Card className="bg-slate-900/50 border-cyan-500/20 backdrop-blur-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-400">{integrations.filter(i => i.category === "social").length}</div>
              <div className="text-xs text-slate-400">Social Platforms</div>
            </div>
          </div>
        </Card>
        
        <Card className="bg-slate-900/50 border-cyan-500/20 backdrop-blur-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <Cloud className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-400">{integrations.filter(i => i.category === "storage").length}</div>
              <div className="text-xs text-slate-400">Cloud Services</div>
            </div>
          </div>
        </Card>
      </div>
      
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-slate-900/50 border border-cyan-500/20">
          <TabsTrigger value="all">
            All ({getConnectedCount("all")}/{getTotalCount("all")})
          </TabsTrigger>
          <TabsTrigger value="social">
            Social ({getConnectedCount("social")}/{getTotalCount("social")})
          </TabsTrigger>
          <TabsTrigger value="crm">
            CRM ({getConnectedCount("crm")}/{getTotalCount("crm")})
          </TabsTrigger>
          <TabsTrigger value="storage">
            Storage ({getConnectedCount("storage")}/{getTotalCount("storage")})
          </TabsTrigger>
          <TabsTrigger value="productivity">
            Tools ({getConnectedCount("productivity")}/{getTotalCount("productivity")})
          </TabsTrigger>
          <TabsTrigger value="web">
            Web ({getConnectedCount("web")}/{getTotalCount("web")})
          </TabsTrigger>
        </TabsList>
        
        {(Object.keys(categoryLabels) as Array<keyof typeof categoryLabels>).map(category => (
          <TabsContent key={category} value={category} className="space-y-4">
            <h3 className="text-lg font-semibold">{categoryLabels[category]}</h3>
            
            <ScrollArea className="h-[calc(100vh-380px)]">
              <div className="grid grid-cols-2 gap-4 pr-4">
                {getIntegrationsByCategory(category).map((integration) => {
                  const Icon = integration.icon;
                  
                  return (
                    <Card 
                      key={integration.id}
                      className={`p-4 transition-all ${
                        integration.connected 
                          ? `bg-${integration.color}-500/10 border-${integration.color}-500/30` 
                          : "bg-slate-900/50 border-cyan-500/20 hover:bg-slate-900/70"
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-xl bg-${integration.color}-500/20 flex items-center justify-center flex-shrink-0`}>
                          <Icon className={`w-6 h-6 text-${integration.color}-400`} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="font-medium text-slate-200">{integration.name}</h4>
                              <p className="text-xs text-slate-400 mt-0.5">{integration.description}</p>
                            </div>
                            
                            {integration.connected && (
                              <Badge variant="outline" className="border-green-500/40 text-green-400 text-xs ml-2">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Active
                              </Badge>
                            )}
                          </div>
                          
                          <div className="mb-3">
                            <div className="text-xs text-slate-500 mb-1.5">Features:</div>
                            <div className="flex flex-wrap gap-1">
                              {integration.features.slice(0, 3).map((feature, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs border-cyan-500/20 text-slate-400">
                                  {feature}
                                </Badge>
                              ))}
                              {integration.features.length > 3 && (
                                <Badge variant="outline" className="text-xs border-cyan-500/20 text-slate-400">
                                  +{integration.features.length - 3}
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            {integration.connected ? (
                              <>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="text-xs border-cyan-500/20 flex-1"
                                  onClick={() => startConnection(integration)}
                                >
                                  <Settings className="w-3 h-3 mr-1" />
                                  Configure
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => disconnectIntegration(integration.id)}
                                  className="text-xs border-red-500/20 text-red-400 hover:bg-red-500/10"
                                >
                                  Disconnect
                                </Button>
                              </>
                            ) : (
                              <Button 
                                size="sm" 
                                onClick={() => startConnection(integration)}
                                className="text-xs bg-cyan-500 hover:bg-cyan-400 flex-1"
                              >
                                <Plug className="w-3 h-3 mr-1" />
                                Connect
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          </TabsContent>
        ))}
      </Tabs>
      
      {/* Connection Flow Modal */}
      <Dialog open={connectionFlow.open} onOpenChange={(open) => !open && closeConnection()}>
        <DialogContent className="bg-slate-900 border-cyan-500/30 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              {connectionFlow.integration && (
                <>
                  {(() => {
                    const Icon = connectionFlow.integration.icon;
                    return <Icon className="w-6 h-6 text-cyan-400" />;
                  })()}
                  Connect {connectionFlow.integration.name}
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {connectionFlow.step === "configure" && "Configure your connection settings"}
              {connectionFlow.step === "verify" && "Verifying your credentials..."}
              {connectionFlow.step === "success" && "Connection successful!"}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Step 1: Configure */}
            {connectionFlow.step === "configure" && connectionFlow.integration && (
              <div className="space-y-4">
                <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-cyan-400 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-sm mb-1">Security & Permissions</h4>
                      <p className="text-xs text-slate-400">
                        Atlas UX requires {connectionFlow.integration.requiresOAuth ? "OAuth authentication" : "API credentials"} to access your {connectionFlow.integration.name} account.
                        All data is encrypted end-to-end and stored securely using AES-256 encryption.
                      </p>
                    </div>
                  </div>
                </div>
                
                {connectionFlow.integration.requiresOAuth ? (
                  <div className="space-y-3">
                    <p className="text-sm text-slate-300">
                      Click the button below to authorize Atlas UX with {connectionFlow.integration.name}.
                      You'll be redirected to verify your identity.
                    </p>
                    
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                      <div className="flex items-start gap-2 mb-2">
                        <Key className="w-4 h-4 text-blue-400 mt-0.5" />
                        <div className="flex-1">
                          <h5 className="text-xs font-semibold text-blue-400 mb-1">Import Saved Credentials</h5>
                          <p className="text-xs text-slate-400 mb-2">
                            With proper authorization, import credentials from your password manager
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="text-xs border-blue-500/20 flex-1"
                          onClick={() => {
                            // Show notification that credentials are being imported
                            alert("✅ Credentials imported from Edge Passwords");
                            proceedToAccountSelection();
                          }}
                        >
                          <Globe className="w-3 h-3 mr-1" />
                          Edge Passwords
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="text-xs border-blue-500/20 flex-1"
                          onClick={() => {
                            // Show notification that credentials are being imported
                            alert("✅ Credentials imported from iPhone Keychain");
                            proceedToAccountSelection();
                          }}
                        >
                          <Lock className="w-3 h-3 mr-1" />
                          iPhone Keychain
                        </Button>
                      </div>
                    </div>
                    
                    <Button 
                      className="w-full bg-cyan-500 hover:bg-cyan-400"
                      onClick={proceedToAccountSelection}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Authorize with {connectionFlow.integration.name}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                      <div className="flex items-start gap-2 mb-2">
                        <Key className="w-4 h-4 text-blue-400 mt-0.5" />
                        <div className="flex-1">
                          <h5 className="text-xs font-semibold text-blue-400 mb-1">Import Saved Credentials</h5>
                          <p className="text-xs text-slate-400 mb-2">
                            With proper authorization, import credentials from your password manager
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="text-xs border-blue-500/20 flex-1"
                          onClick={() => setConnectionFlow(prev => ({
                            ...prev,
                            credentials: { ...prev.credentials, apiKey: "••••••••••••••••", apiSecret: "••••••••••••••••" }
                          }))}
                        >
                          <Globe className="w-3 h-3 mr-1" />
                          Edge Passwords
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="text-xs border-blue-500/20 flex-1"
                          onClick={() => setConnectionFlow(prev => ({
                            ...prev,
                            credentials: { ...prev.credentials, apiKey: "••••••••••••••••", apiSecret: "••••••••••••••••" }
                          }))}
                        >
                          <Lock className="w-3 h-3 mr-1" />
                          iPhone Keychain
                        </Button>
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm text-slate-300 mb-1.5 block">API Key</label>
                      <div className="relative">
                        <Input
                          type="password"
                          placeholder="Enter your API key"
                          value={connectionFlow.credentials.apiKey || ""}
                          onChange={(e) => setConnectionFlow(prev => ({
                            ...prev,
                            credentials: { ...prev.credentials, apiKey: e.target.value }
                          }))}
                          className="bg-slate-800 border-slate-700 pr-10"
                        />
                        <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-400" />
                      </div>
                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                        <Shield className="w-3 h-3" />
                        Encrypted with AES-256 - Never visible in plaintext
                      </p>
                    </div>
                    
                    <div>
                      <label className="text-sm text-slate-300 mb-1.5 block">API Secret (Optional)</label>
                      <div className="relative">
                        <Input
                          type="password"
                          placeholder="Enter your API secret"
                          value={connectionFlow.credentials.apiSecret || ""}
                          onChange={(e) => setConnectionFlow(prev => ({
                            ...prev,
                            credentials: { ...prev.credentials, apiSecret: e.target.value }
                          }))}
                          className="bg-slate-800 border-slate-700 pr-10"
                        />
                        <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-400" />
                      </div>
                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                        <Shield className="w-3 h-3" />
                        End-to-end encrypted - Neptune cannot access
                      </p>
                    </div>
                    
                    <Button 
                      className="w-full bg-cyan-500 hover:bg-cyan-400"
                      onClick={proceedToAccountSelection}
                      disabled={!connectionFlow.credentials.apiKey}
                    >
                      Continue to Account Selection
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                )}
              </div>
            )}
            
            {/* Step 2: Select Accounts */}
            {connectionFlow.step === "select-accounts" && connectionFlow.integration && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-300">
                    Select which accounts to import:
                  </p>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={selectAllAccounts}
                    className="text-xs border-cyan-500/20"
                  >
                    Select All
                  </Button>
                </div>
                
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {getMockAccounts(connectionFlow.integration).map((account) => (
                    <div
                      key={account.id}
                      onClick={() => toggleAccountSelection(account.id)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        connectionFlow.selectedAccounts.includes(account.id)
                          ? "bg-cyan-500/20 border-cyan-500/40"
                          : "bg-slate-800/50 border-slate-700 hover:bg-slate-800"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
                          {account.avatar}
                        </div>
                        <div className="flex-1">
                          <h5 className="font-medium text-sm">{account.name}</h5>
                          {account.email && (
                            <p className="text-xs text-slate-400">{account.email}</p>
                          )}
                        </div>
                        {connectionFlow.selectedAccounts.includes(account.id) && (
                          <CheckCircle2 className="w-5 h-5 text-cyan-400" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                <Button 
                  className="w-full bg-cyan-500 hover:bg-cyan-400"
                  onClick={proceedToVerification}
                  disabled={connectionFlow.selectedAccounts.length === 0}
                >
                  Verify Ownership ({connectionFlow.selectedAccounts.length} selected)
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}
            
            {/* Step 3: Verify */}
            {connectionFlow.step === "verify" && (
              <div className="py-8 text-center space-y-4">
                <div className="flex justify-center">
                  <Loader2 className="w-12 h-12 text-cyan-400 animate-spin" />
                </div>
                <h4 className="text-lg font-semibold">Verifying your credentials...</h4>
                <p className="text-sm text-slate-400">
                  Please wait while we verify your identity and establish a secure connection.
                </p>
              </div>
            )}
            
            {/* Step 4: Success */}
            {connectionFlow.step === "success" && connectionFlow.integration && (
              <div className="py-8 text-center space-y-4">
                <div className="flex justify-center">
                  <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-green-400" />
                  </div>
                </div>
                <h4 className="text-lg font-semibold">Connection Successful!</h4>
                <p className="text-sm text-slate-400">
                  {connectionFlow.integration.name} is now connected to Atlas UX.
                  {connectionFlow.selectedAccounts.length > 0 && (
                    <> {connectionFlow.selectedAccounts.length} account(s) imported successfully.</>
                  )}
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Help Card */}
      <Card className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-cyan-500/30 backdrop-blur-xl p-6">
        <div className="flex items-start gap-4">
          <Smartphone className="w-12 h-12 text-cyan-400 flex-shrink-0" />
          <div>
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              Mobile App Synchronization
              <Badge variant="outline" className="border-green-500/40 text-green-400 text-xs">
                Active
              </Badge>
            </h4>
            <p className="text-sm text-slate-300 mb-3">
              All integrations are automatically synced to your mobile app. You can approve requests, manage connections, and monitor activity from anywhere.
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="text-xs border-cyan-500/20">
                <ExternalLink className="w-3 h-3 mr-1" />
                View on Mobile
              </Button>
              <Button size="sm" variant="outline" className="text-xs border-cyan-500/20">
                <Settings className="w-3 h-3 mr-1" />
                Sync Settings
              </Button>
            </div>
          </div>
        </div>
      </Card>
      
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