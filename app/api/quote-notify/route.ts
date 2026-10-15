import { customerEmail, operatorEmail, type QuoteRow } from "@/lib/emails";
import { getSupabaseForToken } from "@/lib/supabase";

async function send(to: string, subject: string, html: string) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.MAIL_FROM,
      to,
      subject,
      html,
      // 고객 회신을 실제로 받을 메일함 (tedoori.com 에는 받는 메일함이 없음)
      ...(process.env.MAIL_REPLY_TO ? { reply_to: process.env.MAIL_REPLY_TO } : {}),
    }),
  });
  return res.ok;
}

export async function POST(req: Request) {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const { id } = (await req.json().catch(() => ({}))) as { id?: string };
  if (!token || !id) return Response.json({ ok: false }, { status: 400 });

  const supabase = getSupabaseForToken(token);
  if (!supabase) return Response.json({ ok: false, reason: "not-configured" }, { status: 503 });

  // 접근 규칙 때문에 본인 신청만 조회됨
  const { data, error } = await supabase.from("quote_requests").select("*").eq("id", id).single<QuoteRow>();
  if (error || !data) return Response.json({ ok: false }, { status: 404 });

  if (!process.env.RESEND_API_KEY || !process.env.MAIL_FROM) {
    return Response.json({ ok: true, mailed: false, reason: "mail-not-configured" });
  }

  const customer = customerEmail(data);
  const customerSent = await send(data.email, customer.subject, customer.html);

  let operatorSent = false;
  if (process.env.OPERATOR_EMAIL) {
    const operator = operatorEmail(data);
    operatorSent = await send(process.env.OPERATOR_EMAIL, operator.subject, operator.html);
  }

  return Response.json({ ok: true, mailed: customerSent, operatorMailed: operatorSent });
}
