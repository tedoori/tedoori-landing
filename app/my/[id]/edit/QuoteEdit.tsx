"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Callout, EmptyState } from "../../../_components/ui";
import { DISTRICTS, REGIONS, type Region } from "../../../../lib/districts";
import { checkPhotos, formatPhone, PHONE_RE, PHOTO_ACCEPT, shrinkPhoto } from "../../../../lib/photo";
import { HOUSING_TYPES, MAX_PHOTOS, SCOPES, TIMINGS, VISITS, WORK_TYPES } from "../../../../lib/quote";
import { QuoteApiError, quoteApi } from "../../../../lib/quote-api";
import { getSupabase } from "../../../../lib/supabase";
import { splitWish, type QuoteDetailData } from "../QuoteDetail";

type Form = {
  region: string;
  district: string;
  housing: string;
  works: string[];
  works_unknown: boolean;
  scope: string;
  size_note: string;
  visit: string;
  wish: string;
  timing: string;
  budget: string;
  name: string;
  phone: string;
};

// 남아 있는 기존 사진(경로) + 새로 고른 사진(파일)
type Photo = { key: string; path?: string; url: string; file?: File };

type Load = { kind: "loading" } | { kind: "ready" } | { kind: "auth" } | { kind: "missing" } | { kind: "error"; message: string };

function toForm(d: QuoteDetailData): Form {
  const { visit, wish } = splitWish(d.wish);
  return {
    region: d.region,
    district: d.district,
    housing: d.housing,
    works: d.works,
    works_unknown: d.works_unknown,
    scope: d.scope,
    size_note: d.size_note ?? "",
    visit,
    wish,
    timing: d.timing,
    budget: d.budget ?? "",
    name: d.name ?? "",
    phone: d.phone ?? "",
  };
}

/** 저장 전 화면에서 먼저 확인 (서버에서도 같은 규칙으로 다시 확인함) */
function check(f: Form) {
  const e: Record<string, string> = {};
  if (!f.district) e.district = "시·군·구를 골라주세요.";
  if (!f.works_unknown && f.works.length === 0) e.works = "필요한 작업을 하나 이상 골라주세요.";
  if (!f.visit) e.visit = "방문 실측 방식을 골라주세요.";
  if (f.name.trim().length < 2) e.name = "이름을 2자 이상 입력해주세요.";
  if (!PHONE_RE.test(f.phone.replace(/-/g, ""))) e.phone = "휴대전화 번호를 다시 확인해주세요. 예: 010-1234-5678";
  return e;
}

