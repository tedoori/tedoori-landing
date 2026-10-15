import Link from "next/link";

// floating: 홈에서만 쓰는 떠 있는 둥근 헤더 (스크롤 동작은 HomeMotion 이 붙임)
export function SiteHeader({ floating = false }: { floating?: boolean }) {
  return (
    <header className={floating ? "site-header site-header--float" : "site-header"}>
      <div className="site-header__inner">
        <Link href="/" className="brand" aria-label="테두리 홈">
          <img className="brand__mark" src="/figma/logo-mark.svg" width={187} height={63} alt="" />
          <span>테두리</span>
        </Link>

        <nav className="site-nav" aria-label="주요 메뉴">
          <Link href="/service">서비스 소개</Link>
          <Link href="/guide">이용 안내</Link>
        </nav>

        <Link href="/quote" className="header-cta">
          무료 견적 신청
        </Link>
        <Link href="/menu" className="icon-link icon-link--menu" aria-label="전체 메뉴">
          <img src="/figma/icon-menu.svg" width={24} height={24} alt="" />
        </Link>
      </div>
    </header>
  );
}
