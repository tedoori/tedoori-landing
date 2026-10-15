// 미니어처 뒤 배경 효과 (강하게 흐린 빛 덩어리)
export type BgStyle = "sand" | "sky" | "mesh" | "bokeh" | "dusk" | "scroll";

const BLOBS: Record<Exclude<BgStyle, "sand">, { c: string; x: number; y: number; s: number }[]> = {
  sky: [
    { c: "#FFFFFF", x: 18, y: 22, s: 38 },
    { c: "#FFFFFF", x: 70, y: 14, s: 30 },
    { c: "#CFE3F2", x: 82, y: 60, s: 44 },
    { c: "#F7E9D6", x: 30, y: 82, s: 46 },
  ],
  mesh: [
    { c: "#9ED9AE", x: 78, y: 30, s: 46 },
    { c: "#1DA049", x: 92, y: 78, s: 34 },
    { c: "#E7DFCF", x: 22, y: 70, s: 52 },
    { c: "#D6E9F2", x: 30, y: 12, s: 40 },
    { c: "#F3E3B8", x: 60, y: 92, s: 36 },
  ],
  bokeh: [
    { c: "#8CCB7E", x: 12, y: 18, s: 22 },
    { c: "#C9E7A6", x: 34, y: 40, s: 16 },
    { c: "#5FAE5B", x: 88, y: 20, s: 26 },
    { c: "#F2E3A2", x: 70, y: 46, s: 18 },
    { c: "#A6D9A0", x: 56, y: 84, s: 28 },
    { c: "#E0F0C8", x: 18, y: 78, s: 20 },
    { c: "#7FBF73", x: 94, y: 88, s: 18 },
  ],
  dusk: [
    { c: "#FFD9B8", x: 80, y: 24, s: 46 },
    { c: "#FFF1D6", x: 68, y: 30, s: 22 },
    { c: "#E8D9F0", x: 18, y: 20, s: 44 },
    { c: "#F6C9B8", x: 30, y: 86, s: 46 },
  ],
  scroll: [
    { c: "#FFFFFF", x: 20, y: 20, s: 36 },
    { c: "#CFE3F2", x: 80, y: 30, s: 44 },
    { c: "#FFD9B8", x: 70, y: 86, s: 46 },
    { c: "#BFE6C8", x: 22, y: 80, s: 40 },
  ],
};

export function YardBackground({ style }: { style: BgStyle }) {
  if (style === "sand") return <div className="ys-bg ys-bg--sand" aria-hidden="true" />;
  return (
    <div className={`ys-bg ys-bg--${style}`} aria-hidden="true">
      {BLOBS[style].map((b, i) => (
        <span
          key={i}
          className="ys-bg__blob"
          style={
            {
              background: b.c,
              left: `${b.x}%`,
              top: `${b.y}%`,
              width: `${b.s}vmax`,
              height: `${b.s}vmax`,
              "--d": `${18 + i * 4}s`,
              "--dx": `${(i % 2 ? -1 : 1) * (3 + i)}vmax`,
              "--dy": `${(i % 3 ? 1 : -1) * (2 + i)}vmax`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
