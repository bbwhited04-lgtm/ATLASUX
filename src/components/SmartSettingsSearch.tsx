/**
 * Smart Settings Search
 * AI-powered settings search with recommendations and quick actions
 */

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useActiveTenant } from "../lib/activeTenant";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";
import {
  Search,
  Clock,
  TrendingUp,
  Settings,
  Zap,
  Brain,
  Database,
  Users,
  Shield,
  BarChart,
  ChevronRight,
  ExternalLink,
  History,
  Filter,
  Lightbulb,
  Target,
  Compass,
  MessageSquare
} from "lucide-react";
import { toast } from "sonner";

interface SearchSuggestion {
  id: string;
  title: string;
  description: string;
  category: string;
  path: string;
  keywords: string[];
  popularity?: number;
  last_accessed?: string;
  action_type: 'setting' | 'feature' | 'help' | 'quick_action';
  icon: any;
}

interface SearchHistory {
  query: string;
  timestamp: string;
  results_count: number;
  clicked_result?: string;
}

const SETTING_CATEGORIES = {
  general: { icon: Settings, color: 'text-blue-400', bgColor: 'bg-blue-500/10' },
  atlas: { icon: Brain, color: 'text-purple-400', bgColor: 'bg-purple-500/10' },
  analytics: { icon: BarChart, color: 'text-green-400', bgColor: 'bg-green-500/10' },
  workflows: { icon: Zap, color: 'text-yellow-400', bgColor: 'bg-yellow-500/10' },
  knowledge: { icon: Database, color: 'text-cyan-400', bgColor: 'bg-cyan-500/10' },
  teams: { icon: Users, color: 'text-orange-400', bgColor: 'bg-orange-500/10' },
  security: { icon: Shield, color: 'text-red-400', bgColor: 'bg-red-500/10' },
  integrations: { icon: ExternalLink, color: 'text-indigo-400', bgColor: 'bg-indigo-500/10' },
};

const QUICK_ACTIONS = [
  {
    id: 'voice-test',
    title: 'Test Atlas Voice',
    description: 'Test voice synthesis settings',
    category: 'atlas',
    path: '/settings/atlas?tab=voice',
    keywords: ['voice', 'test', 'audio', 'speech'],
    action_type: 'quick_action' as const,
    icon: MessageSquare,
  },
  {
    id: 'export-data',
    title: 'Export Analytics Data',
    description: 'Download analytics as CSV',
    category: 'analytics',
    path: '/settings/analytics?tab=export',
    keywords: ['export', 'download', 'analytics', 'csv'],
    action_type: 'quick_action' as const,
    icon: Database,
  },
  {
    id: 'create-workflow',
    title: 'Create New Workflow',
    description: 'Start building automation',
    category: 'workflows',
    path: '/settings/workflows?action=create',
    keywords: ['workflow', 'automation', 'create', 'build'],
    action_type: 'quick_action' as const,
    icon: Zap,
  },
  {
    id: 'invite-member',
    title: 'Invite Team Member',
    description: 'Add someone to your team',
    category: 'teams',
    path: '/settings/teams?action=invite',
    keywords: ['invite', 'team', 'member', 'collaborate'],
    action_type: 'quick_action' as const,
    icon: Users,
  },
];

const HELP_ARTICLES = [
  {
    id: 'atlas-voice-setup',
    title: 'Setting Up Atlas Voice',
    description: 'Configure voice synthesis and audio settings',
    category: 'help',
    path: '/help/atlas-voice',
    keywords: ['voice', 'setup', 'configuration', 'audio'],
    action_type: 'help' as const,
    icon: MessageSquare,
  },
  {
    id: 'workflow-automation',
    title: 'Workflow Automation Guide',
    description: 'Learn how to build automated workflows',
    category: 'help',
    path: '/help/workflows',
    keywords: ['workflow', 'automation', 'guide', 'tutorial'],
    action_type: 'help' as const,
    icon: Zap,
  },
  {
    id: 'team-collaboration',
    title: 'Team Collaboration Best Practices',
    description: 'Tips for effective team collaboration',
    category: 'help',
    path: '/help/teams',
    keywords: ['team', 'collaboration', 'best', 'practices'],
    action_type: 'help' as const,
    icon: Users,
  },
];

// Map categories/paths to Settings tab names
const CATEGORY_TO_TAB: Record<string, string> = {
  general: 'general',
  atlas: 'atlas',
  analytics: 'analytics',
  workflows: 'workflows',
  knowledge: 'knowledge',
  teams: 'teams',
  security: 'security',
  integrations: 'integrations',
  help: 'general',
};

