import { useState } from 'react';
import { 
  Globe, Download, Bookmark, Scissors, DollarSign,
  Brain, Chrome, Sparkles,
  CheckCircle, Clock, Tag, Search, Share2,
  FileText, Link, Star, TrendingDown, AlertCircle, ExternalLink
} from 'lucide-react';

export function BrowserExtension() {
  const isInstalled = false;
  const bookmarksCount = 0;
  const clippedPages = 0;
  const priceTrackers = 0;

  const browsers = [
    { 
      name: 'Google Chrome', 
      icon: '🌐', 
      installed: false, 
      color: 'from-yellow-500 to-red-500',
      textColor: 'text-yellow-400',
      store: 'Chrome Web Store',
      description: 'Chrome, Chromium, Brave, Vivaldi'
    },
    { 
      name: 'Microsoft Edge', 
      icon: '🔷', 
      installed: false, 
      color: 'from-blue-600 to-cyan-600',
      textColor: 'text-blue-400',
      store: 'Edge Add-ons',
      description: 'Edge, Edge Chromium'
    },
    { 
      name: 'Safari', 
      icon: '🧭', 
      installed: false, 
      color: 'from-cyan-500 to-blue-600',
      textColor: 'text-cyan-400',
      store: 'Safari Extensions',
      description: 'Safari 14+ (Mac & iOS)'
    },
  ];

  const smartBookmarks: any[] = [];
  const webClips: any[] = [];
  const trackedPrices: any[] = [];
  const researchNotes: any[] = [];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Globe className="w-8 h-8 text-cyan-400" />
          <h2 className="text-3xl font-bold text-white">Browser Extension</h2>
        </div>
        <p className="text-slate-400">
          Take Atlas with you anywhere on the web with powerful browser integration
        </p>
      </div>

      {/* Installation Status */}
      <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Download className="w-6 h-6 text-cyan-400" />
            <div>
              <h3 className="text-xl font-semibold text-white">Install Atlas Extension</h3>
              <p className="text-sm text-slate-400 mt-1">
                Available for Chrome, Edge, Safari, and other browsers
              </p>
            </div>
          </div>
        </div>

        {!isInstalled ? (
          <>
            <div className="text-center py-8 mb-6">
              <Globe className="w-16 h-16 text-cyan-400/30 mx-auto mb-4" />
              <h4 className="text-lg font-semibold text-white mb-2">No Browser Extension Installed</h4>
              <p className="text-sm text-slate-400 max-w-md mx-auto">
                Install the Atlas browser extension to access AI-powered productivity tools on any website.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-4 mb-6">
              {browsers.map((browser) => (
                <div
                  key={browser.name}
                  className="bg-slate-800/50 border border-slate-700/50 hover:border-cyan-500/40 rounded-xl p-5 transition-all cursor-pointer group"
                >
                  <div className="flex flex-col items-center text-center mb-4">
                    <div className={`w-20 h-20 bg-gradient-to-br ${browser.color} rounded-lg flex items-center justify-center text-4xl mb-3`}>
                      {browser.icon}
                    </div>
                    <h4 className="font-semibold text-white mb-1 text-sm">{browser.name}</h4>
                    <p className="text-xs text-slate-500 mb-2">{browser.description}</p>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <ExternalLink className="w-3 h-3" />
                      <span>{browser.store}</span>
                    </div>
                  </div>
                  <button className="w-full py-2.5 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-lg text-sm text-cyan-400 font-medium transition-colors flex items-center justify-center gap-2 group-hover:bg-cyan-500 group-hover:text-white">
                    <Download className="w-4 h-4" />
                    Install Extension
                  </button>
                </div>
              ))}
            </div>

            <div className="p-4 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-lg">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-sm font-semibold text-cyan-400 mb-1">Cross-Browser Support</div>
                  <div className="text-xs text-slate-400">
                    The Atlas extension works seamlessly across all major browsers. Install once and your data syncs automatically with the desktop app. 
                    Chrome-based browsers (Brave, Opera, Vivaldi) can use the Chrome Web Store version. Safari extension works on both Mac and iOS.
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="space-y-3">
            {browsers.filter(b => b.installed).map((browser) => (
              <div
                key={browser.name}
                className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 bg-gradient-to-br ${browser.color} rounded-lg flex items-center justify-center text-xl`}>
                    {browser.icon}
                  </div>
                  <div>
                    <h4 className="font-medium text-white">{browser.name}</h4>
                    <p className="text-xs text-slate-400">{browser.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/30 rounded-lg">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-xs text-green-400">Active</span>
                  </div>
                  <button className="px-3 py-1.5 bg-slate-700/50 hover:bg-slate-700 rounded-lg text-xs text-slate-300 transition-colors">
                    Settings
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stats Overview */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
          <Bookmark className="w-8 h-8 text-cyan-400 mb-3" />
          <div className="text-3xl font-bold text-white mb-1">{bookmarksCount}</div>
          <div className="text-sm text-slate-400">Smart Bookmarks</div>
        </div>

        <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
          <Scissors className="w-8 h-8 text-purple-400 mb-3" />
          <div className="text-3xl font-bold text-white mb-1">{clippedPages}</div>
          <div className="text-sm text-slate-400">Web Clips</div>
        </div>

        <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
          <DollarSign className="w-8 h-8 text-green-400 mb-3" />
          <div className="text-3xl font-bold text-white mb-1">{priceTrackers}</div>
          <div className="text-sm text-slate-400">Price Trackers</div>
        </div>

        <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
          <FileText className="w-8 h-8 text-blue-400 mb-3" />
          <div className="text-3xl font-bold text-white mb-1">{researchNotes.length}</div>
          <div className="text-sm text-slate-400">Research Notes</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Smart Bookmarks */}
        <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Bookmark className="w-6 h-6 text-cyan-400" />
              <h3 className="text-xl font-semibold text-white">Smart Bookmarks</h3>
            </div>
            <button className="px-4 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-lg text-sm text-cyan-400 transition-colors">
              Add Bookmark
            </button>
          </div>

          <div className="text-center py-12 text-slate-400">
            No bookmarks saved yet. Use the browser extension to save pages with AI-powered tagging.
          </div>
        </div>

        {/* Web Clipper */}
        <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <Scissors className="w-6 h-6 text-purple-400" />
            <h3 className="text-xl font-semibold text-white">Web Clips</h3>
          </div>

          <div className="text-center py-12 text-slate-400">
            No web clips saved. Highlight and save any content from the web.
          </div>
        </div>
      </div>

      {/* Price Tracker */}
      <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <TrendingDown className="w-6 h-6 text-green-400" />
            <h3 className="text-xl font-semibold text-white">Price Tracker</h3>
          </div>
          <button className="px-4 py-2 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 rounded-lg text-sm text-green-400 transition-colors">
            Track New Product
          </button>
        </div>

        <div className="text-center py-12 text-slate-400">
          No products being tracked. Click any product on Amazon, eBay, or other sites to start tracking prices.
        </div>
      </div>

      {/* Research Assistant */}
      <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <Brain className="w-6 h-6 text-blue-400" />
          <h3 className="text-xl font-semibold text-white">Research Assistant</h3>
        </div>

        <div className="text-center py-12 text-slate-400">
          No research sessions active. Start a research session to collect and organize information from multiple sources.
        </div>

        <div className="mt-6 p-4 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-lg">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-cyan-400 mt-0.5" />
            <div>
              <div className="text-sm font-semibold text-cyan-400 mb-1">Atlas Anywhere</div>
              <div className="text-xs text-slate-400">
                The Atlas browser extension brings AI-powered productivity tools to every website you visit. Save bookmarks with automatic tagging, clip important content, track prices, and conduct research with AI assistance - all without leaving your browser.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}