import { useState } from "react";
import { 
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Eye,
  MousePointerClick,
  Clock,
  Globe,
  Smartphone,
  Heart,
  MessageCircle,
  Share2,
  Calendar,
  Download,
  RefreshCw,
  CheckCircle2
} from "lucide-react";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts";

export function Analytics() {
  const [timeRange, setTimeRange] = useState("7d");
  const [activeTab, setActiveTab] = useState("overview");
  
  // Google Analytics Data
  const websiteData = [
    { date: "Mon", visitors: 2400, pageviews: 4200, sessions: 3100 },
    { date: "Tue", visitors: 1398, pageviews: 3800, sessions: 2200 },
    { date: "Wed", visitors: 9800, pageviews: 12000, sessions: 10500 },
    { date: "Thu", visitors: 3908, pageviews: 6800, sessions: 4900 },
    { date: "Fri", visitors: 4800, pageviews: 8100, sessions: 6200 },
    { date: "Sat", visitors: 3800, pageviews: 6500, sessions: 5100 },
    { date: "Sun", visitors: 4300, pageviews: 7200, sessions: 5800 },
  ];
  
  // Social Media Metrics
  const socialData = [
    { platform: "Instagram", followers: 15420, engagement: 8.4, posts: 124, color: "#E1306C" },
    { platform: "Facebook", followers: 8932, engagement: 5.2, posts: 89, color: "#1877F2" },
    { platform: "Twitter", followers: 12547, engagement: 6.8, posts: 267, color: "#1DA1F2" },
    { platform: "LinkedIn", followers: 5678, engagement: 4.1, posts: 45, color: "#0A66C2" },
    { platform: "TikTok", followers: 28934, engagement: 12.3, posts: 78, color: "#000000" },
  ];
  
  const engagementData = [
    { date: "Mon", likes: 450, comments: 89, shares: 34 },
    { date: "Tue", likes: 380, comments: 72, shares: 28 },
    { date: "Wed", likes: 890, comments: 156, shares: 67 },
    { date: "Thu", likes: 520, comments: 94, shares: 41 },
    { date: "Fri", likes: 670, comments: 112, shares: 53 },
    { date: "Sat", likes: 540, comments: 98, shares: 45 },
    { date: "Sun", likes: 610, comments: 103, shares: 48 },
  ];
  
  const trafficSources = [
    { name: "Organic Search", value: 45, color: "#10B981" },
    { name: "Direct", value: 25, color: "#3B82F6" },
    { name: "Social Media", value: 20, color: "#8B5CF6" },
    { name: "Referral", value: 7, color: "#F59E0B" },
    { name: "Email", value: 3, color: "#EF4444" },
  ];
  
  const topPages = [
    { page: "/home", views: 12450, avgTime: "2:34", bounceRate: "32%" },
    { page: "/products", views: 8932, avgTime: "3:12", bounceRate: "28%" },
    { page: "/blog/ai-automation", views: 6547, avgTime: "4:56", bounceRate: "18%" },
    { page: "/pricing", views: 5234, avgTime: "1:45", bounceRate: "45%" },
    { page: "/contact", views: 3891, avgTime: "1:23", bounceRate: "52%" },
  ];
  
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-cyan-400" />
            Analytics Dashboard
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Track website, social media, and business metrics
          </p>
        </div>
        
        <div className="flex gap-2">
          <div className="flex border border-cyan-500/20 rounded-lg overflow-hidden">
            {["24h", "7d", "30d", "90d"].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 text-xs transition-colors ${
                  timeRange === range 
                    ? "bg-cyan-500/20 text-cyan-400" 
                    : "text-slate-400 hover:bg-slate-800"
                }`}
              >
                {range}
              </button>
            ))}
          </div>
          
          <Button variant="outline" className="border-cyan-500/20">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          
          <Button variant="outline" className="border-cyan-500/20">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-5 gap-4">
        <Card className="bg-slate-900/50 border-cyan-500/20 backdrop-blur-xl p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <Badge variant="outline" className="border-green-500/40 text-green-400 text-xs">
              <TrendingUp className="w-3 h-3 mr-1" />
              +12%
            </Badge>
          </div>
          <div className="text-2xl font-bold">34.2K</div>
          <div className="text-xs text-slate-400 mt-1">Total Visitors</div>
        </Card>
        
        <Card className="bg-slate-900/50 border-cyan-500/20 backdrop-blur-xl p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <Eye className="w-5 h-5 text-purple-400" />
            </div>
            <Badge variant="outline" className="border-green-500/40 text-green-400 text-xs">
              <TrendingUp className="w-3 h-3 mr-1" />
              +8%
            </Badge>
          </div>
          <div className="text-2xl font-bold">58.6K</div>
          <div className="text-xs text-slate-400 mt-1">Page Views</div>
        </Card>
        
        <Card className="bg-slate-900/50 border-cyan-500/20 backdrop-blur-xl p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
              <MousePointerClick className="w-5 h-5 text-cyan-400" />
            </div>
            <Badge variant="outline" className="border-red-500/40 text-red-400 text-xs">
              <TrendingDown className="w-3 h-3 mr-1" />
              -3%
            </Badge>
          </div>
          <div className="text-2xl font-bold">4.8%</div>
          <div className="text-xs text-slate-400 mt-1">Click Rate</div>
        </Card>
        
        <Card className="bg-slate-900/50 border-cyan-500/20 backdrop-blur-xl p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-green-400" />
            </div>
            <Badge variant="outline" className="border-green-500/40 text-green-400 text-xs">
              <TrendingUp className="w-3 h-3 mr-1" />
              +15%
            </Badge>
          </div>
          <div className="text-2xl font-bold">3:24</div>
          <div className="text-xs text-slate-400 mt-1">Avg. Session</div>
        </Card>
        
        <Card className="bg-slate-900/50 border-cyan-500/20 backdrop-blur-xl p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-pink-500/20 flex items-center justify-center">
              <Heart className="w-5 h-5 text-pink-400" />
            </div>
            <Badge variant="outline" className="border-green-500/40 text-green-400 text-xs">
              <TrendingUp className="w-3 h-3 mr-1" />
              +24%
            </Badge>
          </div>
          <div className="text-2xl font-bold">71.2K</div>
          <div className="text-xs text-slate-400 mt-1">Social Followers</div>
        </Card>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-slate-900/50 border border-cyan-500/20">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="website">Website Analytics</TabsTrigger>
          <TabsTrigger value="social">Social Media</TabsTrigger>
          <TabsTrigger value="traffic">Traffic Sources</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Visitors Chart */}
            <Card className="bg-slate-900/50 border-cyan-500/20 backdrop-blur-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Website Traffic</h3>
                <Badge variant="outline" className="border-cyan-500/20">
                  Google Analytics
                </Badge>
              </div>
              
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={websiteData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="date" stroke="#94a3b8" style={{ fontSize: 12 }} />
                  <YAxis stroke="#94a3b8" style={{ fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      border: '1px solid #334155',
                      borderRadius: '8px'
                    }} 
                  />
                  <Legend />
                  <Line type="monotone" dataKey="visitors" stroke="#06b6d4" strokeWidth={2} />
                  <Line type="monotone" dataKey="pageviews" stroke="#8b5cf6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </Card>
            
            {/* Social Engagement */}
            <Card className="bg-slate-900/50 border-cyan-500/20 backdrop-blur-xl p-6">
              <h3 className="font-semibold mb-4">Social Media Engagement</h3>
              
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={engagementData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="date" stroke="#94a3b8" style={{ fontSize: 12 }} />
                  <YAxis stroke="#94a3b8" style={{ fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      border: '1px solid #334155',
                      borderRadius: '8px'
                    }} 
                  />
                  <Legend />
                  <Bar dataKey="likes" fill="#ec4899" />
                  <Bar dataKey="comments" fill="#06b6d4" />
                  <Bar dataKey="shares" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>
          
          {/* Social Platforms Performance */}
          <Card className="bg-slate-900/50 border-cyan-500/20 backdrop-blur-xl p-6">
            <h3 className="font-semibold mb-4">Platform Performance</h3>
            
            <div className="space-y-3">
              {socialData.map((platform) => (
                <div key={platform.platform} className="flex items-center gap-4">
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${platform.color}20` }}
                  >
                    <div 
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: platform.color }}
                    />
                  </div>
                  
                  <div className="flex-1 grid grid-cols-4 gap-4">
                    <div>
                      <div className="font-medium text-sm">{platform.platform}</div>
                      <div className="text-xs text-slate-400">{platform.posts} posts</div>
                    </div>
                    
                    <div>
                      <div className="text-sm font-medium">{platform.followers.toLocaleString()}</div>
                      <div className="text-xs text-slate-400">Followers</div>
                    </div>
                    
                    <div>
                      <div className="text-sm font-medium text-green-400">{platform.engagement}%</div>
                      <div className="text-xs text-slate-400">Engagement</div>
                    </div>
                    
                    <div className="flex justify-end">
                      <Button size="sm" variant="outline" className="text-xs border-cyan-500/20">
                        View Details
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>
        
        {/* Website Analytics Tab */}
        <TabsContent value="website" className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <Card className="col-span-2 bg-slate-900/50 border-cyan-500/20 backdrop-blur-xl p-6">
              <h3 className="font-semibold mb-4">Sessions & Page Views</h3>
              
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={websiteData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="date" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      border: '1px solid #334155',
                      borderRadius: '8px'
                    }} 
                  />
                  <Legend />
                  <Line type="monotone" dataKey="sessions" stroke="#06b6d4" strokeWidth={2} />
                  <Line type="monotone" dataKey="pageviews" stroke="#8b5cf6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </Card>
            
            <Card className="bg-slate-900/50 border-cyan-500/20 backdrop-blur-xl p-6">
              <h3 className="font-semibold mb-4">Device Breakdown</h3>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-cyan-400" />
                      <span>Mobile</span>
                    </div>
                    <span className="font-medium">58%</span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-cyan-500" style={{ width: "58%" }} />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-purple-400" />
                      <span>Desktop</span>
                    </div>
                    <span className="font-medium">35%</span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500" style={{ width: "35%" }} />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-pink-400" />
                      <span>Tablet</span>
                    </div>
                    <span className="font-medium">7%</span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-pink-500" style={{ width: "7%" }} />
                  </div>
                </div>
              </div>
            </Card>
          </div>
          
          {/* Top Pages */}
          <Card className="bg-slate-900/50 border-cyan-500/20 backdrop-blur-xl p-6">
            <h3 className="font-semibold mb-4">Top Performing Pages</h3>
            
            <div className="space-y-2">
              {topPages.map((page, idx) => (
                <div 
                  key={idx}
                  className="flex items-center gap-4 p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors"
                >
                  <div className="w-8 text-center">
                    <span className="text-2xl font-bold text-slate-600">#{idx + 1}</span>
                  </div>
                  
                  <div className="flex-1 grid grid-cols-4 gap-4">
                    <div className="col-span-2">
                      <div className="font-medium text-sm text-slate-200">{page.page}</div>
                    </div>
                    
                    <div>
                      <div className="text-sm font-medium">{page.views.toLocaleString()}</div>
                      <div className="text-xs text-slate-400">Views</div>
                    </div>
                    
                    <div>
                      <div className="text-sm font-medium">{page.avgTime}</div>
                      <div className="text-xs text-slate-400">Avg. Time</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>
        
        {/* Social Media Tab */}
        <TabsContent value="social" className="space-y-4">
          <div className="grid grid-cols-5 gap-4">
            {socialData.map((platform) => (
              <Card 
                key={platform.platform}
                className="bg-slate-900/50 border-cyan-500/20 backdrop-blur-xl p-4"
              >
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
                  style={{ backgroundColor: `${platform.color}20` }}
                >
                  <div 
                    className="w-6 h-6 rounded"
                    style={{ backgroundColor: platform.color }}
                  />
                </div>
                
                <div className="font-medium mb-1">{platform.platform}</div>
                <div className="text-2xl font-bold mb-1">{platform.followers.toLocaleString()}</div>
                <div className="text-xs text-slate-400 mb-3">Followers</div>
                
                <div className="text-sm text-green-400">+{platform.engagement}% engagement</div>
              </Card>
            ))}
          </div>
          
          <Card className="bg-slate-900/50 border-cyan-500/20 backdrop-blur-xl p-6">
            <h3 className="font-semibold mb-4">Engagement Trends</h3>
            
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={engagementData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    border: '1px solid #334155',
                    borderRadius: '8px'
                  }} 
                />
                <Legend />
                <Bar dataKey="likes" fill="#ec4899" />
                <Bar dataKey="comments" fill="#06b6d4" />
                <Bar dataKey="shares" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </TabsContent>
        
        {/* Traffic Sources Tab */}
        <TabsContent value="traffic" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-slate-900/50 border-cyan-500/20 backdrop-blur-xl p-6">
              <h3 className="font-semibold mb-4">Traffic Distribution</h3>
              
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={trafficSources}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {trafficSources.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>
            
            <Card className="bg-slate-900/50 border-cyan-500/20 backdrop-blur-xl p-6">
              <h3 className="font-semibold mb-4">Traffic Sources Breakdown</h3>
              
              <div className="space-y-4">
                {trafficSources.map((source) => (
                  <div key={source.name} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>{source.name}</span>
                      <span className="font-medium">{source.value}%</span>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full transition-all"
                        style={{ 
                          width: `${source.value}%`,
                          backgroundColor: source.color
                        }} 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Google Analytics Connection */}
      <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-cyan-500/30 backdrop-blur-xl p-6">
        <div className="flex items-start gap-4">
          <BarChart3 className="w-12 h-12 text-cyan-400 flex-shrink-0" />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="font-semibold">Google Analytics Integration</h4>
              <Badge variant="outline" className="border-green-500/40 text-green-400 text-xs">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Connected
              </Badge>
            </div>
            <p className="text-sm text-slate-300 mb-3">
              Atlas is syncing with your Google Analytics account. Data is updated every hour. 
              Last sync: 15 minutes ago
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="text-xs border-cyan-500/20">
                <RefreshCw className="w-3 h-3 mr-1" />
                Sync Now
              </Button>
              <Button size="sm" variant="outline" className="text-xs border-cyan-500/20">
                Analytics Settings
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}