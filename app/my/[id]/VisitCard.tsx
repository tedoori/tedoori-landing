const KST = { timeZone: "Asia/Seoul" } as const;
const part = (v: Date, o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("ko-KR", { ...KST, ...o }).format(v);

/** 실측 방문 일정: 달력 한 장처럼 날짜를 크게, 남은 날 표시 */
export function VisitCard({ at, note }: { at: string; note: string | null }) {
  const d = new Date(at);
  const today = new Date(part(new Date(), { year: "numeric", month: "2-digit", day: "2-digit" }).replace(/\. /g, "-").replace(".", ""));
  const that = new Date(part(d, { year: "numeric", month: "2-digit", day: "2-digit" }).replace(/\. /g, "-").replace(".", ""));
  const left = Math.round((that.getTime() - today.getTime()) / 86400000);
  const dday = left > 0 ? `D-${left}` : left === 0 ? "오늘" : "방문 완료";

  return (
    <section className="visit" aria-labelledby="visit-title">
      <div className="visit-cal" aria-hidden="true">
        <span className="visit-cal__month">{part(d, { month: "long" })}</span>
        <strong className="visit-cal__day">{part(d, { day: "numeric" }).replace("일", "")}</strong>
        <span className="visit-cal__week">{part(d, { weekday: "short" })}요일</span>
      </div>
      <div className="visit-body">
        <p className="visit-kicker">
          실측 방문 일정 <span className="visit-dday">{dday}</span>
        </p>
        <h2 id="visit-title" className="visit-when">
          {part(d, { month: "long", day: "numeric", weekday: "short" })} {part(d, { hour: "numeric", minute: "2-digit" })}
        </h2>
        <p className="visit-desc">{note || "담당자가 방문해 작업할 곳의 크기와 바닥 상태를 확인해요."}</p>
        <p className="visit-help">일정 변경은 카카오톡 채널 @테두리나 문의하기로 알려주세요.</p>
      </div>
    </section>
  );
}
