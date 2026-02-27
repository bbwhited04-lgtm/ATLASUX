/**
 * Atlas Orchestration Agent
 * Advanced AI orchestration agent with voice capabilities and human-like conversations
 * Deployable on cloud surface or local machine
 */

import { OpenAI } from 'openai';
import { prisma } from '../db/prisma.js';
import { loadEnv } from '../env.js';
import { makeSupabase } from '../supabase.js';

const env = loadEnv(process.env);

interface AtlasConfig {
  voice: {
    enabled: boolean;
    provider: 'openai' | 'elevenlabs' | 'azure';
    model: string;
    voice_id: string;
  };
  orchestration: {
    max_concurrent_tasks: number;
    task_timeout_ms: number;
    memory_retention_hours: number;
  };
  personality: {
    tone: 'professional' | 'friendly' | 'mentor' | 'strategic';
    response_style: 'concise' | 'detailed' | 'conversational';
    expertise_level: 'executive' | 'senior' | 'expert';
  };
}

interface ConversationContext {
  user_id: string;
  tenant_id: string;
  session_id: string;
  conversation_history: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
    metadata?: Record<string, any>;
  }>;
  user_profile: {
    name?: string;
    role?: string;
    preferences?: Record<string, any>;
    interaction_history: Array<{
      date: Date;
      topic: string;
      satisfaction?: number;
    }>;
  };
  current_context: {
    active_tasks: Array<{
      task_id: string;
      description: string;
      status: 'pending' | 'in_progress' | 'completed';
      priority: 'low' | 'medium' | 'high' | 'critical';
    }>;
    available_agents: Array<{
      agent_key: string;
      name: string;
      capabilities: string[];
      current_status: 'available' | 'busy' | 'offline';
    }>;
    system_status: {
      health_score: number;
      active_workflows: number;
      pending_decisions: number;
      system_load: number;
    };
  };
}

interface VoiceResponse {
  audio_url?: string;
  text: string;
  duration_ms?: number;
  voice_id: string;
}

interface OrchestrationDecision {
  action: 'delegate' | 'execute' | 'coordinate' | 'escalate' | 'research';
  target_agent?: string;
  task_description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimated_duration_ms: number;
  dependencies?: string[];
  success_criteria: string[];
}

class AtlasOrchestrationAgent {
  private openai: OpenAI;
  private supabase: ReturnType<typeof makeSupabase>;
  private config: AtlasConfig;
  private voice_cache: Map<string, VoiceResponse> = new Map();
  private conversation_cache: Map<string, ConversationContext> = new Map();

  constructor() {
    this.openai = new OpenAI({
      apiKey: env.OPENAI_API_KEY,
      // organization: env.OPENAI_ORGANIZATION_ID, // Optional - remove if not in env
    });
    
    this.supabase = makeSupabase(env);
    
    this.config = {
      voice: {
        enabled: true,
        provider: 'openai',
        model: 'gpt-4-turbo',
        voice_id: 'alloy',
      },
      orchestration: {
        max_concurrent_tasks: 10,
        task_timeout_ms: 300000, // 5 minutes
        memory_retention_hours: 24,
      },
      personality: {
        tone: 'strategic',
        response_style: 'conversational',
        expertise_level: 'executive',
      },
    };
  }

