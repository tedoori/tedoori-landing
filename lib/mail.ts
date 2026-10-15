// Resend 로 메일 보내기 (서버 전용). 설정이 없거나 실패하면 false — 메일 때문에 접수·수정·삭제가 실패하지 않게 호출하는 쪽에서 결과만 확인

export const isMailConfigured = () => Boolean(process.env.RESEND_API_KEY && process.env.MAIL_FROM);

export async function sendMail(to: string, subject: string, html: string) {
  if (!isMailConfigured()) return false;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.MAIL_FROM,
        to,
        subject,
        html,
        // 고객 회신을 실제로 받을 메일함 (tedoori.com 에는 받는 메일함이 없음)
        ...(process.env.MAIL_REPLY_TO ? { reply_to: process.env.MAIL_REPLY_TO } : {}),
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** 운영자 알림 (OPERATOR_EMAIL 이 없으면 보내지 않음) */
export async function notifyOperator(mail: { subject: string; html: string }) {
  const to = process.env.OPERATOR_EMAIL;
  return to ? sendMail(to, mail.subject, mail.html) : false;
}