// All searchable settings items (client-side index)
const ALL_SETTINGS: SearchSuggestion[] = [
  { id: 's-voice', title: 'Atlas Voice Settings', description: 'Configure voice synthesis and audio', category: 'atlas', path: 'atlas', keywords: ['voice', 'audio', 'speech', 'tts', 'sound'], action_type: 'setting', icon: Brain },
  { id: 's-personality', title: 'Atlas Personality', description: 'Tone, response style, formality', category: 'atlas', path: 'atlas', keywords: ['personality', 'tone', 'style', 'formality'], action_type: 'setting', icon: Brain },
  { id: 's-memory', title: 'Atlas Memory', description: 'Retention, context window, cleanup', category: 'atlas', path: 'atlas', keywords: ['memory', 'retention', 'context', 'conversations'], action_type: 'setting', icon: Database },
  { id: 's-analytics', title: 'Analytics Dashboard', description: 'View usage metrics and performance', category: 'analytics', path: 'analytics', keywords: ['analytics', 'metrics', 'dashboard', 'usage', 'stats'], action_type: 'setting', icon: BarChart },
  { id: 's-workflows', title: 'Workflow Builder', description: 'Create and manage automation workflows', category: 'workflows', path: 'workflows', keywords: ['workflow', 'automation', 'trigger', 'nodes'], action_type: 'setting', icon: Zap },
  { id: 's-knowledge', title: 'Knowledge Base', description: 'Manage documents and knowledge', category: 'knowledge', path: 'knowledge', keywords: ['knowledge', 'documents', 'base', 'kb'], action_type: 'setting', icon: Database },
  { id: 's-teams', title: 'Team Management', description: 'Manage team members and collaboration', category: 'teams', path: 'teams', keywords: ['team', 'members', 'collaboration', 'invite'], action_type: 'setting', icon: Users },
  { id: 's-security', title: 'Security Settings', description: 'Admin auth and security configuration', category: 'security', path: 'security', keywords: ['security', 'auth', 'admin', 'password', 'encryption'], action_type: 'setting', icon: Shield },
  { id: 's-integrations', title: 'Integrations', description: 'Connect external services and APIs', category: 'integrations', path: 'integrations', keywords: ['integration', 'connect', 'api', 'oauth', 'slack', 'google'], action_type: 'setting', icon: ExternalLink },
  { id: 's-permissions', title: 'System Permissions', description: 'File, network, and device access', category: 'general', path: 'permissions', keywords: ['permissions', 'access', 'microphone', 'camera', 'clipboard'], action_type: 'setting', icon: Shield },
  { id: 's-drives', title: 'Drive Access', description: 'Configure drive and storage access', category: 'general', path: 'drives', keywords: ['drive', 'storage', 'disk', 'folder'], action_type: 'setting', icon: Database },
  { id: 's-audit', title: 'Audit Log', description: 'View action history and audit trail', category: 'general', path: 'audit', keywords: ['audit', 'log', 'history', 'trail', 'actions'], action_type: 'setting', icon: Settings },
  { id: 's-performance', title: 'Performance', description: 'Hardware acceleration and processing', category: 'general', path: 'performance', keywords: ['performance', 'gpu', 'cpu', 'speed', 'optimization'], action_type: 'setting', icon: Settings },
];

