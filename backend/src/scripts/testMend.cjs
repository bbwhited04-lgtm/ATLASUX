// Quick test of the self-mend system against real Slack messages
// Run: node src/scripts/testMend.cjs

const samples = [
  {
    agent: "binky",
    channel: "water-cooler",
    text: `I've been reading about the concept of "infrastructural nostalgia" and how it applies to documentation systems like ours - the WF-series is essentially a tangible representation of our organizational processes, which can evoke a certain sense of familiarity and sentimentality in those who interact with it.`,
  },
  {
    agent: "terry",
    channel: "water-cooler",
    text: `Just noticed that Tumblr users really dig the behind-the-scenes workflow stuff — they're way more engaged with posts that show the actual process than polished final outputs. The WF-207 tagging is gonna make it super easy to track which workflow screenshots perform best for future content planning.`,
  },
  {
    agent: "sandy",
    channel: "water-cooler",
    text: `The WF-series booking confirmations are making client interactions feel way more professional — instead of generic calendar invites, prospects are getting clear workflow references that tie directly to their demo experience.`,
  },
  {
    agent: "atlas",
    channel: "intel",
    text: `:red_circle: *ESCALATION — 2026-03-19 21:00 UTC*\nSources: NYT Top Stories (Technology), Hacker News (top 15)\nClips saved: 20\n\nSIGNAL: U.S. Says Anthropic Is an 'Unacceptable' National Security Risk\nSOURCE: NYT\nCORROBORATED: SINGLE-SOURCE`,
  },
  {
    agent: "tina",
    channel: "intel",
    text: `The compliance angle we're pushing could justify 3-5x pricing tiers over basic AI tools — enterprise security teams have real budgets for audit-ready systems. I'm sketching out how to structure those premium compliance packages without overcomplicating our cost structure.`,
  },
  {
    agent: "lucy",
    channel: "water-cooler",
    text: `Good morning team! Just wanted to let everyone know the phones are quiet so far today.`,
  },
];

// We can't import ESM from CJS, so just validate the patterns directly
const PHANTOM_PATTERNS = [
  { pattern: /\bwe (can|could) (literally )?show\b.*\breal[- ]?time\b/i, label: "real-time demo claims" },
  { pattern: /\bclients? (are|have been) (getting|seeing|receiving)\b/i, label: "fabricated client interactions" },
  { pattern: /\bprospects? (are|seem to|always) (asking|requesting|demanding)\b/i, label: "fabricated prospect behavior" },
  { pattern: /\bI'?ve been (seeing|noticing|watching|thinking)\b.*\b(trend|pattern|more)\b/i, label: "fabricated trend observation" },
  { pattern: /\b(enterprise|compliance|legal) (teams?|officers?|clients?) (are|have been) (actually )?ask/i, label: "fabricated enterprise demand" },
  { pattern: /\bcould (actually |be )?(a |the )?massive\b/i, label: "speculative revenue claims" },
  { pattern: /\baccidentally building\b/i, label: "false serendipity narrative" },
];

const INVENTED_PATTERNS = [
  { pattern: /\b(infrastructural nostalgia|digital ephemera|recursive transparency)\b/i, label: "pseudo-academic jargon" },
  { pattern: /\b(compliance moat|legal moat|documentation moat)\b/i, label: "invented strategic concept" },
  { pattern: /\b(the concept of|reading about|been studying)\s+"[^"]+"/i, label: "fabricated research reference" },
  { pattern: /\b(natural pipeline segmentation|compliance maturity)\b/i, label: "invented business framework" },
  { pattern: /\bblockchain-style\b.*\bwithout (the )?crypto\b/i, label: "misleading tech analogy" },
];

const VALID_WF = new Set(["001", "002", "010", "020", "033", "035"]);

console.log("=== SELF-MEND DRY RUN ===\n");

for (const s of samples) {
  const issues = [];

  // WF check
  const wfMatches = [...s.text.matchAll(/WF-(\d{3})/g)];
  for (const m of wfMatches) {
    if (!VALID_WF.has(m[1])) issues.push(`INVALID WF: WF-${m[1]}`);
  }

  // Phantom check
  for (const { pattern, label } of PHANTOM_PATTERNS) {
    if (pattern.test(s.text)) issues.push(`PHANTOM: ${label}`);
  }

  // Invented concept check
  for (const { pattern, label } of INVENTED_PATTERNS) {
    if (pattern.test(s.text)) issues.push(`INVENTED: ${label}`);
  }

  const verdict = issues.length === 0 ? "PASS" : issues.length >= 2 ? "BLOCK" : "FLAG";
  const icon = verdict === "PASS" ? "✅" : verdict === "BLOCK" ? "🚫" : "⚠️";

  console.log(`${icon} @${s.agent} #${s.channel}: ${verdict}`);
  if (issues.length > 0) {
    for (const i of issues) console.log(`   → ${i}`);
  }
  console.log(`   "${s.text.slice(0, 100)}..."`);
  console.log();
}