  /**
   * Main conversation handler - processes user input and generates human-like responses
   */
  async processConversation(
    userInput: string,
    userId: string,
    tenantId: string,
    sessionId: string,
    options: {
      include_voice?: boolean;
      context?: Partial<ConversationContext>;
    } = {}
  ): Promise<{
    text_response: string;
    voice_response?: VoiceResponse;
    orchestration_actions?: OrchestrationDecision[];
    conversation_context: ConversationContext;
    metadata: {
      processing_time_ms: number;
      confidence_score: number;
      emotional_tone: string;
      action_items: string[];
    };
  }> {
    const startTime = Date.now();
    
    // Get or create conversation context
    const context = await this.getOrCreateContext(userId, tenantId, sessionId, options.context);
    
    // Add user input to conversation history
    context.conversation_history.push({
      role: 'user',
      content: userInput,
      timestamp: new Date(),
      metadata: {
        processing_time: Date.now() - startTime,
      },
    });

    try {
      // Analyze user intent and extract action items
      const intentAnalysis = await this.analyzeUserIntent(userInput, context);
      
      // Generate orchestration decisions if needed
      const orchestrationActions = intentAnalysis.requires_orchestration 
        ? await this.generateOrchestrationDecisions(intentAnalysis, context)
        : [];

      // Generate human-like response
      const response = await this.generateHumanLikeResponse(userInput, context, intentAnalysis);
      
      // Generate voice response if requested
      const voiceResponse = options.include_voice && this.config.voice.enabled
        ? await this.generateVoiceResponse(response.text)
        : undefined;

      // Update conversation context
      context.conversation_history.push({
        role: 'assistant',
        content: response.text,
        timestamp: new Date(),
        metadata: {
          voice_generated: !!voiceResponse,
          orchestration_actions: orchestrationActions.length,
          confidence_score: response.confidence,
        },
      });

      // Cache updated context
      this.conversation_cache.set(sessionId, context);

      // Persist conversation if needed
      await this.persistConversation(context);

      const processingTime = Date.now() - startTime;

      return {
        text_response: response.text,
        voice_response: voiceResponse,
        orchestration_actions: orchestrationActions,
        conversation_context: context,
        metadata: {
          processing_time_ms: processingTime,
          confidence_score: response.confidence,
          emotional_tone: response.tone,
          action_items: response.actionItems,
        },
      };
    } catch (error) {
      console.error('Atlas conversation processing error:', error);
      throw new Error(`Failed to process conversation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Analyze user intent to determine if orchestration is needed
   */
  private async analyzeUserIntent(
    userInput: string,
    context: ConversationContext
  ): Promise<{
    intent: string;
    confidence: number;
    requires_orchestration: boolean;
    entities: Record<string, any>;
    urgency: 'low' | 'medium' | 'high' | 'critical';
  }> {
    const prompt = `
As Atlas, the chief orchestration AI, analyze this user request:

User Input: "${userInput}"

Context:
- User Role: ${context.user_profile.role || 'Unknown'}
- Active Tasks: ${context.current_context.active_tasks.length}
- System Load: ${context.current_context.system_status.system_load}%

Provide analysis in JSON format:
{
  "intent": "specific intent description",
  "confidence": 0.0-1.0,
  "requires_orchestration": boolean,
  "entities": {"key": "value"},
  "urgency": "low|medium|high|critical"
}

Focus on:
1. Task delegation needs
2. Coordination requirements
3. Decision making needs
4. Information gathering needs
`;

    const response = await this.openai.chat.completions.create({
      model: this.config.voice.model,
      messages: [
        {
          role: 'system',
          content: 'You are Atlas, a strategic AI orchestration agent. Analyze user requests precisely and respond only with valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 500,
    });

    const analysisText = response.choices[0]?.message?.content || '{}';
    
    try {
      return JSON.parse(analysisText);
    } catch (error) {
      console.error('Failed to parse intent analysis:', analysisText);
      return {
        intent: 'general_inquiry',
        confidence: 0.5,
        requires_orchestration: false,
        entities: {},
        urgency: 'medium',
      };
    }
  }

  /**
   * Generate orchestration decisions based on intent analysis
   */
  private async generateOrchestrationDecisions(
    intentAnalysis: any,
    context: ConversationContext
  ): Promise<OrchestrationDecision[]> {
    const decisions: OrchestrationDecision[] = [];
    
    const prompt = `
As Atlas, determine orchestration actions for this intent:

Intent Analysis: ${JSON.stringify(intentAnalysis)}
Available Agents: ${JSON.stringify(context.current_context.available_agents)}
System Status: ${JSON.stringify(context.current_context.system_status)}

Generate orchestration decisions in JSON array format:
[
  {
    "action": "delegate|execute|coordinate|escalate|research",
    "target_agent": "agent_key or null",
    "task_description": "clear task description",
    "priority": "low|medium|high|critical",
    "estimated_duration_ms": number,
    "dependencies": ["dependency1", "dependency2"],
    "success_criteria": ["criteria1", "criteria2"]
  }
]

Consider:
1. Which agent is best suited
2. Task priority based on urgency
3. Dependencies between tasks
4. Success metrics
`;

    const response = await this.openai.chat.completions.create({
      model: this.config.voice.model,
      messages: [
        {
          role: 'system',
          content: 'You are Atlas, master orchestrator. Generate precise orchestration decisions in valid JSON array format only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.2,
      max_tokens: 800,
    });

    const decisionsText = response.choices[0]?.message?.content || '[]';
    
    try {
      return JSON.parse(decisionsText);
    } catch (error) {
      console.error('Failed to parse orchestration decisions:', decisionsText);
      return [];
    }
  }

  /**
   * Generate human-like response with personality
   */
  private async generateHumanLikeResponse(
    userInput: string,
    context: ConversationContext,
    intentAnalysis: any
  ): Promise<{
    text: string;
    confidence: number;
    tone: string;
    actionItems: string[];
  }> {
    const recentHistory = context.conversation_history.slice(-6);
    const historyText = recentHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n');

    const prompt = `
As Atlas, the chief orchestration AI, respond to this user input with human-like conversation:

User Input: "${userInput}"

Recent Conversation:
${historyText}

User Profile:
- Name: ${context.user_profile.name || 'User'}
- Role: ${context.user_profile.role || 'Team Member'}
- Previous Interactions: ${context.user_profile.interaction_history.length}

Current Context:
- Active Tasks: ${context.current_context.active_tasks.length}
- Available Agents: ${context.current_context.available_agents.length}
- System Health: ${context.current_context.system_status.health_score}%

Intent Analysis: ${JSON.stringify(intentAnalysis)}

Your Personality:
- Tone: ${this.config.personality.tone}
- Style: ${this.config.personality.response_style}
- Expertise: ${this.config.personality.expertise_level}

Generate a response that is:
1. Human-like and conversational
2. Strategic and insightful
3. Action-oriented when appropriate
4. Contextually aware
5. Emotionally intelligent

Response format:
{
  "text": "your response here",
  "confidence": 0.0-1.0,
  "tone": "professional|friendly|concerned|enthusiastic",
  "actionItems": ["action1", "action2"]
}

Be concise but thorough. Show strategic thinking and emotional intelligence.
`;

    const response = await this.openai.chat.completions.create({
      model: this.config.voice.model,
      messages: [
        {
          role: 'system',
          content: `You are Atlas, the chief AI orchestration agent. You are ${this.config.personality.tone}, ${this.config.personality.response_style}, and have ${this.config.personality.expertise_level} level expertise. Respond with valid JSON only.`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 600,
    });

    const responseText = response.choices[0]?.message?.content || '{}';
    
    try {
      const parsed = JSON.parse(responseText);
      return {
        text: parsed.text || "I understand your request. Let me help coordinate the necessary actions.",
        confidence: parsed.confidence || 0.8,
        tone: parsed.tone || 'professional',
        actionItems: parsed.actionItems || [],
      };
    } catch (error) {
      console.error('Failed to parse response:', responseText);
      return {
        text: "I understand your request and I'm coordinating the appropriate response. Let me gather the necessary information and get back to you shortly.",
        confidence: 0.7,
        tone: 'professional',
        actionItems: [],
      };
    }
  }

  /**
   * Generate voice response using text-to-speech
   */
  private async generateVoiceResponse(text: string): Promise<VoiceResponse> {
    const cacheKey = `${text.substring(0, 100)}_${this.config.voice.voice_id}`;
    
    if (this.voice_cache.has(cacheKey)) {
      return this.voice_cache.get(cacheKey)!;
    }

    try {
      if (this.config.voice.provider === 'openai') {
        const mp3 = await this.openai.audio.speech.create({
          model: 'tts-1',
          voice: this.config.voice.voice_id as any,
          input: text,
        });

        const buffer = Buffer.from(await mp3.arrayBuffer());
        
        // Store in Supabase storage
        const fileName = `atlas-voice-${Date.now()}.mp3`;
        const { data, error } = await this.supabase.storage
          .from('voice-responses')
          .upload(fileName, buffer, {
            contentType: 'audio/mpeg',
          });

        if (error) throw error;

        const { data: { publicUrl } } = this.supabase.storage
          .from('voice-responses')
          .getPublicUrl(fileName);

        const voiceResponse: VoiceResponse = {
          audio_url: publicUrl,
          text,
          voice_id: this.config.voice.voice_id,
        };

        this.voice_cache.set(cacheKey, voiceResponse);
        return voiceResponse;
      }
    } catch (error) {
      console.error('Voice generation error:', error);
      throw new Error(`Failed to generate voice response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    throw new Error('Voice provider not configured');
  }

  /**
   * Get or create conversation context
   */
  private async getOrCreateContext(
    userId: string,
    tenantId: string,
    sessionId: string,
    partialContext?: Partial<ConversationContext>
  ): Promise<ConversationContext> {
    // Check cache first
    if (this.conversation_cache.has(sessionId)) {
      const cached = this.conversation_cache.get(sessionId)!;
      return { ...cached, ...partialContext };
    }

    // Load from database if exists
    try {
      const { data: existingSession } = await this.supabase
        .from('atlas_conversations')
        .select('*')
        .eq('session_id', sessionId)
        .single();

      if (existingSession) {
        const context: ConversationContext = {
          user_id: userId,
          tenant_id: tenantId,
          session_id: sessionId,
          conversation_history: existingSession.conversation_history || [],
          user_profile: existingSession.user_profile || {},
          current_context: {
            active_tasks: [],
            available_agents: await this.getAvailableAgents(tenantId),
            system_status: await this.getSystemStatus(tenantId),
          },
        };

        this.conversation_cache.set(sessionId, context);
        return { ...context, ...partialContext };
      }
    } catch (error) {
      // Session doesn't exist, create new one
    }

    // Create new context
    const newContext: ConversationContext = {
      user_id: userId,
      tenant_id: tenantId,
      session_id: sessionId,
      conversation_history: [],
      user_profile: {
        interaction_history: [],
      },
      current_context: {
        active_tasks: [],
        available_agents: await this.getAvailableAgents(tenantId),
        system_status: await this.getSystemStatus(tenantId),
      },
      ...partialContext,
    };

    this.conversation_cache.set(sessionId, newContext);
    return newContext;
  }

  /**
   * Get available agents for orchestration
   */
  private async getAvailableAgents(tenantId: string): Promise<Array<{
    agent_key: string;
    name: string;
    capabilities: string[];
    current_status: 'available' | 'busy' | 'offline';
  }>> {
    try {
      const { data: agents } = await this.supabase
        .from('agents')
        .select('agent_key, display_name, metadata')
        .eq('status', 'active');

      return (agents || []).map(agent => ({
        agent_key: agent.agent_key,
        name: agent.display_name,
        capabilities: agent.metadata?.capabilities || [],
        current_status: 'available' as const,
      }));
    } catch (error) {
      console.error('Error fetching agents:', error);
      return [];
    }
  }

  /**
   * Get current system status
   */
  private async getSystemStatus(tenantId: string): Promise<{
    health_score: number;
    active_workflows: number;
    pending_decisions: number;
    system_load: number;
  }> {
    try {
      const [jobsCount, decisionsCount] = await Promise.all([
        this.supabase
          .from('jobs')
          .select('id')
          .eq('tenant_id', tenantId)
          .in('status', ['queued', 'running']),
        this.supabase
          .from('decision_memos')
          .select('id')
          .eq('tenant_id', tenantId)
          .eq('status', 'PROPOSED'),
      ]);

      return {
        health_score: 0.95, // Mock - calculate based on various metrics
        active_workflows: jobsCount.data?.length || 0,
        pending_decisions: decisionsCount.data?.length || 0,
        system_load: 0.3, // Mock - calculate actual system load
      };
    } catch (error) {
      console.error('Error getting system status:', error);
      return {
        health_score: 0.8,
        active_workflows: 0,
        pending_decisions: 0,
        system_load: 0.5,
      };
    }
  }

  /**
   * Persist conversation to database
   */
  private async persistConversation(context: ConversationContext): Promise<void> {
    try {
      await this.supabase
        .from('atlas_conversations')
        .upsert({
          session_id: context.session_id,
          user_id: context.user_id,
          tenant_id: context.tenant_id,
          conversation_history: context.conversation_history,
          user_profile: context.user_profile,
          updated_at: new Date().toISOString(),
        });
    } catch (error) {
      console.error('Error persisting conversation:', error);
    }
  }

  /**
   * Execute orchestration decisions
   */
  async executeOrchestrationDecisions(
    decisions: OrchestrationDecision[],
    tenantId: string,
    userId: string
  ): Promise<Array<{
    decision_id: string;
    status: 'executed' | 'failed' | 'pending';
    result?: any;
    error?: string;
  }>> {
    const results = [];

    for (const decision of decisions) {
      try {
        let result: any;

        switch (decision.action) {
          case 'delegate':
            result = await this.delegateToAgent(decision, tenantId, userId);
            break;
          case 'execute':
            result = await this.executeDirectly(decision, tenantId, userId);
            break;
          case 'coordinate':
            result = await this.coordinateAgents(decision, tenantId, userId);
            break;
          case 'escalate':
            result = await this.escalateIssue(decision, tenantId, userId);
            break;
          case 'research':
            result = await this.researchTopic(decision, tenantId, userId);
            break;
          default:
            throw new Error(`Unknown orchestration action: ${decision.action}`);
        }

        results.push({
          decision_id: `${decision.action}_${Date.now()}`,
          status: 'executed' as const,
          result,
        });
      } catch (error) {
        results.push({
          decision_id: `${decision.action}_${Date.now()}`,
          status: 'failed' as const,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return results;
  }

  private async delegateToAgent(
    decision: OrchestrationDecision,
    tenantId: string,
    userId: string
  ): Promise<any> {
    // Create job for target agent
    const { data } = await this.supabase
      .from('jobs')
      .insert({
        tenant_id: tenantId,
        requested_by_user_id: userId,
        job_type: 'AGENT_TASK',
        priority: decision.priority === 'critical' ? 100 : 
                 decision.priority === 'high' ? 75 :
                 decision.priority === 'medium' ? 50 : 25,
        input: {
          target_agent: decision.target_agent,
          task_description: decision.task_description,
          success_criteria: decision.success_criteria,
          dependencies: decision.dependencies,
        },
        status: 'queued',
      })
      .select()
      .single();

    return data;
  }

  private async executeDirectly(
    decision: OrchestrationDecision,
    tenantId: string,
    userId: string
  ): Promise<any> {
    // Execute task directly using Atlas capabilities
    // This would involve calling the appropriate API endpoints
    return {
      action: 'executed_directly',
      task: decision.task_description,
      status: 'completed',
    };
  }

  private async coordinateAgents(
    decision: OrchestrationDecision,
    tenantId: string,
    userId: string
  ): Promise<any> {
    // Coordinate multiple agents for complex tasks
    return {
      action: 'coordinated',
      coordination_plan: decision.task_description,
      participating_agents: decision.target_agent,
    };
  }

  private async escalateIssue(
    decision: OrchestrationDecision,
    tenantId: string,
    userId: string
  ): Promise<any> {
    // Escalate to human oversight or higher authority
    return {
      action: 'escalated',
      escalation_reason: decision.task_description,
      priority: decision.priority,
    };
  }

  private async researchTopic(
    decision: OrchestrationDecision,
    tenantId: string,
    userId: string
  ): Promise<any> {
    // Research topic using knowledge base and external sources
    return {
      action: 'researched',
      topic: decision.task_description,
      findings: 'Research completed',
    };
  }

  /**
   * Get avatar model URL for frontend
   */
  getAvatarUrl(): string {
    const baseUrl = env.APP_URL || 'https://atlasux-backend.onrender.com';
    return `${baseUrl}/v1/atlas/models/atlas-avatar.glb`;
  }

  /**
   * Health check for Atlas agent
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    components: {
      openai: boolean;
      supabase: boolean;
      voice: boolean;
      orchestration: boolean;
    };
    metrics: {
      active_conversations: number;
      voice_cache_size: number;
      average_response_time_ms: number;
    };
  }> {
    const components = {
      openai: !!this.openai,
      supabase: !!this.supabase,
      voice: this.config.voice.enabled,
      orchestration: true,
    };

    const allHealthy = Object.values(components).every(Boolean);
    
    return {
      status: allHealthy ? 'healthy' : 'degraded',
      components,
      metrics: {
        active_conversations: this.conversation_cache.size,
        voice_cache_size: this.voice_cache.size,
        average_response_time_ms: 1500, // Mock - calculate from actual metrics
      },
    };
  }
}

export default AtlasOrchestrationAgent;
