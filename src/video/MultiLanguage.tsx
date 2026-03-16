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
const ROSE = "#f43f5e";
const VIOLET = "#8b5cf6";
const AMBER = "#f59e0b";
const SKY = "#0ea5e9";

const SCENE = {
  intro:     { from: 0, dur: 3 * FPS },
  english:   { from: 3 * FPS, dur: 4 * FPS },
  detect:    { from: 7 * FPS, dur: 2 * FPS },
  spanish:   { from: 9 * FPS, dur: 4 * FPS },
  detect2:   { from: 13 * FPS, dur: 2 * FPS },
  french:    { from: 15 * FPS, dur: 4 * FPS },
  globe:     { from: 19 * FPS, dur: 3.5 * FPS },
  cta:       { from: 22.5 * FPS, dur: 3.5 * FPS },
};
const TOTAL = 26 * FPS;

const LANGUAGES = [
  { code: "EN", name: "English", flag: "🇺🇸", color: CYAN },
  { code: "ES", name: "Español", flag: "🇲🇽", color: AMBER },
  { code: "FR", name: "Français", flag: "🇫🇷", color: VIOLET },
  { code: "PT", name: "Português", flag: "🇧🇷", color: EMERALD },
  { code: "DE", name: "Deutsch", flag: "🇩🇪", color: ROSE },
  { code: "ZH", name: "中文", flag: "🇨🇳", color: SKY },
  { code: "JA", name: "日本語", flag: "🇯🇵", color: "#ec4899" },
  { code: "KO", name: "한국어", flag: "🇰🇷", color: "#a78bfa" },
];

const ChatBubble: React.FC<{
  text: string; speaker: "lucy" | "caller"; langColor: string;
  label: string; frame: number; enterFrame: number;
}> = ({ text, speaker, langColor, label, frame, enterFrame }) => {
  const progress = spring({ frame: frame - enterFrame, fps: FPS, config: { damping: 15 } });
  const isLucy = speaker === "lucy";
  const charsToShow = Math.min(text.length, Math.floor((frame - enterFrame) * 0.8));

  return (
    <div style={{
      display: "flex", justifyContent: isLucy ? "flex-start" : "flex-end",
      opacity: progress,
      transform: `translateY(${interpolate(progress, [0, 1], [30, 0])}px)`,
      marginBottom: 14,
    }}>
      <div style={{
        maxWidth: "75%", padding: "16px 24px",
        borderRadius: isLucy ? "4px 20px 20px 20px" : "20px 4px 20px 20px",
        backgroundColor: isLucy ? DARK_CARD : `${langColor}15`,
        border: `1px solid ${langColor}44`,
        color: WHITE, fontSize: 22, lineHeight: 1.5,
        fontFamily: "'Inter', system-ui, sans-serif",
      }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: langColor, marginBottom: 6, textTransform: "uppercase", letterSpacing: 1.5 }}>
          {label}
        </div>
        {text.slice(0, charsToShow)}
        {charsToShow < text.length && <span style={{ opacity: frame % 15 < 8 ? 1 : 0, color: GRAY }}>|</span>}
      </div>
    </div>
  );
};

const LanguageDetect: React.FC<{ from: string; to: string; fromFlag: string; toFlag: string; fromColor: string; toColor: string; frame: number; enterFrame: number }> = ({
  from, to, fromFlag, toFlag, fromColor, toColor, frame, enterFrame,
}) => {
  const progress = spring({ frame: frame - enterFrame, fps: FPS, config: { damping: 12, stiffness: 100 } });
  const arrowProgress = spring({ frame: frame - enterFrame - 10, fps: FPS, config: { damping: 15 } });

  return (
    <div style={{
      opacity: progress,
      display: "flex", alignItems: "center", justifyContent: "center", gap: 24,
      padding: "16px 32px",
      backgroundColor: DARK_CARD, borderRadius: 12,
      border: `1px solid ${toColor}44`,
      margin: "8px auto", width: "fit-content",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 28 }}>{fromFlag}</span>
        <span style={{ color: fromColor, fontSize: 18, fontWeight: 700, fontFamily: "'Inter', system-ui, sans-serif" }}>{from}</span>
      </div>
      <div style={{ opacity: arrowProgress, color: GRAY, fontSize: 24 }}>→</div>
      <div style={{
        padding: "6px 16px", borderRadius: 8,
        backgroundColor: `${toColor}22`, border: `1px solid ${toColor}`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 28 }}>{toFlag}</span>
          <span style={{ color: toColor, fontSize: 18, fontWeight: 700, fontFamily: "'Inter', system-ui, sans-serif" }}>{to}</span>
        </div>
      </div>
      <div style={{ opacity: arrowProgress, color: EMERALD, fontSize: 14, fontWeight: 600, fontFamily: "'Inter', system-ui, sans-serif" }}>
        Auto-detected
      </div>
    </div>
  );
};

