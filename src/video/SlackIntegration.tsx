import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Sequence,
} from "remotion";

const FPS = 30;
const BG = "#0a0f1a";
const CYAN = "#06b6d4";
const EMERALD = "#10b981";
const WHITE = "#f8fafc";
const GRAY = "#94a3b8";
const DARK_CARD = "#111827";
const PURPLE = "#7c3aed";
const SLACK_GREEN = "#2eb67d";
const SLACK_YELLOW = "#ecb22e";
const SLACK_RED = "#e01e5a";
const SLACK_BLUE = "#36c5f0";

const SCENE = {
  intro:    { from: 0, dur: 3 * FPS },
  channel:  { from: 3 * FPS, dur: 3 * FPS },
  msg1:     { from: 6 * FPS, dur: 3 * FPS },
  msg2:     { from: 9 * FPS, dur: 3 * FPS },
  msg3:     { from: 12 * FPS, dur: 3 * FPS },
  thread:   { from: 15 * FPS, dur: 4 * FPS },
  actions:  { from: 19 * FPS, dur: 3.5 * FPS },
  cta:      { from: 22.5 * FPS, dur: 3.5 * FPS },
};
const TOTAL = 26 * FPS;

const SlackLogo: React.FC<{ size?: number }> = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M14.5 2a1.5 1.5 0 100 3H16v1.5a1.5 1.5 0 103 0v-3a1.5 1.5 0 00-1.5-1.5h-3z" fill={SLACK_GREEN} />
    <path d="M2 14.5a1.5 1.5 0 013 0V16h1.5a1.5 1.5 0 110 3h-3A1.5 1.5 0 012 17.5v-3z" fill={SLACK_BLUE} />
    <path d="M9.5 22a1.5 1.5 0 100-3H8v-1.5a1.5 1.5 0 10-3 0v3A1.5 1.5 0 006.5 22h3z" fill={SLACK_RED} />
    <path d="M22 9.5a1.5 1.5 0 01-3 0V8h-1.5a1.5 1.5 0 110-3h3A1.5 1.5 0 0122 6.5v3z" fill={SLACK_YELLOW} />
    <path d="M14.5 8H16V6.5a1.5 1.5 0 10-1.5 1.5zM8 9.5A1.5 1.5 0 009.5 8H8V9.5z" fill={SLACK_GREEN} />
    <rect x="8" y="8" width="8" height="8" rx="1" fill="#611f69" opacity={0.3} />
  </svg>
);

