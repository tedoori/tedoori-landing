import crypto from "node:crypto";

// 미래조경 견적서 앱(/jooyong) 저장 API
// 기존 사이트와 겹치지 않게 JOOYONG_ 로 시작하는 환경변수만 사용
//   JOOYONG_PASSWORD     로그인 비밀번호
//   JOOYONG_AUTH_SECRET  토큰 서명용 긴 문자열
//   JOOYONG_KV_REST_API_URL / JOOYONG_KV_REST_API_TOKEN  (Upstash Redis 연결 시 접두어 JOOYONG 지정)

export const dynamic = "force-dynamic";

const KV_KEYS = ["company", "companies", "lib", "prices", "style"];
const P = "jooyong:";
const TOKEN_DAYS = 180;

async function redis(...cmd: (string | number)[]) {
  const url = process.env.JOOYONG_KV_REST_API_URL, token = process.env.JOOYONG_KV_REST_API_TOKEN;
  if (!url || !token) throw new Error("저장소(JOOYONG_KV_REST_API_URL)가 설정되지 않았어요");
  const r = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(cmd),
    cache: "no-store",
  });
  const j = await r.json();
  if (j.error) throw new Error(j.error);
  return j.result;
}

const secret = () => process.env.JOOYONG_AUTH_SECRET || process.env.JOOYONG_PASSWORD || "";
const sign = (exp: string | number) => crypto.createHmac("sha256", secret()).update("jooyong:" + exp).digest("hex");
const makeToken = () => { const exp = Date.now() + TOKEN_DAYS * 864e5; return exp + "." + sign(exp); };
function validToken(t: string) {
  const [exp, sig] = t.split(".");
  if (!exp || !sig || Number(exp) < Date.now()) return false;
  const a = Buffer.from(sig), b = Buffer.from(sign(exp));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
function samePassword(p: unknown) {
  const a = crypto.createHash("sha256").update(String(p ?? "")).digest();
  const b = crypto.createHash("sha256").update(process.env.JOOYONG_PASSWORD || "").digest();
  return crypto.timingSafeEqual(a, b);
}

const json = (data: unknown, status = 200) =>
  Response.json(data, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(req: Request) {
  try {
    if (!process.env.JOOYONG_PASSWORD) return json({ error: "서버에 JOOYONG_PASSWORD가 설정되지 않았어요" }, 500);
    const b = await req.json().catch(() => ({}));

    if (b.action === "login") {
      if (!samePassword(b.password)) {
        await new Promise(r => setTimeout(r, 800));
        return json({ error: "비밀번호가 맞지 않아요" }, 401);
      }
      return json({ token: makeToken() });
    }
    const auth = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
    if (!validToken(auth)) return json({ error: "로그인이 필요해요" }, 401);

    switch (b.action) {
      case "all": {
        const vals: (string | null)[] = await redis("MGET", ...KV_KEYS.map(k => P + k));
        const kv: Record<string, unknown> = {};
        KV_KEYS.forEach((k, i) => { if (vals[i]) kv[k] = JSON.parse(vals[i] as string); });
        const h: string[] = (await redis("HGETALL", P + "quotes")) || [];
        const quotes = [];
        for (let i = 1; i < h.length; i += 2) quotes.push(JSON.parse(h[i]));
        return json({ kv, quotes });
      }
      case "putQuote":
        if (!b.quote?.id) return json({ error: "잘못된 견적서" }, 400);
        await redis("HSET", P + "quotes", String(b.quote.id), JSON.stringify(b.quote));
        return json({ ok: true });
      case "delQuote":
        await redis("HDEL", P + "quotes", String(b.id));
        return json({ ok: true });
      case "setKV":
        if (!KV_KEYS.includes(b.key)) return json({ error: "잘못된 항목" }, 400);
        await redis("SET", P + b.key, JSON.stringify(b.value));
        return json({ ok: true });
      default:
        return json({ error: "알 수 없는 요청" }, 400);
    }
  } catch (e) {
    return json({ error: "서버 오류: " + (e as Error).message }, 500);
  }
}
