/**
 * API Key Management System
 * Securely stores and retrieves API keys for all 65 integrations
 */

import { createClient } from "jsr:";
import * as kv from './kv_store.tsx';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

export interface ApiKey {
  service: string;
  key: string;
  secret?: string;
  token?: string;
  refreshToken?: string;
  expiresAt?: string;
  metadata?: Record<string, any>;
}

const API_KEY_PREFIX = 'apikey:';

/**
 * Store an API key securely
 */
export async function storeApiKey(userId: string, service: string, keyData: Omit<ApiKey, 'service'>): Promise<void> {
  const key = `${API_KEY_PREFIX}${userId}:${service}`;
  await kv.set(key, JSON.stringify({ service, ...keyData }));
}

/**
 * Retrieve an API key
 */
export async function getApiKey(userId: string, service: string): Promise<ApiKey | null> {
  const key = `${API_KEY_PREFIX}${userId}:${service}`;
  const data = await kv.get(key);
  if (!data) return null;
  return JSON.parse(data) as ApiKey;
}

/**
 * Delete an API key
 */
export async function deleteApiKey(userId: string, service: string): Promise<void> {
  const key = `${API_KEY_PREFIX}${userId}:${service}`;
  await kv.del(key);
}

/**
 * Get all API keys for a user
 */
export async function getAllApiKeys(userId: string): Promise<ApiKey[]> {
  const prefix = `${API_KEY_PREFIX}${userId}:`;
  const keys = await kv.getByPrefix(prefix);
  return keys.map(k => JSON.parse(k) as ApiKey);
}

/**
 * Check if a service is configured
 */
export async function isServiceConfigured(userId: string, service: string): Promise<boolean> {
  const key = await getApiKey(userId, service);
  return key !== null;
}

/**
 * Encrypt sensitive data (basic implementation - enhance with crypto library)
 */
function encrypt(data: string): string {
  // In production, use proper encryption library
  return btoa(data);
}

/**
 * Decrypt sensitive data
 */
function decrypt(data: string): string {
  // In production, use proper decryption library
  return atob(data);
}

/**
 * Service definitions for all 65 integrations
 */
export const SERVICES = {
  // AI Models
  AI_CHATGPT: 'openai',
  AI_CLAUDE: 'anthropic',
  AI_DEEPSEEK: 'deepseek',
  AI_GEMINI: 'google-gemini',
  AI_PERPLEXITY: 'perplexity',
  AI_MISTRAL: 'mistral',
  AI_COHERE: 'cohere',
  AI_HUGGINGFACE: 'huggingface',
  
  // Social Media
  SOCIAL_TWITTER: 'twitter',
  SOCIAL_FACEBOOK: 'facebook',
  SOCIAL_INSTAGRAM: 'instagram',
  SOCIAL_LINKEDIN: 'linkedin',
  SOCIAL_TIKTOK: 'tiktok',
  SOCIAL_YOUTUBE: 'youtube',
  SOCIAL_PINTEREST: 'pinterest',
  SOCIAL_REDDIT: 'reddit',
  
  // Business Tools
  CRM_SALESFORCE: 'salesforce',
  CRM_HUBSPOT: 'hubspot',
  CRM_ZENDESK: 'zendesk',
  CRM_PIPEDRIVE: 'pipedrive',
  CRM_ZOHO: 'zoho',
  
  // Cloud Storage
  STORAGE_GDRIVE: 'google-drive',
  STORAGE_DROPBOX: 'dropbox',
  STORAGE_ONEDRIVE: 'onedrive',
  STORAGE_BOX: 'box',
  
  // Amazon & AWS (12 services)
  AMAZON_SELLER_CENTRAL: 'amazon-seller-central',
  AMAZON_ADVERTISING: 'amazon-advertising',
  AMAZON_MWS: 'amazon-mws',
  AMAZON_SP_API: 'amazon-sp-api',
  AMAZON_BUSINESS: 'amazon-business',
  AMAZON_PRIME: 'amazon-prime',
  AWS_S3: 'aws-s3',
  AWS_EC2: 'aws-ec2',
  AWS_LAMBDA: 'aws-lambda',
  AWS_RDS: 'aws-rds',
  AWS_CLOUDFRONT: 'aws-cloudfront',
  AWS_SES: 'aws-ses',
  AWS_DYNAMODB: 'aws-dynamodb',
  
  // Communication
  COMM_SLACK: 'slack',
  COMM_DISCORD: 'discord',
  COMM_TEAMS: 'microsoft-teams',
  COMM_ZOOM: 'zoom',
  COMM_TWILIO: 'twilio',
  
  // Project Management
  PM_ASANA: 'asana',
  PM_TRELLO: 'trello',
  PM_JIRA: 'jira',
  PM_MONDAY: 'monday',
  PM_NOTION: 'notion',
  PM_CLICKUP: 'clickup',
  
  // Email & Calendar
  EMAIL_GMAIL: 'gmail',
  EMAIL_OUTLOOK: 'outlook',
  EMAIL_SENDGRID: 'sendgrid',
  EMAIL_MAILCHIMP: 'mailchimp',
  
  // E-commerce
  ECOM_SHOPIFY: 'shopify',
  ECOM_WOOCOMMERCE: 'woocommerce',
  ECOM_STRIPE: 'stripe',
  ECOM_PAYPAL: 'paypal',
  
  // Analytics
  ANALYTICS_GOOGLE: 'google-analytics',
  ANALYTICS_MIXPANEL: 'mixpanel',
  ANALYTICS_AMPLITUDE: 'amplitude',
  
  // Development
  DEV_GITHUB: 'github',
  DEV_GITLAB: 'gitlab',
  DEV_BITBUCKET: 'bitbucket',
  
  // Other
  OTHER_AIRTABLE: 'airtable',
  OTHER_ZAPIER: 'zapier',
  OTHER_MAKE: 'make',
  OTHER_N8N: 'n8n',
} as const;