const SlackMessage: React.FC<{
  agent: string; agentColor: string; text: string; time: string;
  frame: number; enterFrame: number; hasActions?: boolean;
}> = ({ agent, agentColor, text, time, frame, enterFrame, hasActions }) => {
  const progress = spring({ frame: frame - enterFrame, fps: FPS, config: { damping: 15 } });
  const charsToShow = Math.min(text.length, Math.floor((frame - enterFrame) * 1.2));

  return (
    <div style={{
      opacity: progress,
      transform: `translateX(${interpolate(progress, [0, 1], [-40, 0])}px)`,
      display: "flex", gap: 16, padding: "12px 20px",
      backgroundColor: `${DARK_CARD}cc`,
      borderRadius: 8, marginBottom: 8,
      borderLeft: `3px solid ${agentColor}`,
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 8,
        background: `linear-gradient(135deg, ${agentColor}, ${agentColor}88)`,
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "#000", fontWeight: 900, fontSize: 18, flexShrink: 0,
        fontFamily: "'Inter', system-ui, sans-serif",
      }}>
        {agent[0].toUpperCase()}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <span style={{ color: agentColor, fontWeight: 700, fontSize: 16, fontFamily: "'Inter', system-ui, sans-serif" }}>{agent}</span>
          <span style={{ color: GRAY, fontSize: 12, fontFamily: "'Inter', system-ui, sans-serif" }}>{time}</span>
        </div>
        <div style={{ color: WHITE, fontSize: 17, lineHeight: 1.5, fontFamily: "'Inter', system-ui, sans-serif" }}>
          {text.slice(0, charsToShow)}
          {charsToShow < text.length && <span style={{ opacity: frame % 15 < 8 ? 1 : 0, color: GRAY }}>|</span>}
        </div>
        {hasActions && frame > enterFrame + 2 * FPS && (
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            {["Approve", "Defer", "Details"].map((btn, i) => (
              <div key={btn} style={{
                padding: "4px 14px", borderRadius: 6, fontSize: 13, fontWeight: 600,
                backgroundColor: i === 0 ? EMERALD : "transparent",
                color: i === 0 ? "#000" : GRAY,
                border: i === 0 ? "none" : `1px solid ${GRAY}44`,
                fontFamily: "'Inter', system-ui, sans-serif",
              }}>{btn}</div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const IntroScreen: React.FC<{ frame: number }> = ({ frame }) => {
  const progress = spring({ frame, fps: FPS, config: { damping: 12 } });
  return (
    <div style={{ opacity: progress, display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
      <SlackLogo size={72} />
      <div style={{ color: WHITE, fontSize: 44, fontWeight: 800, fontFamily: "'Inter', system-ui, sans-serif" }}>Slack Integration</div>
      <div style={{ color: PURPLE, fontSize: 24, fontFamily: "'Inter', system-ui, sans-serif" }}>Your AI team reports where you already work</div>
      <div style={{ color: GRAY, fontSize: 18, fontFamily: "'Inter', system-ui, sans-serif", textAlign: "center", maxWidth: 600, lineHeight: 1.6 }}>
        Every agent posts updates, requests approvals,<br />and takes action — right in your Slack channels.
      </div>
    </div>
  );
};

const ChannelHeader: React.FC<{ frame: number; enterFrame: number }> = ({ frame, enterFrame }) => {
  const progress = spring({ frame: frame - enterFrame, fps: FPS, config: { damping: 12 } });
  return (
    <div style={{
      opacity: progress, padding: "16px 24px",
      borderBottom: `1px solid ${GRAY}22`,
      display: "flex", alignItems: "center", gap: 12,
    }}>
      <span style={{ color: GRAY, fontSize: 20 }}>#</span>
      <span style={{ color: WHITE, fontSize: 20, fontWeight: 700, fontFamily: "'Inter', system-ui, sans-serif" }}>atlas-operations</span>
      <span style={{ color: GRAY, fontSize: 14, fontFamily: "'Inter', system-ui, sans-serif" }}>6 agents active</span>
    </div>
  );
};

const ActionPanel: React.FC<{ frame: number; enterFrame: number }> = ({ frame, enterFrame }) => {
  const progress = spring({ frame: frame - enterFrame, fps: FPS, config: { damping: 12 } });
  const items = [
    { icon: "📞", label: "12 calls answered today", color: EMERALD },
    { icon: "📅", label: "4 appointments booked", color: CYAN },
    { icon: "📧", label: "8 follow-up emails sent", color: PURPLE },
    { icon: "💰", label: "$2,400 pipeline generated", color: SLACK_YELLOW },
  ];
  return (
    <div style={{
      opacity: progress, backgroundColor: DARK_CARD,
      border: `1px solid ${PURPLE}44`, borderRadius: 12,
      padding: 20, margin: "8px 20px",
    }}>
      <div style={{ color: WHITE, fontSize: 16, fontWeight: 700, marginBottom: 12, fontFamily: "'Inter', system-ui, sans-serif" }}>
        Today's Agent Activity
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
        {items.map((item, i) => {
          const itemProgress = spring({ frame: frame - enterFrame - i * 8, fps: FPS, config: { damping: 15 } });
          return (
            <div key={item.label} style={{
              opacity: itemProgress, display: "flex", alignItems: "center", gap: 8,
              padding: "8px 14px", borderRadius: 8,
              backgroundColor: `${item.color}15`, border: `1px solid ${item.color}33`,
            }}>
              <span style={{ fontSize: 18 }}>{item.icon}</span>
              <span style={{ color: item.color, fontSize: 14, fontWeight: 600, fontFamily: "'Inter', system-ui, sans-serif" }}>{item.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const CTAScreen: React.FC<{ frame: number; enterFrame: number }> = ({ frame, enterFrame }) => {
  const progress = spring({ frame: frame - enterFrame, fps: FPS, config: { damping: 12 } });
  const pulse = 1 + 0.03 * Math.sin((frame - enterFrame) * 0.2);
  return (
    <div style={{ opacity: progress, display: "flex", flexDirection: "column", alignItems: "center", gap: 32 }}>
      <div style={{ color: WHITE, fontSize: 44, fontWeight: 800, fontFamily: "'Inter', system-ui, sans-serif", textAlign: "center" }}>
        Your AI Team, In Your Slack
      </div>
      <div style={{ color: GRAY, fontSize: 22, fontFamily: "'Inter', system-ui, sans-serif", textAlign: "center", maxWidth: 600, lineHeight: 1.6 }}>
        Real-time reports, one-click approvals, full visibility —<br />without leaving the tools you already use.
      </div>
      <div style={{
        transform: `scale(${pulse})`, padding: "20px 48px",
        backgroundColor: EMERALD, borderRadius: 16, color: "#000",
        fontSize: 28, fontWeight: 800, fontFamily: "'Inter', system-ui, sans-serif",
        boxShadow: `0 0 40px ${EMERALD}55`,
      }}>
        Try Atlas UX Free — 14 Days
      </div>
      <div style={{ color: GRAY, fontSize: 18, fontFamily: "'Inter', system-ui, sans-serif" }}>Installs in under 2 minutes</div>
    </div>
  );
};

export const SlackIntegration: React.FC = () => {
  const frame = useCurrentFrame();
  const gradientAngle = 135 + frame * 0.1;

  return (
    <AbsoluteFill style={{
      background: `linear-gradient(${gradientAngle}deg, ${BG} 0%, #0f172a 50%, #0a1628 100%)`,
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      <div style={{ position: "absolute", top: 32, left: 40, display: "flex", alignItems: "center", gap: 12, opacity: 0.8, zIndex: 5 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg, ${CYAN}, ${EMERALD})`, display: "flex", alignItems: "center", justifyContent: "center", color: "#000", fontWeight: 900, fontSize: 18 }}>A</div>
        <span style={{ color: WHITE, fontSize: 20, fontWeight: 700 }}>Atlas UX</span>
      </div>

      <Sequence from={SCENE.intro.from} durationInFrames={SCENE.intro.dur}>
        <AbsoluteFill style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
          <IntroScreen frame={frame} />
        </AbsoluteFill>
      </Sequence>

      <Sequence from={SCENE.channel.from} durationInFrames={SCENE.cta.from - SCENE.channel.from}>
        <AbsoluteFill style={{ display: "flex", flexDirection: "column", paddingTop: 80 }}>
          <ChannelHeader frame={frame} enterFrame={SCENE.channel.from} />
          <div style={{ flex: 1, padding: "16px 20px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
            {frame >= SCENE.msg1.from && (
              <SlackMessage agent="Lucy" agentColor={EMERALD} text="📞 New call from (573) 555-0142 — Mike's Plumbing. Emergency pipe repair. Booked for tomorrow 11:00 AM. SMS confirmation sent." time="9:14 AM" frame={frame} enterFrame={SCENE.msg1.from} />
            )}
            {frame >= SCENE.msg2.from && (
              <SlackMessage agent="Mercer" agentColor={SLACK_YELLOW} text="🎯 Outbound call to Dana's Salon — interested in Lucy demo. Booked Thursday 2:00 PM. Pipeline: $99/mo potential." time="9:32 AM" frame={frame} enterFrame={SCENE.msg2.from} />
            )}
            {frame >= SCENE.msg3.from && (
              <SlackMessage agent="Binky" agentColor={CYAN} text="📊 Morning Brief: 3 new leads, 2 appointments booked, $297 pipeline. Top opportunity: Dana's Salon (demo Thursday)." time="9:45 AM" frame={frame} enterFrame={SCENE.msg3.from} />
            )}
            {frame >= SCENE.thread.from && (
              <SlackMessage agent="Atlas" agentColor={PURPLE} text="⚡ Decision Required: Mercer wants to run a cold-call campaign targeting 50 HVAC businesses this week. Estimated cost: $12. Approve?" time="10:01 AM" frame={frame} enterFrame={SCENE.thread.from} hasActions />
            )}
            {frame >= SCENE.actions.from && (
              <ActionPanel frame={frame} enterFrame={SCENE.actions.from} />
            )}
          </div>
        </AbsoluteFill>
      </Sequence>

      <Sequence from={SCENE.cta.from} durationInFrames={SCENE.cta.dur}>
        <AbsoluteFill style={{ background: `linear-gradient(135deg, ${BG} 0%, #0f172a 50%, #0a1628 100%)`, display: "flex", justifyContent: "center", alignItems: "center", zIndex: 10 }}>
          <CTAScreen frame={frame} enterFrame={SCENE.cta.from} />
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
};

export default SlackIntegration;
