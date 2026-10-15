import { authorize, fail, isUuid, notFound, PHOTO_BUCKET, signPhotos, validateQuote } from "../../../../lib/quote-server";

// 견적 신청 상세(GET) · 수정(PATCH) · 삭제(DELETE)
// 다른 사람의 신청이나 없는 주소는 RLS 로 조회되지 않아 똑같이 404 → 존재 여부도 드러나지 않음

type Ctx = { params: Promise<{ id: string }> };

const DETAIL_COLUMNS =
  "id, receipt_no, email, region, district, housing, works, works_unknown, scope, photo_paths, size_note, wish, timing, budget, name, phone, status, created_at, updated_at";

export async function GET(req: Request, { params }: Ctx) {
  const { id } = await params;
  if (!isUuid(id)) return notFound();
  const auth = await authorize(req);
  if (auth instanceof Response) return auth;

  const { data, error } = await auth.supabase.from("quote_requests").select(DETAIL_COLUMNS).eq("id", id).maybeSingle();
  if (error) return fail(500, "load_failed", "신청 내용을 불러오지 못했어요. 잠시 후 다시 시도해주세요.");
  if (!data) return notFound();

  const photos = await signPhotos(auth.supabase, data.photo_paths ?? []);
  return Response.json({ ...data, photos });
}

export async function PATCH(req: Request, { params }: Ctx) {
  const { id } = await params;
  if (!isUuid(id)) return notFound();
  const auth = await authorize(req);
  if (auth instanceof Response) return auth;

  const { data: before } = await auth.supabase.from("quote_requests").select("photo_paths").eq("id", id).maybeSingle();
  if (!before) return notFound();

  const checked = validateQuote(await req.json().catch(() => null), auth.user.id);
  if (!checked.ok) return fail(400, "invalid", "입력한 내용을 다시 확인해주세요.", checked.fields);

  // 접수번호·상태·신청 이메일·작성자·신청일은 validateQuote 가 받지 않으므로 바뀌지 않음
  const { data, error } = await auth.supabase
    .from("quote_requests")
    .update(checked.value)
    .eq("id", id)
    .select("id, updated_at")
    .maybeSingle();
  if (error) return fail(500, "save_failed", "저장하지 못했어요. 잠시 후 다시 시도해주세요.");
  if (!data) return notFound();

  // 수정하면서 뺀 사진은 저장소에서도 정리 (실패해도 수정 결과는 유지)
  const removed = (before.photo_paths ?? []).filter((p: string) => !checked.value.photo_paths.includes(p));
  if (removed.length) await auth.supabase.storage.from(PHOTO_BUCKET).remove(removed);

  return Response.json(data);
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
    .select("photo_paths")
    .maybeSingle();
  if (error) return fail(500, "delete_failed", "삭제하지 못했어요. 잠시 후 다시 시도해주세요.");
  if (!data) return notFound();

  let photosRemoved = true;
  if (data.photo_paths?.length) {
    const { error: rmError } = await auth.supabase.storage.from(PHOTO_BUCKET).remove(data.photo_paths);
    photosRemoved = !rmError;
  }
  return Response.json({ deleted: true, photosRemoved });
}
