import { useState } from "react";
import { 
  Radio,
  TrendingUp,
  MessageCircle,
  Heart,
  Share2,
  Users,
  Eye,
  Bell,
  Hash,
  BarChart3,
  AlertCircle,
  CheckCircle,
  Clock
} from "lucide-react";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

interface SocialPost {
  id: number;
  platform: "twitter" | "instagram" | "linkedin" | "facebook";
  content: string;
  author: string;
  engagement: {
    likes: number;
    comments: number;
    shares: number;
  };
  sentiment: "positive" | "neutral" | "negative";
  timestamp: string;
  priority: "high" | "medium" | "low";
}

interface Mention {
  id: number;
  platform: string;
  text: string;
  author: string;
  sentiment: "positive" | "neutral" | "negative";
  status: "new" | "reviewed" | "responded";
  timestamp: string;
}

export function SocialMonitoring() {
  const [activeTab, setActiveTab] = useState("overview");
  
  const platforms = [
    { name: "Twitter", color: "blue", posts: 0, engagement: 0, active: false },
    { name: "Instagram", color: "pink", posts: 0, engagement: 0, active: false },
    { name: "LinkedIn", color: "cyan", posts: 0, engagement: 0, active: false },
    { name: "Facebook", color: "indigo", posts: 0, engagement: 0, active: false },
  ];
  
  const mentions: Mention[] = [];
  
  const trendingTopics: any[] = [];
  
  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "positive": return "green";
      case "negative": return "red";
      default: return "slate";
    }
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "new": return AlertCircle;
      case "reviewed": return Eye;
      case "responded": return CheckCircle;
      default: return Clock;
    }
  };
  
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent flex items-center gap-2">
            <Radio className="w-6 h-6 text-cyan-400" />
            Social Media Monitoring
          </h2>
          <p className="text-slate-400 text-sm mt-1">Track mentions, trends, and engagement across platforms</p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" className="border-cyan-500/20">
            <Bell className="w-4 h-4 mr-2" />
            Alerts (0)
          </Button>
          <Button className="bg-cyan-500 hover:bg-cyan-400">
            <Radio className="w-4 h-4 mr-2" />
            Start Listening
          </Button>
        </div>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-slate-900/50 border-cyan-500/20 backdrop-blur-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <MessageCircle className="w-8 h-8 text-blue-400" />
            <TrendingUp className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold">0</div>
          <div className="text-xs text-slate-400 mt-1">Total Mentions</div>
          <div className="text-xs text-slate-400 mt-2">No data yet</div>
        </Card>
        
        <Card className="bg-slate-900/50 border-cyan-500/20 backdrop-blur-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <Heart className="w-8 h-8 text-pink-400" />
            <TrendingUp className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold">0</div>
          <div className="text-xs text-slate-400 mt-1">Total Engagement</div>
          <div className="text-xs text-slate-400 mt-2">No data yet</div>
        </Card>
        
        <Card className="bg-slate-900/50 border-cyan-500/20 backdrop-blur-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <Users className="w-8 h-8 text-purple-400" />
            <TrendingUp className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold">0</div>
          <div className="text-xs text-slate-400 mt-1">Unique Users</div>
          <div className="text-xs text-slate-400 mt-2">No data yet</div>
        </Card>
        
        <Card className="bg-slate-900/50 border-cyan-500/20 backdrop-blur-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <BarChart3 className="w-8 h-8 text-cyan-400" />
            <div className="text-xs text-slate-400">Sentiment</div>
          </div>
          <div className="text-2xl font-bold text-slate-400">0%</div>
          <div className="text-xs text-slate-400 mt-1">Positive Sentiment</div>
          <Progress value={0} className="h-1.5 mt-2" />
        </Card>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-slate-900/50 border border-cyan-500/20">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="mentions">Mentions</TabsTrigger>
          <TabsTrigger value="trending">Trending</TabsTrigger>
          <TabsTrigger value="platforms">Platforms</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {/* Platform Performance */}
            <div className="col-span-2 space-y-4">
              <h3 className="text-lg font-semibold">Platform Performance</h3>
              
              {platforms.map((platform) => (
                <Card key={platform.name} className="bg-slate-900/50 border-cyan-500/20 backdrop-blur-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg bg-${platform.color}-500/20 flex items-center justify-center`}>
                        <Share2 className={`w-5 h-5 text-${platform.color}-400`} />
                      </div>
                      <div>
                        <div className="font-medium">{platform.name}</div>
                        <div className="text-xs text-slate-400">{platform.posts} posts tracked</div>
                      </div>
                    </div>
                    
                    <Badge 
                      variant="outline"
                      className={platform.active ? "border-green-500/40 text-green-400" : "border-slate-500/40 text-slate-400"}
                    >
                      {platform.active ? "Active" : "Paused"}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">Engagement Rate</span>
                      <span className="font-medium">{platform.engagement}%</span>
                    </div>
                    <Progress value={platform.engagement} className="h-2" />
                  </div>
                </Card>
              ))}
            </div>
            
            {/* Recent Activity */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Recent Activity</h3>
              
              <div className="text-center py-12 text-slate-400">
                No recent activity. Start monitoring to see real-time updates.
              </div>
            </div>
          </div>
        </TabsContent>
        
        {/* Mentions Tab */}
        <TabsContent value="mentions" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Brand Mentions</h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="border-cyan-500/20">
                All
              </Button>
              <Button variant="outline" size="sm" className="border-cyan-500/20">
                Positive
              </Button>
              <Button variant="outline" size="sm" className="border-cyan-500/20">
                Negative
              </Button>
              <Button variant="outline" size="sm" className="border-cyan-500/20">
                Neutral
              </Button>
            </div>
          </div>
          
          <div className="space-y-3">
            {mentions.map((mention) => {
              const StatusIcon = getStatusIcon(mention.status);
              const sentimentColor = getSentimentColor(mention.sentiment);
              
              return (
                <Card key={mention.id} className="bg-slate-900/50 border-cyan-500/20 backdrop-blur-xl p-4 hover:bg-slate-900/70 transition-all">
                  <div className="flex gap-4">
                    <div className={`w-10 h-10 rounded-lg bg-${sentimentColor}-500/20 flex items-center justify-center flex-shrink-0`}>
                      <MessageCircle className={`w-5 h-5 text-${sentimentColor}-400`} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{mention.author}</span>
                          <Badge variant="outline" className="text-xs border-cyan-500/20">
                            {mention.platform}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="outline"
                            className={`text-xs border-${sentimentColor}-500/40 text-${sentimentColor}-400`}
                          >
                            {mention.sentiment}
                          </Badge>
                          <StatusIcon className={`w-4 h-4 ${
                            mention.status === "new" ? "text-yellow-400" :
                            mention.status === "reviewed" ? "text-blue-400" :
                            "text-green-400"
                          }`} />
                        </div>
                      </div>
                      
                      <p className="text-sm text-slate-300 mb-2">{mention.text}</p>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500">{mention.timestamp}</span>
                        
                        {mention.status === "new" && (
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" className="text-xs border-cyan-500/20">
                              Mark Reviewed
                            </Button>
                            <Button size="sm" className="text-xs bg-cyan-500 hover:bg-cyan-400">
                              Respond
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </TabsContent>
        
        {/* Trending Tab */}
        <TabsContent value="trending" className="space-y-4">
          <h3 className="text-lg font-semibold">Trending Topics</h3>
          
          <div className="space-y-3">
            {trendingTopics.map((topic, index) => (
              <Card key={topic.tag} className="bg-slate-900/50 border-cyan-500/20 backdrop-blur-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-2xl font-bold text-slate-600">#{index + 1}</div>
                    
                    <div>
                      <div className="flex items-center gap-2">
                        <Hash className="w-4 h-4 text-cyan-400" />
                        <span className="font-medium">{topic.tag}</span>
                        <Badge variant="outline" className="text-xs border-green-500/40 text-green-400">
                          {topic.trend}
                        </Badge>
                      </div>
                      <div className="text-sm text-slate-400 mt-1">{topic.mentions.toLocaleString()} mentions</div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm font-medium text-green-400">{topic.sentiment}%</div>
                    <div className="text-xs text-slate-400">Positive</div>
                    <Progress value={topic.sentiment} className="h-1.5 w-24 mt-2" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        {/* Platforms Tab */}
        <TabsContent value="platforms" className="space-y-4">
          <h3 className="text-lg font-semibold">Platform Configuration</h3>
          
          <div className="grid grid-cols-2 gap-4">
            {platforms.map((platform) => (
              <Card key={platform.name} className="bg-slate-900/50 border-cyan-500/20 backdrop-blur-xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl bg-${platform.color}-500/20 flex items-center justify-center`}>
                      <Share2 className={`w-6 h-6 text-${platform.color}-400`} />
                    </div>
                    <div>
                      <div className="font-medium text-lg">{platform.name}</div>
                      <div className="text-xs text-slate-400">Real-time monitoring</div>
                    </div>
                  </div>
                  
                  <Badge 
                    variant="outline"
                    className={platform.active ? "border-green-500/40 text-green-400" : "border-slate-500/40 text-slate-400"}
                  >
                    {platform.active ? "Active" : "Paused"}
                  </Badge>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Posts Tracked</span>
                    <span className="font-medium">{platform.posts}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Engagement Rate</span>
                    <span className="font-medium">{platform.engagement}%</span>
                  </div>
                  
                  <Progress value={platform.engagement} className="h-2" />
                  
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" className="flex-1 text-xs border-cyan-500/20">
                      Configure
                    </Button>
                    <Button 
                      className={`flex-1 text-xs ${
                        platform.active 
                          ? "bg-slate-700 hover:bg-slate-600" 
                          : "bg-cyan-500 hover:bg-cyan-400"
                      }`}
                    >
                      {platform.active ? "Pause" : "Activate"}
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}