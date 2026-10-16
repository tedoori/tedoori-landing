// 접수 안내 메일 디자인 (확인 코드 메일 supabase/email-otp.html 과 같은 모양)

const LOGO_URL = "https://fhadxdmpuhlbfwvbciuz.supabase.co/storage/v1/object/public/brand/teduri-logo-mark.png";
const FONT = "'Pretendard','Apple SD Gothic Neo','Malgun Gothic',sans-serif";

export type QuoteRow = {
  id: string;
  receipt_no: string;
  email: string;
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
  name: string | null;
  phone: string | null;
  created_at: string;
};

export const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const esc = escapeHtml;

export function summaryRows(q: QuoteRow): [string, string][] {
  return [
    ["지역", `${q.region} ${q.district}`],
    ["주거 형태", q.housing],
    ["작업", q.works_unknown ? "아직 모르겠어요" : q.works.join(", ")],
    ["맡길 범위", q.scope],
    ["현장 사진", q.photo_paths.length ? `${q.photo_paths.length}장` : "없음 (접수 후 안내)"],
    ["크기·수량", q.size_note ?? "아직 모르겠어요"],
    ["원하는 모습", q.wish ?? "-"],
    ["희망 시기", q.timing],
    ["예산", q.budget ?? "아직 정하지 않았어요"],
  ];
}

function rowsTable(rows: [string, string][]) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${rows
    .map(
      ([k, v], i) => `
      <tr>
        <td width="96" style="padding:10px 12px 10px 0;${i ? "border-top:1px solid #ECE7DC;" : ""}font-family:${FONT};font-size:13px;line-height:1.5;color:#4E5A53;vertical-align:top;">${esc(k)}</td>
        <td style="padding:10px 0;${i ? "border-top:1px solid #ECE7DC;" : ""}font-family:${FONT};font-size:14px;line-height:1.5;font-weight:600;color:#16231B;vertical-align:top;white-space:pre-wrap;">${esc(v)}</td>
      </tr>`,
    )
    .join("")}</table>`;
}

function shell({ preheader, body, footer }: { preheader: string; body: string; footer: string }) {
  return `<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="light"></head>
