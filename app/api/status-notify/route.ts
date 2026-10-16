import { timingSafeEqual } from "node:crypto";
import { isEstimateReminder, statusEmail, type StatusRow } from "@/lib/emails";
import { isMailConfigured, sendMail } from "@/lib/mail";

// Supabase Database Webhook (quote_requests UPDATE) 이 부르는 주소.
// 상태가 실측 예정(visit)·견적 도착(quoted)으로 '바뀐 순간'에만 고객에게 메일을 보냄
// 헤더 x-webhook-secret 이 STATUS_WEBHOOK_SECRET 과 같아야 함

const same = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));

export async function POST(req: Request) {
  const secret = process.env.STATUS_WEBHOOK_SECRET;
  const given = req.headers.get("x-webhook-secret") ?? "";
  if (!secret || !same(given, secret)) return Response.json({ ok: false }, { status: 401 });

  const payload = (await req.json().catch(() => null)) as {
    type?: string;
    table?: string;
    record?: StatusRow;
    old_record?: StatusRow | null;
  } | null;
  const rec = payload?.record;
  if (payload?.type !== "UPDATE" || payload.table !== "quote_requests" || !rec) return Response.json({ ok: true, skipped: "not-update" });

  const old = payload.old_record;
  // 보낼 때: 상태가 바뀜 / 실측 예정 중 방문일이 바뀜 / 진행 확정 중 작업일이 바뀜
  const changed =
    old?.status !== rec.status ||
    (rec.status === "visit" && old?.visit_at !== rec.visit_at) ||
    (rec.status === "done" && old?.build_at !== rec.build_at) ||
    // 견적 미응답 안내: 예약 작업이 estimate_reminded_at 을 막 적었을 때
    isEstimateReminder(rec, old);
  if (!changed) return Response.json({ ok: true, skipped: "no-change" });

  const mail = statusEmail(rec, old);
  if (!mail) return Response.json({ ok: true, skipped: "status" });
  if (!isMailConfigured()) return Response.json({ ok: true, mailed: false, reason: "mail-not-configured" });

  const mailed = await sendMail(rec.email, mail.subject, mail.html);
  return Response.json({ ok: true, mailed });
}
