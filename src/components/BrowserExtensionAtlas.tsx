/**
 * Browser Extension Atlas Component
 * Universal Atlas availability across all browsers and websites
 */

import { useState, useEffect, useRef } from "react";
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
  Brain,
  Clock,
  Send,
  Sparkles,
  Activity,
  Zap,
  Globe,
  Eye,
  EyeOff
} from "lucide-react";
import { toast } from "sonner";

interface ExtensionMessage {
  id: string;
  content: string;
  sender: 'user' | 'atlas';
  timestamp: string;
  status: 'sending' | 'sent' | 'delivered';
  voice_url?: string;
  context?: {
    url: string;
    title: string;
    selectedText?: string;
  };
}

interface ExtensionStatus {
  status: 'online' | 'busy' | 'away' | 'offline';
  last_activity: string;
  current_site: string;
  voice_enabled: boolean;
  notifications_enabled: boolean;
  is_minimized: boolean;
}

export default function BrowserExtensionAtlas() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ExtensionMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(true);
  const [extensionStatus, setExtensionStatus] = useState<ExtensionStatus>({
    status: 'online',
    last_activity: new Date().toISOString(),
    current_site: '',
    voice_enabled: true,
    notifications_enabled: true,
    is_minimized: false,
  });
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [contextData, setContextData] = useState<{
    url: string;
    title: string;
    selectedText?: string;
  } | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragRef = useRef<HTMLDivElement>(null);
  const dragOffset = useRef({ x: 0, y: 0 });

  useEffect(() => {
    // Check if we're running in browser extension context
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      setupExtensionListeners();
      loadCurrentContext();
    }

    // Load recent messages
    loadRecentMessages();
    
    // Update status periodically
    const statusInterval = setInterval(updateExtensionStatus, 30000);
    
    return () => {
      clearInterval(statusInterval);
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const setupExtensionListeners = () => {
    // Listen for extension messages
    if (chrome.runtime.onMessage) {
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        switch (message.type) {
          case 'TOGGLE_ATLAS':
            setIsExpanded(prev => !prev);
            break;
          case 'MINIMIZE_ATLAS':
            setIsMinimized(true);
            setIsExpanded(false);
            break;
          case 'RESTORE_ATLAS':
            setIsMinimized(false);
            setIsExpanded(true);
            break;
          case 'VOICE_TOGGLE':
            setIsVoiceEnabled(message.enabled);
            break;
          case 'NOTIFICATIONS_TOGGLE':
            setIsNotificationsEnabled(message.enabled);
            break;
          case 'CONTEXT_UPDATE':
            setContextData(message.context);
            break;
        }
        sendResponse({ success: true });
      });
    }

    // Listen for tab changes
    if (chrome.tabs && chrome.tabs.onUpdated) {
      chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
        if (changeInfo.status === 'complete' && tab.url) {
          loadCurrentContext();
        }
      });
    }

    // Listen for text selection
    document.addEventListener('mouseup', handleTextSelection);
    document.addEventListener('keyup', handleTextSelection);
  };

  const loadCurrentContext = () => {
    if (chrome.tabs && chrome.tabs.query) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          setContextData({
            url: tabs[0].url || '',
            title: tabs[0].title || '',
          });
          setExtensionStatus(prev => ({
            ...prev,
            current_site: new URL(tabs[0].url || '').hostname,
          }));
        }
      });
    }
  };

  const handleTextSelection = () => {
    const selection = window.getSelection();
    const selectedText = selection?.toString().trim();
    
    if (selectedText && selectedText.length > 0) {
      setContextData(prev => prev ? { ...prev, selected_text: selectedText } : null);
    }
  };

  const loadRecentMessages = async () => {
    try {
      if (chrome.storage && chrome.storage.local) {
        const result = await chrome.storage.local.get(['atlas_messages']);
        if (result.atlas_messages) {
          setMessages(result.atlas_messages);
        }
      }
    } catch (error) {
      console.error('Failed to load recent messages:', error);
    }
  };

  const saveMessages = async (messages: ExtensionMessage[]) => {
    try {
      if (chrome.storage && chrome.storage.local) {
        await chrome.storage.local.set({ atlas_messages: messages });
      }
    } catch (error) {
      console.error('Failed to save messages:', error);
    }
  };

  const updateExtensionStatus = async () => {
    try {
      if (chrome.storage && chrome.storage.local) {
        const result = await chrome.storage.local.get(['atlas_status']);
        if (result.atlas_status) {
          setExtensionStatus(prev => ({ ...prev, ...result.atlas_status }));
        }
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: ExtensionMessage = {
      id: `msg-${Date.now()}`,
      content: inputMessage,
      sender: 'user',
      timestamp: new Date().toISOString(),
      status: 'sending',
      context: contextData || undefined,
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    saveMessages(updatedMessages);
    setInputMessage('');
    setIsTyping(true);

    try {
      // Send message to backend API
      const response = await fetch('http://localhost:3000/v1/atlas/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          context: userMessage.context,
          voice_enabled: isVoiceEnabled,
          source: 'browser_extension',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.ok) {
          // Update user message status
          const messagesWithStatus = updatedMessages.map(msg => 
            msg.id === userMessage.id ? { ...msg, status: 'sent' } : msg
          );
          setMessages(messagesWithStatus);
          saveMessages(messagesWithStatus);

          // Add Atlas response
          const atlasMessage: ExtensionMessage = {
            id: `atlas-${Date.now()}`,
            content: data.response.content,
            sender: 'atlas',
            timestamp: new Date().toISOString(),
            status: 'delivered',
            voice_url: data.response.voice_url,
            context: userMessage.context,
          };

          const finalMessages = [...messagesWithStatus, atlasMessage];
          setMessages(finalMessages);
          saveMessages(finalMessages);

          // Play voice if enabled
          if (isVoiceEnabled && data.response.voice_url) {
            playVoiceResponse(data.response.voice_url);
          }

          // Show notification if minimized
          if (isMinimized && isNotificationsEnabled) {
            showExtensionNotification('Atlas', data.response.content.substring(0, 100) + '...');
          }

          // Update status
          setExtensionStatus(prev => ({
            ...prev,
            last_activity: new Date().toISOString(),
            status: 'online',
          }));
        }
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
      
      // Update message status to failed
      const messagesWithError = updatedMessages.map(msg => 
        msg.id === userMessage.id ? { ...msg, status: 'delivered' } : msg
      );
      setMessages(messagesWithError);
      saveMessages(messagesWithError);
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

  const showExtensionNotification = (title: string, body: string) => {
    if (chrome.notifications && chrome.notifications.create) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: chrome.runtime.getURL('icons/icon128.png'),
        title,
        message: body,
        priority: 2,
      });
    }
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

  const handleMouseDown = (e: React.MouseEvent) => {
    if (dragRef.current) {
      setIsDragging(true);
      const rect = dragRef.current.getBoundingClientRect();
      dragOffset.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging && dragRef.current) {
      setPosition({
        x: e.clientX - dragOffset.current.x,
        y: e.clientY - dragOffset.current.y,
      });
    }
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

  const getStatusColor = () => {
    switch (extensionStatus.status) {
      case 'online': return 'bg-green-500';
      case 'busy': return 'bg-red-500';
      case 'away': return 'bg-yellow-500';
      case 'offline': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = () => {
    switch (extensionStatus.status) {
      case 'online': return <Activity className="w-3 h-3 text-white" />;
      case 'busy': return <X className="w-3 h-3 text-white" />;
      case 'away': return <Clock className="w-3 h-3 text-white" />;
      case 'offline': return <Zap className="w-3 h-3 text-white" />;
      default: return <Zap className="w-3 h-3 text-white" />;
    }
  };

  // Minimized state - just the avatar
  if (isMinimized && !isExpanded) {
    return (
      <div 
        className="fixed bottom-4 right-4 z-[9999] cursor-pointer"
        onClick={() => setIsExpanded(true)}
      >
        <div className="relative">
          {/* Avatar */}
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow">
            <Brain className="w-6 h-6 text-white" />
          </div>
          
          {/* Status indicator */}
          <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full ${getStatusColor()} flex items-center justify-center border-2 border-white`}>
            {getStatusIcon()}
          </div>
          
          {/* Site indicator */}
          {extensionStatus.current_site && (
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white">
              <Globe className="w-3 h-3 text-white" />
            </div>
          )}
        </div>
      </div>
    );
  }

  // Expanded state - full chat interface
  return (
    <div
      ref={dragRef}
      className="fixed z-[9999] w-80 bg-slate-900/95 backdrop-blur-sm border border-cyan-500/30 rounded-lg shadow-2xl"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-slate-700 cursor-move">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
            <Brain className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-white font-medium text-sm">Atlas</div>
            <div className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
              <span className="text-xs text-slate-400 capitalize">{extensionStatus.status}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          {contextData?.selected_text && (
            <div className="w-2 h-2 bg-blue-500 rounded-full" title="Text selected on page" />
          )}
          
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setIsVoiceEnabled(!isVoiceEnabled);
              setExtensionStatus(prev => ({ ...prev, voice_enabled: !isVoiceEnabled }));
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
              setExtensionStatus(prev => ({ ...prev, notifications_enabled: !isNotificationsEnabled }));
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
            onClick={() => setIsMinimized(true)}
            className="text-slate-400 hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Context Info */}
      {contextData && (
        <div className="p-2 bg-slate-800/50 border-b border-slate-700">
          <div className="text-xs text-slate-400 truncate">
            🌐 {contextData.title}
          </div>
          {contextData.selected_text && (
            <div className="text-xs text-blue-400 truncate mt-1">
              📝 "{contextData.selected_text.substring(0, 50)}..."
            </div>
          )}
        </div>
      )}

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
            placeholder="Ask Atlas about this page..."
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
        
        {/* Quick Actions */}
        <div className="flex gap-2 mt-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              if (contextData?.selected_text) {
                setInputMessage(`Explain: ${contextData.selected_text}`);
                inputRef.current?.focus();
              }
            }}
            disabled={!contextData?.selected_text}
            className="border-slate-600 text-slate-300 hover:bg-slate-800 text-xs"
          >
            Explain Selection
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              if (contextData) {
                setInputMessage(`Summarize this page: ${contextData.title}`);
                inputRef.current?.focus();
              }
            }}
            className="border-slate-600 text-slate-300 hover:bg-slate-800 text-xs"
          >
            Summarize Page
          </Button>
        </div>
      </div>
    </div>
  );
}