<body style="margin:0;padding:0;background-color:#f4f1ea;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:#f4f1ea;">${esc(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f1ea;">
  <tr><td align="center" style="padding:32px 16px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;background-color:#ffffff;border-radius:16px;">
      <tr><td style="padding:28px 32px 0 32px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
          <td style="vertical-align:middle;"><img src="${LOGO_URL}" width="59" height="20" alt="" style="display:block;border:0;outline:none;text-decoration:none;width:59px;height:20px;"></td>
          <td style="vertical-align:middle;padding-left:10px;font-family:${FONT};font-size:18px;font-weight:800;color:#16231B;letter-spacing:-0.02em;">테두리</td>
        </tr></table>
      </td></tr>
      ${body}
      <tr><td style="padding:16px 32px;border-top:1px solid #ECE7DC;font-family:${FONT};font-size:12px;line-height:1.6;color:#5F6A64;">${footer}</td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}

const section = (inner: string, padding = "24px 32px 0 32px") => `<tr><td style="padding:${padding};">${inner}</td></tr>`;
const heading = (text: string) =>
  `<h2 style="margin:0 0 10px 0;font-family:${FONT};font-size:15px;font-weight:800;color:#16231B;">${esc(text)}</h2>`;

export function customerEmail(q: QuoteRow) {
  const steps = [
    ["접수 확인", "지금 이 메일이 접수 확인이에요. 신청 내용은 아래에서 다시 볼 수 있어요."],
    ["운영자 첫 연락", "24시간 안에 첫 연락을 드려요. 밤에 신청하셨다면 다음 날 연락드려요."],
    ["업체 제공 동의", "업체에 정보를 전달하기 전에 업체명과 전달할 내용을 먼저 알려드리고 따로 동의를 받아요."],
  ];

  const body = `
    ${section(`
      <h1 style="margin:0;font-family:${FONT};font-size:22px;line-height:1.4;font-weight:800;color:#16231B;letter-spacing:-0.02em;">신청이 접수됐어요</h1>
      <p style="margin:10px 0 0 0;font-family:${FONT};font-size:15px;line-height:1.6;color:#4E5A53;">테두리에 견적을 요청해주셔서 고맙습니다.</p>
    `, "28px 32px 0 32px")}
    ${section(`
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
        <td align="center" style="background-color:#E7DFCF;border-radius:12px;padding:20px 12px;">
          <div style="font-family:${FONT};font-size:13px;color:#46524B;margin-bottom:6px;">접수번호</div>
          <div style="font-family:'SF Mono','Consolas','Menlo',monospace;font-size:26px;line-height:1.2;font-weight:700;letter-spacing:2px;color:#16231B;">${esc(q.receipt_no)}</div>
          <div style="font-family:${FONT};font-size:12px;color:#46524B;margin-top:8px;">문의할 때 이 번호를 알려주세요.</div>
        </td>
      </tr></table>
    `)}
    ${section(`
      ${heading("이제 이렇게 진행돼요")}
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${steps
        .map(
          ([t, d], i) => `
        <tr>
          <td width="36" style="padding:8px 12px 8px 0;vertical-align:top;">
            <div style="width:28px;height:28px;line-height:28px;border-radius:14px;background-color:${i === 0 ? "#1DA049" : "#E7DFCF"};text-align:center;font-family:${FONT};font-size:14px;font-weight:800;color:#16231B;">${i + 1}</div>
          </td>
          <td style="padding:8px 0;vertical-align:top;font-family:${FONT};">
            <div style="font-size:15px;font-weight:700;color:#16231B;">${esc(t)}</div>
            <div style="margin-top:2px;font-size:13px;line-height:1.6;color:#4E5A53;">${esc(d)}</div>
          </td>
        </tr>`,
        )
        .join("")}</table>
    `)}
    ${section(`${heading("신청 내용")}${rowsTable(summaryRows(q))}`)}
    ${section(`
      <p style="margin:0;padding:14px 16px;border-radius:12px;background-color:#f4f1ea;font-family:${FONT};font-size:13px;line-height:1.7;color:#4E5A53;">
        추가 사진이나 수정·취소 요청은 <strong style="color:#16231B;">이 메일에 회신</strong>해주세요.
      </p>
    `, "24px 32px 28px 32px")}
  `;

  return {
    subject: `[테두리] 견적 신청이 접수됐어요 (${q.receipt_no})`,
    html: shell({
      preheader: `접수번호 ${q.receipt_no} · 24시간 안에 첫 연락을 드려요.`,
      body,
      footer: "테두리 · 서울·경기·인천 부분조경 견적<br>이 메일에 회신하시면 테두리 운영자에게 전달돼요.",
    }),
  };
}

export function contactEmail(c: { type: string; receiptNo: string; message: string; email: string; phone: string }) {
  const rows: [string, string][] = [
    ["문의 유형", c.type],
    ["접수번호", c.receiptNo || "-"],
    ["이메일", c.email],
    ["연락처", c.phone || "-"],
  ];
  const body = `
    ${section(`
      <h1 style="margin:0;font-family:${FONT};font-size:20px;line-height:1.4;font-weight:800;color:#16231B;">새 문의 · ${esc(c.type)}</h1>
      <p style="margin:8px 0 0 0;font-family:${FONT};font-size:14px;line-height:1.6;color:#4E5A53;">이 메일에 답장하면 문의한 분(${esc(c.email)})에게 바로 전달돼요.</p>
    `, "28px 32px 0 32px")}
    ${section(rowsTable(rows))}
    ${section(`
      ${heading("문의 내용")}
      <p style="margin:0;padding:14px 16px;border-radius:12px;background-color:#f4f1ea;font-family:${FONT};font-size:14px;line-height:1.7;color:#16231B;white-space:pre-wrap;">${esc(c.message)}</p>
    `, "24px 32px 28px 32px")}
  `;
  return {
    subject: `[테두리 문의] ${c.type}${c.receiptNo ? ` · ${c.receiptNo}` : ""}`,
    html: shell({ preheader: c.message.slice(0, 80), body, footer: "테두리 운영 알림 · 문의하기" }),
  };
}

export function operatorEmail(q: QuoteRow) {
  const created = new Date(q.created_at).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });
  const contact: [string, string][] = [
    ["이메일", q.email],
    ["이름", q.name ?? "-"],
    ["휴대전화", q.phone ?? "-"],
    ["접수 시각", created],
  ];
  const body = `
    ${section(`
      <h1 style="margin:0;font-family:${FONT};font-size:20px;line-height:1.4;font-weight:800;color:#16231B;">새 견적 신청 ${esc(q.receipt_no)}</h1>
      <p style="margin:8px 0 0 0;font-family:${FONT};font-size:14px;line-height:1.6;color:#4E5A53;">${esc(`${q.region} ${q.district}`)} · ${esc(q.works_unknown ? "작업 미정" : q.works.join(", "))} · ${esc(q.scope)}</p>
    `, "28px 32px 0 32px")}
    ${section(`${heading("연락처")}${rowsTable(contact)}`)}
    ${section(`${heading("신청 내용")}${rowsTable(summaryRows(q))}`)}
    ${section(`
      <p style="margin:0;font-family:${FONT};font-size:13px;line-height:1.7;color:#4E5A53;">사진과 전체 내용은 Supabase → Table Editor → quote_requests, 사진은 Storage → quote-photos 에서 확인하세요. 24시간 안에 첫 연락을 약속했어요.</p>
    `, "24px 32px 28px 32px")}
  `;
  return {
    subject: `[테두리 운영] 새 견적 신청 ${q.receipt_no}`,
    html: shell({ preheader: `${q.region} ${q.district} · ${q.scope}`, body, footer: "테두리 운영 알림" }),
  };
}

