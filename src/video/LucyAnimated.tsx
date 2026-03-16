import React, { useMemo, useEffect } from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Sequence,
  Easing,
  staticFile,
} from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

const FPS = 30;
const BG = "#0a0f1a";
const CYAN = "#06b6d4";
const EMERALD = "#10b981";
const WHITE = "#f8fafc";
const GRAY = "#94a3b8";
const DARK_CARD = "#111827";
const RING_RED = "#ef4444";
const SLACK_PURPLE = "#4A154B";
const SMS_BLUE = "#3b82f6";
const EMAIL_AMBER = "#f59e0b";

/* ── Scene Timing ──────────────────────────────────────────────────────────── */
const SCENE = {
  intro:     { from: 0,          dur: 3.5 * FPS },
  answer:    { from: 3.5 * FPS,  dur: 2 * FPS },
  convo:     { from: 5.5 * FPS,  dur: 6 * FPS },
  dashboard: { from: 11.5 * FPS, dur: 4.5 * FPS },
  sms:       { from: 16 * FPS,   dur: 3 * FPS },
  slack:     { from: 19 * FPS,   dur: 3.5 * FPS },
  email:     { from: 22.5 * FPS, dur: 4 * FPS },
  cta:       { from: 26.5 * FPS, dur: 3.5 * FPS },
};
const TOTAL = 30 * FPS;

/* ── 3D Atlas Model for Remotion ──────────────────────────────────────────── */
const MODEL_PATH = staticFile("models/atlas-avatar.glb");

function AtlasAvatar3D({
  speaking = false,
  rotationY = 0,
  positionY = 0,
  scale: overrideScale,
}: {
  speaking?: boolean;
  rotationY?: number;
  positionY?: number;
  scale?: number;
}) {
  const { scene } = useGLTF(MODEL_PATH);
  const frame = useCurrentFrame();

  // Set material properties
  useEffect(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (mesh.material) {
          const mat = mesh.material as THREE.MeshStandardMaterial;
          mat.metalness = 0.7;
          mat.roughness = 0.25;
          mat.emissive = new THREE.Color(CYAN);
          mat.emissiveIntensity = 0.05;
        }
      }
    });
  }, [scene]);

  // Compute bounds for proper scaling
  const { modelScale, offset } = useMemo(() => {
    const box = new THREE.Box3().setFromObject(scene);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const s = (overrideScale ?? 2.2) / maxDim;
    return { modelScale: s, offset: [-center.x * s, -center.y * s, -center.z * s] as const };
  }, [scene, overrideScale]);

  // Breathing animation driven by frame
  const breathBob = Math.sin(frame * 0.06) * 0.04;
  // Speaking vibration
  const speakVibX = speaking ? Math.sin(frame * 0.8) * 0.02 : 0;

  return (
    <group
      rotation={[speakVibX, rotationY, 0]}
      position={[0, positionY + breathBob, 0]}
    >
      <primitive
        object={scene}
        scale={modelScale}
        position={[offset[0], offset[1], offset[2]]}
      />
      {/* Core glow light */}
      <pointLight
        position={[0, 0, 0.5]}
        distance={4}
        decay={2}
        color={speaking ? EMERALD : CYAN}
        intensity={speaking ? 3 + Math.sin(frame * 0.5) * 1.5 : 2 + Math.sin(frame * 0.12) * 0.6}
      />
    </group>
  );
}

/* ── 3D Scene Wrapper ─────────────────────────────────────────────────────── */
const Atlas3DScene: React.FC<{
  speaking?: boolean;
  cameraZ?: number;
  cameraY?: number;
  rotationY?: number;
  modelScale?: number;
  width: number;
  height: number;
}> = ({ speaking = false, cameraZ = 3.5, cameraY = 0, rotationY, modelScale, width, height }) => {
  const frame = useCurrentFrame();
  const defaultRotY = Math.sin(frame * 0.025) * 0.25;

  return (
    <ThreeCanvas
      width={width}
      height={height}
      camera={{ position: [0, cameraY, cameraZ], fov: 40 }}
      style={{ background: "transparent" }}
    >
      <ambientLight intensity={0.5} />
      <directionalLight position={[3, 4, 5]} intensity={1.4} color="#e0f2fe" />
      <directionalLight position={[-2, -1, 3]} intensity={0.5} color="#0ea5e9" />
      <directionalLight position={[0, -3, 2]} intensity={0.3} color={CYAN} />
      <AtlasAvatar3D
        speaking={speaking}
        rotationY={rotationY ?? defaultRotY}
        scale={modelScale}
      />
    </ThreeCanvas>
  );
};

