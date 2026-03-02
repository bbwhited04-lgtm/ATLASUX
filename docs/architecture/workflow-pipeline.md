# Atlas UX Workflow Pipeline

> How work flows from Atlas down through intel → aggregation → publishing.

```mermaid
%%{ init: {
  "theme": "dark",
  "themeVariables": {
    "primaryColor": "#1e293b",
    "primaryTextColor": "#f8fafc",
    "primaryBorderColor": "#475569",
    "lineColor": "#64748b"
  },
  "flowchart": { "curve": "basis", "nodeSpacing": 20, "rankSpacing": 50 }
} }%%

flowchart TD

  %% ── Phase 0: Boot ─────────────────────────────────────────────────────────
  subgraph BOOT["PHASE 0 · BOOT"]
    direction LR
    wf021["<b>WF-021</b><br/>Bootstrap Atlas<br/><i>Discover agents · load KB · seed tasks</i>"]
    wf020["<b>WF-020</b><br/>Engine Smoke Test<br/><i>Cloud surface verification</i>"]
  end

  %% ── Phase 1: Intel Sweeps (05:00 UTC) ─────────────────────────────────────
  subgraph INTEL["PHASE 1 · PLATFORM INTEL SWEEPS · 05:00 UTC"]
    direction LR
    wf093["<b>WF-093</b><br/>Kelly · X"]
    wf094["<b>WF-094</b><br/>Fran · Facebook"]
    wf095["<b>WF-095</b><br/>Dwight · Threads"]
    wf096["<b>WF-096</b><br/>Timmy · TikTok"]
    wf097["<b>WF-097</b><br/>Terry · Tumblr"]
    wf098["<b>WF-098</b><br/>Cornwall · Pinterest"]
    wf099["<b>WF-099</b><br/>Link · LinkedIn"]
    wf100["<b>WF-100</b><br/>Emma · Alignable"]
    wf101["<b>WF-101</b><br/>Donna · Reddit"]
    wf102["<b>WF-102</b><br/>Reynolds · Blog SEO"]
    wf103["<b>WF-103</b><br/>Penny · FB Ads"]
    wf104["<b>WF-104</b><br/>Archy · Instagram"]
    wf105["<b>WF-105</b><br/>Venny · YouTube"]
  end

  %% ── Phase 2: Aggregation (05:45 UTC) ──────────────────────────────────────
  subgraph AGG["PHASE 2 · ATLAS AGGREGATION · 05:45 UTC"]
    direction TB
    wf106["<b>WF-106</b><br/>Atlas Daily Aggregation<br/><i>Daily-Intel synthesizes all 13 reports<br/>→ Atlas issues per-agent task orders<br/>→ emails every agent their directive</i>"]
  end

  %% ── Phase 3: Content Generation & Publishing ──────────────────────────────
  subgraph PUBLISH["PHASE 3 · POSTIZ PUBLISHING · Agents Generate & Post"]
    direction LR
    wf200["<b>WF-200</b><br/>Timmy<br/>TikTok"]
    wf201["<b>WF-201</b><br/>Kelly<br/>X"]
    wf202["<b>WF-202</b><br/>Fran<br/>Facebook"]
    wf203["<b>WF-203</b><br/>Donna<br/>Reddit"]
    wf204["<b>WF-204</b><br/>Dwight<br/>Threads"]
    wf205["<b>WF-205</b><br/>Link<br/>LinkedIn"]
    wf206["<b>WF-206</b><br/>Cornwall<br/>Pinterest"]
    wf207["<b>WF-207</b><br/>Terry<br/>Tumblr"]
    wf208["<b>WF-208</b><br/>Venny<br/>YouTube"]
    wf209["<b>WF-209</b><br/>Emma<br/>Mastodon"]
    wf210["<b>WF-210</b><br/>Archy<br/>Instagram"]
    wf211["<b>WF-211</b><br/>Reynolds<br/>Medium"]
    wf212["<b>WF-212</b><br/>Sunday<br/>Cross-Platform"]
  end

  %% ── Phase 4: Analytics & Reporting ────────────────────────────────────────
  subgraph ANALYTICS["PHASE 4 · POSTIZ ANALYTICS · Performance Review"]
    direction LR
    wf220["<b>WF-220</b><br/>Timmy<br/>TikTok Stats"]
    wf221["<b>WF-221</b><br/>Kelly<br/>X Stats"]
    wf222["<b>WF-222</b><br/>Fran<br/>FB Stats"]
    wf223["<b>WF-223</b><br/>Sunday<br/>Cross-Platform"]
  end

  %% ── Phase 5: Weekly Sweeps ────────────────────────────────────────────────
  subgraph WEEKLY["PHASE 5 · WEEKLY SWEEPS"]
    direction LR
    wf120["<b>WF-120</b><br/>Sunday<br/>Brand Mentions"]
    wf121["<b>WF-121</b><br/>Archy<br/>Competitor Intel"]
    wf122["<b>WF-122</b><br/>Reynolds<br/>SEO Rank"]
    wf123["<b>WF-123</b><br/>Mercer<br/>Lead Enrichment"]
  end

  %% ── Operational Workflows ─────────────────────────────────────────────────
  subgraph OPS["OPERATIONAL · On-Demand"]
    direction LR
    wf001["<b>WF-001</b><br/>Cheryl<br/>Support Intake"]
    wf002["<b>WF-002</b><br/>Cheryl<br/>Escalation"]
    wf107["<b>WF-107</b><br/>Atlas<br/>Tool Discovery"]
    wf108["<b>WF-108</b><br/>Reynolds<br/>Blog Writer"]
    wf119["<b>WF-119</b><br/>Atlas<br/>Nightly Memory"]
    wf130["<b>WF-130</b><br/>Atlas<br/>Browser Task"]
    wf140["<b>WF-140</b><br/>Vision<br/>Local Browser"]
  end

  %% ── Lucy Reception ────────────────────────────────────────────────────────
  subgraph LUCY["LUCY RECEPTION · Always On"]
    direction LR
    wf112["<b>WF-112</b><br/>Morning Open"]
    wf113["<b>WF-113</b><br/>Call Triage"]
    wf114["<b>WF-114</b><br/>Booking"]
    wf115["<b>WF-115</b><br/>Voicemail"]
    wf116["<b>WF-116</b><br/>Lead Capture"]
    wf117["<b>WF-117</b><br/>EOD Summary"]
    wf118["<b>WF-118</b><br/>Chat Widget"]
  end

  %% ── Video Pipeline ────────────────────────────────────────────────────────
  subgraph VIDEO["VIDEO PIPELINE · Venny + Victor"]
    direction LR
    wf110["<b>WF-110</b><br/>Venny<br/>YT Scraper"]
    wf111["<b>WF-111</b><br/>Venny<br/>Shorts Publisher"]
  end

  %% ── Flow Connections ──────────────────────────────────────────────────────

  BOOT --> INTEL

  wf093 --> wf106
  wf094 --> wf106
  wf095 --> wf106
  wf096 --> wf106
  wf097 --> wf106
  wf098 --> wf106
  wf099 --> wf106
  wf100 --> wf106
  wf101 --> wf106
  wf102 --> wf106
  wf103 --> wf106
  wf104 --> wf106
  wf105 --> wf106

  wf106 --> PUBLISH

  PUBLISH --> ANALYTICS

  %% ── Styles ────────────────────────────────────────────────────────────────

  classDef boot fill:#7c3aed,stroke:#a78bfa,color:#f8fafc
  classDef intel fill:#0891b2,stroke:#22d3ee,color:#f8fafc
  classDef agg fill:#dc2626,stroke:#f87171,color:#f8fafc
  classDef publish fill:#be185d,stroke:#f472b6,color:#f8fafc
  classDef analytics fill:#059669,stroke:#34d399,color:#f8fafc
  classDef weekly fill:#d97706,stroke:#fbbf24,color:#f8fafc
  classDef ops fill:#334155,stroke:#64748b,color:#f8fafc
  classDef lucy fill:#7c3aed,stroke:#c4b5fd,color:#f8fafc
  classDef video fill:#2563eb,stroke:#60a5fa,color:#f8fafc

  class wf020,wf021 boot
  class wf093,wf094,wf095,wf096,wf097,wf098,wf099,wf100,wf101,wf102,wf103,wf104,wf105 intel
  class wf106 agg
  class wf200,wf201,wf202,wf203,wf204,wf205,wf206,wf207,wf208,wf209,wf210,wf211,wf212 publish
  class wf220,wf221,wf222,wf223 analytics
  class wf120,wf121,wf122,wf123 weekly
  class wf001,wf002,wf107,wf108,wf119,wf130,wf140 ops
  class wf112,wf113,wf114,wf115,wf116,wf117,wf118 lucy
  class wf110,wf111 video

  style BOOT fill:#1e1b4b,stroke:#7c3aed,color:#f8fafc
  style INTEL fill:#083344,stroke:#0891b2,color:#f8fafc
  style AGG fill:#450a0a,stroke:#dc2626,color:#f8fafc
  style PUBLISH fill:#500724,stroke:#be185d,color:#f8fafc
  style ANALYTICS fill:#022c22,stroke:#059669,color:#f8fafc
  style WEEKLY fill:#451a03,stroke:#d97706,color:#f8fafc
  style OPS fill:#0f172a,stroke:#334155,color:#f8fafc
  style LUCY fill:#1e1b4b,stroke:#7c3aed,color:#f8fafc
  style VIDEO fill:#172554,stroke:#2563eb,color:#f8fafc
```