// ---------- 운영자 알림: 고객이 /my 에서 수정·삭제 ----------

/** 수정 비교·삭제 요약에 쓰는 전체 항목 (연락처 포함) */
function allRows(q: QuoteRow): [string, string][] {
  return [...summaryRows(q), ["이름", q.name ?? "-"], ["휴대전화", q.phone ?? "-"]];
}

const nowKst = () => new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });

/** 바뀐 항목만 [항목, 전, 후] 로 */
export function quoteChanges(before: QuoteRow, after: QuoteRow): [string, string, string][] {
  const a = allRows(after);
  const rows = allRows(before)
    .map(([k, v], i) => [k, v, a[i][1]] as [string, string, string])
    .filter(([k, b, n]) => k !== "현장 사진" && b !== n);

  // 사진은 장수가 같아도 바꿔 끼웠을 수 있어 파일 경로로 비교
  const added = after.photo_paths.filter((p) => !before.photo_paths.includes(p)).length;
  const removed = before.photo_paths.filter((p) => !after.photo_paths.includes(p)).length;
  if (added || removed) {
    const what = [added && `${added}장 추가`, removed && `${removed}장 삭제`].filter(Boolean).join(" · ");
    rows.push(["현장 사진", `${before.photo_paths.length}장`, `${after.photo_paths.length}장 (${what})`]);
  }
  return rows;
}

