import { useEffect, useRef, useState } from "react";

interface GooseState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: "left" | "right";
  step: number;
  action: "walk" | "pause" | "peck";
  actionTimer: number;
}

export default function WalkingGoose() {
  const [goose, setGoose] = useState<GooseState>({
    x: 120,
    y: 80,
    vx: 0.8,
    vy: 0.3,
    facing: "right",
    step: 0,
    action: "walk",
    actionTimer: 0,
  });

  const animRef = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let last = performance.now();

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 16, 3);
      last = now;

      setGoose((prev) => {
        const container = containerRef.current;
        const W = container ? container.clientWidth : 800;
        const H = container ? container.clientHeight : 400;

        let { x, y, vx, vy, facing, step, action, actionTimer } = prev;

        actionTimer -= dt;

        if (action === "pause" || action === "peck") {
          if (actionTimer <= 0) {
            action = "walk";
            actionTimer = 60 + Math.random() * 120;
            // Random direction change after pause
            const angle = Math.random() * Math.PI * 2;
            const speed = 0.4 + Math.random() * 0.8;
            vx = Math.cos(angle) * speed;
            vy = Math.sin(angle) * speed * 0.5;
          }
          return { x, y, vx, vy, facing, step, action, actionTimer };
        }

        // Walking
        x += vx * dt;
        y += vy * dt;
        step += dt * 0.15;

        // Bounce off walls
        const margin = 40;
        if (x < margin) { x = margin; vx = Math.abs(vx); }
        if (x > W - margin) { x = W - margin; vx = -Math.abs(vx); }
        if (y < margin) { y = margin; vy = Math.abs(vy); }
        if (y > H - margin) { y = H - margin; vy = -Math.abs(vy); }

        facing = vx >= 0 ? "right" : "left";

        // Random pause or peck
        if (actionTimer <= 0) {
          const r = Math.random();
          if (r < 0.3) {
            action = "peck";
            actionTimer = 40 + Math.random() * 60;
          } else if (r < 0.55) {
            action = "pause";
            actionTimer = 30 + Math.random() * 80;
          } else {
            actionTimer = 80 + Math.random() * 160;
          }
        }

        return { x, y, vx, vy, facing, step, action, actionTimer };
      });

      animRef.current = requestAnimationFrame(tick);
    };

    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  const { x, y, facing, step, action } = goose;
  const flip = facing === "left" ? -1 : 1;

  // Leg animation
  const legSwing = action === "walk" ? Math.sin(step) * 12 : 0;
  // Neck bob
  const neckBob = action === "walk" ? Math.sin(step * 2) * 2 : action === "peck" ? 8 : 0;

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden pointer-events-none"
      aria-hidden="true"
    >
      <svg
        width="72"
        height="72"
        viewBox="0 0 72 72"
        style={{
          position: "absolute",
          left: x - 36,
          top: y - 36,
          transform: `scaleX(${flip})`,
          transition: "none",
          filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.08))",
        }}
      >
        {/* Body */}
        <ellipse cx="36" cy="44" rx="16" ry="12" fill="#f5f0e8" stroke="#1a2e1a" strokeWidth="1.2" />

        {/* Wing */}
        <ellipse
          cx="33"
          cy="44"
          rx="10"
          ry="7"
          fill="#ede8de"
          stroke="#1a2e1a"
          strokeWidth="0.8"
          transform={`rotate(${action === "walk" ? Math.sin(step) * 5 : 0} 36 44)`}
        />

        {/* Neck */}
        <path
          d={`M 36 33 Q ${38 + neckBob} ${28 + neckBob * 0.5} ${36 + neckBob} 20`}
          fill="none"
          stroke="#1a2e1a"
          strokeWidth="6"
          strokeLinecap="round"
          style={{ stroke: "#f5f0e8" }}
        />
        <path
          d={`M 36 33 Q ${38 + neckBob} ${28 + neckBob * 0.5} ${36 + neckBob} 20`}
          fill="none"
          stroke="#1a2e1a"
          strokeWidth="6.5"
          strokeLinecap="round"
          opacity="0.15"
        />

        {/* Head */}
        <ellipse
          cx={36 + neckBob}
          cy={17}
          rx="7"
          ry="6"
          fill="#f5f0e8"
          stroke="#1a2e1a"
          strokeWidth="1.2"
        />

        {/* Eye */}
        <circle cx={38 + neckBob} cy={15} r="1.5" fill="#1a2e1a" />
        <circle cx={38.5 + neckBob} cy={14.5} r="0.5" fill="white" />

        {/* Beak */}
        <path
          d={`M ${42 + neckBob} ${17} L ${47 + neckBob} ${action === "peck" ? 20 : 17} L ${42 + neckBob} ${19}`}
          fill="#d4a843"
          stroke="#1a2e1a"
          strokeWidth="0.8"
        />

        {/* Legs */}
        <g>
          {/* Left leg */}
          <line
            x1="30" y1="55"
            x2={30 - legSwing * 0.5} y2="63"
            stroke="#1a2e1a" strokeWidth="2" strokeLinecap="round"
          />
          <line
            x1={30 - legSwing * 0.5} y1="63"
            x2={25 - legSwing * 0.5} y2="65"
            stroke="#1a2e1a" strokeWidth="1.5" strokeLinecap="round"
          />
          <line
            x1={30 - legSwing * 0.5} y1="63"
            x2={33 - legSwing * 0.5} y2="67"
            stroke="#1a2e1a" strokeWidth="1.5" strokeLinecap="round"
          />

          {/* Right leg */}
          <line
            x1="42" y1="55"
            x2={42 + legSwing * 0.5} y2="63"
            stroke="#1a2e1a" strokeWidth="2" strokeLinecap="round"
          />
          <line
            x1={42 + legSwing * 0.5} y1="63"
            x2={37 + legSwing * 0.5} y2="65"
            stroke="#1a2e1a" strokeWidth="1.5" strokeLinecap="round"
          />
          <line
            x1={42 + legSwing * 0.5} y1="63"
            x2={45 + legSwing * 0.5} y2="67"
            stroke="#1a2e1a" strokeWidth="1.5" strokeLinecap="round"
          />
        </g>

        {/* Tail feathers */}
        <path
          d="M 20 42 Q 14 38 16 44 Q 14 50 20 48"
          fill="#ede8de"
          stroke="#1a2e1a"
          strokeWidth="0.8"
        />
      </svg>
    </div>
  );
}
