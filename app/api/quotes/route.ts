import { authorize, fail, PAGE_SIZE, validateQuote } from "../../../lib/quote-server";

// 견적 신청 목록(GET) · 등록(POST)
// 이메일 인증 토큰을 Authorization 헤더로 받아, 그 사용자 권한(RLS)으로만 처리

const LIST_COLUMNS = "id, receipt_no, region, district, housing, works, works_unknown, status, visit_at, build_at, created_at, updated_at, reviews:quote_reviews(rating)";

export async function GET(req: Request) {
  const auth = await authorize(req);
  if (auth instanceof Response) return auth;

  const page = Math.max(1, Number(new URL(req.url).searchParams.get("page")) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const { data, count, error } = await auth.supabase
    .from("quote_requests")
    .select(LIST_COLUMNS, { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);

  if (error) return fail(500, "load_failed", "신청 목록을 불러오지 못했어요. 잠시 후 다시 시도해주세요.");
  const total = count ?? 0;
  return Response.json({
    email: auth.user.email,
    items: data ?? [],
    page,
    pageSize: PAGE_SIZE,
    total,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  });
}

export async function POST(req: Request) {
  const auth = await authorize(req);
  if (auth instanceof Response) return auth;

  const body = await req.json().catch(() => null);
  const checked = validateQuote(body, auth.user.id);
  if (!checked.ok) return fail(400, "invalid", "입력한 내용을 다시 확인해주세요.", checked.fields);
  if ((body as { agreed?: unknown })?.agreed !== true)
    return fail(400, "invalid", "약관과 개인정보 처리방침에 동의해주세요.", { agreed: "동의가 필요해요." });

  const now = new Date().toISOString();
  const { data, error } = await auth.supabase
    .from("quote_requests")
    .insert({
      ...checked.value,
      user_id: auth.user.id,
      email: auth.user.email,
      privacy_agreed_at: now,
      terms_agreed_at: now,
    })
    .select("id, receipt_no")
    .single();

  if (error || !data) return fail(500, "save_failed", "접수하지 못했어요. 잠시 후 다시 시도해주세요.");
  return Response.json(data, { status: 201 });
}
