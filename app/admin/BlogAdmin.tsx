"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyleKit } from "@tiptap/extension-text-style";
import Image from "@tiptap/extension-image";
import { Placeholder } from "@tiptap/extensions";
import { getAdminSupabase } from "../../lib/supabase";
import { shrinkPhoto } from "../../lib/photo";
import { readingMinutes } from "../../lib/blog";
import { BLOG_CATEGORIES } from "../blog/BlogList";
import "../blog/blog.css";

// 관리자 · 블로그: 글 목록 + 네이버 블로그처럼 글꼴·크기·색·정렬·사진을 고치는 편집기

type Post = {
  id: string;
  slug: string;
  title: string;
  category: string;
  excerpt: string;
  cover_url: string | null;
  body_html: string;
  featured: boolean;
  published: boolean;
  published_at: string | null;
  reading_minutes: number;
  updated_at: string;
};
type Draft = Omit<Post, "id" | "updated_at" | "reading_minutes" | "published_at"> & { id?: string; published_at?: string | null };

const BUCKET = "blog-images";
const EMPTY: Draft = { slug: "", title: "", category: BLOG_CATEGORIES[0], excerpt: "", cover_url: null, body_html: "", featured: false, published: false };
const SLUG_RE = /^[a-z0-9-]{1,80}$/;
const newSlug = () => `post-${new Date().toISOString().slice(0, 10)}-${Math.random().toString(36).slice(2, 6)}`;
const fmt = (v: string) => new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", month: "long", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(v));