export default function SmartSettingsSearch() {
  const { tenantId } = useActiveTenant();
  const [, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('atlas-search-history');
    if (saved) {
      try { setSearchHistory(JSON.parse(saved)); } catch { /* ignore */ }
    }
  }, []);

  useEffect(() => {
    if (query.length > 1) {
      searchSettingsLocal(query);
    } else {
      setSuggestions([]);
    }
  }, [query, selectedCategory]);

  /** Navigate to a settings tab */
  const navigateToTab = (tab: string) => {
    setSearchParams({ tab }, { replace: true });
    setShowResults(false);
    setQuery('');
  };

  /** Client-side fuzzy search across all settings + quick actions */
  const searchSettingsLocal = (q: string) => {
    setIsSearching(true);
    const lower = q.toLowerCase();
    const catFilter = selectedCategory === 'all' ? null : selectedCategory;
    const results = ALL_SETTINGS.filter(s => {
      if (catFilter && s.category !== catFilter) return false;
      return s.title.toLowerCase().includes(lower) ||
             s.description.toLowerCase().includes(lower) ||
             s.keywords.some(k => k.includes(lower));
    });
    setSuggestions(results);
    setIsSearching(false);
  };

  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery);
    setShowResults(true);

    const historyItem: SearchHistory = {
      query: searchQuery,
      timestamp: new Date().toISOString(),
      results_count: suggestions.length,
    };

    const updated = [historyItem, ...searchHistory.slice(0, 9)];
    setSearchHistory(updated);
    localStorage.setItem('atlas-search-history', JSON.stringify(updated));
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    // Navigate to the correct settings tab
    const tab = suggestion.path || CATEGORY_TO_TAB[suggestion.category] || 'general';
    navigateToTab(tab);
    toast.success(`Opened: ${suggestion.title}`);

    const historyItem: SearchHistory = {
      query: query,
      timestamp: new Date().toISOString(),
      results_count: suggestions.length,
      clicked_result: suggestion.id,
    };
    const updated = [historyItem, ...searchHistory.slice(0, 9)];
    setSearchHistory(updated);
    localStorage.setItem('atlas-search-history', JSON.stringify(updated));
  };

  const handleQuickAction = (action: typeof QUICK_ACTIONS[0]) => {
    const tab = CATEGORY_TO_TAB[action.category] || 'general';
    navigateToTab(tab);
    toast.success(`Opened: ${action.title}`);
  };

  const getCategoryIcon = (category: string) => {
    return SETTING_CATEGORIES[category as keyof typeof SETTING_CATEGORIES]?.icon || Settings;
  };

  const getCategoryStyle = (category: string) => {
    return SETTING_CATEGORIES[category as keyof typeof SETTING_CATEGORIES] || SETTING_CATEGORIES.general;
  };

  const allSuggestions = [
    ...suggestions,
    ...QUICK_ACTIONS.filter(action => 
      query.length > 2 ? 
      action.keywords.some(keyword => keyword.toLowerCase().includes(query.toLowerCase())) :
      true
    ),
    ...HELP_ARTICLES.filter(article => 
      query.length > 2 ? 
      article.keywords.some(keyword => keyword.toLowerCase().includes(query.toLowerCase())) :
      false
    ),
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Search className="w-6 h-6 text-cyan-400" />
            Smart Settings Search
          </h2>
          <p className="text-slate-400">AI-powered settings discovery and quick actions</p>
        </div>
      </div>

      {/* Search Bar */}
      <Card className="bg-slate-900/50 border-cyan-500/20 p-6">
        <div className="relative" ref={searchRef}>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <Input
              placeholder="Search settings, features, or get help..."
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={() => setShowResults(true)}
              className="bg-slate-800 border-slate-600 pl-12 pr-12 h-12 text-lg"
            />
            {query && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setQuery('')}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white"
              >
                ×
              </Button>
            )}
          </div>

          {/* Search Results Dropdown */}
          {showResults && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-50 max-h-96 overflow-hidden">
              {/* Category Filter */}
              <div className="flex items-center gap-2 p-3 border-b border-slate-600">
                <Filter className="w-4 h-4 text-slate-400" />
                <div className="flex gap-2 flex-wrap">
                  <Button
                    size="sm"
                    variant={selectedCategory === 'all' ? 'default' : 'outline'}
                    onClick={() => setSelectedCategory('all')}
                    className="text-xs"
                  >
                    All
                  </Button>
                  {Object.keys(SETTING_CATEGORIES).map(category => (
                    <Button
                      key={category}
                      size="sm"
                      variant={selectedCategory === category ? 'default' : 'outline'}
                      onClick={() => setSelectedCategory(category)}
                      className="text-xs capitalize"
                    >
                      {category}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Results */}
              <ScrollArea className="max-h-80">
                {isSearching ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-400"></div>
                  </div>
                ) : allSuggestions.length > 0 ? (
                  <div className="p-2">
                    {allSuggestions.map((suggestion) => {
                      const Icon = suggestion.icon;
                      const categoryStyle = getCategoryStyle(suggestion.category);
                      
                      return (
                        <div
                          key={suggestion.id}
                          className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-700 cursor-pointer transition-colors"
                          onClick={() => handleSuggestionClick(suggestion)}
                        >
                          <div className={`w-8 h-8 rounded-lg ${categoryStyle.bgColor} flex items-center justify-center`}>
                            <Icon className={`w-4 h-4 ${categoryStyle.color}`} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="text-white font-medium">{suggestion.title}</h4>
                              <Badge variant="secondary" className="text-xs bg-slate-700 text-slate-300">
                                {suggestion.action_type}
                              </Badge>
                            </div>
                            <p className="text-sm text-slate-400">{suggestion.description}</p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        </div>
                      );
                    })}
                  </div>
                ) : query.length > 2 ? (
                  <div className="text-center p-8">
                    <Search className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                    <h4 className="text-lg font-semibold text-white mb-2">No Results Found</h4>
                    <p className="text-slate-400">Try different keywords or browse categories</p>
                  </div>
                ) : null}
              </ScrollArea>
            </div>
          )}
        </div>
      </Card>

      {/* Quick Actions */}
      <Card className="bg-slate-900/50 border-cyan-500/20 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-5 h-5 text-yellow-400" />
          <h3 className="text-lg font-semibold text-white">Quick Actions</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {QUICK_ACTIONS.map((action) => {
            const categoryStyle = getCategoryStyle(action.category);
            const Icon = action.icon;
            
            return (
              <div
                key={action.id}
                className="p-4 bg-slate-800/30 rounded-lg border border-slate-600 hover:bg-slate-800/50 cursor-pointer transition-colors"
                onClick={() => handleQuickAction(action)}
              >
                <div className={`w-10 h-10 rounded-lg ${categoryStyle.bgColor} flex items-center justify-center mb-3`}>
                  <Icon className={`w-5 h-5 ${categoryStyle.color}`} />
                </div>
                <h4 className="text-white font-medium mb-1">{action.title}</h4>
                <p className="text-sm text-slate-400">{action.description}</p>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Search History */}
      {searchHistory.length > 0 && (
        <Card className="bg-slate-900/50 border-cyan-500/20 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-semibold text-white">Recent Searches</h3>
          </div>
          
          <div className="space-y-2">
            {searchHistory.slice(0, 5).map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg border border-slate-600 hover:bg-slate-800/50 cursor-pointer transition-colors"
                onClick={() => handleSearch(item.query)}
              >
                <div className="flex items-center gap-3">
                  <History className="w-4 h-4 text-slate-400" />
                  <div>
                    <p className="text-white font-medium">{item.query}</p>
                    <p className="text-xs text-slate-400">
                      {new Date(item.timestamp).toLocaleString()} • {item.results_count} results
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Popular Settings */}
      <Card className="bg-slate-900/50 border-cyan-500/20 p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-green-400" />
          <h3 className="text-lg font-semibold text-white">Popular Settings</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { title: 'Atlas Voice Settings', category: 'atlas', tab: 'atlas', description: 'Configure voice synthesis' },
            { title: 'Analytics Dashboard', category: 'analytics', tab: 'analytics', description: 'View usage metrics' },
            { title: 'Team Management', category: 'teams', tab: 'teams', description: 'Manage team members' },
            { title: 'Workflow Builder', category: 'workflows', tab: 'workflows', description: 'Create automation' },
            { title: 'Knowledge Base', category: 'knowledge', tab: 'knowledge', description: 'Manage documents' },
            { title: 'Security Settings', category: 'security', tab: 'security', description: 'Configure security' },
          ].map((item, index) => {
            const categoryStyle = getCategoryStyle(item.category);
            const Icon = getCategoryIcon(item.category);

            return (
              <div
                key={index}
                className="p-4 bg-slate-800/30 rounded-lg border border-slate-600 hover:bg-slate-800/50 cursor-pointer transition-colors"
                onClick={() => navigateToTab(item.tab)}
              >
                <div className={`w-8 h-8 rounded-lg ${categoryStyle.bgColor} flex items-center justify-center mb-3`}>
                  <Icon className={`w-4 h-4 ${categoryStyle.color}`} />
                </div>
                <h4 className="text-white font-medium mb-1">{item.title}</h4>
                <p className="text-sm text-slate-400">{item.description}</p>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Help & Tips */}
      <Card className="bg-slate-900/50 border-cyan-500/20 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="w-5 h-5 text-yellow-400" />
          <h3 className="text-lg font-semibold text-white">Tips & Shortcuts</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-white font-medium mb-3">Search Tips</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li className="flex items-start gap-2">
                <Target className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                <span>Use specific keywords like "voice", "workflow", "team"</span>
              </li>
              <li className="flex items-start gap-2">
                <Compass className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                <span>Filter by category for faster results</span>
              </li>
              <li className="flex items-start gap-2">
                <Bookmark className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                <span>Frequently accessed settings appear in recommendations</span>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-medium mb-3">Keyboard Shortcuts</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li className="flex items-center justify-between">
                <span>Open search</span>
                <kbd className="px-2 py-1 bg-slate-700 rounded text-xs">Ctrl + K</kbd>
              </li>
              <li className="flex items-center justify-between">
                <span>Clear search</span>
                <kbd className="px-2 py-1 bg-slate-700 rounded text-xs">Escape</kbd>
              </li>
              <li className="flex items-center justify-between">
                <span>Navigate results</span>
                <kbd className="px-2 py-1 bg-slate-700 rounded text-xs">↑ ↓</kbd>
              </li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
