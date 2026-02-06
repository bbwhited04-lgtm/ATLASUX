import { useState } from "react";
import { setConnection } from "../utils/connections";

import {
  X,
  ArrowRight,
  Key,
  Lock,
  Shield,
  Fingerprint,
  Chrome,
  Apple,
  CheckCircle2,
  ExternalLink,
  Check,
  Globe,
  Loader2,
  Eye,
  Users,
  BarChart3
} from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card } from "./ui/card";

interface AnalyticsConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  platformName: string | null;
}

export function AnalyticsConnectionModal({ isOpen, onClose, platformName }: AnalyticsConnectionModalProps) {
  const [step, setStep] = useState(1);
  const [authMethod, setAuthMethod] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const platformKey = (name: string) => `video:${name.toLowerCase().replace(/\s+/g, "-")}`;
  if (!isOpen) return null;

  // Simulate authentication
  const handleAuth = () => {
    setIsConnecting(true);
    setTimeout(() => {
      setIsConnecting(false);
      setStep(step + 1);
    }, 1500);
  };

  // Mock accounts for selection
  const selected = mockAccounts.find(a => a.id === selectedAccount);
setConnection({
  providerKey: platformKey(platformName || "unknown"),
  status: "connected",
  accountLabel: selected?.email || selected?.name || "Connected",
  connectedAt: new Date().toISOString()
});


  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border border-cyan-500/30 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center">
              <Globe className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Connect {platformName}</h3>
              <p className="text-xs text-slate-400">Step {step} of 5</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300"
              style={{ width: `${(step / 5) * 100}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-slate-500">
            <span className={step >= 1 ? "text-cyan-400" : ""}>Auth</span>
            <span className={step >= 2 ? "text-cyan-400" : ""}>Login</span>
            <span className={step >= 3 ? "text-cyan-400" : ""}>Permissions</span>
            <span className={step >= 4 ? "text-cyan-400" : ""}>Account</span>
            <span className={step >= 5 ? "text-cyan-400" : ""}>Complete</span>
          </div>
        </div>

        {/* Step 1: Authentication Method Selection */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-white mb-2">Choose Authentication Method</h4>
              <p className="text-sm text-slate-400 mb-4">
                Select how you'd like to connect your {platformName} account
              </p>
            </div>

            <div className="space-y-3">
              {/* OAuth (Recommended) */}
              <button
                onClick={() => setAuthMethod("oauth")}
                className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                  authMethod === "oauth"
                    ? "border-cyan-500 bg-cyan-500/10"
                    : "border-slate-700 hover:border-slate-600 bg-slate-800/50"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Shield className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-white">OAuth 2.0</span>
                      <Badge className="text-xs bg-green-500/20 text-green-400 border-green-500/30">Recommended</Badge>
                    </div>
                    <p className="text-xs text-slate-400">Secure authentication with single sign-on</p>
                  </div>
                  {authMethod === "oauth" && <Check className="w-5 h-5 text-cyan-400" />}
                </div>
              </button>

              {/* Browser Saved Password */}
              <button
                onClick={() => setAuthMethod("browser-password")}
                className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                  authMethod === "browser-password"
                    ? "border-cyan-500 bg-cyan-500/10"
                    : "border-slate-700 hover:border-slate-600 bg-slate-800/50"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Chrome className="w-5 h-5 text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <span className="font-medium text-white block mb-1">Browser Saved Password</span>
                    <p className="text-xs text-slate-400">Use credentials from Edge, Chrome, or Safari</p>
                  </div>
                  {authMethod === "browser-password" && <Check className="w-5 h-5 text-cyan-400" />}
                </div>
              </button>

              {/* Passkey / Touch ID */}
              <button
                onClick={() => setAuthMethod("passkey")}
                className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                  authMethod === "passkey"
                    ? "border-cyan-500 bg-cyan-500/10"
                    : "border-slate-700 hover:border-slate-600 bg-slate-800/50"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Fingerprint className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <span className="font-medium text-white block mb-1">Passkey / Biometric</span>
                    <p className="text-xs text-slate-400">Use Face ID, Touch ID, or Windows Hello</p>
                  </div>
                  {authMethod === "passkey" && <Check className="w-5 h-5 text-cyan-400" />}
                </div>
              </button>

              {/* Manual API Key */}
              <button
                onClick={() => setAuthMethod("api-key")}
                className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                  authMethod === "api-key"
                    ? "border-cyan-500 bg-cyan-500/10"
                    : "border-slate-700 hover:border-slate-600 bg-slate-800/50"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Key className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div className="flex-1">
                    <span className="font-medium text-white block mb-1">API Key</span>
                    <p className="text-xs text-slate-400">Manually enter your API credentials</p>
                  </div>
                  {authMethod === "api-key" && <Check className="w-5 h-5 text-cyan-400" />}
                </div>
              </button>
            </div>

            <Button
              onClick={() => setStep(2)}
              disabled={!authMethod}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400"
            >
              Continue
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}

        {/* Step 2: Login/Authentication */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-white mb-2">
                {authMethod === "oauth" && "Sign in with OAuth"}
                {authMethod === "browser-password" && "Sign in with Browser Password"}
                {authMethod === "passkey" && "Authenticate with Passkey"}
                {authMethod === "api-key" && "Enter API Key"}
              </h4>
              <p className="text-sm text-slate-400 mb-4">
                {authMethod === "oauth" && `You'll be redirected to ${platformName} to authorize access`}
                {authMethod === "browser-password" && "Select saved credentials from your browser"}
                {authMethod === "passkey" && "Use your device's biometric authentication"}
                {authMethod === "api-key" && `Enter your ${platformName} API key or access token`}
              </p>
            </div>

            {authMethod === "oauth" && (
              <Card className="bg-slate-800/50 border-cyan-500/20 p-6">
                <div className="text-center">
                  <Shield className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
                  <h5 className="font-semibold text-white mb-2">Redirect to {platformName}</h5>
                  <p className="text-sm text-slate-400 mb-4">
                    You'll be redirected to {platformName}'s secure login page
                  </p>
                  <div className="flex items-center justify-center gap-2 text-xs text-slate-500 mb-4">
                    <Lock className="w-4 h-4" />
                    <span>Encrypted connection (HTTPS)</span>
                  </div>
                </div>
              </Card>
            )}

            {authMethod === "browser-password" && (
              <Card className="bg-slate-800/50 border-purple-500/20 p-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-lg cursor-pointer hover:bg-slate-900 transition-colors">
                    <Chrome className="w-5 h-5 text-purple-400" />
                    <div className="flex-1">
                      <div className="font-medium text-white text-sm">user@company.com</div>
                      <div className="text-xs text-slate-400">Saved in Chrome</div>
                    </div>
                    <Badge className="text-xs bg-green-500/20 text-green-400 border-green-500/30">Available</Badge>
                  </div>
                </div>
              </Card>
            )}

            {authMethod === "passkey" && (
              <Card className="bg-slate-800/50 border-blue-500/20 p-6">
                <div className="text-center">
                  <Fingerprint className="w-16 h-16 text-blue-400 mx-auto mb-4 animate-pulse" />
                  <h5 className="font-semibold text-white mb-2">Waiting for biometric authentication...</h5>
                  <p className="text-sm text-slate-400">
                    Use your fingerprint, face, or security key to continue
                  </p>
                </div>
              </Card>
            )}

            {authMethod === "api-key" && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">API Key</label>
                  <input
                    type="password"
                    placeholder="sk_live_••••••••••••••••"
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                  />
                </div>
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 flex items-start gap-2">
                  <Lock className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-yellow-400">
                    <strong>Security:</strong> Your API key is encrypted and stored securely
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                onClick={() => setStep(1)}
                variant="outline"
                className="flex-1 border-slate-700"
              >
                Back
              </Button>
              <Button
                onClick={handleAuth}
                disabled={isConnecting}
                className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    Authenticate
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Permissions & Data Sharing */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-white mb-2">Review Permissions</h4>
              <p className="text-sm text-slate-400 mb-4">
                Atlas UX is requesting permission to access the following data from your {platformName} account
              </p>
            </div>

            <Card className="bg-slate-800/50 border-cyan-500/20 p-4">
              <div className="space-y-3">
                {[
                  { icon: Eye, label: "Read analytics data", detail: "View reports, metrics, and traffic data" },
                  { icon: Users, label: "Access audience information", detail: "Demographics, interests, and behavior" },
                  { icon: Globe, label: "View property details", detail: "Website properties and app integrations" },
                  { icon: BarChart3, label: "Export reports", detail: "Download analytics reports and raw data" },
                ].map((permission, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-slate-900/50 rounded-lg">
                    <div className="w-8 h-8 bg-cyan-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <permission.icon className="w-4 h-4 text-cyan-400" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-white text-sm">{permission.label}</div>
                      <div className="text-xs text-slate-400">{permission.detail}</div>
                    </div>
                    <Check className="w-5 h-5 text-green-400" />
                  </div>
                ))}
              </div>
            </Card>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-blue-400">
                  <strong>Privacy:</strong> Atlas UX will never modify your data or post content without your explicit approval. All data is stored securely and can be disconnected anytime.
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => setStep(2)}
                variant="outline"
                className="flex-1 border-slate-700"
              >
                Back
              </Button>
              <Button
                onClick={handleAuth}
                disabled={isConnecting}
                className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Granting Access...
                  </>
                ) : (
                  <>
                    Grant Permission
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Account Selection & Verification */}
        {step === 4 && (
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-white mb-2">Select Account</h4>
              <p className="text-sm text-slate-400 mb-4">
                Choose which {platformName} account(s) you'd like to connect to Atlas UX
              </p>
            </div>

            <div className="space-y-3">
              {mockAccounts.map((account) => (
                <button
                  key={account.id}
                  onClick={() => setSelectedAccount(account.id)}
                  className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                    selectedAccount === account.id
                      ? "border-cyan-500 bg-cyan-500/10"
                      : "border-slate-700 hover:border-slate-600 bg-slate-800/50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-bold">
                      {account.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-white mb-1">{account.name}</div>
                      <div className="text-xs text-slate-400 mb-2">{account.email}</div>
                      <Badge className="text-xs bg-slate-700 text-slate-300 border-slate-600">
                        {account.properties} {account.properties === 1 ? "Property" : "Properties"}
                      </Badge>
                    </div>
                    {selectedAccount === account.id && (
                      <CheckCircle2 className="w-6 h-6 text-cyan-400" />
                    )}
                  </div>
                </button>
              ))}
            </div>

            <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-cyan-400">
                  <strong>Account Verified:</strong> Your account ownership has been confirmed. You can connect multiple accounts and switch between them anytime.
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => setStep(3)}
                variant="outline"
                className="flex-1 border-slate-700"
              >
                Back
              </Button>
              <Button
                onClick={handleAuth}
                disabled={!selectedAccount || isConnecting}
                className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    Connect Account
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Step 5: Success */}
        {step === 5 && (
          <div className="text-center py-8">
            <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-white" />
            </div>

            <h4 className="text-2xl font-bold text-white mb-2">Successfully Connected!</h4>
            <p className="text-slate-400 mb-6">
              {platformName} is now linked to your Atlas UX dashboard
            </p>

            <Card className="bg-slate-800/50 border-cyan-500/20 p-6 mb-6">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-2xl font-bold text-cyan-400 mb-1">✓</div>
                  <div className="text-xs text-slate-400">Authenticated</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-400 mb-1">✓</div>
                  <div className="text-xs text-slate-400">Data Synced</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-400 mb-1">✓</div>
                  <div className="text-xs text-slate-400">Account Verified</div>
                </div>
              </div>
            </Card>

            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                <span className="text-sm text-slate-300">Initial data import</span>
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Complete</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                <span className="text-sm text-slate-300">Real-time sync enabled</span>
                <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">Active</Badge>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={onClose}
                variant="outline"
                className="flex-1 border-slate-700"
              >
                Close
              </Button>
              <Button
                onClick={onClose}
                className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400"
              >
                View Analytics Dashboard
                <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}