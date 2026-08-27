import Card from './ui/Card';

const numberFormat = new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 2 });

function parseChange(change) {
  const parsed = Number(String(change || '').replace(/[^\d.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatPercent(value) {
  return (value > 0 ? '+' : '') + numberFormat.format(value) + '%';
}

function decorate(items) {
  return items.map((item) => ({ ...item, changeValue: parseChange(item.change) }));
}

function SummaryCard({ label, value, caption, tone = 'neutral' }) {
  const toneClass = tone === 'up' ? 'text-red-500' : tone === 'down' ? 'text-blue-600' : 'text-[var(--color-text-primary)]';
  return (
    <Card hover={false} className="p-5">
      <p className="text-sm font-extrabold text-[var(--color-text-secondary)]">{label}</p>
      <p className={'mt-3 text-3xl font-black tracking-tight ' + toneClass}>{value}</p>
      <p className="mt-2 text-sm font-semibold text-[var(--color-text-muted)]">{caption}</p>
    </Card>
  );
}

function MiniRanking({ title, items, tone }) {
  return (
    <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-white p-4">
      <h3 className="text-sm font-black text-[var(--color-text-primary)]">{title}</h3>
      <div className="mt-3 space-y-2">
        {items.map((item, index) => (
          <div key={item.id} className="flex items-center justify-between gap-3 rounded-2xl bg-[var(--color-surface-muted)] px-3 py-2.5">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white text-xs font-black text-[var(--color-text-secondary)]">{index + 1}</span>
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-[var(--color-text-primary)]">{item.name}</p>
                <p className="truncate text-xs font-bold text-[var(--color-text-muted)]">{item.symbol || item.icon}</p>
              </div>
            </div>
            <p className={(tone === 'up' ? 'text-red-500' : 'text-blue-600') + ' shrink-0 text-sm font-black'}>{formatPercent(item.changeValue)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Distribution({ items, label }) {
  const rising = items.filter((item) => item.changeValue >= 0).length;
  const falling = items.length - rising;
  const risingWidth = items.length ? Math.round((rising / items.length) * 100) : 0;
  const fallingWidth = 100 - risingWidth;
  const mood = rising >= falling ? '상승 우세' : '하락 우세';

  return (
    <Card hover={false} className="p-5">
      <p className="text-sm font-extrabold text-[var(--color-text-secondary)]">등락 분포</p>
      <h2 className="mt-2 text-2xl font-black text-[var(--color-text-primary)]">{label} 분위기</h2>
      <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">표시된 종목을 기준으로 상승과 하락 비중을 비교합니다.</p>
      <div className="mt-5 h-4 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full bg-red-500" style={{ width: String(risingWidth) + '%' }} />
      </div>
      <div className="mt-3 flex items-center justify-between text-sm font-black">
        <span className="text-red-500">상승 {rising}개 · {risingWidth}%</span>
        <span className="text-blue-600">하락 {falling}개 · {fallingWidth}%</span>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-[var(--color-surface-muted)] px-4 py-3">
          <p className="text-xs font-extrabold text-[var(--color-text-muted)]">현재 분위기</p>
          <p className="mt-1 text-sm font-black text-[var(--color-text-primary)]">{mood}</p>
        </div>
        <div className="rounded-2xl bg-[var(--color-surface-muted)] px-4 py-3">
          <p className="text-xs font-extrabold text-[var(--color-text-muted)]">비교 기준</p>
          <p className="mt-1 text-sm font-black text-[var(--color-text-primary)]">표시 종목</p>
        </div>
      </div>
    </Card>
  );
}
function WatchList({ items, label }) {
  const targets = [...items].sort((a, b) => Math.abs(b.changeValue) - Math.abs(a.changeValue)).slice(0, 5);
  const biggest = targets[0];

  return (
    <Card hover={false} className="flex h-full flex-col p-5">
      <p className="text-sm font-extrabold text-[var(--color-text-secondary)]">오늘 체크</p>
      <h2 className="mt-2 text-2xl font-black text-[var(--color-text-primary)]">변동이 큰 {label}</h2>
      <div className="mt-4 divide-y divide-[var(--color-border)]">
        {targets.map((item) => (
          <div key={item.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
            <div className="min-w-0">
              <p className="truncate text-sm font-black text-[var(--color-text-primary)]">{item.name}</p>
              <p className="truncate text-xs font-bold text-[var(--color-text-muted)]">{item.symbol || item.icon}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-black text-[var(--color-text-primary)]">{item.price || item.value}</p>
              <p className={(item.changeValue >= 0 ? 'text-red-500' : 'text-blue-600') + ' text-xs font-black'}>{formatPercent(item.changeValue)}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-auto pt-5">
        <div className="rounded-3xl bg-[var(--color-surface-muted)] p-4">
          <p className="text-sm font-black text-[var(--color-text-primary)]">확인 포인트</p>
          <p className="mt-2 text-sm font-semibold leading-6 text-[var(--color-text-secondary)]">
            {biggest ? biggest.name + '처럼 ' : ''}등락률이 큰 종목은 단기 뉴스나 수급 영향이 반영됐을 가능성이 있어요.
          </p>
        </div>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-2xl bg-[var(--color-surface-muted)] px-4 py-3">
            <p className="text-xs font-extrabold text-[var(--color-text-muted)]">정렬 기준</p>
            <p className="mt-1 text-sm font-black text-[var(--color-text-primary)]">등락률 큰 순</p>
          </div>
          <div className="rounded-2xl bg-[var(--color-surface-muted)] px-4 py-3">
            <p className="text-xs font-extrabold text-[var(--color-text-muted)]">활용법</p>
            <p className="mt-1 text-sm font-black text-[var(--color-text-primary)]">관심 종목 선별</p>
          </div>
        </div>
      </div>
    </Card>
  );
}
function InsightNote({ label }) {
  const tips = [
    { title: '먼저 볼 기준', text: label + '은 가격 단위가 서로 달라 가격보다 등락률로 비교하는 것이 편합니다.' },
    { title: '확인 순서', text: '요약 카드로 전체 분위기를 보고, 랭킹에서 상승과 하락 종목을 나눠 확인하세요.' },
    { title: '주의할 점', text: '단기 변동이 큰 종목은 뉴스, 실적, 수급 이슈를 함께 확인하는 것이 좋습니다.' },
  ];

  return (
    <Card hover={false} className="p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-extrabold text-[var(--color-text-secondary)]">오늘 시장 꿀팁</p>
          <h2 className="mt-2 text-2xl font-black text-[var(--color-text-primary)]">등락률로 먼저 훑어보세요</h2>
        </div>
        <span className="w-fit rounded-full bg-[var(--color-primary-soft)] px-3 py-1 text-xs font-black text-[var(--color-primary)]">참고</span>
      </div>
      <div className="mt-4 divide-y divide-[var(--color-border)]">
        {tips.map((tip) => (
          <div key={tip.title} className="grid gap-1 py-3 first:pt-0 last:pb-0 sm:grid-cols-[120px_1fr] sm:gap-4">
            <p className="text-sm font-black text-[var(--color-text-primary)]">{tip.title}</p>
            <p className="text-sm font-semibold leading-6 text-[var(--color-text-secondary)]">{tip.text}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
export default function AssetPageInsights({ items, label, basis = '전일 또는 24시간 기준' }) {
  const rows = decorate(items || []);
  if (rows.length < 2) return null;

  const rising = rows.filter((item) => item.changeValue >= 0).length;
  const falling = rows.length - rising;
  const strongest = [...rows].sort((a, b) => b.changeValue - a.changeValue)[0];
  const averageValue = rows.reduce((sum, item) => sum + item.changeValue, 0) / rows.length;
  const gainers = [...rows].sort((a, b) => b.changeValue - a.changeValue).slice(0, 5);
  const losers = [...rows].sort((a, b) => a.changeValue - b.changeValue).slice(0, 5);

  return (
    <div className="mt-5 space-y-5">
      <Card hover={false} className="p-5">
        <div className="mb-4 flex flex-col gap-2 border-b border-[var(--color-border)] pb-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-black text-[var(--color-primary)]">총 {rows.length}개</p>
          <p className="text-sm font-semibold text-[var(--color-text-muted)]">현재 데이터 기준</p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard label="확인 종목" value={String(rows.length) + '개'} caption={'현재 표시 중인 ' + label} />
          <SummaryCard label="상승 / 하락" value={String(rising) + ' / ' + String(falling)} caption={basis} tone={rising >= falling ? 'up' : 'down'} />
          <SummaryCard label="가장 강한 종목" value={strongest?.symbol || strongest?.icon || '-'} caption={strongest ? strongest.name + ' ' + formatPercent(strongest.changeValue) : '-'} tone="up" />
          <SummaryCard label="평균 등락률" value={formatPercent(averageValue)} caption="표시 종목 평균" tone={averageValue >= 0 ? 'up' : 'down'} />
        </div>
      </Card>
      <Card hover={false} className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-extrabold text-[var(--color-text-secondary)]">등락 랭킹</p>
            <h2 className="mt-2 text-2xl font-black text-[var(--color-text-primary)]">상승과 하락을 한눈에!</h2>
          </div>
          <span className="rounded-full bg-[var(--color-primary-soft)] px-3 py-1 text-xs font-black text-[var(--color-primary)]">{basis}</span>
        </div>
        <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <MiniRanking title="상승 랭킹" items={gainers} tone="up" />
          <MiniRanking title="하락 랭킹" items={losers} tone="down" />
        </div>
      </Card>
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="space-y-5">
          <Distribution items={rows} label={label} />
          <InsightNote label={label} />
        </div>
        <WatchList items={rows} label={label} />
      </div>
    </div>
  );
}











