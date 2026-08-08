import AssetIcon from './AssetIcon';
import Card from './Card';
import PriceChangeBadge from './PriceChangeBadge';

export default function QuoteCard({
  title,
  subtitle,
  value,
  change,
  isPositive,
  badge,
  description,
  icon,
  onOpen,
  favoriteAction,
}) {
  const clickable = Boolean(onOpen);

  return (
    <Card as="article" className={`relative min-h-[190px] overflow-hidden p-4 sm:p-5 ${clickable ? 'hover:border-[var(--color-border-strong)]' : ''}`}>
      {clickable && (
        <button
          type="button"
          onClick={onOpen}
          aria-label={`${title} \uC0C1\uC138 \uBCF4\uAE30`}
          className="absolute inset-0 z-0 rounded-[var(--radius-card)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2"
        />
      )}

      <div className="relative z-10 flex h-full flex-col pointer-events-none">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <AssetIcon label={title} symbol={subtitle} image={icon} />
            <div className="min-w-0">
              <h3 className="truncate text-base font-extrabold text-[var(--color-text-primary)]">{title || '-'}</h3>
              <p className="mt-0.5 truncate text-sm font-medium text-[var(--color-text-secondary)]">{subtitle || '-'}</p>
            </div>
          </div>
          {badge && <span className="shrink-0 rounded-full bg-[var(--color-surface-muted)] px-2.5 py-1 text-xs font-bold text-[var(--color-text-secondary)]">{badge}</span>}
        </div>

        <div className="mt-6">
          <p className="truncate text-2xl font-black tracking-tight text-[var(--color-text-primary)]">{value || '-'}</p>
          <div className="mt-3">
            <PriceChangeBadge change={change} isPositive={isPositive} />
          </div>
        </div>

        <div className="mt-auto flex items-end justify-between gap-3 pt-5">
          <p className="line-clamp-2 min-w-0 text-sm leading-5 text-[var(--color-text-secondary)]">{description || '\uD604\uC7AC \uB370\uC774\uD130 \uAE30\uC900'}</p>
          {favoriteAction && <div className="pointer-events-auto shrink-0">{favoriteAction}</div>}
        </div>
      </div>
    </Card>
  );
}