export function operatorUpdateEmail(before: QuoteRow, after: QuoteRow) {
  const changes = quoteChanges(before, after);
  const table = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${changes
    .map(
      ([k, b, n], i) => `
      <tr><td style="padding:12px 0 4px 0;${i ? "border-top:1px solid #ECE7DC;" : ""}font-family:${FONT};font-size:13px;font-weight:800;color:#16231B;">${esc(k)}</td></tr>
      <tr><td style="padding:0 0 4px 0;font-family:${FONT};font-size:13px;line-height:1.5;color:#8A938D;text-decoration:line-through;white-space:pre-wrap;">${esc(b)}</td></tr>
      <tr><td style="padding:0 0 12px 0;font-family:${FONT};font-size:14px;line-height:1.5;font-weight:600;color:#0E7A33;white-space:pre-wrap;">→ ${esc(n)}</td></tr>`,
    )
    .join("")}</table>`;
  const body = `
    ${section(`
      <h1 style="margin:0;font-family:${FONT};font-size:20px;line-height:1.4;font-weight:800;color:#16231B;">신청 수정 ${esc(after.receipt_no)}</h1>
      <p style="margin:8px 0 0 0;font-family:${FONT};font-size:14px;line-height:1.6;color:#4E5A53;">고객이 내 신청에서 ${changes.length}개 항목을 바꿨어요. · ${esc(nowKst())}</p>
    `, "28px 32px 0 32px")}
    ${section(`${heading("바뀐 내용")}${table}`)}
    ${section(`${heading("연락처")}${rowsTable([["이메일", after.email], ["이름", after.name ?? "-"], ["휴대전화", after.phone ?? "-"]])}`, "24px 32px 28px 32px")}
  `;
  return {
    subject: `[테두리 운영] 신청 수정 ${after.receipt_no}`,
    html: shell({ preheader: changes.map(([k]) => k).join(", "), body, footer: "테두리 운영 알림" }),
  };
}

export function operatorDeleteEmail(q: QuoteRow) {
  const body = `
    ${section(`
      <h1 style="margin:0;font-family:${FONT};font-size:20px;line-height:1.4;font-weight:800;color:#16231B;">신청 취소 ${esc(q.receipt_no)}</h1>
      <p style="margin:8px 0 0 0;font-family:${FONT};font-size:14px;line-height:1.6;color:#4E5A53;">고객이 내 신청에서 신청을 삭제했어요. 신청 내용과 사진은 지워졌어요. · ${esc(nowKst())}</p>
    `, "28px 32px 0 32px")}
    ${section(`${heading("삭제 전 연락처")}${rowsTable([["이메일", q.email], ["이름", q.name ?? "-"], ["휴대전화", q.phone ?? "-"]])}`)}
    ${section(`${heading("삭제 전 신청 내용")}${rowsTable(summaryRows(q))}`, "24px 32px 28px 32px")}
  `;
  return {
    subject: `[테두리 운영] 신청 취소 ${q.receipt_no}`,
    html: shell({ preheader: `${q.region} ${q.district} 신청이 삭제됐어요`, body, footer: "테두리 운영 알림" }),
  };
}

// ---------- 진행 상태 알림 (실측 예정 · 견적 도착) ----------
const SITE = "https://tedoori.com";
const button = (href: string, text: string) =>
  `<a href="${href}" style="display:inline-block;padding:14px 22px;border-radius:12px;background-color:#1DA049;font-family:${FONT};font-size:15px;font-weight:800;color:#ffffff;text-decoration:none;">${esc(text)}</a>`;

export type StatusRow = {
  id: string;
  receipt_no: string;
  email: string;
  name: string | null;
  status: string;
  visit_at: string | null;
  visit_note: string | null;
  build_at?: string | null;
  build_note?: string | null;
  customer_response?: string | null;
};

const visitText = (v: string) =>
  new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", month: "long", day: "numeric", weekday: "short", hour: "numeric", minute: "2-digit" }).format(new Date(v));
const sentAt = () => new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", month: "long", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date());

/**
 * 진행 상태가 바뀔 때 고객에게 보내는 메일. 보낼 필요 없는 변화면 null
 * prev = 바뀌기 전 상태 (되돌린 경우 문구를 다르게)
 */
export function statusEmail(q: StatusRow, prev?: StatusRow | null) {
  const who = q.name ? `${esc(q.name)} 님, ` : "";
  const link = `${SITE}/my/${q.id}`;
  const footer = "테두리 · 서울·경기·인천 부분조경 견적<br>이 메일에 회신하시면 테두리 운영자에게 전달돼요.";
  // Gmail 이 같은 제목 메일을 묶고 같은 내용을 접어 숨기지 않도록, 매번 보낸 시각을 넣음
  const stamp = section(`<p style="margin:0;font-family:${FONT};font-size:12px;color:#8A938D;">${esc(sentAt())} 기준 안내 · 접수번호 ${esc(q.receipt_no)}</p>`, "18px 32px 0 32px");
  const title = (t: string, d: string) =>
    section(
      `<h1 style="margin:0;font-family:${FONT};font-size:22px;line-height:1.4;font-weight:800;color:#16231B;">${esc(t)}</h1>
       <p style="margin:10px 0 0 0;font-family:${FONT};font-size:15px;line-height:1.6;color:#4E5A53;">${who}${esc(d)}</p>`,
      "24px 32px 0 32px",
    );
  const box = (k: string, v: string, sub?: string | null) =>
    section(`
      <div style="background-color:#E7DFCF;border-radius:12px;padding:20px;text-align:center;font-family:${FONT};">
        <div style="font-size:13px;color:#46524B;margin-bottom:6px;">${esc(k)}</div>
        <div style="font-size:22px;font-weight:800;color:#16231B;">${esc(v)}</div>
        ${sub ? `<div style="font-size:13px;line-height:1.6;color:#46524B;margin-top:8px;">${esc(sub)}</div>` : ""}
      </div>`);
  const note = (t: string) =>
    section(`<p style="margin:0;padding:14px 16px;border-radius:12px;background-color:#f4f1ea;font-family:${FONT};font-size:13px;line-height:1.7;color:#4E5A53;">${esc(t)}</p>`, "20px 32px 0 32px");
  const cta = (href: string, text: string) => section(button(href, text), "24px 32px 28px 32px");
  const mail = (subject: string, preheader: string, body: string) => ({ subject: `[테두리] ${subject} (${q.receipt_no})`, html: shell({ preheader, body: stamp + body, footer }) });
  const wasAfterQuote = prev && ["done", "completed", "hold", "needs", "canceled"].includes(prev.status);

  switch (q.status) {
    case "visit": {
      if (!q.visit_at) return null;
      const when = visitText(q.visit_at);
      const changed = prev?.status === "visit" && prev.visit_at && prev.visit_at !== q.visit_at;
      return mail(
        changed ? "실측 방문 일정이 바뀌었어요" : "실측 방문 일정 안내",
        `방문 일시 ${when}`,
        title(changed ? "실측 방문 일정이 바뀌었어요" : "실측 방문 일정이 정해졌어요", "담당자가 방문해 작업할 곳의 크기와 바닥 상태를 확인해요.") +
          box("방문 일시", when, q.visit_note) +
          note("일정을 바꾸고 싶으면 이 메일에 회신하거나 카카오톡 채널 @테두리로 알려주세요.") +
          cta(`${link}#visit`, "방문 일정 보기"),
      );
    }
    case "quoted":
      return mail(
        wasAfterQuote ? "견적서를 다시 확인해주세요" : "견적서가 도착했어요",
        "항목별 견적서를 확인해보세요.",
        title(
          wasAfterQuote ? "견적서를 다시 확인해주세요" : "견적서가 도착했어요",
          wasAfterQuote ? "담당자와 나눈 이야기를 반영해 견적서를 다시 열어두었어요. 내용을 보고 진행 여부를 다시 알려주세요." : "실측한 내용을 바탕으로 자재비·배송비·시공비를 나눈 견적서를 보내드려요.",
        ) +
          note("견적서는 발행일부터 14일 동안 유효해요. 진행 여부는 견적서 아래에서 바로 고를 수 있어요.") +
          cta(`${link}#estimate`, "견적서 확인하기"),
      );
    case "needs":
      return mail(
        "견적을 다시 살피고 있어요",
        "보완할 내용을 확인한 뒤 연락드릴게요.",
        title("견적을 다시 살피고 있어요", "보완이 필요한 부분을 확인하고 있어요. 담당자가 곧 연락드리고, 새 견적을 다시 보내드릴게요.") +
          note("사진을 더 보내주시거나 바뀐 내용이 있으면 이 메일에 회신하거나 신청서 수정에서 고쳐주세요.") +
          cta(link, "내 신청 보기"),
      );
    case "done": {
      if (prev?.status === "done") {
        // 진행 확정 상태에서 시공 날짜를 정하거나 바꾼 경우만
        if (!q.build_at || prev.build_at === q.build_at) return null;
        const when = visitText(q.build_at);
        return mail(
          prev.build_at ? "작업 일정이 바뀌었어요" : "작업 일정이 정해졌어요",
          `작업 일시 ${when}`,
          title(prev.build_at ? "작업 일정이 바뀌었어요" : "작업 일정이 정해졌어요", "견적서 내용대로 작업해요. 당일 담당자가 먼저 연락드려요.") +
            box("작업 일시", when, q.build_note) +
            cta(`${link}#visit`, "일정 보기"),
        );
      }
      return mail(
        "진행이 확정됐어요",
        "함께하게 되어 기뻐요.",
        title("진행이 확정됐어요", "함께하게 되어 기뻐요. 견적서 내용대로 준비하고, 일정이 정해지면 바로 알려드릴게요.") +
          (q.build_at ? box("작업 일시", visitText(q.build_at), q.build_note) : note("작업 날짜는 담당자가 연락드려 함께 정해요.")) +
          cta(`${link}#visit`, "진행 상황 보기"),
      );
    }
    case "completed":
      return mail(
        "새 정원이 완성됐어요",
        "작업 완료 사진과 관리법 안내를 확인해보세요.",
        title("새 정원이 완성됐어요", "함께해주셔서 고마워요. 작업 완료 사진과 관리법 안내를 내 신청에 올려두었어요.") +
          note("새 정원이 마음에 드셨다면 짧은 후기를 남겨주세요. 다음 정원을 더 잘 만드는 데 큰 힘이 돼요.") +
          cta(`${link}#visit`, "완료 보고 보기"),
      );
    case "hold":
      // 고객이 직접 보류를 고른 경우는 화면에서 이미 안내했으니 메일 안 보냄 (담당자가 바꾼 경우만)
      if (q.customer_response === "hold" && prev?.customer_response !== "hold") return null;
      return mail(
        "견적을 보류해두었어요",
        "마음이 정해지면 언제든 알려주세요.",
        title("견적을 보류해두었어요", "말씀해주신 대로 잠시 보류해둘게요. 견적서는 유효기간까지 내 신청에 남아 있어요.") +
          note("다시 진행하고 싶으면 카카오톡 채널 @테두리나 이 메일 회신으로 알려주세요.") +
          cta(`${link}#estimate`, "견적서 보기"),
      );
    case "canceled":
      return mail(
        "신청이 취소됐어요",
        "다시 필요하시면 언제든 새로 신청해주세요.",
        title("신청이 취소됐어요", "이번 신청은 여기서 마무리할게요. 그동안 이야기 나눠주셔서 고마워요.") +
          note("다시 필요하시면 새 견적을 신청하거나 카카오톡 채널 @테두리로 이야기해주세요.") +
          cta(`${SITE}/quote`, "새 견적 신청하기"),
      );
    default:
      return null;
  }
}

