import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "jsr:";
import * as kv from "./kv_store.tsx";
import * as apiKeys from "./api-keys.tsx";
import { Integrations } from "./integrations.tsx";
import * as stripe from "./stripe-integration.tsx";
import * as adminAuth from "./admin-auth.tsx";

const app = new Hono();

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Middleware to authenticate user
async function authenticateUser(c: any) {
  const accessToken = c.req.header('Authorization')?.split(' ')[1];
  if (!accessToken) {
    return null;
  }
  
  const { data: { user }, error } = await supabase.auth.getUser(accessToken);
  if (error || !user) {
    return null;
  }
  
  return user.id;
}

// Health check endpoint
app.get("/make-server-cb847823/health", (c) => {
  return c.json({ status: "ok" });
});

// ============================================
// API KEY MANAGEMENT ENDPOINTS
// ============================================

app.post("/make-server-cb847823/api-keys/store", async (c) => {
  const userId = await authenticateUser(c);
  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  try {
    const { service, keyData } = await c.req.json();
    
    if (!apiKeys.validateApiKey(service, keyData)) {
      return c.json({ error: 'Invalid API key structure', required: apiKeys.getServiceRequirements(service) }, 400);
    }
    
    await apiKeys.storeApiKey(userId, service, keyData);
    return c.json({ success: true, message: 'API key stored successfully' });
  } catch (error) {
    console.error('Error storing API key:', error);
    return c.json({ error: error.message }, 500);
  }
});

app.get("/make-server-cb847823/api-keys/list", async (c) => {
  const userId = await authenticateUser(c);
  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  try {
    const keys = await apiKeys.getAllApiKeys(userId);
    // Don't return actual keys, just service names and status
    const sanitized = keys.map(k => ({ service: k.service, configured: true }));
    return c.json({ keys: sanitized });
  } catch (error) {
    console.error('Error listing API keys:', error);
    return c.json({ error: error.message }, 500);
  }
});

