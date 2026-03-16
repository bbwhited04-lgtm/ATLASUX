import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Sequence,
  Audio,
} from "remotion";

/* ── Timing (30 fps, ~28 s total) ─────────────────────────────────────────── */
const FPS = 30;

const SCENE = {
  // Phone ringing
  ring:       { from: 0,   dur: 3 * FPS },
  // Lucy picks up
  pickup:     { from: 3 * FPS, dur: 1.5 * FPS },
  // Lucy greeting
  greeting:   { from: 4.5 * FPS, dur: 4.5 * FPS },
  // Caller speaks
  caller1:    { from: 9 * FPS, dur: 3 * FPS },
  // Lucy responds — checks calendar
  lucy1:      { from: 12 * FPS, dur: 4 * FPS },
  // Calendar animation
  calendar:   { from: 13 * FPS, dur: 3 * FPS },
  // Lucy confirms booking
  lucy2:      { from: 16 * FPS, dur: 4 * FPS },
  // Confirmation animation
  confirm:    { from: 20 * FPS, dur: 2.5 * FPS },
  // Lucy farewell
  farewell:   { from: 22.5 * FPS, dur: 3 * FPS },
  // Stats / CTA
  cta:        { from: 25.5 * FPS, dur: 3 * FPS },
};

const TOTAL_DURATION = 28.5 * FPS; // ~855 frames

/* ── Colors ────────────────────────────────────────────────────────────────── */
const BG = "#0a0f1a";
const CYAN = "#06b6d4";
const EMERALD = "#10b981";
const WHITE = "#f8fafc";
const GRAY = "#94a3b8";
const DARK_CARD = "#111827";
const RING_RED = "#ef4444";

/* ── Reusable Components ───────────────────────────────────────────────────── */

const PhoneIcon: React.FC<{ color?: string; size?: number }> = ({
  color = WHITE,
  size = 48,
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const CalendarIcon: React.FC<{ color?: string; size?: number }> = ({
  color = EMERALD,
  size = 32,
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth={2} />
    <line x1="16" y1="2" x2="16" y2="6" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <line x1="8" y1="2" x2="8" y2="6" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <line x1="3" y1="10" x2="21" y2="10" stroke={color} strokeWidth={2} />
  </svg>
);

const CheckIcon: React.FC<{ color?: string; size?: number }> = ({
  color = EMERALD,
  size = 48,
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" stroke={color} strokeWidth={2} />
    <path d="M8 12l2.5 2.5L16 9" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/* ── Waveform animation ────────────────────────────────────────────────────── */
const Waveform: React.FC<{ frame: number; color?: string; active?: boolean }> = ({
  frame,
  color = CYAN,
  active = true,
}) => {
  const bars = 24;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 3, height: 40 }}>
      {Array.from({ length: bars }).map((_, i) => {
        const height = active
          ? 8 + 28 * Math.abs(Math.sin((frame * 0.15 + i * 0.7)))
          : 4;
        return (
          <div
            key={i}
            style={{
              width: 3,
              height,
              borderRadius: 2,
              backgroundColor: color,
              opacity: active ? 0.6 + 0.4 * Math.abs(Math.sin(frame * 0.1 + i)) : 0.2,
              transition: "height 0.1s",
            }}
          />
        );
      })}
    </div>
  );
};

/* ── Chat Bubble ───────────────────────────────────────────────────────────── */
const ChatBubble: React.FC<{
  text: string;
  speaker: "lucy" | "caller";
  frame: number;
  enterFrame: number;
}> = ({ text, speaker, frame, enterFrame }) => {
  const progress = spring({ frame: frame - enterFrame, fps: FPS, config: { damping: 15 } });
  const isLucy = speaker === "lucy";

  // Typewriter effect
  const charsToShow = Math.min(
    text.length,
    Math.floor((frame - enterFrame) * 0.8),
  );
  const displayText = text.slice(0, charsToShow);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: isLucy ? "flex-start" : "flex-end",
        opacity: progress,
        transform: `translateY(${interpolate(progress, [0, 1], [30, 0])}px)`,
        marginBottom: 16,
      }}
    >
      <div
        style={{
          maxWidth: "75%",
          padding: "16px 24px",
          borderRadius: isLucy ? "4px 20px 20px 20px" : "20px 4px 20px 20px",
          backgroundColor: isLucy ? DARK_CARD : `${CYAN}22`,
          border: `1px solid ${isLucy ? EMERALD : CYAN}44`,
          color: WHITE,
          fontSize: 22,
          lineHeight: 1.5,
          fontFamily: "'Inter', system-ui, sans-serif",
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: isLucy ? EMERALD : CYAN,
            marginBottom: 6,
            textTransform: "uppercase",
            letterSpacing: 1.5,
          }}
        >
          {isLucy ? "Lucy — AI Receptionist" : "Caller"}
        </div>
        {displayText}
        {charsToShow < text.length && (
          <span style={{ opacity: frame % 15 < 8 ? 1 : 0, color: GRAY }}>|</span>
        )}
      </div>
    </div>
  );
};

