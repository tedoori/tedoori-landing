import Link from "next/link";

const KAKAO_URL = "https://pf.kakao.com/_HeKBX";
const CONTACT_EMAIL = "teduri.official@gmail.com";
const INSTAGRAM_URL = "https://www.instagram.com/tedoori_official/";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container site-footer__inner">
        <div className="site-footer__top">
          <div className="site-footer__intro">
            <p className="site-footer__brand">
              <img src="/figma/logo-mark.svg" width={187} height={63} alt="" />
              테두리
            </p>
            <p className="site-footer__desc">서울·경기·인천 단독·전원주택
              <br />
              필요한 곳부터 선택하는 부분조경.</p>
          </div>

          <nav className="site-footer__cols" aria-label="바닥글 메뉴">
            <div>
              <p className="site-footer__title">서비스</p>
              <ul>
                <li>
                  <Link href="/service">서비스 소개</Link>
                </li>
                <li>
                  <Link href="/guide">이용 안내</Link>
                </li>
                <li>
                  <Link href="/quote">무료 견적 신청</Link>
                </li>
                <li>
                  <Link href="/blog">조경 블로그</Link>
                </li>
              </ul>
            </div>
            <div>
              <p className="site-footer__title">고객 지원</p>
              <ul>
                <li>
                  <Link href="/contact">문의하기</Link>
                </li>
                <li>
                  <Link href="/terms">이용약관</Link>
                </li>
                <li>
                  <Link href="/privacy">개인정보 처리방침</Link>
                </li>
              </ul>
            </div>
          </nav>

          {/* 카카오톡 채널 */}
          <a href={KAKAO_URL} target="_blank" rel="noopener noreferrer" className="site-footer__kakao">
            <span className="site-footer__kakao-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 4C6.9 4 3 7.2 3 11.1c0 2.5 1.6 4.6 4.1 5.9l-.9 3.3c-.1.3.3.6.6.4l3.9-2.6c.4 0 .9.1 1.3.1 5.1 0 9-3.2 9-7.1S17.1 4 12 4Z" />
              </svg>
            </span>
            <span>
              <strong>카카오톡 채널 @테두리로 문의하기</strong>
              <span>궁금한 점을 바로 물어보세요.</span>
            </span>
            <span className="site-footer__arrow" aria-hidden="true">
              →
            </span>
          </a>
          <div className="site-footer__channels" aria-label="테두리 채널">
            <a href={`mailto:${CONTACT_EMAIL}`}>이메일 <span>{CONTACT_EMAIL}</span></a>
            <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">인스타그램 <span>@tedoori_official</span></a>
          </div>
        </div>

        <div className="site-footer__bottom">
          <p>사업자 정보</p>
          <p>© 2026 테두리</p>
        </div>
      </div>
    </footer>
  );
}
