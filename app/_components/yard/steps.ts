// 스크롤 진행(0~1) 구간별 장면. start/end 는 전체 진행도 기준.
export type YardStep = {
  id: "intro" | "디딤석" | "잔디" | "자갈" | "화단" | "식재" | "outro";
  start: number;
  end: number;
  title: string;
  body: string;
};

export const YARD_STEPS: YardStep[] = [
  {
    id: "intro",
    start: 0,
    end: 0.1,
    title: "정원 전체 말고,\n필요한 곳부터.",
    body: "현관·마당 한편·집의 경계에서 바꾸고 싶은 작업만 골라보세요.",
  },
  {
    id: "잔디",
    start: 0.1,
    end: 0.25,
    title: "흙이 드러난 곳엔\n잔디를.",
    body: "대략적인 면적만 알려주시면 돼요.",
  },
  {
    id: "디딤석",
    start: 0.25,
    end: 0.4,
    title: "현관까지 가는 길엔\n디딤석을.",
    body: "비 오는 날에도 흙을 밟지 않게 길을 놓아요.",
  },
  {
    id: "자갈",
    start: 0.4,
    end: 0.55,
    title: "손 덜 가는 곳은\n자갈로.",
    body: "깔 면적과 바닥 정리가 필요한지 함께 확인해요.",
  },
  {
    id: "화단",
    start: 0.55,
    end: 0.7,
    title: "현관 옆에는\n작은 화단을.",
    body: "만들 위치와 크기만 정하면 돼요.",
  },
  {
    id: "식재",
    start: 0.7,
    end: 0.85,
    title: "마지막으로\n나무 몇 그루.",
    body: "수목 종류와 높이, 심을 위치를 확인해요.",
  },
  {
    id: "outro",
    start: 0.85,
    end: 1.0001,
    title: "고른 만큼만,\n항목별 견적으로.",
    body: "자재비·배송비·시공비를 나눠서 받아보세요.\n견적 요청은 무료예요.",
  },
];

export const WORK_STEP_IDS = ["잔디", "디딤석", "자갈", "화단", "식재"] as const;

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** 해당 작업이 나타나는 정도 (0~1). 단계 구간의 앞 70% 동안 자라남. */
export function appearOf(id: (typeof WORK_STEP_IDS)[number], p: number) {
  const s = YARD_STEPS.find((x) => x.id === id)!;
  return clamp01((p - s.start) / ((s.end - s.start) * 0.7));
}

export function stepIndexAt(p: number) {
  const i = YARD_STEPS.findIndex((s) => p >= s.start && p < s.end);
  return i < 0 ? YARD_STEPS.length - 1 : i;
}
