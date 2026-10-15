import { contactEmail } from "@/lib/emails";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TYPES = new Set(["서비스", "자료 보완", "수정", "취소", "견적", "기타"]);

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as {
    type?: string;
    receiptNo?: string;
    message?: string;
    email?: string;
    phone?: string;
    website?: string;
    elapsed?: number;
  } | null;
  if (!body) return Response.json({ ok: false }, { status: 400 });

  // 자동 등록 프로그램: 숨은 칸을 채웠거나 너무 빨리 보낸 경우 조용히 무시
  if (body.website || (body.elapsed ?? 0) < 3000) return Response.json({ ok: true });

  const message = (body.message ?? "").trim().slice(0, 2000);
  const email = (body.email ?? "").trim().slice(0, 200);
  if (!message || !EMAIL_RE.test(email)) return Response.json({ ok: false }, { status: 400 });

  if (!process.env.RESEND_API_KEY || !process.env.MAIL_FROM || !process.env.OPERATOR_EMAIL) {
    return Response.json({ ok: false, reason: "mail-not-configured" }, { status: 503 });
  }

  const { subject, html } = contactEmail({
    type: TYPES.has(body.type ?? "") ? body.type! : "기타",
    receiptNo: (body.receiptNo ?? "").trim().slice(0, 20),
    message,
    email,
    phone: (body.phone ?? "").trim().slice(0, 20),
  });

  // 운영자에게만 보냄. 운영자가 "답장"하면 문의한 고객에게 바로 감.
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: process.env.MAIL_FROM, to: process.env.OPERATOR_EMAIL, reply_to: email, subject, html }),
  });
  return Response.json({ ok: res.ok }, { status: res.ok ? 200 : 502 });
}
