import { Link } from 'react-router-dom';

const groups = [
  {
    title: '서비스',
    links: [
      { label: '시장', to: '/market' },
      { label: '코인', to: '/crypto' },
      { label: '미국주식', to: '/stocks/us' },
      { label: '한국주식', to: '/stocks/kr' },
    ],
  },
  {
    title: '콘텐츠',
    links: [
      { label: '뉴스', to: '/news' },
      { label: '커뮤니티', to: '/community' },
    ],
  },
  {
    title: '사용자',
    links: [
      { label: '마이페이지', to: '/mypage' },
      { label: '포트폴리오', to: '/portfolio' },
      { label: '즐겨찾기', to: '/favorites' },
    ],
  },
];

function FooterLogo() {
  return (
    <Link to="/" className="inline-flex items-center gap-2.5">
      <span aria-hidden="true" className="grid size-9 place-items-center rounded-2xl bg-[var(--color-primary)] text-sm font-black text-white shadow-sm">
        M
      </span>
      <span className="text-lg font-extrabold tracking-tight text-[var(--color-text-primary)]">
        Money<span className="text-[var(--color-primary)]">Platform</span>
      </span>
    </Link>
  );
}

export default function Footer() {
  return (
    <footer className="mt-12 border-t border-[var(--color-border)] bg-white">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
          <div className="max-w-md">
            <FooterLogo />
            <p className="mt-4 text-sm leading-6 text-[var(--color-text-secondary)]">
              {'시장 정보, 뉴스, 커뮤니티를 한곳에서 확인할 수 있는 투자 정보 플랫폼입니다.'}
            </p>
            <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">
              {'학습과 정보 확인을 위한 서비스로, 투자 판단은 이용자 본인의 책임입니다.'}
            </p>
          </div>

          <nav aria-label="Footer navigation" className="grid grid-cols-2 gap-6 sm:grid-cols-3">
            {groups.map((group) => (
              <div key={group.title}>
                <h2 className="text-sm font-extrabold text-[var(--color-text-primary)]">{group.title}</h2>
                <ul className="mt-3 space-y-1">
                  {group.links.map((link) => (
                    <li key={link.to}>
                      <Link to={link.to} className="inline-flex min-h-9 items-center text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] hover:underline">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-[var(--color-border)] pt-5 text-xs leading-5 text-[var(--color-text-secondary)] md:flex-row md:items-center md:justify-between">
          <p>{'© 2026 MoneyPlatform. All rights reserved.'}</p>
          <p>{'본 서비스의 정보는 투자 참고용이며 투자 결과에 대한 책임은 이용자 본인에게 있습니다.'}</p>
        </div>
      </div>
    </footer>
  );
}