app.delete("/make-server-cb847823/api-keys/:service", async (c) => {
  const userId = await authenticateUser(c);
  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  try {
    const service = c.req.param('service');
    await apiKeys.deleteApiKey(userId, service);
    return c.json({ success: true, message: 'API key deleted successfully' });
  } catch (error) {
    console.error('Error deleting API key:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ============================================
// AI INTEGRATION ENDPOINTS
// ============================================

app.post("/make-server-cb847823/ai/chat", async (c) => {
  const userId = await authenticateUser(c);
  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  try {
    const { provider, prompt, options } = await c.req.json();
    
    let response;
    switch (provider) {
      case 'chatgpt':
        response = await Integrations.AI.chatGPT(userId, prompt, options);
        break;
      case 'claude':
        response = await Integrations.AI.claude(userId, prompt, options);
        break;
      case 'deepseek':
        response = await Integrations.AI.deepseek(userId, prompt, options);
        break;
      case 'gemini':
        response = await Integrations.AI.gemini(userId, prompt, options);
        break;
      default:
        return c.json({ error: 'Unsupported AI provider' }, 400);
    }
    
    return c.json({ success: true, response });
  } catch (error) {
    console.error('AI integration error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ============================================
// SOCIAL MEDIA INTEGRATION ENDPOINTS
// ============================================

app.post("/make-server-cb847823/social/post", async (c) => {
  const userId = await authenticateUser(c);
  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  try {
    const { platform, content, options } = await c.req.json();
    
    let response;
    switch (platform) {
      case 'twitter':
        response = await Integrations.Social.postToTwitter(userId, content, options);
        break;
      case 'linkedin':
        response = await Integrations.Social.postToLinkedIn(userId, content, options);
        break;
      case 'facebook':
        response = await Integrations.Social.postToFacebook(userId, content, options);
        break;
      default:
        return c.json({ error: 'Unsupported platform' }, 400);
    }
    
    return c.json({ success: true, response });
  } catch (error) {
    console.error('Social media integration error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ============================================
// CRM INTEGRATION ENDPOINTS
// ============================================

app.get("/make-server-cb847823/crm/:provider/contacts", async (c) => {
  const userId = await authenticateUser(c);
  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  try {
    const provider = c.req.param('provider');
    
    let response;
    switch (provider) {
      case 'hubspot':
        response = await Integrations.CRM.hubspotGetContacts(userId);
        break;
      case 'salesforce':
        response = await Integrations.CRM.salesforceQuery(userId, 'SELECT Id, Name, Email FROM Contact LIMIT 100');
        break;
      case 'zendesk':
        response = await Integrations.CRM.zendeskGetTickets(userId);
        break;
      default:
        return c.json({ error: 'Unsupported CRM provider' }, 400);
    }
    
    return c.json({ success: true, response });
  } catch (error) {
    console.error('CRM integration error:', error);
    return c.json({ error: error.message }, 500);
  }
});

app.post("/make-server-cb847823/crm/:provider/contacts", async (c) => {
  const userId = await authenticateUser(c);
  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  try {
    const provider = c.req.param('provider');
    const contactData = await c.req.json();
    
    let response;
    switch (provider) {
      case 'hubspot':
        response = await Integrations.CRM.hubspotCreateContact(userId, contactData);
        break;
      case 'salesforce':
        response = await Integrations.CRM.salesforceCreateContact(userId, contactData);
        break;
      default:
        return c.json({ error: 'Unsupported CRM provider' }, 400);
    }
    
    return c.json({ success: true, response });
  } catch (error) {
    console.error('CRM integration error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ============================================
// TASK EXECUTION ENDPOINTS (NEPTUNE/PLUTO)
// ============================================

app.post("/make-server-cb847823/tasks/create", async (c) => {
  const userId = await authenticateUser(c);
  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  try {
    const task = await c.req.json();
    const taskId = `task:${userId}:${Date.now()}`;
    
    await kv.set(taskId, JSON.stringify({
      ...task,
      id: taskId,
      userId,
      status: 'pending',
      createdAt: new Date().toISOString(),
    }));
    
    return c.json({ success: true, taskId });
  } catch (error) {
    console.error('Task creation error:', error);
    return c.json({ error: error.message }, 500);
  }
});

app.get("/make-server-cb847823/tasks/pending", async (c) => {
  const userId = await authenticateUser(c);
  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  try {
    const tasks = await kv.getByPrefix(`task:${userId}:`);
    const pendingTasks = tasks
      .map(t => JSON.parse(t))
      .filter(t => t.status === 'pending');
    
    return c.json({ success: true, tasks: pendingTasks });
  } catch (error) {
    console.error('Task fetch error:', error);
    return c.json({ error: error.message }, 500);
  }
});

app.post("/make-server-cb847823/tasks/:taskId/approve", async (c) => {
  const userId = await authenticateUser(c);
  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  try {
    const taskId = c.req.param('taskId');
    const taskData = await kv.get(taskId);
    
    if (!taskData) {
      return c.json({ error: 'Task not found' }, 404);
    }
    
    const task = JSON.parse(taskData);
    
    if (task.userId !== userId) {
      return c.json({ error: 'Unauthorized' }, 403);
    }
    
    // Update task status
    task.status = 'approved';
    task.approvedAt = new Date().toISOString();
    await kv.set(taskId, JSON.stringify(task));
    
    // Execute the task based on type
    let result;
    switch (task.type) {
      case 'file_access':
        result = { success: true, message: 'File access granted' };
        break;
      case 'social_post':
        result = await Integrations.Social.postToTwitter(userId, task.content, task.options);
        break;
      case 'email':
        result = await Integrations.Email.gmailSendEmail(userId, task.to, task.subject, task.body);
        break;
      default:
        result = { success: true, message: 'Task approved' };
    }
    
    // Mark as completed
    task.status = 'completed';
    task.completedAt = new Date().toISOString();
    task.result = result;
    await kv.set(taskId, JSON.stringify(task));
    
    return c.json({ success: true, result });
  } catch (error) {
    console.error('Task approval error:', error);
    return c.json({ error: error.message }, 500);
  }
});

app.post("/make-server-cb847823/tasks/:taskId/deny", async (c) => {
  const userId = await authenticateUser(c);
  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  try {
    const taskId = c.req.param('taskId');
    const taskData = await kv.get(taskId);
    
    if (!taskData) {
      return c.json({ error: 'Task not found' }, 404);
    }
    
    const task = JSON.parse(taskData);
    
    if (task.userId !== userId) {
      return c.json({ error: 'Unauthorized' }, 403);
    }
    
    // Update task status
    task.status = 'denied';
    task.deniedAt = new Date().toISOString();
    await kv.set(taskId, JSON.stringify(task));
    
    return c.json({ success: true, message: 'Task denied' });
  } catch (error) {
    console.error('Task denial error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ============================================
// PLUTO JOB EXECUTION ENDPOINTS
// ============================================

app.post("/make-server-cb847823/jobs/execute", async (c) => {
  const userId = await authenticateUser(c);
  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  try {
    const job = await c.req.json();
    const jobId = `job:${userId}:${Date.now()}`;
    
    // Store job
    await kv.set(jobId, JSON.stringify({
      ...job,
      id: jobId,
      userId,
      status: 'running',
      startedAt: new Date().toISOString(),
    }));
    
    // Execute job based on type
    let result;
    switch (job.type) {
      case 'ai_task':
        result = await Integrations.AI.chatGPT(userId, job.prompt, job.options);
        break;
      case 'social_post':
        result = await Integrations.Social.postToTwitter(userId, job.content, job.options);
        break;
      case 'crm_sync':
        result = await Integrations.CRM.hubspotGetContacts(userId);
        break;
      case 'email_send':
        result = await Integrations.Email.gmailSendEmail(userId, job.to, job.subject, job.body);
        break;
      default:
        result = { success: true, message: 'Job executed' };
    }
    
    // Update job status
    const jobData = JSON.parse(await kv.get(jobId) || '{}');
    jobData.status = 'completed';
    jobData.completedAt = new Date().toISOString();
    jobData.result = result;
    await kv.set(jobId, JSON.stringify(jobData));
    
    return c.json({ success: true, jobId, result });
  } catch (error) {
    console.error('Job execution error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ============================================
// STORAGE INTEGRATION ENDPOINTS
// ============================================

app.get("/make-server-cb847823/storage/:provider/list", async (c) => {
  const userId = await authenticateUser(c);
  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  try {
    const provider = c.req.param('provider');
    
    let response;
    switch (provider) {
      case 'gdrive':
        response = await Integrations.Storage.googleDriveListFiles(userId);
        break;
      case 'dropbox':
        response = await Integrations.Storage.dropboxListFiles(userId);
        break;
      default:
        return c.json({ error: 'Unsupported storage provider' }, 400);
    }
    
    return c.json({ success: true, response });
  } catch (error) {
    console.error('Storage integration error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ============================================
// COMMUNICATION INTEGRATION ENDPOINTS
// ============================================

app.post("/make-server-cb847823/communication/send", async (c) => {
  const userId = await authenticateUser(c);
  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  try {
    const { platform, ...data } = await c.req.json();
    
    let response;
    switch (platform) {
      case 'slack':
        response = await Integrations.Communication.slackSendMessage(userId, data.channel, data.text);
        break;
      case 'discord':
        response = await Integrations.Communication.discordSendMessage(userId, data.webhookUrl, data.content);
        break;
      case 'twilio':
        response = await Integrations.Communication.twilioSendSMS(userId, data.to, data.body);
        break;
      default:
        return c.json({ error: 'Unsupported communication platform' }, 400);
    }
    
    return c.json({ success: true, response });
  } catch (error) {
    console.error('Communication integration error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ============================================
// PROJECT MANAGEMENT INTEGRATION ENDPOINTS
// ============================================

app.get("/make-server-cb847823/pm/:provider/tasks", async (c) => {
  const userId = await authenticateUser(c);
  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  try {
    const provider = c.req.param('provider');
    const projectId = c.req.query('projectId');
    
    let response;
    switch (provider) {
      case 'asana':
        response = await Integrations.ProjectManagement.asanaGetTasks(userId, projectId || '');
        break;
      case 'jira':
        response = await Integrations.ProjectManagement.jiraGetIssues(userId, 'project = ' + projectId);
        break;
      case 'notion':
        response = await Integrations.ProjectManagement.notionQueryDatabase(userId, projectId || '');
        break;
      default:
        return c.json({ error: 'Unsupported PM provider' }, 400);
    }
    
    return c.json({ success: true, response });
  } catch (error) {
    console.error('PM integration error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ============================================
// STRIPE SUBSCRIPTION ENDPOINTS
// ============================================

// Get available plans
app.get("/make-server-cb847823/stripe/plans", async (c) => {
  try {
    const plans = stripe.getAvailablePlans();
    return c.json({ success: true, plans });
  } catch (error) {
    console.error('Error fetching plans:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Create checkout session
app.post("/make-server-cb847823/stripe/checkout", async (c) => {
  const userId = await authenticateUser(c);
  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  try {
    const { priceId, quantity, successUrl, cancelUrl, email, name } = await c.req.json();
    
    // Ensure customer exists
    await stripe.getOrCreateStripeCustomer(userId, email, name);
    
    const session = await stripe.createCheckoutSession(
      userId,
      email,
      priceId,
      quantity || 1,
      successUrl || `${c.req.header('origin')}/subscription?success=true`,
      cancelUrl || `${c.req.header('origin')}/subscription?canceled=true`
    );
    
    return c.json({ success: true, url: session.url, sessionId: session.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Create customer portal session
app.post("/make-server-cb847823/stripe/portal", async (c) => {
  const userId = await authenticateUser(c);
  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  try {
    const { returnUrl } = await c.req.json();
    
    const session = await stripe.createPortalSession(
      userId,
      returnUrl || `${c.req.header('origin')}/subscription`
    );
    
    return c.json({ success: true, url: session.url });
  } catch (error) {
    console.error('Error creating portal session:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Get current subscription
app.get("/make-server-cb847823/stripe/subscription", async (c) => {
  const userId = await authenticateUser(c);
  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  try {
    const subscription = await stripe.getSubscription(userId);
    return c.json({ success: true, subscription });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Update subscription (change plan or quantity)
app.post("/make-server-cb847823/stripe/subscription/update", async (c) => {
  const userId = await authenticateUser(c);
  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  try {
    const { priceId, quantity } = await c.req.json();
    
    const updatedSubscription = await stripe.updateSubscription(
      userId,
      priceId,
      quantity
    );
    
    return c.json({ success: true, subscription: updatedSubscription });
  } catch (error) {
    console.error('Error updating subscription:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Cancel subscription
app.post("/make-server-cb847823/stripe/subscription/cancel", async (c) => {
  const userId = await authenticateUser(c);
  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  try {
    const { immediately } = await c.req.json();
    
    const canceledSubscription = await stripe.cancelSubscription(
      userId,
      immediately || false
    );
    
    return c.json({ success: true, subscription: canceledSubscription });
  } catch (error) {
    console.error('Error canceling subscription:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Get invoices
app.get("/make-server-cb847823/stripe/invoices", async (c) => {
  const userId = await authenticateUser(c);
  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  try {
    const limit = parseInt(c.req.query('limit') || '10');
    const invoices = await stripe.getInvoices(userId, limit);
    return c.json({ success: true, invoices });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Get usage stats
app.get("/make-server-cb847823/stripe/usage", async (c) => {
  const userId = await authenticateUser(c);
  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  try {
    const usage = await stripe.getUsageStats(userId);
    return c.json({ success: true, usage });
  } catch (error) {
    console.error('Error fetching usage stats:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Stripe webhook endpoint (no authentication)
app.post("/make-server-cb847823/webhooks/stripe", async (c) => {
  try {
    const response = await stripe.handleWebhook(c.req.raw);
    return response;
  } catch (error) {
    console.error('Webhook error:', error);
    return c.json({ error: 'Webhook handler failed' }, 400);
  }
});

// ============================================
// ADMIN AUTHENTICATION ENDPOINTS
// ============================================

// Request admin verification code
app.post("/make-server-cb847823/admin/request-code", async (c) => {
  try {
    const { email } = await c.req.json();
    
    if (!email) {
      return c.json({ error: 'Email is required' }, 400);
    }
    
    const result = await adminAuth.requestAdminVerificationCode(email);
    
    if (!result.success) {
      return c.json({ error: result.message }, 400);
    }
    
    return c.json({ success: true, message: result.message });
  } catch (error) {
    console.error('Admin request code error:', error);
    return c.json({ error: 'Failed to send verification code' }, 500);
  }
});

// Verify admin code and get token
app.post("/make-server-cb847823/admin/verify-code", async (c) => {
  try {
    const { email, code } = await c.req.json();
    
    if (!email || !code) {
      return c.json({ error: 'Email and code are required' }, 400);
    }
    
    const result = await adminAuth.verifyAdminCode(email, code);
    
    if (!result.success) {
      return c.json({ error: result.message }, 401);
    }
    
    return c.json({ 
      success: true, 
      token: result.token,
      expiresAt: result.expiresAt,
      message: result.message 
    });
  } catch (error) {
    console.error('Admin verify code error:', error);
    return c.json({ error: 'Verification failed' }, 500);
  }
});

// Get admin info (protected route)
app.get("/make-server-cb847823/admin/info", async (c) => {
  try {
    const token = c.req.header('Authorization')?.split(' ')[1];
    
    if (!token) {
      return c.json({ error: 'Authorization token required' }, 401);
    }
    
    const info = adminAuth.getAdminInfo(token);
    
    if (!info) {
      return c.json({ error: 'Invalid or expired admin token' }, 401);
    }
    
    return c.json({ success: true, admin: info });
  } catch (error) {
    console.error('Admin info error:', error);
    return c.json({ error: 'Failed to get admin info' }, 500);
  }
});

Deno.serve(app.fetch);