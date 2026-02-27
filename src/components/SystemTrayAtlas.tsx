/**
 * System Tray Atlas Avatar
 * Desktop system tray integration for continuous Atlas access
 */

import { useState, useEffect, useRef } from "react";
import { API_BASE } from "../lib/api";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";
import { 
  MessageSquare, 
  Minimize2, 
  Maximize2, 
  X, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Settings, 
  Bell, 
  BellOff,
  User,
  Clock,
  Send,
  Sparkles,
  Brain,
  Activity,
  Zap
} from "lucide-react";
import { toast } from "sonner";

interface TrayMessage {
  id: string;
  content: string;
  sender: 'user' | 'atlas';
  timestamp: string;
  status: 'sending' | 'sent' | 'delivered' | 'read';
  voice_url?: string;
}

interface TrayStatus {
  status: 'online' | 'busy' | 'away' | 'offline';
  last_activity: string;
  unread_count: number;
  voice_enabled: boolean;
  notifications_enabled: boolean;
}

export default function SystemTrayAtlas() {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<TrayMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(true);
  const [trayStatus, setTrayStatus] = useState<TrayStatus>({
    status: 'online',
    last_activity: new Date().toISOString(),
    unread_count: 0,
    voice_enabled: true,
    notifications_enabled: true,
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Simulate system tray integration
    if (window.electronAPI) {
      window.electronAPI.onTrayClick(() => {
        setIsMinimized(prev => !prev);
        if (!isMinimized) {
          inputRef.current?.focus();
        }
      });

      window.electronAPI.onTrayDoubleClick(() => {
        setIsMinimized(false);
        setIsExpanded(true);
        inputRef.current?.focus();
      });

      window.electronAPI.onTrayRightClick(() => {
        // Show context menu
        showTrayContextMenu();
      });
    }

    // Load initial messages
    loadRecentMessages();
    
    // Update status periodically
    const statusInterval = setInterval(updateTrayStatus, 30000);
    
    return () => {
      clearInterval(statusInterval);
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadRecentMessages = async () => {
    try {
      const response = await fetch(`${API_BASE}/v1/atlas/conversations/recent?limit=10`, {
        headers: {
          'X-Tenant-ID': 'system-tray',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.ok) {
          setMessages(data.messages || []);
        }
      }
    } catch (error) {
      console.error('Failed to load recent messages:', error);
    }
  };

  const updateTrayStatus = async () => {
    try {
      const response = await fetch(`${API_BASE}/v1/atlas/status`, {
        headers: {
          'X-Tenant-ID': 'system-tray',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.ok) {
          setTrayStatus(prev => ({
            ...prev,
            ...data.status,
          }));
        }
      }
    } catch (error) {
      console.error('Failed to update tray status:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: TrayMessage = {
      id: `msg-${Date.now()}`,
      content: inputMessage,
      sender: 'user',
      timestamp: new Date().toISOString(),
      status: 'sending',
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      const response = await fetch(`${API_BASE}/v1/atlas/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': 'system-tray',
        },
        body: JSON.stringify({
          message: userMessage.content,
          voice_enabled: isVoiceEnabled,
          context: 'system_tray',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.ok) {
          // Update user message status
          setMessages(prev => 
            prev.map(msg => 
              msg.id === userMessage.id 
                ? { ...msg, status: 'sent' }
                : msg
            )
          );

          // Add Atlas response
          const atlasMessage: TrayMessage = {
            id: `atlas-${Date.now()}`,
            content: data.response.content,
            sender: 'atlas',
            timestamp: new Date().toISOString(),
            status: 'delivered',
            voice_url: data.response.voice_url,
          };

          setMessages(prev => [...prev, atlasMessage]);

          // Play voice if enabled
          if (isVoiceEnabled && data.response.voice_url) {
            playVoiceResponse(data.response.voice_url);
          }

          // Update unread count if minimized
          if (isMinimized && isNotificationsEnabled) {
            setTrayStatus(prev => ({
              ...prev,
              unread_count: prev.unread_count + 1,
            }));
            showTrayNotification('Atlas', (data.response.content || '').substring(0, 100) + '...');
          }
        }
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
      
      // Update message status to failed
      setMessages(prev => 
        prev.map(msg => 
          msg.id === userMessage.id 
            ? { ...msg, status: 'delivered' }
            : msg
        )
      );
    } finally {
      setIsTyping(false);
    }
  };

  const playVoiceResponse = async (voiceUrl: string) => {
    try {
      const audio = new Audio(voiceUrl);
      await audio.play();
    } catch (error) {
      console.error('Failed to play voice:', error);
    }
  };

  const showTrayNotification = (title: string, body: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/atlas-avatar-icon.png',
        tag: 'atlas-tray',
        requireInteraction: false,
      });
    }
  };

  const showTrayContextMenu = () => {
    // This would show a native context menu via Electron API
    console.log('Show tray context menu');
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getStatusColor = () => {
    switch (trayStatus.status) {
      case 'online': return 'bg-green-500';
      case 'busy': return 'bg-red-500';
      case 'away': return 'bg-yellow-500';
      case 'offline': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = () => {
    switch (trayStatus.status) {
      case 'online': return <Activity className="w-3 h-3 text-white" />;
      case 'busy': return <X className="w-3 h-3 text-white" />;
      case 'away': return <Clock className="w-3 h-3 text-white" />;
      case 'offline': return <Zap className="w-3 h-3 text-white" />;
      default: return <Zap className="w-3 h-3 text-white" />;
    }
  };

  // Minimized state - just the avatar in system tray
  if (isMinimized && !isExpanded) {
    return (
      <div 
        className="fixed bottom-4 right-4 z-50 cursor-pointer"
        onClick={() => setIsExpanded(true)}
      >
        <div className="relative">
          {/* Avatar */}
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow">
            <Brain className="w-6 h-6 text-white" />
          </div>
          
          {/* Status indicator */}
          <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full ${getStatusColor()} flex items-center justify-center border-2 border-slate-900`}>
            {getStatusIcon()}
          </div>
          
          {/* Unread indicator */}
          {trayStatus.unread_count > 0 && (
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-slate-900">
              {trayStatus.unread_count > 9 ? '9+' : trayStatus.unread_count}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Expanded minimized state - compact chat window
  if (isMinimized && isExpanded) {
    return (
      <div className="fixed bottom-4 right-4 w-80 z-50">
        <Card className="bg-slate-900/95 backdrop-blur-sm border-cyan-500/30 shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-slate-700">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                <Brain className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="text-white font-medium text-sm">Atlas</div>
                <div className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
                  <span className="text-xs text-slate-400 capitalize">{trayStatus.status}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setIsVoiceEnabled(!isVoiceEnabled);
                  setTrayStatus(prev => ({ ...prev, voice_enabled: !isVoiceEnabled }));
                }}
                className="text-slate-400 hover:text-white p-1"
              >
                {isVoiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </Button>
              
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setIsNotificationsEnabled(!isNotificationsEnabled);
                  setTrayStatus(prev => ({ ...prev, notifications_enabled: !isNotificationsEnabled }));
                }}
                className="text-slate-400 hover:text-white p-1"
              >
                {isNotificationsEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
              </Button>
              
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsExpanded(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <Minimize2 className="w-4 h-4" />
              </Button>
              
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setIsMinimized(false);
                  setTrayStatus(prev => ({ ...prev, unread_count: 0 }));
                }}
                className="text-slate-400 hover:text-white p-1"
              >
                <Maximize2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <div className="h-64 overflow-hidden">
            <ScrollArea className="h-full p-3">
              <div className="space-y-2">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-2 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {message.sender === 'atlas' && (
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                        <Brain className="w-3 h-3 text-white" />
                      </div>
                    )}
                    
                    <div
                      className={`max-w-[70%] p-2 rounded-lg ${
                        message.sender === 'user'
                          ? 'bg-cyan-600 text-white'
                          : 'bg-slate-700 text-white'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      {message.voice_url && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => message.voice_url && playVoiceResponse(message.voice_url)}
                          className="mt-1 text-cyan-300 hover:text-cyan-200 p-0 h-6"
                        >
                          <Volume2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                
                {isTyping && (
                  <div className="flex gap-2 justify-start">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                      <Brain className="w-3 h-3 text-white" />
                    </div>
                    <div className="bg-slate-700 text-white p-2 rounded-lg">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
          </div>

          {/* Input */}
          <div className="p-3 border-t border-slate-700">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Message Atlas..."
                className="bg-slate-800 border-slate-600 text-white placeholder-slate-400 text-sm"
              />
              <Button
                size="sm"
                onClick={sendMessage}
                disabled={!inputMessage.trim() || isTyping}
                className="bg-cyan-600 hover:bg-cyan-700 p-2"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Full window state (not minimized)
  return null; // Let the main FloatingAtlas component handle this
}
