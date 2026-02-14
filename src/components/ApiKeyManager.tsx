import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { toast } from "sonner";
import {
  Key,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  Trash2,
  Save,
  Cloud,
  Bot,
  MessageSquare,
  Database,
  Mail,
  ShoppingCart,
  Code,
  Users,
} from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface ServiceConfig {
  [key: string]: string;
}

const serviceCategories = {
  'AI Models': {
    icon: Bot,
    services: [
      { id: 'openai', name: 'ChatGPT (OpenAI)', fields: ['key'] },
      { id: 'anthropic', name: 'Claude (Anthropic)', fields: ['key'] },
      { id: 'deepseek', name: 'Deepseek', fields: ['key'] },
      { id: 'google-gemini', name: 'Google Gemini', fields: ['key'] },
      { id: 'perplexity', name: 'Perplexity', fields: ['key'] },
      { id: 'mistral', name: 'Mistral AI', fields: ['key'] },
      { id: 'cohere', name: 'Cohere', fields: ['key'] },
      { id: 'huggingface', name: 'Hugging Face', fields: ['token'] },
    ],
  },
  'Social Media': {
    icon: MessageSquare,
    services: [
      { id: 'twitter', name: 'Twitter/X', fields: ['key', 'secret', 'token', 'tokenSecret'] },
      { id: 'facebook', name: 'Facebook', fields: ['appId', 'appSecret', 'accessToken'] },
      { id: 'instagram', name: 'Instagram', fields: ['accessToken'] },
      { id: 'linkedin', name: 'LinkedIn', fields: ['clientId', 'clientSecret', 'accessToken'] },
      { id: 'tiktok', name: 'TikTok', fields: ['accessToken'] },
      { id: 'youtube', name: 'YouTube', fields: ['apiKey', 'clientId', 'clientSecret'] },
      { id: 'pinterest', name: 'Pinterest', fields: ['accessToken'] },
      { id: 'reddit', name: 'Reddit', fields: ['clientId', 'clientSecret', 'accessToken'] },
    ],
  },
  'CRM & Business': {
    icon: Users,
    services: [
      { id: 'salesforce', name: 'Salesforce', fields: ['instanceUrl', 'accessToken', 'refreshToken'] },
      { id: 'hubspot', name: 'HubSpot', fields: ['apiKey'] },
      { id: 'zendesk', name: 'Zendesk', fields: ['subdomain', 'email', 'apiToken'] },
      { id: 'pipedrive', name: 'Pipedrive', fields: ['apiToken', 'domain'] },
      { id: 'zoho', name: 'Zoho CRM', fields: ['clientId', 'clientSecret', 'accessToken'] },
    ],
  },
  'Cloud Storage': {
    icon: Cloud,
    services: [
      { id: 'google-drive', name: 'Google Drive', fields: ['clientId', 'clientSecret', 'accessToken', 'refreshToken'] },
      { id: 'dropbox', name: 'Dropbox', fields: ['accessToken'] },
      { id: 'onedrive', name: 'OneDrive', fields: ['clientId', 'clientSecret', 'accessToken'] },
      { id: 'box', name: 'Box', fields: ['clientId', 'clientSecret', 'accessToken'] },
    ],
  },
  'E-commerce': {
    icon: ShoppingCart,
    services: [
      { id: 'shopify', name: 'Shopify', fields: ['shopName', 'apiKey', 'password'] },
      { id: 'woocommerce', name: 'WooCommerce', fields: ['url', 'consumerKey', 'consumerSecret'] },
      { id: 'stripe', name: 'Stripe', fields: ['secretKey', 'publishableKey'] },
      { id: 'paypal', name: 'PayPal', fields: ['clientId', 'clientSecret'] },
    ],
  },
  'AWS & Amazon': {
    icon: Database,
    services: [
      { id: 'aws-s3', name: 'AWS S3', fields: ['accessKeyId', 'secretAccessKey', 'region'] },
      { id: 'aws-ec2', name: 'AWS EC2', fields: ['accessKeyId', 'secretAccessKey', 'region'] },
      { id: 'aws-lambda', name: 'AWS Lambda', fields: ['accessKeyId', 'secretAccessKey', 'region'] },
      { id: 'aws-rds', name: 'AWS RDS', fields: ['accessKeyId', 'secretAccessKey', 'region'] },
      { id: 'aws-ses', name: 'AWS SES', fields: ['accessKeyId', 'secretAccessKey', 'region'] },
      { id: 'aws-dynamodb', name: 'AWS DynamoDB', fields: ['accessKeyId', 'secretAccessKey', 'region'] },
      { id: 'amazon-seller-central', name: 'Amazon Seller Central', fields: ['sellerId', 'authToken', 'marketplaceId'] },
      { id: 'amazon-sp-api', name: 'Amazon SP-API', fields: ['clientId', 'clientSecret', 'refreshToken'] },
    ],
  },
  'Communication': {
    icon: Mail,
    services: [
      { id: 'slack', name: 'Slack', fields: ['token', 'webhookUrl'] },
      { id: 'discord', name: 'Discord', fields: ['token', 'webhookUrl'] },
      { id: 'microsoft-teams', name: 'Microsoft Teams', fields: ['webhookUrl'] },
      { id: 'twilio', name: 'Twilio', fields: ['accountSid', 'authToken'] },
      { id: 'gmail', name: 'Gmail', fields: ['clientId', 'clientSecret', 'accessToken', 'refreshToken'] },
      { id: 'sendgrid', name: 'SendGrid', fields: ['apiKey'] },
    ],
  },
  'Project Management': {
    icon: Code,
    services: [
      { id: 'asana', name: 'Asana', fields: ['accessToken'] },
      { id: 'trello', name: 'Trello', fields: ['apiKey', 'token'] },
      { id: 'jira', name: 'Jira', fields: ['email', 'apiToken', 'domain'] },
      { id: 'monday', name: 'Monday.com', fields: ['apiKey'] },
      { id: 'notion', name: 'Notion', fields: ['token'] },
      { id: 'clickup', name: 'ClickUp', fields: ['apiToken'] },
      { id: 'github', name: 'GitHub', fields: ['token'] },
      { id: 'gitlab', name: 'GitLab', fields: ['token'] },
    ],
  },
};

