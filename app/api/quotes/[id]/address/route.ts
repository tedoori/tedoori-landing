import { operatorAddressEmail, type QuoteRow } from "../../../../../lib/emails";
import { notifyOperator } from "../../../../../lib/mail";
import { authorize, fail, isUuid, notFound } from "../../../../../lib/quote-server";

// 방문 주소 저장 (PUT). 진행이 끝나지 않은 신청이면 미리 받음
const OPEN = ["received", "checking", "visit", "needs"];
const clean = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: Ctx) {
  const { id } = await params;
  if (!isUuid(id)) return notFound();
  const auth = await authorize(req);
  if (auth instanceof Response) return auth;

  const { data: q } = await auth.supabase.from("quote_requests").select("*").eq("id", id).maybeSingle<QuoteRow & { status: string }>();
  if (!q) return notFound();
  if (!OPEN.includes(q.status)) return fail(409, "closed", "지금은 방문 주소를 받지 않는 단계예요.");

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const address = clean(body.address, 200);
  const detail = clean(body.detail, 100);
  const memo = clean(body.memo, 300);
  if (body.agree !== true) return fail(400, "consent", "방문 주소 수집·이용에 동의해주세요.", { agree: "동의가 필요해요." });
  if (address.length < 5) return fail(400, "invalid", "주소 검색으로 주소를 골라주세요.", { address: "주소를 골라주세요." });

  const { error } = await auth.supabase
    .from("quote_requests")
    .update({ visit_address: address, visit_address_detail: detail || null, visit_memo: memo || null, visit_address_agreed_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return fail(500, "save_failed", "주소를 저장하지 못했어요. 잠시 후 다시 시도해주세요.");

  await notifyOperator(operatorAddressEmail(q, { address, detail, memo }));
  return Response.json({ ok: true });
}
