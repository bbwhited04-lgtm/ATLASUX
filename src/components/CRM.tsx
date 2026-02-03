import { useState } from "react";
import { 
  Users, 
  UserPlus,
  Download,
  Upload,
  Search,
  Filter,
  Mail,
  Phone,
  MessageSquare,
  MoreVertical,
  Star,
  Tag,
  Calendar,
  TrendingUp,
  Facebook,
  Instagram,
  Twitter,
  Smartphone,
  CheckCircle2,
  Clock,
  AlertCircle
} from "lucide-react";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { ScrollArea } from "./ui/scroll-area";
import { Avatar, AvatarFallback } from "./ui/avatar";

interface Contact {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  source: "phone" | "facebook" | "instagram" | "tiktok" | "linkedin" | "manual";
  tags: string[];
  lastContact: string;
  status: "active" | "pending" | "inactive";
  notes?: string;
}

interface ImportSource {
  id: string;
  name: string;
  icon: any;
  color: string;
  count: number;
  connected: boolean;
  type: "social" | "device";
}

export function CRM() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  
  const [importSources] = useState<ImportSource[]>([
    { 
      id: "phone", 
      name: "Phone Contacts", 
      icon: Smartphone, 
      color: "cyan",
      count: 0, 
      connected: false,
      type: "device"
    },
    { 
      id: "facebook", 
      name: "Facebook Friends", 
      icon: Facebook, 
      color: "blue",
      count: 0, 
      connected: false,
      type: "social"
    },
    { 
      id: "instagram", 
      name: "Instagram Followers", 
      icon: Instagram, 
      color: "pink",
      count: 0, 
      connected: false,
      type: "social"
    },
    { 
      id: "tiktok", 
      name: "TikTok Followers", 
      icon: MessageSquare, 
      color: "slate",
      count: 0, 
      connected: false,
      type: "social"
    },
    { 
      id: "linkedin", 
      name: "LinkedIn Connections", 
      icon: Users, 
      color: "blue",
      count: 0, 
      connected: false,
      type: "social"
    },
    { 
      id: "twitter", 
      name: "Twitter Followers", 
      icon: Twitter, 
      color: "cyan",
      count: 0, 
      connected: false,
      type: "social"
    },
  ]);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [showImportModal, setShowImportModal] = useState(false);
  
  const getSourceIcon = (source: string) => {
    switch (source) {
      case "facebook": return Facebook;
      case "instagram": return Instagram;
      case "tiktok": return MessageSquare;
      case "linkedin": return Users;
      case "twitter": return Twitter;
      case "phone": return Smartphone;
      default: return UserPlus;
    }
  };
  
  const getSourceColor = (source: string) => {
    switch (source) {
      case "facebook": return "blue";
      case "instagram": return "pink";
      case "tiktok": return "slate";
      case "linkedin": return "blue";
      case "twitter": return "cyan";
      case "phone": return "green";
      default: return "slate";
    }
  };
  
  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         contact.email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeTab === "all") return matchesSearch;
    return matchesSearch && contact.status === activeTab;
  });
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active": return CheckCircle2;
      case "pending": return Clock;
      case "inactive": return AlertCircle;
      default: return CheckCircle2;
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "green";
      case "pending": return "yellow";
      case "inactive": return "slate";
      default: return "slate";
    }
  };
  
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent flex items-center gap-2">
            <Users className="w-6 h-6 text-cyan-400" />
            CRM & Contacts
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Manage contacts imported from social media and devices
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="border-cyan-500/20"
            onClick={() => setShowImportModal(!showImportModal)}
          >
            <Download className="w-4 h-4 mr-2" />
            Import Contacts
          </Button>
          <Button className="bg-cyan-500 hover:bg-cyan-400">
            <UserPlus className="w-4 h-4 mr-2" />
            Add Contact
          </Button>
        </div>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-5 gap-4">
        <Card className="bg-slate-900/50 border-cyan-500/20 backdrop-blur-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <div className="text-2xl font-bold">{contacts.length}</div>
              <div className="text-xs text-slate-400">Total Contacts</div>
            </div>
          </div>
        </Card>
        
        <Card className="bg-slate-900/50 border-cyan-500/20 backdrop-blur-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-green-400">{contacts.filter(c => c.status === "active").length}</div>
              <div className="text-xs text-slate-400">Active</div>
            </div>
          </div>
        </Card>
        
        <Card className="bg-slate-900/50 border-cyan-500/20 backdrop-blur-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-400">{contacts.filter(c => c.status === "pending").length}</div>
              <div className="text-xs text-slate-400">Pending</div>
            </div>
          </div>
        </Card>
        
        <Card className="bg-slate-900/50 border-cyan-500/20 backdrop-blur-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Facebook className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-400">{contacts.filter(c => c.source === "facebook").length}</div>
              <div className="text-xs text-slate-400">From Facebook</div>
            </div>
          </div>
        </Card>
        
        <Card className="bg-slate-900/50 border-cyan-500/20 backdrop-blur-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-pink-500/20 flex items-center justify-center">
              <Instagram className="w-5 h-5 text-pink-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-pink-400">{contacts.filter(c => c.source === "instagram").length}</div>
              <div className="text-xs text-slate-400">From Instagram</div>
            </div>
          </div>
        </Card>
      </div>
      
      {/* Import Modal */}
      {showImportModal && (
        <Card className="bg-slate-900/50 border-cyan-500/20 backdrop-blur-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Import Contacts</h3>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowImportModal(false)}
            >
              Close
            </Button>
          </div>
          
          <p className="text-sm text-slate-400 mb-4">
            Select sources to import contacts from. Atlas will automatically sync and deduplicate contacts.
          </p>
          
          <div className="grid grid-cols-3 gap-4">
            {importSources.map((source) => {
              const Icon = source.icon;
              
              return (
                <Card 
                  key={source.id}
                  className={`p-4 transition-all cursor-pointer ${
                    source.connected 
                      ? `bg-${source.color}-500/10 border-${source.color}-500/30` 
                      : "bg-slate-900/50 border-cyan-500/20 hover:bg-slate-900/70"
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-10 h-10 rounded-lg bg-${source.color}-500/20 flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 text-${source.color}-400`} />
                    </div>
                    {source.connected && (
                      <Badge variant="outline" className="border-green-500/40 text-green-400 text-xs">
                        Connected
                      </Badge>
                    )}
                  </div>
                  
                  <div>
                    <div className="font-medium text-sm mb-1">{source.name}</div>
                    <div className="text-xs text-slate-400 mb-3">{source.count.toLocaleString()} contacts available</div>
                    
                    {source.connected ? (
                      <Button size="sm" className="w-full text-xs bg-cyan-500 hover:bg-cyan-400">
                        <Download className="w-3 h-3 mr-1" />
                        Import Now
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" className="w-full text-xs border-cyan-500/20">
                        Connect
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </Card>
      )}
      
      {/* Search and Filter */}
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search contacts by name or email..."
            className="pl-10 bg-slate-900/50 border-cyan-500/20"
          />
        </div>
        
        <Button variant="outline" size="icon" className="border-cyan-500/20">
          <Filter className="w-4 h-4" />
        </Button>
        
        <Button variant="outline" className="border-cyan-500/20">
          <Upload className="w-4 h-4 mr-2" />
          Export
        </Button>
      </div>
      
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-slate-900/50 border border-cyan-500/20">
          <TabsTrigger value="all">
            All Contacts ({contacts.length})
          </TabsTrigger>
          <TabsTrigger value="active">
            Active ({contacts.filter(c => c.status === "active").length})
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pending ({contacts.filter(c => c.status === "pending").length})
          </TabsTrigger>
          <TabsTrigger value="inactive">
            Inactive ({contacts.filter(c => c.status === "inactive").length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab} className="space-y-3">
          {filteredContacts.map((contact) => {
            const SourceIcon = getSourceIcon(contact.source);
            const sourceColor = getSourceColor(contact.source);
            const StatusIcon = getStatusIcon(contact.status);
            const statusColor = getStatusColor(contact.status);
            
            return (
              <Card 
                key={contact.id}
                className="bg-slate-900/50 border-cyan-500/20 backdrop-blur-xl p-4 hover:bg-slate-900/70 transition-all"
              >
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <Avatar className="w-12 h-12">
                    <AvatarFallback className="bg-cyan-500/20 text-cyan-400">
                      {contact.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  {/* Contact Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-medium text-slate-200 flex items-center gap-2">
                          {contact.name}
                          <Badge 
                            variant="outline" 
                            className={`text-xs border-${statusColor}-500/40 text-${statusColor}-400`}
                          >
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {contact.status}
                          </Badge>
                        </h4>
                        
                        <div className="flex items-center gap-3 mt-1 text-sm text-slate-400">
                          {contact.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {contact.email}
                            </span>
                          )}
                          {contact.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {contact.phone}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <Button variant="ghost" size="icon" className="flex-shrink-0">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`flex items-center gap-1 text-xs text-slate-400 px-2 py-1 rounded bg-${sourceColor}-500/10 border border-${sourceColor}-500/20`}>
                          <SourceIcon className={`w-3 h-3 text-${sourceColor}-400`} />
                          <span className="capitalize">{contact.source}</span>
                        </div>
                        
                        {contact.tags.map((tag, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs border-cyan-500/20">
                            <Tag className="w-3 h-3 mr-1" />
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Last contact: {contact.lastContact}
                        </span>
                        
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" className="text-xs border-cyan-500/20">
                            <Mail className="w-3 h-3 mr-1" />
                            Email
                          </Button>
                          <Button size="sm" variant="outline" className="text-xs border-cyan-500/20">
                            <MessageSquare className="w-3 h-3 mr-1" />
                            Message
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
          
          {filteredContacts.length === 0 && (
            <Card className="bg-slate-900/50 border-cyan-500/20 backdrop-blur-xl p-12 text-center">
              <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h4 className="font-medium text-slate-400 mb-1">No contacts found</h4>
              <p className="text-sm text-slate-500">
                {searchQuery ? "Try adjusting your search" : "Import contacts to get started"}
              </p>
            </Card>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Sync Status */}
      <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/30 backdrop-blur-xl p-6">
        <div className="flex items-start gap-4">
          <TrendingUp className="w-12 h-12 text-purple-400 flex-shrink-0" />
          <div>
            <h4 className="font-semibold mb-2">Auto-Sync Active</h4>
            <p className="text-sm text-slate-300 mb-3">
              Atlas automatically syncs contacts from connected platforms every 24 hours. 
              Last sync was 2 hours ago. New contacts are automatically deduplicated and tagged.
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="text-xs border-cyan-500/20">
                <Download className="w-3 h-3 mr-1" />
                Sync Now
              </Button>
              <Button size="sm" variant="outline" className="text-xs border-cyan-500/20">
                Sync Settings
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}