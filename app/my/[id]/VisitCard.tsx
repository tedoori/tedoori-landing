const KST = { timeZone: "Asia/Seoul" } as const;
const part = (v: Date, o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("ko-KR", { ...KST, ...o }).format(v);
const ymd = (v: Date) => part(v, { year: "numeric", month: "2-digit", day: "2-digit" }).replace(/\.\s?/g, "-").replace(/-$/, "");

export type BuildKind = "labor" | "delivery" | "material";
type Props = { at: string | null; note: string | null; address?: string | null; detail?: string | null; memo?: string | null; kind?: "visit" | "build"; buildKind?: BuildKind };

// 진행 범위별 이름과 안내 (시공이 있으면 시공, 없고 배송이 있으면 배송, 자재만이면 자재 준비)
export const BUILD_COPY: Record<BuildKind, { label: string; done: string; pending: string; ready: string; waiting: string }> = {
  labor: {
    label: "시공 일정",
    done: "시공 완료",
    pending: "시공 날짜를 정하고 있어요",
    ready: "견적서 내용대로 시공해요. 시공 전날 담당자가 시간과 준비할 점을 다시 알려드려요.",
    waiting: "진행이 확정됐어요. 담당자가 시공 날짜를 정해 연락드려요.",
  },
  delivery: {
    label: "배송 일정",
    done: "배송 완료",
    pending: "배송 날짜를 정하고 있어요",
    ready: "견적서의 자재를 방문 주소로 배송해요. 도착 전에 배송 기사님이 먼저 연락드려요.",
    waiting: "진행이 확정됐어요. 자재를 준비해 배송 날짜를 정해 연락드려요.",
  },
  material: {
    label: "자재 준비 일정",
    done: "준비 완료",
    pending: "자재 준비 날짜를 정하고 있어요",
    ready: "견적서의 자재를 이 날짜까지 준비해요. 받으실 방법은 담당자가 따로 안내드려요.",
    waiting: "진행이 확정됐어요. 자재를 준비해 받으실 날짜를 정해 연락드려요.",
  },
};

/** 실측 방문 일정: 달력 한 장 + 일시·주소·메모. 날짜가 없으면 '조율 중' */
export function VisitCard({ at, note, address, detail, memo, kind = "visit", buildKind = "labor" }: Props) {
  const build = kind === "build";
  const bc = BUILD_COPY[buildKind];
  const d = at ? new Date(at) : null;
  const left = d ? Math.round((new Date(ymd(d)).getTime() - new Date(ymd(new Date())).getTime()) / 86400000) : null;
  const dday = left === null ? "조율 중" : left > 0 ? `D-${left}` : left === 0 ? "오늘" : build ? bc.done : "방문 완료";

  return (
    <section className={`visit${d ? "" : " is-pending"}${build ? " is-build" : ""}`} aria-labelledby={`${kind}-title`}>
      <div className="visit-cal" aria-hidden="true">
        <span className="visit-cal__month">{d ? part(d, { month: "long" }) : "일정"}</span>
        <strong className="visit-cal__day">{d ? part(d, { day: "numeric" }).replace("일", "") : "?"}</strong>
        <span className="visit-cal__week">{d ? `${part(d, { weekday: "short" })}요일` : "조율 중"}</span>
      </div>
      <div className="visit-body">
        <p className="visit-kicker">
          {build ? bc.label : "실측 방문"} <span className="visit-dday">{dday}</span>
        </p>
        <h2 id={`${kind}-title`} className="visit-when">
          {d ? `${part(d, { month: "long", day: "numeric", weekday: "short" })} ${part(d, { hour: "numeric", minute: "2-digit" })}` : build ? bc.pending : "방문 날짜를 정하고 있어요"}
        </h2>
        <p className="visit-desc">{note || (build ? (d ? bc.ready : bc.waiting) : d ? "담당자가 방문해 작업할 곳의 크기와 바닥 상태를 확인해요." : "담당자가 전화나 문자로 연락드려 날짜를 정해요. 정해지면 메일로도 알려드려요.")}</p>
      </div>
      <dl className="visit-info">
        {address !== undefined && (
          <div>
            <dt>방문 주소</dt>
            <dd>{address ? `${address} ${detail ?? ""}` : "아직 입력하지 않았어요"}</dd>
          </div>
        )}
        {memo && (
          <div>
            <dt>방문 메모</dt>
            <dd>{memo}</dd>
          </div>
        )}
        <div>
          <dt>일정 변경</dt>
          <dd>카카오톡 채널 @테두리나 문의하기로 알려주세요</dd>
        </div>
      </dl>
    </section>
  );
}
