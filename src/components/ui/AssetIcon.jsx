import { useState } from 'react';

const firstToken = (value = '') => String(value).trim().charAt(0).toUpperCase() || '-';

export default function AssetIcon({ label, symbol, image, className = '' }) {
  const [failed, setFailed] = useState(false);
  const text = image && !String(image).startsWith('http') ? image : firstToken(symbol || label);

  if (image && String(image).startsWith('http') && !failed) {
    return (
      <span className={`grid size-10 shrink-0 place-items-center overflow-hidden rounded-2xl bg-[var(--color-primary-soft)] ${className}`}>
        <img src={image} alt={`${label} logo`} className="size-full object-cover" onError={() => setFailed(true)} />
      </span>
    );
  }

  return (
    <span className={`grid size-10 shrink-0 place-items-center rounded-2xl bg-[var(--color-primary-soft)] text-xs font-black text-[var(--color-primary)] ${className}`}>
      {text}
    </span>
  );
}