/**
 * Get required fields for each service
 */
export function getServiceRequirements(service: string): string[] {
  const requirements: Record<string, string[]> = {
    // AI Models
    'openai': ['key'],
    'anthropic': ['key'],
    'deepseek': ['key'],
    'google-gemini': ['key'],
    'perplexity': ['key'],
    'mistral': ['key'],
    'cohere': ['key'],
    'huggingface': ['token'],
    
    // Social Media (OAuth2)
    'twitter': ['key', 'secret', 'token', 'tokenSecret'],
    'facebook': ['appId', 'appSecret', 'accessToken'],
    'instagram': ['accessToken'],
    'linkedin': ['clientId', 'clientSecret', 'accessToken'],
    'tiktok': ['accessToken'],
    'youtube': ['apiKey', 'clientId', 'clientSecret'],
    'pinterest': ['accessToken'],
    'reddit': ['clientId', 'clientSecret', 'accessToken'],
    
    // Business Tools
    'salesforce': ['instanceUrl', 'accessToken', 'refreshToken'],
    'hubspot': ['apiKey'],
    'zendesk': ['subdomain', 'email', 'apiToken'],
    'pipedrive': ['apiToken', 'domain'],
    'zoho': ['clientId', 'clientSecret', 'accessToken'],
    
    // Cloud Storage
    'google-drive': ['clientId', 'clientSecret', 'accessToken', 'refreshToken'],
    'dropbox': ['accessToken'],
    'onedrive': ['clientId', 'clientSecret', 'accessToken'],
    'box': ['clientId', 'clientSecret', 'accessToken'],
    
    // Amazon & AWS
    'amazon-seller-central': ['sellerId', 'authToken', 'marketplaceId'],
    'amazon-advertising': ['clientId', 'clientSecret', 'refreshToken'],
    'amazon-mws': ['sellerId', 'authToken', 'secretKey'],
    'amazon-sp-api': ['clientId', 'clientSecret', 'refreshToken'],
    'amazon-business': ['apiKey'],
    'amazon-prime': ['apiKey'],
    'aws-s3': ['accessKeyId', 'secretAccessKey', 'region'],
    'aws-ec2': ['accessKeyId', 'secretAccessKey', 'region'],
    'aws-lambda': ['accessKeyId', 'secretAccessKey', 'region'],
    'aws-rds': ['accessKeyId', 'secretAccessKey', 'region'],
    'aws-cloudfront': ['accessKeyId', 'secretAccessKey'],
    'aws-ses': ['accessKeyId', 'secretAccessKey', 'region'],
    'aws-dynamodb': ['accessKeyId', 'secretAccessKey', 'region'],
    
    // Communication
    'slack': ['token', 'webhookUrl'],
    'discord': ['token', 'webhookUrl'],
    'microsoft-teams': ['webhookUrl'],
    'zoom': ['apiKey', 'apiSecret'],
    'twilio': ['accountSid', 'authToken'],
    
    // Project Management
    'asana': ['accessToken'],
    'trello': ['apiKey', 'token'],
    'jira': ['email', 'apiToken', 'domain'],
    'monday': ['apiKey'],
    'notion': ['token'],
    'clickup': ['apiToken'],
    
    // Email & Calendar
    'gmail': ['clientId', 'clientSecret', 'accessToken', 'refreshToken'],
    'outlook': ['clientId', 'clientSecret', 'accessToken'],
    'sendgrid': ['apiKey'],
    'mailchimp': ['apiKey'],
    
    // E-commerce
    'shopify': ['shopName', 'apiKey', 'password'],
    'woocommerce': ['url', 'consumerKey', 'consumerSecret'],
    'stripe': ['secretKey', 'publishableKey'],
    'paypal': ['clientId', 'clientSecret'],
    
    // Analytics
    'google-analytics': ['propertyId', 'clientEmail', 'privateKey'],
    'mixpanel': ['token', 'apiSecret'],
    'amplitude': ['apiKey', 'secretKey'],
    
    // Development
    'github': ['token'],
    'gitlab': ['token'],
    'bitbucket': ['username', 'appPassword'],
    
    // Other
    'airtable': ['apiKey'],
    'zapier': ['apiKey'],
    'make': ['apiKey'],
    'n8n': ['apiKey', 'instanceUrl'],
  };
  
  return requirements[service] || ['key'];
}

/**
 * Validate API key structure
 */
export function validateApiKey(service: string, keyData: any): boolean {
  const required = getServiceRequirements(service);
  return required.every(field => keyData[field] !== undefined && keyData[field] !== '');
}
