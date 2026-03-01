/**
 * Atlas Orchestration Agent API Routes
 * Provides endpoints for Atlas conversation, orchestration, and voice capabilities
 */

import type { FastifyPluginAsync } from "fastify";
import AtlasOrchestrationAgent from "../agents/atlas.js";
import { prisma } from "../db/prisma.js";
import { meterApiCall } from "../lib/usageMeter.js";
import { makeSupabase } from "../supabase.js";
import { loadEnv } from "../env.js";
import { readFile } from "fs/promises";
import { join } from "path";
import { sglEvaluate, type Intent } from "../core/sgl.js";

const env = loadEnv(process.env);
const supabase = makeSupabase(env);

const atlasAgent = new AtlasOrchestrationAgent();

export const atlasRoutes: FastifyPluginAsync = async (app) => {
  // Serve avatar model files
  app.get("/models/:filename", async (req, reply) => {
    try {
      const { filename } = req.params as { filename: string };
      
      // Validate filename to prevent directory traversal
      if (!filename.match(/^[\w\-\.]+\.glb$/)) {
        return reply.code(400).send({ ok: false, error: "Invalid filename" });
      }

      const filePath = join(process.cwd(), 'public', 'models', filename);
      const fileBuffer = await readFile(filePath);
      
      reply.header('Content-Type', 'model/gltf-binary');
      reply.header('Cache-Control', 'public, max-age=3600');
      return reply.send(fileBuffer);
    } catch (error) {
      return reply.code(404).send({ 
        ok: false, 
        error: "Model file not found",
        // error details omitted from response — logged server-side only
      });
    }
  });

  // Health check endpoint
  app.get("/health", async (req, reply) => {
    try {
      const health = await atlasAgent.healthCheck();
      return reply.send({ ok: true, health });
    } catch (error) {
      return reply.code(500).send({ 
        ok: false, 
        error: "Health check failed",
        // error details omitted from response — logged server-side only 
      });
    }
  });

  // Get avatar model URL
  app.get("/avatar", async (req, reply) => {
    try {
      const avatarUrl = atlasAgent.getAvatarUrl();
      return reply.send({ 
        ok: true, 
        avatar_url: avatarUrl,
        formats: {
          glb: `${avatarUrl}`,
          wireframe: avatarUrl.replace('.glb', '-wireframe.glb')
        }
      });
    } catch (error) {
      return reply.code(500).send({ 
        ok: false, 
        error: "Failed to get avatar URL",
        // error details omitted from response — logged server-side only 
      });
    }
  });

  // Main conversation endpoint
  app.post("/chat", async (req, reply) => {
    const tenantId = (req as any).tenantId as string;
    const userId = (req as any).auth?.userId as string;
    
    if (!tenantId || !userId) {
      return reply.code(400).send({ 
        ok: false, 
        error: "tenantId and userId required" 
      });
    }

    try {
      const {
        message,
        session_id,
        include_voice = false,
        context,
      } = req.body as {
        message: string;
        session_id: string;
        include_voice?: boolean;
        context?: any;
      };

      if (!message || !session_id) {
        return reply.code(400).send({ 
          ok: false, 
          error: "message and session_id are required" 
        });
      }

      // Meter usage
      await meterApiCall(userId, tenantId);

      const response = await atlasAgent.processConversation(
        message,
        userId,
        tenantId,
        session_id,
        {
          include_voice,
          context,
        }
      );

      // Execute orchestration actions if any
      let orchestrationResults: any[] = [];
      if (response.orchestration_actions && response.orchestration_actions.length > 0) {
        orchestrationResults = await atlasAgent.executeOrchestrationDecisions(
          response.orchestration_actions,
          tenantId,
          userId
        );
      }

      return reply.send({
        ok: true,
        response: {
          text: response.text_response,
          voice: response.voice_response,
          orchestration_results: orchestrationResults,
          metadata: response.metadata,
        },
        conversation_context: response.conversation_context,
      });
    } catch (error) {
      console.error('Atlas chat error:', error);
      return reply.code(500).send({ 
        ok: false, 
        error: "Conversation processing failed",
        // error details omitted from response — logged server-side only 
      });
    }
  });

  // Get conversation history
  app.get("/conversations/:session_id", async (req, reply) => {
    const tenantId = (req as any).tenantId as string;
    const userId = (req as any).auth?.userId as string;
    const { session_id } = req.params as { session_id: string };

    if (!tenantId || !userId) {
      return reply.code(400).send({ 
        ok: false, 
        error: "tenantId and userId required" 
      });
    }

    try {
      const { data, error } = await supabase
        .from('atlas_conversations')
        .select('*')
        .eq('session_id', session_id)
        .eq('user_id', userId)
        .eq('tenant_id', tenantId)
        .single();

      if (error || !data) {
        return reply.code(404).send({ 
          ok: false, 
          error: "Conversation not found" 
        });
      }

      return reply.send({ 
        ok: true, 
        conversation: data 
      });
    } catch (error) {
      return reply.code(500).send({ 
        ok: false, 
        error: "Failed to get conversation",
        // error details omitted from response — logged server-side only 
      });
    }
  });

  // Execute orchestration decisions directly
  app.post("/orchestrate", async (req, reply) => {
    const tenantId = (req as any).tenantId as string;
    const userId = (req as any).auth?.userId as string;

    if (!tenantId || !userId) {
      return reply.code(400).send({ 
        ok: false, 
        error: "tenantId and userId required" 
      });
    }

    try {
      const { decisions } = req.body as { decisions: any[] };

      if (!decisions || !Array.isArray(decisions)) {
        return reply.code(400).send({ 
          ok: false, 
          error: "decisions array is required" 
        });
      }

      // SGL gate — every orchestration request must be evaluated
      const sglIntent: Intent = {
        tenantId,
        actor: "ATLAS",
        type: "ORCHESTRATE",
        payload: { decisions: decisions.map((d: any) => d.type ?? d.action ?? "unknown") },
        dataClass: "NONE",
        spendUsd: 0,
      };
      const sglResult = sglEvaluate(sglIntent);
      if (sglResult.decision === "BLOCK") {
        return reply.code(403).send({
          ok: false,
          error: "SGL_BLOCKED",
          reasons: sglResult.reasons,
        });
      }

      const results = await atlasAgent.executeOrchestrationDecisions(
        decisions,
        tenantId,
        userId
      );

      return reply.send({
        ok: true,
        results,
        sglDecision: sglResult.decision,
      });
    } catch (error) {
      return reply.code(500).send({ 
        ok: false, 
        error: "Orchestration execution failed",
        // error details omitted from response — logged server-side only 
      });
    }
  });

  // Get available agents for orchestration
  app.get("/agents", async (req, reply) => {
    const tenantId = (req as any).tenantId as string;

    if (!tenantId) {
      return reply.code(400).send({ 
        ok: false, 
        error: "tenantId required" 
      });
    }

    try {
      const agents = await atlasAgent['getAvailableAgents'](tenantId);
      return reply.send({ 
        ok: true, 
        agents 
      });
    } catch (error) {
      return reply.code(500).send({ 
        ok: false, 
        error: "Failed to get agents",
        // error details omitted from response — logged server-side only 
      });
    }
  });

  // Get system status
  app.get("/status", async (req, reply) => {
    const tenantId = (req as any).tenantId as string;

    if (!tenantId) {
      return reply.code(400).send({ 
        ok: false, 
        error: "tenantId required" 
      });
    }

    try {
      const systemStatus = await atlasAgent['getSystemStatus'](tenantId);
      return reply.send({ 
        ok: true, 
        status: systemStatus 
      });
    } catch (error) {
      return reply.code(500).send({ 
        ok: false, 
        error: "Failed to get system status",
        // error details omitted from response — logged server-side only 
      });
    }
  });

  // Voice-only endpoint (for TTS)
  app.post("/voice", async (req, reply) => {
    const tenantId = (req as any).tenantId as string;
    const userId = (req as any).auth?.userId as string;

    if (!tenantId || !userId) {
      return reply.code(400).send({ 
        ok: false, 
        error: "tenantId and userId required" 
      });
    }

    try {
      const { text, voice_id } = req.body as { 
        text: string; 
        voice_id?: string; 
      };

      if (!text) {
        return reply.code(400).send({ 
          ok: false, 
          error: "text is required" 
        });
      }

      // Meter usage for voice generation
      await meterApiCall(userId, tenantId);

      const voiceResponse = await atlasAgent['generateVoiceResponse'](text);
      
      return reply.send({ 
        ok: true, 
        voice: voiceResponse 
      });
    } catch (error) {
      return reply.code(500).send({ 
        ok: false, 
        error: "Voice generation failed",
        // error details omitted from response — logged server-side only 
      });
    }
  });

  // Clear conversation cache (for testing/debugging)
  app.delete("/conversations/:session_id/cache", async (req, reply) => {
    const tenantId = (req as any).tenantId as string;
    const userId = (req as any).auth?.userId as string;
    const { session_id } = req.params as { session_id: string };

    if (!tenantId || !userId) {
      return reply.code(400).send({ 
        ok: false, 
        error: "tenantId and userId required" 
      });
    }

    try {
      // Clear from cache
      const cacheKey = `${userId}_${tenantId}_${session_id}`;
      (atlasAgent as any)['conversation_cache'].delete(cacheKey);

      return reply.send({ 
        ok: true, 
        message: "Conversation cache cleared" 
      });
    } catch (error) {
      return reply.code(500).send({ 
        ok: false, 
        error: "Failed to clear cache",
        // error details omitted from response — logged server-side only 
      });
    }
  });

  // Analytics endpoint
  app.get("/analytics", async (req, reply) => {
    const tenantId = (req as any).tenantId as string;

    if (!tenantId) {
      return reply.code(400).send({ 
        ok: false, 
        error: "tenantId required" 
      });
    }

    try {
      const health = await atlasAgent.healthCheck();
      
      // Get additional analytics
      const { data: conversations } = await supabase
        .from('atlas_conversations')
        .select('created_at, conversation_history')
        .eq('tenant_id', tenantId)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      const totalConversations = conversations?.length || 0;
      const avgMessagesPerConversation = conversations && conversations.length > 0 
        ? conversations.reduce((sum: number, conv: any) => sum + (conv.conversation_history?.length || 0), 0) / conversations.length
        : 0;

      return reply.send({ 
        ok: true, 
        analytics: {
          health,
          conversations_24h: totalConversations,
          avg_messages_per_conversation: Math.round(avgMessagesPerConversation * 100) / 100,
          active_sessions: health.metrics.active_conversations,
          voice_cache_size: health.metrics.voice_cache_size,
        }
      });
    } catch (error) {
      return reply.code(500).send({ 
        ok: false, 
        error: "Failed to get analytics",
        // error details omitted from response — logged server-side only 
      });
    }
  });
};