/* ── Ringing Animation ─────────────────────────────────────────────────────── */
const RingingPhone: React.FC<{ frame: number }> = ({ frame }) => {
  const shake = Math.sin(frame * 1.2) * 6;
  const ringScale = 1 + 0.3 * Math.abs(Math.sin(frame * 0.3));
  const pulseOpacity = 0.15 + 0.15 * Math.sin(frame * 0.3);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
      {/* Pulse rings */}
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            width: 120 + i * 60,
            height: 120 + i * 60,
            borderRadius: "50%",
            border: `2px solid ${RING_RED}`,
            opacity: pulseOpacity / i,
            transform: `scale(${ringScale * (1 + i * 0.1)})`,
          }}
        />
      ))}
      <div style={{ transform: `rotate(${shake}deg)` }}>
        <PhoneIcon color={RING_RED} size={64} />
      </div>
      <div style={{ color: RING_RED, fontSize: 28, fontWeight: 700, fontFamily: "'Inter', system-ui, sans-serif" }}>
        Incoming Call...
      </div>
      <div style={{ color: GRAY, fontSize: 20, fontFamily: "'Inter', system-ui, sans-serif" }}>
        (573) 555-0142 — Mike's Plumbing
      </div>
    </div>
  );
};

/* ── Calendar Slot Picker Animation ────────────────────────────────────────── */
const CalendarSlots: React.FC<{ frame: number; enterFrame: number }> = ({ frame, enterFrame }) => {
  const progress = spring({ frame: frame - enterFrame, fps: FPS, config: { damping: 12 } });
  const slots = ["9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "2:00 PM", "2:30 PM", "3:00 PM"];
  const selectedIdx = 4; // 11:00 AM
  const selectFrame = enterFrame + 1.5 * FPS;
  const isSelected = frame > selectFrame;

  return (
    <div
      style={{
        opacity: progress,
        transform: `scale(${interpolate(progress, [0, 1], [0.9, 1])})`,
        backgroundColor: DARK_CARD,
        border: `1px solid ${EMERALD}44`,
        borderRadius: 16,
        padding: 24,
        width: 500,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <CalendarIcon />
        <span style={{ color: WHITE, fontSize: 20, fontWeight: 600, fontFamily: "'Inter', system-ui, sans-serif" }}>
          Tomorrow — Available Slots
        </span>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        {slots.map((slot, i) => {
          const isThis = i === selectedIdx;
          const highlighted = isSelected && isThis;
          return (
            <div
              key={slot}
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                fontSize: 16,
                fontWeight: 600,
                fontFamily: "'Inter', system-ui, sans-serif",
                backgroundColor: highlighted ? EMERALD : `${CYAN}15`,
                color: highlighted ? "#000" : GRAY,
                border: `1px solid ${highlighted ? EMERALD : `${CYAN}33`}`,
                transform: highlighted ? "scale(1.1)" : "scale(1)",
                transition: "all 0.3s",
              }}
            >
              {slot}
              {highlighted && " ✓"}
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ── Confirmation Card ─────────────────────────────────────────────────────── */
const ConfirmationCard: React.FC<{ frame: number; enterFrame: number }> = ({ frame, enterFrame }) => {
  const progress = spring({ frame: frame - enterFrame, fps: FPS, config: { damping: 12, stiffness: 80 } });

  return (
    <div
      style={{
        opacity: progress,
        transform: `scale(${interpolate(progress, [0, 1], [0.8, 1])})`,
        backgroundColor: DARK_CARD,
        border: `2px solid ${EMERALD}`,
        borderRadius: 20,
        padding: 32,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 16,
        boxShadow: `0 0 60px ${EMERALD}33`,
      }}
    >
      <CheckIcon size={56} />
      <div style={{ color: EMERALD, fontSize: 26, fontWeight: 700, fontFamily: "'Inter', system-ui, sans-serif" }}>
        Appointment Booked!
      </div>
      <div style={{ color: WHITE, fontSize: 20, fontFamily: "'Inter', system-ui, sans-serif", textAlign: "center", lineHeight: 1.6 }}>
        Mike's Plumbing — Emergency Pipe Repair<br />
        <span style={{ color: CYAN }}>Tomorrow at 11:00 AM</span>
      </div>
      <div style={{ color: GRAY, fontSize: 16, fontFamily: "'Inter', system-ui, sans-serif" }}>
        Confirmation SMS sent to (573) 555-0142
      </div>
    </div>
  );
};

/* ── CTA Screen ────────────────────────────────────────────────────────────── */
const CTAScreen: React.FC<{ frame: number; enterFrame: number }> = ({ frame, enterFrame }) => {
  const progress = spring({ frame: frame - enterFrame, fps: FPS, config: { damping: 12 } });
  const pulse = 1 + 0.03 * Math.sin((frame - enterFrame) * 0.2);

  const stats = [
    { label: "Calls Answered", value: "24/7" },
    { label: "Avg Response", value: "<1s" },
    { label: "Bookings Made", value: "100%" },
    { label: "Cost", value: "$99/mo" },
  ];

  return (
    <div
      style={{
        opacity: progress,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 32,
      }}
    >
      <div style={{ color: WHITE, fontSize: 44, fontWeight: 800, fontFamily: "'Inter', system-ui, sans-serif", textAlign: "center" }}>
        Never Miss Another Call
      </div>
      <div style={{ display: "flex", gap: 32 }}>
        {stats.map((s) => (
          <div key={s.label} style={{ textAlign: "center" }}>
            <div style={{ color: EMERALD, fontSize: 36, fontWeight: 800, fontFamily: "'Inter', system-ui, sans-serif" }}>
              {s.value}
            </div>
            <div style={{ color: GRAY, fontSize: 16, fontFamily: "'Inter', system-ui, sans-serif" }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>
      <div
        style={{
          transform: `scale(${pulse})`,
          padding: "20px 48px",
          backgroundColor: EMERALD,
          borderRadius: 16,
          color: "#000",
          fontSize: 28,
          fontWeight: 800,
          fontFamily: "'Inter', system-ui, sans-serif",
          boxShadow: `0 0 40px ${EMERALD}55`,
        }}
      >
        Call Lucy Now — (573) 742-2028
      </div>
      <div style={{ color: GRAY, fontSize: 18, fontFamily: "'Inter', system-ui, sans-serif" }}>
        Try free for 14 days — No card required
      </div>
    </div>
  );
};

/* ── Main Composition ──────────────────────────────────────────────────────── */
export const LucyInboundCall: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Background gradient animation
  const gradientAngle = 135 + frame * 0.1;

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(${gradientAngle}deg, ${BG} 0%, #0f172a 50%, #0a1628 100%)`,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      {/* Atlas UX badge — always visible */}
      <div
        style={{
          position: "absolute",
          top: 32,
          left: 40,
          display: "flex",
          alignItems: "center",
          gap: 12,
          opacity: 0.8,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: `linear-gradient(135deg, ${CYAN}, ${EMERALD})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#000",
            fontWeight: 900,
            fontSize: 18,
          }}
        >
          A
        </div>
        <span style={{ color: WHITE, fontSize: 20, fontWeight: 700 }}>Atlas UX</span>
      </div>

      {/* Timestamp */}
      <div
        style={{
          position: "absolute",
          top: 32,
          right: 40,
          color: GRAY,
          fontSize: 16,
        }}
      >
        Live Demo
      </div>

      {/* ── Scene 1: Phone Ringing ──────────────────────────────── */}
      <Sequence from={SCENE.ring.from} durationInFrames={SCENE.ring.dur}>
        <AbsoluteFill style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
          <RingingPhone frame={frame} />
        </AbsoluteFill>
      </Sequence>

      {/* ── Scene 2: Lucy picks up + conversation ──────────────── */}
      <Sequence from={SCENE.pickup.from} durationInFrames={TOTAL_DURATION - SCENE.pickup.from}>
        <AbsoluteFill
          style={{
            display: "flex",
            flexDirection: "column",
            padding: "80px 60px 40px",
          }}
        >
          {/* Active call header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 32,
              opacity: spring({ frame: frame - SCENE.pickup.from, fps, config: { damping: 15 } }),
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  backgroundColor: EMERALD,
                  boxShadow: `0 0 12px ${EMERALD}`,
                }}
              />
              <span style={{ color: EMERALD, fontSize: 18, fontWeight: 600 }}>
                Lucy Answering — Mike's Plumbing
              </span>
            </div>
            <Waveform frame={frame} color={CYAN} active={frame < SCENE.cta.from} />
          </div>

          {/* Chat area */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 8 }}>
            {/* Lucy greeting */}
            {frame >= SCENE.greeting.from && (
              <ChatBubble
                speaker="lucy"
                text="Hi there! This is Lucy at Mike's Plumbing, and I may jot down a few notes so nothing gets missed. How can I help you today?"
                frame={frame}
                enterFrame={SCENE.greeting.from}
              />
            )}

            {/* Caller speaks */}
            {frame >= SCENE.caller1.from && (
              <ChatBubble
                speaker="caller"
                text="Yeah, I've got a burst pipe in my basement. I need someone out here as soon as possible!"
                frame={frame}
                enterFrame={SCENE.caller1.from}
              />
            )}

            {/* Lucy responds */}
            {frame >= SCENE.lucy1.from && (
              <ChatBubble
                speaker="lucy"
                text="I'm so sorry to hear that! Let me check our earliest available time for you right now..."
                frame={frame}
                enterFrame={SCENE.lucy1.from}
              />
            )}

            {/* Calendar animation */}
            {frame >= SCENE.calendar.from && frame < SCENE.confirm.from && (
              <div style={{ display: "flex", justifyContent: "center", margin: "16px 0" }}>
                <CalendarSlots frame={frame} enterFrame={SCENE.calendar.from} />
              </div>
            )}

            {/* Lucy confirms */}
            {frame >= SCENE.lucy2.from && (
              <ChatBubble
                speaker="lucy"
                text="Great news! I've booked you for tomorrow at 11:00 AM. You'll get a confirmation text shortly. Is there anything else I can help with?"
                frame={frame}
                enterFrame={SCENE.lucy2.from}
              />
            )}

            {/* Confirmation card */}
            {frame >= SCENE.confirm.from && frame < SCENE.cta.from && (
              <div style={{ display: "flex", justifyContent: "center", margin: "16px 0" }}>
                <ConfirmationCard frame={frame} enterFrame={SCENE.confirm.from} />
              </div>
            )}
          </div>
        </AbsoluteFill>
      </Sequence>

      {/* ── Scene 3: CTA / Stats ───────────────────────────────── */}
      <Sequence from={SCENE.cta.from} durationInFrames={SCENE.cta.dur}>
        <AbsoluteFill
          style={{
            background: `linear-gradient(135deg, ${BG} 0%, #0f172a 50%, #0a1628 100%)`,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 10,
          }}
        >
          <CTAScreen frame={frame} enterFrame={SCENE.cta.from} />
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
};

export default LucyInboundCall;
