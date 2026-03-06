export type VcProspect = {
  name: string;
  firm: string;
  email: string;
  focus: string;
  personalization: string;
};

/**
 * VC prospects for automated outreach.
 *
 * Excluded: Clement Delangue (HF) and Jean-Charles Samuelian (Alan)
 * — already contacted personally by Billy via Gmail.
 *
 * Update emails as needed — these use standard partner@ or firstname@ formats.
 * When a prospect's email bounces, the job will fail and retry; update the
 * address in this file and redeploy.
 */
export const vcProspects: VcProspect[] = [
  // ── Tier 1: AI-focused funds ──────────────────────────────────────────────
  {
    name: "Elad Gil",
    firm: "Elad Gil (Solo GP)",
    email: "elad@eladgil.com",
    focus: "AI infrastructure, SaaS",
    personalization: "Early backer of Anthropic, Mistral, Perplexity — Atlas UX is the autonomous AI employee layer on top of these models",
  },
  {
    name: "Naval Ravikant",
    firm: "AngelList / Solo",
    email: "naval@angellist.co",
    focus: "AI platforms, dev tools",
    personalization: "Co-founder AngelList, early in Anthropic + Perplexity — Atlas UX packages AI into autonomous business employees",
  },
  {
    name: "Matt Turck",
    firm: "FirstMark Capital",
    email: "matt@firstmarkcap.com",
    focus: "AI/ML, enterprise SaaS",
    personalization: "Author of the MAD landscape — Atlas UX is the applied AI employee platform sitting on top of the stack",
  },
  {
    name: "Sarah Guo",
    firm: "Conviction",
    email: "sarah@conviction.com",
    focus: "AI-native companies",
    personalization: "Conviction fund thesis is AI-native businesses — Atlas UX literally replaces business roles with AI employees",
  },
  {
    name: "Vinod Khosla",
    firm: "Khosla Ventures",
    email: "vinod@khoslaventures.com",
    focus: "AI, deep tech",
    personalization: "Backed OpenAI early — Atlas UX is the execution layer that turns LLMs into autonomous business operators",
  },
  // ── Tier 2: Enterprise AI / SaaS investors ────────────────────────────────
  {
    name: "Andrew Chen",
    firm: "Andreessen Horowitz",
    email: "andrew@a16z.com",
    focus: "Consumer, marketplace, AI",
    personalization: "a16z partner focused on network effects — Atlas UX agents create compounding value as they learn org patterns",
  },
  {
    name: "Nicole Quinn",
    firm: "Lightspeed Venture Partners",
    email: "nicole@lsvp.com",
    focus: "AI, consumer tech",
    personalization: "Lightspeed led AI billion-dollar rounds in 2025 — Atlas UX is the applied productivity layer",
  },
  {
    name: "Martin Casado",
    firm: "Andreessen Horowitz",
    email: "martin@a16z.com",
    focus: "Enterprise, cloud, AI infra",
    personalization: "Enterprise infrastructure expert — Atlas UX runs a multi-agent governance stack with audit trails and approval workflows",
  },
  {
    name: "David Cahn",
    firm: "Sequoia Capital",
    email: "david@sequoiacap.com",
    focus: "AI infrastructure",
    personalization: "Sequoia AI infrastructure focus — Atlas UX is building the enterprise OS for autonomous AI employees",
  },
  {
    name: "Cyan Banister",
    firm: "Long Journey Ventures",
    email: "cyan@longjourney.vc",
    focus: "AI-first startups",
    personalization: "Early OpenAI backer — Atlas UX is making AI employees a reality with built-in governance and safety",
  },
  // ── Tier 3: Seed / early-stage AI ─────────────────────────────────────────
  {
    name: "Chris Dixon",
    firm: "Andreessen Horowitz",
    email: "cdixon@a16z.com",
    focus: "AI, crypto, future tech",
    personalization: "a16z GP focused on emerging tech — Atlas UX is a new category: AI employees with corporate structure",
  },
  {
    name: "Jamin Ball",
    firm: "Altimeter Capital",
    email: "jamin@altimetercap.com",
    focus: "Cloud, SaaS, AI",
    personalization: "SaaS metrics expert — Atlas UX replaces entire departments with AI agents at 1/100th the cost",
  },
  {
    name: "Patrick Collison",
    firm: "Stripe / Solo Angel",
    email: "patrick@stripe.com",
    focus: "Developer tools, infrastructure",
    personalization: "Stripe CEO + prolific angel — Atlas UX uses Stripe for billing and represents the future of AI-automated business ops",
  },
  {
    name: "Logan Bartlett",
    firm: "Redpoint Ventures",
    email: "logan@redpoint.com",
    focus: "Enterprise SaaS, AI",
    personalization: "Hosts Cartoon Avatars pod on enterprise AI — Atlas UX is live autonomous AI employees, not chatbots",
  },
  {
    name: "Talia Goldberg",
    firm: "Bessemer Venture Partners",
    email: "talia@bvp.com",
    focus: "Cloud, AI, enterprise",
    personalization: "Bessemer cloud index perspective — Atlas UX is the next wave: AI employees replacing cloud SaaS seats",
  },
  {
    name: "Sameer Gandhi",
    firm: "Accel",
    email: "sameer@accel.com",
    focus: "SaaS, AI-native",
    personalization: "Accel SaaS partner — Atlas UX is an AI-native platform replacing traditional productivity SaaS with autonomous agents",
  },
];
