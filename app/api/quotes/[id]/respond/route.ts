import { operatorResponseEmail, type QuoteRow } from "../../../../../lib/emails";
import { notifyOperator } from "../../../../../lib/mail";
import { authorize, fail, isUuid, notFound } from "../../../../../lib/quote-server";

// 견적 응답 (POST): 진행할게요(go) · 조정 상담(adjust) · 이번엔 보류(hold)
// 상태 변경은 DB 함수 respond_estimate 가 본인·'견적 도착' 상태인지 확인한 뒤에만 함
const CHOICES = ["go", "adjust", "hold"] as const;
type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Ctx) {
  const { id } = await params;
  if (!isUuid(id)) return notFound();
  const auth = await authorize(req);
  if (auth instanceof Response) return auth;

  const body = (await req.json().catch(() => ({}))) as { choice?: string; message?: string; scope?: unknown };
  const choice = CHOICES.find((c) => c === body.choice);
  if (!choice) return fail(400, "invalid", "응답을 골라주세요.");
  const message = typeof body.message === "string" ? body.message.trim().slice(0, 500) : "";

  const PARTS = ["material", "delivery", "labor"];
  const scope = choice === "go" && Array.isArray(body.scope) ? body.scope.filter((p): p is string => typeof p === "string" && PARTS.includes(p)) : null;
  const { error } = await auth.supabase.rpc("respond_estimate", { qid: id, choice, scope: scope?.length ? scope : null });
  if (error) {
    if (/not quoted/.test(error.message)) return fail(409, "closed", "이미 응답했거나 견적 도착 상태가 아니에요.");
    if (/not found/.test(error.message)) return notFound();
    return fail(500, "save_failed", "응답을 저장하지 못했어요. 잠시 후 다시 시도해주세요.");
  }

  const { data: q } = await auth.supabase.from("quote_requests").select("*").eq("id", id).maybeSingle<QuoteRow>();
  if (q) await notifyOperator(operatorResponseEmail(q, choice, message));
  return Response.json({ ok: true, choice });
}