const GlobeView: React.FC<{ frame: number; enterFrame: number }> = ({ frame, enterFrame }) => {
  const progress = spring({ frame: frame - enterFrame, fps: FPS, config: { damping: 12 } });

  return (
    <div style={{ opacity: progress, display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
      <div style={{ color: WHITE, fontSize: 32, fontWeight: 800, fontFamily: "'Inter', system-ui, sans-serif", marginBottom: 8 }}>
        8 Languages, One Lucy
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center", maxWidth: 700 }}>
        {LANGUAGES.map((lang, i) => {
          const itemProgress = spring({ frame: frame - enterFrame - i * 5, fps: FPS, config: { damping: 15 } });
          return (
            <div key={lang.code} style={{
              opacity: itemProgress,
              transform: `scale(${interpolate(itemProgress, [0, 1], [0.7, 1])})`,
              padding: "12px 20px", borderRadius: 12,
              backgroundColor: `${lang.color}15`,
              border: `1px solid ${lang.color}44`,
              display: "flex", alignItems: "center", gap: 10,
            }}>
              <span style={{ fontSize: 28 }}>{lang.flag}</span>
              <div>
                <div style={{ color: lang.color, fontSize: 16, fontWeight: 700, fontFamily: "'Inter', system-ui, sans-serif" }}>{lang.name}</div>
                <div style={{ color: GRAY, fontSize: 12, fontFamily: "'Inter', system-ui, sans-serif" }}>{lang.code}</div>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ color: GRAY, fontSize: 16, fontFamily: "'Inter', system-ui, sans-serif", marginTop: 8 }}>
        Auto-detects caller language in the first 3 seconds
      </div>
    </div>
  );
};

const IntroScreen: React.FC<{ frame: number }> = ({ frame }) => {
  const progress = spring({ frame, fps: FPS, config: { damping: 12 } });
  const rotation = frame * 0.5;
  return (
    <div style={{ opacity: progress, display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
      <div style={{ fontSize: 72, transform: `rotate(${Math.sin(rotation * 0.02) * 5}deg)` }}>🌍</div>
      <div style={{ color: WHITE, fontSize: 44, fontWeight: 800, fontFamily: "'Inter', system-ui, sans-serif" }}>Multi-Language Support</div>
      <div style={{ color: VIOLET, fontSize: 24, fontFamily: "'Inter', system-ui, sans-serif" }}>Lucy speaks your customer's language</div>
      <div style={{ color: GRAY, fontSize: 18, fontFamily: "'Inter', system-ui, sans-serif", textAlign: "center", maxWidth: 600, lineHeight: 1.6 }}>
        Automatic language detection. Seamless switching.<br />Every caller gets a native experience.
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
        Every Customer. Every Language.
      </div>
      <div style={{ color: GRAY, fontSize: 22, fontFamily: "'Inter', system-ui, sans-serif", textAlign: "center", maxWidth: 600, lineHeight: 1.6 }}>
        Never lose a customer because of a language barrier again.
      </div>
      <div style={{
        transform: `scale(${pulse})`, padding: "20px 48px",
        backgroundColor: EMERALD, borderRadius: 16, color: "#000",
        fontSize: 28, fontWeight: 800, fontFamily: "'Inter', system-ui, sans-serif",
        boxShadow: `0 0 40px ${EMERALD}55`,
      }}>
        Call Lucy Now — (573) 742-2028
      </div>
      <div style={{ color: GRAY, fontSize: 18, fontFamily: "'Inter', system-ui, sans-serif" }}>Try in English, Spanish, French, or any supported language</div>
    </div>
  );
};

export const MultiLanguage: React.FC = () => {
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

      <Sequence from={SCENE.english.from} durationInFrames={SCENE.detect.from - SCENE.english.from}>
        <AbsoluteFill style={{ display: "flex", flexDirection: "column", justifyContent: "center", padding: "80px 60px" }}>
          <ChatBubble speaker="caller" text="Hi, I need to book an appointment for a haircut tomorrow." label="Caller — English" langColor={CYAN} frame={frame} enterFrame={SCENE.english.from} />
          <ChatBubble speaker="lucy" text="Of course! I'd be happy to help you book that. Let me check our available times for tomorrow..." label="Lucy — English" langColor={EMERALD} frame={frame} enterFrame={SCENE.english.from + 1.5 * FPS} />
        </AbsoluteFill>
      </Sequence>

      <Sequence from={SCENE.detect.from} durationInFrames={SCENE.detect.dur}>
        <AbsoluteFill style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
          <LanguageDetect from="English" to="Español" fromFlag="🇺🇸" toFlag="🇲🇽" fromColor={CYAN} toColor={AMBER} frame={frame} enterFrame={SCENE.detect.from} />
        </AbsoluteFill>
      </Sequence>

      <Sequence from={SCENE.spanish.from} durationInFrames={SCENE.detect2.from - SCENE.spanish.from}>
        <AbsoluteFill style={{ display: "flex", flexDirection: "column", justifyContent: "center", padding: "80px 60px" }}>
          <ChatBubble speaker="caller" text="Hola, necesito hacer una cita para mañana por favor." label="Caller — Español" langColor={AMBER} frame={frame} enterFrame={SCENE.spanish.from} />
          <ChatBubble speaker="lucy" text="¡Claro que sí! Con mucho gusto le ayudo a reservar su cita. Déjeme revisar los horarios disponibles para mañana..." label="Lucy — Español" langColor={EMERALD} frame={frame} enterFrame={SCENE.spanish.from + 1.5 * FPS} />
        </AbsoluteFill>
      </Sequence>

      <Sequence from={SCENE.detect2.from} durationInFrames={SCENE.detect2.dur}>
        <AbsoluteFill style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
          <LanguageDetect from="Español" to="Français" fromFlag="🇲🇽" toFlag="🇫🇷" fromColor={AMBER} toColor={VIOLET} frame={frame} enterFrame={SCENE.detect2.from} />
        </AbsoluteFill>
      </Sequence>

      <Sequence from={SCENE.french.from} durationInFrames={SCENE.globe.from - SCENE.french.from}>
        <AbsoluteFill style={{ display: "flex", flexDirection: "column", justifyContent: "center", padding: "80px 60px" }}>
          <ChatBubble speaker="caller" text="Bonjour, je voudrais prendre rendez-vous pour demain s'il vous plaît." label="Caller — Français" langColor={VIOLET} frame={frame} enterFrame={SCENE.french.from} />
          <ChatBubble speaker="lucy" text="Bien sûr ! Je serais ravie de vous aider à réserver votre rendez-vous. Laissez-moi vérifier nos disponibilités pour demain..." label="Lucy — Français" langColor={EMERALD} frame={frame} enterFrame={SCENE.french.from + 1.5 * FPS} />
        </AbsoluteFill>
      </Sequence>

      <Sequence from={SCENE.globe.from} durationInFrames={SCENE.cta.from - SCENE.globe.from}>
        <AbsoluteFill style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
          <GlobeView frame={frame} enterFrame={SCENE.globe.from} />
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

export default MultiLanguage;
