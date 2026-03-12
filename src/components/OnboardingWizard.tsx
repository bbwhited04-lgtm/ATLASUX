import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Phone,
  ArrowRight,
  CheckCircle2,
  X,
  Building2,
  PhoneForwarded,
  Headphones,
  Calendar,
  MessageSquare,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

interface OnboardingWizardProps {
  isOpen: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

const BUSINESS_TYPES = [
  "Hair Salon",
  "Barber Shop",
  "Nail Salon",
  "Tattoo Studio",
  "Day Spa",
  "Lash & Brow Studio",
  "Med Spa",
  "Massage Therapist",
  "Plumber",
  "HVAC",
  "Electrician",
  "Dentist / Medical",
  "Auto Mechanic",
  "Other",
];

const CARRIER_INSTRUCTIONS = [
  {
    name: "AT&T / Cricket",
    steps: "Dial *72 then your Lucy number. Wait for confirmation tone. Done.",
  },
  {
    name: "Verizon",
    steps: "Dial *72 then your Lucy number. Press Call. Wait for confirmation. Done.",
  },
  {
    name: "T-Mobile / Metro",
    steps: "Dial **21* then your Lucy number then #. Press Call. Done.",
  },
  {
    name: "Other / Landline",
    steps: "Call your phone provider and ask to set up unconditional call forwarding to your Lucy number.",
  },
];

export function OnboardingWizard({ isOpen, onComplete, onSkip }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [businessPhone, setBusinessPhone] = useState('');
  const [businessHours, setBusinessHours] = useState('9am - 5pm');
  const [testCallDone, setTestCallDone] = useState(false);
  const [wantsSocial, setWantsSocial] = useState<boolean | null>(null);

  if (!isOpen) return null;

  const steps = [
    { number: 0, label: 'Your Business' },
    { number: 1, label: 'Meet Lucy' },
    { number: 2, label: 'Set Up Number' },
    { number: 3, label: "You're Live" },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const canProceed = () => {
    if (currentStep === 0) return businessName.trim().length > 0 && businessType.length > 0;
    return true;
  };

  const inputClass =
    "w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:border-cyan-500/50 focus:outline-none transition-colors";

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 z-[200]">
      <motion.div
        className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-cyan-500/30 rounded-3xl w-full max-w-4xl max-h-[95vh] overflow-hidden shadow-2xl shadow-cyan-500/20"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", damping: 25 }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-purple-500/20 border-b border-cyan-500/30 p-6 relative overflow-hidden">
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/30 rounded-full blur-3xl animate-pulse" />
          </div>

          <div className="relative">
            <div className="flex items-center justify-between mb-6">
              <motion.div
                className="flex items-center gap-4"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/50">
                  <Phone className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                    Let's Get Lucy Answering
                  </h1>
                  <p className="text-slate-400">Takes about 2 minutes</p>
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
              <div className="absolute top-5 left-0 right-0 h-1 bg-slate-800 rounded-full">
                <motion.div
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>

              {steps.map((step) => {
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

            {/* Step 0: Your Business */}
            {currentStep === 0 && (
              <motion.div
                key="business"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6 max-w-2xl mx-auto"
              >
                <div className="text-center mb-8">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.2 }}
                    className="mb-4"
                  >
                    <Building2 className="w-16 h-16 text-cyan-400 mx-auto" />
                  </motion.div>
                  <h2 className="text-3xl font-bold text-white mb-3">Tell Us About Your Business</h2>
                  <p className="text-slate-400">
                    Lucy will answer calls using your business name and know your industry.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">
                      Business Name <span className="text-cyan-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="Smith & Sons Plumbing"
                      className={inputClass}
                    />
                    <p className="mt-1.5 text-xs text-slate-500">
                      Lucy will say: "Thanks for calling {businessName || 'your business'}, this is Lucy. How can I help you?"
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">
                      Business Type <span className="text-cyan-400">*</span>
                    </label>
                    <select
                      value={businessType}
                      onChange={(e) => setBusinessType(e.target.value)}
                      className={`${inputClass} appearance-none cursor-pointer`}
                    >
                      <option value="" disabled className="bg-slate-900">
                        What kind of business do you run?
                      </option>
                      {BUSINESS_TYPES.map((t) => (
                        <option key={t} value={t} className="bg-slate-900">{t}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">
                      Your Business Phone Number
                    </label>
                    <input
                      type="tel"
                      value={businessPhone}
                      onChange={(e) => setBusinessPhone(e.target.value)}
                      placeholder="(555) 000-0000"
                      className={inputClass}
                    />
                    <p className="mt-1.5 text-xs text-slate-500">
                      The number your customers currently call. You'll forward this to Lucy.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">
                      Business Hours
                    </label>
                    <input
                      type="text"
                      value={businessHours}
                      onChange={(e) => setBusinessHours(e.target.value)}
                      placeholder="9am - 5pm"
                      className={inputClass}
                    />
                    <p className="mt-1.5 text-xs text-slate-500">
                      Lucy answers 24/7 but she'll let callers know your hours for in-person visits.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 1: Meet Lucy */}
            {currentStep === 1 && (
              <motion.div
                key="meet-lucy"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8 max-w-3xl mx-auto"
              >
                <div className="text-center mb-6">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.2 }}
                    className="mb-4"
                  >
                    <Headphones className="w-16 h-16 text-cyan-400 mx-auto" />
                  </motion.div>
                  <h2 className="text-3xl font-bold text-white mb-3">Meet Lucy, Your AI Receptionist</h2>
                  <p className="text-slate-400">
                    She answers your phone, books appointments, and texts you a summary of every call.
                  </p>
                </div>

                {/* What Lucy Does */}
                <div className="grid md:grid-cols-2 gap-4">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-cyan-500/10 border border-cyan-500/20 rounded-2xl p-5"
                  >
                    <Phone className="w-8 h-8 text-cyan-400 mb-3" />
                    <h3 className="text-lg font-bold text-white mb-1">Answers Every Call</h3>
                    <p className="text-sm text-slate-400">
                      24/7. Weekends. Holidays. While you're under the sink or cutting hair.
                    </p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-5"
                  >
                    <Calendar className="w-8 h-8 text-blue-400 mb-3" />
                    <h3 className="text-lg font-bold text-white mb-1">Books Appointments</h3>
                    <p className="text-sm text-slate-400">
                      Checks your availability and books callers into open slots automatically.
                    </p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-green-500/10 border border-green-500/20 rounded-2xl p-5"
                  >
                    <MessageSquare className="w-8 h-8 text-green-400 mb-3" />
                    <h3 className="text-lg font-bold text-white mb-1">Texts You Summaries</h3>
                    <p className="text-sm text-slate-400">
                      After every call: who called, what they need, urgency level, and callback number.
                    </p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-5"
                  >
                    <PhoneForwarded className="w-8 h-8 text-purple-400 mb-3" />
                    <h3 className="text-lg font-bold text-white mb-1">Sounds Human</h3>
                    <p className="text-sm text-slate-400">
                      Callers think they're talking to your receptionist. Natural, friendly, professional.
                    </p>
                  </motion.div>
                </div>

                {/* Try it now */}
                <div className="bg-slate-800/50 border border-cyan-500/30 rounded-2xl p-6 text-center">
                  <p className="text-slate-300 mb-3">Hear Lucy for yourself — call right now:</p>
                  <a
                    href="tel:+15737422028"
                    className="inline-flex items-center gap-3 rounded-2xl border border-cyan-500/50 bg-cyan-500/10 px-8 py-4 text-2xl font-bold text-cyan-400 hover:bg-cyan-500/20 transition-colors"
                  >
                    <Phone className="w-6 h-6" />
                    (573) 742-2028
                  </a>
                  <p className="mt-3 text-xs text-slate-500">Live demo line — Lucy will answer as a sample business</p>
                </div>
              </motion.div>
            )}

            {/* Step 2: Set Up Number */}
            {currentStep === 2 && (
              <motion.div
                key="setup-number"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6 max-w-3xl mx-auto"
              >
                <div className="text-center mb-6">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.2 }}
                    className="mb-4"
                  >
                    <PhoneForwarded className="w-16 h-16 text-cyan-400 mx-auto" />
                  </motion.div>
                  <h2 className="text-3xl font-bold text-white mb-3">Forward Your Calls to Lucy</h2>
                  <p className="text-slate-400">
                    Point your business phone to Lucy. Takes 2 minutes — pick your carrier below.
                  </p>
                </div>

                {/* Lucy's number */}
                <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-2xl p-6 text-center">
                  <p className="text-sm text-slate-400 mb-2">Your Lucy number (forward calls here):</p>
                  <div className="text-3xl font-bold text-cyan-400 font-mono tracking-wider">
                    (573) 742-2028
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    This is Lucy's dedicated line for {businessName || 'your business'}
                  </p>
                </div>

                {/* Carrier instructions */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-white">How to forward (pick your carrier):</h3>
                  {CARRIER_INSTRUCTIONS.map((carrier) => (
                    <div
                      key={carrier.name}
                      className="bg-slate-800/50 border border-slate-700 rounded-xl p-4"
                    >
                      <div className="text-sm font-semibold text-white mb-1">{carrier.name}</div>
                      <div className="text-sm text-slate-400">{carrier.steps}</div>
                    </div>
                  ))}
                </div>

                {/* Help link */}
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-start gap-3">
                  <ExternalLink className="w-5 h-5 text-blue-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm text-slate-300">
                      Need help? We'll walk you through it on a quick call.
                    </p>
                    <p className="text-sm text-slate-400 mt-1">
                      Text <span className="text-cyan-400 font-semibold">HELP</span> to (573) 742-2028 and Billy will reach out within 24 hours.
                    </p>
                  </div>
                </div>

                {/* Skip note */}
                <p className="text-center text-xs text-slate-500">
                  Don't worry — you can set this up later. Lucy starts working the moment you forward.
                </p>
              </motion.div>
            )}

            {/* Step 3: You're Live */}
            {currentStep === 3 && (
              <motion.div
                key="complete"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8 py-4 max-w-3xl mx-auto"
              >
                <div className="text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1, rotate: 360 }}
                    transition={{ type: "spring", duration: 0.8 }}
                    className="w-28 h-28 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-green-500/50"
                  >
                    <CheckCircle2 className="w-14 h-14 text-white" />
                  </motion.div>
                  <h2 className="text-4xl font-bold text-white mb-3">Lucy Is Ready!</h2>
                  <p className="text-xl text-slate-300">
                    {businessName ? `Lucy is now answering for ${businessName}` : "Lucy is now answering your phone"}
                  </p>
                </div>

                {/* Setup Summary */}
                <div className="bg-slate-800/50 border border-cyan-500/20 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-cyan-400" />
                    Your Setup
                  </h3>
                  <div className="space-y-3">
                    {businessName && (
                      <div className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-xl">
                        <Building2 className="w-5 h-5 text-cyan-400 shrink-0" />
                        <div className="flex-1">
                          <div className="text-sm text-white">{businessName}</div>
                          <div className="text-xs text-slate-500">{businessType} &middot; {businessHours}</div>
                        </div>
                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                      </div>
                    )}
                    <div className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-xl">
                      <Phone className="w-5 h-5 text-cyan-400 shrink-0" />
                      <div className="flex-1">
                        <div className="text-sm text-white">Lucy's Number: (573) 742-2028</div>
                        <div className="text-xs text-slate-500">Forward your business phone here</div>
                      </div>
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-xl">
                      <Headphones className="w-5 h-5 text-cyan-400 shrink-0" />
                      <div className="flex-1">
                        <div className="text-sm text-white">24/7 Call Answering</div>
                        <div className="text-xs text-slate-500">Lucy is live and ready</div>
                      </div>
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                    </div>
                  </div>
                </div>

                {/* Test call CTA */}
                <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-2xl p-6 text-center">
                  <p className="text-slate-300 mb-3">Test it — call your Lucy number and hear her answer:</p>
                  <a
                    href="tel:+15737422028"
                    onClick={() => setTestCallDone(true)}
                    className="inline-flex items-center gap-3 rounded-xl bg-gradient-to-r from-[#3e70a5] to-[#69b2cd] px-8 py-4 text-lg font-bold text-white shadow-lg hover:opacity-90 transition"
                  >
                    <Phone className="w-5 h-5" />
                    Call Lucy Now
                  </a>
                  {testCallDone && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="mt-3 text-sm text-green-400"
                    >
                      Nice! Lucy's got you covered.
                    </motion.p>
                  )}
                </div>

                {/* Optional: social media */}
                <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
                  <h3 className="text-sm font-semibold text-white mb-2">
                    Want Lucy to also help with social media?
                  </h3>
                  <p className="text-xs text-slate-400 mb-4">
                    Atlas UX includes AI agents for Facebook, Instagram, TikTok, and more. Most trade owners skip this — you can always turn it on later.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setWantsSocial(true)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                        wantsSocial === true
                          ? 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-400'
                          : 'bg-slate-800 border border-slate-700 text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      Yeah, show me
                    </button>
                    <button
                      onClick={() => setWantsSocial(false)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                        wantsSocial === false
                          ? 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-400'
                          : 'bg-slate-800 border border-slate-700 text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      Skip for now
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-900/50 border-t border-cyan-500/30 p-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-400">
              {currentStep === 0 && "Tell Lucy about your business"}
              {currentStep === 1 && "See what Lucy can do"}
              {currentStep === 2 && "One quick step to go live"}
              {currentStep === 3 && "Lucy is ready to answer your calls!"}
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
                disabled={!canProceed()}
                className={`px-8 py-3 rounded-xl font-medium transition-all shadow-lg flex items-center gap-2 ${
                  !canProceed()
                    ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                    : currentStep === 3
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white shadow-green-500/30'
                    : 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white shadow-cyan-500/30'
                }`}
              >
                {currentStep === 0 && "Next: Meet Lucy"}
                {currentStep === 1 && "Next: Set Up Number"}
                {currentStep === 2 && "Next: Go Live"}
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
