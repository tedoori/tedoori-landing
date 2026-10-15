// 테두리가 다루는 자재 (사용자 확인: 올리브·양잔디·마사토 제외, 잔디는 한국잔디만)
export type MatCat = "식재" | "잔디" | "자갈" | "디딤석" | "화단";
export type Mat = { id: string; name: string; cat: MatCat; img: string };

const M = (id: string, name: string, cat: MatCat, file: string): Mat => ({ id, name, cat, img: `/materials/${file}.webp` });

export const MATERIALS: Mat[] = [
  M("pine", "소나무", "식재", "pine"),
  M("maple", "단풍나무", "식재", "maple"),
  M("boxwood", "회양목", "식재", "boxwood"),
  M("zoysia", "한국잔디", "잔디", "zoysia"),
  M("white", "백자갈", "자갈", "white-pebble"),
  M("river", "강자갈", "자갈", "river-pebble"),
  M("crushed", "쇄석", "자갈", "crushed-stone"),
  M("granite", "화강석 판석", "디딤석", "granite"),
  M("basalt", "현무암", "디딤석", "basalt"),
  M("natural", "자연석", "디딤석", "natural-stone"),
  M("lavender", "라벤더", "화단", "lavender"),
  M("hydrangea", "수국", "화단", "hydrangea"),
  M("rose", "장미", "화단", "rose"),
  M("grass", "그라스류", "화단", "grass"),
  M("flowers", "원하는 꽃", "화단", "flowers"),
];

export const MAT_CATS: MatCat[] = ["식재", "잔디", "자갈", "디딤석", "화단"];

export const MAT_NOTE: Partial<Record<MatCat, string>> = {
  자갈: "그 밖의 자갈도 요청할 수 있어요.",
  화단: "심고 싶은 꽃은 무엇이든 말씀해 주세요.",
};

/** 고른 자재로 견적 요청 주소 만들기 */
export function quoteHref(sel: Mat[]) {
  const works = MAT_CATS.filter((c) => sel.some((m) => m.cat === c));
  if (!works.length) return "/quote";
  return `/quote?work=${encodeURIComponent(works.join(","))}&items=${encodeURIComponent(sel.map((m) => m.name).join(","))}`;
}
