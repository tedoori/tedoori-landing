import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";

export function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main id="main" className="section">
        <article className="container legal">
          <h1 className="title-l">{title}</h1>
          {children}
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
