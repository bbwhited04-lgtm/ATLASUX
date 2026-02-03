import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  CreditCard,
  Users,
  Zap,
  Crown,
  Building2,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Calendar,
  DollarSign,
  Download,
  ExternalLink,
  Plus,
  Shield,
  ArrowRight,
  Sparkles,
  Lock,
  Unlock,
  AlertTriangle,
  Settings,
  Mail,
  UserPlus,
  Trash2,
  Clock,
  Loader2
} from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { Switch } from './ui/switch';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface Subscription {
  plan: 'starter' | 'professional' | 'business' | 'enterprise';
  status: 'active' | 'trialing' | 'past_due' | 'canceled';
  seats: number;
  usedSeats: number;
  pricePerSeat: number;
  billingCycle: 'monthly' | 'annual';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  nextBillingDate: Date;
  nextBillingAmount: number;
  trialEndsAt?: Date;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'member';
  status: 'active' | 'invited' | 'suspended';
  lastActive: string;
  joinedAt: Date;
}

interface UsageStats {
  jobs: { used: number; limit: number };
  integrations: { used: number; limit: number };
  storage: { used: number; limit: number };
  apiCalls: { used: number; limit: number };
}

interface PlanFeature {
  name: string;
  included: boolean;
}

interface PricingPlan {
  id: 'starter' | 'professional' | 'business' | 'enterprise';
  name: string;
  icon: any;
  color: string;
  monthlyPrice: number;
  annualPrice: number;
  seats: number;
  pricePerSeat?: number;
  minSeats?: number;
  priceId?: string;
  paymentLink?: string; // Add payment link field
  features: PlanFeature[];
  popular?: boolean;
}

