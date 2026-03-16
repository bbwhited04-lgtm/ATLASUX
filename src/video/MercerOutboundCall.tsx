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
const ORANGE = "#f97316";
const AMBER = "#f59e0b";

const SCENE = {
  intro:     { from: 0, dur: 3 * FPS },
  dialing:   { from: 3 * FPS, dur: 2.5 * FPS },
  greeting:  { from: 5.5 * FPS, dur: 4 * FPS },
  prospect1: { from: 9.5 * FPS, dur: 3 * FPS },
  mercer1:   { from: 12.5 * FPS, dur: 4 * FPS },
  prospect2: { from: 16.5 * FPS, dur: 2.5 * FPS },
  mercer2:   { from: 19 * FPS, dur: 3.5 * FPS },
  booked:    { from: 22.5 * FPS, dur: 3 * FPS },
  cta:       { from: 25.5 * FPS, dur: 3 * FPS },
};
const TOTAL = 28.5 * FPS;

const Waveform: React.FC<{ frame: number; color?: string; active?: boolean }> = ({ frame, color = ORANGE, active = true }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 3, height: 40 }}>
    {Array.from({ length: 24 }).map((_, i) => (
      <div key={i} style={{
        width: 3,
        height: active ? 8 + 28 * Math.abs(Math.sin(frame * 0.15 + i * 0.7)) : 4,
        borderRadius: 2,
        backgroundColor: color,
        opacity: active ? 0.6 + 0.4 * Math.abs(Math.sin(frame * 0.1 + i)) : 0.2,
      }} />
    ))}
  </div>
);

const ChatBubble: React.FC<{ text: string; speaker: "mercer" | "prospect"; frame: number; enterFrame: number }> = ({ text, speaker, frame, enterFrame }) => {
  const progress = spring({ frame: frame - enterFrame, fps: FPS, config: { damping: 15 } });
  const isMercer = speaker === "mercer";
  const charsToShow = Math.min(text.length, Math.floor((frame - enterFrame) * 0.8));

  return (
    <div style={{
      display: "flex",
      justifyContent: isMercer ? "flex-start" : "flex-end",
      opacity: progress,
      transform: `translateY(${interpolate(progress, [0, 1], [30, 0])}px)`,
      marginBottom: 16,
    }}>
      <div style={{
        maxWidth: "75%",
        padding: "16px 24px",
        borderRadius: isMercer ? "4px 20px 20px 20px" : "20px 4px 20px 20px",
        backgroundColor: isMercer ? DARK_CARD : `${ORANGE}22`,
        border: `1px solid ${isMercer ? ORANGE : AMBER}44`,
        color: WHITE,
        fontSize: 22,
        lineHeight: 1.5,
        fontFamily: "'Inter', system-ui, sans-serif",
      }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: isMercer ? ORANGE : AMBER, marginBottom: 6, textTransform: "uppercase", letterSpacing: 1.5 }}>
          {isMercer ? "Mercer — AI Sales Rep" : "Prospect — Dana (Salon Owner)"}
        </div>
        {text.slice(0, charsToShow)}
        {charsToShow < text.length && <span style={{ opacity: frame % 15 < 8 ? 1 : 0, color: GRAY }}>|</span>}
      </div>
    </div>
  );
};

const DialingAnimation: React.FC<{ frame: number }> = ({ frame }) => {
  const dots = Math.floor((frame / 8) % 4);
  const pulseScale = 1 + 0.15 * Math.sin(frame * 0.3);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
      {[1, 2, 3].map((i) => (
        <div key={i} style={{
          position: "absolute",
          width: 100 + i * 50,
          height: 100 + i * 50,
          borderRadius: "50%",
          border: `2px solid ${ORANGE}`,
          opacity: 0.15 / i,
          transform: `scale(${pulseScale * (1 + i * 0.1)})`,
        }} />
      ))}
      <svg width={56} height={56} viewBox="0 0 24 24" fill="none">
        <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" stroke={ORANGE} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div style={{ color: ORANGE, fontSize: 28, fontWeight: 700, fontFamily: "'Inter', system-ui, sans-serif" }}>
        Dialing Dana's Salon{".".repeat(dots)}
      </div>
      <div style={{ color: GRAY, fontSize: 18, fontFamily: "'Inter', system-ui, sans-serif" }}>
        (573) 555-0198 — Outbound Prospect Call
      </div>
    </div>
  );
};