/** 고객이 방문 주소를 넣었을 때 운영자에게: 주소 + 연락처 + 신청 내용 전체 */
export function operatorAddressEmail(q: QuoteRow, a: { address: string; detail: string; memo: string }) {
  const body = `
    ${section(`
      <h1 style="margin:0;font-family:${FONT};font-size:20px;line-height:1.4;font-weight:800;color:#16231B;">방문 주소가 들어왔어요 · ${esc(q.receipt_no)}</h1>
      <p style="margin:8px 0 0 0;font-family:${FONT};font-size:14px;line-height:1.6;color:#4E5A53;">주소를 확인하고 실측 일정을 정해주세요.</p>
    `, "28px 32px 0 32px")}
    ${section(`
      <div style="background-color:#E7DFCF;border-radius:12px;padding:18px 20px;font-family:${FONT};">
        <div style="font-size:13px;color:#46524B;margin-bottom:6px;">방문 주소</div>
        <div style="font-size:18px;font-weight:800;line-height:1.5;color:#16231B;">${esc(a.address)}${a.detail ? `<br>${esc(a.detail)}` : ""}</div>
        ${a.memo ? `<div style="font-size:13px;line-height:1.6;color:#46524B;margin-top:8px;">메모 · ${esc(a.memo)}</div>` : ""}
      </div>
    `)}
    ${section(`${heading("연락처")}${rowsTable([["이름", q.name ?? "-"], ["휴대전화", q.phone ?? "-"], ["이메일", q.email]])}`)}
    ${section(`${heading("신청 내용")}${rowsTable(summaryRows(q))}`, "24px 32px 28px 32px")}
  `;
  return {
    subject: `[테두리 운영] 방문 주소 입력 ${q.receipt_no} · ${q.name ?? ""}`,
    html: shell({ preheader: `${a.address} ${a.detail}`, body, footer: "테두리 운영 알림" }),
  };
}

