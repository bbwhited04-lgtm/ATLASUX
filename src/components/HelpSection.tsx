import { useState } from "react";
import { 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  Info,
  Shield,
  Zap,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  ExternalLink,
  Lightbulb
} from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { motion, AnimatePresence } from "motion/react";

interface FAQItem {
  question: string;
  answer: string;
  category?: "getting-started" | "security" | "advanced" | "troubleshooting";
}

interface HelpSectionProps {
  title: string;
  description: string;
  faqs: FAQItem[];
  quickTips?: string[];
  videoUrl?: string;
}

export function HelpSection({ title, description, faqs, quickTips, videoUrl }: HelpSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const toggleFAQ = (index: number) => {
    setExpandedFAQ(expandedFAQ === index ? null : index);
  };

  const getCategoryIcon = (category?: string) => {
    switch (category) {
      case "getting-started":
        return <Lightbulb className="w-4 h-4 text-green-400" />;
      case "security":
        return <Shield className="w-4 h-4 text-cyan-400" />;
      case "advanced":
        return <Zap className="w-4 h-4 text-purple-400" />;
      case "troubleshooting":
        return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      default:
        return <Info className="w-4 h-4 text-blue-400" />;
    }
  };

  const getCategoryColor = (category?: string) => {
    switch (category) {
      case "getting-started":
        return "border-green-500/30 bg-green-500/10";
      case "security":
        return "border-cyan-500/30 bg-cyan-500/10";
      case "advanced":
        return "border-purple-500/30 bg-purple-500/10";
      case "troubleshooting":
        return "border-yellow-500/30 bg-yellow-500/10";
      default:
        return "border-blue-500/30 bg-blue-500/10";
    }
  };

  const filteredFAQs = activeCategory === "all" 
    ? faqs 
    : faqs.filter(faq => faq.category === activeCategory);

  const categories = [
    { id: "all", label: "All", count: faqs.length },
    { id: "getting-started", label: "Getting Started", count: faqs.filter(f => f.category === "getting-started").length },
    { id: "security", label: "Security", count: faqs.filter(f => f.category === "security").length },
    { id: "advanced", label: "Advanced", count: faqs.filter(f => f.category === "advanced").length },
    { id: "troubleshooting", label: "Troubleshooting", count: faqs.filter(f => f.category === "troubleshooting").length },
  ].filter(cat => cat.count > 0);

  return (
    <div className="space-y-3">
      {/* Help Toggle Button */}
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full border-cyan-500/20 bg-slate-900/50 hover:bg-slate-900/70 justify-between"
      >
        <div className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-cyan-400" />
          <span className="text-sm">Help & FAQ</span>
          <Badge variant="outline" className="text-xs border-cyan-500/20">
            {faqs.length} articles
          </Badge>
        </div>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-slate-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400" />
        )}
      </Button>

      {/* Help Content */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4"
          >
            <Card className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-cyan-500/30 backdrop-blur-xl p-4">
              <div className="flex items-start gap-3">
                <BookOpen className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-sm mb-1">{title}</h4>
                  <p className="text-xs text-slate-300">{description}</p>
                </div>
              </div>
            </Card>

            {/* Quick Tips */}
            {quickTips && quickTips.length > 0 && (
              <Card className="bg-slate-900/50 border-cyan-500/20 backdrop-blur-xl p-4">
                <h5 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-yellow-400" />
                  Quick Tips
                </h5>
                <div className="space-y-2">
                  {quickTips.map((tip, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-slate-300">{tip}</p>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Video Tutorial */}
            {videoUrl && (
              <Card className="bg-slate-900/50 border-cyan-500/20 backdrop-blur-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="text-sm font-semibold flex items-center gap-2">
                    <ExternalLink className="w-4 h-4 text-blue-400" />
                    Video Tutorial
                  </h5>
                  <Badge variant="outline" className="text-xs border-blue-500/20 text-blue-400">
                    3:45
                  </Badge>
                </div>
                <p className="text-xs text-slate-400 mb-3">
                  Watch a step-by-step walkthrough of this feature
                </p>
                <Button size="sm" variant="outline" className="w-full border-cyan-500/20 text-xs">
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Watch Tutorial
                </Button>
              </Card>
            )}

            {/* Category Filters */}
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Button
                  key={category.id}
                  size="sm"
                  variant="outline"
                  onClick={() => setActiveCategory(category.id)}
                  className={`text-xs ${
                    activeCategory === category.id
                      ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-400"
                      : "border-cyan-500/20 text-slate-400"
                  }`}
                >
                  {category.label} ({category.count})
                </Button>
              ))}
            </div>

            {/* FAQ Accordion */}
            <div className="space-y-2">
              {filteredFAQs.map((faq, index) => (
                <Card
                  key={index}
                  className={`bg-slate-900/50 border-cyan-500/20 backdrop-blur-xl overflow-hidden transition-all ${
                    expandedFAQ === index ? getCategoryColor(faq.category) : ""
                  }`}
                >
                  <button
                    onClick={() => toggleFAQ(index)}
                    className="w-full p-4 flex items-start justify-between gap-3 text-left hover:bg-slate-800/30 transition-colors"
                  >
                    <div className="flex items-start gap-3 flex-1">
                      {getCategoryIcon(faq.category)}
                      <div className="flex-1">
                        <h5 className="text-sm font-medium text-slate-200">
                          {faq.question}
                        </h5>
                      </div>
                    </div>
                    {expandedFAQ === index ? (
                      <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                    )}
                  </button>

                  <AnimatePresence>
                    {expandedFAQ === index && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="border-t border-cyan-500/20"
                      >
                        <div className="p-4 pt-3">
                          <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                            {faq.answer}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              ))}
            </div>

            {/* Atlas Voice Assistance */}
            <Card className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/30 backdrop-blur-xl p-4">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h5 className="text-sm font-semibold mb-1">Ask Atlas</h5>
                  <p className="text-xs text-slate-300 mb-3">
                    Need more help? Atlas can provide personalized guidance. Use voice commands or type your question in the chat interface.
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="text-xs border-blue-500/20">
                      <HelpCircle className="w-3 h-3 mr-1" />
                      Ask Atlas
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Pre-configured help sections for different features
export const IntegrationsHelp: FAQItem[] = [
  {
    question: "How do I connect a new integration?",
    answer: "Click the 'Connect' button on any integration card. You'll be guided through a 3-step process:\n\n1. Configure: Enter your credentials or authorize via OAuth\n2. Select Accounts: Choose which accounts to import (1 or all)\n3. Verify Ownership: Complete login verification\n\nOnce verified, the integration will be marked as Active.",
    category: "getting-started"
  },
  {
    question: "Can I import passwords from my browser or phone?",
    answer: "Password import is not currently supported. Atlas UX uses JWT-based authentication, tenant isolation, and comprehensive audit logging on every action to keep your account secure.",
    category: "security"
  },
  {
    question: "What happens to my data when I connect an integration?",
    answer: "Your data is protected with multiple layers of security:\n\n• JWT-based authentication on every request\n• Tenant isolation — your data is scoped to your organization\n• Comprehensive audit logging on every action\n• OAuth tokens are securely stored\n• You can disconnect any integration at any time\n• All data is encrypted in transit and at rest",
    category: "security"
  },
  {
    question: "How do I select multiple accounts from one platform?",
    answer: "During the account selection step, you can:\n\n1. Click on individual accounts to select them one by one\n2. Use the 'Select All' button to choose all available accounts at once\n\nSelected accounts will be highlighted in cyan with a checkmark. You must select at least one account to proceed with verification.",
    category: "getting-started"
  },
  {
    question: "Why do I need to verify ownership?",
    answer: "Ownership verification is a critical security measure that:\n\n• Confirms you have legitimate access to the accounts\n• Prevents unauthorized access to your platforms\n• Ensures compliance with platform terms of service\n• Protects against account hijacking\n\nVerification is completed through secure OAuth login or API key validation, which Atlas validates before activating the integration.",
    category: "security"
  },
  {
    question: "How do I disconnect an integration?",
    answer: "To disconnect an active integration:\n\n1. Find the integration card (marked with an 'Active' badge)\n2. Click the 'Disconnect' button\n3. The integration will be deactivated immediately\n\nYou can reconnect at any time by clicking 'Connect' again. All stored credentials are securely deleted when you disconnect.",
    category: "getting-started"
  },
  {
    question: "What's the difference between OAuth and API key authentication?",
    answer: "OAuth Authentication:\n• Used by most social media and cloud platforms\n• Redirects you to the platform's login page\n• More secure - no need to share passwords\n• Can be revoked from the platform's settings\n\nAPI Key Authentication:\n• Used by developer tools and some business platforms\n• Requires manual entry of API credentials\n• Keys are encrypted and stored securely\n• Should be generated from the platform's developer console",
    category: "advanced"
  },
  {
    question: "Can I use the same integration with multiple accounts?",
    answer: "Absolutely! During the account selection step, you can choose multiple accounts from the same platform. For example, if you have 3 Facebook Pages, you can select all 3 during setup.\n\nEach account will be imported separately, and you'll be able to manage them individually within Atlas UX.",
    category: "advanced"
  },
  {
    question: "I'm getting an 'Authorization Failed' error. What should I do?",
    answer: "If authorization fails, try these steps:\n\n1. Verify your credentials are correct\n2. Check if your account has the necessary permissions\n3. Ensure you're not blocking pop-ups (for OAuth)\n4. Try disconnecting and reconnecting\n5. Clear your browser cache and cookies\n6. Check if the platform is experiencing downtime\n\nIf the issue persists, ask Atlas for help or contact support with the specific error message.",
    category: "troubleshooting"
  },
  {
    question: "Are my integrations synced to the mobile app?",
    answer: "Yes! All integrations are automatically synchronized to your Atlas UX mobile companion app. You can:\n\n• View all connected integrations\n• Approve access requests from Atlas\n• Manage connection settings\n• Monitor integration activity\n• Disconnect integrations remotely\n\nChanges made on desktop or mobile are instantly synced across all devices.",
    category: "getting-started"
  }
];

export const CRMHelp: FAQItem[] = [
  {
    question: "How do I import contacts from social media platforms?",
    answer: "Once you've connected a social media integration, you can import contacts:\n\n1. Go to the Integrations tab\n2. Connect and verify your social media account\n3. Return to CRM and click 'Import Contacts'\n4. Select which platform to import from\n5. Choose specific contacts or import all\n6. Atlas will verify permissions and import the data\n\nImported contacts are automatically categorized and deduplicated.",
    category: "getting-started"
  },
  {
    question: "Can I export my CRM data?",
    answer: "Yes! You can export your CRM data in multiple formats:\n\n• CSV for spreadsheets\n• vCard for contact managers\n• JSON for developers\n\nClick the export button in the CRM toolbar, choose your format, and Atlas will generate the file. All exports are encrypted and require authentication.",
    category: "advanced"
  },
  {
    question: "How does contact deduplication work?",
    answer: "Atlas automatically detects duplicate contacts using:\n\n• Email address matching\n• Phone number matching\n• Name similarity algorithms\n• Social media profile links\n\nWhen duplicates are found, Atlas suggests merging them while preserving all unique information from both records. You can review and approve merges before they're finalized.",
    category: "advanced"
  }
];

export const AnalyticsHelp: FAQItem[] = [
  {
    question: "What data is included in the analytics dashboard?",
    answer: "The analytics dashboard provides comprehensive insights:\n\n• Social media engagement metrics\n• Task completion rates and efficiency\n• Integration usage statistics\n• File access and storage metrics\n• AI model performance data\n• Security and access logs\n\nAll data is updated in real-time and can be filtered by date range, platform, or category.",
    category: "getting-started"
  },
  {
    question: "How do I export analytics reports?",
    answer: "To export analytics:\n\n1. Navigate to the Analytics section\n2. Select your desired date range and filters\n3. Click 'Export Report'\n4. Choose format (PDF, Excel, CSV)\n5. Atlas will generate and encrypt the report\n\nScheduled reports can be set up to automatically email you daily, weekly, or monthly summaries.",
    category: "advanced"
  }
];

export const AutomationHelp: FAQItem[] = [
  {
    question: "How do I create a custom workflow?",
    answer: "To create a custom automation workflow:\n\n1. Click 'Create Custom Workflow' in the Automation tab\n2. Choose a trigger (time-based, event-based, or manual)\n3. Add actions (post to social, send email, create file, etc.)\n4. Set conditions and filters\n5. Test your workflow with sample data\n6. Activate when ready\n\nAtlas validates all permissions before running automated tasks.",
    category: "getting-started"
  },
  {
    question: "Can workflows access my integrations automatically?",
    answer: "Workflows can access connected integrations, but with security controls:\n\n• Each workflow requests specific permissions\n• Atlas validates access before execution\n• You can review and approve automation requests on mobile\n• Sensitive actions require explicit approval\n• All workflow activity is logged for audit\n\nYou maintain full control over what automations can access.",
    category: "security"
  }
];

export const ChatHelp: FAQItem[] = [
  {
    question: "How do I use voice commands with Atlas?",
    answer: "Atlas features advanced voice recognition with two modes:\n\n**Speech-to-Text Mode:**\n• Click the microphone icon\n• Speak your command\n• Atlas transcribes to text\n• You receive text responses\n\n**Speech-to-Speech Mode (Default):**\n• Click the microphone icon\n• Speak your command\n• Atlas transcribes AND responds with voice\n• Full conversational experience\n\nToggle between modes using the Voice Mode selector above the input area. Voice commands work for all Atlas functions including task requests, file access, integration management, and system controls.",
    category: "getting-started"
  },
  {
    question: "What's the difference between Speech-to-Text and Speech-to-Speech mode?",
    answer: "**Speech-to-Text:**\n• Your voice is converted to text\n• Atlas responds with text in the chat\n• Best for documentation or quiet environments\n• You can copy/paste Atlas's responses\n\n**Speech-to-Speech (Default):**\n• Your voice is converted to text\n• Atlas responds with VOICE\n• Natural conversational experience\n• Hands-free operation\n• Audio waveform animation shows Atlas speaking\n• Best for multitasking or accessibility\n\nYou can switch between modes at any time without interrupting your conversation.",
    category: "getting-started"
  },
  {
    question: "What AI platforms can I activate?",
    answer: "Atlas UX integrates with OpenAI, Microsoft 365 (Outlook, Teams, OneDrive, Planner, SharePoint), Telegram, and social platforms (X/Twitter, Facebook, Reddit, Pinterest, LinkedIn, Tumblr, TikTok, Threads, Alignable). More integrations are being added — check Settings > Integrations for the current list.",
    category: "getting-started"
  },
  {
    question: "What is Atlas's role in the system?",
    answer: "Atlas is your AI security control system. Atlas:\n\n• Validates all access requests and permissions\n• Manages authentication and authorization\n• Monitors system security in real-time\n• Provides voice-controlled interface (speech-to-speech)\n• Coordinates between AI platforms\n• Protects your credentials and data\n• Sends approval requests to your mobile device\n\nAtlas operates with a professional, security-focused demeanor and requires explicit permission for sensitive operations.",
    category: "security"
  },
  {
    question: "How does Atlas handle my data and privacy?",
    answer: "Atlas is designed with security-first principles:\n\n• Cannot access encrypted passwords or credentials\n• Requires permission for all file access\n• Logs all security-related activities\n• Sends real-time alerts for suspicious activity\n• Uses end-to-end encryption for all communications\n• Never shares data with third parties\n• Complies with enterprise security standards\n\nAtlas's primary function is to protect your data while enabling AI capabilities.",
    category: "security"
  },
  {
    question: "Can Atlas understand me if I have an accent or speak quickly?",
    answer: "Atlas uses advanced voice recognition that:\n\n• Adapts to various accents and speaking styles\n• Learns from your speech patterns over time\n• Allows you to speak at natural pace\n• Asks for clarification if unsure\n\nFor best results:\n• Speak clearly but naturally\n• Use a quality microphone\n• Minimize background noise\n• If recognition fails, Atlas will ask you to repeat or you can type instead",
    category: "troubleshooting"
  },
  {
    question: "How do I stop Atlas from speaking in the middle of a response?",
    answer: "To interrupt Atlas's voice response:\n\n• Click the microphone button to activate listening\n• Say 'Stop' or 'Cancel'\n• Switch to Speech-to-Text mode for text-only responses\n• Close and reopen the chat\n\nAtlas is designed to respond concisely, but you have full control over the conversation flow.",
    category: "advanced"
  }
];