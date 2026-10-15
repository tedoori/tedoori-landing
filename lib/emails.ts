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

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

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
  return allRows(before)
    .map(([k, v], i) => [k, v, a[i][1]] as [string, string, string])
    .filter(([, b, n]) => b !== n);
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
