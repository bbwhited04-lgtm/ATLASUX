/**
 * Floating Atlas — 3D sci-fi armor robot that floats on screen.
 *
 * Uses the real GLB model from public/models/atlas-avatar.glb
 * rendered via @react-three/fiber + @react-three/drei.
 * Click to expand chat panel. Voice input + deep bass TTS.
 */

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, OrbitControls, ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import { API_BASE } from "../lib/api";
import { useActiveTenant } from "../lib/activeTenant";
import { Send, X, Minus, Mic, MicOff } from "lucide-react";

/* ── Types ── */
interface ChatMsg {
  id: number;
  role: "user" | "assistant";
  content: string;
  time: string;
}

type FloatStatus = "online" | "busy" | "attention";

interface StatusMeta {
  color: string;
  glow: string;
  label: string;
  pulseSpeed: string;
  heartColor: string;
  heartGlow: string;
  threeColor: string;
}

const STATUS_MAP: Record<FloatStatus, StatusMeta> = {
  online:    { color: "#22c55e", glow: "rgba(34,197,94,0.6)",   label: "Online",        pulseSpeed: "2s",   heartColor: "#06b6d4", heartGlow: "rgba(6,182,212,0.5)", threeColor: "#06b6d4" },
  busy:      { color: "#a855f7", glow: "rgba(168,85,247,0.6)",  label: "Processing",    pulseSpeed: "1s",   heartColor: "#a855f7", heartGlow: "rgba(168,85,247,0.5)", threeColor: "#a855f7" },
  attention: { color: "#ef4444", glow: "rgba(239,68,68,0.7)",   label: "Needs approval", pulseSpeed: "0.6s", heartColor: "#ef4444", heartGlow: "rgba(239,68,68,0.5)", threeColor: "#ef4444" },
};

/* ── 3D Model Component ── */
const MODEL_PATH = "./models/atlas-avatar.glb";

function AtlasModel({ status, speaking }: { status: FloatStatus; speaking: boolean }) {
  const { scene } = useGLTF(MODEL_PATH);
  const groupRef = useRef<THREE.Group>(null!);
  const lightRef = useRef<THREE.PointLight>(null!);
  const meta = STATUS_MAP[status];

  // Clone scene so we can modify it safely
  useEffect(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (mesh.material) {
          (mesh.material as THREE.MeshStandardMaterial).metalness = 0.6;
          (mesh.material as THREE.MeshStandardMaterial).roughness = 0.3;
        }
      }
    });
  }, [scene]);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;

    // Slow idle rotation
    groupRef.current.rotation.y = Math.sin(t * 0.4) * 0.3;

    // Floating bob
    groupRef.current.position.y = Math.sin(t * 0.8) * 0.08;

    // Speaking: subtle rapid vibration
    if (speaking) {
      groupRef.current.rotation.x = Math.sin(t * 12) * 0.015;
    } else {
      groupRef.current.rotation.x = 0;
    }

    // Pulse the status light
    if (lightRef.current) {
      lightRef.current.color.set(meta.threeColor);
      const pulse = speaking
        ? 3 + Math.sin(t * 8) * 1.5
        : 2 + Math.sin(t * 2) * 0.8;
      lightRef.current.intensity = pulse;
    }
  });

  // Compute bounds to center + scale the model
  const box = new THREE.Box3().setFromObject(scene);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  const scale = 2.2 / maxDim; // fit to ~2.2 units tall

  return (
    <group ref={groupRef}>
      <primitive
        object={scene}
        scale={scale}
        position={[-center.x * scale, -center.y * scale, -center.z * scale]}
      />
      {/* Status-reactive core light */}
      <pointLight
        ref={lightRef}
        position={[0, 0, 0.5]}
        distance={4}
        decay={2}
      />
    </group>
  );
}

// Preload model
useGLTF.preload(MODEL_PATH);

/* ── Loading fallback ── */
function LoadingFallback() {
  const meshRef = useRef<THREE.Mesh>(null!);
  useFrame((state) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.y = state.clock.elapsedTime * 2;
  });
  return (
    <mesh ref={meshRef}>
      <octahedronGeometry args={[0.5, 0]} />
      <meshStandardMaterial color="#06b6d4" wireframe transparent opacity={0.6} />
    </mesh>
  );
}

/* ── Keyframes for status dot ── */
const STYLE_ID = "floating-atlas-kf";
function ensureKeyframes() {
  if (document.getElementById(STYLE_ID)) return;
  const s = document.createElement("style");
  s.id = STYLE_ID;
  s.textContent = `
    @keyframes fa-status-pulse { 0%,100%{transform:scale(1);opacity:0.9} 50%{transform:scale(1.3);opacity:1} }
  `;
  document.head.appendChild(s);
}

