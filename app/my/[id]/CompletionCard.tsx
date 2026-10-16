const day = (v: string) => new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", year: "numeric", month: "long", day: "numeric" }).format(new Date(v));

/** 완료 보고: 업체·담당자가 남긴 말 + 작업 완료 사진 */
export function CompletionCard({ note, photos, at }: { note: string | null; photos: { path: string; url: string | null }[]; at: string | null }) {
  const shown = photos.filter((p) => p.url);
  return (
    <section className="done-card" aria-labelledby="done-title">
      <header className="done-card__head">
        <span className="done-card__badge" aria-hidden="true">
          ✓
        </span>
        <div>
          <p className="done-card__kicker">완료 보고{at ? ` · ${day(at)}` : ""}</p>
          <h2 id="done-title" className="done-card__title">
            새 정원이 완성됐어요
          </h2>
        </div>
      </header>
      {shown.length > 0 && (
        <ul className={`done-card__photos is-${Math.min(shown.length, 3)}`}>
          {shown.map((p, i) => (
            <li key={p.path}>
              <a href={p.url!} target="_blank" rel="noopener noreferrer">
                <img src={p.url!} alt={`작업 완료 사진 ${i + 1}`} loading="lazy" />
              </a>
            </li>
          ))}
        </ul>
      )}
      {note && (
        <div className="done-card__note">
          <p className="done-card__from">담당자가 남긴 말</p>
          <p>{note}</p>
        </div>
      )}
    </section>
  );
}
