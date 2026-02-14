import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Zap,
  Crown,
  Users,
  Building2,
  CheckCircle2,
  XCircle,
  ArrowRight,
} from "lucide-react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Switch } from "../components/ui/switch";

type BillingCycle = "monthly" | "annual";

type PlanFeature = {
  name: string;
  included: boolean;
};

type PricingPlan = {
  id: "starter" | "professional" | "business" | "enterprise";
  name: string;
  icon: any;
  color: string; // gradient tailwind classes
  monthlyPrice: number;
  annualPrice: number;
  seats: number;
  pricePerSeat?: number;
  minSeats?: number;
  popular?: boolean;
  paymentLink: string;
  features: PlanFeature[];
};

const pricingPlans: PricingPlan[] = [
  {
    id: "starter",
    name: "Starter",
    icon: Zap,
    color: "from-blue-500 to-cyan-500",
    monthlyPrice: 99,
    annualPrice: 950,
    seats: 1,
    paymentLink: "https://buy.stripe.com/28E5kE4GZdGf622djJ8IU09",
    features: [
      { name: "1 user seat", included: true },
      { name: "10 key integrations", included: true },
      { name: "500 jobs/month", included: true },
      { name: "Community support", included: true },
      { name: "Mobile app", included: true },
      { name: "API access", included: false },
      { name: "Priority support", included: false },
      { name: "Custom integrations", included: false },
    ],
  },
  {
    id: "professional",
    name: "Professional",
    icon: Crown,
    color: "from-cyan-500 to-blue-500",
    monthlyPrice: 249,
    annualPrice: 2388,
    seats: 5,
    pricePerSeat: 49.8,
    minSeats: 5,
    popular: true,
    paymentLink: "https://buy.stripe.com/aFabJ25L37hR766frR8IU0b",
    features: [
      { name: "5 user seats", included: true },
      { name: "All 65+ integrations", included: true },
      { name: "Unlimited jobs", included: true },
      { name: "Priority email support", included: true },
      { name: "Mobile app", included: true },
      { name: "API access", included: true },
      { name: "Advanced analytics", included: true },
      { name: "Custom integrations (3/year)", included: false },
    ],
  },
  {
    id: "business",
    name: "Business",
    icon: Users,
    color: "from-purple-500 to-pink-500",
    monthlyPrice: 45,
    annualPrice: 43,
    seats: 10,
    pricePerSeat: 45,
    minSeats: 10,
    paymentLink: "https://buy.stripe.com/28EcN6gpHgSrfCCcfF8IU0a",
    features: [
      { name: "10-49 user seats", included: true },
      { name: "Everything in Professional", included: true },
      { name: "Dedicated account manager", included: true },
      { name: "Custom integrations (3/year)", included: true },
      { name: "Phone support", included: true },
      { name: "SSO (Single Sign-On)", included: true },
      { name: "White-label option", included: true },
      { name: "Advanced permissions", included: true },
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    icon: Building2,
    color: "from-orange-500 to-red-500",
    monthlyPrice: 40,
    annualPrice: 38,
    seats: 50,
    pricePerSeat: 40,
    minSeats: 50,
    paymentLink: "https://buy.stripe.com/14A7sM8Xf0Ttbmma7x8IU0c",
    features: [
      { name: "50+ user seats", included: true },
      { name: "Everything in Business", included: true },
      { name: "Dedicated success team", included: true },
      { name: "Custom integrations (unlimited)", included: true },
      { name: "24/7 priority support", included: true },
      { name: "On-premise deployment", included: true },
      { name: "Custom SLA (99.9% uptime)", included: true },
      { name: "Volume discounts available", included: true },
    ],
  },
];

function formatUSD(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function Store() {
  const [billing, setBilling] = useState<BillingCycle>("monthly");

  const subtitle = useMemo(() => {
    return billing === "annual"
      ? "Annual billing (discounted)"
      : "Monthly billing (cancel anytime)";
  }, [billing]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="mx-auto max-w-6xl px-6 pt-10">
        <div className="flex items-center justify-between">
          <Link to="/" className="text-sm text-slate-300 hover:text-white">
            ← Back to Home
          </Link>
          <div className="flex items-center gap-3">
            <Link
              to="/payment"
              className="text-sm text-slate-300 hover:text-white"
            >
              Payment
            </Link>
            <a
              href="#/app"
              className="text-sm text-slate-300 hover:text-white"
              title="Open the app"
            >
              Open App
            </a>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Store</h1>
            <p className="mt-2 text-sm text-slate-400">
              Same pricing as the in-app Subscription Manager. Checkout links are
              live.
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/20 px-4 py-3">
            <span
              className={`text-sm ${
                billing === "monthly" ? "text-white" : "text-slate-400"
              }`}
            >
              Monthly
            </span>
            <Switch
              checked={billing === "annual"}
              onCheckedChange={(v) => setBilling(v ? "annual" : "monthly")}
            />
            <span
              className={`text-sm ${
                billing === "annual" ? "text-white" : "text-slate-400"
              }`}
            >
              Annual
            </span>
            <Badge className="ml-2 bg-emerald-600/20 text-emerald-300 border border-emerald-600/30">
              Save
            </Badge>
          </div>
        </div>

        <p className="mt-3 text-sm text-slate-400">{subtitle}</p>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-16 pt-10">
        <div className="grid gap-6 lg:grid-cols-4">
          {pricingPlans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} billing={billing} />
          ))}
        </div>

        <div className="mt-10 rounded-2xl border border-slate-800 bg-slate-900/20 p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-sm font-semibold text-white">
                Already a customer?
              </div>
              <div className="text-sm text-slate-400">
                Manage seats, billing cycle, and invoices inside the app.
              </div>
            </div>
            <a
              href="#/app/settings"
              className="inline-flex items-center gap-2 text-cyan-300 hover:text-cyan-200"
            >
              Open Subscription Manager <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>

        <footer className="mt-14 border-t border-slate-800 pt-8 text-sm text-slate-400">
          <div className="flex flex-wrap gap-4">
            <Link to="/privacy" className="hover:text-white">
              Privacy
            </Link>
            <Link to="/terms" className="hover:text-white">
              Terms
            </Link>
            <Link to="/acceptable-use" className="hover:text-white">
              Acceptable Use
            </Link>
            <Link to="/payment" className="hover:text-white">
              Payment
            </Link>
          </div>
          <p className="mt-4 text-xs text-slate-500">
            © {new Date().getFullYear()} Atlas UX
          </p>
        </footer>
      </main>
    </div>
  );
}

