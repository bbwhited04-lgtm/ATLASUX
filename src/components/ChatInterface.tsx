import { API_BASE } from "@/lib/api";
import { useState, useRef, useEffect } from "react";
import { 
  Send, 
  Mic, 
  MicOff, 
  Brain,
  Sparkles,
  Bot,
  User,
  Image as ImageIcon,
  Paperclip,
  Settings,
  Chrome,
  Video,
  Zap,
  Globe,
  Shield
} from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Textarea } from "./ui/textarea";
import { Switch } from "./ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { ScrollArea } from "./ui/scroll-area";
import { motion, AnimatePresence } from "motion/react";
import { HelpSection, ChatHelp } from "./HelpSection";

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  platform?: string;
}

interface AIPlatform {
  id: string;
  name: string;
  category: "language" | "image" | "video" | "browser";
  color: string;
  icon: any;
  description: string;
}

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: "assistant",
      content: "Hello! I'm Neptune, your AI security control system. I understand voice commands and can respond to you through speech. Click the microphone icon to start a voice conversation, or type your message. What would you like me to do?",
      timestamp: "10:30 AM",
      platform: "Neptune AI"
    }
  ]);
  
  const [inputValue, setInputValue] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [activeTab, setActiveTab] = useState("language");
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [recognitionSupported, setRecognitionSupported] = useState(true);
  const [voiceMode, setVoiceMode] = useState<"text" | "speech">("speech"); // speech-to-speech by default
  const [autoPlayResponses, setAutoPlayResponses] = useState(true);
  
  const [selectedPlatforms, setSelectedPlatforms] = useState<Record<string, boolean>>({
    gpt4: true,
    chatgpt: false,
    claude: false,
    deepseek: false,
    gemini: false,
    llama: false,
    mistral: false,
    perplexity: false,
    grok: false,
    cohere: false,
    // Image AI
    dalle: false,
    midjourney: false,
    stablediffusion: false,
    // Video AI
    sora: false,
    runway: false,
    pika: false,
    // Browser automation
    chrome: false,
    edge: false
  });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const platforms: AIPlatform[] = [
    // Language Models
    { id: "gpt4", name: "GPT-4", category: "language", color: "cyan", icon: Brain, description: "OpenAI's most capable model" },
    { id: "chatgpt", name: "ChatGPT", category: "language", color: "green", icon: Bot, description: "Conversational AI assistant" },
    { id: "claude", name: "Claude", category: "language", color: "purple", icon: Sparkles, description: "Anthropic's advanced AI" },
    { id: "deepseek", name: "DeepSeek", category: "language", color: "blue", icon: Brain, description: "Deep reasoning AI model" },
    { id: "gemini", name: "Gemini", category: "language", color: "indigo", icon: Bot, description: "Google's multimodal AI" },
    { id: "llama", name: "Llama 3", category: "language", color: "orange", icon: Brain, description: "Meta's open source model" },
    { id: "mistral", name: "Mistral", category: "language", color: "pink", icon: Zap, description: "Fast and efficient AI" },
    { id: "perplexity", name: "Perplexity", category: "language", color: "teal", icon: Globe, description: "AI-powered search" },
    { id: "grok", name: "Grok", category: "language", color: "slate", icon: Bot, description: "xAI's conversational model" },
    { id: "cohere", name: "Cohere", category: "language", color: "violet", icon: Brain, description: "Enterprise AI platform" },
    
    // Image Generation
    { id: "dalle", name: "DALL-E", category: "image", color: "cyan", icon: ImageIcon, description: "OpenAI image generation" },
    { id: "midjourney", name: "Midjourney", category: "image", color: "purple", icon: Sparkles, description: "High-quality AI art" },
    { id: "stablediffusion", name: "Stable Diffusion", category: "image", color: "blue", icon: ImageIcon, description: "Open source image AI" },
    
    // Video Generation
    { id: "sora", name: "Sora", category: "video", color: "pink", icon: Video, description: "OpenAI video generation" },
    { id: "runway", name: "Runway", category: "video", color: "purple", icon: Video, description: "AI video editing & generation" },
    { id: "pika", name: "Pika", category: "video", color: "orange", icon: Video, description: "Text-to-video AI" },
    
    // Browser Automation
    { id: "chrome", name: "Chrome Automation", category: "browser", color: "yellow", icon: Chrome, description: "Automate Chrome browser tasks" },
    { id: "edge", name: "Edge Automation", category: "browser", color: "blue", icon: Globe, description: "Automate Edge browser tasks" },
  ];
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  
  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms(prev => ({
      ...prev,
      [platformId]: !prev[platformId]
    }));
  };
  
  const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || "";

