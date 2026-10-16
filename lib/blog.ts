import { createClient } from "@supabase/supabase-js";
import { JOURNAL_ARTICLES } from "../app/journal/data";

// 블로그 글: Supabase blog_posts 표에서 공개 글만 읽음 (관리자 편집기에서 쓰고 고친 글)
// 표가 아직 없거나 읽지 못하면 코드에 있던 기존 글로 보여줌

export type BlogPost = {
  slug: string;
  title: string;
  category: string;
  excerpt: string;
  cover?: string;
  featured?: boolean;
  readingTime: string;
  html: string;
  publishedAt: string | null;
};

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

const FALLBACK: BlogPost[] = JOURNAL_ARTICLES.map((a) => ({
  slug: a.slug,
  title: a.title,
  category: a.category,
  excerpt: a.excerpt,
  cover: a.cover,
  featured: a.featured,
  readingTime: a.readingTime,
  html: a.sections.map((s) => `<h2>${esc(s.heading)}</h2>` + s.paragraphs.map((p) => `<p>${esc(p)}</p>`).join("")).join(""),
  publishedAt: null,
}));

type Row = {
  slug: string;
  title: string;
  category: string;
  excerpt: string;
  cover_url: string | null;
  featured: boolean;
  reading_minutes: number;
  body_html: string;
  published_at: string | null;
};

export async function getPosts(): Promise<BlogPost[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return FALLBACK;
  const sb = createClient(url, key, { auth: { persistSession: false } });
  const { data, error } = await sb
    .from("blog_posts")
    .select("slug, title, category, excerpt, cover_url, featured, reading_minutes, body_html, published_at")
    .eq("published", true)
    .order("published_at", { ascending: false });
  if (error || !data) return FALLBACK;
  return (data as Row[]).map((r) => ({
    slug: r.slug,
    title: r.title,
    category: r.category,
    excerpt: r.excerpt,
    cover: r.cover_url ?? undefined,
    featured: r.featured,
    readingTime: `${r.reading_minutes}분 읽기`,
    html: r.body_html,
    publishedAt: r.published_at,
  }));
}

/** 본문 글자 수로 읽는 시간(분) 어림: 한국어 1분에 약 500자 */
export function readingMinutes(html: string) {
  const text = html.replace(/<[^>]+>/g, "").replace(/\s+/g, "");
  return Math.max(1, Math.round(text.length / 500));
}