function PlanCard({ plan, billing }: { plan: PricingPlan; billing: BillingCycle }) {
  const Icon = plan.icon;

  const headline = formatUSD(billing === "annual" ? plan.annualPrice : plan.monthlyPrice);
  const priceLabel =
    plan.id === "starter"
      ? billing === "annual"
        ? "/year"
        : "/month"
      : billing === "annual"
      ? "/seat/year"
      : "/seat/month";

  const minSeats = plan.minSeats ?? plan.seats;

  return (
    <Card className="relative overflow-hidden border border-slate-800 bg-slate-900/20">
      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${plan.color}`} />
      {plan.popular && (
        <div className="absolute right-4 top-4">
          <Badge className="bg-cyan-500/20 text-cyan-200 border border-cyan-500/30">
            Most Popular
          </Badge>
        </div>
      )}

      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className={`rounded-xl bg-gradient-to-r ${plan.color} p-2`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="text-lg font-semibold">{plan.name}</div>
            <div className="text-xs text-slate-400">
              {plan.id === "starter" ? "Solo / single seat" : `Minimum ${minSeats} seats`}
            </div>
          </div>
        </div>

        <div className="mt-6">
          <div className="flex items-baseline gap-2">
            <div className="text-3xl font-bold">{headline}</div>
            <div className="text-sm text-slate-400">{priceLabel}</div>
          </div>

          <div className="mt-2 text-sm text-slate-400">
            {plan.id === "starter"
              ? "All core essentials to get running."
              : `Checkout is per-seat. Starts at ${minSeats} seats.`}
          </div>
        </div>

        <div className="mt-6 space-y-2">
          {plan.features.map((f) => (
            <div key={f.name} className="flex items-start gap-2 text-sm">
              {f.included ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-400" />
              ) : (
                <XCircle className="mt-0.5 h-4 w-4 text-slate-600" />
              )}
              <span className={f.included ? "text-slate-200" : "text-slate-500"}>
                {f.name}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-6">
          <Button
            className="w-full bg-cyan-500 text-slate-950 hover:bg-cyan-400"
            onClick={() => window.open(plan.paymentLink, "_blank", "noopener,noreferrer")}
          >
            Checkout <ArrowRight className="ml-2 h-4 w-4" />
          </Button>

          <div className="mt-3 text-xs text-slate-500">
            By purchasing, you agree to our{" "}
            <Link to="/terms" className="text-slate-300 hover:text-white">
              Terms
            </Link>{" "}
            and{" "}
            <Link to="/privacy" className="text-slate-300 hover:text-white">
              Privacy Policy
            </Link>
            .
          </div>
        </div>
      </div>
    </Card>
  );
}
