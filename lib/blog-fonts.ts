// 블로그 편집기에서 고를 수 있는 글꼴 (기본은 사이트 글꼴 Pretendard)
// 구글 글꼴은 그 글꼴을 실제로 쓴 글에서만 불러옴 → 안 쓴 글은 화면이 늦어지지 않음

export const BLOG_FONTS = [
  { label: "나눔고딕", css: "'Nanum Gothic', sans-serif", g: "Nanum+Gothic:wght@400;700;800" },
  { label: "본고딕", css: "'Noto Sans KR', sans-serif", g: "Noto+Sans+KR:wght@400;700" },
  { label: "명조", css: "'Noto Serif KR', serif", g: "Noto+Serif+KR:wght@400;700" },
  { label: "손글씨", css: "'Nanum Pen Script', cursive", g: "Nanum+Pen+Script" },
] as const;

const fontsUrl = (list: readonly { g: string }[]) =>
  list.length ? `https://fonts.googleapis.com/css2?${list.map((f) => "family=" + f.g).join("&")}&display=swap` : null;

/** 본문에 쓰인 글꼴만 담은 주소. 하나도 안 썼으면 null */
export const usedFontsUrl = (html: string) => fontsUrl(BLOG_FONTS.filter((f) => html.includes(f.css.split(",")[0].replace(/'/g, ""))));

/** 편집 화면용: 전부 */
export const allFontsUrl = fontsUrl(BLOG_FONTS)!;
