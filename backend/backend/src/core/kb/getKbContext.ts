type GetKbContextInput = {
  tenantId: string;
  agentName: string;
  query?: string;
  charBudget?: number; // default 60k
};

type KbContextBlock = {
  slug: string;
  title: string;
  content: string;
  source: "governance" | "agent" | "relevant";
};