// 작업별 사진과 한 줄 설명 (와이어프레임 문구 그대로). 작업 패널과 히어로 사진 위 점이 함께 씀
export const WORKS = [
  { name: "식재", desc: "수목 종류·높이·수량, 심을 위치를 확인해요.", img: "/service/work-plant.webp" },
  { name: "잔디", desc: "대략적인 면적과 기존 바닥 상태를 확인해요.", img: "/service/work-lawn.webp" },
  { name: "자갈", desc: "깔 면적과 용도, 기존 바닥 정리가 필요한지 확인해요.", img: "/service/work-gravel.webp" },
  { name: "디딤석", desc: "걷는 길의 위치·폭과 필요한 수량을 확인해요.", img: "/service/work-stone.webp" },
  { name: "화단", desc: "만들 위치와 크기, 식재할 공간의 상태를 확인해요.", img: "/service/work-bed.webp" },
];

export const WORK_DESC: Record<string, string> = Object.fromEntries(WORKS.map((w) => [w.name, w.desc]));