const RESPONSE_LABEL = { go: "진행할게요", adjust: "조정 상담을 원해요", hold: "이번엔 보류할게요" } as const;

/** 고객이 견적서에 응답했을 때 운영자에게 */
export function operatorResponseEmail(q: QuoteRow, choice: keyof typeof RESPONSE_LABEL, message: string) {
  const label = RESPONSE_LABEL[choice];
  const color = choice === "go" ? "#1DA049" : choice === "adjust" ? "#E08A00" : "#6B6355";
  const body = `
    ${section(`
      <h1 style="margin:0;font-family:${FONT};font-size:20px;line-height:1.4;font-weight:800;color:#16231B;">견적 응답 · ${esc(q.receipt_no)}</h1>
      <p style="margin:12px 0 0 0;display:inline-block;padding:8px 14px;border-radius:999px;background-color:${color};font-family:${FONT};font-size:15px;font-weight:800;color:#ffffff;">${esc(label)}</p>
      ${message ? `<p style="margin:14px 0 0 0;font-family:${FONT};font-size:14px;line-height:1.7;color:#16231B;">고객 메모 · ${esc(message)}</p>` : ""}
    `, "28px 32px 0 32px")}
    ${section(`${heading("연락처")}${rowsTable([["이름", q.name ?? "-"], ["휴대전화", q.phone ?? "-"], ["이메일", q.email]])}`)}
    ${section(`${heading("신청 내용")}${rowsTable(summaryRows(q))}`, "24px 32px 28px 32px")}
  `;
  return {
    subject: `[테두리 운영] 견적 응답 ${q.receipt_no} · ${label}`,
    html: shell({ preheader: `${q.name ?? ""} · ${label}`, body, footer: "테두리 운영 알림" }),
  };
}

