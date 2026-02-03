import { useState } from 'react';
import { 
  Briefcase, Plus, Globe, Facebook, Instagram, Twitter,
  Youtube, TrendingUp, Users, DollarSign, Settings,
  Edit, Trash2, ExternalLink, Copy, CheckCircle,
  Store, MessageSquare, Hash, Link, Crown, Zap,
  Cpu, Gauge, Activity, Database, FolderOpen
} from 'lucide-react';

interface Asset {
  id: string;
  type: 'domain' | 'social' | 'store' | 'email' | 'app';
  name: string;
  url: string;
  platform?: string;
  status: 'active' | 'pending' | 'inactive';
  metrics?: {
    followers?: number;
    revenue?: string;
    traffic?: string;
  };
}

interface Business {
  id: string;
  name: string;
  description: string;
  color: string;
  assets: Asset[];
  createdAt: string;
  totalValue: string;
  status: 'active' | 'archived';
}

export function BusinessAssets() {
  const [selectedBusiness, setSelectedBusiness] = useState<string | null>('dead-app-corp');
  const [showAddBusiness, setShowAddBusiness] = useState(false);

  const businesses: Business[] = [
    {
      id: 'dead-app-corp',
      name: 'DEAD APP CORP',
      description: 'Main portfolio of viral apps and domains',
      color: 'from-red-500 to-pink-500',
      status: 'active',
      createdAt: '2024-01-15',
      totalValue: '$2.4M',
      assets: [
        {
          id: 'd1',
          type: 'domain',
          name: 'viraldead.pro',
          url: 'https://viraldead.pro',
          status: 'active',
          metrics: { traffic: '45K/mo' }
        },
        {
          id: 'd2',
          type: 'domain',
          name: 'shortypro.com',
          url: 'https://shortypro.com',
          status: 'active',
          metrics: { traffic: '23K/mo' }
        },
        {
          id: 'd3',
          type: 'domain',
          name: 'deadapp.pro',
          url: 'https://deadapp.pro',
          status: 'active',
          metrics: { traffic: '67K/mo' }
        },
        {
          id: 'd4',
          type: 'domain',
          name: 'insuretoday24.com',
          url: 'https://insuretoday24.com',
          status: 'active',
          metrics: { traffic: '12K/mo' }
        },
        {
          id: 's1',
          type: 'social',
          name: 'DEAD APP Facebook Page',
          url: 'https://facebook.com/deadapp',
          platform: 'Facebook',
          status: 'active',
          metrics: { followers: 125000 }
        },
        {
          id: 's2',
          type: 'social',
          name: 'DEAD APP Facebook Group',
          url: 'https://facebook.com/groups/deadapp',
          platform: 'Facebook',
          status: 'active',
          metrics: { followers: 45000 }
        },
        {
          id: 's3',
          type: 'store',
          name: 'DEAD APP Store',
          url: 'https://facebook.com/deadappstore',
          platform: 'Facebook',
          status: 'active',
          metrics: { revenue: '$34K/mo' }
        },
        {
          id: 's4',
          type: 'social',
          name: '@deadapp',
          url: 'https://instagram.com/deadapp',
          platform: 'Instagram',
          status: 'active',
          metrics: { followers: 89000 }
        },
        {
          id: 's5',
          type: 'social',
          name: '@deadapp_official',
          url: 'https://twitter.com/deadapp_official',
          platform: 'Twitter',
          status: 'active',
          metrics: { followers: 56000 }
        },
        {
          id: 's6',
          type: 'social',
          name: 'DEAD APP Channel',
          url: 'https://youtube.com/@deadapp',
          platform: 'YouTube',
          status: 'active',
          metrics: { followers: 234000 }
        },
      ]
    },
    {
      id: 'atlas-ux',
      name: 'Atlas UX',
      description: 'AI productivity platform and tools',
      color: 'from-cyan-500 to-blue-500',
      status: 'active',
      createdAt: '2024-02-01',
      totalValue: '$1.2M',
      assets: [
        {
          id: 'a1',
          type: 'domain',
          name: 'atlasux.com',
          url: 'https://atlasux.com',
          status: 'active',
          metrics: { traffic: '89K/mo' }
        },
        {
          id: 'a2',
          type: 'domain',
          name: 'atlasux.ai',
          url: 'https://atlasux.ai',
          status: 'active',
          metrics: { traffic: '45K/mo' }
        },
        {
          id: 'a3',
          type: 'social',
          name: 'Atlas UX Official',
          url: 'https://twitter.com/atlasux',
          platform: 'Twitter',
          status: 'active',
          metrics: { followers: 23000 }
        },
        {
          id: 'a4',
          type: 'social',
          name: 'Atlas UX',
          url: 'https://linkedin.com/company/atlasux',
          platform: 'LinkedIn',
          status: 'active',
          metrics: { followers: 12000 }
        },
      ]
    },
    {
      id: 'viral-marketing',
      name: 'Viral Marketing Co',
      description: 'Marketing agency and content creation',
      color: 'from-purple-500 to-pink-500',
      status: 'active',
      createdAt: '2024-01-20',
      totalValue: '$890K',
      assets: [
        {
          id: 'v1',
          type: 'domain',
          name: 'goviraltoday.com',
          url: 'https://goviraltoday.com',
          status: 'active',
          metrics: { traffic: '156K/mo' }
        },
        {
          id: 'v2',
          type: 'social',
          name: 'Viral Marketing Tips',
          url: 'https://tiktok.com/@viralmarketing',
          platform: 'TikTok',
          status: 'active',
          metrics: { followers: 567000 }
        },
      ]
    },
  ];

  const assetTypeIcons = {
    domain: Globe,
    social: Users,
    store: Store,
    email: MessageSquare,
    app: Cpu,
  };

  const platformIcons: { [key: string]: any } = {
    'Facebook': Facebook,
    'Instagram': Instagram,
    'Twitter': Twitter,
    'YouTube': Youtube,
    'TikTok': Hash,
    'LinkedIn': Users,
  };

  const selectedBusinessData = businesses.find(b => b.id === selectedBusiness);

  const assetStats = {
    totalBusinesses: businesses.length,
    totalAssets: businesses.reduce((acc, b) => acc + b.assets.length, 0),
    totalValue: '$4.49M',
    activeAssets: businesses.reduce((acc, b) => acc + b.assets.filter(a => a.status === 'active').length, 0),
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Briefcase className="w-8 h-8 text-cyan-400" />
              <h2 className="text-3xl font-bold text-white">Business Asset Manager</h2>
            </div>
            <p className="text-slate-400">
              Manage all your business assets, domains, and social accounts in one place
            </p>
          </div>
          <button
            onClick={() => setShowAddBusiness(true)}
            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white rounded-xl font-semibold transition-all flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            New Business
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
          <Briefcase className="w-8 h-8 text-cyan-400 mb-3" />
          <div className="text-3xl font-bold text-white mb-1">{assetStats.totalBusinesses}</div>
          <div className="text-sm text-slate-400">Total businesses</div>
        </div>
        <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
          <FolderOpen className="w-8 h-8 text-blue-400 mb-3" />
          <div className="text-3xl font-bold text-white mb-1">{assetStats.totalAssets}</div>
          <div className="text-sm text-slate-400">Total assets</div>
        </div>
        <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
          <CheckCircle className="w-8 h-8 text-green-400 mb-3" />
          <div className="text-3xl font-bold text-white mb-1">{assetStats.activeAssets}</div>
          <div className="text-sm text-slate-400">Active assets</div>
        </div>
        <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
          <DollarSign className="w-8 h-8 text-yellow-400 mb-3" />
          <div className="text-3xl font-bold text-white mb-1">{assetStats.totalValue}</div>
          <div className="text-sm text-slate-400">Total portfolio value</div>
        </div>
      </div>

      {/* GPU/CPU Processing Status */}
      <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl p-6 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
              <Cpu className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-1">Hardware Acceleration Enabled</h3>
              <p className="text-slate-400">GPU/CPU processing active for optimal performance</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="flex items-center gap-2 mb-1">
                <Cpu className="w-5 h-5 text-green-400" />
                <span className="text-sm font-semibold text-white">CPU</span>
              </div>
              <div className="text-2xl font-bold text-green-400">78%</div>
              <div className="text-xs text-slate-500">8 cores active</div>
            </div>
            <div className="text-center">
              <div className="flex items-center gap-2 mb-1">
                <Gauge className="w-5 h-5 text-cyan-400" />
                <span className="text-sm font-semibold text-white">GPU</span>
              </div>
              <div className="text-2xl font-bold text-cyan-400">45%</div>
              <div className="text-xs text-slate-500">CUDA enabled</div>
            </div>
            <div className="text-center">
              <div className="flex items-center gap-2 mb-1">
                <Activity className="w-5 h-5 text-yellow-400" />
                <span className="text-sm font-semibold text-white">Memory</span>
              </div>
              <div className="text-2xl font-bold text-yellow-400">12GB</div>
              <div className="text-xs text-slate-500">of 16GB used</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        {/* Business List Sidebar */}
        <div className="lg:col-span-4 bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Your Businesses</h3>
          <div className="space-y-3">
            {businesses.map((business) => (
              <button
                key={business.id}
                onClick={() => setSelectedBusiness(business.id)}
                className={`w-full text-left p-4 rounded-xl transition-all ${
                  selectedBusiness === business.id
                    ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border-2 border-cyan-500/50'
                    : 'bg-slate-950/50 border border-slate-700/50 hover:border-cyan-500/30'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="font-semibold text-white mb-1">{business.name}</div>
                    <div className="text-xs text-slate-400 mb-2">{business.description}</div>
                  </div>
                  {selectedBusiness === business.id && (
                    <CheckCircle className="w-5 h-5 text-cyan-400" />
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">{business.assets.length} assets</span>
                  <span className="text-xs font-semibold text-green-400">{business.totalValue}</span>
                </div>
                <div className={`mt-2 h-1 rounded-full bg-gradient-to-r ${business.color}`} />
              </button>
            ))}
          </div>
        </div>

        {/* Selected Business Details */}
        <div className="lg:col-span-8">
          {selectedBusinessData ? (
            <>
              {/* Business Header */}
              <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6 mb-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-16 h-16 bg-gradient-to-br ${selectedBusinessData.color} rounded-xl flex items-center justify-center`}>
                      <Briefcase className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-1">{selectedBusinessData.name}</h3>
                      <p className="text-slate-400">{selectedBusinessData.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-2 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 rounded-lg transition-colors">
                      <Edit className="w-4 h-4 text-slate-400" />
                    </button>
                    <button className="p-2 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 rounded-lg transition-colors">
                      <Settings className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="p-3 bg-slate-950/50 rounded-lg">
                    <div className="text-sm text-slate-400 mb-1">Total Value</div>
                    <div className="text-xl font-bold text-white">{selectedBusinessData.totalValue}</div>
                  </div>
                  <div className="p-3 bg-slate-950/50 rounded-lg">
                    <div className="text-sm text-slate-400 mb-1">Total Assets</div>
                    <div className="text-xl font-bold text-white">{selectedBusinessData.assets.length}</div>
                  </div>
                  <div className="p-3 bg-slate-950/50 rounded-lg">
                    <div className="text-sm text-slate-400 mb-1">Status</div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-400" />
                      <span className="text-sm font-semibold text-green-400">Active</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Neptune Integration */}
              <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl p-6 mb-6">
                <div className="flex items-start gap-3">
                  <Zap className="w-6 h-6 text-purple-400" />
                  <div>
                    <div className="text-sm font-semibold text-purple-400 mb-1">Neptune Integration Ready</div>
                    <div className="text-xs text-slate-400 mb-3">
                      Neptune can now use all assets from "{selectedBusinessData.name}" for automated tasks
                    </div>
                    <button className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 rounded-lg text-sm text-purple-400 transition-colors">
                      Configure Neptune Access
                    </button>
                  </div>
                </div>
              </div>

              {/* Assets Grid */}
              <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-white">Assets</h3>
                  <button className="px-4 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-lg text-sm text-cyan-400 transition-colors flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Add Asset
                  </button>
                </div>

                {/* Domains */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Globe className="w-5 h-5 text-cyan-400" />
                    <h4 className="text-sm font-semibold text-white">Domains</h4>
                    <span className="text-xs text-slate-500">
                      ({selectedBusinessData.assets.filter(a => a.type === 'domain').length})
                    </span>
                  </div>
                  <div className="grid md:grid-cols-2 gap-3">
                    {selectedBusinessData.assets.filter(a => a.type === 'domain').map((asset) => (
                      <div
                        key={asset.id}
                        className="p-4 bg-slate-950/50 rounded-lg border border-slate-700/50 hover:border-cyan-500/30 transition-colors group"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="font-semibold text-white mb-1">{asset.name}</div>
                            <div className="text-xs text-slate-500">{asset.metrics?.traffic}</div>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <a
                              href={asset.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 hover:bg-slate-800 rounded transition-colors"
                            >
                              <ExternalLink className="w-3 h-3 text-slate-400" />
                            </a>
                            <button className="p-1 hover:bg-slate-800 rounded transition-colors">
                              <Copy className="w-3 h-3 text-slate-400" />
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            asset.status === 'active' ? 'bg-green-400' : 'bg-yellow-400'
                          }`} />
                          <span className="text-xs text-slate-500">{asset.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Social Media */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="w-5 h-5 text-blue-400" />
                    <h4 className="text-sm font-semibold text-white">Social Media</h4>
                    <span className="text-xs text-slate-500">
                      ({selectedBusinessData.assets.filter(a => a.type === 'social').length})
                    </span>
                  </div>
                  <div className="grid md:grid-cols-2 gap-3">
                    {selectedBusinessData.assets.filter(a => a.type === 'social').map((asset) => {
                      const PlatformIcon = asset.platform ? platformIcons[asset.platform] : Users;
                      return (
                        <div
                          key={asset.id}
                          className="p-4 bg-slate-950/50 rounded-lg border border-slate-700/50 hover:border-blue-500/30 transition-colors group"
                        >
                          <div className="flex items-start gap-3 mb-2">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-lg flex items-center justify-center">
                              <PlatformIcon className="w-5 h-5 text-blue-400" />
                            </div>
                            <div className="flex-1">
                              <div className="font-semibold text-white mb-1">{asset.name}</div>
                              <div className="text-xs text-slate-500">{asset.platform}</div>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <a
                                href={asset.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1 hover:bg-slate-800 rounded transition-colors"
                              >
                                <ExternalLink className="w-3 h-3 text-slate-400" />
                              </a>
                            </div>
                          </div>
                          {asset.metrics?.followers && (
                            <div className="flex items-center gap-2">
                              <Users className="w-3 h-3 text-slate-500" />
                              <span className="text-sm font-semibold text-cyan-400">
                                {asset.metrics.followers.toLocaleString()} followers
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Stores */}
                {selectedBusinessData.assets.filter(a => a.type === 'store').length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Store className="w-5 h-5 text-green-400" />
                      <h4 className="text-sm font-semibold text-white">E-commerce Stores</h4>
                      <span className="text-xs text-slate-500">
                        ({selectedBusinessData.assets.filter(a => a.type === 'store').length})
                      </span>
                    </div>
                    <div className="grid md:grid-cols-2 gap-3">
                      {selectedBusinessData.assets.filter(a => a.type === 'store').map((asset) => (
                        <div
                          key={asset.id}
                          className="p-4 bg-slate-950/50 rounded-lg border border-slate-700/50 hover:border-green-500/30 transition-colors group"
                        >
                          <div className="flex items-start gap-3 mb-2">
                            <div className="w-10 h-10 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-lg flex items-center justify-center">
                              <Store className="w-5 h-5 text-green-400" />
                            </div>
                            <div className="flex-1">
                              <div className="font-semibold text-white mb-1">{asset.name}</div>
                              <div className="text-xs text-slate-500">{asset.platform}</div>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <a
                                href={asset.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1 hover:bg-slate-800 rounded transition-colors"
                              >
                                <ExternalLink className="w-3 h-3 text-slate-400" />
                              </a>
                            </div>
                          </div>
                          {asset.metrics?.revenue && (
                            <div className="flex items-center gap-2">
                              <DollarSign className="w-3 h-3 text-slate-500" />
                              <span className="text-sm font-semibold text-green-400">
                                {asset.metrics.revenue} revenue
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Briefcase className="w-16 h-16 text-slate-700 mx-auto mb-4" />
                <div className="text-slate-500">Select a business to view details</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