export function ApiKeyManager() {
  const [configuredServices, setConfiguredServices] = useState<Set<string>>(new Set());
  const [editingService, setEditingService] = useState<string | null>(null);
  const [serviceData, setServiceData] = useState<ServiceConfig>({});
  const [showPassword, setShowPassword] = useState<{ [key: string]: boolean }>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadConfiguredServices();
  }, []);

  const loadConfiguredServices = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-cb847823/api-keys/list`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const services = new Set(data.keys.map((k: any) => k.service));
        setConfiguredServices(services);
      }
    } catch (error) {
      console.error('Error loading configured services:', error);
    }
  };

  const handleSaveService = async (serviceId: string) => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-cb847823/api-keys/store`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            service: serviceId,
            keyData: serviceData,
          }),
        }
      );

      if (response.ok) {
        toast.success(`${serviceId} configured successfully!`);
        setConfiguredServices(prev => new Set([...prev, serviceId]));
        setEditingService(null);
        setServiceData({});
      } else {
        const error = await response.json();
        toast.error(`Failed to configure ${serviceId}: ${error.error}`);
      }
    } catch (error) {
      console.error('Error saving service:', error);
      toast.error('Failed to save API keys');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-cb847823/api-keys/${serviceId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        toast.success(`${serviceId} removed successfully!`);
        setConfiguredServices(prev => {
          const newSet = new Set(prev);
          newSet.delete(serviceId);
          return newSet;
        });
      }
    } catch (error) {
      console.error('Error deleting service:', error);
      toast.error('Failed to remove API keys');
    }
  };

  const renderServiceCard = (service: any, CategoryIcon: any) => {
    const isConfigured = configuredServices.has(service.id);
    const isEditing = editingService === service.id;

    return (
      <Card
        key={service.id}
        className={`p-4 transition-all ${
          isConfigured
            ? 'bg-green-500/10 border-green-500/40'
            : 'bg-slate-800/50 border-slate-700/40'
        }`}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg ${
              isConfigured ? 'bg-green-500/20' : 'bg-slate-700/50'
            } flex items-center justify-center`}>
              <CategoryIcon className={`w-5 h-5 ${
                isConfigured ? 'text-green-400' : 'text-slate-400'
              }`} />
            </div>
            <div>
              <h4 className="font-medium text-white">{service.name}</h4>
              <p className="text-xs text-slate-400">{service.id}</p>
            </div>
          </div>
          {isConfigured && (
            <Badge className="bg-green-500 text-white">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Connected
            </Badge>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-3">
            {service.fields.map((field: string) => (
              <div key={field}>
                <Label className="text-xs text-slate-300 mb-1">{field}</Label>
                <div className="relative">
                  <Input
                    type={showPassword[field] ? 'text' : 'password'}
                    placeholder={`Enter ${field}`}
                    value={serviceData[field] || ''}
                    onChange={(e) =>
                      setServiceData({ ...serviceData, [field]: e.target.value })
                    }
                    className="bg-slate-900/50 border-slate-700 pr-10"
                  />
                  <button
                    onClick={() =>
                      setShowPassword({ ...showPassword, [field]: !showPassword[field] })
                    }
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showPassword[field] ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            ))}
            <div className="flex gap-2 mt-4">
              <Button
                onClick={() => handleSaveService(service.id)}
                disabled={loading}
                className="flex-1 bg-cyan-500 hover:bg-cyan-400"
              >
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
              <Button
                onClick={() => {
                  setEditingService(null);
                  setServiceData({});
                }}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button
              onClick={() => setEditingService(service.id)}
              variant="outline"
              className="flex-1"
            >
              <Key className="w-4 h-4 mr-2" />
              {isConfigured ? 'Update' : 'Configure'}
            </Button>
            {isConfigured && (
              <Button
                onClick={() => handleDeleteService(service.id)}
                variant="outline"
                className="border-red-500/40 text-red-400 hover:bg-red-500/10"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        )}
      </Card>
    );
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">API Key Management</h2>
        <p className="text-slate-400">
          Configure your integrations to enable live functionality for all 65 services
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <Card className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-cyan-500/30 p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{configuredServices.size}</div>
              <div className="text-xs text-slate-400">Services Connected</div>
            </div>
          </div>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/30 p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <Key className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">
                {Object.keys(serviceCategories).reduce((sum, cat) => sum + serviceCategories[cat as keyof typeof serviceCategories].services.length, 0)}
              </div>
              <div className="text-xs text-slate-400">Total Integrations</div>
            </div>
          </div>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/30 p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
              <Bot className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">
                {configuredServices.size > 0 ? 'Live' : 'Demo'}
              </div>
              <div className="text-xs text-slate-400">Current Mode</div>
            </div>
          </div>
        </Card>
      </div>

      <Tabs defaultValue={Object.keys(serviceCategories)[0]} className="w-full">
        <TabsList className="bg-slate-800/50 mb-4 flex-wrap h-auto">
          {Object.entries(serviceCategories).map(([category, data]) => {
            const Icon = data.icon;
            const categoryServices = data.services.map(s => s.id);
            const connectedCount = categoryServices.filter(s => configuredServices.has(s)).length;
            
            return (
              <TabsTrigger key={category} value={category} className="gap-2">
                <Icon className="w-4 h-4" />
                {category}
                {connectedCount > 0 && (
                  <Badge className="ml-2 bg-green-500 text-white px-1.5 py-0 text-xs">
                    {connectedCount}
                  </Badge>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {Object.entries(serviceCategories).map(([category, data]) => (
          <TabsContent key={category} value={category}>
            <ScrollArea className="h-[600px] pr-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.services.map(service => renderServiceCard(service, data.icon))}
              </div>
            </ScrollArea>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