/** 사진을 줄여서 블로그 저장소에 올리고 공개 주소를 돌려줌 */
async function uploadImage(file: File) {
  const sb = getAdminSupabase();
  if (!sb) throw new Error("no supabase");
  const blob = await shrinkPhoto(file);
  const path = `${new Date().toISOString().slice(0, 7)}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
  const { error } = await sb.storage.from(BUCKET).upload(path, blob, { contentType: "image/jpeg" });
  if (error) throw error;
  return sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

/** 저장 후 공개 페이지를 바로 새로 만듦 */
async function refreshPublic(slugs: string[]) {
  const sb = getAdminSupabase();
  const { data } = (await sb?.auth.getSession()) ?? { data: { session: null } };
  const token = data.session?.access_token;
  if (!token) return;
  await fetch("/api/blog/revalidate", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ slugs }) }).catch(() => {});
}

export function BlogAdmin() {
  const sb = getAdminSupabase();
  const [posts, setPosts] = useState<Post[]>([]);
  const [msg, setMsg] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);

  const load = useCallback(async () => {
    if (!sb) return;
    const { data, error } = await sb.from("blog_posts").select("*").order("created_at", { ascending: false });
    if (error) return setMsg(error.message.includes("blog_posts") ? "블로그 표가 아직 없어요. supabase/blog.sql 을 먼저 실행해주세요." : "글 목록을 불러오지 못했어요: " + error.message);
    setMsg("");
    setPosts((data ?? []) as Post[]);
  }, [sb]);
  useEffect(() => {
    void load();
  }, [load]);

  if (draft) return <PostEditor key={draft.id ?? "new"} initial={draft} onClose={() => (setDraft(null), void load())} />;

  return (
    <div className="bla">
      <div className="bla-head">
        <div>
          <h2>블로그 글</h2>
          <p className="adm-note">공개 {posts.filter((p) => p.published).length} · 임시저장 {posts.filter((p) => !p.published).length}</p>
        </div>
        <button type="button" className="btn btn--primary bla-new" onClick={() => setDraft({ ...EMPTY, slug: newSlug() })}>
          + 새 글 쓰기
        </button>
      </div>
      {msg && <p className="adm-note bla-msg">{msg}</p>}
      <ul className="bla-list">
        {posts.map((p) => (
          <li key={p.id}>
            <button type="button" onClick={() => setDraft(p)}>
              {p.cover_url ? <img src={p.cover_url} alt="" /> : <span className="bla-list__noimg" />}
              <span className="bla-list__txt">
                <span className="bla-list__tags">
                  <em className={p.published ? "is-pub" : ""}>{p.published ? "공개" : "임시저장"}</em>
                  {p.featured && <em className="is-feat">큰 글</em>}
                  <span>{p.category}</span>
                </span>
                <strong>{p.title || "제목 없음"}</strong>
                <small>{fmt(p.updated_at)} 수정</small>
              </span>
            </button>
          </li>
        ))}
        {!msg && posts.length === 0 && <li className="adm-note">아직 글이 없어요. 새 글을 써보세요.</li>}
      </ul>
    </div>
  );
}

export function PostEditor({ initial, onClose }: { initial: Draft; onClose: () => void }) {
  const sb = getAdminSupabase();
  const [d, setD] = useState<Draft>(initial);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const coverInput = useRef<HTMLInputElement>(null);
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((x) => ({ ...x, [k]: v }));

  const editor = useEditor({
    immediatelyRender: false,
    shouldRerenderOnTransaction: true,
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] }, link: { openOnClick: false, autolink: true } }),
      TextStyleKit,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Image,
      Placeholder.configure({ placeholder: "본문을 입력하세요. 사진은 위 사진 버튼으로 넣어요." }),
    ],
    content: initial.body_html || "<p></p>",
    editorProps: { attributes: { class: "bl-prose bla-doc", "aria-label": "본문" } },
  });

  const save = async (publish: boolean) => {
    if (!sb || !editor || busy) return;
    const slug = d.slug.trim();
    if (!d.title.trim()) return setNote("제목을 적어주세요.");
    if (!SLUG_RE.test(slug)) return setNote("글 주소는 영어 소문자·숫자·- 만 쓸 수 있어요.");
    setBusy(true);
    setNote("");
    const html = editor.getHTML();
    const row = {
      slug,
      title: d.title.trim(),
      category: d.category,
      excerpt: d.excerpt.trim(),
      cover_url: d.cover_url,
      body_html: html,
      featured: d.featured,
      published: publish,
      published_at: publish ? (d.published_at ?? new Date().toISOString()) : d.published_at ?? null,
      reading_minutes: readingMinutes(html),
    };
    // 큰 글은 하나만: 이 글을 큰 글로 고르면 다른 글의 표시를 먼저 내림
    if (d.featured) await sb.from("blog_posts").update({ featured: false }).eq("featured", true).neq("slug", initial.slug || slug);
    const { data, error } = d.id
      ? await sb.from("blog_posts").update(row).eq("id", d.id).select("id, published_at").single()
      : await sb.from("blog_posts").insert(row).select("id, published_at").single();
    setBusy(false);
    if (error) return setNote(error.message.includes("duplicate") ? "같은 글 주소가 이미 있어요. 주소를 바꿔주세요." : "저장하지 못했어요: " + error.message);
    setD((x) => ({ ...x, id: data.id, published: publish, published_at: data.published_at }));
    await refreshPublic([...new Set([slug, initial.slug].filter(Boolean))]);
    setNote(publish ? "공개했어요. 블로그에 바로 반영돼요." : "임시저장했어요. 블로그에는 아직 안 보여요.");
  };

  const remove = async () => {
    if (!sb || !d.id || !window.confirm(`'${d.title || "제목 없음"}' 글을 지울까요? 되돌릴 수 없어요.`)) return;
    const { error } = await sb.from("blog_posts").delete().eq("id", d.id);
    if (error) return setNote("지우지 못했어요: " + error.message);
    await refreshPublic([d.slug]);
    onClose();
  };

  const pickCover = async (f?: File) => {
    if (!f) return;
    setNote("표지 사진을 올리는 중…");
    try {
      set("cover_url", await uploadImage(f));
      setNote("");
    } catch {
      setNote("사진을 올리지 못했어요. JPG·PNG·WebP 사진인지 확인해주세요.");
    }
  };

  return (
    <div className="bla">
      <div className="bla-head">
        <button type="button" className="adm-btn" onClick={onClose}>
          ← 글 목록
        </button>
        <div className="bla-actions">
          {d.id && (
            <button type="button" className="adm-btn bla-del" onClick={() => void remove()}>
              삭제
            </button>
          )}
          {d.id && d.published && (
            <a className="adm-btn" href={`/blog/${d.slug}`} target="_blank" rel="noopener noreferrer">
              블로그에서 보기
            </a>
          )}
          <button type="button" className="adm-btn" disabled={busy} onClick={() => void save(false)}>
            {d.published ? "공개 내리고 임시저장" : "임시저장"}
          </button>
          <button type="button" className="btn btn--primary bla-pub" disabled={busy} onClick={() => void save(true)}>
            {busy ? "저장 중…" : d.published ? "수정 내용 공개" : "공개하기"}
          </button>
        </div>
      </div>
      {note && (
        <p className="bla-note" role="status">
          {note}
        </p>
      )}

      <div className="bla-grid">
        <div className="bla-main">
          <input className="bla-title" value={d.title} onChange={(e) => set("title", e.target.value)} placeholder="제목을 입력하세요" aria-label="제목" />
          {editor && <Toolbar editor={editor} onNote={setNote} />}
          <EditorContent editor={editor} className="bla-editor" />
        </div>

        <aside className="bla-side">
          <label className="bla-field">
            <span>분류</span>
            <select className="ui-input" value={d.category} onChange={(e) => set("category", e.target.value)}>
              {BLOG_CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <div className="bla-field">
            <span>표지 사진</span>
            <button type="button" className="bla-cover" onClick={() => coverInput.current?.click()}>
              {d.cover_url ? <img src={d.cover_url} alt="" /> : <span>+ 사진 고르기</span>}
            </button>
            {d.cover_url && (
              <button type="button" className="adm-copy__clear" onClick={() => set("cover_url", null)}>
                표지 빼기
              </button>
            )}
            <input ref={coverInput} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => void pickCover(e.target.files?.[0])} />
          </div>
          <label className="bla-field">
            <span>요약 · 목록에 보이는 두 줄</span>
            <textarea className="ui-input" rows={3} maxLength={160} value={d.excerpt} onChange={(e) => set("excerpt", e.target.value)} placeholder="이 글에서 알 수 있는 내용을 짧게" />
          </label>
          <label className="bla-check">
            <input type="checkbox" checked={d.featured} onChange={(e) => set("featured", e.target.checked)} />
            <span>
              <strong>큰 글로 보이기</strong>
              <small>블로그 목록 맨 위에 크게 보여요. 하나만 고를 수 있어서 다른 큰 글은 내려가요.</small>
            </span>
          </label>
          <label className="bla-field">
            <span>글 주소 · 영어 소문자·숫자·-</span>
            <input className="ui-input" value={d.slug} onChange={(e) => set("slug", e.target.value.toLowerCase())} />
            <small className="adm-path">tedoori.com/blog/{d.slug || "…"}</small>
          </label>
        </aside>
      </div>
    </div>
  );
}

const SIZES = ["14px", "16px", "17px", "20px", "24px", "28px"];
const COLORS = ["#16231b", "#4e5a53", "#0e7a33", "#1da049", "#b5651d", "#c0392b", "#2f6fb0"];
const MARKS = ["#fff3a3", "#d9f2df", "#fde2e1", "#e0ecfa"];

function Toolbar({ editor, onNote }: { editor: Editor; onNote: (s: string) => void }) {
  const imgInput = useRef<HTMLInputElement>(null);
  const c = () => editor.chain().focus();
  const block = editor.isActive("heading", { level: 2 }) ? "h2" : editor.isActive("heading", { level: 3 }) ? "h3" : "p";
  const size = (editor.getAttributes("textStyle").fontSize as string | undefined) ?? "";
  const font = (editor.getAttributes("textStyle").fontFamily as string | undefined) ?? "";
  const B = ({ on, label, onClick, children }: { on?: boolean; label: string; onClick: () => void; children: React.ReactNode }) => (
    <button type="button" className={`bla-tb${on ? " is-on" : ""}`} aria-label={label} title={label} aria-pressed={on} onMouseDown={(e) => e.preventDefault()} onClick={onClick}>
      {children}
    </button>
  );

  const addImage = async (files: FileList | null) => {
    for (const f of Array.from(files ?? [])) {
      onNote("사진을 올리는 중…");
      try {
        c().setImage({ src: await uploadImage(f), alt: "" }).run();
        onNote("");
      } catch {
        onNote("사진을 올리지 못했어요.");
      }
    }
  };
  const link = () => {
    const prev = editor.getAttributes("link").href as string | undefined;
    const href = window.prompt("연결할 주소 (비우면 링크 빼기)", prev ?? "https://");
    if (href === null) return;
    if (!href.trim() || href === "https://") return void c().unsetLink().run();
    c().extendMarkRange("link").setLink({ href: href.trim() }).run();
  };

  return (
    <div className="bla-toolbar" role="toolbar" aria-label="글 편집 도구">
      <select
        className="bla-sel"
        aria-label="문단 모양"
        value={block}
        onChange={(e) => {
          const v = e.target.value;
          if (v === "p") c().setParagraph().run();
          else c().setHeading({ level: v === "h2" ? 2 : 3 }).run();
        }}
      >
        <option value="p">본문</option>
        <option value="h2">큰 제목</option>
        <option value="h3">작은 제목</option>
      </select>
      <select className="bla-sel" aria-label="글꼴" value={font} onChange={(e) => (e.target.value ? c().setFontFamily(e.target.value).run() : c().unsetFontFamily().run())}>
        <option value="">기본 글꼴</option>
        <option value="'Noto Serif KR', 'Nanum Myeongjo', serif">명조</option>
        <option value="'Nanum Pen Script', cursive">손글씨</option>
      </select>
      <select className="bla-sel bla-sel--s" aria-label="글자 크기" value={size} onChange={(e) => (e.target.value ? c().setFontSize(e.target.value).run() : c().unsetFontSize().run())}>
        <option value="">크기</option>
        {SIZES.map((s) => (
          <option key={s} value={s}>
            {parseInt(s)}
          </option>
        ))}
      </select>
      <span className="bla-sep" />
      <B label="굵게" on={editor.isActive("bold")} onClick={() => c().toggleBold().run()}>
        <b>B</b>
      </B>
      <B label="기울임" on={editor.isActive("italic")} onClick={() => c().toggleItalic().run()}>
        <i>I</i>
      </B>
      <B label="밑줄" on={editor.isActive("underline")} onClick={() => c().toggleUnderline().run()}>
        <u>U</u>
      </B>
      <B label="취소선" on={editor.isActive("strike")} onClick={() => c().toggleStrike().run()}>
        <s>S</s>
      </B>
      <details className="bla-pop">
        <summary className="bla-tb" aria-label="글자 색" title="글자 색">
          <span className="bla-a" style={{ borderColor: (editor.getAttributes("textStyle").color as string) || "#16231b" }}>A</span>
        </summary>
        <div className="bla-pop__panel">
          <small>글자 색</small>
          <div className="bla-swatches">
            {COLORS.map((col) => (
              <button key={col} type="button" style={{ background: col }} aria-label={`글자 색 ${col}`} onClick={() => c().setColor(col).run()} />
            ))}
            <button type="button" className="bla-swatch-x" aria-label="글자 색 빼기" onClick={() => c().unsetColor().run()}>
              ×
            </button>
          </div>
          <small>형광펜</small>
          <div className="bla-swatches">
            {MARKS.map((col) => (
              <button key={col} type="button" style={{ background: col }} aria-label={`형광펜 ${col}`} onClick={() => c().setBackgroundColor(col).run()} />
            ))}
            <button type="button" className="bla-swatch-x" aria-label="형광펜 빼기" onClick={() => c().unsetBackgroundColor().run()}>
              ×
            </button>
          </div>
        </div>
      </details>
      <span className="bla-sep" />
      {(["left", "center", "right", "justify"] as const).map((a) => (
        <B key={a} label={{ left: "왼쪽 정렬", center: "가운데 정렬", right: "오른쪽 정렬", justify: "양쪽 정렬" }[a]} on={editor.isActive({ textAlign: a })} onClick={() => c().setTextAlign(a).run()}>
          <AlignIcon a={a} />
        </B>
      ))}
      <span className="bla-sep" />
      <B label="글머리 목록" on={editor.isActive("bulletList")} onClick={() => c().toggleBulletList().run()}>
        •≡
      </B>
      <B label="번호 목록" on={editor.isActive("orderedList")} onClick={() => c().toggleOrderedList().run()}>
        1.
      </B>
      <B label="인용" on={editor.isActive("blockquote")} onClick={() => c().toggleBlockquote().run()}>
        ❝
      </B>
      <B label="구분선" onClick={() => c().setHorizontalRule().run()}>
        ―
      </B>
      <B label="링크" on={editor.isActive("link")} onClick={link}>
        <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" /><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></svg>
      </B>
      <B label="사진 넣기" onClick={() => imgInput.current?.click()}>
        <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <circle cx="9" cy="10" r="2" />
          <path d="m21 16-5-5-9 9" />
        </svg>
      </B>
      <input ref={imgInput} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={(e) => void addImage(e.target.files).then(() => (e.target.value = ""))} />
      <span className="bla-sep" />
      <B label="되돌리기" onClick={() => c().undo().run()}>
        ↶
      </B>
      <B label="다시 하기" onClick={() => c().redo().run()}>
        ↷
      </B>
    </div>
  );
}

function AlignIcon({ a }: { a: "left" | "center" | "right" | "justify" }) {
  const rows = { left: [18, 12, 16], center: [18, 12, 16], right: [18, 12, 16], justify: [18, 18, 18] }[a];
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      {rows.map((w, i) => {
        const x = a === "left" || a === "justify" ? 3 : a === "right" ? 21 - w : 12 - w / 2;
        return <path key={i} d={`M${x} ${6 + i * 6}h${w}`} />;
      })}
    </svg>
  );
}