/* ── Speech Bubble ─────────────────────────────────────────────────────────── */
const SpeechBubble: React.FC<{
  text: string; color: string; label: string;
  frame: number; enterFrame: number; side: "left" | "right";
}> = ({ text, color, label, frame, enterFrame, side }) => {
  const progress = spring({ frame: frame - enterFrame, fps: FPS, config: { damping: 15 } });
  const chars = Math.min(text.length, Math.floor((frame - enterFrame) * 1.2));

  return (
    <div style={{
      opacity: progress,
      transform: `translateY(${interpolate(progress, [0, 1], [20, 0])}px) scale(${interpolate(progress, [0, 1], [0.95, 1])})`,
      maxWidth: 440,
      padding: "14px 22px",
      borderRadius: side === "left" ? "4px 18px 18px 18px" : "18px 4px 18px 18px",
      backgroundColor: `${color}12`,
      border: `1.5px solid ${color}55`,
      alignSelf: side === "left" ? "flex-start" : "flex-end",
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 4, fontFamily: "'Inter', system-ui, sans-serif" }}>
        {label}
      </div>
      <div style={{ color: WHITE, fontSize: 19, lineHeight: 1.5, fontFamily: "'Inter', system-ui, sans-serif" }}>
        {text.slice(0, chars)}
        {chars < text.length && <span style={{ opacity: frame % 15 < 8 ? 1 : 0, color: GRAY }}>|</span>}
      </div>
    </div>
  );
};

/* ── Waveform ──────────────────────────────────────────────────────────────── */
const Waveform: React.FC<{ frame: number; color?: string; width?: number }> = ({ frame, color = CYAN, width: w = 200 }) => {
  const bars = Math.floor(w / 8);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 2, height: 32 }}>
      {Array.from({ length: bars }).map((_, i) => {
        const h = 6 + 22 * Math.abs(Math.sin(frame * 0.15 + i * 0.7));
        return (
          <div key={i} style={{
            width: 3, height: h, borderRadius: 2, backgroundColor: color,
            opacity: 0.5 + 0.5 * Math.abs(Math.sin(frame * 0.1 + i)),
          }} />
        );
      })}
    </div>
  );
};

