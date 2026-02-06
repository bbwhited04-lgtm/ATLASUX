import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";

type JobTaskType = "analyzing" | "processing" | "syncing" | "computing" | "idle";

export function PlutoGlobe() {
  const [isBusy, setIsBusy] = useState(false);
  const [position, setPosition] = useState({ x: window.innerWidth * 0.8, y: window.innerHeight * 0.2 });
  const [targetPosition, setTargetPosition] = useState({ x: window.innerWidth * 0.8, y: window.innerHeight * 0.2 });
  const [rotation, setRotation] = useState(0);
  const [currentTask, setCurrentTask] = useState<JobTaskType>("idle");
  const [taskWaypoints, setTaskWaypoints] = useState<Array<{x: number, y: number}>>([]);
  const [currentWaypoint, setCurrentWaypoint] = useState(0);
  
  // Continuous rotation (slower for more deliberate feel)
  useEffect(() => {
    const interval = setInterval(() => {
      setRotation(prev => (prev + 0.5) % 360); // Slower rotation
    }, 40);
    
    return () => clearInterval(interval);
  }, []);
  
  // Job-focused movement patterns - move across ENTIRE desktop (all 3 screens)
  const generateJobWaypoints = (taskType: JobTaskType) => {
    // Get full desktop dimensions (all screens combined)
    const totalWidth = window.screen.width * (window.screen.availWidth / window.screen.width);
    const totalHeight = window.screen.height;
    
    // Use much larger range to cover multiple monitors
    const w = totalWidth * 3; // Assume up to 3 monitors
    const h = totalHeight - 150;
    
    switch (taskType) {
      case "analyzing":
        // Circle pattern across ALL screens
        return [
          { x: w * 0.16, y: h * 0.3 },  // Left screen
          { x: w * 0.33, y: h * 0.5 },  // Left-center
          { x: w * 0.5, y: h * 0.7 },   // Center screen
          { x: w * 0.66, y: h * 0.5 },  // Right-center
          { x: w * 0.83, y: h * 0.3 },  // Right screen
          { x: w * 0.5, y: h * 0.2 },   // Back to center
        ];
      case "processing":
        // Diagonal sweep across ALL three screens
        return [
          { x: w * 0.1, y: h * 0.2 },   // Far left
          { x: w * 0.3, y: h * 0.4 },   // Left screen
          { x: w * 0.5, y: h * 0.5 },   // Center screen
          { x: w * 0.7, y: h * 0.6 },   // Right screen
          { x: w * 0.9, y: h * 0.8 },   // Far right
          { x: w * 0.5, y: h * 0.3 },   // Back center
        ];
      case "syncing":
        // Back and forth across ALL THREE screens
        return [
          { x: w * 0.05, y: h * 0.5 },  // Far left screen
          { x: w * 0.5, y: h * 0.5 },   // Center screen
          { x: w * 0.95, y: h * 0.5 },  // Far right screen
          { x: w * 0.5, y: h * 0.5 },   // Back to center
          { x: w * 0.05, y: h * 0.5 },  // Far left again
        ];
      case "computing":
        // Z-pattern across all three screens
        return [
          { x: w * 0.05, y: h * 0.2 },  // Top left
          { x: w * 0.5, y: h * 0.2 },   // Top center
          { x: w * 0.95, y: h * 0.2 },  // Top right
          { x: w * 0.05, y: h * 0.5 },  // Mid left
          { x: w * 0.5, y: h * 0.5 },   // Mid center
          { x: w * 0.95, y: h * 0.5 },  // Mid right
          { x: w * 0.05, y: h * 0.8 },  // Bottom left
          { x: w * 0.5, y: h * 0.8 },   // Bottom center
          { x: w * 0.95, y: h * 0.8 },  // Bottom right
        ];
      default:
        // Idle patrol pattern - gentle floating across screens
        return [
          { x: w * 0.3, y: h * 0.3 },   // Left screen
          { x: w * 0.5, y: h * 0.4 },   // Center screen
          { x: w * 0.7, y: h * 0.3 },   // Right screen
          { x: w * 0.5, y: h * 0.6 },   // Back to center
        ];
    }
  };
  
  // Simulate random job tasks
  useEffect(() => {
    const taskInterval = setInterval(() => {
      if (!isBusy) {
        const tasks: JobTaskType[] = ["analyzing", "processing", "syncing", "computing", "idle"];
        const randomTask = tasks[Math.floor(Math.random() * tasks.length)];
        
        // 40% chance of starting a job
        if (Math.random() > 0.6 && randomTask !== "idle") {
          setCurrentTask(randomTask);
          setIsBusy(true);
          setTaskWaypoints(generateJobWaypoints(randomTask));
          setCurrentWaypoint(0);
          
          // Job duration: 15-30 seconds
          const duration = 15000 + Math.random() * 15000;
          setTimeout(() => {
            setIsBusy(false);
            setCurrentTask("idle");
            setTaskWaypoints(generateJobWaypoints("idle"));
            setCurrentWaypoint(0);
          }, duration);
        }
      }
    }, 8000); // Check every 8 seconds
    
    // Initialize idle movement
    setTaskWaypoints(generateJobWaypoints("idle"));
    
    return () => clearInterval(taskInterval);
  }, [isBusy]);
  
  // Slower, more deliberate waypoint navigation
  useEffect(() => {
    if (taskWaypoints.length === 0) return;
    
    const moveInterval = setInterval(() => {
      const target = taskWaypoints[currentWaypoint];
      if (target) {
        setTargetPosition(target);
        
        // Move to next waypoint after reaching current one
        const distanceToTarget = Math.hypot(
          target.x - position.x,
          target.y - position.y
        );
        
        // If close enough to target, move to next waypoint
        if (distanceToTarget < 50) {
          setCurrentWaypoint((prev) => (prev + 1) % taskWaypoints.length);
        }
      }
    }, isBusy ? 2000 : 4000); // Slower waypoint transitions (2-4 seconds per waypoint)
    
    return () => clearInterval(moveInterval);
  }, [taskWaypoints, currentWaypoint, position, isBusy]);
  
  // Smooth position interpolation
  useEffect(() => {
    const interpolateInterval = setInterval(() => {
      setPosition(prev => {
        const dx = targetPosition.x - prev.x;
        const dy = targetPosition.y - prev.y;
        const distance = Math.hypot(dx, dy);
        
        if (distance < 1) return targetPosition;
        
        // Slower movement speed for more deliberate feel
        const speed = isBusy ? 0.5 : 0.3; // Even slower
        
        return {
          x: prev.x + (dx / distance) * Math.min(speed, distance),
          y: prev.y + (dy / distance) * Math.min(speed, distance),
        };
      });
    }, 16); // 60fps
    
    return () => clearInterval(interpolateInterval);
  }, [targetPosition, isBusy]);
  
  // Expose function to trigger busy state
  useEffect(() => {
    (window as any).plutoStartTask = () => {
      setIsBusy(true);
      setCurrentTask("processing");
      setTaskWaypoints(generateJobWaypoints("processing"));
      setCurrentWaypoint(0);
    };
    (window as any).plutoStopTask = () => {
      setIsBusy(false);
      setCurrentTask("idle");
      setTaskWaypoints(generateJobWaypoints("idle"));
      setCurrentWaypoint(0);
    };
    return () => {
      delete (window as any).plutoStartTask;
      delete (window as any).plutoStopTask;
    };
  }, []);
  
  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      // Regenerate waypoints on resize
      setTaskWaypoints(generateJobWaypoints(currentTask));
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [currentTask]);
  
  // Wireframe Globe Component
  const WireframeGlobe = () => {
    return (
      <svg width="100" height="100" viewBox="0 0 100 100" className="drop-shadow-[0_0_20px_rgba(59,130,246,0.7)]">
        {/* Main sphere outline */}
        <motion.circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="rgba(59,130,246,0.9)"
          strokeWidth="2.5"
          animate={{
            opacity: [0.8, 1, 0.8],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
          }}
        />
        
        {/* Horizontal latitude lines */}
        {[-30, -15, 0, 15, 30].map((offset, i) => (
          <motion.ellipse
            key={`lat-${i}`}
            cx="50"
            cy={50 + offset}
            rx={45 - Math.abs(offset) * 0.5}
            ry={offset === 0 ? 10 : 8 - Math.abs(offset) * 0.15}
            fill="none"
            stroke="rgba(59,130,246,0.6)"
            strokeWidth="1.5"
            animate={{
              opacity: [0.5, 0.8, 0.5],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}
        
        {/* Rotating longitude lines with 3D effect */}
        <g>
          {[0, 60, 120, 180, 240, 300].map((angle, i) => {
            const rad = ((angle + rotation) * Math.PI) / 180;
            const x1 = 50 + Math.cos(rad) * 45;
            const y1 = 5;
            const x2 = 50 + Math.cos(rad) * 45;
            const y2 = 95;
            const opacity = Math.abs(Math.cos(rad)) * 0.7 + 0.3;
            
            return (
              <motion.line
                key={`vline-${i}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="rgba(59,130,246,0.8)"
                strokeWidth="1.5"
                opacity={opacity}
                animate={{
                  opacity: [opacity * 0.6, opacity, opacity * 0.6],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  delay: i * 0.15,
                }}
              />
            );
          })}
        </g>
        
        {/* Equator highlight */}
        <motion.ellipse
          cx="50"
          cy="50"
          rx="45"
          ry="10"
          fill="none"
          stroke="rgba(59,130,246,1)"
          strokeWidth="2.5"
          animate={{
            opacity: [0.7, 1, 0.7],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
          }}
        />
        
        {/* Poles */}
        <motion.circle
          cx="50"
          cy="5"
          r="4"
          fill="rgba(59,130,246,0.9)"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.7, 1, 0.7],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
          }}
        />
        <motion.circle
          cx="50"
          cy="95"
          r="4"
          fill="rgba(59,130,246,0.9)"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.7, 1, 0.7],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: 1,
          }}
        />
        
        {/* Inner glow */}
        <motion.circle
          cx="50"
          cy="50"
          r="25"
          fill="rgba(59,130,246,0.15)"
          animate={{
          scale: [0.8, 1.2, 0.8],
            opacity: [0.1, 0.3, 0.1],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
          }}
        />
        
        {/* Core dot */}
        <motion.circle
          cx="50"
          cy="50"
          r="5"
          fill="rgba(59,130,246,1)"
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.8, 1, 0.8],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
          }}
        />
      </svg>
    );
  };
  
  const getTaskLabel = () => {
    switch (currentTask) {
      case "analyzing":
        return "Analyzing Data";
      case "processing":
        return "Processing Job";
      case "syncing":
        return "Syncing Files";
      case "computing":
        return "Computing Results";
      default:
        return "Idle Patrol";
    }
  };
  
  const getTaskColor = () => {
    switch (currentTask) {
      case "analyzing":
        return "text-purple-400";
      case "processing":
        return "text-cyan-400";
      case "syncing":
        return "text-green-400";
      case "computing":
        return "text-yellow-400";
      default:
        return "text-blue-400";
    }
  };
  
  return (
    <motion.div
      className="fixed z-40 pointer-events-none"
      animate={{
        x: position.x,
        y: position.y,
      }}
      transition={{
        type: "spring",
        damping: 30, // More damping for smoother, slower movement
        stiffness: 20, // Lower stiffness for more deliberate movement
        mass: 2, // Add mass for heavier, more purposeful feel
      }}
    >
      <motion.div
        className="relative"
        animate={{
          scale: isBusy ? [1, 1.05, 1] : [1, 1.02, 1],
          y: isBusy ? [0, -8, 0] : [0, -4, 0], // Gentler bounce
        }}
        transition={{
          duration: isBusy ? 2 : 3, // Slower animation
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        {/* Outer glow rings when busy */}
        <AnimatePresence>
          {isBusy && (
            <>
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1.6, opacity: 0 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeOut",
                }}
                className="absolute inset-0 border-4 border-blue-500 rounded-full -m-10"
              />
              
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 2, opacity: 0 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: "easeOut",
                  delay: 0.5,
                }}
                className="absolute inset-0 border-4 border-cyan-500 rounded-full -m-10"
              />
            </>
          )}
        </AnimatePresence>
        
        {/* Main Globe */}
        <div className="relative">
          {/* Glow effect */}
          <motion.div
            className="absolute inset-0 -m-6 bg-blue-500/30 blur-2xl rounded-full"
            animate={{
              scale: [1, 1.4, 1],
              opacity: isBusy ? [0.5, 0.9, 0.5] : [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: isBusy ? 2 : 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          
          {/* Wireframe Globe */}
          <WireframeGlobe />
          
          {/* Energy particles when busy */}
          {isBusy && (
            <>
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 bg-cyan-400 rounded-full"
                  style={{
                    top: "50%",
                    left: "50%",
                  }}
                  animate={{
                    x: [
                      0,
                      Math.cos((i * Math.PI * 2) / 8) * 50,
                    ],
                    y: [
                      0,
                      Math.sin((i * Math.PI * 2) / 8) * 50,
                    ],
                    opacity: [1, 0],
                    scale: [1, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeOut",
                    delay: i * 0.2,
                  }}
                />
              ))}\n            </>
          )}
        </div>
        
        {/* Status indicator */}
        <AnimatePresence>
          {isBusy && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute -top-2 -right-2 bg-blue-500 text-white text-[9px] px-2 py-1 rounded-full font-bold shadow-xl"
            >
              ACTIVE
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      
      {/* Name label and task status */}
      <motion.div
        className="absolute -bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap"
        animate={{
          opacity: isBusy ? 1 : 0.6,
        }}
      >
        <div className="text-[11px] font-bold text-blue-400 text-center tracking-wider">PLUTO</div>
        <div className="text-[9px] text-slate-400 text-center">Job Runner</div>
        {isBusy && (
          <motion.div
            className={`text-[9px] ${getTaskColor()} text-center font-medium mt-1`}
            animate={{
              opacity: [0.6, 1, 0.6],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
            }}
          >
            {getTaskLabel()}
          </motion.div>
        )}
      </motion.div>
      
      {/* Directional trail when busy */}
      {isBusy && (
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full"
          style={{
            background: "radial-gradient(ellipse at center, rgba(59,130,246,0.3) 0%, transparent 70%)",
            rotate: Math.atan2(
              targetPosition.y - position.y,
              targetPosition.x - position.x
            ) * (180 / Math.PI) - 90,
          }}
          animate={{
            opacity: [0.4, 0.7, 0.4],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
          }}
        />
      )}
    </motion.div>
  );
}