const LeadCard: React.FC<{ frame: number; enterFrame: number }> = ({ frame, enterFrame }) => {
  const progress = spring({ frame: frame - enterFrame, fps: FPS, config: { damping: 12 } });
  return (
    <div style={{
      opacity: progress,
      transform: `scale(${interpolate(progress, [0, 1], [0.8, 1])})`,
      backgroundColor: DARK_CARD,
      border: `2px solid ${ORANGE}`,
      borderRadius: 20,
      padding: 32,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 12,
      boxShadow: `0 0 60px ${ORANGE}33`,
    }}>
      <svg width={48} height={48} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke={EMERALD} strokeWidth={2} />
        <path d="M8 12l2.5 2.5L16 9" stroke={EMERALD} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div style={{ color: EMERALD, fontSize: 26, fontWeight: 700, fontFamily: "'Inter', system-ui, sans-serif" }}>Demo Booked!</div>
      <div style={{ color: WHITE, fontSize: 20, fontFamily: "'Inter', system-ui, sans-serif", textAlign: "center", lineHeight: 1.6 }}>
        Dana's Salon — Free Lucy Demo Call<br />
        <span style={{ color: CYAN }}>Thursday at 2:00 PM</span>
      </div>
      <div style={{ color: GRAY, fontSize: 16, fontFamily: "'Inter', system-ui, sans-serif" }}>Lead moved to CRM → Pipeline: Demo Scheduled</div>
    </div>
  );
};