/* ── Booking Dashboard ─────────────────────────────────────────────────────── */
const BookingDashboard: React.FC<{ frame: number; enterFrame: number }> = ({ frame, enterFrame }) => {
  const progress = spring({ frame: frame - enterFrame, fps: FPS, config: { damping: 12, stiffness: 80 } });
  const slots = [
    { time: "7:00 AM", taken: true },
    { time: "7:30 AM", taken: true },
    { time: "8:00 AM", taken: false },
    { time: "8:30 AM", taken: false },
    { time: "9:00 AM", taken: false },
    { time: "9:30 AM", taken: true },
    { time: "10:00 AM", taken: false },
    { time: "10:30 AM", taken: true },
  ];
  const clickFrame = enterFrame + 2 * FPS;
  const selectedIdx = 2;
  const isClicked = frame >= clickFrame;
  const confirmFrame = enterFrame + 3 * FPS;
  const isConfirmed = frame >= confirmFrame;

  const cursorProgress = interpolate(
    frame - enterFrame, [0.8 * FPS, 2 * FPS], [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.quad) },
  );
  const cursorX = interpolate(cursorProgress, [0, 1], [580, 288]);
  const cursorY = interpolate(cursorProgress, [0, 1], [380, 178]);

  return (
    <div style={{
      opacity: progress,
      transform: `scale(${interpolate(progress, [0, 1], [0.85, 1])}) translateX(${interpolate(progress, [0, 1], [60, 0])}px)`,
      position: "relative",
    }}>
      <div style={{
        width: 580, backgroundColor: DARK_CARD, borderRadius: 16,
        border: `1.5px solid ${CYAN}33`, overflow: "hidden",
        boxShadow: `0 20px 80px ${CYAN}15`,
      }}>
        {/* Title bar */}
        <div style={{
          padding: "14px 20px", borderBottom: `1px solid ${CYAN}22`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: EMERALD }} />
            <span style={{ color: WHITE, fontSize: 16, fontWeight: 700, fontFamily: "'Inter', system-ui, sans-serif" }}>
              Booking Dashboard — Tomorrow
            </span>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {["#ef4444", "#f59e0b", "#10b981"].map((c) => (
              <div key={c} style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: c, opacity: 0.7 }} />
            ))}
          </div>
        </div>
        <div style={{ padding: "12px 20px", borderBottom: `1px solid ${CYAN}15` }}>
          <div style={{ color: GRAY, fontSize: 13, fontFamily: "'Inter', system-ui, sans-serif", marginBottom: 4 }}>EMERGENCY REQUEST</div>
          <div style={{ color: WHITE, fontSize: 17, fontFamily: "'Inter', system-ui, sans-serif" }}>
            Burst Pipe Repair — Mrs. Johnson — (573) 555-0198
          </div>
        </div>
        <div style={{ padding: "16px 20px", display: "flex", flexWrap: "wrap", gap: 10 }}>
          {slots.map((slot, i) => {
            const isSelected = i === selectedIdx && isClicked;
            return (
              <div key={slot.time} style={{
                padding: "10px 20px", borderRadius: 10, fontSize: 15, fontWeight: 600,
                fontFamily: "'Inter', system-ui, sans-serif",
                backgroundColor: isSelected ? EMERALD : slot.taken ? `${RING_RED}15` : `${CYAN}12`,
                color: isSelected ? "#000" : slot.taken ? `${RING_RED}88` : GRAY,
                border: `1px solid ${isSelected ? EMERALD : slot.taken ? `${RING_RED}33` : `${CYAN}22`}`,
                textDecoration: slot.taken ? "line-through" : "none",
                transform: isSelected ? "scale(1.08)" : "scale(1)",
                boxShadow: isSelected ? `0 0 20px ${EMERALD}44` : "none",
              }}>
                {slot.time}{isSelected && " ✓"}
              </div>
            );
          })}
        </div>
        {isConfirmed && (
          <div style={{
            margin: "0 20px 16px", padding: "12px 24px", borderRadius: 10,
            backgroundColor: EMERALD, display: "flex", alignItems: "center",
            justifyContent: "center", gap: 10,
            opacity: spring({ frame: frame - confirmFrame, fps: FPS, config: { damping: 15 } }),
          }}>
            <span style={{ fontSize: 18 }}>✓</span>
            <span style={{ color: "#000", fontSize: 16, fontWeight: 700, fontFamily: "'Inter', system-ui, sans-serif" }}>
              Appointment Confirmed — 8:00 AM Tomorrow
            </span>
          </div>
        )}
      </div>

      {cursorProgress > 0 && !isConfirmed && (
        <div style={{ position: "absolute", left: cursorX, top: cursorY, transform: `scale(${isClicked ? 0.8 : 1})`, zIndex: 10 }}>
          <svg width="24" height="28" viewBox="0 0 24 28">
            <path d="M4 1L4 20L9 16L14 24L18 22L13 14L20 14L4 1Z" fill={WHITE} stroke={DARK_CARD} strokeWidth="1.5" />
          </svg>
        </div>
      )}
    </div>
  );
};

