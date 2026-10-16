import { revalidatePath } from "next/cache";
import { getSupabaseForToken } from "../../../../lib/supabase";

// 관리자가 블로그 글을 저장·삭제하면 목록과 그 글 페이지를 바로 새로 만듦
export async function POST(req: Request) {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const sb = token ? getSupabaseForToken(token) : null;
  if (!sb) return Response.json({ ok: false }, { status: 401 });
  const { data: ok } = await sb.rpc("is_admin");
  if (!ok) return Response.json({ ok: false }, { status: 403 });

  const body = (await req.json().catch(() => null)) as { slugs?: unknown } | null;
  const slugs = Array.isArray(body?.slugs) ? body.slugs.filter((s): s is string => typeof s === "string" && /^[a-z0-9-]{1,80}$/.test(s)) : [];
  revalidatePath("/blog");
  for (const s of slugs) revalidatePath(`/blog/${s}`);
  return Response.json({ ok: true });
}