export function QuoteEdit({ id }: { id: string }) {
  const router = useRouter();
  const [load, setLoad] = useState<Load>({ kind: "loading" });
  const [receipt, setReceipt] = useState("");
  const [form, setForm] = useState<Form | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [photoError, setPhotoError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchQuote = useCallback(async () => {
    setLoad({ kind: "loading" });
    try {
      const d = await quoteApi<QuoteDetailData>(`/${encodeURIComponent(id)}`);
      setReceipt(d.receipt_no ?? "");
      setForm(toForm(d));
      setPhotos(d.photos.map((p) => ({ key: p.path, path: p.path, url: p.url ?? "" })));
      setLoad({ kind: "ready" });
    } catch (e) {
      if (e instanceof QuoteApiError && e.status === 401) setLoad({ kind: "auth" });
      else if (e instanceof QuoteApiError && e.status === 404) setLoad({ kind: "missing" });
      else setLoad({ kind: "error", message: e instanceof QuoteApiError ? e.message : "신청 내용을 불러오지 못했어요." });
    }
  }, [id]);

  useEffect(() => {
    void fetchQuote();
  }, [fetchQuote]);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => {
    setForm((f) => (f ? { ...f, [k]: v } : f));
    setErrors((e) => {
      const { [k]: _, ...rest } = e;
      return rest;
    });
  };

  const addPhotos = (files: FileList | null) => {
    if (!files) return;
    const { ok, error } = checkPhotos(Array.from(files), MAX_PHOTOS - photos.length);
    setPhotoError(error);
    setPhotos((p) => [...p, ...ok.map((file) => ({ key: crypto.randomUUID(), file, url: URL.createObjectURL(file) }))]);
    if (fileRef.current) fileRef.current.value = "";
  };

  const removePhoto = (key: string) =>
    setPhotos((p) => {
      const hit = p.find((x) => x.key === key);
      if (hit?.file) URL.revokeObjectURL(hit.url);
      return p.filter((x) => x.key !== key);
    });

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form || busy) return;
    const found = check(form);
    setErrors(found);
    setSaveError("");
    if (Object.keys(found).length) {
      document.querySelector<HTMLElement>(`[data-field="${Object.keys(found)[0]}"]`)?.scrollIntoView({ block: "center", behavior: "smooth" });
      return;
    }

    setBusy(true);
    const supabase = getSupabase();
    try {
      // 새로 고른 사진만 먼저 올리고, 남긴 기존 사진 경로와 합쳐서 저장
      const { data } = (await supabase?.auth.getSession()) ?? { data: { session: null } };
      const uid = data.session?.user.id;
      if (!supabase || !uid) throw new QuoteApiError(401, { code: "unauthorized", message: "이메일 인증이 만료됐어요. 다시 확인해주세요." });
      const paths: string[] = [];
      for (const p of photos) {
        if (p.path) {
          paths.push(p.path);
          continue;
        }
        const path = `${uid}/${crypto.randomUUID()}.jpg`;
        const { error: upErr } = await supabase.storage
          .from("quote-photos")
          .upload(path, await shrinkPhoto(p.file!), { contentType: "image/jpeg", upsert: false });
        if (upErr) throw new Error("photo");
        paths.push(path);
      }

      await quoteApi(`/${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: JSON.stringify({
          region: form.region,
          district: form.district,
          housing: form.housing,
          works: form.works_unknown ? [] : form.works,
          works_unknown: form.works_unknown,
          scope: form.scope,
          photo_paths: paths,
          size_note: form.size_note.trim() || null,
          wish: [`방문: ${form.visit}`, form.wish.trim()].filter(Boolean).join("\n"),
          timing: form.timing,
          budget: form.budget.trim() || null,
          name: form.name.trim(),
          phone: form.phone.trim(),
        }),
      });
      router.push(`/my/${id}`);
      router.refresh();
    } catch (err) {
      if (err instanceof QuoteApiError && err.detail.fields) setErrors(err.detail.fields);
      setSaveError(
        err instanceof QuoteApiError
          ? err.message
          : err instanceof Error && err.message === "photo"
            ? "사진을 올리지 못했어요. 사진을 빼거나 다른 사진으로 다시 시도해주세요."
            : "저장하지 못했어요. 잠시 후 다시 시도해주세요.",
      );
      setBusy(false);
    }
  };

  if (load.kind === "loading")
    return (
      <div className="my-detail" aria-busy="true">
        <p className="my-loading" role="status">수정할 내용을 불러오는 중이에요…</p>
        <div className="my-skeleton" aria-hidden="true">
          <span />
          <span />
        </div>
      </div>
    );
  if (load.kind === "auth")
    return (
      <div className="my-detail">
        <EmptyState
          icon="info"
          title="이메일 확인이 필요해요."
          desc="신청 이메일로 확인 코드를 받은 뒤 신청을 수정할 수 있어요."
          action={
            <Link href="/my" className="btn btn--primary">
              이메일 확인하러 가기
            </Link>
          }
        />
      </div>
    );
  if (load.kind === "missing")
    return (
      <div className="my-detail">
        <EmptyState
          icon="search"
          title="신청을 찾을 수 없어요."
          desc="주소가 바뀌었거나 삭제된 신청이에요."
          action={
            <Link href="/my" className="btn btn--primary">
              내 신청 목록으로
            </Link>
          }
        />
      </div>
    );
  if (load.kind === "error" || !form)
    return (
      <div className="my-detail">
        <Callout tone="danger" title="불러오지 못했어요">
          {load.kind === "error" ? load.message : "잠시 후 다시 시도해주세요."}
        </Callout>
        <div className="btn-row">
          <button type="button" className="btn btn--primary" onClick={() => void fetchQuote()}>
            다시 시도
          </button>
        </div>
      </div>
    );

  const districts = DISTRICTS[form.region as Region] ?? [];
  const err = (k: string) =>
    errors[k] ? (
      <p className="my-error" role="alert">
        {errors[k]}
      </p>
    ) : null;
  const chip = (on: boolean) => `my-chip${on ? " is-on" : ""}`;

  return (
    <form className="my-detail my-edit" onSubmit={save} noValidate aria-labelledby="edit-title">
      <Link href={`/my/${id}`} className="my-back">
        ← 신청 상세
      </Link>
      <header className="my-detail__head">
        <div>
          <p className="my-eyebrow">신청 수정</p>
          <h1 id="edit-title" className="my-panel__title">
            {receipt || "견적 신청"}
          </h1>
          <p className="my-panel__text">접수번호·진행 상태·신청 이메일은 바꿀 수 없어요.</p>
        </div>
      </header>

      <section className="my-card">
        <h2 className="my-card__title">어디인가요?</h2>
        <div className="my-row2">
          <label className="my-field" data-field="region">
            <span>지역</span>
            <select
              value={form.region}
              onChange={(e) => {
                set("region", e.target.value);
                set("district", "");
              }}
            >
              {REGIONS.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </label>
          <label className="my-field" data-field="district">
            <span>시·군·구</span>
            <select value={form.district} onChange={(e) => set("district", e.target.value)} aria-invalid={!!errors.district}>
              <option value="">선택해주세요</option>
              {districts.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
            {err("district")}
          </label>
        </div>
        <fieldset className="my-fieldset" data-field="housing">
          <legend>주거 형태</legend>
          <div className="my-chips">
            {HOUSING_TYPES.map((h) => (
              <button key={h} type="button" className={chip(form.housing === h)} aria-pressed={form.housing === h} onClick={() => set("housing", h)}>
                {h}
              </button>
            ))}
          </div>
        </fieldset>
      </section>

      <section className="my-card">
        <h2 className="my-card__title">어떤 작업이 필요한가요?</h2>
        <fieldset className="my-fieldset" data-field="works">
          <legend className="sr-only">필요한 작업 (여러 개 선택)</legend>
          <div className="my-chips">
            {WORK_TYPES.map((w) => {
              const on = !form.works_unknown && form.works.includes(w);
              return (
                <button
                  key={w}
                  type="button"
                  className={chip(on)}
                  aria-pressed={on}
                  onClick={() => {
                    // 빠르게 여러 번 눌러도 최신 선택을 기준으로 바뀌도록
                    setForm((f) =>
                      f && {
                        ...f,
                        works_unknown: false,
                        works: f.works.includes(w) && !f.works_unknown ? f.works.filter((x) => x !== w) : [...f.works.filter((x) => x !== w), w],
                      },
                    );
                    setErrors(({ works: _, ...rest }) => rest);
                  }}
                >
                  {w}
                </button>
              );
            })}
            <button
              type="button"
              className={chip(form.works_unknown)}
              aria-pressed={form.works_unknown}
              onClick={() => {
                set("works_unknown", !form.works_unknown);
                set("works", []);
              }}
            >
              상담하며 정할게요
            </button>
          </div>
          {err("works")}
        </fieldset>
        <fieldset className="my-fieldset" data-field="scope">
          <legend>맡길 범위</legend>
          <div className="my-chips">
            {SCOPES.map((s) => (
              <button key={s} type="button" className={chip(form.scope === s)} aria-pressed={form.scope === s} onClick={() => set("scope", s)}>
                {s}
              </button>
            ))}
          </div>
        </fieldset>
      </section>

      <section className="my-card" data-field="photo_paths">
        <h2 className="my-card__title">
          현장 사진 <small>{photos.length}/{MAX_PHOTOS}장</small>
        </h2>
        <p className="my-note">JPG·PNG·WebP, 한 장에 10MB까지 올릴 수 있어요.</p>
        <input ref={fileRef} type="file" accept={PHOTO_ACCEPT} multiple className="sr-only" id="edit-photo" onChange={(e) => addPhotos(e.target.files)} />
        {photos.length > 0 && (
          <ul className="my-photos">
            {photos.map((p, i) => (
              <li key={p.key} className="my-photos__item">
                {p.url ? <img src={p.url} alt={`현장 사진 ${i + 1}`} /> : <span className="my-photos__missing">사진</span>}
                {p.file && <span className="my-photos__new">새 사진</span>}
                <button type="button" className="my-photos__remove" onClick={() => removePhoto(p.key)} aria-label={`현장 사진 ${i + 1} 빼기`}>
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
        {photos.length === 0 && <p className="my-note">올린 사진이 없어요. 사진이 있으면 더 정확하게 확인할 수 있어요.</p>}
        {photos.length < MAX_PHOTOS && (
          <label htmlFor="edit-photo" className="btn btn--secondary my-upload">
            사진 추가하기
          </label>
        )}
        {(photoError || errors.photo_paths) && (
          <p className="my-error" role="alert">
            {photoError || errors.photo_paths}
          </p>
        )}
      </section>

      <section className="my-card">
        <h2 className="my-card__title">조건과 요청사항</h2>
        <label className="my-field">
          <span>크기·수량 (선택)</span>
          <input value={form.size_note} maxLength={200} placeholder="예: 현관 옆 약 2㎡ · 나무 2주" onChange={(e) => set("size_note", e.target.value)} />
        </label>
        <label className="my-field">
          <span>요청사항 (선택)</span>
          <textarea value={form.wish} maxLength={900} rows={4} placeholder="바꾸고 싶은 모습을 적어주세요." onChange={(e) => set("wish", e.target.value)} />
        </label>
        <fieldset className="my-fieldset" data-field="timing">
          <legend>희망 시기</legend>
          <div className="my-chips">
            {TIMINGS.map((t) => (
              <button key={t} type="button" className={chip(form.timing === t)} aria-pressed={form.timing === t} onClick={() => set("timing", t)}>
                {t}
              </button>
            ))}
          </div>
        </fieldset>
        <label className="my-field">
          <span>예산 (선택)</span>
          <input value={form.budget} maxLength={40} placeholder="예: 300만 원 안팎" onChange={(e) => set("budget", e.target.value)} />
        </label>
        <fieldset className="my-fieldset" data-field="visit">
          <legend>방문 실측 (필수)</legend>
          <div className="my-chips">
            {VISITS.map((v) => (
              <button key={v} type="button" className={chip(form.visit === v)} aria-pressed={form.visit === v} onClick={() => set("visit", v)}>
                {v}
              </button>
            ))}
          </div>
          {err("visit")}
        </fieldset>
      </section>

      <section className="my-card">
        <h2 className="my-card__title">연락처</h2>
        <div className="my-row2">
          <label className="my-field" data-field="name">
            <span>이름</span>
            <input value={form.name} maxLength={20} autoComplete="name" aria-invalid={!!errors.name} onChange={(e) => set("name", e.target.value)} />
            {err("name")}
          </label>
          <label className="my-field" data-field="phone">
            <span>휴대전화</span>
            <input
              value={form.phone}
              inputMode="tel"
              autoComplete="tel"
              aria-invalid={!!errors.phone}
              onChange={(e) => set("phone", formatPhone(e.target.value))}
            />
            {err("phone")}
          </label>
        </div>
      </section>

      {saveError && (
        <Callout tone="danger" title="저장 중 문제가 생겼어요">
          {saveError}
        </Callout>
      )}

      <div className="my-detail__actions">
        <Link href={`/my/${id}`} className="btn btn--secondary" aria-disabled={busy}>
          취소
        </Link>
        <button type="submit" className="btn btn--primary" disabled={busy}>
          {busy ? "저장하는 중…" : "저장하기"}
        </button>
      </div>
    </form>
  );
}
