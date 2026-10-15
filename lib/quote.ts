import type { Region } from "./districts";

export const WORK_TYPES = ["식재", "잔디", "자갈", "디딤석", "화단"] as const;
export const HOUSING_TYPES = ["전원주택", "단독주택", "타운하우스", "기타"] as const;
export const SCOPES = ["자재만", "배송까지", "시공까지", "상담하며 정할게요"] as const;
export const TIMINGS = ["가능한 빠르게", "일주일 안에", "한 달 안에", "일정은 상담 후 정할게요"] as const;
export const WISH_EXAMPLES = [
  "현관으로 들어가는 길만 손보고 싶어요",
  "마당 한편을 가꾸고 싶어요",
  "흙이 드러난 곳을 잔디로 덮고 싶어요",
  "손이 덜 가는 자갈 마당이면 좋겠어요",
  "현관 옆에 작은 화단을 두고 싶어요",
  "담장을 따라 나무를 심고 싶어요",
  "비 오는 날에도 깔끔하게 걷고 싶어요",
  "계절마다 꽃이 보이면 좋겠어요",
] as const;

// 예산 슬라이더 눈금 (만 원)
export const BUDGET_STEPS = [50, 100, 150, 200, 300, 400, 500, 700, 1000, 1500, 2000] as const;
export const budgetLabel = (i: number) => {
  const v = BUDGET_STEPS[i];
  const won = `${v.toLocaleString("ko-KR")}만 원`;
  return i === BUDGET_STEPS.length - 1 ? `${won} 이상` : `${won} 안팎`;
};

// 방문 실측은 필수. 방문할 때 상담도 함께 받을지 고름
export const VISITS = ["실측만 받을게요", "실측하면서 상담도 받을게요"] as const;

export const MAX_PHOTOS = 5;

export type Answers = {
  region?: Region;
  district?: string;
  housing?: string;
  works: string[];
  worksUnknown: boolean;
  scope?: string;
  noPhoto: boolean;
  size?: string; // null 대신 빈 문자열 = 아직 모르겠어요
  sizeUnknown: boolean;
  wish?: string;
  wishPicks?: string[]; // 고른 예시 (화면 복원용)
  timing?: string;
  budget?: string;
  budgetUndecided: boolean;
  visit?: string; // 방문 실측 방식 (실측만 / 실측 + 상담)
  email?: string;
  name: string;
  phone: string;
};

export const emptyAnswers = (): Answers => ({
  works: [],
  worksUnknown: false,
  noPhoto: false,
  sizeUnknown: false,
  budgetUndecided: false,
  name: "",
  phone: "",
});

export const STEPS = [
  "region",
  "district",
  "housing",
  "works",
  "scope",
  "photos",
  "size",
  "wish",
  "timing",
  "budget",
  "visit",
  "email",
  "verify",
  "review",
] as const;

export type Step = (typeof STEPS)[number];
