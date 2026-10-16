import type { Metadata } from "next";
import { AdminApp } from "./AdminApp";
import "../my/my.css";
import "./admin.css";

// 운영자 전용. 검색에 노출하지 않음
export const metadata: Metadata = {
  title: "관리자 · 테두리",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return (
    <main id="main" className="adm">
      <AdminApp />
    </main>
  );
}
