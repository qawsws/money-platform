const Card = ({ as: Component = 'div', className = '', hover = true, children, ...props }) => {
  const hoverClass = hover ? 'hover:-translate-y-0.5 hover:border-[var(--color-border-strong)] hover:shadow-[var(--shadow-card-hover)]' : '';

  return (
    <Component
      className={[
        'rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)] transition-all duration-200 ease-out',
        hoverClass,
        className,
      ].filter(Boolean).join(' ')}
      {...props}
    >
      {children}
    </Component>
  );
};

export default Card;
