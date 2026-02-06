import { useState } from 'react';
import {
  Smartphone, Sparkles, TrendingUp, Video, Brain,
  Shield, Zap, Users, Calendar, MessageSquare,
  BarChart3, Globe, Palette, DollarSign, Layout,
  Mic, Database, Mail, Code, FileSpreadsheet,
  MousePointer, Cpu, Film, ArrowRight, Crown, GitBranch
} from 'lucide-react';
import { MobileIntegration } from './MobileIntegration';
import { AIProductivity } from './AIProductivity';
import { BusinessIntelligence } from './BusinessIntelligence';
import { MediaProcessing } from './MediaProcessing';
import { SecurityCompliance } from './SecurityCompliance';
import { SmartAutomation } from './SmartAutomation';
import { TeamCollaboration } from './TeamCollaboration';
import { VideoConferencing } from './VideoConferencing';
import { VisualWorkflowBuilder } from './VisualWorkflowBuilder';
import { VoiceCommands } from './VoiceCommands';
import { MemorySystem } from './MemorySystem';
import { EmailClient } from './EmailClient';
import { CodeGeneration } from './CodeGeneration';
import { SpreadsheetAnalysis } from './SpreadsheetAnalysis';
import { BrowserAutomation } from './BrowserAutomation';
import { AIModelTraining } from './AIModelTraining';
import { PersonalAnalytics } from './PersonalAnalytics';
import { BrowserExtension } from './BrowserExtension';
import { CreativeTools } from './CreativeTools';
import { CalendarScheduling } from './CalendarScheduling';
import { CommunicationSuite } from './CommunicationSuite';
import { FinancialManagement } from './FinancialManagement';

type FeatureView = 
  | 'hub'
  | 'mobile'
  | 'ai-productivity'
  | 'business-intelligence'
  | 'media-processing'
  | 'security-compliance'
  | 'smart-automation'
  | 'team-collaboration'
  | 'video-conferencing'
  | 'workflow-builder'
  | 'voice-commands'
  | 'memory-system'
  | 'email-client'
  | 'code-generation'
  | 'spreadsheet-analysis'
  | 'browser-automation'
  | 'ai-training'
  | 'calendar-scheduling'
  | 'communication'
  | 'personal-analytics'
  | 'browser-extension'
  | 'creative-tools'
  | 'financial-management';

