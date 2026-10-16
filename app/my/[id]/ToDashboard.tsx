"use client";

import { useEffect } from "react";

/** /my/{id}#visit → /my?id={id}#visit */
export function ToDashboard({ id }: { id: string }) {
  useEffect(() => {
    window.location.replace(`/my?id=${encodeURIComponent(id)}${window.location.hash}`);
  }, [id]);
  return <p className="my-loading" role="status">내 신청으로 이동하는 중이에요…</p>;
}
