/**
 * Floating Atlas Avatar Component
 * Non-intrusive, always-available Atlas agent interface
 * Follows AGENTS.md and ATLAS_POLICY.md guidelines
 */

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Minimize2, Maximize2, Volume2, VolumeX } from "lucide-react";
import { API_BASE } from "../lib/api";
import { useActiveTenant } from "../lib/activeTenant";

interface AtlasStatus {
  color: string;
  glow: string;
  label: string;
  pulseSpeed: string;
}

interface AtlasMessage {
  id: string;
  text: string;
  timestamp: Date;
  isVoice: boolean;
  audioUrl?: string;
}

const STATUS_MAP: Record<string, AtlasStatus> = {
  online: { color: "#22c55e", glow: "rgba(34,197,94,0.6)", label: "Online", pulseSpeed: "2s" },
  busy: { color: "#a855f7", glow: "rgba(168,85,247,0.6)", label: "Processing", pulseSpeed: "1s" },
  attention: { color: "#ef4444", glow: "rgba(239,68,68,0.7)", label: "Action needed", pulseSpeed: "0.6s" },
};

export default function FloatingAtlas() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isSystemTrayMode, setIsSystemTrayMode] = useState(false);
  const [status, setStatus] = useState<'online' | 'busy' | 'attention'>('online');
  const [messages, setMessages] = useState<AtlasMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [sessionId] = useState(() => `atlas-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragRef = useRef<HTMLDivElement>(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  
  const { tenantId } = useActiveTenant();

  // Load avatar URL
  useEffect(() => {
    const loadAvatarUrl = async () => {
      try {
        const response = await fetch(`${API_BASE}/v1/atlas/avatar-url`);
        if (response.ok) {
          const data = await response.json();
          if (data.ok) {
            setAvatarUrl(data.avatar_url);
          }
        }
      } catch (error) {
        console.error('Failed to load Atlas avatar:', error);
      }
    };

    loadAvatarUrl();
  }, []);

  useEffect(() => {
    // Check if we're in system tray mode
    const urlParams = new URLSearchParams(window.location.search);
    const trayMode = urlParams.get('tray') === 'true';
    setIsSystemTrayMode(trayMode);

    if (trayMode) {
      // Set initial position for tray mode (bottom right corner)
      setPosition({ x: window.innerWidth - 360, y: window.innerHeight - 120 });
      setIsExpanded(true); // Auto-expand in tray mode
    }

    // Load avatar URL
    
    // Setup system tray event listeners
    if ((window as any).electronAPI) {
      (window as any).electronAPI.onTrayClick(() => {
        if (trayMode) {
          setIsExpanded(prev => !prev);
        }
      });
      
      (window as any).electronAPI.onTrayDoubleClick(() => {
        if (trayMode) {
          setIsExpanded(true);
          inputRef.current?.focus();
        }
      });
      
      (window as any).electronAPI.onTrayRightClick(() => {
        // Show context menu
        console.log('Tray right click');
      });
      
      (window as any).electronAPI.onVoiceToggled((enabled: boolean) => {
        setIsVoiceEnabled(enabled);
      });
      
      (window as any).electronAPI.onNotificationsToggled((enabled: boolean) => {
        // Handle notification toggle
        console.log('Notifications toggled:', enabled);
      });
      
      (window as any).electronAPI.onNavigateTo((path: string) => {
        // Handle navigation
        console.log('Navigate to:', path);
      });
    }

    // Cleanup
    return () => {
      if ((window as any).electronAPI) {
        (window as any).electronAPI.removeAllListeners('tray-click');
        (window as any).electronAPI.removeAllListeners('tray-double-click');
        (window as any).electronAPI.removeAllListeners('tray-right-click');
        (window as any).electronAPI.removeAllListeners('voice-toggled');
        (window as any).electronAPI.removeAllListeners('notifications-toggled');
        (window as any).electronAPI.removeAllListeners('navigate-to');
      }
    };
  }, []);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle window resize to keep avatar in bounds
  useEffect(() => {
    const handleResize = () => {
      setPosition(prev => ({
        x: Math.min(prev.x, window.innerWidth - (isExpanded ? 400 : 80)),
        y: Math.min(prev.y, window.innerHeight - (isExpanded ? 500 : 80))
      }));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isExpanded]);

  // Mouse event handlers for dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isExpanded) return; // Don't drag when expanded
    
    setIsDragging(true);
    const rect = dragRef.current?.getBoundingClientRect();
    if (rect) {
      dragOffset.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    
    const newX = e.clientX - dragOffset.current.x;
    const newY = e.clientY - dragOffset.current.y;
    
    // Keep within window bounds
    const maxX = window.innerWidth - 80;
    const maxY = window.innerHeight - 80;
    
    setPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY))
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  // Send message to Atlas
  const sendMessage = async () => {
    if (!inputText.trim() || isTyping) return;

    const userMessage: AtlasMessage = {
      id: `user-${Date.now()}`,
      text: inputText.trim(),
      timestamp: new Date(),
      isVoice: false,
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText("");
    setIsTyping(true);
    setStatus('busy');

    try {
      const response = await fetch(`${API_BASE}/v1/atlas/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputText.trim(),
          session_id: sessionId,
          include_voice: isVoiceEnabled,
        }),
      });

      const data = await response.json();
      
      if (data.ok) {
        const atlasMessage: AtlasMessage = {
          id: `atlas-${Date.now()}`,
          text: data.response.text,
          timestamp: new Date(),
          isVoice: !!data.response.voice,
          audioUrl: data.response.voice?.audio_url,
        };

        setMessages(prev => [...prev, atlasMessage]);

        // Play voice if available
        if (data.response.voice?.audio_url && isVoiceEnabled) {
          const audio = new Audio(data.response.voice.audio_url);
          audio.play().catch(console.error);
        }

        // Handle orchestration actions
        if (data.response.orchestration_results?.length > 0) {
          console.log('Atlas orchestration actions:', data.response.orchestration_results);
        }
      }
    } catch (error) {
      console.error('Failed to send message to Atlas:', error);
      const errorMessage: AtlasMessage = {
        id: `error-${Date.now()}`,
        text: "I apologize, but I'm having trouble connecting right now. Please try again.",
        timestamp: new Date(),
        isVoice: false,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
      setStatus('online');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const currentStatus = STATUS_MAP[status];

  return (
    <>
      {/* Floating Avatar Button (when minimized) */}
      <AnimatePresence>
        {!isExpanded && !isMinimized && (
          <motion.div
            ref={dragRef}
            className="fixed z-50 cursor-move"
            style={{ 
              left: position.x, 
              top: position.y,
              userSelect: 'none'
            }}
            onMouseDown={handleMouseDown}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="relative">
              {/* Avatar Container */}
              <div 
                className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg"
                style={{
                  boxShadow: `0 0 20px ${currentStatus.glow}`,
                  animation: `pulse ${currentStatus.pulseSpeed} infinite`
                }}
              >
                {avatarUrl ? (
                  <img 
                    src={avatarUrl} 
                    alt="Atlas Avatar" 
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <div className="w-4 h-4 bg-white rounded-full"></div>
                  </div>
                )}
              </div>
              
              {/* Status Indicator */}
              <div 
                className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white"
                style={{ backgroundColor: currentStatus.color }}
              ></div>
              
              {/* Message Count Badge */}
              {messages.length > 0 && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {messages.length}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Minimized Button */}
      <AnimatePresence>
        {isMinimized && (
          <motion.div
            className="fixed bottom-4 right-4 z-50"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            <button
              onClick={() => setIsMinimized(false)}
              className="bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
            >
              <MessageCircle size={20} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expanded Chat Interface */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            className="fixed z-50 bg-white rounded-lg shadow-2xl border border-gray-200"
            style={{ 
              left: position.x, 
              top: position.y,
              width: '380px',
              height: '480px'
            }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-t-lg flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {avatarUrl ? (
                  <img 
                    src={avatarUrl} 
                    alt="Atlas Avatar" 
                    className="w-8 h-8 rounded-full object-cover border-2 border-white/30"
                  />
                ) : (
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <div className="w-4 h-4 bg-white rounded-full"></div>
                  </div>
                )}
                <div>
                  <h3 className="font-semibold">Atlas</h3>
                  <p className="text-xs opacity-90">{currentStatus.label}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {/* Voice Toggle */}
                <button
                  onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
                  className={`p-1 rounded transition-colors ${
                    isVoiceEnabled ? 'bg-white/20' : 'hover:bg-white/10'
                  }`}
                  title={isVoiceEnabled ? "Disable voice" : "Enable voice"}
                >
                  {isVoiceEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                </button>
                
                {/* Minimize */}
                <button
                  onClick={() => setIsMinimized(true)}
                  className="p-1 hover:bg-white/10 rounded transition-colors"
                  title="Minimize"
                >
                  <Minimize2 size={16} />
                </button>
                
                {/* Close */}
                <button
                  onClick={() => setIsExpanded(false)}
                  className="p-1 hover:bg-white/10 rounded transition-colors"
                  title="Close"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="h-80 overflow-y-auto p-4 space-y-3 bg-gray-50">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 mt-8">
                  <div className="w-12 h-12 bg-gray-200 rounded-full mx-auto mb-3 flex items-center justify-center">
                    <MessageCircle size={24} className="text-gray-400" />
                  </div>
                  <p className="text-sm">Hello! I'm Atlas, your AI orchestration agent.</p>
                  <p className="text-xs mt-1">How can I help you today?</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.id.startsWith('user') ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                        message.id.startsWith('user')
                          ? 'bg-blue-600 text-white'
                          : 'bg-white border border-gray-200 text-gray-800'
                      }`}
                    >
                      <p>{message.text}</p>
                      {message.isVoice && (
                        <div className="flex items-center mt-1 text-xs opacity-70">
                          <Volume2 size={12} className="mr-1" />
                          Voice
                        </div>
                      )}
                      <p className="text-xs mt-1 opacity-70">
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
              
              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-200 px-3 py-2 rounded-lg">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex space-x-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isTyping}
                />
                <button
                  onClick={sendMessage}
                  disabled={!inputText.trim() || isTyping}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Send
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button (when not expanded) */}
      <AnimatePresence>
        {!isExpanded && !isMinimized && (
          <motion.button
            className="fixed z-40 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
            style={{ 
              bottom: 20, 
              right: 20 
            }}
            onClick={() => setIsExpanded(true)}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <MessageCircle size={20} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Global Styles */}
      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }
      `}</style>
    </>
  );
}
