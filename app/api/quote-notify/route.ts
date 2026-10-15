import { customerEmail, operatorEmail, type QuoteRow } from "@/lib/emails";
import { isMailConfigured, notifyOperator, sendMail } from "@/lib/mail";
import { getSupabaseForToken } from "@/lib/supabase";

export async function POST(req: Request) {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const { id } = (await req.json().catch(() => ({}))) as { id?: string };
  if (!token || !id) return Response.json({ ok: false }, { status: 400 });

  const supabase = getSupabaseForToken(token);
  if (!supabase) return Response.json({ ok: false, reason: "not-configured" }, { status: 503 });

  // 접근 규칙 때문에 본인 신청만 조회됨
  const { data, error } = await supabase.from("quote_requests").select("*").eq("id", id).single<QuoteRow>();
  if (error || !data) return Response.json({ ok: false }, { status: 404 });

  if (!isMailConfigured()) {
    return Response.json({ ok: true, mailed: false, reason: "mail-not-configured" });
  }

  const customer = customerEmail(data);
  const customerSent = await sendMail(data.email, customer.subject, customer.html);
  const operatorSent = await notifyOperator(operatorEmail(data));

  return Response.json({ ok: true, mailed: customerSent, operatorMailed: operatorSent });
}
