import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Smartphone, 
  Download, 
  Shield, 
  CheckCircle2, 
  QrCode, 
  Apple,
  ArrowRight,
  Sparkles,
  Globe2,
  Facebook,
  Instagram,
  Linkedin,
  Twitter,
  Mail,
  Calendar,
  FileText,
  Briefcase,
  Zap,
  Users,
  Lock,
  Bell,
  Camera,
  ChevronRight,
  X,
  Settings
} from 'lucide-react';

interface OnboardingWizardProps {
  isOpen: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

export function OnboardingWizard({ isOpen, onComplete, onSkip }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [phoneConnected, setPhoneConnected] = useState(false);
  const [selectedIntegrations, setSelectedIntegrations] = useState<string[]>([]);
  const [pairingCode] = useState('AX-7K9M-2P4R');

  if (!isOpen) return null;

  const integrations = [
    { id: 'facebook', name: 'Facebook', icon: Facebook, color: 'from-blue-600 to-blue-500', description: 'Import friends & posts' },
    { id: 'instagram', name: 'Instagram', icon: Instagram, color: 'from-pink-600 to-purple-500', description: 'Sync followers & media' },
    { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, color: 'from-blue-700 to-blue-600', description: 'Connect professional network' },
    { id: 'twitter', name: 'Twitter/X', icon: Twitter, color: 'from-slate-900 to-slate-800', description: 'Track tweets & mentions' },
    { id: 'gmail', name: 'Gmail', icon: Mail, color: 'from-red-600 to-red-500', description: 'Email integration' },
    { id: 'calendar', name: 'Google Calendar', icon: Calendar, color: 'from-green-600 to-green-500', description: 'Sync appointments' },
    { id: 'salesforce', name: 'Salesforce', icon: Briefcase, color: 'from-cyan-600 to-blue-600', description: 'CRM integration' },
    { id: 'hubspot', name: 'HubSpot', icon: Users, color: 'from-orange-600 to-orange-500', description: 'Marketing automation' },
  ];

  const steps = [
    { number: 0, label: 'Welcome' },
    { number: 1, label: 'Mobile Setup' },
    { number: 2, label: 'Connect Accounts' },
    { number: 3, label: 'Complete' },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handleSimulatePairing = () => {
    setPhoneConnected(true);
    setTimeout(() => handleNext(), 1500);
  };

  const toggleIntegration = (id: string) => {
    setSelectedIntegrations(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 z-[200]">
      <motion.div 
        className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-cyan-500/30 rounded-3xl w-full max-w-5xl max-h-[95vh] overflow-hidden shadow-2xl shadow-cyan-500/20"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", damping: 25 }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-purple-500/20 border-b border-cyan-500/30 p-8 relative overflow-hidden">
          {/* Animated Background */}
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/30 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          </div>

          <div className="relative">
            <div className="flex items-center justify-between mb-6">
              <motion.div 
                className="flex items-center gap-4"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/50 relative">
                  <Shield className="w-10 h-10 text-white" />
                  <motion.div
                    className="absolute inset-0 rounded-2xl border-2 border-cyan-400"
                    animate={{
                      scale: [1, 1.1, 1],
                      opacity: [0.5, 0, 0.5],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                    }}
                  />
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
                    Welcome to Atlas UX
                  </h1>
                  <p className="text-lg text-slate-400">Your AI Employee • Let's get you set up!</p>
                </div>
              </motion.div>

              {currentStep > 0 && (
                <button
                  onClick={onSkip}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              )}
            </div>

            {/* Progress Steps */}
            <div className="flex items-center justify-between relative">
              {/* Progress Line */}
              <div className="absolute top-5 left-0 right-0 h-1 bg-slate-800 rounded-full">
                <motion.div 
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>

              {steps.map((step, index) => {
                const isComplete = currentStep > step.number;
                const isCurrent = currentStep === step.number;
                
                return (
                  <div key={step.number} className="flex flex-col items-center gap-2 relative z-10">
                    <motion.div 
                      className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                        isComplete 
                          ? 'bg-gradient-to-br from-green-500 to-emerald-500 border-green-500 shadow-lg shadow-green-500/50'
                          : isCurrent
                          ? 'bg-gradient-to-br from-cyan-500 to-blue-500 border-cyan-500 shadow-lg shadow-cyan-500/50'
                          : 'bg-slate-800 border-slate-700'
                      }`}
                      animate={isCurrent ? { scale: [1, 1.1, 1] } : {}}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      {isComplete ? (
                        <CheckCircle2 className="w-5 h-5 text-white" />
                      ) : (
                        <span className={`text-sm font-bold ${isCurrent ? 'text-white' : 'text-slate-500'}`}>
                          {step.number + 1}
                        </span>
                      )}
                    </motion.div>
                    <span className={`text-xs font-medium ${isComplete || isCurrent ? 'text-white' : 'text-slate-500'}`}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto max-h-[calc(95vh-280px)] scrollbar-thin scrollbar-thumb-cyan-500/30 scrollbar-track-slate-800/50">
          <AnimatePresence mode="wait">
            {/* Step 0: Welcome */}
            {currentStep === 0 && (
              <motion.div
                key="welcome"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="text-center max-w-2xl mx-auto">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.2 }}
                    className="mb-6"
                  >
                    <Sparkles className="w-24 h-24 text-cyan-400 mx-auto" />
                  </motion.div>
                  <h2 className="text-3xl font-bold text-white mb-4">
                    Meet Your AI Worker
                  </h2>
                  <p className="text-lg text-slate-300 mb-8">
                    Atlas UX operates directly from your PC with two powerful systems: 
                    <span className="text-cyan-400 font-semibold"> Neptune</span> (Control) and 
                    <span className="text-blue-400 font-semibold"> Pluto</span> (Job Runner)
                  </p>
                </div>

                {/* Feature Grid */}
                <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-2xl p-6"
                  >
                    <div className="w-14 h-14 rounded-xl bg-cyan-500/20 flex items-center justify-center mb-4">
                      <Smartphone className="w-7 h-7 text-cyan-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Mobile Control</h3>
                    <p className="text-slate-400">
                      Approve tasks, monitor jobs, and control Atlas from anywhere with the mobile companion app
                    </p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-2xl p-6"
                  >
                    <div className="w-14 h-14 rounded-xl bg-blue-500/20 flex items-center justify-center mb-4">
                      <Globe2 className="w-7 h-7 text-blue-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">65+ Integrations</h3>
                    <p className="text-slate-400">
                      Connect social media, business tools, cloud storage, and CRM platforms seamlessly
                    </p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-2xl p-6"
                  >
                    <div className="w-14 h-14 rounded-xl bg-purple-500/20 flex items-center justify-center mb-4">
                      <Zap className="w-7 h-7 text-purple-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Automation</h3>
                    <p className="text-slate-400">
                      Create videos, monitor social media, run jobs, and automate workflows with AI
                    </p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-2xl p-6"
                  >
                    <div className="w-14 h-14 rounded-xl bg-green-500/20 flex items-center justify-center mb-4">
                      <Lock className="w-7 h-7 text-green-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Secure by Design</h3>
                    <p className="text-slate-400">
                      Neptune validates all commands with enterprise-grade security protocols
                    </p>
                  </motion.div>
                </div>

                <div className="text-center mt-8">
                  <p className="text-sm text-slate-500 mb-4">
                    This setup will take about 3 minutes to complete
                  </p>
                </div>
              </motion.div>
            )}

            {/* Step 1: Mobile Setup */}
            {currentStep === 1 && (
              <motion.div
                key="mobile"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-white mb-3">Connect Your Mobile Device</h2>
                  <p className="text-lg text-slate-400">
                    Control Atlas from anywhere with the mobile companion app
                  </p>
                </div>

                {!phoneConnected ? (
                  <>
                    {/* Download Section */}
                    <div className="bg-slate-800/50 border border-cyan-500/20 rounded-2xl p-8 max-w-3xl mx-auto">
                      <div className="grid md:grid-cols-2 gap-8">
                        {/* QR Code */}
                        <div className="flex flex-col items-center justify-center">
                          <div className="bg-white rounded-2xl p-6 mb-4">
                            <QrCode className="w-48 h-48 text-slate-900" />
                          </div>
                          <p className="text-sm text-slate-400 text-center">
                            Scan with your iPhone camera
                          </p>
                        </div>

                        {/* Instructions */}
                        <div className="flex flex-col justify-center">
                          <h3 className="text-xl font-bold text-white mb-4">Quick Setup:</h3>
                          <ol className="space-y-3">
                            <li className="flex items-start gap-3">
                              <div className="w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-xs font-bold text-cyan-400">1</span>
                              </div>
                              <div>
                                <div className="text-white font-medium">Download Atlas UX Mobile</div>
                                <div className="text-sm text-slate-400">Scan QR code or visit App Store</div>
                              </div>
                            </li>
                            <li className="flex items-start gap-3">
                              <div className="w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-xs font-bold text-cyan-400">2</span>
                              </div>
                              <div>
                                <div className="text-white font-medium">Open the app</div>
                                <div className="text-sm text-slate-400">Sign in with your account</div>
                              </div>
                            </li>
                            <li className="flex items-start gap-3">
                              <div className="w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-xs font-bold text-cyan-400">3</span>
                              </div>
                              <div>
                                <div className="text-white font-medium">Enter pairing code</div>
                                <div className="bg-slate-900/50 border border-cyan-500/30 rounded-lg px-4 py-2 inline-block mt-2">
                                  <span className="text-2xl font-bold font-mono text-cyan-400 tracking-wider">{pairingCode}</span>
                                </div>
                              </div>
                            </li>
                          </ol>

                          <a
                            href="https://apps.apple.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-6 flex items-center justify-between p-4 bg-slate-900/50 hover:bg-slate-900 border border-slate-700 hover:border-cyan-500/40 rounded-xl transition-all group"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-black flex items-center justify-center">
                                <Apple className="w-6 h-6 text-white" />
                              </div>
                              <div className="text-left">
                                <div className="text-xs text-slate-400">Download on the</div>
                                <div className="text-sm font-semibold text-white">App Store</div>
                              </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-cyan-400 transition-colors" />
                          </a>
                        </div>
                      </div>
                    </div>

                    {/* Features Preview */}
                    <div className="grid md:grid-cols-3 gap-4 max-w-3xl mx-auto">
                      <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-4 text-center">
                        <Bell className="w-10 h-10 text-cyan-400 mx-auto mb-2" />
                        <h5 className="text-sm font-semibold text-white mb-1">Push Notifications</h5>
                        <p className="text-xs text-slate-400">Get instant alerts</p>
                      </div>
                      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-center">
                        <Camera className="w-10 h-10 text-blue-400 mx-auto mb-2" />
                        <h5 className="text-sm font-semibold text-white mb-1">File Upload</h5>
                        <p className="text-xs text-slate-400">Share photos & docs</p>
                      </div>
                      <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4 text-center">
                        <Shield className="w-10 h-10 text-purple-400 mx-auto mb-2" />
                        <h5 className="text-sm font-semibold text-white mb-1">Secure Access</h5>
                        <p className="text-xs text-slate-400">Encrypted connection</p>
                      </div>
                    </div>

                    {/* Demo Button */}
                    <div className="text-center mt-6">
                      <button
                        onClick={handleSimulatePairing}
                        className="px-6 py-3 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 rounded-xl text-cyan-400 text-sm font-medium transition-colors"
                      >
                        For Demo: Simulate Mobile Connection
                      </button>
                    </div>
                  </>
                ) : (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-center py-12"
                  >
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 0.5 }}
                      className="w-24 h-24 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/50"
                    >
                      <CheckCircle2 className="w-12 h-12 text-white" />
                    </motion.div>
                    <h3 className="text-2xl font-bold text-white mb-2">Mobile Connected!</h3>
                    <p className="text-slate-400 mb-6">iPhone 15 Pro • iOS 18.2</p>
                    <p className="text-sm text-slate-500">Redirecting to next step...</p>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* Step 2: Connect Accounts */}
            {currentStep === 2 && (
              <motion.div
                key="integrations"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-white mb-3">Connect Your Accounts</h2>
                  <p className="text-lg text-slate-400">
                    Choose which platforms to integrate with Atlas UX
                  </p>
                  <p className="text-sm text-cyan-400 mt-2">
                    Selected: {selectedIntegrations.length} • You can add more later
                  </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
                  {integrations.map((integration, index) => {
                    const Icon = integration.icon;
                    const isSelected = selectedIntegrations.includes(integration.id);
                    
                    return (
                      <motion.button
                        key={integration.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => toggleIntegration(integration.id)}
                        className={`relative p-6 rounded-2xl border-2 transition-all text-left ${
                          isSelected
                            ? 'border-cyan-500 bg-cyan-500/10 shadow-lg shadow-cyan-500/20'
                            : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                        }`}
                      >
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/50"
                          >
                            <CheckCircle2 className="w-5 h-5 text-white" />
                          </motion.div>
                        )}

                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${integration.color} flex items-center justify-center mb-4 shadow-lg`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        
                        <h3 className="text-sm font-bold text-white mb-1">{integration.name}</h3>
                        <p className="text-xs text-slate-400">{integration.description}</p>
                      </motion.button>
                    );
                  })}
                </div>

                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6 max-w-3xl mx-auto mt-8">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                      <Settings className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white mb-2">You'll configure these next</h4>
                      <p className="text-xs text-slate-400 mb-3">
                        After setup completes, you'll be guided through OAuth connections for each platform you selected. 
                        Don't worry - you can skip any and add more integrations later from the Integrations page.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {['OAuth Authentication', 'Secure Token Storage', 'Real-time Sync', 'Auto-reconnect'].map((feature) => (
                          <span key={feature} className="px-2 py-1 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-400">
                            ✓ {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 3: Complete */}
            {currentStep === 3 && (
              <motion.div
                key="complete"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8 py-8"
              >
                <div className="text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1, rotate: 360 }}
                    transition={{ type: "spring", duration: 0.8 }}
                    className="w-32 h-32 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-green-500/50"
                  >
                    <CheckCircle2 className="w-16 h-16 text-white" />
                  </motion.div>
                  <h2 className="text-4xl font-bold text-white mb-3">You're All Set!</h2>
                  <p className="text-xl text-slate-300 mb-8">
                    Atlas UX is ready to start working for you
                  </p>
                </div>

                {/* Setup Summary */}
                <div className="bg-slate-800/50 border border-cyan-500/20 rounded-2xl p-8 max-w-3xl mx-auto">
                  <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-cyan-400" />
                    Setup Summary
                  </h3>

                  <div className="space-y-4">
                    <div className="flex items-center gap-4 p-4 bg-slate-900/50 rounded-xl">
                      <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center flex-shrink-0">
                        <Smartphone className="w-6 h-6 text-green-400" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-white">Mobile Device Connected</div>
                        <div className="text-xs text-slate-400">iPhone 15 Pro ready for remote access</div>
                      </div>
                      <CheckCircle2 className="w-5 h-5 text-green-400" />
                    </div>

                    <div className="flex items-center gap-4 p-4 bg-slate-900/50 rounded-xl">
                      <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                        <Globe2 className="w-6 h-6 text-cyan-400" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-white">
                          {selectedIntegrations.length} Integrations Selected
                        </div>
                        <div className="text-xs text-slate-400">
                          {selectedIntegrations.length > 0 
                            ? `Ready to connect: ${selectedIntegrations.map(id => integrations.find(i => i.id === id)?.name).join(', ')}`
                            : 'You can add integrations anytime from Settings'
                          }
                        </div>
                      </div>
                      <CheckCircle2 className="w-5 h-5 text-green-400" />
                    </div>

                    <div className="flex items-center gap-4 p-4 bg-slate-900/50 rounded-xl">
                      <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                        <Shield className="w-6 h-6 text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-white">Neptune & Pluto Online</div>
                        <div className="text-xs text-slate-400">Security control and job runner active</div>
                      </div>
                      <CheckCircle2 className="w-5 h-5 text-green-400" />
                    </div>
                  </div>
                </div>

                {/* Next Steps */}
                <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-2xl p-8 max-w-3xl mx-auto">
                  <h3 className="text-lg font-bold text-white mb-4">What's Next?</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-cyan-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-sm font-bold text-white">1</span>
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white mb-1">Explore the Dashboard</div>
                        <div className="text-xs text-slate-400">See what Atlas can do for you</div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-cyan-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-sm font-bold text-white">2</span>
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white mb-1">Connect Integrations</div>
                        <div className="text-xs text-slate-400">Authorize your selected platforms</div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-cyan-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-sm font-bold text-white">3</span>
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white mb-1">Chat with Atlas</div>
                        <div className="text-xs text-slate-400">Give your first command</div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-cyan-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-sm font-bold text-white">4</span>
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white mb-1">Create Your First Job</div>
                        <div className="text-xs text-slate-400">Let Pluto run a task for you</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-center">
                  <p className="text-sm text-slate-500">
                    💡 Pro tip: Check out the Help section in Settings for detailed guides
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-900/50 border-t border-cyan-500/30 p-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-400">
              {currentStep === 0 && "Ready to get started?"}
              {currentStep === 1 && "Connect your phone to continue"}
              {currentStep === 2 && `${selectedIntegrations.length} integration${selectedIntegrations.length !== 1 ? 's' : ''} selected`}
              {currentStep === 3 && "Setup complete! Welcome to Atlas UX"}
            </div>

            <div className="flex gap-3">
              {currentStep > 0 && currentStep < 3 && (
                <button
                  onClick={onSkip}
                  className="px-6 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-white font-medium transition-colors"
                >
                  Skip for Now
                </button>
              )}
              
              <button
                onClick={handleNext}
                disabled={currentStep === 1 && !phoneConnected}
                className={`px-8 py-3 rounded-xl font-medium transition-all shadow-lg flex items-center gap-2 ${
                  currentStep === 1 && !phoneConnected
                    ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                    : currentStep === 3
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white shadow-green-500/30'
                    : 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white shadow-cyan-500/30'
                }`}
              >
                {currentStep === 0 && "Let's Get Started"}
                {currentStep === 1 && (phoneConnected ? "Continue" : "Waiting for Mobile...")}
                {currentStep === 2 && "Continue"}
                {currentStep === 3 && "Start Using Atlas UX"}
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
