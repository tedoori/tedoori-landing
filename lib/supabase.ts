import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

let browserClient: SupabaseClient | null = null;

// 브라우저에서 쓰는 Supabase 연결. 설정 값이 없으면 null.
export function getSupabase(): SupabaseClient | null {
  if (!url || !anonKey) return null;
  browserClient ??= createClient(url, anonKey);
  return browserClient;
}

// 서버에서 사용자의 로그인 토큰으로 접속 (접근 규칙이 그 사용자 기준으로 적용됨)
export function getSupabaseForToken(accessToken: string): SupabaseClient | null {
  if (!url || !anonKey) return null;
  return createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

let adminClient: SupabaseClient | null = null;

// 관리자 화면 전용 연결. 로그인 정보를 따로 보관해서 '내 신청'(고객 로그인)과 섞이지 않음
export function getAdminSupabase(): SupabaseClient | null {
  if (!url || !anonKey) return null;
  adminClient ??= createClient(url, anonKey, { auth: { storageKey: "tedoori-admin-auth" } });
  return adminClient;
}
