import { useEffect, useState } from "react";
import logoLapakoo from "../assets/images/logo-lapakoo.png";

interface SplashScreenProps {
  onFinish: () => void;
}

export function SplashScreen({ onFinish }: SplashScreenProps) {
  const [phase, setPhase] = useState<"enter" | "visible" | "exit">("enter");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("visible"), 100);
    const t2 = setTimeout(() => setPhase("exit"), 2400);
    const t3 = setTimeout(() => onFinish(), 2900);

    let frame: number;
    let start: number | null = null;
    const duration = 2200;

    const tick = (now: number) => {
      if (!start) start = now;
      const elapsed = now - start;
      setProgress(Math.min((elapsed / duration) * 100, 100));
      if (elapsed < duration) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      cancelAnimationFrame(frame);
    };
  }, [onFinish]);

  return (
    <>
      <style>{`
        @keyframes splash-float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes splash-glow-pulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.08); }
        }
        @keyframes splash-dot-bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-8px); opacity: 1; }
        }
        @keyframes splash-shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes splash-ring-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes splash-ring-spin-rev {
          from { transform: rotate(0deg); }
          to { transform: rotate(-360deg); }
        }
        @keyframes splash-orb-drift {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(20px, -15px) scale(1.05); }
          66% { transform: translate(-10px, 10px) scale(0.95); }
        }
        @keyframes splash-fade-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes splash-scale-in {
          from { opacity: 0; transform: scale(0.7); }
          to { opacity: 1; transform: scale(1); }
        }

        .splash-float { animation: splash-float 3s ease-in-out infinite; }
        .splash-glow { animation: splash-glow-pulse 2s ease-in-out infinite; }
        .splash-orb { animation: splash-orb-drift 8s ease-in-out infinite; }
        .splash-ring-1 { animation: splash-ring-spin 8s linear infinite; }
        .splash-ring-2 { animation: splash-ring-spin-rev 6s linear infinite; }
        .splash-shimmer-text {
          background: linear-gradient(
            90deg,
            #a5b4fc 0%,
            #ffffff 30%,
            #c4b5fd 50%,
            #ffffff 70%,
            #a5b4fc 100%
          );
          background-size: 200% auto;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: splash-shimmer 3s linear infinite;
        }
        .splash-dot-1 { animation: splash-dot-bounce 1.2s ease-in-out infinite 0ms; }
        .splash-dot-2 { animation: splash-dot-bounce 1.2s ease-in-out infinite 200ms; }
        .splash-dot-3 { animation: splash-dot-bounce 1.2s ease-in-out infinite 400ms; }

        .splash-anim-logo {
          animation: splash-scale-in 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        .splash-anim-title {
          animation: splash-fade-up 0.6s ease-out 0.3s both;
        }
        .splash-anim-sub {
          animation: splash-fade-up 0.6s ease-out 0.5s both;
        }
        .splash-anim-footer {
          animation: splash-fade-up 0.6s ease-out 0.7s both;
        }
        .splash-anim-progress {
          animation: splash-fade-up 0.5s ease-out 0.8s both;
        }
      `}</style>

      <div
        className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)",
          opacity: phase === "exit" ? 0 : 1,
          transition: phase === "exit" ? "opacity 0.5s ease-out" : "opacity 0.3s ease-in",
        }}
      >
        {/* Background orbs */}
        <div
          className="splash-orb absolute top-[-80px] left-[-80px] w-72 h-72 rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(99,102,241,0.35) 0%, transparent 70%)",
            filter: "blur(20px)",
          }}
        />
        <div
          className="splash-orb absolute bottom-[-60px] right-[-60px] w-80 h-80 rounded-full pointer-events-none"
          style={{
            animationDelay: "-4s",
            background: "radial-gradient(circle, rgba(139,92,246,0.3) 0%, transparent 70%)",
            filter: "blur(20px)",
          }}
        />
        <div
          className="absolute top-1/3 right-[10%] w-40 h-40 rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(79,70,229,0.2) 0%, transparent 70%)",
            filter: "blur(30px)",
          }}
        />

        {/* Main content */}
        <div className="flex flex-col items-center gap-6 px-8">
          {/* Logo container with rings */}
          <div className="relative splash-float">
            {/* Outer glow ring */}
            <div
              className="splash-glow absolute inset-0 rounded-full pointer-events-none"
              style={{
                background: "radial-gradient(circle, rgba(99,102,241,0.5) 0%, transparent 70%)",
                margin: "-32px",
                filter: "blur(8px)",
              }}
            />

            {/* Spinning ring 1 */}
            <div
              className="splash-ring-1 absolute pointer-events-none"
              style={{
                inset: "-20px",
                borderRadius: "50%",
                border: "1.5px solid transparent",
                borderTopColor: "rgba(99,102,241,0.6)",
                borderRightColor: "rgba(139,92,246,0.3)",
              }}
            />

            {/* Spinning ring 2 */}
            <div
              className="splash-ring-2 absolute pointer-events-none"
              style={{
                inset: "-32px",
                borderRadius: "50%",
                border: "1px solid transparent",
                borderTopColor: "rgba(167,139,250,0.4)",
                borderLeftColor: "rgba(99,102,241,0.2)",
              }}
            />

            {/* Logo image */}
            <div
              className="splash-anim-logo relative w-32 h-32 rounded-3xl flex items-center justify-center"
              style={{
                background: "#ffffff",
                boxShadow: "0 24px 64px rgba(99,102,241,0.5), 0 0 0 2px rgba(99,102,241,0.2), 0 2px 8px rgba(0,0,0,0.3)",
              }}
            >
              <img
                src={logoLapakoo}
                alt="Lapakoo"
                className="w-24 h-24 object-contain"
              />
            </div>
          </div>

          {/* App name */}
          <div className="text-center space-y-2 splash-anim-title">
            <h1 className="splash-shimmer-text text-5xl font-black tracking-tight" style={{ fontFamily: "system-ui, sans-serif" }}>
              Lapakoo
            </h1>
            <p className="text-indigo-300/80 text-sm font-medium tracking-widest uppercase">
              Platform Jualan Terpadu
            </p>
          </div>

          {/* Tagline */}
          <p className="splash-anim-sub text-center text-white/40 text-xs max-w-[220px] leading-relaxed">
            Kelola toko, produk, dan pesanan Anda dengan mudah dalam satu platform
          </p>

          {/* Loading dots */}
          <div className="flex gap-2 mt-2">
            <span className="splash-dot-1 w-2 h-2 rounded-full bg-indigo-400 inline-block" />
            <span className="splash-dot-2 w-2 h-2 rounded-full bg-purple-400 inline-block" />
            <span className="splash-dot-3 w-2 h-2 rounded-full bg-violet-400 inline-block" />
          </div>
        </div>

        {/* Progress bar */}
        <div className="splash-anim-progress absolute bottom-20 left-1/2 -translate-x-1/2 w-40">
          <div
            className="h-0.5 rounded-full overflow-hidden"
            style={{ background: "rgba(255,255,255,0.1)" }}
          >
            <div
              className="h-full rounded-full transition-all duration-100"
              style={{
                width: `${progress}%`,
                background: "linear-gradient(90deg, #6366f1, #a78bfa, #8b5cf6)",
              }}
            />
          </div>
        </div>

        {/* Footer: PT info */}
        <div
          className="splash-anim-footer absolute bottom-8 flex flex-col items-center gap-1"
        >
          <div className="flex items-center gap-2">
            <div className="h-px w-8 bg-white/10" />
            <span className="text-white/30 text-[10px] tracking-wider uppercase">Dipersembahkan oleh</span>
            <div className="h-px w-8 bg-white/10" />
          </div>
          <span className="text-white/50 text-xs font-semibold tracking-wide">
            PT Ken Solusindo
          </span>
        </div>
      </div>
    </>
  );
}
