import type { SupabaseClient, User } from "@supabase/supabase-js";
import { REGIONS } from "./districts";
import { HOUSING_TYPES, MAX_PHOTOS, SCOPES, TIMINGS, WORK_TYPES } from "./quote";
import { getSupabaseForToken } from "./supabase";

// 견적 신청 API(Route Handler) 공통: 로그인 확인 · 입력 검증 · 응답 모양

export const PHOTO_BUCKET = "quote-photos";
export const PAGE_SIZE = 10;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PHONE_RE = /^01[016789]\d{7,8}$/;

export const isUuid = (v: string) => UUID_RE.test(v);

export function fail(status: number, code: string, message: string, fields?: Record<string, string>) {
  return Response.json({ error: { code, message, ...(fields ? { fields } : {}) } }, { status });
}

/** 존재하지 않거나 본인 것이 아닌 신청: 정보가 드러나지 않도록 같은 응답 */
export const notFound = () => fail(404, "not_found", "신청을 찾을 수 없어요.");

/**
 * 요청의 Authorization 헤더(이메일 인증 후 받은 토큰)로 사용자를 확인하고,
 * 그 사용자 권한으로 Supabase 에 접속한 클라이언트를 돌려줌 → RLS 가 본인 신청만 허용
 */
export async function authorize(
  req: Request,
): Promise<{ supabase: SupabaseClient; user: User } | Response> {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return fail(401, "unauthorized", "이메일 인증이 필요해요.");
  const supabase = getSupabaseForToken(token);
  if (!supabase) return fail(503, "not_configured", "접수 설정이 아직 준비되지 않았어요.");
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user?.email) return fail(401, "unauthorized", "이메일 인증이 만료됐어요. 다시 확인해주세요.");
  return { supabase, user: data.user };
}

export type QuoteInput = {
  region: string;
  district: string;
  housing: string;
  works: string[];
  works_unknown: boolean;
  scope: string;
  photo_paths: string[];
  size_note: string | null;
  wish: string | null;
  timing: string;
  budget: string | null;
  name: string;
  phone: string;
};

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const optStr = (v: unknown, max: number) => str(v, max) || null;
const oneOf = (list: readonly string[], v: string) => list.includes(v);

/**
 * 등록·수정 입력 검증. 사용자가 바꿀 수 없는 값(user_id, email, receipt_no, status, created_at)은
 * 여기서 받지 않으므로 요청에 들어 있어도 무시됨
 */
export function validateQuote(
  body: unknown,
  userId: string,
): { ok: true; value: QuoteInput } | { ok: false; fields: Record<string, string> } {
  const b = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const fields: Record<string, string> = {};

  const region = str(b.region, 10);
  if (!oneOf(REGIONS, region)) fields.region = "서울·경기·인천 중에서 골라주세요.";
  const district = str(b.district, 30);
  if (!district) fields.district = "시·군·구를 골라주세요.";
  const housing = str(b.housing, 20);
  if (!oneOf(HOUSING_TYPES, housing)) fields.housing = "주거 형태를 골라주세요.";

  const works_unknown = b.works_unknown === true;
  const works = Array.isArray(b.works) ? [...new Set(b.works.map((w) => str(w, 10)))] : [];
  if (works.some((w) => !oneOf(WORK_TYPES, w))) fields.works = "작업 종류를 다시 골라주세요.";
  else if (!works_unknown && works.length === 0) fields.works = "필요한 작업을 하나 이상 골라주세요.";

  const scope = str(b.scope, 20);
  if (!oneOf(SCOPES, scope)) fields.scope = "맡길 범위를 골라주세요.";

  const photo_paths = Array.isArray(b.photo_paths) ? b.photo_paths.map((p) => str(p, 200)) : [];
  if (photo_paths.length > MAX_PHOTOS) fields.photo_paths = `사진은 ${MAX_PHOTOS}장까지 올릴 수 있어요.`;
  else if (photo_paths.some((p) => !p.startsWith(`${userId}/`) || p.includes("..")))
    fields.photo_paths = "사진을 다시 올려주세요.";

  const timing = str(b.timing, 30);
  if (!oneOf(TIMINGS, timing)) fields.timing = "희망 시기를 골라주세요.";

  const name = str(b.name, 20);
  if (name.length < 2) fields.name = "이름을 2자 이상 입력해주세요.";
  const phone = str(b.phone, 20).replace(/[^0-9]/g, "");
  if (!PHONE_RE.test(phone)) fields.phone = "휴대전화 번호를 다시 확인해주세요. 예: 010-1234-5678";

  if (Object.keys(fields).length) return { ok: false, fields };
  return {
    ok: true,
    value: {
      region,
      district,
      housing,
      works: works_unknown ? [] : works,
      works_unknown,
      scope,
      photo_paths,
      size_note: optStr(b.size_note, 200),
      wish: optStr(b.wish, 1000),
      timing,
      budget: optStr(b.budget, 40),
      name,
      // 기존 신청과 같은 모양으로 저장: 010-1234-5678
      phone: phone.replace(/^(\d{3})(\d{3,4})(\d{4})$/, "$1-$2-$3"),
    },
  };
}

/** 사진 경로 → 1시간짜리 보기 주소 (비공개 버킷) */
export async function signPhotos(supabase: SupabaseClient, paths: string[]) {
  if (!paths.length) return [];
  const { data } = await supabase.storage.from(PHOTO_BUCKET).createSignedUrls(paths, 60 * 60);
  return paths.map((path) => ({ path, url: data?.find((d) => d.path === path)?.signedUrl ?? null }));
}
