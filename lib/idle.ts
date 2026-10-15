"use client";

import { useEffect } from "react";
import { getSupabase } from "./supabase";

// 내 신청: 1시간 동안 쓰지 않으면 자동 로그아웃 (공용·가족 기기에서 개인정보가 남지 않게)
// 마지막 사용 시각을 브라우저에 저장해, 창을 닫았다 다시 열어도 시간이 이어짐

export const IDLE_LIMIT_MS = 60 * 60 * 1000;
const KEY = "teduri-last-active";

function lastActive() {
  try {
    return Number(localStorage.getItem(KEY)) || 0;
  } catch {
    return 0;
  }
}

export function touchActivity() {
  try {
    localStorage.setItem(KEY, String(Date.now()));
  } catch {}
}

/** 1시간이 지났으면 로그아웃하고 true. 기록이 없으면(처음 인증 직후 등) 지금부터 셈 */
export async function signOutIfIdle() {
  // 로그인하지 않은 상태라면 할 일 없음 (이메일 입력 화면에 오래 머문 경우 등)
  const supabase = getSupabase();
  const { data } = (await supabase?.auth.getSession()) ?? { data: { session: null } };
  if (!data.session) return false;
  const last = lastActive();
  if (!last) {
    touchActivity();
    return false;
  }
  if (Date.now() - last < IDLE_LIMIT_MS) return false;
  await supabase?.auth.signOut();
  try {
    localStorage.removeItem(KEY);
  } catch {}
  return true;
}

/** 화면을 쓰는 동안 사용 시각을 갱신하고, 1분마다 확인해 시간이 지나면 onExpire 호출 */
export function useIdleSignOut(onExpire: () => void) {
  useEffect(() => {
    let last = 0;
    const onUse = () => {
      // 너무 자주 쓰지 않도록 30초에 한 번만 기록
      const now = Date.now();
      if (now - last > 30_000) {
        last = now;
        touchActivity();
      }
    };
    const check = async () => {
      if (await signOutIfIdle()) onExpire();
    };
    const events = ["pointerdown", "keydown", "scroll", "touchstart"] as const;
    events.forEach((e) => window.addEventListener(e, onUse, { passive: true }));
    // 다른 앱에 있다가 돌아왔을 때도 바로 확인
    const onVisible = () => document.visibilityState === "visible" && void check();
    document.addEventListener("visibilitychange", onVisible);
    const timer = window.setInterval(() => void check(), 60_000);
    return () => {
      events.forEach((e) => window.removeEventListener(e, onUse));
      document.removeEventListener("visibilitychange", onVisible);
      window.clearInterval(timer);
    };
  }, [onExpire]);
}