/* ── SMS Phone Animation ───────────────────────────────────────────────────── */
const SMSConfirmation: React.FC<{ frame: number; enterFrame: number }> = ({ frame, enterFrame }) => {
  const progress = spring({ frame: frame - enterFrame, fps: FPS, config: { damping: 12 } });
  const msgProgress = spring({ frame: frame - enterFrame - 0.8 * FPS, fps: FPS, config: { damping: 15 } });
  const checkProgress = spring({ frame: frame - enterFrame - 1.8 * FPS, fps: FPS, config: { damping: 12 } });

  return (
    <div style={{
      opacity: progress, transform: `translateY(${interpolate(progress, [0, 1], [40, 0])}px)`,
      display: "flex", flexDirection: "column", alignItems: "center", gap: 16,
    }}>
      <div style={{ color: SMS_BLUE, fontSize: 14, fontWeight: 700, fontFamily: "'Inter', system-ui, sans-serif", textTransform: "uppercase", letterSpacing: 2 }}>
        SMS Confirmation Sent
      </div>
      <div style={{
        width: 280, height: 480, backgroundColor: "#000", borderRadius: 36,
        border: `3px solid ${GRAY}44`, padding: "40px 16px 30px",
        display: "flex", flexDirection: "column", boxShadow: `0 20px 60px ${SMS_BLUE}20`,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, padding: "0 8px" }}>
          <span style={{ color: WHITE, fontSize: 12, fontWeight: 600, fontFamily: "'Inter', system-ui, sans-serif" }}>9:41</span>
          <div style={{ width: 14, height: 8, borderRadius: 2, border: `1px solid ${WHITE}88` }}>
            <div style={{ width: "80%", height: "100%", backgroundColor: EMERALD, borderRadius: 1 }} />
          </div>
        </div>
        <div style={{ textAlign: "center", padding: "8px 0 16px", borderBottom: `1px solid ${GRAY}33` }}>
          <div style={{ color: WHITE, fontSize: 16, fontWeight: 700, fontFamily: "'Inter', system-ui, sans-serif" }}>Atlas UX</div>
          <div style={{ color: GRAY, fontSize: 12, fontFamily: "'Inter', system-ui, sans-serif" }}>Text Message</div>
        </div>
        <div style={{ flex: 1, padding: "16px 8px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div style={{
            opacity: msgProgress, transform: `scale(${interpolate(msgProgress, [0, 1], [0.9, 1])})`,
            backgroundColor: SMS_BLUE, borderRadius: "18px 18px 4px 18px",
            padding: "14px 18px", maxWidth: "92%", alignSelf: "flex-end",
          }}>
            <div style={{ color: WHITE, fontSize: 13, lineHeight: 1.6, fontFamily: "'Inter', system-ui, sans-serif" }}>
              Hi Mrs. Johnson! Your emergency pipe repair is confirmed for <strong>tomorrow at 8:00 AM</strong> with Mike's Plumbing. Mike will be at 742 Elm Street. Reply HELP for assistance.
            </div>
          </div>
          <div style={{ alignSelf: "flex-end", marginTop: 6, display: "flex", alignItems: "center", gap: 4, opacity: checkProgress }}>
            <span style={{ color: SMS_BLUE, fontSize: 12, fontFamily: "'Inter', system-ui, sans-serif" }}>Delivered</span>
            <span style={{ color: SMS_BLUE, fontSize: 12 }}>✓✓</span>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── Slack Post ────────────────────────────────────────────────────────────── */
const SlackPost: React.FC<{ frame: number; enterFrame: number }> = ({ frame, enterFrame }) => {
  const progress = spring({ frame: frame - enterFrame, fps: FPS, config: { damping: 12 } });
  const msgProgress = spring({ frame: frame - enterFrame - 0.6 * FPS, fps: FPS, config: { damping: 15 } });
  const reactProgress = spring({ frame: frame - enterFrame - 1.8 * FPS, fps: FPS, config: { damping: 15 } });

  return (
    <div style={{ opacity: progress, transform: `translateX(${interpolate(progress, [0, 1], [60, 0])}px)`, width: 540 }}>
      <div style={{
        backgroundColor: "#1a1d21", borderRadius: 14,
        border: `1.5px solid ${GRAY}22`, overflow: "hidden",
        boxShadow: `0 20px 60px ${SLACK_PURPLE}25`,
      }}>
        <div style={{
          padding: "12px 18px", backgroundColor: SLACK_PURPLE,
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <span style={{ color: WHITE, fontSize: 16, fontWeight: 800, fontFamily: "'Inter', system-ui, sans-serif" }}>
            # atlas-operations
          </span>
          <div style={{ flex: 1 }} />
          <div style={{ display: "flex", gap: 4 }}>
            {["#ef4444", "#f59e0b", "#10b981"].map((c) => (
              <div key={c} style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: c, opacity: 0.7 }} />
            ))}
          </div>
        </div>
        <div style={{ padding: "20px 18px", opacity: msgProgress }}>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 8, flexShrink: 0,
              background: `linear-gradient(135deg, ${CYAN}, ${EMERALD})`,
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
            }}>🤖</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 6 }}>
                <span style={{ color: WHITE, fontSize: 15, fontWeight: 700, fontFamily: "'Inter', system-ui, sans-serif" }}>Lucy</span>
                <span style={{ color: GRAY, fontSize: 11, fontFamily: "'Inter', system-ui, sans-serif" }}>9:42 PM</span>
                <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4, backgroundColor: `${EMERALD}22`, color: EMERALD, fontFamily: "'Inter', system-ui, sans-serif" }}>BOT</span>
              </div>
              <div style={{ borderLeft: `3px solid ${EMERALD}`, padding: "10px 14px", backgroundColor: `${EMERALD}08`, borderRadius: "0 8px 8px 0" }}>
                <div style={{ color: EMERALD, fontSize: 14, fontWeight: 700, marginBottom: 6, fontFamily: "'Inter', system-ui, sans-serif" }}>
                  🚨 Emergency Booking Created
                </div>
                <div style={{ color: WHITE, fontSize: 13, lineHeight: 1.7, fontFamily: "'Inter', system-ui, sans-serif" }}>
                  <strong>Customer:</strong> Mrs. Johnson — (573) 555-0198<br />
                  <strong>Issue:</strong> Burst pipe in basement — emergency<br />
                  <strong>Booked:</strong> Tomorrow 8:00 AM<br />
                  <strong>Location:</strong> 742 Elm Street<br />
                  <strong>SMS Confirmation:</strong> ✅ Sent
                </div>
              </div>
              <div style={{
                display: "flex", gap: 6, marginTop: 10, opacity: reactProgress,
                transform: `translateY(${interpolate(reactProgress, [0, 1], [8, 0])}px)`,
              }}>
                {[{ emoji: "🔥", count: 3 }, { emoji: "✅", count: 2 }, { emoji: "⚡", count: 1 }].map((r) => (
                  <div key={r.emoji} style={{
                    padding: "3px 8px", borderRadius: 12, backgroundColor: `${CYAN}15`,
                    border: `1px solid ${CYAN}33`, display: "flex", alignItems: "center", gap: 4,
                    fontSize: 13, color: GRAY, fontFamily: "'Inter', system-ui, sans-serif",
                  }}>{r.emoji} {r.count}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── Email to Plumber ──────────────────────────────────────────────────────── */
const EmailToPlumber: React.FC<{ frame: number; enterFrame: number }> = ({ frame, enterFrame }) => {
  const progress = spring({ frame: frame - enterFrame, fps: FPS, config: { damping: 12 } });
  const bodyProgress = spring({ frame: frame - enterFrame - 0.5 * FPS, fps: FPS, config: { damping: 15 } });
  const sentProgress = spring({ frame: frame - enterFrame - 2.5 * FPS, fps: FPS, config: { damping: 12, stiffness: 80 } });
  const isSent = frame >= enterFrame + 2.5 * FPS;

  return (
    <div style={{ opacity: progress, transform: `translateY(${interpolate(progress, [0, 1], [30, 0])}px)`, display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
      <div style={{ color: EMAIL_AMBER, fontSize: 14, fontWeight: 700, fontFamily: "'Inter', system-ui, sans-serif", textTransform: "uppercase", letterSpacing: 2 }}>
        Email to Plumber
      </div>
      <div style={{ width: 540, backgroundColor: DARK_CARD, borderRadius: 14, border: `1.5px solid ${EMAIL_AMBER}33`, overflow: "hidden", boxShadow: `0 20px 60px ${EMAIL_AMBER}15` }}>
        <div style={{ padding: "14px 20px", borderBottom: `1px solid ${GRAY}22` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: `linear-gradient(135deg, ${CYAN}, ${EMERALD})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🤖</div>
            <div>
              <div style={{ color: WHITE, fontSize: 14, fontWeight: 700, fontFamily: "'Inter', system-ui, sans-serif" }}>Lucy — AI Receptionist</div>
              <div style={{ color: GRAY, fontSize: 11, fontFamily: "'Inter', system-ui, sans-serif" }}>lucy@mikes-plumbing.atlasux.cloud</div>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ display: "flex", gap: 8 }}>
              <span style={{ color: GRAY, fontSize: 12, fontFamily: "'Inter', system-ui, sans-serif", width: 40 }}>To:</span>
              <span style={{ color: WHITE, fontSize: 12, fontFamily: "'Inter', system-ui, sans-serif" }}>mike@mikesplumbing.com</span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <span style={{ color: GRAY, fontSize: 12, fontFamily: "'Inter', system-ui, sans-serif", width: 40 }}>Subj:</span>
              <span style={{ color: EMAIL_AMBER, fontSize: 12, fontWeight: 700, fontFamily: "'Inter', system-ui, sans-serif" }}>
                🚨 EMERGENCY Appointment — 8:00 AM Tomorrow
              </span>
            </div>
          </div>
        </div>
        <div style={{ padding: "18px 20px", opacity: bodyProgress }}>
          <div style={{ color: WHITE, fontSize: 14, lineHeight: 1.8, fontFamily: "'Inter', system-ui, sans-serif" }}>
            Hi Mike,<br /><br />
            You have an <span style={{ color: RING_RED, fontWeight: 700 }}>emergency appointment</span> booked for <span style={{ color: EMERALD, fontWeight: 700 }}>tomorrow at 8:00 AM</span>.<br /><br />
            <strong>Here are the details:</strong><br />
            <span style={{ color: GRAY }}>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</span><br />
            👤 <strong>Customer:</strong> Mrs. Johnson<br />
            📞 <strong>Phone:</strong> (573) 555-0198<br />
            📍 <strong>Location:</strong> 742 Elm Street<br />
            🔧 <strong>Issue:</strong> Burst pipe in basement<br />
            ⚡ <strong>Priority:</strong> <span style={{ color: RING_RED }}>EMERGENCY</span><br />
            <span style={{ color: GRAY }}>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</span><br /><br />
            SMS confirmation sent to customer.<br /><br />— Lucy 🤖
          </div>
        </div>
        {isSent && (
          <div style={{ margin: "0 20px 16px", padding: "10px 0", textAlign: "center", borderTop: `1px solid ${GRAY}22`, opacity: sentProgress, transform: `scale(${interpolate(sentProgress, [0, 1], [0.9, 1])})` }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", backgroundColor: EMERALD, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: "#000", fontWeight: 900 }}>✓</div>
              <span style={{ color: EMERALD, fontSize: 15, fontWeight: 700, fontFamily: "'Inter', system-ui, sans-serif" }}>Email Sent Successfully</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* ── CTA Screen ────────────────────────────────────────────────────────────── */
const CTAOverlay: React.FC<{ frame: number; enterFrame: number }> = ({ frame, enterFrame }) => {
  const progress = spring({ frame: frame - enterFrame, fps: FPS, config: { damping: 12 } });
  const pulse = 1 + 0.03 * Math.sin((frame - enterFrame) * 0.2);
  const stats = [
    { label: "Answered", value: "📞 24/7", color: CYAN },
    { label: "Response", value: "⚡ <1s", color: EMERALD },
    { label: "Booked + Notified", value: "✅ Auto", color: SMS_BLUE },
    { label: "Starting at", value: "💰 $99/mo", color: EMAIL_AMBER },
  ];

  return (
    <div style={{ opacity: progress, display: "flex", flexDirection: "column", alignItems: "center", gap: 24, zIndex: 5 }}>
      <div style={{ color: WHITE, fontSize: 42, fontWeight: 800, fontFamily: "'Inter', system-ui, sans-serif", textAlign: "center" }}>
        Lucy Handles Everything
      </div>
      <div style={{ color: GRAY, fontSize: 18, fontFamily: "'Inter', system-ui, sans-serif", textAlign: "center" }}>
        Answers calls • Books appointments • Sends SMS • Posts to Slack • Emails your team
      </div>
      <div style={{ display: "flex", gap: 28 }}>
        {stats.map((s, i) => {
          const itemP = spring({ frame: frame - enterFrame - i * 5, fps: FPS, config: { damping: 15 } });
          return (
            <div key={s.label} style={{ textAlign: "center", opacity: itemP }}>
              <div style={{ color: s.color, fontSize: 26, fontWeight: 800, fontFamily: "'Inter', system-ui, sans-serif" }}>{s.value}</div>
              <div style={{ color: GRAY, fontSize: 13, fontFamily: "'Inter', system-ui, sans-serif" }}>{s.label}</div>
            </div>
          );
        })}
      </div>
      <div style={{ transform: `scale(${pulse})`, padding: "18px 44px", backgroundColor: EMERALD, borderRadius: 16, color: "#000", fontSize: 26, fontWeight: 800, fontFamily: "'Inter', system-ui, sans-serif", boxShadow: `0 0 40px ${EMERALD}55` }}>
        Call Lucy Now — (573) 742-2028
      </div>
      <div style={{ color: GRAY, fontSize: 16, fontFamily: "'Inter', system-ui, sans-serif" }}>Try free for 14 days — No card required</div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════════════════
   MAIN COMPOSITION
   ══════════════════════════════════════════════════════════════════════════════ */
export const LucyAnimated: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const gradientAngle = 135 + frame * 0.08;

  // Determine if Lucy is speaking based on scene
  const isSpeaking = (
    (frame >= SCENE.answer.from && frame < SCENE.answer.from + SCENE.answer.dur) ||
    (frame >= SCENE.convo.from && frame < SCENE.convo.from + 2.5 * FPS) ||
    (frame >= SCENE.convo.from + 4 * FPS && frame < SCENE.convo.from + SCENE.convo.dur)
  );

  return (
    <AbsoluteFill style={{
      background: `linear-gradient(${gradientAngle}deg, ${BG} 0%, #0f172a 50%, #0a1628 100%)`,
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      {/* Atlas UX badge */}
      <div style={{ position: "absolute", top: 32, left: 40, display: "flex", alignItems: "center", gap: 12, opacity: 0.8, zIndex: 20 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg, ${CYAN}, ${EMERALD})`, display: "flex", alignItems: "center", justifyContent: "center", color: "#000", fontWeight: 900, fontSize: 18 }}>A</div>
        <span style={{ color: WHITE, fontSize: 20, fontWeight: 700 }}>Atlas UX</span>
      </div>
      <div style={{ position: "absolute", top: 32, right: 40, color: GRAY, fontSize: 16, zIndex: 20, fontFamily: "'Inter', system-ui, sans-serif" }}>Live Demo</div>

      {/* ── Scene 1: Intro — 3D Atlas Avatar + Ringing Phone ── */}
      <Sequence from={SCENE.intro.from} durationInFrames={SCENE.intro.dur}>
        <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          {/* 3D Avatar on left */}
          <div style={{
            width: 500, height: 700, position: "absolute", left: 100,
            opacity: spring({ frame, fps: FPS, config: { damping: 12 } }),
            transform: `translateY(${interpolate(spring({ frame, fps: FPS }), [0, 1], [40, 0])}px)`,
          }}>
            <Atlas3DScene width={500} height={700} cameraZ={4} modelScale={2.8} speaking={false} />
          </div>

          {/* Phone ringing on right */}
          <div style={{
            position: "absolute", right: 200,
            display: "flex", flexDirection: "column", alignItems: "center", gap: 20,
            opacity: spring({ frame: frame - 15, fps: FPS, config: { damping: 15 } }),
          }}>
            <div style={{ position: "relative" }}>
              {[1, 2, 3].map((i) => (
                <div key={i} style={{
                  position: "absolute", top: "50%", left: "50%",
                  width: 60 + i * 30, height: 60 + i * 30,
                  marginTop: -(30 + i * 15), marginLeft: -(30 + i * 15),
                  borderRadius: "50%", border: `2px solid ${RING_RED}`,
                  opacity: (0.15 + 0.15 * Math.sin(frame * 0.3)) / i,
                }} />
              ))}
              <div style={{ transform: `rotate(${Math.sin(frame * 1.2) * 8}deg)`, fontSize: 56 }}>📞</div>
            </div>
            <div style={{ color: RING_RED, fontSize: 30, fontWeight: 700, fontFamily: "'Inter', system-ui, sans-serif" }}>Incoming Call...</div>
            <div style={{ color: GRAY, fontSize: 20, fontFamily: "'Inter', system-ui, sans-serif" }}>Mrs. Johnson — (573) 555-0198</div>
            <div style={{ color: CYAN, fontSize: 16, fontFamily: "'Inter', system-ui, sans-serif", opacity: 0.6 }}>Emergency — Burst Pipe</div>
          </div>
        </AbsoluteFill>
      </Sequence>

      {/* ── Scene 2: Lucy Answers ── */}
      <Sequence from={SCENE.answer.from} durationInFrames={SCENE.answer.dur}>
        <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 60 }}>
          <div style={{
            width: 420, height: 600,
            opacity: spring({ frame: frame - SCENE.answer.from, fps: FPS, config: { damping: 15 } }),
          }}>
            <Atlas3DScene width={420} height={600} speaking={true} cameraZ={3.8} modelScale={2.5} />
          </div>
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: 16,
            opacity: spring({ frame: frame - SCENE.answer.from - 10, fps: FPS, config: { damping: 15 } }),
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 14, height: 14, borderRadius: "50%", backgroundColor: EMERALD, boxShadow: `0 0 14px ${EMERALD}` }} />
              <span style={{ color: EMERALD, fontSize: 26, fontWeight: 700, fontFamily: "'Inter', system-ui, sans-serif" }}>Connected</span>
            </div>
            <Waveform frame={frame} color={CYAN} width={260} />
            <div style={{ color: GRAY, fontSize: 18, fontFamily: "'Inter', system-ui, sans-serif" }}>Lucy answering for Mike's Plumbing</div>
          </div>
        </AbsoluteFill>
      </Sequence>

      {/* ── Scene 3: Conversation ── */}
      <Sequence from={SCENE.convo.from} durationInFrames={SCENE.convo.dur}>
        <AbsoluteFill style={{ display: "flex", alignItems: "center", padding: "0 40px", gap: 30 }}>
          <div style={{ flexShrink: 0, width: 350, height: 550 }}>
            <Atlas3DScene width={350} height={550} speaking={isSpeaking} cameraZ={4} modelScale={2.4} />
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12, justifyContent: "center", paddingRight: 40 }}>
            <SpeechBubble
              text="Hi! This is Lucy at Mike's Plumbing. I may jot down a few notes so nothing gets missed. How can I help you today?"
              color={EMERALD} label="Lucy — AI Receptionist" side="left"
              frame={frame} enterFrame={SCENE.convo.from}
            />
            <SpeechBubble
              text="I've got a burst pipe in my basement flooding everywhere! I need someone here ASAP!"
              color={CYAN} label="Mrs. Johnson — Caller" side="right"
              frame={frame} enterFrame={SCENE.convo.from + 2.5 * FPS}
            />
            <SpeechBubble
              text="I'm so sorry! That sounds urgent — let me book Mike's earliest emergency slot for you right now..."
              color={EMERALD} label="Lucy — AI Receptionist" side="left"
              frame={frame} enterFrame={SCENE.convo.from + 4 * FPS}
            />
          </div>
        </AbsoluteFill>
      </Sequence>

      {/* ── Scene 4: Booking Dashboard ── */}
      <Sequence from={SCENE.dashboard.from} durationInFrames={SCENE.dashboard.dur}>
        <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 30 }}>
          <div style={{
            flexShrink: 0, width: 320, height: 500,
            opacity: spring({ frame: frame - SCENE.dashboard.from, fps: FPS, config: { damping: 15 } }),
          }}>
            <Atlas3DScene width={320} height={500} speaking={false} cameraZ={4.2} modelScale={2.2} />
          </div>
          <BookingDashboard frame={frame} enterFrame={SCENE.dashboard.from} />
        </AbsoluteFill>
      </Sequence>

      {/* ── Scene 5: SMS Confirmation ── */}
      <Sequence from={SCENE.sms.from} durationInFrames={SCENE.sms.dur}>
        <AbsoluteFill style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 40 }}>
          <div style={{
            flexShrink: 0, width: 280, height: 450,
            opacity: spring({ frame: frame - SCENE.sms.from, fps: FPS, config: { damping: 15 } }),
          }}>
            <Atlas3DScene width={280} height={450} speaking={false} cameraZ={4.5} modelScale={2} />
          </div>
          <SMSConfirmation frame={frame} enterFrame={SCENE.sms.from} />
        </AbsoluteFill>
      </Sequence>

      {/* ── Scene 6: Slack Post ── */}
      <Sequence from={SCENE.slack.from} durationInFrames={SCENE.slack.dur}>
        <AbsoluteFill style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 30 }}>
          <div style={{
            flexShrink: 0, width: 280, height: 450,
            opacity: spring({ frame: frame - SCENE.slack.from, fps: FPS, config: { damping: 15 } }),
          }}>
            <Atlas3DScene width={280} height={450} speaking={false} cameraZ={4.5} modelScale={2} />
          </div>
          <SlackPost frame={frame} enterFrame={SCENE.slack.from} />
        </AbsoluteFill>
      </Sequence>

      {/* ── Scene 7: Email to Plumber ── */}
      <Sequence from={SCENE.email.from} durationInFrames={SCENE.email.dur}>
        <AbsoluteFill style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
          <EmailToPlumber frame={frame} enterFrame={SCENE.email.from} />
        </AbsoluteFill>
      </Sequence>

      {/* ── Scene 8: CTA ── */}
      <Sequence from={SCENE.cta.from} durationInFrames={SCENE.cta.dur}>
        <AbsoluteFill style={{
          background: `linear-gradient(135deg, ${BG} 0%, #0f172a 50%, #0a1628 100%)`,
          display: "flex", justifyContent: "center", alignItems: "center", zIndex: 10,
        }}>
          {/* 3D avatar in background */}
          <div style={{ position: "absolute", opacity: 0.15, width: 800, height: 800 }}>
            <Atlas3DScene width={800} height={800} speaking={false} cameraZ={5} modelScale={3.5} />
          </div>
          <CTAOverlay frame={frame} enterFrame={SCENE.cta.from} />
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
};

export default LucyAnimated;
