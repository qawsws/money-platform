import { Link } from 'react-router-dom';

const groups = [
  {
    title: '\uC11C\uBE44\uC2A4',
    links: [
      { label: '\uC2DC\uC7A5', to: '/market' },
      { label: '\uCF54\uC778', to: '/crypto' },
      { label: '\uBBF8\uAD6D\uC8FC\uC2DD', to: '/stocks/us' },
      { label: '\uD55C\uAD6D\uC8FC\uC2DD', to: '/stocks/kr' },
    ],
  },
  {
    title: '\uCF58\uD150\uCE20',
    links: [
      { label: '\uB274\uC2A4', to: '/news' },
      { label: '\uCEE4\uBBA4\uB2C8\uD2F0', to: '/community' },
    ],
  },
  {
    title: '\uC0AC\uC6A9\uC790',
    links: [
      { label: '\uB9C8\uC774\uD398\uC774\uC9C0', to: '/mypage' },
      { label: '\uD3EC\uD2B8\uD3F4\uB9AC\uC624', to: '/portfolio' },
      { label: '\uC990\uACA8\uCC3E\uAE30', to: '/favorites' },
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
              {'\uC2DC\uC7A5 \uC815\uBCF4, \uB274\uC2A4, \uCEE4\uBBA4\uB2C8\uD2F0\uB97C \uD55C\uACF3\uC5D0\uC11C \uD655\uC778\uD560 \uC218 \uC788\uB294 \uD22C\uC790 \uC815\uBCF4 \uD50C\uB7AB\uD3FC\uC785\uB2C8\uB2E4.'}
            </p>
            <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">
              {'\uD559\uC2B5\uACFC \uC815\uBCF4 \uD655\uC778\uC744 \uC704\uD55C \uC11C\uBE44\uC2A4\uB85C, \uD22C\uC790 \uD310\uB2E8\uC740 \uC774\uC6A9\uC790 \uBCF8\uC778\uC758 \uCC45\uC784\uC785\uB2C8\uB2E4.'}
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
          <p>{'\u00A9 2026 MoneyPlatform. All rights reserved.'}</p>
          <p>{'\uBCF8 \uC11C\uBE44\uC2A4\uC758 \uC815\uBCF4\uB294 \uD22C\uC790 \uCC38\uACE0\uC6A9\uC774\uBA70 \uD22C\uC790 \uACB0\uACFC\uC5D0 \uB300\uD55C \uCC45\uC784\uC740 \uC774\uC6A9\uC790 \uBCF8\uC778\uC5D0\uAC8C \uC788\uC2B5\uB2C8\uB2E4.'}</p>
        </div>
      </div>
    </footer>
  );
}
