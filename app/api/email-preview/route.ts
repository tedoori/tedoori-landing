import { customerEmail, operatorEmail, type QuoteRow } from "@/lib/emails";

// 개발 중에만 쓰는 메일 미리보기: /api/email-preview?kind=customer 또는 operator
const SAMPLE: QuoteRow = {
  id: "sample",
  receipt_no: "TD-2610-0001",
  email: "customer@example.com",
  region: "경기",
  district: "양평군",
  housing: "전원주택",
  works: ["디딤석", "화단"],
  works_unknown: false,
  scope: "시공까지",
  photo_paths: ["a", "b"],
  size_note: "현관 앞 길 약 4m",
  wish: "비가 오면 현관 앞 흙을 밟게 돼요. 이 길에 디딤석을 놓고 싶어요.",
  timing: "한 달 안에",
  budget: null,
  name: "예시 고객",
  phone: "010-0000-0000",
  created_at: new Date().toISOString(),
};

export function GET(req: Request) {
  if (process.env.NODE_ENV !== "development") return new Response("Not found", { status: 404 });
  const kind = new URL(req.url).searchParams.get("kind");
  const { html } = kind === "operator" ? operatorEmail(SAMPLE) : customerEmail(SAMPLE);
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