export function PremiumHub() {
  const [currentView, setCurrentView] = useState<FeatureView>('hub');

  const featureCategories = [
    {
      id: 'video-conferencing' as FeatureView,
      name: 'Video Conferencing Integration',
      icon: Video,
      description: 'Atlas joins your meetings and handles everything automatically',
      features: ['Zoom', 'Microsoft Teams', 'Cisco Webex', 'Auto-Join', 'Live Transcription', 'AI Notes'],
      color: 'from-red-500 to-pink-500',
      bgColor: 'from-red-500/20 to-pink-500/20'
    },
    {
      id: 'mobile' as FeatureView,
      name: 'iPhone & Mobile Integration',
      icon: Smartphone,
      description: 'Deep integration with iOS devices for seamless productivity',
      features: ['iCloud Photos', 'Camera Scanner', 'Universal Clipboard', 'AirDrop', 'Voice Memos'],
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'from-blue-500/20 to-cyan-500/20'
    },
    {
      id: 'ai-productivity' as FeatureView,
      name: 'AI-Powered Productivity',
      icon: Brain,
      description: 'Intelligent automation to boost your productivity',
      features: ['Email Triage', 'Meeting Scheduler', 'Document Tagging', 'Screenshot OCR', 'Meeting Transcription'],
      color: 'from-purple-500 to-pink-500',
      bgColor: 'from-purple-500/20 to-pink-500/20'
    },
    {
      id: 'business-intelligence' as FeatureView,
      name: 'Business Intelligence',
      icon: TrendingUp,
      description: 'Advanced analytics and competitive insights',
      features: ['Competitor Monitoring', 'Industry News', 'Stock Market', 'Sentiment Analysis', 'Predictive Analytics'],
      color: 'from-green-500 to-emerald-500',
      bgColor: 'from-green-500/20 to-emerald-500/20'
    },
    {
      id: 'media-processing' as FeatureView,
      name: 'Advanced Media Processing',
      icon: Film,
      description: 'Professional-grade media editing and manipulation',
      features: ['Video Auto-Editor', 'Background Removal', 'Batch Processing', 'PDF Tools', 'OCR Engine'],
      color: 'from-red-500 to-pink-500',
      bgColor: 'from-red-500/20 to-pink-500/20'
    },
    {
      id: 'security-compliance' as FeatureView,
      name: 'Enterprise Security & Compliance',
      icon: Shield,
      description: 'Advanced security for enterprise deployment',
      features: ['Data Loss Prevention', 'Compliance Reporting', 'Secure Sharing', 'Geofencing', 'Activity Timeline'],
      color: 'from-yellow-500 to-orange-500',
      bgColor: 'from-yellow-500/20 to-orange-500/20'
    },
    {
      id: 'smart-automation' as FeatureView,
      name: 'Smart Automation',
      icon: Zap,
      description: 'Intelligent automation for repetitive tasks',
      features: ['Email Auto-Responder', 'Invoice Processing', 'Receipt Management', 'Form Auto-Filler', 'File Organization'],
      color: 'from-cyan-500 to-blue-500',
      bgColor: 'from-cyan-500/20 to-blue-500/20'
    },
    {
      id: 'team-collaboration' as FeatureView,
      name: 'Team Collaboration',
      icon: Users,
      description: 'Enterprise team features and shared workflows',
      features: ['Shared Knowledge Base', 'Handoff Mode', 'Team Activity Feed', 'Shared Automations', 'Screen Recording'],
      color: 'from-indigo-500 to-purple-500',
      bgColor: 'from-indigo-500/20 to-purple-500/20'
    },
    {
      id: 'workflow-builder' as FeatureView,
      name: 'Visual Workflow Builder',
      icon: GitBranch,
      description: 'Create and manage complex workflows visually',
      features: ['Drag-and-Drop Interface', 'Conditional Logic', 'Task Automation', 'Integration with APIs', 'Version Control'],
      color: 'from-blue-500 to-indigo-500',
      bgColor: 'from-blue-500/20 to-indigo-500/20'
    },
    {
      id: 'voice-commands' as FeatureView,
      name: 'Voice Commands',
      icon: Mic,
      description: 'Control Atlas using voice commands for hands-free operation',
      features: ['Command Recognition', 'Natural Language Processing', 'Contextual Awareness', 'Customizable Commands', 'Voice Feedback'],
      color: 'from-green-500 to-cyan-500',
      bgColor: 'from-green-500/20 to-cyan-500/20'
    },
    {
      id: 'memory-system' as FeatureView,
      name: 'Memory System',
      icon: Database,
      description: 'Advanced memory and data management capabilities',
      features: ['Data Storage', 'Data Retrieval', 'Data Analysis', 'Data Security', 'Data Backup'],
      color: 'from-purple-500 to-blue-500',
      bgColor: 'from-purple-500/20 to-blue-500/20'
    },
    {
      id: 'email-client' as FeatureView,
      name: 'Email Client',
      icon: Mail,
      description: 'Integrated email client for seamless communication',
      features: ['Email Sending', 'Email Receiving', 'Email Filtering', 'Email Archiving', 'Email Encryption'],
      color: 'from-blue-500 to-indigo-500',
      bgColor: 'from-blue-500/20 to-indigo-500/20'
    },
    {
      id: 'code-generation' as FeatureView,
      name: 'Code Generation',
      icon: Code,
      description: 'Automatically generate code snippets and scripts',
      features: ['Code Snippets', 'Script Generation', 'Code Optimization', 'Code Debugging', 'Code Versioning'],
      color: 'from-green-500 to-yellow-500',
      bgColor: 'from-green-500/20 to-yellow-500/20'
    },
    {
      id: 'spreadsheet-analysis' as FeatureView,
      name: 'Spreadsheet Analysis',
      icon: FileSpreadsheet,
      description: 'Advanced spreadsheet analysis and data manipulation',
      features: ['Data Visualization', 'Data Analysis', 'Data Manipulation', 'Data Cleaning', 'Data Validation'],
      color: 'from-green-500 to-yellow-500',
      bgColor: 'from-green-500/20 to-yellow-500/20'
    },
    {
      id: 'browser-automation' as FeatureView,
      name: 'Browser Automation',
      icon: Globe,
      description: 'Automate browser tasks and workflows',
      features: ['Browser Automation', 'Task Automation', 'Workflow Automation', 'Integration with APIs', 'Version Control'],
      color: 'from-orange-500 to-red-500',
      bgColor: 'from-orange-500/20 to-red-500/20'
    },
    {
      id: 'ai-training' as FeatureView,
      name: 'AI Model Training',
      icon: Brain,
      description: 'Train and fine-tune AI models for specific tasks',
      features: ['Model Training', 'Model Fine-Tuning', 'Model Evaluation', 'Model Deployment', 'Model Monitoring'],
      color: 'from-purple-500 to-pink-500',
      bgColor: 'from-purple-500/20 to-pink-500/20'
    },
    {
      id: 'calendar-scheduling' as FeatureView,
      name: 'Advanced Calendar & Scheduling',
      icon: Calendar,
      description: 'Intelligent scheduling and calendar management',
      features: ['Meeting Prep AI', 'Calendar Insights', 'Time Blocking', 'Conflict Resolver', 'Travel Calculator'],
      color: 'from-blue-500 to-indigo-500',
      bgColor: 'from-blue-500/20 to-indigo-500/20'
    },
    {
      id: 'communication' as FeatureView,
      name: 'Communication Suite',
      icon: MessageSquare,
      description: 'Unified communications and messaging',
      features: ['Multi-Channel Inbox', 'Email Templates', 'Smart Notifications', 'Canned Responses', 'Language Translation'],
      color: 'from-green-500 to-cyan-500',
      bgColor: 'from-green-500/20 to-cyan-500/20'
    },
    {
      id: 'personal-analytics' as FeatureView,
      name: 'Personal Analytics',
      icon: BarChart3,
      description: 'Track and optimize your productivity',
      features: ['Productivity Heatmap', 'Focus Time Tracker', 'App Usage Analytics', 'Energy Insights', 'Goal Tracking'],
      color: 'from-purple-500 to-blue-500',
      bgColor: 'from-purple-500/20 to-blue-500/20'
    },
    {
      id: 'browser-extension' as FeatureView,
      name: 'Browser Extension',
      icon: Globe,
      description: 'Atlas integration for your web browser',
      features: ['Atlas Anywhere', 'Smart Bookmarks', 'Web Clipper', 'Price Tracker', 'Research Assistant'],
      color: 'from-orange-500 to-red-500',
      bgColor: 'from-orange-500/20 to-red-500/20'
    },
    {
      id: 'creative-tools' as FeatureView,
      name: 'Creative Tools',
      icon: Palette,
      description: 'AI-powered design and creative assistance',
      features: ['AI Image Generator', 'Logo Generator', 'Color Palette Extractor', 'Font Pairing', 'Design Templates'],
      color: 'from-pink-500 to-purple-500',
      bgColor: 'from-pink-500/20 to-purple-500/20'
    },
    {
      id: 'financial-management' as FeatureView,
      name: 'Financial Management',
      icon: DollarSign,
      description: 'Expense tracking and financial automation',
      features: ['Expense Tracking', 'Invoice Generation', 'Payment Reminders', 'Tax Document Prep', 'Budget Alerts'],
      color: 'from-green-500 to-yellow-500',
      bgColor: 'from-green-500/20 to-yellow-500/20'
    },
  ];

  // Render the appropriate view
  if (currentView === 'video-conferencing') return <VideoConferencing />;
  if (currentView === 'mobile') return <MobileIntegration />;
  if (currentView === 'ai-productivity') return <AIProductivity />;
  if (currentView === 'business-intelligence') return <BusinessIntelligence />;
  if (currentView === 'media-processing') return <MediaProcessing />;
  if (currentView === 'security-compliance') return <SecurityCompliance />;
  if (currentView === 'smart-automation') return <SmartAutomation />;
  if (currentView === 'team-collaboration') return <TeamCollaboration />;
  if (currentView === 'workflow-builder') return <VisualWorkflowBuilder />;
  if (currentView === 'voice-commands') return <VoiceCommands />;
  if (currentView === 'memory-system') return <MemorySystem />;
  if (currentView === 'email-client') return <EmailClient />;
  if (currentView === 'code-generation') return <CodeGeneration />;
  if (currentView === 'spreadsheet-analysis') return <SpreadsheetAnalysis />;
  if (currentView === 'browser-automation') return <BrowserAutomation />;
  if (currentView === 'ai-training') return <AIModelTraining />;
  if (currentView === 'personal-analytics') return <PersonalAnalytics />;
  if (currentView === 'browser-extension') return <BrowserExtension />;
  if (currentView === 'creative-tools') return <CreativeTools />;
  if (currentView === 'calendar-scheduling') return <CalendarScheduling />;
  if (currentView === 'communication') return <CommunicationSuite />;
  if (currentView === 'financial-management') return <FinancialManagement />;

  // For features we haven't built full pages for yet, show a "coming soon" message
  if (currentView !== 'hub') {
    const feature = featureCategories.find(f => f.id === currentView);
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <button
          onClick={() => setCurrentView('hub')}
          className="mb-6 px-4 py-2 bg-slate-800/50 hover:bg-slate-800 border border-cyan-500/30 rounded-lg text-sm text-cyan-400 transition-colors"
        >
          ← Back to Premium Features
        </button>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          {feature && (
            <>
              <div className={`w-24 h-24 bg-gradient-to-br ${feature.bgColor} rounded-2xl flex items-center justify-center mb-6`}>
                <feature.icon className="w-12 h-12 text-cyan-400" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-3">{feature.name}</h2>
              <p className="text-slate-400 text-center max-w-2xl mb-8">{feature.description}</p>
              <div className="flex flex-wrap gap-2 justify-center mb-8">
                {feature.features.map((feat, idx) => (
                  <span
                    key={idx}
                    className="px-4 py-2 bg-slate-900/50 border border-cyan-500/20 rounded-lg text-sm text-slate-300"
                  >
                    {feat}
                  </span>
                ))}
              </div>
              <div className="px-6 py-4 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400 font-semibold">
                <Sparkles className="w-5 h-5 inline mr-2" />
                Feature interface available in full release
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // Hub view
  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Crown className="w-8 h-8 text-cyan-400" />
          <h2 className="text-3xl font-bold text-white">All Features</h2>
        </div>
        <p className="text-slate-400">
          Every enterprise-grade capability included in your Atlas UX platform - no upgrades, no paywalls
        </p>
      </div>

      {/* Feature Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {featureCategories.map((category) => {
          const Icon = category.icon;
          return (
            <div
              key={category.id}
              onClick={() => setCurrentView(category.id)}
              className="group bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6 hover:border-cyan-500/40 hover:shadow-xl hover:shadow-cyan-500/10 transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-14 h-14 bg-gradient-to-br ${category.bgColor} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <Icon className="w-7 h-7 text-cyan-400" />
                </div>
                <ArrowRight className="w-5 h-5 text-slate-600 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
              </div>
              
              <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-cyan-400 transition-colors">
                {category.name}
              </h3>
              
              <p className="text-sm text-slate-400 mb-4">
                {category.description}
              </p>
              
              <div className="flex flex-wrap gap-2">
                {category.features.slice(0, 3).map((feature, idx) => (
                  <span
                    key={idx}
                    className="text-xs px-2 py-1 bg-slate-800/50 border border-slate-700/50 rounded text-slate-400"
                  >
                    {feature}
                  </span>
                ))}
                {category.features.length > 3 && (
                  <span className="text-xs px-2 py-1 text-cyan-400">
                    +{category.features.length - 3} more
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom CTA */}
      <div className="mt-12 p-8 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white mb-1">
                All Features Included
              </h3>
              <p className="text-slate-400">
                Atlas UX is an all-in-one AI employee platform - every feature is available to you, no upgrades needed
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-6 py-3 bg-green-500/20 border border-green-500/30 rounded-xl">
            <Crown className="w-5 h-5 text-green-400" />
            <span className="font-semibold text-green-400">Full Access</span>
          </div>
        </div>
      </div>
    </div>
  );
}