/** 고객이 시공 후기를 남겼을 때 운영자에게 */
export function operatorReviewEmail(q: QuoteRow, rating: number, text: string, allowPublic: boolean) {
  const stars = "★★★★★".slice(0, rating) + "☆☆☆☆☆".slice(0, 5 - rating);
  const body = `
    ${section(`
      <h1 style="margin:0;font-family:${FONT};font-size:20px;line-height:1.4;font-weight:800;color:#16231B;">새 시공 후기 · ${esc(q.receipt_no)}</h1>
      <p style="margin:10px 0 0 0;font-family:${FONT};font-size:22px;color:#E0A100;letter-spacing:2px;">${stars}</p>
      <p style="margin:12px 0 0 0;padding:14px 16px;border-radius:12px;background-color:#f4f1ea;font-family:${FONT};font-size:15px;line-height:1.7;color:#16231B;">${esc(text)}</p>
      <p style="margin:10px 0 0 0;font-family:${FONT};font-size:13px;color:#4E5A53;">사이트 공개 동의: <strong>${allowPublic ? "동의함" : "동의 안 함"}</strong>${allowPublic ? " · 공개하려면 Supabase quote_reviews 에서 approved 를 true 로 바꿔주세요." : ""}</p>
    `, "28px 32px 0 32px")}
    ${section(`${heading("신청 내용")}${rowsTable([["이름", q.name ?? "-"], ...summaryRows(q)])}`, "24px 32px 28px 32px")}
  `;
  return {
    subject: `[테두리 운영] 새 시공 후기 ${q.receipt_no} · ${stars}`,
    html: shell({ preheader: text.slice(0, 60), body, footer: "테두리 운영 알림" }),
  };
}
