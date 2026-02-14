import { HelpSection, ChatHelp } from "./HelpSection";

export function HelpPage() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold text-slate-100">Help</h1>

      <HelpSection
        title="Neptune Help & FAQ"
        description="Common questions and quick answers for using Atlas UX."
        faqs={ChatHelp}
        quickTips={[
          "If a button does nothing, check DevTools Console for errors.",
          "If a page is blank, verify the route exists in routes.ts.",
          "For integrations, OAuth popups may be blocked—allow popups.",
        ]}
      />
    </div>
  );
}