const resolveProvider = (): { provider: "openai" | "deepseek"; label: string } => {
  // If DeepSeek is selected, route to DeepSeek. Otherwise default to OpenAI.
  const active = Object.entries(selectedPlatforms).filter(([_, v]) => v).map(([id]) => id);
  if (active.includes("deepseek")) return { provider: "deepseek", label: "DeepSeek" };
  // Everything else defaults to OpenAI for now (platform-owned key)
  return { provider: "openai", label: "OpenAI" };
};

const handleSend = async () => {
  if (!inputValue.trim()) return;

  const userMessage: Message = {
    id: messages.length + 1,
    role: "user",
    content: inputValue,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };

  setMessages(prev => [...prev, userMessage]);
  setInputValue("");
  setIsTyping(true);

  try {
    const { provider, label } = resolveProvider();

    const body = {
      provider,
      // Keep model default server-side unless you want to wire explicit model choices per platform
      messages: [
        ...messages
          .filter(m => m.role === "user" || m.role === "assistant")
          .slice(-10)
          .map(m => ({ role: m.role, content: m.content })),
        { role: "user", content: userMessage.content }
      ],
      // If user explicitly selects "Atlas"/"Neptune" persona in the future, pass systemPrompt here.
      systemPrompt: null
    };

    const resp = await fetch(`${API_BASE}/v1/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    const data = await resp.json().catch(() => ({}));

    if (!resp.ok) {
      throw new Error(data?.error || "Chat request failed");
    }

    const aiMessage: Message = {
      id: messages.length + 2,
      role: "assistant",
      content: data?.content || "",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      platform: `${label}${data?.model ? ` • ${data.model}` : ""}`
    };

    setMessages(prev => [...prev, aiMessage]);
  } catch (err: any) {
    const aiMessage: Message = {
      id: messages.length + 2,
      role: "assistant",
      content: `⚠️ ${err?.message || "Unable to reach backend chat service."}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      platform: "System"
    };
    setMessages(prev => [...prev, aiMessage]);
  } finally {
    setIsTyping(false);
  }
};

  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  const toggleVoice = () => {
    setIsListening(!isListening);
    
    if (!isListening) {
      // Simulate voice recognition
      setTimeout(() => {
        setInputValue("Create a social media post about our new product launch");
        setIsListening(false);
      }, 3000);
    }
  };
  
  const getPlatformsByCategory = (category: string) => {
    return platforms.filter(p => p.category === category);
  };
  
  const getActiveCount = (category: string) => {
    return getPlatformsByCategory(category).filter(p => selectedPlatforms[p.id]).length;
  };
  
  return (
    <div className="h-full flex">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="h-16 bg-slate-900/30 backdrop-blur-xl border-b border-cyan-500/20 flex items-center justify-between px-6">
          <div>
            <h2 className="text-lg font-semibold">AI Chat Interface</h2>
            <p className="text-xs text-slate-400">
              {Object.values(selectedPlatforms).filter(Boolean).length} AI platform(s) active
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-cyan-500/20 text-cyan-400">
              <Brain className="w-3 h-3 mr-1" />
              Multi-AI Mode
            </Badge>
          </div>
        </div>
        
        {/* Messages */}
        <ScrollArea className="flex-1 p-6">
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  layout
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div className={`flex gap-3 max-w-[70%] ${message.role === "user" ? "flex-row-reverse" : ""}`}>
                    {/* Avatar */}
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      message.role === "user" 
                        ? "bg-cyan-500/20" 
                        : "bg-blue-500/20"
                    }`}>
                      {message.role === "user" ? (
                        <User className="w-4 h-4 text-cyan-400" />
                      ) : (
                        <Bot className="w-4 h-4 text-blue-400" />
                      )}
                    </div>
                    
                    {/* Message Content */}
                    <div className={`space-y-1 ${message.role === "user" ? "items-end" : ""}`}>
                      <Card className={`p-4 ${
                        message.role === "user"
                          ? "bg-cyan-500/10 border-cyan-500/30"
                          : "bg-slate-900/50 border-cyan-500/20"
                      } backdrop-blur-xl`}>
                        <p className="text-sm text-slate-200">{message.content}</p>
                      </Card>
                      
                      <div className={`flex items-center gap-2 text-xs text-slate-500 ${message.role === "user" ? "justify-end" : ""}`}>
                        <span>{message.timestamp}</span>
                        {message.platform && (
                          <>
                            <span>•</span>
                            <span className="text-cyan-400">{message.platform}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {/* Typing Indicator */}
            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-blue-400" />
                </div>
                <Card className="bg-slate-900/50 border-cyan-500/20 backdrop-blur-xl p-4">
                  <div className="flex gap-1">
                    <motion.div
                      animate={{ y: [0, -5, 0] }}
                      transition={{ repeat: Infinity, duration: 0.6, delay: 0 }}
                      className="w-2 h-2 rounded-full bg-slate-400"
                    />
                    <motion.div
                      animate={{ y: [0, -5, 0] }}
                      transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }}
                      className="w-2 h-2 rounded-full bg-slate-400"
                    />
                    <motion.div
                      animate={{ y: [0, -5, 0] }}
                      transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }}
                      className="w-2 h-2 rounded-full bg-slate-400"
                    />
                  </div>
                </Card>
              </motion.div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
        
        {/* Input Area */}
        <div className="border-t border-cyan-500/20 bg-slate-900/30 backdrop-blur-xl p-4">
          {/* Voice Mode Toggle */}
          <div className="mb-3 flex items-center justify-between p-3 bg-slate-900/50 border border-cyan-500/20 rounded-lg">
            <div className="flex items-center gap-3">
              <Shield className="w-4 h-4 text-cyan-400" />
              <div>
                <div className="text-sm font-medium">Voice Mode</div>
                <div className="text-xs text-slate-400">
                  {voiceMode === "speech" ? "Speech-to-Speech (Neptune responds with voice)" : "Speech-to-Text (Text responses only)"}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant={voiceMode === "text" ? "default" : "outline"}
                onClick={() => setVoiceMode("text")}
                className={`text-xs ${voiceMode === "text" ? "bg-cyan-500" : "border-cyan-500/20"}`}
              >
                Text
              </Button>
              <Button
                size="sm"
                variant={voiceMode === "speech" ? "default" : "outline"}
                onClick={() => setVoiceMode("speech")}
                className={`text-xs ${voiceMode === "speech" ? "bg-cyan-500" : "border-cyan-500/20"}`}
              >
                Speech
              </Button>
            </div>
          </div>
          
          {/* Speaking Indicator */}
          {isSpeaking && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mb-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div className="flex gap-1">
                  <motion.div
                    animate={{ scaleY: [1, 1.5, 1] }}
                    transition={{ repeat: Infinity, duration: 0.6, delay: 0 }}
                    className="w-1 h-4 bg-blue-400 rounded-full"
                  />
                  <motion.div
                    animate={{ scaleY: [1, 1.8, 1] }}
                    transition={{ repeat: Infinity, duration: 0.6, delay: 0.1 }}
                    className="w-1 h-4 bg-blue-400 rounded-full"
                  />
                  <motion.div
                    animate={{ scaleY: [1, 1.3, 1] }}
                    transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }}
                    className="w-1 h-4 bg-blue-400 rounded-full"
                  />
                  <motion.div
                    animate={{ scaleY: [1, 1.6, 1] }}
                    transition={{ repeat: Infinity, duration: 0.6, delay: 0.3 }}
                    className="w-1 h-4 bg-blue-400 rounded-full"
                  />
                </div>
                <div>
                  <div className="text-sm text-blue-400 font-medium">Neptune is speaking...</div>
                  <div className="text-xs text-slate-400">Voice response in progress</div>
                </div>
              </div>
            </motion.div>
          )}
          
          <div className="flex items-end gap-3">
            <Button
              variant="outline"
              size="icon"
              className="border-cyan-500/20 hover:bg-slate-800"
            >
              <Paperclip className="w-4 h-4" />
            </Button>
            
            <div className="flex-1 relative">
              <Textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Ask Atlas to help with a task..."
                className="min-h-[60px] max-h-[200px] resize-none bg-slate-900/50 border-cyan-500/20 focus:border-cyan-500/40"
              />
            </div>
            
            <Button
              variant="outline"
              size="icon"
              onClick={toggleVoice}
              className={`border-cyan-500/20 ${
                isListening 
                  ? "bg-red-500/20 border-red-500/40 text-red-400" 
                  : "hover:bg-slate-800"
              }`}
            >
              {isListening ? (
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                >
                  <MicOff className="w-4 h-4" />
                </motion.div>
              ) : (
                <Mic className="w-4 h-4" />
              )}
            </Button>
            
            <Button
              onClick={handleSend}
              disabled={!inputValue.trim()}
              className="bg-cyan-500 hover:bg-cyan-400"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          
          {isListening && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg"
            >
              <div className="flex items-center gap-2 text-sm text-red-400">
                <motion.div
                  animate={{ scale: [1, 1.5, 1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                  className="w-2 h-2 rounded-full bg-red-400"
                />
                Listening... Speak now
              </div>
            </motion.div>
          )}
        </div>
      </div>
      
      {/* Sidebar - AI Platforms */}
      <div className="w-80 border-l border-cyan-500/20 bg-slate-900/30 backdrop-blur-xl">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <div className="p-4 border-b border-cyan-500/20">
            <h3 className="text-lg font-semibold mb-2">AI Platforms</h3>
            <p className="text-xs text-slate-400">
              Activate AI models to power your tasks
            </p>
          </div>
          
          <TabsList className="bg-slate-900/50 border-b border-cyan-500/20 rounded-none w-full justify-start px-4">
            <TabsTrigger value="language" className="text-xs">
              Language ({getActiveCount("language")})
            </TabsTrigger>
            <TabsTrigger value="image" className="text-xs">
              Image ({getActiveCount("image")})
            </TabsTrigger>
            <TabsTrigger value="video" className="text-xs">
              Video ({getActiveCount("video")})
            </TabsTrigger>
            <TabsTrigger value="browser" className="text-xs">
              Browser ({getActiveCount("browser")})
            </TabsTrigger>
          </TabsList>
          
          <ScrollArea className="flex-1 p-4">
            <TabsContent value="language" className="mt-0 space-y-3">
              {getPlatformsByCategory("language").map((platform) => {
                const Icon = platform.icon;
                const isActive = selectedPlatforms[platform.id];
                
                return (
                  <Card 
                    key={platform.id}
                    className={`p-3 cursor-pointer transition-all ${
                      isActive 
                        ? `bg-${platform.color}-500/10 border-${platform.color}-500/30` 
                        : "bg-slate-900/50 border-cyan-500/20 hover:bg-slate-900/70"
                    }`}
                    onClick={() => togglePlatform(platform.id)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-lg bg-${platform.color}-500/20 flex items-center justify-center`}>
                          <Icon className={`w-4 h-4 text-${platform.color}-400`} />
                        </div>
                        <div>
                          <div className="font-medium text-sm">{platform.name}</div>
                          <div className="text-xs text-slate-400">{platform.description}</div>
                        </div>
                      </div>
                      <Switch checked={isActive} />
                    </div>
                  </Card>
                );
              })}
            </TabsContent>
            
            <TabsContent value="image" className="mt-0 space-y-3">
              {getPlatformsByCategory("image").map((platform) => {
                const Icon = platform.icon;
                const isActive = selectedPlatforms[platform.id];
                
                return (
                  <Card 
                    key={platform.id}
                    className={`p-3 cursor-pointer transition-all ${
                      isActive 
                        ? `bg-${platform.color}-500/10 border-${platform.color}-500/30` 
                        : "bg-slate-900/50 border-cyan-500/20 hover:bg-slate-900/70"
                    }`}
                    onClick={() => togglePlatform(platform.id)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-lg bg-${platform.color}-500/20 flex items-center justify-center`}>
                          <Icon className={`w-4 h-4 text-${platform.color}-400`} />
                        </div>
                        <div>
                          <div className="font-medium text-sm">{platform.name}</div>
                          <div className="text-xs text-slate-400">{platform.description}</div>
                        </div>
                      </div>
                      <Switch checked={isActive} />
                    </div>
                  </Card>
                );
              })}
            </TabsContent>
            
            <TabsContent value="video" className="mt-0 space-y-3">
              {getPlatformsByCategory("video").map((platform) => {
                const Icon = platform.icon;
                const isActive = selectedPlatforms[platform.id];
                
                return (
                  <Card 
                    key={platform.id}
                    className={`p-3 cursor-pointer transition-all ${
                      isActive 
                        ? `bg-${platform.color}-500/10 border-${platform.color}-500/30` 
                        : "bg-slate-900/50 border-cyan-500/20 hover:bg-slate-900/70"
                    }`}
                    onClick={() => togglePlatform(platform.id)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-lg bg-${platform.color}-500/20 flex items-center justify-center`}>
                          <Icon className={`w-4 h-4 text-${platform.color}-400`} />
                        </div>
                        <div>
                          <div className="font-medium text-sm">{platform.name}</div>
                          <div className="text-xs text-slate-400">{platform.description}</div>
                        </div>
                      </div>
                      <Switch checked={isActive} />
                    </div>
                  </Card>
                );
              })}
            </TabsContent>
            
            <TabsContent value="browser" className="mt-0 space-y-3">
              {getPlatformsByCategory("browser").map((platform) => {
                const Icon = platform.icon;
                const isActive = selectedPlatforms[platform.id];
                
                return (
                  <Card 
                    key={platform.id}
                    className={`p-3 cursor-pointer transition-all ${
                      isActive 
                        ? `bg-${platform.color}-500/10 border-${platform.color}-500/30` 
                        : "bg-slate-900/50 border-cyan-500/20 hover:bg-slate-900/70"
                    }`}
                    onClick={() => togglePlatform(platform.id)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-lg bg-${platform.color}-500/20 flex items-center justify-center`}>
                          <Icon className={`w-4 h-4 text-${platform.color}-400`} />
                        </div>
                        <div>
                          <div className="font-medium text-sm">{platform.name}</div>
                          <div className="text-xs text-slate-400">{platform.description}</div>
                        </div>
                      </div>
                      <Switch checked={isActive} />
                    </div>
                  </Card>
                );
              })}
              
              <Card className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/30 backdrop-blur-xl p-4 mt-4">
                <div className="flex items-start gap-3">
                  <Chrome className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                  <div>
                    <div className="text-sm font-medium mb-1">Browser Automation</div>
                    <div className="text-xs text-slate-400">
                      Automate web tasks, scraping, testing, and workflows in Chrome or Edge
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>
          </ScrollArea>
          
          {/* Help Section */}
          <div className="border-t border-cyan-500/20 p-4">
            <HelpSection
              title="Chat Interface Help"
              description="Learn how to use voice commands, activate AI platforms, and coordinate tasks with Neptune"
              faqs={ChatHelp}
              quickTips={[
                "Click the microphone icon to activate voice recognition",
                "Activate multiple AI platforms for enhanced capabilities",
                "Neptune validates all permissions before executing tasks",
                "Use voice or text - both work seamlessly with Neptune"
              ]}
              videoUrl="/tutorials/chat-interface"
            />
          </div>
        </Tabs>
      </div>
    </div>
  );
}