"use client";

// 시험판: 입자로 이루어진 정원 (확인 후 홈 히어로에 쓸지 결정)
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

const ParticleGarden = dynamic(() => import("./ParticleGarden"), { ssr: false });

const STEPS = ["", "잔디", "디딤석", "자갈", "화단", "식재"];

export default function LabParticles() {
  const progress = useRef(0);
  const [label, setLabel] = useState("");
  useEffect(() => {
    const on = () => {
      const max = document.documentElement.scrollHeight - innerHeight;
      progress.current = max > 0 ? scrollY / max : 0;
      setLabel(STEPS[Math.min(STEPS.length - 1, Math.floor(progress.current * STEPS.length * 0.999))]);
    };
    on();
    addEventListener("scroll", on, { passive: true });
    return () => removeEventListener("scroll", on);
  }, []);
  return (
    <div style={{ height: "700vh", background: "#0d1410" }}>
      <div style={{ position: "sticky", top: 0, height: "100vh" }}>
        <ParticleGarden progress={progress} />
        <p style={{ position: "absolute", left: 32, bottom: 32, color: "#e8f2ea", font: "700 28px/1.2 Pretendard, sans-serif", letterSpacing: "-0.02em", pointerEvents: "none" }}>
          {label || "스크롤해 보세요"}
        </p>
      </div>
    </div>
  );
}
