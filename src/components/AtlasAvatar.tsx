import { useState, useEffect } from "react";
import { motion, AnimatePresence, PanInfo } from "motion/react";

const taskSayings = [
  "Task completed! What's next?",
  "Done! That was easy.",
  "Mission accomplished! 🎯",
  "All set! Ready for more.",
  "Finished! I'm getting good at this.",
  "Complete! Next challenge?",
  "Got it done! Piece of cake.",
  "Task finished successfully!",
  "All done! Standing by.",
  "Completed! What else can I do?",
];

const idleSayings = [
  "Ready when you are...",
  "Standing by for tasks.",
  "Just chilling here.",
  "Waiting for instructions.",
  "All systems nominal.",
  "Ready to work!",
];

type Pose = "standing" | "bending" | "kneeling" | "laying";

export function AtlasAvatar() {
  const [pose, setPose] = useState<Pose>("standing");
  const [message, setMessage] = useState("");
  const [showMessage, setShowMessage] = useState(false);
  const [networkRotation, setNetworkRotation] = useState(0);
  
  // Draggable position state - load from localStorage
  const [atlasPosition, setAtlasPosition] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('atlasPosition');
      return saved ? JSON.parse(saved) : { x: 0, y: 0 };
    }
    return { x: 0, y: 0 };
  });
  
  // Save position to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('atlasPosition', JSON.stringify(atlasPosition));
    }
  }, [atlasPosition]);
  
  // Rotating network animation
  useEffect(() => {
    const interval = setInterval(() => {
      setNetworkRotation(prev => (prev + 1) % 360);
    }, 50);
    
    return () => clearInterval(interval);
  }, []);
  
  // Random pose changes when idle
  useEffect(() => {
    const poseInterval = setInterval(() => {
      const poses: Pose[] = ["standing", "bending", "kneeling", "laying"];
      const randomPose = poses[Math.floor(Math.random() * poses.length)];
      setPose(randomPose);
      
      // Sometimes show idle sayings
      if (Math.random() > 0.7) {
        showRandomMessage(idleSayings);
      }
    }, 8000); // Change pose every 8 seconds
    
    return () => clearInterval(poseInterval);
  }, []);
  
  const showRandomMessage = (sayingsArray: string[]) => {
    const randomMessage = sayingsArray[Math.floor(Math.random() * sayingsArray.length)];
    setMessage(randomMessage);
    setShowMessage(true);
    
    setTimeout(() => {
      setShowMessage(false);
    }, 3000);
  };
  
  const onTaskComplete = () => {
    // Celebrate with a standing pose
    setPose("standing");
    showRandomMessage(taskSayings);
    
    // Return to random pose after celebration
    setTimeout(() => {
      const poses: Pose[] = ["standing", "bending", "kneeling"];
      setPose(poses[Math.floor(Math.random() * poses.length)]);
    }, 3000);
  };
  
  // Expose function to parent components
  useEffect(() => {
    (window as any).atlasTaskComplete = onTaskComplete;
    return () => {
      delete (window as any).atlasTaskComplete;
    };
  }, []);
  
  // Wireframe Human Body Parts (stick figure style)
  const WireframeHuman = () => {
    const getPoseTransforms = () => {
      switch (pose) {
        case "standing":
          return {
            head: { y: 0 },
            torso: { y: 0, scaleY: 1 },
            leftArm: { rotate: -20 },
            rightArm: { rotate: 20 },
            leftLeg: { rotate: 0 },
            rightLeg: { rotate: 0 },
            body: { y: 0 }
          };
        case "bending":
          return {
            head: { y: 15 },
            torso: { y: 10, scaleY: 0.9 },
            leftArm: { rotate: -45 },
            rightArm: { rotate: 45 },
            leftLeg: { rotate: -10 },
            rightLeg: { rotate: 10 },
            body: { y: 20 }
          };
        case "kneeling":
          return {
            head: { y: 20 },
            torso: { y: 20, scaleY: 0.85 },
            leftArm: { rotate: -30 },
            rightArm: { rotate: 30 },
            leftLeg: { rotate: -80 },
            rightLeg: { rotate: -70 },
            body: { y: 40 }
          };
        case "laying":
          return {
            head: { y: 50 },
            torso: { y: 50, scaleY: 0.5 },
            leftArm: { rotate: -90 },
            rightArm: { rotate: 90 },
            leftLeg: { rotate: 0 },
            rightLeg: { rotate: 0 },
            body: { y: 60 }
          };
        default:
          return {
            head: { y: 0 },
            torso: { y: 0, scaleY: 1 },
            leftArm: { rotate: -20 },
            rightArm: { rotate: 20 },
            leftLeg: { rotate: 0 },
            rightLeg: { rotate: 0 },
            body: { y: 0 }
          };
      }
    };
    
    const transforms = getPoseTransforms();
    
    return (
      <motion.svg
        width="140"
        height="180"
        viewBox="0 0 140 180"
        className="drop-shadow-[0_0_10px_rgba(6,182,212,0.6)]"
        animate={{ y: transforms.body.y }}
        transition={{ duration: 1, ease: "easeInOut" }}
      >
        {/* Head */}
        <motion.g
          animate={{ y: transforms.head.y }}
          transition={{ duration: 1, ease: "easeInOut" }}
        >
          {/* Head circle - larger */}
          <motion.circle
            cx="70"
            cy="28"
            r="16"
            fill="none"
            stroke="rgba(6,182,212,0.9)"
            strokeWidth="2.5"
            animate={{
              opacity: [0.8, 1, 0.8],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
            }}
          />
          {/* Head cross lines */}
          <line x1="70" y1="12" x2="70" y2="44" stroke="rgba(6,182,212,0.5)" strokeWidth="1.5" />
          <line x1="54" y1="28" x2="86" y2="28" stroke="rgba(6,182,212,0.5)" strokeWidth="1.5" />
          {/* Face detail grid */}
          <line x1="62" y1="20" x2="62" y2="36" stroke="rgba(6,182,212,0.3)" strokeWidth="1" />
          <line x1="78" y1="20" x2="78" y2="36" stroke="rgba(6,182,212,0.3)" strokeWidth="1" />
          <line x1="62" y1="24" x2="78" y2="24" stroke="rgba(6,182,212,0.3)" strokeWidth="1" />
          <line x1="62" y1="32" x2="78" y2="32" stroke="rgba(6,182,212,0.3)" strokeWidth="1" />
          
          {/* Eyes - larger and more detailed */}
          <motion.circle
            cx="64"
            cy="26"
            r="2.5"
            fill="rgba(6,182,212,1)"
            animate={{
              opacity: [1, 0, 1],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
            }}
          />
          <motion.circle
            cx="76"
            cy="26"
            r="2.5"
            fill="rgba(6,182,212,1)"
            animate={{
              opacity: [1, 0, 1],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
            }}
          />
          <circle cx="64" cy="26" r="4" fill="none" stroke="rgba(6,182,212,0.6)" strokeWidth="1" />
          <circle cx="76" cy="26" r="4" fill="none" stroke="rgba(6,182,212,0.6)" strokeWidth="1" />
        </motion.g>
        
        {/* Neck - wider and structured */}
        <motion.g
          animate={{ y: transforms.head.y }}
          transition={{ duration: 1, ease: "easeInOut" }}
        >
          <line x1="64" y1="44" x2="62" y2="54" stroke="rgba(6,182,212,0.9)" strokeWidth="3" />
          <line x1="76" y1="44" x2="78" y2="54" stroke="rgba(6,182,212,0.9)" strokeWidth="3" />
          <line x1="64" y1="44" x2="76" y2="44" stroke="rgba(6,182,212,0.7)" strokeWidth="2" />
          <line x1="62" y1="54" x2="78" y2="54" stroke="rgba(6,182,212,0.7)" strokeWidth="2" />
        </motion.g>
        
        {/* Torso - wider body with structure */}
        <motion.g
          animate={{ y: transforms.torso.y, scaleY: transforms.torso.scaleY }}
          transition={{ duration: 1, ease: "easeInOut" }}
          style={{ transformOrigin: "70px 54px" }}
        >
          {/* Torso frame - trapezoid shape */}
          <path
            d="M 62 54 L 52 110 L 88 110 L 78 54 Z"
            fill="none"
            stroke="rgba(6,182,212,0.9)"
            strokeWidth="3"
          />
          
          {/* Spine/center line */}
          <line x1="70" y1="54" x2="70" y2="110" stroke="rgba(6,182,212,1)" strokeWidth="2.5" />
          
          {/* Rib cage structure */}
          <motion.path
            d="M 70 62 Q 62 62 58 66 Q 62 70 70 70"
            fill="none"
            stroke="rgba(6,182,212,0.6)"
            strokeWidth="1.5"
            animate={{ opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <motion.path
            d="M 70 62 Q 78 62 82 66 Q 78 70 70 70"
            fill="none"
            stroke="rgba(6,182,212,0.6)"
            strokeWidth="1.5"
            animate={{ opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          
          <motion.path
            d="M 70 72 Q 60 72 56 76 Q 60 80 70 80"
            fill="none"
            stroke="rgba(6,182,212,0.6)"
            strokeWidth="1.5"
            animate={{ opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.2 }}
          />
          <motion.path
            d="M 70 72 Q 80 72 84 76 Q 80 80 70 80"
            fill="none"
            stroke="rgba(6,182,212,0.6)"
            strokeWidth="1.5"
            animate={{ opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.2 }}
          />
          
          <motion.path
            d="M 70 82 Q 58 82 54 86 Q 58 90 70 90"
            fill="none"
            stroke="rgba(6,182,212,0.6)"
            strokeWidth="1.5"
            animate={{ opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.4 }}
          />
          <motion.path
            d="M 70 82 Q 82 82 86 86 Q 82 90 70 90"
            fill="none"
            stroke="rgba(6,182,212,0.6)"
            strokeWidth="1.5"
            animate={{ opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.4 }}
          />
          
          {/* Chest detail lines */}
          <line x1="60" y1="64" x2="80" y2="64" stroke="rgba(6,182,212,0.4)" strokeWidth="1" />
          <line x1="58" y1="74" x2="82" y2="74" stroke="rgba(6,182,212,0.4)" strokeWidth="1" />
          <line x1="56" y1="84" x2="84" y2="84" stroke="rgba(6,182,212,0.4)" strokeWidth="1" />
          <line x1="54" y1="94" x2="86" y2="94" stroke="rgba(6,182,212,0.4)" strokeWidth="1" />
          <line x1="52" y1="104" x2="88" y2="104" stroke="rgba(6,182,212,0.4)" strokeWidth="1" />
          
          {/* Shoulders - larger structure */}
          <line x1="45" y1="58" x2="95" y2="58" stroke="rgba(6,182,212,0.9)" strokeWidth="3" />
          <circle cx="45" cy="58" r="5" fill="none" stroke="rgba(6,182,212,1)" strokeWidth="2.5" />
          <circle cx="95" cy="58" r="5" fill="none" stroke="rgba(6,182,212,1)" strokeWidth="2.5" />
          <circle cx="45" cy="58" r="3" fill="rgba(6,182,212,0.3)" />
          <circle cx="95" cy="58" r="3" fill="rgba(6,182,212,0.3)" />
        </motion.g>
        
        {/* Left Arm - thicker and more detailed */}
        <motion.g
          style={{ transformOrigin: "45px 58px" }}
          animate={{ rotate: transforms.leftArm.rotate, y: transforms.torso.y }}
          transition={{ duration: 1, ease: "easeInOut" }}
        >
          {/* Upper arm */}
          <line x1="45" y1="58" x2="35" y2="88" stroke="rgba(6,182,212,0.9)" strokeWidth="4" />
          <line x1="42" y1="60" x2="32" y2="90" stroke="rgba(6,182,212,0.5)" strokeWidth="1.5" />
          {/* Elbow joint */}
          <circle cx="35" cy="88" r="4" fill="none" stroke="rgba(6,182,212,1)" strokeWidth="2.5" />
          <circle cx="35" cy="88" r="2" fill="rgba(6,182,212,0.7)" />
          {/* Forearm */}
          <line x1="35" y1="88" x2="28" y2="116" stroke="rgba(6,182,212,0.9)" strokeWidth="3.5" />
          <line x1="33" y1="90" x2="26" y2="118" stroke="rgba(6,182,212,0.5)" strokeWidth="1.5" />
          {/* Hand */}
          <circle cx="28" cy="116" r="4" fill="rgba(6,182,212,0.7)" />
          <circle cx="28" cy="116" r="5" fill="none" stroke="rgba(6,182,212,1)" strokeWidth="1.5" />
        </motion.g>
        
        {/* Right Arm - thicker and more detailed */}
        <motion.g
          style={{ transformOrigin: "95px 58px" }}
          animate={{ rotate: transforms.rightArm.rotate, y: transforms.torso.y }}
          transition={{ duration: 1, ease: "easeInOut" }}
        >
          {/* Upper arm */}
          <line x1="95" y1="58" x2="105" y2="88" stroke="rgba(6,182,212,0.9)" strokeWidth="4" />
          <line x1="98" y1="60" x2="108" y2="90" stroke="rgba(6,182,212,0.5)" strokeWidth="1.5" />
          {/* Elbow joint */}
          <circle cx="105" cy="88" r="4" fill="none" stroke="rgba(6,182,212,1)" strokeWidth="2.5" />
          <circle cx="105" cy="88" r="2" fill="rgba(6,182,212,0.7)" />
          {/* Forearm */}
          <line x1="105" y1="88" x2="112" y2="116" stroke="rgba(6,182,212,0.9)" strokeWidth="3.5" />
          <line x1="107" y1="90" x2="114" y2="118" stroke="rgba(6,182,212,0.5)" strokeWidth="1.5" />
          {/* Hand */}
          <circle cx="112" cy="116" r="4" fill="rgba(6,182,212,0.7)" />
          <circle cx="112" cy="116" r="5" fill="none" stroke="rgba(6,182,212,1)" strokeWidth="1.5" />
        </motion.g>
        
        {/* Pelvis - wider structure */}
        <motion.g
          animate={{ y: transforms.torso.y }}
          transition={{ duration: 1, ease: "easeInOut" }}
        >
          <path
            d="M 52 110 L 88 110 L 82 118 L 58 118 Z"
            fill="none"
            stroke="rgba(6,182,212,0.9)"
            strokeWidth="3"
          />
          <line x1="58" y1="114" x2="82" y2="114" stroke="rgba(6,182,212,0.6)" strokeWidth="1.5" />
          <circle cx="58" cy="118" r="5" fill="none" stroke="rgba(6,182,212,1)" strokeWidth="2.5" />
          <circle cx="82" cy="118" r="5" fill="none" stroke="rgba(6,182,212,1)" strokeWidth="2.5" />
          <circle cx="58" cy="118" r="3" fill="rgba(6,182,212,0.3)" />
          <circle cx="82" cy="118" r="3" fill="rgba(6,182,212,0.3)" />
        </motion.g>
        
        {/* Left Leg - thicker */}
        <motion.g
          style={{ transformOrigin: "58px 118px" }}
          animate={{ rotate: transforms.leftLeg.rotate, y: transforms.torso.y }}
          transition={{ duration: 1, ease: "easeInOut" }}
        >
          {/* Thigh */}
          <line x1="58" y1="118" x2="54" y2="148" stroke="rgba(6,182,212,0.9)" strokeWidth="5" />
          <line x1="56" y1="120" x2="52" y2="150" stroke="rgba(6,182,212,0.5)" strokeWidth="1.5" />
          {/* Knee joint */}
          <circle cx="54" cy="148" r="4" fill="none" stroke="rgba(6,182,212,1)" strokeWidth="2.5" />
          <circle cx="54" cy="148" r="2" fill="rgba(6,182,212,0.7)" />
          {/* Shin */}
          <line x1="54" y1="148" x2="52" y2="174" stroke="rgba(6,182,212,0.9)" strokeWidth="4" />
          <line x1="53" y1="150" x2="51" y2="176" stroke="rgba(6,182,212,0.5)" strokeWidth="1.5" />
          {/* Foot */}
          <ellipse cx="52" cy="176" rx="8" ry="4" fill="rgba(6,182,212,0.7)" />
          <ellipse cx="52" cy="176" rx="9" ry="5" fill="none" stroke="rgba(6,182,212,1)" strokeWidth="1.5" />
        </motion.g>
        
        {/* Right Leg - thicker */}
        <motion.g
          style={{ transformOrigin: "82px 118px" }}
          animate={{ rotate: transforms.rightLeg.rotate, y: transforms.torso.y }}
          transition={{ duration: 1, ease: "easeInOut" }}
        >
          {/* Thigh */}
          <line x1="82" y1="118" x2="86" y2="148" stroke="rgba(6,182,212,0.9)" strokeWidth="5" />
          <line x1="84" y1="120" x2="88" y2="150" stroke="rgba(6,182,212,0.5)" strokeWidth="1.5" />
          {/* Knee joint */}
          <circle cx="86" cy="148" r="4" fill="none" stroke="rgba(6,182,212,1)" strokeWidth="2.5" />
          <circle cx="86" cy="148" r="2" fill="rgba(6,182,212,0.7)" />
          {/* Shin */}
          <line x1="86" y1="148" x2="88" y2="174" stroke="rgba(6,182,212,0.9)" strokeWidth="4" />
          <line x1="87" y1="150" x2="89" y2="176" stroke="rgba(6,182,212,0.5)" strokeWidth="1.5" />
          {/* Foot */}
          <ellipse cx="88" cy="176" rx="8" ry="4" fill="rgba(6,182,212,0.7)" />
          <ellipse cx="88" cy="176" rx="9" ry="5" fill="none" stroke="rgba(6,182,212,1)" strokeWidth="1.5" />
        </motion.g>
      </motion.svg>
    );
  };
  
  return (
    <motion.div 
      className="fixed bottom-8 left-8 z-50 flex flex-col items-center gap-3"
      drag
      dragConstraints={{ top: -window.innerHeight + 300, left: -200, right: window.innerWidth - 300, bottom: 0 }}
      dragMomentum={false}
      dragElastic={0}
      whileHover={{ cursor: "grab" }}
      whileDrag={{ cursor: "grabbing", scale: 1.05 }}
      onDragEnd={(event, info: PanInfo) => {
        // Save the offset, not the absolute position
        setAtlasPosition({ 
          x: atlasPosition.x + info.offset.x, 
          y: atlasPosition.y + info.offset.y 
        });
      }}
      style={{ x: atlasPosition.x, y: atlasPosition.y }}
    >
      {/* Message Bubble */}
      <AnimatePresence>
        {showMessage && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="bg-cyan-500/20 backdrop-blur-xl border border-cyan-500/40 rounded-2xl px-4 py-2 shadow-lg shadow-cyan-500/20"
          >
            <p className="text-sm text-cyan-100 whitespace-nowrap">{message}</p>
            {/* Speech bubble arrow */}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-cyan-500/20 border-r border-b border-cyan-500/40 rotate-45" />
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Atlas Avatar Container */}
      <div className="relative">
        {/* Spinning Network Rings */}
        <motion.div
          className="absolute inset-0 -m-12"
          style={{ rotate: networkRotation }}
        >
          {/* Outer ring */}
          <motion.div
            className="absolute inset-0 border-2 border-cyan-500/30 rounded-full"
            animate={{
              scale: [1, 1.05, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          
          {/* Middle ring */}
          <motion.div
            className="absolute inset-4 border-2 border-blue-500/40 rounded-full"
            animate={{
              scale: [1, 1.08, 1],
              opacity: [0.4, 0.6, 0.4],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.5,
            }}
          />
          
          {/* Inner ring */}
          <motion.div
            className="absolute inset-8 border-2 border-cyan-400/50 rounded-full"
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.5, 0.7, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1,
            }}
          />
          
          {/* Network particles */}
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-cyan-400 rounded-full"
              style={{
                top: "50%",
                left: "50%",
                marginTop: "-4px",
                marginLeft: "-4px",
              }}
              animate={{
                x: [
                  Math.cos((i * Math.PI * 2) / 8) * 60,
                  Math.cos((i * Math.PI * 2) / 8) * 70,
                  Math.cos((i * Math.PI * 2) / 8) * 60,
                ],
                y: [
                  Math.sin((i * Math.PI * 2) / 8) * 60,
                  Math.sin((i * Math.PI * 2) / 8) * 70,
                  Math.sin((i * Math.PI * 2) / 8) * 60,
                ],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.2,
              }}
            />
          ))}
        </motion.div>
        
        {/* Wireframe Avatar */}
        <div className="relative flex items-end justify-center">
          {/* Glow effect */}
          <motion.div
            className="absolute inset-0 bg-cyan-500/20 blur-2xl rounded-full"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          
          {/* Wireframe Human */}
          <WireframeHuman />
        </div>
        
        {/* Status indicator */}
        <motion.div
          className="absolute -top-2 -right-2 w-6 h-6 bg-green-500/30 border-2 border-green-400 rounded-full flex items-center justify-center"
          animate={{
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
        </motion.div>
      </div>
      
      {/* Name label */}
      <div className="text-center">
        <div className="text-xs font-semibold text-cyan-400">ATLAS</div>
        <div className="text-[10px] text-slate-500 uppercase tracking-wider">{pose}</div>
      </div>
    </motion.div>
  );
}