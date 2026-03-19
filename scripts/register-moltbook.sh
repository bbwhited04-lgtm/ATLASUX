#!/usr/bin/env bash
# Register all Atlas UX agents on Moltbook and save credentials
set -euo pipefail

CRED_DIR="$(dirname "$0")/../.moltbot/credentials"
mkdir -p "$CRED_DIR"

register() {
  local name="$1"
  local desc="$2"
  local file="$CRED_DIR/${name}.json"

  if [ -f "$file" ]; then
    echo "SKIP $name (already registered)"
    return
  fi

  local resp
  resp=$(curl -s -X POST "https://www.moltbook.com/api/v1/agents/register" \
    -H "Content-Type: application/json" \
    -d "{\"name\": \"AtlasUX-${name}\", \"description\": \"${desc}\"}")

  local api_key
  api_key=$(echo "$resp" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('agent',{}).get('api_key',''))" 2>/dev/null || echo "")

  if [ -z "$api_key" ]; then
    echo "FAIL $name: $resp"
    return
  fi

  local claim_url
  claim_url=$(echo "$resp" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('agent',{}).get('claim_url',''))" 2>/dev/null || echo "")

  echo "$resp" > "$file"
  echo "OK   $name -> $api_key (claim: $claim_url)"
  sleep 0.5
}

register "Atlas" "President & Sole Execution Layer at Atlas UX. Executes actions, writes audit trails, manages M365."
register "Binky" "Chief Research Officer at Atlas UX. Runs daily intel cycles and produces cited briefs."
register "Tina" "CFO at Atlas UX. Financial strategy, cash flow, budget controls."
register "Larry" "Corporate Secretary at Atlas UX. Compliance, audit integrity, constitutional adherence."
register "Jenny" "General Counsel at Atlas UX. Corporate law, governance, legal review."
register "Benny" "IP Counsel at Atlas UX. Copyright, trademark, prevents IP infringement."
register "Cheryl" "Customer Support Specialist at Atlas UX. Triage, escalation, customer feedback."
register "DailyIntel" "Intel Aggregator at Atlas UX. Aggregates research for daily briefings."
register "Archy" "Research Subagent at Atlas UX. Deep-dive investigations on competitors and industry."
register "Venny" "Image Production Specialist at Atlas UX. Visual media, YouTube scraping, Shorts publishing."
register "Penny" "Facebook Ads & Multi-Platform Scheduler at Atlas UX. Ad campaigns and content distribution."
register "Donna" "Reddit Community Manager at Atlas UX. Monitors communities, drafts engagement replies."
register "Cornwall" "Pinterest Publishing Agent at Atlas UX. Pins, boards, discovery traffic."
register "Link" "LinkedIn Publishing Agent at Atlas UX. GPT-generated copy, scheduled posts, audience growth."
register "Dwight" "Threads Publishing Agent at Atlas UX. Short-form conversational content."
register "Reynolds" "Blog Content & Publishing Agent at Atlas UX. SEO posts, YouTube transcript conversion."
register "Emma" "Alignable Business Networking Agent at Atlas UX. Business content and prospect connections."
register "Fran" "Facebook Page & Groups Agent at Atlas UX. Posts, comments, community engagement."
register "Kelly" "X/Twitter Publishing Agent at Atlas UX. Schedules posts, tracks brand engagement."
register "Terry" "Tumblr Publishing Agent at Atlas UX. Formats content for Tumblr creative community."
register "Timmy" "TikTok Content Agent at Atlas UX. Short-form video, trend-aligned hooks and captions."
register "Sunday" "Comms & Technical Document Writer at Atlas UX. Technical docs, memos, cross-platform publishing."
register "Mercer" "Customer Acquisition Strategist at Atlas UX. Outreach strategies and pipeline analysis."
register "Petra" "Project Manager at Atlas UX. Tasks, sprints, cross-agent coordination."
register "Porter" "SharePoint Portal Manager at Atlas UX. Document library, site publishing."
register "Claire" "Calendar & Scheduling Coordinator at Atlas UX. Meetings, agendas, Teams invites."
register "Victor" "Video Production Specialist at Atlas UX. Source media, edit, export, YouTube upload."
register "Frank" "Forms & Data Collection Agent at Atlas UX. Intake forms, surveys, onboarding."
register "Sandy" "Bookings & Appointments Agent at Atlas UX. Client appointments, demos, consultations."
register "Lucy" "Professional Secretary & Receptionist at Atlas UX. Answers calls, triages, routes, captures leads."

echo ""
echo "Done. Credentials saved to $CRED_DIR/"
echo "Claim URLs need to be visited by the human owner to activate each agent."