export function SubscriptionManager() {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'member'>('member');
  const [additionalSeats, setAdditionalSeats] = useState(0);
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Mock subscription data - would come from backend
  const [subscription, setSubscription] = useState<Subscription>({
    plan: 'professional',
    status: 'active',
    seats: 5,
    usedSeats: 3,
    pricePerSeat: 49.80,
    billingCycle: 'monthly',
    currentPeriodStart: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    currentPeriodEnd: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
    nextBillingDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
    nextBillingAmount: 249
  });

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    {
      id: '1',
      name: 'You (Owner)',
      email: 'owner@company.com',
      role: 'owner',
      status: 'active',
      lastActive: 'Just now',
      joinedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
    },
    {
      id: '2',
      name: 'Sarah Johnson',
      email: 'sarah@company.com',
      role: 'admin',
      status: 'active',
      lastActive: '2 hours ago',
      joinedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
    },
    {
      id: '3',
      name: 'Mike Chen',
      email: 'mike@company.com',
      role: 'member',
      status: 'active',
      lastActive: '1 day ago',
      joinedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    }
  ]);

  const [usage, setUsage] = useState<UsageStats>({
    jobs: { used: 1247, limit: -1 }, // -1 = unlimited
    integrations: { used: 42, limit: 65 },
    storage: { used: 12.4, limit: 100 },
    apiCalls: { used: 45230, limit: 100000 }
  });

  const pricingPlans: PricingPlan[] = [
    {
      id: 'starter',
      name: 'Starter',
      icon: Zap,
      color: 'from-blue-500 to-cyan-500',
      monthlyPrice: 99,
      annualPrice: 950,
      seats: 1,
      priceId: 'price_1SwlTXKC49F2A9Oznk7DoYV8',
      paymentLink: 'https://buy.stripe.com/28E5kE4GZdGf622djJ8IU09', // Starter - min qty 1
      features: [
        { name: '1 user seat', included: true },
        { name: '10 key integrations', included: true },
        { name: '500 jobs/month', included: true },
        { name: 'Community support', included: true },
        { name: 'Mobile app', included: true },
        { name: 'API access', included: false },
        { name: 'Priority support', included: false },
        { name: 'Custom integrations', included: false }
      ]
    },
    {
      id: 'professional',
      name: 'Professional',
      icon: Crown,
      color: 'from-cyan-500 to-blue-500',
      monthlyPrice: 249,
      annualPrice: 2388,
      seats: 5,
      pricePerSeat: 49.80,
      priceId: 'price_1SwlUBKC49F2A9OzLo1QbkAl',
      paymentLink: 'https://buy.stripe.com/aFabJ25L37hR766frR8IU0b', // Professional - min qty 5, $49.80/seat
      minSeats: 5,
      popular: true,
      features: [
        { name: '5 user seats', included: true },
        { name: 'All 65+ integrations', included: true },
        { name: 'Unlimited jobs', included: true },
        { name: 'Priority email support', included: true },
        { name: 'Mobile app', included: true },
        { name: 'API access', included: true },
        { name: 'Advanced analytics', included: true },
        { name: 'Custom integrations (3/year)', included: false }
      ]
    },
    {
      id: 'business',
      name: 'Business',
      icon: Users,
      color: 'from-purple-500 to-pink-500',
      monthlyPrice: 45,
      annualPrice: 43,
      seats: 10,
      pricePerSeat: 45,
      priceId: 'price_1SwljWKC49F2A9OzD2R2kTGf',
      paymentLink: 'https://buy.stripe.com/28EcN6gpHgSrfCCcfF8IU0a', // Business - min qty 10
      minSeats: 10,
      features: [
        { name: '10-49 user seats', included: true },
        { name: 'Everything in Professional', included: true },
        { name: 'Dedicated account manager', included: true },
        { name: 'Custom integrations (3/year)', included: true },
        { name: 'Phone support', included: true },
        { name: 'SSO (Single Sign-On)', included: true },
        { name: 'White-label option', included: true },
        { name: 'Advanced permissions', included: true }
      ]
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      icon: Building2,
      color: 'from-orange-500 to-red-500',
      monthlyPrice: 40,
      annualPrice: 38,
      seats: 50,
      pricePerSeat: 40,
      priceId: 'price_1SwlkqKC49F2A9Oz505XsHQO',
      paymentLink: 'https://buy.stripe.com/14A7sM8Xf0Ttbmma7x8IU0c', // Enterprise - min 50, max 500
      minSeats: 50,
      features: [
        { name: '50+ user seats', included: true },
        { name: 'Everything in Business', included: true },
        { name: 'Dedicated success team', included: true },
        { name: 'Custom integrations (unlimited)', included: true },
        { name: '24/7 priority support', included: true },
        { name: 'On-premise deployment', included: true },
        { name: 'Custom SLA (99.9% uptime)', included: true },
        { name: 'Volume discounts available', included: true }
      ]
    }
  ];

  const currentPlan = pricingPlans.find(p => p.id === subscription.plan)!;

  const calculatePrice = (plan: PricingPlan, seats: number, cycle: 'monthly' | 'annual') => {
    if (plan.id === 'starter') {
      return cycle === 'monthly' ? plan.monthlyPrice : plan.annualPrice;
    }
    const basePrice = cycle === 'monthly' ? plan.monthlyPrice : plan.annualPrice;
    const totalSeats = Math.max(seats, plan.minSeats || plan.seats);
    return basePrice * totalSeats;
  };

  const handleInviteUser = () => {
    if (!inviteEmail) return;

    const newMember: TeamMember = {
      id: Date.now().toString(),
      name: inviteEmail.split('@')[0],
      email: inviteEmail,
      role: inviteRole,
      status: 'invited',
      lastActive: 'Never',
      joinedAt: new Date()
    };

    setTeamMembers([...teamMembers, newMember]);
    setSubscription({ ...subscription, usedSeats: subscription.usedSeats + 1 });
    setInviteEmail('');
    setShowInviteModal(false);
  };

  const handleRemoveMember = (memberId: string) => {
    if (confirm('Remove this team member? They will lose access immediately.')) {
      setTeamMembers(teamMembers.filter(m => m.id !== memberId));
      setSubscription({ ...subscription, usedSeats: subscription.usedSeats - 1 });
    }
  };

  const handlePurchaseSeats = () => {
    if (additionalSeats <= 0) return;
    
    setSubscription({
      ...subscription,
      seats: subscription.seats + additionalSeats,
      nextBillingAmount: subscription.nextBillingAmount + (additionalSeats * subscription.pricePerSeat)
    });
    
    setAdditionalSeats(0);
    alert(`Successfully added ${additionalSeats} seat(s)! Your next invoice will be updated.`);
  };

  // Handler to redirect to Stripe Payment Link
  const handleUpgradePlan = (plan: PricingPlan) => {
    if (!plan.paymentLink) {
      // For Enterprise, show contact message
      alert('Please contact sales@atlasux.com for Enterprise pricing.');
      return;
    }
    
    // Redirect to Stripe Payment Link
    window.open(plan.paymentLink, '_blank');
  };

  const daysUntilRenewal = Math.ceil(
    (subscription.nextBillingDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-cyan-400" />
            Subscription & Billing
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Manage your plan, team members, and billing
          </p>
        </div>

        <Button
          onClick={() => setShowUpgradeModal(true)}
          className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 shadow-lg shadow-cyan-500/30"
        >
          <TrendingUp className="w-4 h-4 mr-2" />
          Upgrade Plan
        </Button>
      </div>

      {/* Current Plan Overview */}
      <Card className={`bg-gradient-to-br ${currentPlan.color} p-6 border-0 shadow-xl`}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <currentPlan.icon className="w-8 h-8 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-2xl font-bold text-white">{currentPlan.name}</h3>
                {subscription.status === 'active' && (
                  <Badge className="bg-green-500/20 text-green-200 border-green-400/30">
                    Active
                  </Badge>
                )}
                {subscription.status === 'trialing' && (
                  <Badge className="bg-blue-500/20 text-blue-200 border-blue-400/30">
                    Trial
                  </Badge>
                )}
              </div>
              <p className="text-white/80 text-sm">
                {subscription.seats} seats • ${subscription.nextBillingAmount}/{subscription.billingCycle === 'monthly' ? 'mo' : 'yr'}
              </p>
            </div>
          </div>

          <div className="text-right">
            <div className="text-3xl font-bold text-white mb-1">
              ${subscription.nextBillingAmount}
            </div>
            <div className="text-white/80 text-sm">
              Renews in {daysUntilRenewal} days
            </div>
          </div>
        </div>

        {/* Seat Usage */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-white">Seat Usage</span>
            <span className="text-sm text-white/80">
              {subscription.usedSeats} / {subscription.seats} seats used
            </span>
          </div>
          <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-white rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(subscription.usedSeats / subscription.seats) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          {subscription.usedSeats >= subscription.seats && (
            <p className="text-xs text-yellow-200 mt-2 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              All seats are in use. Purchase more seats to invite additional team members.
            </p>
          )}
        </div>
      </Card>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-slate-900/50 border border-cyan-500/20">
          <TabsTrigger value="overview">
            <TrendingUp className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="team">
            <Users className="w-4 h-4 mr-2" />
            Team ({teamMembers.length})
          </TabsTrigger>
          <TabsTrigger value="usage">
            <Zap className="w-4 h-4 mr-2" />
            Usage
          </TabsTrigger>
          <TabsTrigger value="billing">
            <DollarSign className="w-4 h-4 mr-2" />
            Billing
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="bg-slate-800/50 border-cyan-500/20 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                  <Users className="w-5 h-5 text-cyan-400" />
                </div>
                <Badge variant="outline" className="text-xs border-cyan-500/30 text-cyan-400">
                  {subscription.seats - subscription.usedSeats} available
                </Badge>
              </div>
              <div className="text-2xl font-bold mb-1">{subscription.usedSeats} / {subscription.seats}</div>
              <div className="text-sm text-slate-400">Team Seats</div>
            </Card>

            <Card className="bg-slate-800/50 border-green-500/20 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                </div>
                <Badge variant="outline" className="text-xs border-green-500/30 text-green-400">
                  Active
                </Badge>
              </div>
              <div className="text-2xl font-bold mb-1 capitalize">{subscription.status}</div>
              <div className="text-sm text-slate-400">Status</div>
            </Card>

            <Card className="bg-slate-800/50 border-blue-500/20 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-blue-400" />
                </div>
                <Badge variant="outline" className="text-xs border-blue-500/30 text-blue-400">
                  {subscription.billingCycle}
                </Badge>
              </div>
              <div className="text-2xl font-bold mb-1">{daysUntilRenewal} days</div>
              <div className="text-sm text-slate-400">Until Renewal</div>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card className="bg-slate-800/50 border-cyan-500/20 p-6">
            <h3 className="font-semibold mb-4">Quick Actions</h3>
            <div className="grid md:grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="justify-start border-cyan-500/20 hover:bg-cyan-500/10"
                onClick={() => setShowInviteModal(true)}
                disabled={subscription.usedSeats >= subscription.seats}
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Invite Team Member
              </Button>

              <Button
                variant="outline"
                className="justify-start border-blue-500/20 hover:bg-blue-500/10"
                onClick={() => setShowUpgradeModal(true)}
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Upgrade Plan
              </Button>

              <Button
                variant="outline"
                className="justify-start border-purple-500/20 hover:bg-purple-500/10"
              >
                <Plus className="w-4 h-4 mr-2" />
                Purchase Additional Seats
              </Button>

              <Button
                variant="outline"
                className="justify-start border-slate-700 hover:bg-slate-800"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Invoice
              </Button>
            </div>
          </Card>

          {/* Plan Features */}
          <Card className="bg-slate-800/50 border-cyan-500/20 p-6">
            <h3 className="font-semibold mb-4">Your Plan Includes</h3>
            <div className="grid md:grid-cols-2 gap-3">
              {currentPlan.features.map((feature, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-2 text-sm ${
                    feature.included ? 'text-slate-300' : 'text-slate-500'
                  }`}
                >
                  {feature.included ? (
                    <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-slate-600 flex-shrink-0" />
                  )}
                  <span>{feature.name}</span>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Team Tab */}
        <TabsContent value="team" className="space-y-4">
          <Card className="bg-slate-800/50 border-cyan-500/20 p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold">Team Members</h3>
                <p className="text-sm text-slate-400">
                  {subscription.usedSeats} of {subscription.seats} seats used
                </p>
              </div>
              <Button
                onClick={() => setShowInviteModal(true)}
                disabled={subscription.usedSeats >= subscription.seats}
                className="bg-cyan-500 hover:bg-cyan-400"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Invite Member
              </Button>
            </div>

            <div className="space-y-2">
              {teamMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg hover:bg-slate-900 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {member.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{member.name}</span>
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            member.role === 'owner'
                              ? 'border-yellow-500/30 text-yellow-400'
                              : member.role === 'admin'
                              ? 'border-blue-500/30 text-blue-400'
                              : 'border-slate-700 text-slate-400'
                          }`}
                        >
                          {member.role}
                        </Badge>
                        {member.status === 'invited' && (
                          <Badge variant="outline" className="text-xs border-orange-500/30 text-orange-400">
                            Pending
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 flex items-center gap-3 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {member.email}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {member.lastActive}
                        </span>
                      </div>
                    </div>
                  </div>

                  {member.role !== 'owner' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveMember(member.id)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </Card>

          {/* Purchase Additional Seats */}
          {subscription.usedSeats >= subscription.seats && (
            <Card className="bg-orange-500/10 border-orange-500/30 p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-6 h-6 text-orange-400" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold mb-2">All Seats In Use</h4>
                  <p className="text-sm text-slate-300 mb-4">
                    You're using all {subscription.seats} seats. Purchase additional seats to invite more team members.
                  </p>
                  <div className="flex items-center gap-3">
                    <Input
                      type="number"
                      min="1"
                      max="50"
                      value={additionalSeats}
                      onChange={(e) => setAdditionalSeats(parseInt(e.target.value) || 0)}
                      placeholder="Number of seats"
                      className="w-32 bg-slate-900/50 border-orange-500/20"
                    />
                    <span className="text-sm text-slate-400">
                      × ${subscription.pricePerSeat}/seat = ${(additionalSeats * subscription.pricePerSeat).toFixed(2)}/mo
                    </span>
                    <Button
                      onClick={handlePurchaseSeats}
                      disabled={additionalSeats <= 0}
                      className="bg-orange-500 hover:bg-orange-400 ml-auto"
                    >
                      Purchase {additionalSeats} Seat{additionalSeats !== 1 ? 's' : ''}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </TabsContent>

        {/* Usage Tab */}
        <TabsContent value="usage" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Jobs Usage */}
            <Card className="bg-slate-800/50 border-cyan-500/20 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-semibold">Jobs This Month</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    {usage.jobs.limit === -1 ? 'Unlimited' : `${usage.jobs.used.toLocaleString()} / ${usage.jobs.limit.toLocaleString()}`}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                  <Zap className="w-6 h-6 text-cyan-400" />
                </div>
              </div>
              {usage.jobs.limit !== -1 && (
                <div className="space-y-2">
                  <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                      style={{ width: `${(usage.jobs.used / usage.jobs.limit) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-400">
                    {((usage.jobs.used / usage.jobs.limit) * 100).toFixed(1)}% used
                  </p>
                </div>
              )}
              {usage.jobs.limit === -1 && (
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                  Unlimited ✨
                </Badge>
              )}
            </Card>

            {/* Integrations Usage */}
            <Card className="bg-slate-800/50 border-blue-500/20 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-semibold">Active Integrations</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    {usage.integrations.used} / {usage.integrations.limit} connected
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-blue-400" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                    style={{ width: `${(usage.integrations.used / usage.integrations.limit) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-slate-400">
                  {((usage.integrations.used / usage.integrations.limit) * 100).toFixed(1)}% used
                </p>
              </div>
            </Card>

            {/* Storage Usage */}
            <Card className="bg-slate-800/50 border-purple-500/20 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-semibold">Storage</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    {usage.storage.used} GB / {usage.storage.limit} GB
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                  <Download className="w-6 h-6 text-purple-400" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                    style={{ width: `${(usage.storage.used / usage.storage.limit) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-slate-400">
                  {((usage.storage.used / usage.storage.limit) * 100).toFixed(1)}% used
                </p>
              </div>
            </Card>

            {/* API Calls Usage */}
            <Card className="bg-slate-800/50 border-green-500/20 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-semibold">API Calls</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    {usage.apiCalls.used.toLocaleString()} / {usage.apiCalls.limit.toLocaleString()}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-400" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
                    style={{ width: `${(usage.apiCalls.used / usage.apiCalls.limit) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-slate-400">
                  {((usage.apiCalls.used / usage.apiCalls.limit) * 100).toFixed(1)}% used
                </p>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing" className="space-y-4">
          <Card className="bg-slate-800/50 border-cyan-500/20 p-6">
            <h3 className="font-semibold mb-4">Payment Method</h3>
            <div className="flex items-center gap-4 p-4 bg-slate-900/50 rounded-lg">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="font-medium">Visa ending in 4242</div>
                <div className="text-sm text-slate-400">Expires 12/2026</div>
              </div>
              <Button variant="outline" size="sm" className="border-cyan-500/20">
                <Settings className="w-4 h-4 mr-2" />
                Update
              </Button>
            </div>
          </Card>

          <Card className="bg-slate-800/50 border-cyan-500/20 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Billing History</h3>
              <Button variant="outline" size="sm" className="border-cyan-500/20">
                <Download className="w-4 h-4 mr-2" />
                Download All
              </Button>
            </div>

            <div className="space-y-2">
              {[
                { date: '2026-02-01', amount: 249, status: 'paid', invoice: 'INV-2026-02' },
                { date: '2026-01-01', amount: 249, status: 'paid', invoice: 'INV-2026-01' },
                { date: '2025-12-01', amount: 249, status: 'paid', invoice: 'INV-2025-12' }
              ].map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg hover:bg-slate-900 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <div className="font-medium">${item.amount.toFixed(2)}</div>
                      <div className="text-xs text-slate-400">
                        {new Date(item.date).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                      Paid
                    </Badge>
                    <Button variant="ghost" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      {item.invoice}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Upgrade Modal */}
      <AnimatePresence>
        {showUpgradeModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-cyan-500/30 rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden"
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-purple-500/20 border-b border-cyan-500/30 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-1">Choose Your Plan</h3>
                    <p className="text-slate-400">Upgrade or change your subscription</p>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Billing Cycle Toggle */}
                    <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg p-1">
                      <button
                        onClick={() => setBillingCycle('monthly')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          billingCycle === 'monthly'
                            ? 'bg-cyan-500 text-white'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Monthly
                      </button>
                      <button
                        onClick={() => setBillingCycle('annual')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          billingCycle === 'annual'
                            ? 'bg-cyan-500 text-white'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Annual
                        <span className="ml-1 text-xs text-green-400">(Save 20%)</span>
                      </button>
                    </div>

                    <button
                      onClick={() => setShowUpgradeModal(false)}
                      className="text-slate-400 hover:text-white transition-colors"
                    >
                      <XCircle className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Pricing Cards */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {pricingPlans.map((plan) => {
                    const isCurrentPlan = plan.id === subscription.plan;
                    const Icon = plan.icon;
                    const price = calculatePrice(plan, plan.seats, billingCycle);
                    
                    return (
                      <motion.div
                        key={plan.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`relative bg-slate-800/50 border-2 rounded-2xl p-6 ${
                          plan.popular
                            ? 'border-cyan-500 shadow-lg shadow-cyan-500/20'
                            : isCurrentPlan
                            ? 'border-green-500/50'
                            : 'border-slate-700'
                        }`}
                      >
                        {plan.popular && (
                          <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-cyan-500 to-blue-500 border-0 shadow-lg shadow-cyan-500/30">
                            Most Popular
                          </Badge>
                        )}

                        {isCurrentPlan && (
                          <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-500/20 text-green-400 border-green-500/30">
                            Current Plan
                          </Badge>
                        )}

                        <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center mb-4`}>
                          <Icon className="w-7 h-7 text-white" />
                        </div>

                        <h4 className="text-xl font-bold mb-2">{plan.name}</h4>

                        <div className="mb-4">
                          <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-bold">${billingCycle === 'monthly' ? plan.monthlyPrice : plan.annualPrice}</span>
                            {plan.pricePerSeat ? (
                              <span className="text-sm text-slate-400">/user/mo</span>
                            ) : (
                              <span className="text-sm text-slate-400">/mo</span>
                            )}
                          </div>
                          {plan.minSeats && (
                            <p className="text-xs text-slate-400 mt-1">
                              Minimum {plan.minSeats} seats
                            </p>
                          )}
                        </div>

                        <Button
                          disabled={isCurrentPlan}
                          className={`w-full mb-4 ${
                            plan.popular
                              ? 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400'
                              : 'bg-slate-700 hover:bg-slate-600'
                          }`}
                          onClick={() => handleUpgradePlan(plan)}
                        >
                          {isCurrentPlan ? 'Current Plan' : plan.id === 'enterprise' ? 'Contact Sales' : 'Upgrade'}
                          {!isCurrentPlan && <ArrowRight className="w-4 h-4 ml-2" />}
                        </Button>

                        <div className="space-y-2">
                          {plan.features.slice(0, 6).map((feature, index) => (
                            <div
                              key={index}
                              className={`flex items-start gap-2 text-xs ${
                                feature.included ? 'text-slate-300' : 'text-slate-500'
                              }`}
                            >
                              {feature.included ? (
                                <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                              ) : (
                                <XCircle className="w-4 h-4 text-slate-600 flex-shrink-0 mt-0.5" />
                              )}
                              <span>{feature.name}</span>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Invite Modal */}
      <AnimatePresence>
        {showInviteModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-cyan-500/30 rounded-2xl w-full max-w-md p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold">Invite Team Member</h3>
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Email Address</label>
                  <Input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="colleague@company.com"
                    className="bg-slate-800/50 border-cyan-500/20"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Role</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setInviteRole('member')}
                      className={`p-3 rounded-lg border-2 transition-all text-left ${
                        inviteRole === 'member'
                          ? 'border-cyan-500 bg-cyan-500/10'
                          : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                      }`}
                    >
                      <div className="font-medium text-sm mb-1">Member</div>
                      <div className="text-xs text-slate-400">Standard access</div>
                    </button>

                    <button
                      onClick={() => setInviteRole('admin')}
                      className={`p-3 rounded-lg border-2 transition-all text-left ${
                        inviteRole === 'admin'
                          ? 'border-cyan-500 bg-cyan-500/10'
                          : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                      }`}
                    >
                      <div className="font-medium text-sm mb-1">Admin</div>
                      <div className="text-xs text-slate-400">Full access</div>
                    </button>
                  </div>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                  <p className="text-xs text-slate-300">
                    An invitation email will be sent to {inviteEmail || 'the email address'}.
                    They'll have 7 days to accept.
                  </p>
                </div>

                <Button
                  onClick={handleInviteUser}
                  disabled={!inviteEmail}
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Send Invitation
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}