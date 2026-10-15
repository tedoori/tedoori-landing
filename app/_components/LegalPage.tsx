import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";

export function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main id="main" className="section">
        <article className="container legal">
          <h1 className="title-l">{title}</h1>
          <p className="legal__draft" role="note">
            초안입니다. 대괄호 [ ] 안의 내용은 운영자가 채우고, 공개 전에 법률 검토를 받아야 해요.
          </p>
          {children}
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
