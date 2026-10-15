import { signOutIfIdle, touchActivity } from "./idle";
import { getSupabase } from "./supabase";

// 브라우저 → 견적 신청 API(/api/quotes) 호출. 이메일 인증 토큰을 함께 보냄

export type ApiError = { code: string; message: string; fields?: Record<string, string> };

export class QuoteApiError extends Error {
  constructor(
    public status: number,
    public detail: ApiError,
  ) {
    super(detail.message);
  }
}

export async function quoteApi<T>(path: string, init: RequestInit = {}): Promise<T> {
  // 내 신청 조회·수정·삭제는 1시간 미사용이면 로그아웃 상태로 처리 (견적 등록 POST 는 신청 화면 흐름이라 제외)
  if ((init.method ?? "GET") !== "POST" && (await signOutIfIdle()))
    throw new QuoteApiError(401, { code: "idle", message: "1시간 동안 사용하지 않아 로그아웃됐어요. 이메일을 다시 확인해주세요." });

  const { data } = (await getSupabase()?.auth.getSession()) ?? { data: { session: null } };
  const token = data.session?.access_token;
  if (!token) throw new QuoteApiError(401, { code: "unauthorized", message: "이메일 인증이 필요해요." });

  let res: Response;
  try {
    res = await fetch(`/api/quotes${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...init.headers },
    });
  } catch {
    throw new QuoteApiError(0, { code: "network", message: "인터넷 연결을 확인하고 다시 시도해주세요." });
  }
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new QuoteApiError(res.status, body?.error ?? { code: "unknown", message: "잠시 후 다시 시도해주세요." });
  }
  touchActivity();
  return body as T;
}
