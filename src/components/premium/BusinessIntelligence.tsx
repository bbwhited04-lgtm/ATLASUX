import { useState } from 'react';
import { 
  TrendingUp, Newspaper, DollarSign, Heart, Brain,
  BarChart3, AlertCircle, Target, Search, ExternalLink,
  ArrowUp, ArrowDown, Activity, Users, Globe
} from 'lucide-react';

export function BusinessIntelligence() {
  const competitors = [
    {
      name: 'CompetitorAI Inc.',
      sentiment: 'positive',
      mentions: 234,
      trend: 'up',
      recentActivity: 'Launched new AI assistant feature',
      stockChange: '+12.3%'
    },
    {
      name: 'WorkflowPro',
      sentiment: 'neutral',
      mentions: 156,
      trend: 'down',
      recentActivity: 'Pricing model update announced',
      stockChange: '-3.1%'
    },
    {
      name: 'AutomateNow',
      sentiment: 'negative',
      mentions: 89,
      trend: 'up',
      recentActivity: 'Security breach reported',
      stockChange: '-8.7%'
    },
  ];

  const industryNews = [
    {
      id: 1,
      title: 'AI Automation Market Expected to Reach $50B by 2026',
      source: 'TechCrunch',
      relevance: 95,
      time: '2 hours ago',
      summary: 'New report shows explosive growth in enterprise AI adoption...'
    },
    {
      id: 2,
      title: 'Major Players Enter AI Agent Competition',
      source: 'Forbes',
      relevance: 88,
      time: '5 hours ago',
      summary: 'Industry giants announce new AI employee products...'
    },
    {
      id: 3,
      title: 'Regulatory Changes Impact AI Software Deployment',
      source: 'Bloomberg',
      relevance: 76,
      time: '1 day ago',
      summary: 'New compliance requirements for enterprise AI...'
    },
    {
      id: 4,
      title: 'Study: AI Assistants Boost Productivity by 40%',
      source: 'MIT Technology Review',
      relevance: 92,
      time: '2 days ago',
      summary: 'Research demonstrates significant efficiency gains...'
    },
  ];

  const stockWatchlist = [
    { symbol: 'AAPL', name: 'Apple Inc.', price: 178.23, change: 2.34, changePercent: 1.33, trend: 'up' },
    { symbol: 'MSFT', name: 'Microsoft', price: 412.56, change: -1.87, changePercent: -0.45, trend: 'down' },
    { symbol: 'GOOGL', name: 'Alphabet', price: 142.89, change: 3.12, changePercent: 2.23, trend: 'up' },
    { symbol: 'META', name: 'Meta Platforms', price: 487.34, change: 5.67, changePercent: 1.18, trend: 'up' },
  ];

  const sentimentData = [
    { platform: 'Twitter/X', positive: 72, neutral: 18, negative: 10, total: 1247 },
    { platform: 'LinkedIn', positive: 85, neutral: 12, negative: 3, total: 893 },
    { platform: 'Reddit', positive: 45, neutral: 35, negative: 20, total: 456 },
    { platform: 'News Media', positive: 68, neutral: 25, negative: 7, total: 234 },
  ];

  const predictions = [
    {
      metric: 'User Growth',
      current: '15,234',
      predicted: '22,450',
      confidence: 87,
      timeframe: 'Next Quarter',
      trend: 'up'
    },
    {
      metric: 'Revenue',
      current: '$2.4M',
      predicted: '$3.8M',
      confidence: 82,
      timeframe: 'Next Quarter',
      trend: 'up'
    },
    {
      metric: 'Churn Rate',
      current: '4.2%',
      predicted: '2.8%',
      confidence: 75,
      timeframe: 'Next Quarter',
      trend: 'down'
    },
  ];

  const kpiDashboard = [
    { name: 'Active Users', value: '15,234', change: '+12.3%', trend: 'up', target: '18,000' },
    { name: 'MRR', value: '$847K', change: '+8.7%', trend: 'up', target: '$1M' },
    { name: 'Conversion Rate', value: '3.2%', change: '+0.4%', trend: 'up', target: '4.0%' },
    { name: 'Customer Satisfaction', value: '4.7/5', change: '+0.2', trend: 'up', target: '4.8/5' },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <TrendingUp className="w-8 h-8 text-cyan-400" />
          <h2 className="text-3xl font-bold text-white">Business Intelligence</h2>
        </div>
        <p className="text-slate-400">
          Advanced analytics and competitive insights powered by AI
        </p>
      </div>

      {/* Custom KPI Dashboard */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        {kpiDashboard.map((kpi, idx) => (
          <div key={idx} className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
            <div className="flex items-start justify-between mb-3">
              <div className="text-sm text-slate-400">{kpi.name}</div>
              <div className={`flex items-center gap-1 text-xs ${
                kpi.trend === 'up' ? 'text-green-400' : 'text-red-400'
              }`}>
                {kpi.trend === 'up' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                {kpi.change}
              </div>
            </div>
            <div className="text-2xl font-bold text-white mb-1">{kpi.value}</div>
            <div className="text-xs text-slate-400">Target: {kpi.target}</div>
          </div>
        ))}
      </div>

      {/* Competitor Monitoring */}
      <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Target className="w-6 h-6 text-red-400" />
            <h3 className="text-xl font-semibold text-white">Competitor Monitoring</h3>
          </div>
          <button className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg text-sm text-red-400 transition-colors flex items-center gap-2">
            <Search className="w-4 h-4" />
            Add Competitor
          </button>
        </div>

        <div className="grid gap-4">
          {competitors.map((comp, idx) => (
            <div
              key={idx}
              className="p-4 bg-slate-950/50 rounded-lg border border-slate-700/50 hover:border-red-500/30 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="font-semibold text-white text-lg">{comp.name}</div>
                    <span className={`px-2 py-1 rounded text-xs ${
                      comp.sentiment === 'positive'
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : comp.sentiment === 'neutral'
                        ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                        : 'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}>
                      {comp.sentiment}
                    </span>
                    <span className={`flex items-center gap-1 text-sm font-semibold ${
                      comp.trend === 'up' ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {comp.trend === 'up' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                      {comp.stockChange}
                    </span>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4 mb-3">
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <Activity className="w-4 h-4 text-cyan-400" />
                      <span><strong className="text-white">{comp.mentions}</strong> mentions this week</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <AlertCircle className="w-4 h-4 text-yellow-400" />
                      <span>{comp.recentActivity}</span>
                    </div>
                  </div>
                </div>
                <button className="px-3 py-1.5 bg-slate-700/50 hover:bg-slate-700 rounded text-xs text-slate-300 transition-colors flex items-center gap-1">
                  View Details
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Industry News Aggregator */}
      <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Newspaper className="w-6 h-6 text-blue-400" />
            <h3 className="text-xl font-semibold text-white">Industry News Aggregator</h3>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span>Live feed</span>
          </div>
        </div>

        <div className="grid gap-3">
          {industryNews.map((news) => (
            <div
              key={news.id}
              className="p-4 bg-slate-950/50 rounded-lg border border-slate-700/50 hover:border-blue-500/30 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="font-semibold text-white">{news.title}</div>
                  </div>
                  <div className="text-sm text-slate-400 mb-2">{news.summary}</div>
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span className="text-blue-400">{news.source}</span>
                    <span>{news.time}</span>
                    <div className="flex items-center gap-1">
                      <Target className="w-3 h-3 text-cyan-400" />
                      <span className="text-cyan-400">{news.relevance}% relevant</span>
                    </div>
                  </div>
                </div>
                <button className="ml-4 px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded text-xs text-blue-400 transition-colors flex items-center gap-1">
                  Read
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stock & Market Dashboard */}
      <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <DollarSign className="w-6 h-6 text-green-400" />
            <h3 className="text-xl font-semibold text-white">Stock & Market Dashboard</h3>
          </div>
          <button className="px-4 py-2 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 rounded-lg text-sm text-green-400 transition-colors">
            Manage Watchlist
          </button>
        </div>

        <div className="grid gap-3">
          {stockWatchlist.map((stock, idx) => (
            <div
              key={idx}
              className="p-4 bg-slate-950/50 rounded-lg border border-slate-700/50 hover:border-green-500/30 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <div>
                    <div className="text-lg font-bold text-white">{stock.symbol}</div>
                    <div className="text-xs text-slate-400">{stock.name}</div>
                  </div>
                  <div className="text-right flex-1">
                    <div className="text-xl font-semibold text-white">${stock.price}</div>
                    <div className={`flex items-center gap-1 text-sm justify-end ${
                      stock.trend === 'up' ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {stock.trend === 'up' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                      <span>{stock.change > 0 ? '+' : ''}{stock.change}</span>
                      <span>({stock.changePercent > 0 ? '+' : ''}{stock.changePercent}%)</span>
                    </div>
                  </div>
                </div>
                <button className="ml-4 px-3 py-1.5 bg-slate-700/50 hover:bg-slate-700 rounded text-xs text-slate-300 transition-colors">
                  View Chart
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-lg">
          <div className="flex items-start gap-3">
            <Brain className="w-5 h-5 text-green-400 mt-0.5" />
            <div>
              <div className="text-sm font-semibold text-green-400 mb-1">AI Market Insights</div>
              <div className="text-xs text-slate-400">
                Tech sector showing strong momentum. Consider increased exposure based on current trends.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sentiment Analysis */}
      <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Heart className="w-6 h-6 text-pink-400" />
            <h3 className="text-xl font-semibold text-white">Sentiment Analysis</h3>
          </div>
          <div className="text-sm text-slate-400">Brand mentions across platforms</div>
        </div>

        <div className="grid gap-4">
          {sentimentData.map((platform, idx) => (
            <div
              key={idx}
              className="p-4 bg-slate-950/50 rounded-lg border border-slate-700/50"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-cyan-400" />
                  <div className="font-semibold text-white">{platform.platform}</div>
                </div>
                <div className="text-sm text-slate-400">{platform.total} mentions</div>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <div className="flex-1 h-4 bg-slate-800 rounded-full overflow-hidden flex">
                  <div
                    className="bg-green-500 h-full"
                    style={{ width: `${platform.positive}%` }}
                  />
                  <div
                    className="bg-yellow-500 h-full"
                    style={{ width: `${platform.neutral}%` }}
                  />
                  <div
                    className="bg-red-500 h-full"
                    style={{ width: `${platform.negative}%` }}
                  />
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-slate-400">{platform.positive}% Positive</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-yellow-500" />
                  <span className="text-slate-400">{platform.neutral}% Neutral</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <span className="text-slate-400">{platform.negative}% Negative</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Predictive Analytics */}
      <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Brain className="w-6 h-6 text-purple-400" />
            <h3 className="text-xl font-semibold text-white">Predictive Analytics</h3>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {predictions.map((pred, idx) => (
            <div
              key={idx}
              className="p-6 bg-slate-950/50 rounded-lg border border-slate-700/50 hover:border-purple-500/30 transition-colors"
            >
              <div className="text-sm text-slate-400 mb-2">{pred.metric}</div>
              <div className="flex items-center gap-2 mb-4">
                <div className="text-2xl font-bold text-white">{pred.current}</div>
                <div className={`flex items-center gap-1 text-sm font-semibold ${
                  pred.trend === 'up' ? 'text-green-400' : 'text-red-400'
                }`}>
                  {pred.trend === 'up' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                  <span>{pred.predicted}</span>
                </div>
              </div>
              <div className="mb-3">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span>AI Confidence</span>
                  <span>{pred.confidence}%</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                    style={{ width: `${pred.confidence}%` }}
                  />
                </div>
              </div>
              <div className="text-xs text-slate-500">{pred.timeframe}</div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
          <div className="flex items-start gap-3">
            <Brain className="w-5 h-5 text-purple-400 mt-0.5" />
            <div>
              <div className="text-sm font-semibold text-purple-400 mb-1">AI-Powered Forecasting</div>
              <div className="text-xs text-slate-400">
                Predictions based on historical data, market trends, and machine learning models. Updated daily.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