const IntroScreen: React.FC<{ frame: number }> = ({ frame }) => {
  const progress = spring({ frame, fps: FPS, config: { damping: 12 } });
  return (
    <div style={{ opacity: progress, display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
      <div style={{
        width: 80, height: 80, borderRadius: 20,
        background: `linear-gradient(135deg, ${ORANGE}, ${AMBER})`,
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "#000", fontWeight: 900, fontSize: 36, fontFamily: "'Inter', system-ui, sans-serif",
      }}>M</div>
      <div style={{ color: WHITE, fontSize: 44, fontWeight: 800, fontFamily: "'Inter', system-ui, sans-serif" }}>Meet Mercer</div>
      <div style={{ color: ORANGE, fontSize: 24, fontFamily: "'Inter', system-ui, sans-serif" }}>AI-Powered Outbound Sales Rep</div>
      <div style={{ color: GRAY, fontSize: 18, fontFamily: "'Inter', system-ui, sans-serif", textAlign: "center", maxWidth: 600, lineHeight: 1.6 }}>
        Mercer calls your prospects, qualifies leads, handles objections,<br />and books demos — all on autopilot.
      </div>
    </div>
  );
};

const CTAScreen: React.FC<{ frame: number; enterFrame: number }> = ({ frame, enterFrame }) => {
  const progress = spring({ frame: frame - enterFrame, fps: FPS, config: { damping: 12 } });
  const pulse = 1 + 0.03 * Math.sin((frame - enterFrame) * 0.2);
  const stats = [
    { label: "Calls/Day", value: "200+" },
    { label: "Lead Qualify", value: "Auto" },
    { label: "Demo Books", value: "24/7" },
    { label: "Add-On", value: "$49/mo" },
  ];
  return (
    <div style={{ opacity: progress, display: "flex", flexDirection: "column", alignItems: "center", gap: 32 }}>
      <div style={{ color: WHITE, fontSize: 44, fontWeight: 800, fontFamily: "'Inter', system-ui, sans-serif", textAlign: "center" }}>
        Your AI Sales Team, Always Dialing
      </div>
      <div style={{ display: "flex", gap: 32 }}>
        {stats.map((s) => (
          <div key={s.label} style={{ textAlign: "center" }}>
            <div style={{ color: ORANGE, fontSize: 36, fontWeight: 800, fontFamily: "'Inter', system-ui, sans-serif" }}>{s.value}</div>
            <div style={{ color: GRAY, fontSize: 16, fontFamily: "'Inter', system-ui, sans-serif" }}>{s.label}</div>
          </div>
        ))}
      </div>
      <div style={{
        transform: `scale(${pulse})`, padding: "20px 48px",
        backgroundColor: ORANGE, borderRadius: 16, color: "#000",
        fontSize: 28, fontWeight: 800, fontFamily: "'Inter', system-ui, sans-serif",
        boxShadow: `0 0 40px ${ORANGE}55`,
      }}>
        Add Mercer to Your Team
      </div>
      <div style={{ color: GRAY, fontSize: 18, fontFamily: "'Inter', system-ui, sans-serif" }}>Bundle with Lucy — $149/mo total</div>
    </div>
  );
};

export const MercerOutboundCall: React.FC = () => {
  const frame = useCurrentFrame();
  const gradientAngle = 135 + frame * 0.1;

  return (
    <AbsoluteFill style={{
      background: `linear-gradient(${gradientAngle}deg, ${BG} 0%, #0f172a 50%, #0a1628 100%)`,
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      <div style={{ position: "absolute", top: 32, left: 40, display: "flex", alignItems: "center", gap: 12, opacity: 0.8 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg, ${CYAN}, ${EMERALD})`, display: "flex", alignItems: "center", justifyContent: "center", color: "#000", fontWeight: 900, fontSize: 18 }}>A</div>
        <span style={{ color: WHITE, fontSize: 20, fontWeight: 700 }}>Atlas UX</span>
      </div>
      <div style={{ position: "absolute", top: 32, right: 40, color: GRAY, fontSize: 16 }}>Live Demo</div>

      <Sequence from={SCENE.intro.from} durationInFrames={SCENE.intro.dur}>
        <AbsoluteFill style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
          <IntroScreen frame={frame} />
        </AbsoluteFill>
      </Sequence>

      <Sequence from={SCENE.dialing.from} durationInFrames={SCENE.dialing.dur}>
        <AbsoluteFill style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
          <DialingAnimation frame={frame - SCENE.dialing.from} />
        </AbsoluteFill>
      </Sequence>

      <Sequence from={SCENE.greeting.from} durationInFrames={SCENE.cta.from - SCENE.greeting.from}>
        <AbsoluteFill style={{ display: "flex", flexDirection: "column", padding: "80px 60px 40px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: ORANGE, boxShadow: `0 0 12px ${ORANGE}` }} />
              <span style={{ color: ORANGE, fontSize: 18, fontWeight: 600 }}>Mercer Calling — Dana's Salon</span>
            </div>
            <Waveform frame={frame} color={ORANGE} active />
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 8 }}>
            {frame >= SCENE.greeting.from && (
              <ChatBubble speaker="mercer" text="Hey Dana, this is Mercer calling from Atlas UX. I'm an AI assistant — I may jot down a few notes so nothing gets missed. Got a quick sec?" frame={frame} enterFrame={SCENE.greeting.from} />
            )}
            {frame >= SCENE.prospect1.from && (
              <ChatBubble speaker="prospect" text="Uh, sure? What's this about?" frame={frame} enterFrame={SCENE.prospect1.from} />
            )}
            {frame >= SCENE.mercer1.from && (
              <ChatBubble speaker="mercer" text="I noticed your salon gets a lot of calls. What happens when you're with a client and the phone rings? Do you have someone to answer?" frame={frame} enterFrame={SCENE.mercer1.from} />
            )}
            {frame >= SCENE.prospect2.from && (
              <ChatBubble speaker="prospect" text="Honestly? It goes to voicemail. I probably miss 10 calls a week." frame={frame} enterFrame={SCENE.prospect2.from} />
            )}
            {frame >= SCENE.mercer2.from && (
              <ChatBubble speaker="mercer" text="That's exactly why I'm calling! Lucy is an AI receptionist that answers every call, books appointments, and never puts anyone on hold. Can I set up a quick demo for Thursday?" frame={frame} enterFrame={SCENE.mercer2.from} />
            )}
            {frame >= SCENE.booked.from && frame < SCENE.cta.from && (
              <div style={{ display: "flex", justifyContent: "center", margin: "16px 0" }}>
                <LeadCard frame={frame} enterFrame={SCENE.booked.from} />
              </div>
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

export default MercerOutboundCall;
