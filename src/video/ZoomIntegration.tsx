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
const ZOOM_BLUE = "#2d8cff";

const SCENE = {
  intro:     { from: 0, dur: 3 * FPS },
  joining:   { from: 3 * FPS, dur: 2.5 * FPS },
  meeting:   { from: 5.5 * FPS, dur: 4 * FPS },
  notes:     { from: 9.5 * FPS, dur: 4 * FPS },
  actions:   { from: 13.5 * FPS, dur: 4 * FPS },
  summary:   { from: 17.5 * FPS, dur: 4 * FPS },
  cta:       { from: 21.5 * FPS, dur: 3.5 * FPS },
};
const TOTAL = 25 * FPS;

const ZoomFrame: React.FC<{ frame: number; enterFrame: number }> = ({ frame, enterFrame }) => {
  const progress = spring({ frame: frame - enterFrame, fps: FPS, config: { damping: 12 } });
  const speakerWave = Math.sin((frame - enterFrame) * 0.2);
  const participants = [
    { name: "Billy W.", initials: "BW", color: CYAN, speaking: false },
    { name: "Dana (Prospect)", initials: "D", color: "#f97316", speaking: speakerWave > 0.3 },
    { name: "Lucy — AI Notes", initials: "L", color: EMERALD, speaking: false },
  ];

  return (
    <div style={{
      opacity: progress,
      width: "90%", maxWidth: 900,
      backgroundColor: "#1a1a2e",
      borderRadius: 16, overflow: "hidden",
      border: `1px solid ${GRAY}33`,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 20px", backgroundColor: "#111" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#ef4444" }} />
          <span style={{ color: WHITE, fontSize: 14, fontWeight: 600, fontFamily: "'Inter', system-ui, sans-serif" }}>Atlas UX Demo — Dana's Salon</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: EMERALD, boxShadow: `0 0 6px ${EMERALD}` }} />
          <span style={{ color: EMERALD, fontSize: 12, fontFamily: "'Inter', system-ui, sans-serif" }}>Recording</span>
        </div>
      </div>
      <div style={{ display: "flex", gap: 12, padding: 16, justifyContent: "center" }}>
        {participants.map((p) => (
          <div key={p.name} style={{
            width: 260, height: 180, borderRadius: 12,
            backgroundColor: "#0d0d1a",
            border: p.speaking ? `2px solid ${EMERALD}` : `1px solid ${GRAY}33`,
            boxShadow: p.speaking ? `0 0 20px ${EMERALD}44` : "none",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8,
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: "50%",
              background: `linear-gradient(135deg, ${p.color}, ${p.color}88)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#000", fontWeight: 800, fontSize: 22,
              fontFamily: "'Inter', system-ui, sans-serif",
            }}>{p.initials}</div>
            <span style={{ color: WHITE, fontSize: 14, fontWeight: 600, fontFamily: "'Inter', system-ui, sans-serif" }}>{p.name}</span>
            {p.speaking && (
              <div style={{ display: "flex", gap: 2, height: 16 }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} style={{
                    width: 3, borderRadius: 2, backgroundColor: EMERALD,
                    height: 4 + 12 * Math.abs(Math.sin((frame - enterFrame) * 0.2 + i * 0.8)),
                  }} />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const LiveNotes: React.FC<{ frame: number; enterFrame: number }> = ({ frame, enterFrame }) => {
  const progress = spring({ frame: frame - enterFrame, fps: FPS, config: { damping: 12 } });
  const notes = [
    { time: "0:42", text: "Dana runs a 4-chair salon, open 6 days/week" },
    { time: "1:15", text: "Misses ~10 calls/week, mostly during appointments" },
    { time: "1:58", text: "Currently uses voicemail — loses ~$800/mo in missed bookings" },
    { time: "2:34", text: "Interested in Lucy's auto-booking for haircuts + color services" },
  ];

  return (
    <div style={{
      opacity: progress,
      position: "absolute", right: 40, top: 100, width: 380,
      backgroundColor: DARK_CARD, borderRadius: 12,
      border: `1px solid ${EMERALD}44`, padding: 20,
      boxShadow: `0 0 30px ${EMERALD}22`,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: EMERALD, boxShadow: `0 0 6px ${EMERALD}` }} />
        <span style={{ color: EMERALD, fontSize: 14, fontWeight: 700, fontFamily: "'Inter', system-ui, sans-serif" }}>Lucy — Live Notes</span>
      </div>
      {notes.map((n, i) => {
        const noteProgress = spring({ frame: frame - enterFrame - i * 20, fps: FPS, config: { damping: 15 } });
        return (
          <div key={n.time} style={{
            opacity: noteProgress,
            transform: `translateY(${interpolate(noteProgress, [0, 1], [10, 0])}px)`,
            display: "flex", gap: 10, marginBottom: 10,
            padding: "6px 0", borderBottom: `1px solid ${GRAY}15`,
          }}>
            <span style={{ color: GRAY, fontSize: 12, fontFamily: "monospace", flexShrink: 0, marginTop: 2 }}>{n.time}</span>
            <span style={{ color: WHITE, fontSize: 14, lineHeight: 1.4, fontFamily: "'Inter', system-ui, sans-serif" }}>{n.text}</span>
          </div>
        );
      })}
    </div>
  );
};

const ActionItems: React.FC<{ frame: number; enterFrame: number }> = ({ frame, enterFrame }) => {
  const progress = spring({ frame: frame - enterFrame, fps: FPS, config: { damping: 12 } });
  const items = [
    { text: "Send Dana pricing comparison (Lucy vs human service)", owner: "Binky", done: true },
    { text: "Set up Dana's salon in Lucy with service menu", owner: "Atlas", done: false },
    { text: "Schedule follow-up call in 3 days", owner: "Mercer", done: false },
  ];
  return (
    <div style={{
      opacity: progress,
      position: "absolute", right: 40, top: 100, width: 380,
      backgroundColor: DARK_CARD, borderRadius: 12,
      border: `1px solid ${ZOOM_BLUE}44`, padding: 20,
    }}>
      <div style={{ color: ZOOM_BLUE, fontSize: 14, fontWeight: 700, marginBottom: 16, fontFamily: "'Inter', system-ui, sans-serif" }}>
        Action Items (Auto-Generated)
      </div>
      {items.map((item, i) => {
        const itemProgress = spring({ frame: frame - enterFrame - i * 15, fps: FPS, config: { damping: 15 } });
        return (
          <div key={item.text} style={{
            opacity: itemProgress, display: "flex", gap: 10,
            marginBottom: 12, padding: "8px 0",
            borderBottom: `1px solid ${GRAY}15`,
          }}>
            <div style={{
              width: 20, height: 20, borderRadius: 4, flexShrink: 0, marginTop: 2,
              border: `2px solid ${item.done ? EMERALD : GRAY}44`,
              backgroundColor: item.done ? `${EMERALD}33` : "transparent",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {item.done && <span style={{ color: EMERALD, fontSize: 12 }}>✓</span>}
            </div>
            <div>
              <div style={{ color: WHITE, fontSize: 14, lineHeight: 1.4, fontFamily: "'Inter', system-ui, sans-serif" }}>{item.text}</div>
              <div style={{ color: GRAY, fontSize: 11, marginTop: 2, fontFamily: "'Inter', system-ui, sans-serif" }}>→ {item.owner}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const SummaryCard: React.FC<{ frame: number; enterFrame: number }> = ({ frame, enterFrame }) => {
  const progress = spring({ frame: frame - enterFrame, fps: FPS, config: { damping: 12, stiffness: 80 } });
  return (
    <div style={{
      opacity: progress,
      transform: `scale(${interpolate(progress, [0, 1], [0.85, 1])})`,
      backgroundColor: DARK_CARD, borderRadius: 20,
      border: `2px solid ${EMERALD}`, padding: 32,
      display: "flex", flexDirection: "column", alignItems: "center", gap: 16,
      boxShadow: `0 0 60px ${EMERALD}33`, maxWidth: 500,
    }}>
      <svg width={48} height={48} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke={EMERALD} strokeWidth={2} />
        <path d="M8 12l2.5 2.5L16 9" stroke={EMERALD} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div style={{ color: EMERALD, fontSize: 24, fontWeight: 700, fontFamily: "'Inter', system-ui, sans-serif" }}>Meeting Summary Sent</div>
      <div style={{ color: WHITE, fontSize: 17, textAlign: "center", lineHeight: 1.6, fontFamily: "'Inter', system-ui, sans-serif" }}>
        Notes, action items, and follow-up tasks<br />automatically posted to #sales-pipeline
      </div>
      <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
        {[{ label: "Duration", value: "12 min" }, { label: "Notes", value: "4 items" }, { label: "Actions", value: "3 tasks" }].map((s) => (
          <div key={s.label} style={{ textAlign: "center" }}>
            <div style={{ color: CYAN, fontSize: 22, fontWeight: 800, fontFamily: "'Inter', system-ui, sans-serif" }}>{s.value}</div>
            <div style={{ color: GRAY, fontSize: 12, fontFamily: "'Inter', system-ui, sans-serif" }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

const IntroScreen: React.FC<{ frame: number }> = ({ frame }) => {
  const progress = spring({ frame, fps: FPS, config: { damping: 12 } });
  return (
    <div style={{ opacity: progress, display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
      <div style={{ width: 72, height: 72, borderRadius: 16, backgroundColor: ZOOM_BLUE, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width={40} height={40} viewBox="0 0 24 24" fill="none">
          <rect x="2" y="6" width="13" height="12" rx="2" fill={WHITE} />
          <path d="M17 9l5-3v12l-5-3V9z" fill={WHITE} />
        </svg>
      </div>
      <div style={{ color: WHITE, fontSize: 44, fontWeight: 800, fontFamily: "'Inter', system-ui, sans-serif" }}>Zoom Integration</div>
      <div style={{ color: ZOOM_BLUE, fontSize: 24, fontFamily: "'Inter', system-ui, sans-serif" }}>AI note-taker that actually takes action</div>
      <div style={{ color: GRAY, fontSize: 18, fontFamily: "'Inter', system-ui, sans-serif", textAlign: "center", maxWidth: 600, lineHeight: 1.6 }}>
        Lucy joins your Zoom calls, takes notes in real-time,<br />extracts action items, and assigns follow-ups automatically.
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
        Never Forget a Follow-Up Again
      </div>
      <div style={{ color: GRAY, fontSize: 22, fontFamily: "'Inter', system-ui, sans-serif", textAlign: "center", maxWidth: 600, lineHeight: 1.6 }}>
        AI-powered meeting notes, action items,<br />and CRM updates — fully automated.
      </div>
      <div style={{
        transform: `scale(${pulse})`, padding: "20px 48px",
        backgroundColor: EMERALD, borderRadius: 16, color: "#000",
        fontSize: 28, fontWeight: 800, fontFamily: "'Inter', system-ui, sans-serif",
        boxShadow: `0 0 40px ${EMERALD}55`,
      }}>
        Try Atlas UX Free — 14 Days
      </div>
    </div>
  );
};

export const ZoomIntegration: React.FC = () => {
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
        <AbsoluteFill style={{ display: "flex", justifyContent: "center", alignItems: "center" }}><IntroScreen frame={frame} /></AbsoluteFill>
      </Sequence>

      <Sequence from={SCENE.joining.from} durationInFrames={SCENE.joining.dur}>
        <AbsoluteFill style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
          <div style={{ color: ZOOM_BLUE, fontSize: 28, fontWeight: 700, opacity: spring({ frame: frame - SCENE.joining.from, fps: FPS, config: { damping: 12 } }) }}>
            Lucy is joining the meeting...
          </div>
        </AbsoluteFill>
      </Sequence>

      <Sequence from={SCENE.meeting.from} durationInFrames={SCENE.cta.from - SCENE.meeting.from}>
        <AbsoluteFill style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 80 }}>
          <ZoomFrame frame={frame} enterFrame={SCENE.meeting.from} />
          {frame >= SCENE.notes.from && frame < SCENE.actions.from && <LiveNotes frame={frame} enterFrame={SCENE.notes.from} />}
          {frame >= SCENE.actions.from && frame < SCENE.summary.from && <ActionItems frame={frame} enterFrame={SCENE.actions.from} />}
          {frame >= SCENE.summary.from && (
            <div style={{ position: "absolute", bottom: 60, display: "flex", justifyContent: "center", width: "100%" }}>
              <SummaryCard frame={frame} enterFrame={SCENE.summary.from} />
            </div>
          )}
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

export default ZoomIntegration;
