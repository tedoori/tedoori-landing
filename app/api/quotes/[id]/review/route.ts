import { operatorReviewEmail, type QuoteRow } from "../../../../../lib/emails";
import { notifyOperator } from "../../../../../lib/mail";
import { authorize, fail, isUuid, notFound } from "../../../../../lib/quote-server";

// 시공 후기 남기기 (POST). 시공이 끝난 본인 신청에 1번만 (DB 접근 규칙이 확인)
type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Ctx) {
  const { id } = await params;
  if (!isUuid(id)) return notFound();
  const auth = await authorize(req);
  if (auth instanceof Response) return auth;

  const b = (await req.json().catch(() => ({}))) as { rating?: number; body?: string; allowPublic?: boolean };
  const rating = Number(b.rating);
  const body = typeof b.body === "string" ? b.body.trim().slice(0, 1000) : "";
  if (!(rating >= 1 && rating <= 5)) return fail(400, "invalid", "별점을 골라주세요.");
  if (body.length < 5) return fail(400, "invalid", "후기를 5자 이상 적어주세요.");

  const { error } = await auth.supabase
    .from("quote_reviews")
    .insert({ quote_id: id, user_id: auth.user.id, rating: Math.round(rating), body, allow_public: b.allowPublic === true });
  if (error) {
    if (error.code === "23505") return fail(409, "exists", "이미 후기를 남기셨어요.");
    return fail(403, "closed", "시공이 끝난 뒤에 후기를 남길 수 있어요.");
  }

  const { data: q } = await auth.supabase.from("quote_requests").select("*").eq("id", id).maybeSingle<QuoteRow>();
  if (q) await notifyOperator(operatorReviewEmail(q, Math.round(rating), body, b.allowPublic === true));
  return Response.json({ ok: true });
}