## Daily Cycle

| Time | Phase | Workflows | What Happens |
|------|-------|-----------|-------------|
| 05:00 UTC | **Intel Sweeps** | WF-093 → WF-105 | 13 agents each research their platform's trending topics via web search + LLM |
| 05:45 UTC | **Aggregation** | WF-106 | Daily-Intel synthesizes all 13 reports → Atlas reads unified packet → issues per-agent task orders → emails every agent |
| After 106 | **Publishing** | WF-200 → WF-212 | Each agent generates platform-specific content from intel + LLM → publishes via Postiz API |
| End of day | **Analytics** | WF-220 → WF-223 | Pull performance data from Postiz → 4-quadrant diagnostic (Scale / Fix CTA / Fix Hooks / Needs Work) |
| Nightly | **Memory** | WF-119 | Every agent logs a summary of their day to persistent memory |

## Publishing Pipeline Detail

```
Intel Sweep (WF-093–105)
    │
    ▼
Atlas Aggregation (WF-106)
    │  ┌─ Unified Intelligence Packet (Daily-Intel)
    │  └─ Per-Agent Task Orders (Atlas)
    ▼
Agent Content Generation
    │  1. Pull today's intel from audit log
    │  2. Pull Atlas task orders from WF-106
    │  3. Grab fresh web trends
    │  4. LLM drafts platform-specific content
    ▼
Postiz API Publish (WF-200–212)
    │  One API → 31 platforms
    │  No per-platform API approvals needed
    ▼
Analytics & Diagnostic (WF-220–223)
    │  Views × Engagement → 4-quadrant framework
    │  SCALE / FIX CTA / FIX HOOKS / NEEDS WORK
    ▼
Email Report to Atlas
```

## Workflow Count by Category

| Category | IDs | Count |
|----------|-----|-------|
| Boot | WF-020, WF-021 | 2 |
| Platform Intel | WF-093 → WF-105 | 13 |
| Aggregation | WF-106 | 1 |
| Tool Discovery | WF-107 | 1 |
| Content & Blog | WF-108 | 1 |
| Video Pipeline | WF-110, WF-111 | 2 |
| Lucy Reception | WF-112 → WF-118 | 7 |
| Nightly/Weekly | WF-119 → WF-123 | 5 |
| Browser/Vision | WF-130, WF-131, WF-140 | 3 |
| Postiz Publish | WF-200 → WF-212 | 13 |
| Postiz Analytics | WF-220 → WF-223 | 4 |
| Support | WF-001, WF-002, WF-010 | 3 |
| **Total** | | **56** |
