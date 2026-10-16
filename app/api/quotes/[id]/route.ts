import { operatorDeleteEmail, operatorUpdateEmail, quoteChanges, type QuoteRow } from "../../../../lib/emails";
import { notifyOperator } from "../../../../lib/mail";
import { authorize, fail, isUuid, notFound, PHOTO_BUCKET, signPhotos, validateQuote } from "../../../../lib/quote-server";

// 견적 신청 상세(GET) · 수정(PATCH) · 삭제(DELETE)
// 다른 사람의 신청이나 없는 주소는 RLS 로 조회되지 않아 똑같이 404 → 존재 여부도 드러나지 않음

type Ctx = { params: Promise<{ id: string }> };

const DETAIL_COLUMNS =
  "id, receipt_no, email, region, district, housing, works, works_unknown, scope, photo_paths, size_note, wish, timing, budget, name, phone, status, visit_at, visit_note, visit_address, visit_address_detail, visit_memo, customer_response, responded_at, build_at, build_note, build_scope, next_title, next_desc, completed_at, completion_note, completion_photos, care_posts, created_at, updated_at";
const ESTIMATE_COLUMNS =
  "id, issued_at, valid_until, vat_included, measure_note, schedule_note, exclusions, site_issues, equipment_cost, waste_cost, extra_labor_cost, extra_note, meals_included, overhead_rate, photo_paths, items:quote_estimate_items(id, sort, work, material, spec, quantity, unit, qty, unit_price, kind, material_cost, delivery_cost, labor_cost, note)";

export async function GET(req: Request, { params }: Ctx) {
  const { id } = await params;
  if (!isUuid(id)) return notFound();
  const auth = await authorize(req);
  if (auth instanceof Response) return auth;

  const { data, error } = await auth.supabase.from("quote_requests").select(DETAIL_COLUMNS).eq("id", id).maybeSingle();
  if (error) return fail(500, "load_failed", "신청 내용을 불러오지 못했어요. 잠시 후 다시 시도해주세요.");
  if (!data) return notFound();

  // 사진·견적서·후기·완료 사진을 한꺼번에 (차례로 기다리지 않게)
  const [photos, { data: est }, { data: review }, completionPhotos] = await Promise.all([
    signPhotos(auth.supabase, data.photo_paths ?? []),
    // 공개된 견적서 중 가장 최근 것. 못 읽으면 견적서 없이 보여줌
    auth.supabase.from("quote_estimates").select(ESTIMATE_COLUMNS).eq("quote_id", id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    auth.supabase.from("quote_reviews").select("rating, body, allow_public, created_at").eq("quote_id", id).maybeSingle(),
    signPhotos(auth.supabase, data.completion_photos ?? []),
  ]);
  const estimate = est
    ? {
        ...est,
        items: [...(est.items ?? [])].sort((a, b) => a.sort - b.sort),
        photos: await signPhotos(auth.supabase, est.photo_paths ?? []),
      }
    : null;

  return Response.json({ ...data, photos, estimate, review: review ?? null, completion_photos: completionPhotos });
}

export async function PATCH(req: Request, { params }: Ctx) {
  const { id } = await params;
  if (!isUuid(id)) return notFound();
  const auth = await authorize(req);
  if (auth instanceof Response) return auth;

  const { data: before } = await auth.supabase.from("quote_requests").select("*").eq("id", id).maybeSingle<QuoteRow>();
  if (!before) return notFound();

  const checked = validateQuote(await req.json().catch(() => null), auth.user.id);
  if (!checked.ok) return fail(400, "invalid", "입력한 내용을 다시 확인해주세요.", checked.fields);

  // 접수번호·상태·신청 이메일·작성자·신청일은 validateQuote 가 받지 않으므로 바뀌지 않음
  const { data: after, error } = await auth.supabase
    .from("quote_requests")
    .update(checked.value)
    .eq("id", id)
    .select("*")
    .maybeSingle<QuoteRow & { updated_at: string }>();
  if (error) return fail(500, "save_failed", "저장하지 못했어요. 잠시 후 다시 시도해주세요.");
  if (!after) return notFound();

  // 수정하면서 뺀 사진은 저장소에서도 정리 (실패해도 수정 결과는 유지)
  const removed = (before.photo_paths ?? []).filter((p: string) => !checked.value.photo_paths.includes(p));
  if (removed.length) await auth.supabase.storage.from(PHOTO_BUCKET).remove(removed);

  // 바뀐 항목이 있으면 운영자에게 전/후 비교 메일 (실패해도 수정은 완료)
  const changed = quoteChanges(before, after).length > 0;
  const operatorMailed = changed ? await notifyOperator(operatorUpdateEmail(before, after)) : false;

  return Response.json({ id: after.id, updated_at: after.updated_at, changed, operatorMailed });
}

export async function DELETE(req: Request, { params }: Ctx) {
  const { id } = await params;
  if (!isUuid(id)) return notFound();
  const auth = await authorize(req);
  if (auth instanceof Response) return auth;

  // 신청을 먼저 지우고(실패하면 데이터는 그대로), 지워진 신청의 사진을 저장소에서 정리
  const { data, error } = await auth.supabase
    .from("quote_requests")
    .delete()
    .eq("id", id)
    .select("*")
    .maybeSingle<QuoteRow>();
  if (error) return fail(500, "delete_failed", "삭제하지 못했어요. 잠시 후 다시 시도해주세요.");
  if (!data) return notFound();

  let photosRemoved = true;
  if (data.photo_paths?.length) {
    const { error: rmError } = await auth.supabase.storage.from(PHOTO_BUCKET).remove(data.photo_paths);
    photosRemoved = !rmError;
  }
  // 운영자에게 취소 알림 (삭제 직전 내용 포함, 실패해도 삭제는 완료)
  const operatorMailed = await notifyOperator(operatorDeleteEmail(data));
  return Response.json({ deleted: true, photosRemoved, operatorMailed });
}
