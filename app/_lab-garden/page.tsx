"use client";

// 시험판 2: 이글루처럼 3D 공간 안에서 조경 요소가 떠 있다가 스크롤하면 제자리에 내려앉음
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

const GardenWorld = dynamic(() => import("./GardenWorld"), { ssr: false });
const STEPS = ["떠 있는 정원", "디딤석", "자갈", "화단", "식재", "완성"];

export default function LabGarden() {
  const progress = useRef(0);
  const [label, setLabel] = useState(STEPS[0]);
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
    <div style={{ height: "600vh", background: "#dfe5df" }}>
      <div style={{ position: "sticky", top: 0, height: "100vh" }}>
        <GardenWorld progress={progress} />
        <p style={{ position: "absolute", left: 32, bottom: 32, color: "#1d2a22", font: "700 26px/1.2 Pretendard, sans-serif", pointerEvents: "none" }}>{label}</p>
      </div>
    </div>
  );
}