/* ── Main Component ── */
export default function FloatingAtlas() {
  const { tenantId } = useActiveTenant();
  const [chatOpen, setChatOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([
    { id: 0, role: "assistant", content: "Hey — I'm Atlas. Ask me anything or give me a task.", time: now() },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [status, setStatus] = useState<FloatStatus>("online");
  const [listening, setListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => { ensureKeyframes(); }, []);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, typing]);
  useEffect(() => { if (chatOpen) inputRef.current?.focus(); }, [chatOpen]);

  /* Voice recognition setup */
  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    setVoiceSupported(true);
    const recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      if (transcript.trim()) {
        setInput(transcript);
        setTimeout(() => {
          const form = document.getElementById("atlas-chat-form") as HTMLFormElement | null;
          form?.requestSubmit();
        }, 100);
      }
      setListening(false);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    return () => { try { recognition.abort(); } catch {} };
  }, []);

  const toggleVoice = () => {
    if (!recognitionRef.current) return;
    if (listening) {
      recognitionRef.current.abort();
      setListening(false);
    } else {
      setChatOpen(true);
      recognitionRef.current.start();
      setListening(true);
    }
  };

  /* TTS — deep bass voice */
  const [speaking, setSpeaking] = useState(false);
  const speak = useCallback((text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const deepVoice = voices.find(v => /male/i.test(v.name) && /english/i.test(v.lang || v.name))
      || voices.find(v => /daniel|david|james|google.*male|microsoft.*mark/i.test(v.name))
      || voices.find(v => v.lang.startsWith("en") && !/(female|samantha|karen|fiona|moira|tessa|victoria)/i.test(v.name))
      || voices.find(v => v.lang.startsWith("en"))
      || voices[0];
    if (deepVoice) utter.voice = deepVoice;
    utter.pitch = 0.4;
    utter.rate = 0.9;
    utter.volume = 1.0;
    utter.onstart = () => setSpeaking(true);
    utter.onend = () => setSpeaking(false);
    utter.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utter);
  }, []);

  useEffect(() => {
    window.speechSynthesis?.getVoices();
    window.speechSynthesis?.addEventListener?.("voiceschanged", () => window.speechSynthesis.getVoices());
  }, []);

  /* Status poll */
  const pollStatus = useCallback(async () => {
    const headers: Record<string, string> = {};
    if (tenantId) headers["x-tenant-id"] = tenantId;
    try {
      const [jobsRes, decRes] = await Promise.all([
        fetch(`${API_BASE}/v1/jobs/list`, { headers }).then(r => r.json()).catch(() => null),
        tenantId
          ? fetch(`${API_BASE}/v1/decisions?tenantId=${encodeURIComponent(tenantId)}&status=AWAITING_HUMAN&take=50`, { headers }).then(r => r.json()).catch(() => null)
          : Promise.resolve(null),
      ]);
      const jobs = Array.isArray(jobsRes?.jobs) ? jobsRes.jobs.filter((j: any) => j.status === "running" || j.status === "queued").length : 0;
      const decs = Array.isArray(decRes?.memos) ? decRes.memos.length : 0;
      if (decs > 0) setStatus("attention");
      else if (jobs > 0) setStatus("busy");
      else setStatus("online");
    } catch { /* keep current */ }
  }, [tenantId]);

  useEffect(() => {
    pollStatus();
    const t = setInterval(pollStatus, 30_000);
    return () => clearInterval(t);
  }, [pollStatus]);

  /* Send via /v1/chat */
  const send = async () => {
    const text = input.trim();
    if (!text) return;
    const userMsg: ChatMsg = { id: Date.now(), role: "user", content: text, time: now() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setTyping(true);
    try {
      const resp = await fetch(`${API_BASE}/v1/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(tenantId ? { "x-tenant-id": tenantId } : {}) },
        body: JSON.stringify({
          provider: "openai",
          messages: [...messages.filter(m => m.role === "user" || m.role === "assistant").slice(-8).map(m => ({ role: m.role, content: m.content })), { role: "user", content: text }],
          systemPrompt: null,
        }),
      });
      const data = await resp.json().catch(() => ({}));
      const content = data?.content || (resp.ok ? "..." : `Error: ${data?.error || resp.statusText}`);
      setMessages(prev => [...prev, { id: Date.now() + 1, role: "assistant", content, time: now() }]);
      speak(content);
    } catch (err: any) {
      setMessages(prev => [...prev, { id: Date.now() + 1, role: "assistant", content: `Offline — ${err?.message || "network error"}`, time: now() }]);
    } finally {
      setTyping(false);
    }
  };

  const meta = STATUS_MAP[status];

  /* Minimized pill */
  if (minimized) {
    return (
      <button
        onClick={() => { setMinimized(false); setChatOpen(true); }}
        className="fixed bottom-4 right-4 z-[9999] flex items-center gap-2 px-3 py-2 rounded-full bg-slate-900/95 border border-cyan-500/30 backdrop-blur-xl shadow-lg hover:border-cyan-400/50 transition-all"
      >
        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: meta.color, boxShadow: `0 0 6px ${meta.glow}` }} />
        <span className="text-xs text-cyan-400 font-medium">Atlas</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-[9998] flex flex-col items-end gap-2">
      {/* Chat panel — stacked above avatar */}
      {chatOpen && (
        <div className="w-[360px] max-h-[480px] flex flex-col rounded-2xl border border-cyan-500/20 bg-slate-950/95 backdrop-blur-xl shadow-2xl shadow-cyan-500/10 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-cyan-500/10 bg-slate-900/60">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: meta.color, boxShadow: `0 0 6px ${meta.glow}` }} />
              <span className="text-sm font-semibold text-white">Atlas</span>
              <span className="text-[10px] text-slate-500">{meta.label}</span>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => { setChatOpen(false); setMinimized(true); }} className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800/60"><Minus className="w-3.5 h-3.5" /></button>
              <button onClick={() => setChatOpen(false)} className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800/60"><X className="w-3.5 h-3.5" /></button>
            </div>
          </div>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-2.5 space-y-2.5 min-h-[240px] max-h-[340px] scrollbar-thin scrollbar-thumb-cyan-500/20 scrollbar-track-transparent">
            {messages.map(m => (
              <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] px-3 py-2 rounded-xl text-sm leading-relaxed ${m.role === "user" ? "bg-cyan-600/20 text-cyan-100 border border-cyan-500/15" : "bg-slate-800/60 text-slate-200 border border-slate-700/30"}`}>
                  <div className="whitespace-pre-wrap break-words">{m.content}</div>
                  <div className="text-[9px] text-slate-500 mt-1 text-right">{m.time}</div>
                </div>
              </div>
            ))}
            {typing && (
              <div className="flex justify-start">
                <div className="bg-slate-800/60 border border-slate-700/30 rounded-xl px-3 py-2 flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
          {/* Input */}
          <form id="atlas-chat-form" onSubmit={e => { e.preventDefault(); send(); }} className="px-3 py-2 border-t border-cyan-500/10 bg-slate-900/40 flex gap-2">
            <input ref={inputRef} type="text" value={input} onChange={e => setInput(e.target.value)} placeholder={listening ? "Listening..." : "Ask Atlas..."} className={`flex-1 bg-slate-800/60 border rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none transition-colors ${listening ? "border-red-400/50 placeholder-red-300/50" : "border-cyan-500/15 focus:border-cyan-400/40"}`} />
            {voiceSupported && (
              <button type="button" onClick={toggleVoice} className={`p-2 rounded-xl transition-colors ${listening ? "bg-red-600/80 text-white animate-pulse" : "bg-slate-700/60 text-slate-400 hover:text-cyan-400 hover:bg-slate-700"}`} title={listening ? "Stop listening" : "Voice command"}>
                {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            )}
            <button type="submit" disabled={!input.trim() || typing} className="p-2 rounded-xl bg-cyan-600/80 text-white hover:bg-cyan-500 disabled:opacity-30 disabled:cursor-not-allowed"><Send className="w-4 h-4" /></button>
          </form>
        </div>
      )}

      {/* 3D Robot Avatar */}
      <div className="relative">
        {/* Status dot */}
        <div
          className="absolute top-1 right-1 z-10 w-3.5 h-3.5 rounded-full border-2 border-slate-950"
          style={{
            backgroundColor: meta.color,
            boxShadow: `0 0 8px ${meta.glow}`,
            animation: "fa-status-pulse 2s ease-in-out infinite",
          }}
        />
        <button
          onClick={() => setChatOpen(o => !o)}
          className="relative cursor-pointer transition-transform hover:scale-105 focus:outline-none rounded-2xl overflow-hidden"
          style={{
            width: 140,
            height: 180,
            filter: `drop-shadow(0 0 16px ${meta.heartGlow})`,
          }}
          title={`Atlas — ${meta.label}. Click to chat.`}
        >
          <Canvas
            camera={{ position: [0, 0, 3.5], fov: 40 }}
            style={{ background: "transparent" }}
            gl={{ alpha: true, antialias: true }}
          >
            <ambientLight intensity={0.4} />
            <directionalLight position={[3, 4, 5]} intensity={1.2} color="#e0f2fe" />
            <directionalLight position={[-2, -1, 3]} intensity={0.4} color="#0ea5e9" />
            <Suspense fallback={<LoadingFallback />}>
              <AtlasModel status={status} speaking={speaking} />
              <ContactShadows
                position={[0, -1.3, 0]}
                opacity={0.3}
                scale={4}
                blur={2}
                far={3}
                color={meta.threeColor}
              />
            </Suspense>
            <OrbitControls
              enableZoom={false}
              enablePan={false}
              enableRotate={false}
            />
          </Canvas>
        </button>
      </div>
    </div>
  );
}

function now() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
